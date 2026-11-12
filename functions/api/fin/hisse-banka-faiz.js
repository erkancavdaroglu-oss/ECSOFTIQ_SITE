// src/hisse-banka-faiz.ts
var BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
function decodeEntities(s) {
  return s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'");
}
function stripTags(s) {
  return decodeEntities(s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
}
function extractCellText(cellHtml) {
  const plain = stripTags(cellHtml);
  if (plain) return plain;
  const altMatch = cellHtml.match(/\balt\s*=\s*["']([^"']+)["']/i);
  if (altMatch && altMatch[1].trim()) return decodeEntities(altMatch[1].trim());
  const titleMatch = cellHtml.match(/\btitle\s*=\s*["']([^"']+)["']/i);
  if (titleMatch && titleMatch[1].trim()) return decodeEntities(titleMatch[1].trim());
  return "";
}
function extractTopLevelTags(html, tagName) {
  const openRe = new RegExp(`<${tagName}(?:\\s[^>]*)?>`, "gi");
  const closeRe = new RegExp(`</${tagName}>`, "gi");
  const positions = [];
  let m;
  while (m = openRe.exec(html)) positions.push({ index: m.index, end: m.index + m[0].length, type: "open" });
  while (m = closeRe.exec(html)) positions.push({ index: m.index, end: m.index + m[0].length, type: "close" });
  positions.sort((a, b) => a.index - b.index);
  const results = [];
  let depth = 0;
  let startIdx = -1;
  for (const p of positions) {
    if (p.type === "open") {
      if (depth === 0) startIdx = p.index;
      depth++;
    } else {
      depth = Math.max(0, depth - 1);
      if (depth === 0 && startIdx >= 0) {
        results.push(html.slice(startIdx, p.end));
        startIdx = -1;
      }
    }
  }
  return results;
}
function stripNestedTables(tableHtml) {
  const openMatch = tableHtml.match(/^<table[^>]*>/i);
  const openLen = openMatch ? openMatch[0].length : 0;
  const closeLen = tableHtml.toLowerCase().endsWith("</table>") ? "</table>".length : 0;
  let inner = tableHtml.slice(openLen, tableHtml.length - closeLen);
  const nested = extractTopLevelTags(inner, "table");
  for (const nt of nested) inner = inner.replace(nt, "");
  return inner;
}
function extractRows(tableHtml) {
  const cleaned = stripNestedTables(tableHtml);
  const re = /<tr[\s\S]*?<\/tr>/gi;
  const rows = [];
  let m;
  while (m = re.exec(cleaned)) rows.push(m[0]);
  return rows;
}
function extractCells(rowHtml) {
  const cells = [];
  const re = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
  let m;
  while (m = re.exec(rowHtml)) cells.push(extractCellText(m[1]));
  return cells;
}
function detectColumnIndex(headerCells, keywords) {
  for (let i = 1; i < headerCells.length; i++) {
    if (keywords.test(headerCells[i])) return i;
  }
  return -1;
}
function rowsToBankRows(trs, headerCells) {
  const faizIdx = detectColumnIndex(headerCells, /faiz|kâr\s*pay/i);
  const anaparaIdx = detectColumnIndex(headerCells, /anapara|tutar/i);
  const vadeIdx = detectColumnIndex(headerCells, /vade/i);
  const out = [];
  for (const tr of trs) {
    if (/<th[\s>]/i.test(tr) && !/<td[\s>]/i.test(tr)) continue;
    const cells = extractCells(tr);
    if (cells.length < 2) continue;
    const banka = cells[0];
    if (!banka || /^bankalar?$/i.test(banka)) continue;
    out.push({
      banka,
      faizAraligi: cells[faizIdx >= 0 ? faizIdx : 1] || "",
      anaparaAraligi: cells[anaparaIdx >= 0 ? anaparaIdx : 2] || "",
      vadeAraligi: cells[vadeIdx >= 0 ? vadeIdx : 3] || ""
    });
  }
  return out;
}
function pickBestTable(html, debugInfo) {
  const tables = extractTopLevelTags(html, "table");
  if (debugInfo) debugInfo.tablesFound = tables.length;
  if (!tables.length) return [];
  const candidates = [];
  let bestBankaIdx = -1;
  let bestBankaRowCount = -1;
  let bestOverallIdx = -1;
  let bestOverallRowCount = -1;
  tables.forEach((table, idx) => {
    const trs = extractRows(table);
    const headerCells = trs.length ? extractCells(trs[0]) : [];
    const rows = rowsToBankRows(trs, headerCells);
    const hasBankaHeader = headerCells.some((c) => c.length <= 20 && /banka/i.test(c));
    if (debugInfo) {
      candidates.push({
        index: idx,
        rawTrCount: trs.length,
        rowCount: rows.length,
        hasBankaHeader,
        headerPreview: headerCells.slice(0, 4).join(" | ").slice(0, 120)
      });
    }
    if (hasBankaHeader && rows.length > bestBankaRowCount) {
      bestBankaRowCount = rows.length;
      bestBankaIdx = idx;
    }
    if (rows.length > bestOverallRowCount) {
      bestOverallRowCount = rows.length;
      bestOverallIdx = idx;
    }
  });
  if (debugInfo) debugInfo.candidates = candidates;
  const chosenIdx = bestBankaIdx >= 0 ? bestBankaIdx : bestOverallIdx;
  if (debugInfo) debugInfo.chosenIndex = chosenIdx;
  if (chosenIdx < 0) return [];
  const chosenTrs = extractRows(tables[chosenIdx]);
  const chosenHeaderCells = chosenTrs.length ? extractCells(chosenTrs[0]) : [];
  const chosenRows = rowsToBankRows(chosenTrs, chosenHeaderCells);
  if (debugInfo) {
    debugInfo.rowCount = chosenRows.length;
    debugInfo.sampleRawRows = chosenTrs.slice(0, 4).map((tr) => extractCells(tr));
  }
  return chosenRows;
}
async function fetchCategory(url, debugLog, key) {
  const info = { url, status: "" };
  debugLog[key] = info;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": BROWSER_UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "tr-TR,tr;q=0.9"
      }
    });
    info.status = res.status;
    if (!res.ok) return [];
    const html = await res.text();
    info.bodyPreview = html.slice(0, 200);
    return pickBestTable(html, info);
  } catch (e) {
    info.status = "hata: " + String(e);
    return [];
  }
}
async function hisse_banka_faiz_default(req) {
  const url = new URL(req.url);
  const debug = url.searchParams.get("debug") === "1";
  const debugLog = {};
  const [mevduat, ihtiyacKredisi, konutKredisi, tasitKredisi] = await Promise.all([
    fetchCategory("https://www.hangikredi.com/yatirim-araclari/mevduat-faiz-oranlari", debugLog, "mevduat"),
    fetchCategory("https://www.hangikredi.com/kredi/ihtiyac-kredisi", debugLog, "ihtiyacKredisi"),
    fetchCategory("https://www.hangikredi.com/kredi/konut-kredisi", debugLog, "konutKredisi"),
    fetchCategory("https://www.hangikredi.com/kredi/tasit-kredisi", debugLog, "tasitKredisi")
  ]);
  const anyData = mevduat.length || ihtiyacKredisi.length || konutKredisi.length || tasitKredisi.length;
  if (!anyData) {
    return Response.json(
      { error: "Veri bulunamadı", ...debug ? { debug: debugLog } : {} },
      { status: 404 }
    );
  }
  const guncellemeTarihi = (/* @__PURE__ */ new Date()).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Istanbul"
  });
  return Response.json({
    mevduat,
    ihtiyacKredisi,
    konutKredisi,
    tasitKredisi,
    guncellemeTarihi,
    ...debug ? { debug: debugLog } : {}
  });
}

// ../../../tmp/bf-giris.ts
var CORS = { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, OPTIONS", "access-control-allow-headers": "*" };
async function onRequest({ request }) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  const y = await hisse_banka_faiz_default(request);
  const h = new Headers(y.headers);
  if (!h.has("access-control-allow-origin")) for (const [k, v] of Object.entries(CORS)) h.set(k, v);
  return new Response(y.body, { status: y.status, headers: h });
}
export {
  onRequest
};
