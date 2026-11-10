// Vakit IQ yedek takvim servisi (Cloudflare Pages Function).
// Uygulama Diyanet sayfasını kendisi okuyamazsa buraya sorar: /vakitiq/takvim?path=/tr-TR/9370/corum-icin-namaz-vakti
// Yanıt: {"region":9370,"days":[["2026-11-10","1 Cemaziyelahir 1448","05:47","07:13","12:29","15:10","17:35","18:56"], ...]}
// Diyanet sayfasının yapısı değişirse yalnız aşağıdaki parse() düzeltilir; uygulamaya güncelleme gerekmez.

const MONTHS = { ocak: 1, şubat: 2, mart: 3, nisan: 4, mayıs: 5, haziran: 6, temmuz: 7, ağustos: 8, eylül: 9, ekim: 10, kasım: 11, aralık: 12 };

function clean(s) {
  return s.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"')
    .replace(/&#(x[0-9a-fA-F]+|[0-9]+);/g, (m, n) => String.fromCodePoint(n[0] === "x" ? parseInt(n.slice(1), 16) : parseInt(n, 10))).trim();
}

export function parse(html) {
  const days = new Map();
  for (const row of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const v = [...row[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => clean(m[1]));
    if (v.length !== 8) continue;
    const bits = v[0].split(/\s+/);
    const month = MONTHS[(bits[1] || "").toLocaleLowerCase("tr")];
    const day = parseInt(bits[0], 10), year = parseInt(bits[2], 10);
    const times = v.slice(2);
    if (!month || !day || !year || !times.every((t) => /^\d{2}:\d{2}$/.test(t))) continue;
    const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    days.set(iso, [iso, v[1], ...times]);
  }
  return [...days.values()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
}

const json = (body, status, maxAge) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*", "cache-control": maxAge ? `public, max-age=${maxAge}` : "no-store" },
});

export async function onRequestGet({ request, waitUntil }) {
  const path = new URL(request.url).searchParams.get("path") || "";
  const m = path.match(/^\/tr-TR\/([0-9]{1,6})\/[a-z0-9-]{1,80}$/);
  if (!m) return json({ error: "Geçersiz vakit noktası" }, 400);
  const cache = caches.default, key = new Request("https://ecsoftiq.com/vakitiq/takvim?path=" + path);
  const hit = await cache.match(key);
  if (hit) return hit;
  let res;
  try {
    res = await fetch("https://namazvakitleri.diyanet.gov.tr" + path, { headers: { "user-agent": "VakitIQ-yedek/1.0 (+https://ecsoftiq.com)", "accept-language": "tr-TR,tr" } });
  } catch (e) {
    return json({ error: "Diyanet sayfasına ulaşılamadı" }, 502);
  }
  if (!res.ok) return json({ error: "Diyanet sayfası " + res.status + " döndürdü" }, 502);
  const days = parse(await res.text());
  if (days.length < 20) return json({ error: "Takvim okunamadı" }, 502);
  const out = json({ region: Number(m[1]), days }, 200, 21600);
  waitUntil(cache.put(key, out.clone()));
  return out;
}
