/* =========================================================
   atelier kinari ― main.js
   1. 共通パーツ（ヘッダー／ドロワー／追従CTA／フッター）を描画
   2. site-data.js の内容を各セクションに流し込み
   3. 動き（スクロール表示・パララックス・タブ・絞り込みなど）
   ========================================================= */
(function () {
  "use strict";
  var S = window.SITE;
  var doc = document.documentElement;
  var page = document.body.getAttribute("data-page") || "";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  doc.classList.add("js");

  /* ---------- helpers ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  // Unsplash の photo ID か、相対パスの画像に対応
  function src(id, w) {
    if (/^(\.|\/|http)/.test(id)) return id;
    return "https://images.unsplash.com/" + id + "?auto=format&fit=crop&w=" + w + "&q=70";
  }
  function img(id, alt, opt) {
    opt = opt || {};
    var w = opt.w || 800, h = opt.h || 1000;
    var set = /^(\.|\/|http)/.test(id) ? "" :
      ' srcset="' + src(id, 480) + ' 480w, ' + src(id, 800) + ' 800w, ' + src(id, 1200) + ' 1200w, ' + src(id, 1800) + ' 1800w" sizes="' + (opt.sizes || "(min-width: 900px) 33vw, 50vw") + '"';
    return '<img src="' + src(id, 800) + '"' + set + ' alt="' + esc(alt) + '" width="' + w + '" height="' + h + '"' +
      (opt.eager ? ' fetchpriority="high"' : ' loading="lazy" decoding="async"') + ">";
  }
  function staffById(id) { return S.staff.filter(function (s) { return s.id === id; })[0]; }
  var lengthJa = { short: "ショート", medium: "ミディアム", long: "ロング" };

  var NAV = [
    { href: "./index.html", en: "Home", ja: "トップ", key: "home" },
    { href: "./menu.html", en: "Menu", ja: "メニュー・料金", key: "menu" },
    { href: "./gallery.html", en: "Style", ja: "ヘアスタイル", key: "gallery" },
    { href: "./staff.html", en: "Staff", ja: "スタッフ", key: "staff" },
    { href: "./access.html", en: "Access", ja: "アクセス", key: "access" },
    { href: "./reserve.html", en: "Reserve", ja: "ご予約", key: "reserve" }
  ];

  /* =========================================================
     1. 共通パーツ
     ========================================================= */
  function renderChrome() {
    var onHero = !!$(".hero");
    var navHtml = NAV.filter(function (n) { return n.key !== "home" && n.key !== "reserve"; }).map(function (n) {
      return '<li><a href="' + n.href + '"' + (n.key === page ? ' aria-current="page"' : "") + ">" + n.en + "</a></li>";
    }).join("");

    var header =
      '<a class="skip" href="#main">本文へスキップ</a>' +
      '<header class="header' + (onHero ? " on-hero" : " is-solid") + '" id="header">' +
        '<div class="wrap header__in">' +
          '<a class="logo" href="./index.html" aria-label="' + esc(S.name) + ' トップへ">' + esc(S.name) + "<small>HAIR ATELIER / FUKUOKA</small></a>" +
          '<nav class="gnav" aria-label="メインメニュー"><ul>' + navHtml + "</ul></nav>" +
          '<a class="btn header__cta" href="./reserve.html">ご予約</a>' +
          '<button class="menu-btn" type="button" aria-controls="drawer" aria-expanded="false" aria-label="メニューを開く"><span></span></button>' +
        "</div>" +
      "</header>" +
      '<div class="drawer" id="drawer" aria-hidden="true">' +
        NAV.map(function (n, i) {
          return '<a class="d-link" href="' + n.href + '" style="transition-delay:' + (0.15 + i * 0.05) + 's"><em>' + n.en + "</em><span>" + n.ja + "</span></a>";
        }).join("") +
        '<p class="drawer__info">' + esc(S.hoursShort) + "<br>TEL " + '<a href="tel:' + S.tel.replace(/-/g, "") + '">' + esc(S.tel) + '</a>' + "</p>" +
      "</div>";
    // 背景のオーロラ（ゆらぐ光）とフィルムのような粒子
    var atmos = '<div class="aurora" aria-hidden="true"><i></i><i></i><i></i></div><div class="grain" aria-hidden="true"></div>';
    document.body.insertAdjacentHTML("afterbegin", atmos + header);

    var fixed =
      '<div class="fixed-cta" id="fixed-cta">' +
        '<a href="tel:' + S.tel.replace(/-/g, "") + '" aria-label="電話をかける"><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg><span>電話</span></a>' +
        '<a href="' + S.reserve.line + '">LINEで予約</a>' +
      "</div>" +
      '<div class="toast" id="toast" role="status" aria-live="polite"></div>';

    var footer =
      '<footer class="footer"><div class="wrap">' +
        '<div class="footer__grid">' +
          '<div><a class="logo" href="./index.html">' + esc(S.name) + '</a><address>' + esc(S.address) + "<br>" + esc(S.access) + "<br>TEL " + '<a href="tel:' + S.tel.replace(/-/g, "") + '">' + esc(S.tel) + '</a>' + "</address></div>" +
          '<div><p style="color:var(--muted);margin-bottom:12px">営業時間</p>' + S.hours.map(function (h) { return "<p>" + esc(h.day) + "　" + esc(h.time) + "</p>"; }).join("") + "</div>" +
          '<nav aria-label="フッターメニュー"><ul>' + NAV.map(function (n) { return '<li><a href="' + n.href + '">' + n.ja + "</a></li>"; }).join("") + "</ul></nav>" +
        "</div>" +
        '<div class="footer__bottom"><p class="demo-notice">' + esc(S.demoNotice) + '</p><p>© ' + new Date().getFullYear() + " " + esc(S.name) + '　<button class="to-top" type="button">PAGE TOP ↑</button></p></div>' +
      "</div></footer>";
    document.body.insertAdjacentHTML("beforeend", footer + fixed);

    // 初回のみオープニング（トップページ）
    if (page === "home" && !reduce) {
      var seen = false;
      try { seen = sessionStorage.getItem("kinari-open") === "1"; sessionStorage.setItem("kinari-open", "1"); } catch (e) {}
      if (!seen) {
        document.body.insertAdjacentHTML("afterbegin", '<div class="opening" aria-hidden="true"><div><p class="opening__logo"><span>' + esc(S.name) + '</span></p><div class="opening__line"></div></div></div>');
        doc.style.setProperty("--open-delay", "1.6s");
      }
    }
  }

  /* =========================================================
     2. データの流し込み
     ========================================================= */
  function bindText() {
    $$("[data-bind]").forEach(function (el) {
      var k = el.getAttribute("data-bind");
      if (S[k] != null) el.textContent = S[k];
    });
    $$("[data-href]").forEach(function (el) {
      var k = el.getAttribute("data-href");
      if (k === "tel") el.setAttribute("href", "tel:" + S.tel.replace(/-/g, ""));
      else if (k === "map") el.setAttribute("href", S.mapUrl);
      else if (S.reserve[k]) el.setAttribute("href", S.reserve[k]);
    });
  }

  var R = {};

  R.summary = function (el) {
    el.innerHTML = "<ul>" + S.summary.map(function (s, i) {
      return '<li data-reveal style="--d:' + i * 0.08 + 's"><span class="k">' + esc(s.label) + '</span><span class="v">' + esc(s.value) + "</span>" + (s.sub ? '<span class="s">' + esc(s.sub) + "</span>" : "") + "</li>";
    }).join("") + "</ul>";
  };

  R.values = function (el) {
    el.innerHTML = "<ol>" + S.values.map(function (v, i) {
      return '<li data-reveal style="--d:' + i * 0.12 + 's">' +
        (v.image ? '<figure class="ph" data-clip style="--ar:4/3;--d:' + (i * 0.08).toFixed(2) + 's">' + img(v.image, v.alt || "", { w: 800, h: 600, sizes: "(min-width: 900px) 33vw, 100vw" }) + "</figure>" : "") +
        '<span class="en">' + esc(v.en) + "</span><h3>" + esc(v.title) + "</h3><p>" + esc(v.text) + "</p></li>";
    }).join("") + "</ol>";
  };

  /* 汎用の写真枠：<div data-render="photo" data-key="photos.interiorWide" data-ar="21/9" data-parallax></div> */
  function lookup(path) {
    return path.split(".").reduce(function (o, k) { return o && o[k]; }, S);
  }
  R.photo = function (el) {
    var p = lookup(el.getAttribute("data-key") || "");
    if (!p) { el.remove(); return; }
    var ar = el.getAttribute("data-ar") || "4/5";
    var parts = ar.split("/"); var w = 1200, h = Math.round(1200 * parts[1] / parts[0]);
    var fig = document.createElement("figure");
    fig.className = "ph " + (el.getAttribute("class") || "");
    fig.setAttribute("data-clip", "");
    if (el.hasAttribute("data-parallax")) fig.setAttribute("data-parallax", "");
    fig.style.cssText = "--ar:" + ar + ";" + (el.getAttribute("style") || "");
    fig.innerHTML = img(p.id, p.alt || "", { w: w, h: h, sizes: el.getAttribute("data-sizes") || "(min-width: 900px) 50vw, 100vw" });
    el.replaceWith(fig);
  };

  // 下層ページの見出し写真（body の data-page から自動で選ぶ）
  R.pageHero = function (el) {
    var p = S.pageHeroes && S.pageHeroes[page];
    if (!p) { el.remove(); return; }
    el.outerHTML = '<figure class="ph page-hero__ph" data-clip style="--ar:4/3;--d:.45s">' + img(p.id, p.alt, { w: 1200, h: 900, sizes: "(min-width: 900px) 45vw, 100vw", eager: true }) + "</figure>";
  };

  // フォトストリップ（3枚が違う速さで流れる）
  R.strip = function (el) {
    el.innerHTML = S.strip.map(function (s, i) {
      return '<figure class="ph strip__item" data-clip data-speed="' + (s.speed || 0) + '" style="--d:' + (i * 0.08).toFixed(2) + 's">' + img(s.id, s.alt, { w: 800, h: 1000, sizes: "(min-width: 900px) 33vw, 40vw" }) + "</figure>";
    }).join("");
  };

  // Instagram風グリッド
  R.insta = function (el) {
    el.innerHTML = S.instagram.map(function (s, i) {
      return '<a class="insta__item" href="./gallery.html" aria-label="' + esc(s.alt) + '（ヘアスタイル一覧へ）"><figure class="ph" data-clip style="--ar:1/1;--d:' + (i * 0.08).toFixed(2) + 's">' + img(s.id, s.alt, { w: 500, h: 500, sizes: "(min-width: 900px) 16vw, 33vw" }) + "</figure></a>";
    }).join("");
  };

  // 写真つきステップ（アクセスの道順・来店の流れ）
  function stepList(items) {
    return items.map(function (s, i) {
      return '<li><div><b>' + esc(s.title) + "</b><span>" + esc(s.text) + '</span></div><figure class="ph" data-clip style="--ar:1/1;--d:' + (i * 0.08).toFixed(2) + 's">' + img(s.image, s.alt, { w: 300, h: 300, sizes: "120px" }) + "</figure></li>";
    }).join("");
  }
  R.accessSteps = function (el) { el.innerHTML = stepList(S.accessSteps); };
  R.flow = function (el) { el.innerHTML = stepList(S.flow); };

  R.season = function (el) {
    var s = S.season;
    el.innerHTML =
      '<div class="season__grid">' +
        '<div data-reveal><p class="season__label">' + esc(s.label) + '</p><h2>' + esc(s.title) + "</h2><p>" + esc(s.text) + '</p><a class="btn" href="./gallery.html">スタイルをもっと見る<span class="arrow"></span></a></div>' +
        '<figure class="ph" data-clip data-parallax style="--ar:5/4">' + img(s.image, s.title, { w: 1200, h: 960, sizes: "(min-width: 900px) 50vw, 100vw" }) + "</figure>" +
      "</div>";
  };

  // トップ用：タブ切り替えの料金抜粋
  R.menuTabs = function (el) {
    var tabs = S.menu.map(function (c, i) {
      return '<button class="tab" role="tab" id="tab-' + i + '" aria-controls="panel-' + i + '" aria-selected="' + (i === 0) + '" tabindex="' + (i === 0 ? 0 : -1) + '">' + esc(c.ja) + "</button>";
    }).join("");
    var panels = S.menu.map(function (c, i) {
      return '<div class="panel" role="tabpanel" id="panel-' + i + '" aria-labelledby="tab-' + i + '"' + (i ? " hidden" : "") + '>' + priceTable(c.items, c.ja + "の料金") + "</div>";
    }).join("");
    el.innerHTML = '<div class="tabs" role="tablist" aria-label="メニューの種類">' + tabs + '<span class="tabs__bar"></span></div>' + panels + priceNotes(S.menuNotes.slice(0, 3));
    initTabs(el);
  };

  // 料金は表（table）で。メニュー名・所要時間・税込価格
  function priceTable(items, caption) {
    return '<table class="price-table"><caption class="skip">' + esc(caption) + '</caption>' +
      '<thead><tr><th scope="col">メニュー</th><th scope="col">所要</th><th scope="col">税込</th></tr></thead><tbody>' +
      items.map(function (it, i) {
        return '<tr style="animation-delay:' + (i * 0.06).toFixed(2) + 's"><th scope="row"><span class="nm">' + esc(it.name) + "</span>" +
          (it.desc ? '<span class="desc">' + esc(it.desc) + "</span>" : "") + '</th><td class="tm">' + esc(it.time || "") + '</td><td class="pr">' + esc(it.price) + "</td></tr>";
      }).join("") + "</tbody></table>";
  }
  // 指名料・ロング料金などの補足を、表のすぐ下に枠で
  function priceNotes(list) {
    return '<div class="price-notes glass"><p class="price-notes__ttl">料金について</p><ul class="notes">' + list.map(function (n) { return "<li>" + esc(n) + "</li>"; }).join("") + "</ul></div>";
  }

  // メニューページ：全カテゴリ
  R.menuFull = function (el) {
    var jump = '<nav class="jump" aria-label="カテゴリへ移動">' + S.menu.map(function (c) { return '<a href="#m-' + c.cat.toLowerCase() + '">' + esc(c.ja) + "</a>"; }).join("") + "</nav>";
    el.innerHTML = jump + S.menu.map(function (c) {
      return '<section class="menu-cat" id="m-' + c.cat.toLowerCase() + '" data-reveal><div class="menu-cat__head"><h2><em>' + esc(c.cat) + "</em>" + esc(c.ja) + "</h2>" +
        (c.image ? '<figure class="ph" data-clip style="--ar:4/3">' + img(c.image, c.alt || "", { w: 400, h: 300, sizes: "160px" }) + "</figure>" : "") +
        '</div>' + priceTable(c.items, c.ja + "の料金") + "</section>";
    }).join("") + priceNotes(S.menuNotes);
  };

  R.staffCards = function (el) {
    el.innerHTML = S.staff.map(function (s, i) {
      return '<a class="staff-card" href="./staff.html#' + s.id + '" data-reveal style="--d:' + i * 0.08 + 's">' +
        '<figure class="ph" data-clip style="--d:' + i * 0.08 + 's">' + img(s.image, s.name + "（" + s.role + "）のイメージ写真", { sizes: "(min-width: 900px) 25vw, 50vw" }) + "</figure>" +
        '<span class="role">' + esc(s.role) + "</span><h3>" + esc(s.name) + '</h3><ul class="tags">' + s.good.map(function (g) { return "<li>" + esc(g) + "</li>"; }).join("") + "</ul></a>";
    }).join("");
  };

  R.staffDetail = function (el) {
    el.innerHTML = S.staff.map(function (s) {
      var works = S.gallery.filter(function (g) { return g.staff === s.id; }).slice(0, 3);
      var bg = S.photos && S.photos.staffBg;
      return '<article class="staff-detail" id="' + s.id + '">' +
        (bg ? '<div class="staff-detail__bg" aria-hidden="true">' + img(bg.id, "", { w: 1200, h: 800, sizes: "100vw" }) + "</div>" : "") +
        '<figure class="ph" data-clip>' + img(s.image, s.name + "のイメージ写真", { sizes: "(min-width: 900px) 380px, 100vw" }) + "</figure>" +
        '<div data-reveal><p class="en">' + esc(s.en) + " — " + esc(s.role) + "</p><h2>" + esc(s.name) + '</h2><p class="msg">' + esc(s.text) + "</p>" +
          "<dl><dt>経歴</dt><dd>" + esc(s.years) + "</dd><dt>得意</dt><dd>" + s.good.map(esc).join("／") + "</dd></dl>" +
          '<a class="btn btn--fill" href="' + S.reserve.line + '">' + esc(s.name.split(" ")[0]) + "を指名してLINEで予約<span class=\"arrow\"></span></a>" +
          (works.length ? '<div class="mini">' + works.map(function (w) { return '<a href="./gallery.html" class="ph" aria-label="' + esc(w.title) + '">' + img(w.image, w.title, { w: 400, h: 400, sizes: "140px" }) + "</a>"; }).join("") + "</div>" : "") +
        "</div></article>";
    }).join("");
  };

  R.gallery = function (el) {
    var limit = parseInt(el.getAttribute("data-limit") || "0", 10);
    var items = limit ? S.gallery.slice(0, limit) : S.gallery;
    var cards = items.map(function (g, i) {
      var st = staffById(g.staff) || { name: "", id: "" };
      return '<article class="style-card" data-length="' + g.length + '" data-tag="' + esc(g.tag) + '" data-reveal style="--d:' + (i % 4) * 0.07 + 's">' +
        '<figure class="ph" data-clip style="--d:' + (i % 4) * 0.07 + 's">' + img(g.image, g.title, { w: 600, h: 800, sizes: "(min-width: 1080px) 25vw, (min-width: 760px) 33vw, 50vw" }) +
        '</figure><p class="style-category">' + lengthJa[g.length] + " / " + esc(g.tag) + "</p>" +
        "<h3>" + esc(g.title) + '</h3><p class="by"><span>担当 ' + esc(st.name) + '</span><a href="' + S.reserve.line + '" data-staff="' + st.id + '">このスタイルで予約</a></p></article>';
    }).join("");

    if (el.hasAttribute("data-filter")) {
      var tags = [];
      S.gallery.forEach(function (g) { if (tags.indexOf(g.tag) < 0) tags.push(g.tag); });
      var f = '<div class="filters">' +
        '<fieldset><legend>長さ</legend>' + ["all", "short", "medium", "long"].map(function (l, i) { return '<button type="button" class="chip" data-f="length" data-v="' + l + '" aria-pressed="' + (i === 0) + '">' + (l === "all" ? "すべて" : lengthJa[l]) + "</button>"; }).join("") + "</fieldset>" +
        '<fieldset><legend>メニュー</legend><button type="button" class="chip" data-f="tag" data-v="all" aria-pressed="true">すべて</button>' + tags.map(function (t) { return '<button type="button" class="chip" data-f="tag" data-v="' + esc(t) + '" aria-pressed="false">' + esc(t) + "</button>"; }).join("") + "</fieldset>" +
        '</div><p class="sample-note" id="count" aria-live="polite"></p>';
      el.innerHTML = f + '<div class="styles-grid is-4">' + cards + "</div>";
      initFilter(el);
    } else {
      el.innerHTML = '<div class="styles-grid">' + cards + "</div>";
    }
  };

  R.reviews = function (el) {
    var first = S.reviews[0];
    el.innerHTML =
      '<div class="review-quote"><blockquote>' + esc(first.text) + "</blockquote><cite>" + esc(first.who) + "　｜　" + esc(first.menu) + "</cite></div>" +
      '<div class="review-dots" role="tablist" aria-label="口コミを切り替え">' + S.reviews.map(function (r, i) { return '<button type="button" aria-label="口コミ ' + (i + 1) + '" aria-current="' + (i === 0) + '" data-i="' + i + '"></button>'; }).join("") + "</div>" +
      '<p class="sample-note">※デモ用のサンプル口コミです。実店舗では実際のお客様の声に差し替えます。</p>';
    initReviews(el);
  };

  R.faq = function (el) {
    el.innerHTML = S.faq.map(function (f, i) {
      return '<details data-reveal style="--d:' + i * 0.06 + 's"' + (i === 0 ? " open" : "") + '><summary><span class="q">Q</span><span>' + esc(f.q) + '</span><span class="pm" aria-hidden="true"></span></summary><p class="ans">' + esc(f.a) + "</p></details>";
    }).join("");
  };

  R.hours = function (el) {
    el.innerHTML = '<table class="hours"><caption class="skip">営業時間</caption><tbody>' + S.hours.map(function (h) {
      return '<tr><th scope="row">' + esc(h.day) + "</th><td>" + esc(h.time) + (h.note ? "<small>" + esc(h.note) + "</small>" : "") + "</td></tr>";
    }).join("") + "</tbody></table>";
  };

  R.info = function (el) {
    var rows = [["住所", S.address], ["アクセス", S.access], ["電話", S.tel], ["駐車場", S.parking], ["お支払い", S.payment]];
    el.innerHTML = '<dl class="info-dl">' + rows.map(function (r) { return "<dt>" + r[0] + "</dt><dd>" + esc(r[1]) + "</dd>"; }).join("") + "</dl>";
  };

  function renderAll() {
    $$("[data-render]").forEach(function (el) {
      var fn = R[el.getAttribute("data-render")];
      if (fn) fn(el);
    });
  }

  /* ---------- 構造化データ（HairSalon） ---------- */
  function jsonLd() {
    var data = {
      "@context": "https://schema.org",
      "@type": "HairSalon",
      name: S.name,
      description: S.description,
      telephone: S.tel,
      address: { "@type": "PostalAddress", streetAddress: S.address, addressLocality: "福岡市中央区", addressRegion: "福岡県", addressCountry: "JP" },
      geo: { "@type": "GeoCoordinates", latitude: S.geo.lat, longitude: S.geo.lng },
      priceRange: "¥¥",
      openingHoursSpecification: [
        { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Wednesday", "Thursday", "Friday"], opens: "10:00", closes: "20:00" },
        { "@type": "OpeningHoursSpecification", dayOfWeek: ["Saturday", "Sunday"], opens: "09:00", closes: "18:00" }
      ]
    };
    var s = document.createElement("script");
    s.type = "application/ld+json";
    s.textContent = JSON.stringify(data);
    document.head.appendChild(s);
    if ($("[data-render='faq']")) {
      var f = document.createElement("script");
      f.type = "application/ld+json";
      f.textContent = JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: S.faq.map(function (q) { return { "@type": "Question", name: q.q, acceptedAnswer: { "@type": "Answer", text: q.a } }; }) });
      document.head.appendChild(f);
    }
  }

  /* =========================================================
     3. 動き
     ========================================================= */

  // ヒーローの縦書きコピーを1文字ずつ表示
  function splitHero() {
    var v = $(".hero__vertical");
    if (!v) return;
    var base = parseFloat(getComputedStyle(doc).getPropertyValue("--open-delay")) || 0.2;
    v.innerHTML = Array.from(v.textContent).map(function (c, i) {
      return '<span class="ch" style="animation-delay:' + (base + 0.4 + i * 0.12).toFixed(2) + 's">' + esc(c) + "</span>";
    }).join("");
    $$(".hero__title .mask > span").forEach(function (s, i) { s.style.animationDelay = (base + 0.2 + i * 0.15).toFixed(2) + "s"; });
    $$(".hero__lead, .hero__btns").forEach(function (s, i) { s.style.animationDelay = (base + 1.3 + i * 0.2).toFixed(2) + "s"; });
  }

  // ヘッダー：スクロールで背景、下スクロールで隠れる
  function headerScroll() {
    var h = $("#header"), cta = $("#fixed-cta"), hero = $(".hero, .page-hero");
    var last = 0, ticking = false;
    function update() {
      var y = window.scrollY;
      var heroEnd = hero ? hero.offsetHeight * 0.6 : 200;
      if (h.classList.contains("on-hero")) h.classList.toggle("is-solid", y > 40);
      h.classList.toggle("is-hidden", y > last && y > 400 && !doc.classList.contains("menu-open"));
      cta.classList.toggle("is-show", y > heroEnd);
      last = y; ticking = false;
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  // ドロワー
  function drawer() {
    var btn = $(".menu-btn"), d = $("#drawer");
    function set(open) {
      doc.classList.toggle("menu-open", open);
      btn.setAttribute("aria-expanded", open);
      btn.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
      d.setAttribute("aria-hidden", !open);
      document.body.style.overflow = open ? "hidden" : "";
    }
    btn.addEventListener("click", function () { set(!doc.classList.contains("menu-open")); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") set(false); });
    $$("a", d).forEach(function (a) { a.addEventListener("click", function () { set(false); }); });
  }

  // スクロールで表示
  function reveal() {
    // 見出し → 本文 → ボタンの順に、少しずつ遅らせて浮かび上がらせる
    $$(".sec-head, .concept__text, .cta-band .wrap, .season__grid > div[data-reveal]").forEach(function (box) {
      Array.prototype.forEach.call(box.children, function (c, i) { c.classList.add("rise"); c.style.setProperty("--i", i); });
    });
    var els = $$("[data-reveal], .ph[data-clip]");
    if (!("IntersectionObserver" in window) || reduce) { els.forEach(function (e) { e.classList.add("is-in"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    els.forEach(function (e) { io.observe(e); });
  }

  // 写真のゆるいパララックス
  function parallax() {
    if (reduce) return;
    var items = $$("[data-parallax] img, .cta-band .bg");
    var strips = $$(".strip__item");
    if (!items.length && !strips.length) return;
    var ticking = false;
    function update() {
      var vh = window.innerHeight;
      items.forEach(function (im) {
        var r = im.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var p = (r.top + r.height / 2 - vh / 2) / vh; // -1〜1
        im.style.translate = "0 " + (p * -6).toFixed(2) + "%";
      });
      // フォトストリップ：枚ごとに速さを変えて上下にずらす
      strips.forEach(function (f) {
        var r = f.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var p = (r.top + r.height / 2 - vh / 2) / vh;
        f.style.translate = "0 " + (p * parseFloat(f.dataset.speed || 0) * 10).toFixed(1) + "px";
      });
      ticking = false;
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  // タブ（キーボード操作対応）
  function initTabs(root) {
    var tabs = $$(".tab", root), bar = $(".tabs__bar", root);
    function moveBar(t) { bar.style.width = t.offsetWidth + "px"; bar.style.transform = "translateX(" + t.offsetLeft + "px)"; }
    function select(t) {
      tabs.forEach(function (x) {
        var on = x === t;
        x.setAttribute("aria-selected", on); x.tabIndex = on ? 0 : -1;
        var p = document.getElementById(x.getAttribute("aria-controls"));
        p.hidden = !on; p.classList.toggle("is-in", on);
      });
      moveBar(t);
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { select(t); });
      t.addEventListener("keydown", function (e) {
        var n = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (!n) return;
        var next = tabs[(i + n + tabs.length) % tabs.length]; next.focus(); select(next);
      });
    });
    requestAnimationFrame(function () { moveBar(tabs[0]); });
    window.addEventListener("resize", function () { moveBar($(".tab[aria-selected='true']", root)); });
  }

  // ギャラリー絞り込み（フェードしながら入れ替え）
  function initFilter(root) {
    var state = { length: "all", tag: "all" };
    var cards = $$(".style-card", root), count = $("#count", root);
    function apply() {
      var shown = 0;
      cards.forEach(function (c) {
        var ok = (state.length === "all" || c.dataset.length === state.length) && (state.tag === "all" || c.dataset.tag === state.tag);
        if (ok) {
          shown++;
          if (c.hidden) { c.hidden = false; c.classList.add("is-out"); requestAnimationFrame(function () { requestAnimationFrame(function () { c.classList.remove("is-out"); }); }); }
        } else if (!c.hidden) {
          c.classList.add("is-out");
          setTimeout(function () { if (c.classList.contains("is-out")) c.hidden = true; }, reduce ? 0 : 380);
        }
      });
      count.textContent = shown + " 件のスタイル";
    }
    $$(".chip", root).forEach(function (b) {
      b.addEventListener("click", function () {
        var f = b.dataset.f;
        state[f] = b.dataset.v;
        $$('.chip[data-f="' + f + '"]', root).forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
        apply();
      });
    });
    apply();
  }

  // 口コミの自動切り替え
  function initReviews(root) {
    var box = $(".review-quote", root), dots = $$(".review-dots button", root), idx = 0, timer;
    function show(i) {
      idx = i;
      box.classList.add("is-swap");
      setTimeout(function () {
        var r = S.reviews[i];
        $("blockquote", box).textContent = r.text;
        $("cite", box).textContent = r.who + "　｜　" + r.menu;
        box.classList.remove("is-swap");
      }, reduce ? 0 : 420);
      dots.forEach(function (d, j) { d.setAttribute("aria-current", j === i); });
    }
    function auto() { clearInterval(timer); if (!reduce) timer = setInterval(function () { show((idx + 1) % S.reviews.length); }, 6500); }
    dots.forEach(function (d, i) { d.addEventListener("click", function () { show(i); auto(); }); });
    auto();
  }

  // デモ用ダミーリンクはトーストで案内
  function demoLinks() {
    var toast = $("#toast"), t;
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#reserve"], a[href^="#instagram"]');
      if (!a) return;
      e.preventDefault();
      toast.textContent = "デモサイトのため、実際の予約ページには移動しません";
      toast.classList.add("is-show");
      clearTimeout(t); t = setTimeout(function () { toast.classList.remove("is-show"); }, 2600);
    });
    var top = $(".to-top");
    if (top) top.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); });
  }

  /* ---------- 起動 ---------- */
  renderChrome();
  bindText();
  renderAll();
  jsonLd();
  splitHero();
  headerScroll();
  drawer();
  reveal();
  parallax();
  demoLinks();
})();
