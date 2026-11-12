// FINYONIQ veri uçlarının kalıcı adresi: https://ecsoftiq.com/api/fin/<uç>
// Uçlar Val Town'dan Supabase'deki "fin" fonksiyonuna taşındı; uygulama onu doğrudan değil bu adresten çağırır.
// Arka uç bir gün yine taşınırsa yalnız ARKA değişir, uygulamayı güncellemek gerekmez.
//   örnek: /api/fin/emtia · /api/fin/mode-haber?mode=doviz-anlik · /api/fin/hisse-tarana?periyot=D
const ARKA = "https://uqkwmrwzcslessuopcrv.supabase.co/functions/v1/fin";
// Arka ucu başka yerde çalışan uçlar. Banka faizi: kaynak site Supabase ve Cloudflare sunucularını engellediği için
// şimdilik Val Town'daki val'dan alınıyor (10 Ocak 2027'ye kadar çalışır); kalıcı çözüm bulununca yalnız bu satır değişecek.
const OZEL_ARKA = { "hisse-banka-faiz": "https://erkancavdaroglu--96756bacad2211f181461607ee4eb77e.web.val.run" };
const ATILAN_ISTEK = ["host", "cookie", "cf-connecting-ip", "cf-ipcountry", "cf-ray", "cf-visitor", "x-forwarded-for", "x-real-ip"];
const ATILAN_YANIT = ["x-ec-ct", "x-deno-execution-id", "endpoint-load-metrics", "sb-request-id", "sb-gateway-version", "x-sb-edge-region", "x-served-by", "set-cookie"];

export async function onRequest({ request, params, waitUntil }) {
  const url = new URL(request.url);
  const yol = [].concat(params.yol || []).map(encodeURIComponent).join("/");
  // Zamanlanmış işler ve durum sayfası dışarıya açılmaz; onları yalnız veritabanındaki zamanlayıcı çağırır.
  if (!yol || /^(_|hisse-alarm|hisse-bildirim|hisse-guncel)/.test(yol)) {
    return new Response(JSON.stringify({ error: "Böyle bir veri ucu yok" }), { status: 404, headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*" } });
  }
  // Yanıt "public, max-age" ile geldiyse kenar önbelleğinde tutulur; aynı istek arka uca yeniden gitmez.
  const onbellekli = request.method === "GET" && !/[?&](refresh|nocache|debug|t)=/.test(url.search);
  const anahtar = new Request(url.toString(), { method: "GET" });
  if (onbellekli) {
    const hazir = await caches.default.match(anahtar);
    if (hazir) return hazir;
  }
  const h = new Headers(request.headers);
  for (const k of ATILAN_ISTEK) h.delete(k);
  h.set("x-ec-url", url.toString());
  const govdeli = request.method !== "GET" && request.method !== "HEAD";
  const hedef = OZEL_ARKA[yol] ? OZEL_ARKA[yol] + "/" + url.search : `${ARKA}/${yol}${url.search}`;
  // Arka uca ulaşılamazsa (ör. Val Town kapandıktan sonra banka faizi) uygulamaya okunabilir, CORS'lu bir hata döner;
  // uygulama bunu "veriler şu an alınamadı" diye gösterir.
  const hata = (durum) => new Response(JSON.stringify({ error: "Veri kaynağına ulaşılamadı" }), { status: durum, headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*", "cache-control": "no-store" } });
  let y;
  try {
    y = await fetch(hedef, { method: request.method, headers: h, body: govdeli ? request.body : undefined, redirect: "manual" });
  } catch (e) {
    return hata(502);
  }
  if (OZEL_ARKA[yol] && y.status >= 400 && !/json/i.test(y.headers.get("content-type") || "")) return hata(502);
  const yh = new Headers(y.headers);
  if (!yh.has("access-control-allow-origin")) yh.set("access-control-allow-origin", "*");
  const tur = yh.get("x-ec-ct");
  if (tur) { yh.set("content-type", tur); yh.delete("content-security-policy"); yh.delete("x-content-type-options"); }
  for (const k of ATILAN_YANIT) yh.delete(k);
  const yanit = new Response(y.body, { status: y.status, headers: yh });
  const cc = yh.get("cache-control") || "";
  if (onbellekli && y.status === 200 && /(?:^|,)\s*public\b/i.test(cc) && /max-age=[1-9]\d*/i.test(cc)) waitUntil(caches.default.put(anahtar, yanit.clone()));
  return yanit;
}
