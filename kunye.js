/* ============================================================================
   EC SOFT IQ — KÜNYE MODÜLÜ
   ----------------------------------------------------------------------------
   KURULUM (tek seferlik):
   1) Bu dosyayı index.html ile aynı klasöre koy.
   2) index.html'de </body> satırından HEMEN ÖNCE şu satırı ekle:

        <script src="kunye.js"></script>

      Alt klasörlerdeki sayfalarda (ehliyetiq/index.html gibi):
        <script src="../kunye.js"></script>

   KULLANIM:
   Künyeyi değiştirmek için SADECE aşağıdaki AYARLAR bölümünü düzenle.
   Sitenin başka hiçbir dosyasına dokunma.
   ========================================================================= */

(function () {
  "use strict";

  /* ======================= AYARLAR — SADECE BURAYI DÜZENLE =================
     Tırnak içindeki yazıları değiştir. Tırnakları ve sondaki virgülleri silme.
     Bir satırı gizlemek istersen içini boş bırak:  ""
     ======================================================================== */

  var AYARLAR = {

    marka:          "EC SOFT IQ",
    tuzelKisiAdi:   "ERKAN CAVDAROGLU",       // Resmî ad — Türkçe karaktersiz (D&B kaydıyla aynı)
    tuzelKisiAdiTR: "ERKAN ÇAVDAROĞLU",       // Türkçe karakterli hâli
    isletmeTuru:    "Şahıs İşletmesi — Sole Proprietorship",

    adresSatir1:    "Bahçelievler Mah. Şenyurt 12. Sk. Burcum Apt. A Blok No: 2 İç Kapı No: 16",
    adresIlce:      "Merkez",
    adresIl:        "Çorum",
    adresUlke:      "Türkiye",

    // ÖNEMLİ: Apple / D&B D-U-N-S başvurusundaki numarayla AYNI olmalı.
    // D&B doğrulama için bu numarayı arar.
    telefon:        "+90 534 518 55 66",
    telefonAlt:     "",                        // ikinci numara; yoksa boş bırak
    telefonSaat:    "Pzt–Cum 09:00–18:00 (UTC+3)",
    eposta:         "info@ecsoftiq.com",
    web:            "ecsoftiq.com",

    vergiDairesi:   "Hasanpaşa Vergi Dairesi Müdürlüğü",
    faaliyetTR:     "Mobil uygulama ve yazılım geliştirme",
    faaliyetEN:     "Mobile application & software development",
    kurulusTarihi:  "24.09.2026",
    kurulusISO:     "2026-09-24",              // yyyy-aa-gg

    gosterSicilNotu: true,                     // Ticaret Sicili açıklaması
    gosterTelif:     false                     // sitenin kendi telif satırı zaten var
  };

  /* ===================== AYARLAR BİTTİ — AŞAĞISINA DOKUNMA ================ */

  var S = AYARLAR;

  // Sitenin kendi renk değişkenleri varsa onları kullanır, yoksa bu değerlere düşer.
  // Koyu temali sayfalar sitenin kendi degiskenlerini kullanir;
  // acik temali sayfalarda (gizlilik.html gibi) acik palete gecer.
  var CSS_KOYU = [
    '.ecs-kunye{',
      '--ek-bg:var(--bg,#060b1a);',
      '--ek-card:var(--card,#0d1838);',
      '--ek-line:var(--line,rgba(120,170,255,.14));',
      '--ek-text:var(--text,#e8eefc);',
      '--ek-muted:var(--muted,#93a3c7);',
      '--ek-cyan:var(--cyan,#22d3ee);',
      'background:var(--ek-bg);color:var(--ek-text);',
      'font-family:Inter,system-ui,sans-serif;font-size:.88rem;line-height:1.6;',
      'border-top:1px solid var(--ek-line);padding:40px 0 48px;box-sizing:border-box}',
    '.ecs-kunye *{box-sizing:border-box}',
    '.ecs-kunye__inner{max-width:1180px;margin:0 auto;padding:0 20px}',
    '.ecs-kunye__legal{color:var(--ek-muted);margin:0 0 22px;font-size:.86rem}',
    '.ecs-kunye__legal b{color:var(--ek-text);font-family:Sora,Inter,sans-serif;font-weight:700}',
    '.ecs-kunye__grid{display:grid;gap:16px 32px;',
      'grid-template-columns:repeat(auto-fit,minmax(240px,1fr));',
      'background:var(--ek-card);border:1px solid var(--ek-line);',
      'border-radius:20px;padding:26px}',
    '.ecs-kunye__row{display:flex;flex-direction:column;gap:3px;min-width:0}',
    '.ecs-kunye__k{font-size:.68rem;text-transform:uppercase;letter-spacing:.14em;',
      'font-weight:600;color:var(--ek-cyan)}',
    '.ecs-kunye__v{font-size:.9rem;color:var(--ek-text);overflow-wrap:anywhere}',
    '.ecs-kunye__v a{color:var(--ek-cyan);text-decoration:none}',
    '.ecs-kunye__v a:hover{text-decoration:underline}',
    '.ecs-kunye__v small{color:var(--ek-muted);font-size:.8rem}',
    '.ecs-kunye__note{margin:20px 0 0;font-size:.76rem;color:var(--ek-muted);line-height:1.65}',
    '.ecs-kunye__note em{opacity:.78}',
    '@media(max-width:720px){.ecs-kunye{padding:32px 0 40px}.ecs-kunye__grid{padding:20px}}'
  ].join('');

  var CSS_ACIK = [
    '.ecs-kunye{',
      '--ek-bg:transparent;',
      '--ek-card:#f6f8fc;',
      '--ek-line:#d9e1ef;',
      '--ek-text:#0f1e3d;',
      '--ek-muted:#4b5b7a;',
      '--ek-cyan:#1d4ed8;',
      'background:var(--ek-bg);color:var(--ek-text);',
      'font-family:inherit;font-size:.88rem;line-height:1.6;',
      'border-top:1px solid var(--ek-line);padding:32px 0 40px;box-sizing:border-box}',
    '.ecs-kunye *{box-sizing:border-box}',
    '.ecs-kunye__inner{max-width:1180px;margin:0 auto}',
    '.ecs-kunye__legal{color:var(--ek-muted);margin:0 0 20px;font-size:.86rem}',
    '.ecs-kunye__legal b{color:var(--ek-text);font-weight:700}',
    '.ecs-kunye__grid{display:grid;gap:14px 28px;',
      'grid-template-columns:repeat(auto-fit,minmax(220px,1fr));',
      'background:var(--ek-card);border:1px solid var(--ek-line);',
      'border-radius:14px;padding:22px}',
    '.ecs-kunye__row{display:flex;flex-direction:column;gap:3px;min-width:0}',
    '.ecs-kunye__k{font-size:.68rem;text-transform:uppercase;letter-spacing:.12em;',
      'font-weight:700;color:var(--ek-muted)}',
    '.ecs-kunye__v{font-size:.9rem;color:var(--ek-text);overflow-wrap:anywhere}',
    '.ecs-kunye__v a{color:var(--ek-cyan);text-decoration:none}',
    '.ecs-kunye__v a:hover{text-decoration:underline}',
    '.ecs-kunye__v small{color:var(--ek-muted);font-size:.8rem}',
    '.ecs-kunye__note{margin:18px 0 0;font-size:.76rem;color:var(--ek-muted);line-height:1.65}',
    '.ecs-kunye__note em{opacity:.8}',
    '@media(max-width:720px){.ecs-kunye__grid{padding:18px}}'
  ].join('');

  // Sayfanin arka planindan acik mi koyu mu oldugunu anlar.
  function sayfaKoyuMu() {
    try {
      var el = document.body, renk = '';
      while (el) {
        var c = getComputedStyle(el).backgroundColor;
        if (c && c !== 'transparent' && !/rgba\(0,\s*0,\s*0,\s*0\)/.test(c)) { renk = c; break; }
        el = el.parentElement;
      }
      if (!renk) {
        // arka plan belirtilmemis: site kendi --bg degiskenini tanimliyorsa koyu kabul et
        return !!getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
      }
      var m = renk.match(/\d+(\.\d+)?/g);
      if (!m) return true;
      var l = (0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) / 255;
      return l < 0.5;
    } catch (e) { return true; }
  }

  function esc(t) {
    return String(t == null ? '' : t)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // İçeriği boş olan satırlar künyede hiç görünmez.
  function satir(baslik, icerikHTML, itemprop) {
    if (!icerikHTML) return '';
    var ip = itemprop ? ' itemprop="' + itemprop + '"' : '';
    return '<div class="ecs-kunye__row"><span class="ecs-kunye__k">' + esc(baslik) +
           '</span><span class="ecs-kunye__v"' + ip + '>' + icerikHTML + '</span></div>';
  }

  function build() {
    var telTemiz    = String(S.telefon    || '').replace(/[^\d+]/g, '');
    var telAltTemiz = String(S.telefonAlt || '').replace(/[^\d+]/g, '');

    var adresHTML = '';
    if (S.adresSatir1 || S.adresIl) {
      adresHTML =
        '<div class="ecs-kunye__row" itemprop="address" itemscope itemtype="https://schema.org/PostalAddress">' +
        '<span class="ecs-kunye__k">Adres / Registered Address</span>' +
        '<span class="ecs-kunye__v">' +
        (S.adresSatir1 ? '<span itemprop="streetAddress">' + esc(S.adresSatir1) + '</span><br>' : '') +
        (S.adresIlce ? '<span itemprop="addressLocality">' + esc(S.adresIlce) + '</span> / ' : '') +
        (S.adresIl ? '<span itemprop="addressRegion">' + esc(S.adresIl) + '</span>, ' : '') +
        (S.adresUlke ? '<span itemprop="addressCountry">' + esc(S.adresUlke) + '</span>' : '') +
        '</span></div>';
    }

    var faaliyetHTML = S.faaliyetTR || S.faaliyetEN
      ? esc(S.faaliyetTR) + (S.faaliyetEN ? '<br><small>' + esc(S.faaliyetEN) + '</small>' : '')
      : '';

    var sicilNotu = S.gosterSicilNotu
      ? 'Ticaret Sicili kaydı bulunmamaktadır. Türkiye’de gerçek kişi şahıs işletmeleri ' +
        'Ticaret Siciline değil Vergi Dairesine kaydedilir; resmî tescil belgesi Gelir İdaresi ' +
        'Başkanlığı tarafından düzenlenen Vergi Levhasıdır.<br>' +
        '<em>Not registered with the Trade Registry. In Türkiye a sole proprietorship operating as ' +
        'a natural person is registered with the Tax Office, not the Trade Registry; the official ' +
        'government-issued registration document is the Tax Certificate (Vergi Levhası) issued by ' +
        'the Revenue Administration.</em>'
      : '';

    var telif = S.gosterTelif
      ? (sicilNotu ? '<br><br>' : '') + '© ' + new Date().getFullYear() + ' ' + esc(S.marka) +
        ' — ' + esc(S.tuzelKisiAdiTR || S.tuzelKisiAdi) + '. Tüm hakları saklıdır.'
      : '';

    var notHTML = (sicilNotu || telif)
      ? '<p class="ecs-kunye__note">' + sicilNotu + telif + '</p>' : '';

    return '' +
      '<section class="ecs-kunye" itemscope itemtype="https://schema.org/Organization" aria-label="Künye">' +
      '<div class="ecs-kunye__inner">' +
        '<p class="ecs-kunye__legal">' +
          '<span itemprop="alternateName">' + esc(S.marka) + '</span>, ' +
          '<b itemprop="legalName">' + esc(S.tuzelKisiAdiTR || S.tuzelKisiAdi) + '</b>' +
          ' şahıs işletmesine ait bir markadır.' +
        '</p>' +
        '<div class="ecs-kunye__grid">' +
          satir('Legal / Trade Name', esc(S.tuzelKisiAdi), 'name') +
          satir('İşletme Türü / Legal Form', esc(S.isletmeTuru)) +
          adresHTML +
          satir('Telefon / Phone',
            (S.telefon ? '<a href="tel:' + esc(telTemiz) + '" itemprop="telephone">' + esc(S.telefon) + '</a>' : '') +
            (S.telefonAlt ? '<br><a href="tel:' + esc(telAltTemiz) + '">' + esc(S.telefonAlt) + '</a>' : '') +
            (S.telefonSaat ? '<br><small>' + esc(S.telefonSaat) + '</small>' : '')) +
          satir('E-posta / E-mail',
            S.eposta ? '<a href="mailto:' + esc(S.eposta) + '" itemprop="email">' + esc(S.eposta) + '</a>' : '') +
          satir('Web',
            S.web ? '<a href="https://' + esc(S.web) + '" itemprop="url">' + esc(S.web) + '</a>' : '') +
          satir('Vergi Dairesi / Tax Office', esc(S.vergiDairesi)) +
          satir('Faaliyet / Line of Business', faaliyetHTML, 'description') +
          (S.kurulusTarihi
            ? '<div class="ecs-kunye__row"><span class="ecs-kunye__k">Faaliyete Başlama / Established</span>' +
              '<span class="ecs-kunye__v" itemprop="foundingDate" content="' + esc(S.kurulusISO) + '">' +
              esc(S.kurulusTarihi) + '</span></div>'
            : '') +
        '</div>' +
        notHTML +
      '</div></section>';
  }

  function yerlestir() {
    if (document.getElementById('ecs-kunye-style')) return;   // iki kez çalışmasın

    var st = document.createElement('style');
    st.id = 'ecs-kunye-style';
    st.textContent = sayfaKoyuMu() ? CSS_KOYU : CSS_ACIK;
    document.head.appendChild(st);

    var kutu = document.createElement('div');
    kutu.innerHTML = build();
    var blok = kutu.firstChild;

    // Sayfada <div id="ec-kunye"></div> varsa oraya; yoksa footer'ın hemen üstüne;
    // footer da yoksa sayfanın en altına.
    var hedef = document.getElementById('ec-kunye');
    var ft = document.querySelector('footer');
    if (hedef) {
      hedef.appendChild(blok);
    } else if (ft && ft.parentNode) {
      ft.parentNode.insertBefore(blok, ft);
    } else {
      document.body.appendChild(blok);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', yerlestir);
  } else {
    yerlestir();
  }
})();
