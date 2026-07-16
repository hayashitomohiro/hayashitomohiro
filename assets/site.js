/*
 * site.js
 * ------------------------------------------------------------
 * exhibition / performance / client-works / music の一覧ページと、
 * 共通の詳細ページ work.html を、JSONデータ（assets/data/*.js）から描画する。
 *
 * 詳細ページは今までのような「作品ごとに1ファイル」ではなく、
 * ルート直下の work.html 1つを、URLのクエリパラメータ
 * （?lang=ja&cat=client-works&id=xxx）で出し分ける方式になっている。
 *
 * 新しい作品を追加・削除・並べ替えしたいときは、このファイルではなく
 * assets/data/{category}.js の works 配列（またはmusicのsections）を編集するだけでよい。
 * 前後の作品（prev/next）は配列の並び順から自動計算されるので、
 * 個別にリンクを書き換える必要はない。
 *
 * 各作品データには「一覧用」と「詳細ページ用」で別々のフィールドがある
 * （listDate/listTitle/listSub/listNote と date/title/sub）。これは元のサイトで
 * 一覧と詳細で表記が微妙に異なる項目（例: 引用符の有無、日付のダッシュの種類）が
 * いくつかあったため、両方をそのまま保持している。
 * ------------------------------------------------------------
 */

(function () {
  "use strict";

  var CATS = {
    "exhibition":   { prefix: "ex", label: "location" },
    "performance":  { prefix: "pf", label: "location" },
    "client-works": { prefix: "cw", label: "client" },
    "music":        { prefix: "mu", label: "note" }
  };

  var BACK_LABELS = {
    ja: { "exhibition": "exhibition", "performance": "performance", "client-works": "client works", "music": "music" },
    en: { "exhibition": "exhibition", "performance": "performance", "client-works": "client-works", "music": "music" }
  };

  var NAV = {
    ja: { greeting: "こんにちは" },
    en: { greeting: "hello" }
  };

  function workHref(workBase, lang, cat, id) {
    return workBase + "?lang=" + lang + "&cat=" + encodeURIComponent(cat) + "&id=" + encodeURIComponent(id);
  }

  function rowHtml(workBase, lang, prefix, thirdClass, cat, work, thirdValue) {
    return (
      '<li><a href="' + workHref(workBase, lang, cat, work.id) + '" class="' + prefix + '-row">' +
      '<span class="' + prefix + '-date">' + work.listDate + '</span>' +
      '<span class="' + prefix + '-title">' + work.listTitle + '</span>' +
      '<span class="' + prefix + '-' + thirdClass + '">' + (thirdValue || "") + '</span>' +
      '</a></li>'
    );
  }

  // ---- 一覧ページ（exhibition / performance / client-works） ----
  // workBase: 同じ階層に work.html がある場合は "work.html"、
  //           en/ 配下のページから見る場合は "../work.html"
  window.renderSimpleList = function (lang, category, ulId, workBase) {
    var cfg = CATS[category];
    var data = window.WORKS_DATA[category] && window.WORKS_DATA[category][lang];
    var ul = document.getElementById(ulId);
    if (!ul || !data) return;
    var html = "";
    data.works.forEach(function (work) {
      html += rowHtml(workBase, lang, cfg.prefix, cfg.label, category, work, work.listSub);
    });
    ul.innerHTML = html;
  };

  // ---- 一覧ページ（music：セクションが複数あるケース） ----
  window.renderMusicSections = function (lang, ulIds, workBase) {
    var data = window.WORKS_DATA["music"] && window.WORKS_DATA["music"][lang];
    if (!data) return;
    data.sections.forEach(function (section, i) {
      var ul = document.getElementById(ulIds[i]);
      if (!ul) return;
      var html = "";
      section.works.forEach(function (work) {
        html += rowHtml(workBase, lang, "mu", "note", "music", work, work.listNote);
      });
      ul.innerHTML = html;
    });
  };

  // ---- 共通詳細ページ work.html ----
  window.renderWorkPage = function () {
    var params = new URLSearchParams(location.search);
    var lang = params.get("lang") === "en" ? "en" : "ja";
    var cat = params.get("cat");
    var id = params.get("id");
    var cfg = CATS[cat];
    var catData = window.WORKS_DATA[cat] && window.WORKS_DATA[cat][lang];
    if (!cfg || !catData) return;

    // music has sections; other categories have a flat "works" array
    var works;
    if (cat === "music") {
      for (var i = 0; i < catData.sections.length; i++) {
        var idx = catData.sections[i].works.findIndex(function (w) { return w.id === id; });
        if (idx !== -1) { works = catData.sections[i].works; break; }
      }
    } else {
      works = catData.works;
    }
    if (!works) return;
    var index = works.findIndex(function (w) { return w.id === id; });
    if (index === -1) return;
    var work = works[index];
    // In these listings, index 0 is the newest item. The page's "previous"
    // link points to the older item (next array index); "next" points to
    // the newer item (previous array index).
    var prevWork = index < works.length - 1 ? works[index + 1] : null;
    var nextWork = index > 0 ? works[index - 1] : null;

    document.title = work.pageTitle + "｜HAYASHI Tomohiro";
    document.documentElement.lang = lang;

    var navPrefix = lang === "en" ? "en/" : "";
    var otherLang = lang === "en" ? "ja" : "en";
    var otherHref = workHref("work.html", otherLang, cat, id);

    // lang switch
    var langSwitchHtml = lang === "en"
      ? '<a href="' + otherHref + '">JP</a><span class="lang-sep">/</span><span class="lang-current">EN</span>'
      : '<span class="lang-current">JP</span><span class="lang-sep">/</span><a href="' + otherHref + '">EN</a>';
    document.getElementById("lang-switch").innerHTML = langSwitchHtml;

    // sidebar / nav
    var greeting = NAV[lang].greeting;
    document.getElementById("sidebar").innerHTML =
      '<header class="site-header"><a href="' + navPrefix + 'index.html" class="site-name">林朋紘｜HAYASHI Tomohiro</a></header>' +
      '<nav class="main-nav">' +
      '<a href="' + navPrefix + 'hello.html" class="greeting">' + greeting + '</a>' +
      '<ul class="nav-list">' +
      '<li><a href="' + navPrefix + 'exhibition.html">exhibition</a></li>' +
      '<li><a href="' + navPrefix + 'performance.html">performance</a></li>' +
      '<li><a href="' + navPrefix + 'music.html">music</a></li>' +
      '<li><a href="' + navPrefix + 'client-works.html">client works</a></li>' +
      '<li><a href="' + navPrefix + 'contact.html">contact</a></li>' +
      '</ul></nav>';

    // main content
    var html = "";
    html += '<p class="cwd-date">' + work.date + "</p>";
    html += '<h1 class="cwd-title">' + work.title + "</h1>";
    if (work.sub) {
      html += '<p class="cwd-client">' + work.sub + "</p>";
    }
    html += work.bodyHtml;

    if (prevWork || nextWork) {
      html += '<div class="cwd-siblings">';
      html += '<div class="cwd-prev">' + (prevWork ? '<a href="' + workHref("work.html", lang, cat, prevWork.id) + '">← previous</a>' : "") + "</div>";
      html += '<div class="cwd-next">' + (nextWork ? '<a href="' + workHref("work.html", lang, cat, nextWork.id) + '">next →</a>' : "") + "</div>";
      html += "</div>";
    }

    html += '<div class="cwd-back"><a href="' + navPrefix + cat + '.html">' + BACK_LABELS[lang][cat] + "</a></div>";

    document.getElementById("cwd-content").innerHTML = html;
  };
})();
