/*
 * build.js
 * ------------------------------------------------------------
 * サイト全体を「シンプルなURL」の静的サイトとして _site/ に書き出すスクリプト。
 * GitHub Actions が push のたびに自動で実行するので、普段は手で動かす必要はない。
 *
 *   hello.html                → /hello/
 *   en/hello.html             → /en/hello/
 *   performance.html          → /performance/
 *   作品の詳細ページ（自動生成）→ /performance/freq-260530-deer-revenge/
 *                               /en/performance/freq-260530-deer-revenge/
 *
 * 作品の追加・編集はこれまで通り assets/data/*.js を書き換えるだけでよい。
 * 手元で確認したいとき:  node build.js  →  python3 -m http.server -d _site
 * ------------------------------------------------------------
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const OUT = path.join(ROOT, "_site");
const CATS = ["exhibition", "performance", "client-works", "music"];
const LIST = {
  "exhibition":   { prefix: "ex", third: "location", field: "listSub" },
  "performance":  { prefix: "pf", third: "location", field: "listSub" },
  "client-works": { prefix: "cw", third: "client",   field: "listSub" },
  "music":        { prefix: "mu", third: "note",     field: "listNote" }
};
const BACK_LABEL = { "exhibition": "exhibition", "performance": "performance", "client-works": "client works", "music": "music" };

// ---- データ読み込み（ブラウザ用の window.WORKS_DATA をそのまま使う） ----
global.window = {};
CATS.forEach((c) => require(path.join(ROOT, "assets/data", c + ".js")));
const DATA = window.WORKS_DATA;

function worksOf(cat, lang) {
  const d = DATA[cat][lang];
  return cat === "music" ? d.sections.map((s) => s.works) : [d.works];
}
function langPrefix(lang) { return lang === "en" ? "/en" : ""; }
function workUrl(lang, cat, id) { return langPrefix(lang) + "/" + cat + "/" + id + "/"; }

// ---- 相対リンクを、サイトのルートから始まるシンプルなURLに書き換える ----
function cleanUrl(url, fromFile) {
  if (/^(https?:|mailto:|tel:|data:|#|\/)/.test(url) || url === "") return url;
  const m = url.match(/^([^?#]*)(.*)$/);
  let p = path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), m[1]));
  if (p.startsWith("../")) p = p.replace(/^(\.\.\/)+/, "");
  if (/(^|\/)index\.html$/.test(p)) p = "/" + p.replace(/index\.html$/, "");
  else if (/\.html$/.test(p)) p = "/" + p.replace(/\.html$/, "") + "/";
  else p = "/" + p;
  return p + m[2];
}
function rewriteLinks(html, fromFile) {
  return html
    .replace(/\b(href|src)="([^"]*)"/g, (_, a, u) => a + '="' + cleanUrl(u, fromFile) + '"')
    .replace(/url\('([^']*)'\)/g, (_, u) => "url('" + cleanUrl(u, fromFile) + "')");
}

// ---- 一覧の行 ----
function rowsHtml(lang, cat, works) {
  const cfg = LIST[cat];
  return works.map((w) =>
    '<li><a href="' + workUrl(lang, cat, w.id) + '" class="' + cfg.prefix + '-row">' +
    '<span class="' + cfg.prefix + '-date">' + w.listDate + "</span>" +
    '<span class="' + cfg.prefix + '-title">' + w.listTitle + "</span>" +
    '<span class="' + cfg.prefix + "-" + cfg.third + '">' + (w[cfg.field] || "") + "</span>" +
    "</a></li>").join("\n");
}

// ---- 書き出し ----
function write(rel, html) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}
function outPathFor(srcRel) {
  if (/(^|\/)index\.html$/.test(srcRel)) return srcRel;
  return srcRel.replace(/\.html$/, "/index.html");
}

fs.rmSync(OUT, { recursive: true, force: true });

// 1) 手書きのページ（index / hello / contact / cv / 各一覧）
const pages = [];
for (const dir of ["", "en"]) {
  for (const f of fs.readdirSync(path.join(ROOT, dir))) {
    if (f.endsWith(".html") && f !== "work.html") pages.push(dir ? dir + "/" + f : f);
  }
}
for (const rel of pages) {
  const lang = rel.startsWith("en/") ? "en" : "ja";
  let html = fs.readFileSync(path.join(ROOT, rel), "utf8");
  const cat = path.basename(rel, ".html");
  if (LIST[cat]) {
    const groups = worksOf(cat, lang);
    const ids = cat === "music" ? groups.map((_, i) => "mu-list-" + i) : [LIST[cat].prefix + "-list"];
    ids.forEach((id, i) => {
      html = html.replace(new RegExp('(<ul[^>]*id="' + id + '"[^>]*>)\\s*(</ul>)'), "$1\n" + rowsHtml(lang, cat, groups[i]) + "\n$2");
    });
    // 一覧を描画していたスクリプトはもう不要
    html = html.replace(/<script src="[^"]*assets\/[^"]*"><\/script>/g, "").replace(/<script>\s*render[^<]*<\/script>/g, "");
  }
  write(outPathFor(rel), rewriteLinks(html, rel));
}

// 2) 作品の詳細ページ（データから自動生成）
const NAV_GREETING = { ja: "こんにちは", en: "hello" };
function detailPage(lang, cat, works, index) {
  const w = works[index];
  const older = works[index + 1];   // 配列の後ろほど古い
  const newer = works[index - 1];
  const P = langPrefix(lang);
  const other = lang === "en" ? "ja" : "en";
  const otherHas = worksOf(cat, other).some((g) => g.some((x) => x.id === w.id));
  const otherHref = otherHas ? workUrl(other, cat, w.id) : langPrefix(other) + "/" + cat + "/";
  const langSwitch = lang === "en"
    ? '<a href="' + otherHref + '">JP</a><span class="lang-sep">/</span><span class="lang-current">EN</span>'
    : '<span class="lang-current">JP</span><span class="lang-sep">/</span><a href="' + otherHref + '">EN</a>';
  const desc = lang === "en" ? "This is HAYASHI Tomohiro's website." : "林朋紘のウェブサイトです。";

  let main = '<p class="cwd-date">' + w.date + "</p>" + '<h1 class="cwd-title">' + w.title + "</h1>";
  if (w.sub) main += '<p class="cwd-client">' + w.sub + "</p>";
  main += rewriteLinks(w.bodyHtml, "work.html"); // データ内のパスはサイトのルート基準
  if (older || newer) {
    main += '<div class="cwd-siblings">' +
      '<div class="cwd-prev">' + (older ? '<a href="' + workUrl(lang, cat, older.id) + '">← previous</a>' : "") + "</div>" +
      '<div class="cwd-next">' + (newer ? '<a href="' + workUrl(lang, cat, newer.id) + '">next →</a>' : "") + "</div>" +
      "</div>";
  }
  main += '<div class="cwd-back"><a href="' + P + "/" + cat + '/">' + BACK_LABEL[cat] + "</a></div>";

  const title = String(w.pageTitle).replace(/<[^>]+>/g, "");
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}｜HAYASHI Tomohiro</title>
<meta name="description" content="${desc}">
<link rel="icon" type="image/jpeg" href="/images/profile.jpg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/style.css">
</head>
<body>
<div class="lang-switch">${langSwitch}</div>
<div class="page-layout page-layout--artwork">
<div class="sidebar">
<header class="site-header"><a href="${P}/" class="site-name">林朋紘｜HAYASHI Tomohiro</a></header>
<nav class="main-nav">
<a href="${P}/hello/" class="greeting">${NAV_GREETING[lang]}</a>
<ul class="nav-list">
<li><a href="${P}/exhibition/">exhibition</a></li>
<li><a href="${P}/performance/">performance</a></li>
<li><a href="${P}/music/">music</a></li>
<li><a href="${P}/client-works/">client works</a></li>
<li><a href="${P}/contact/">contact</a></li>
</ul>
</nav>
</div>
<main class="cwd-main">
<div class="cwd-content">
${main}
</div>
</main>
</div>
<div class="copyright">© 2026 HAYASHI Tomohiro.</div>
</body>
</html>
`;
}

let count = 0;
for (const cat of CATS) {
  for (const lang of ["ja", "en"]) {
    const seen = new Set();
    for (const works of worksOf(cat, lang)) {
      works.forEach((w, i) => {
        if (!/^[A-Za-z0-9_-]+$/.test(w.id)) throw new Error(`id に使えない文字があります: ${cat}/${w.id}（英数字・-・_ のみ）`);
        if (seen.has(w.id)) throw new Error(`id が重複しています: ${cat}/${w.id}`);
        seen.add(w.id);
        write(workUrl(lang, cat, w.id).slice(1) + "index.html", detailPage(lang, cat, works, i));
        count++;
      });
    }
  }
}

// 3) CSS・画像をコピー
fs.copyFileSync(path.join(ROOT, "style.css"), path.join(OUT, "style.css"));
fs.cpSync(path.join(ROOT, "images"), path.join(OUT, "images"), { recursive: true, filter: (s) => !s.endsWith(".DS_Store") });

console.log(`built ${pages.length} pages + ${count} work pages → _site/`);
