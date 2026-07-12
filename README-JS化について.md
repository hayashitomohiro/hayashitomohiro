# このサイトのJS化について（v2：詳細ページを1つに統合）

`exhibition` / `performance` / `music` / `client works` の作品ごとに存在していた
詳細ページのhtmlファイル（`client-works/*.html` など、日本語版・英語版あわせて約100ファイル）を
**すべて廃止**し、ルート直下の **`work.html` 1ファイルだけ**で全作品の詳細ページを表示する方式に変更しました。

これにより、**新しい作品を追加するのに、htmlファイルを作る・コピーする・リンクを書き換える作業が一切不要**になります。
`assets/data/{category}.js` に1件データを追記するだけで、一覧にも詳細にも反映されます。

以前のURL（例: `client-works/yamamoto-tao-artist-photo.html`）は
`work.html?lang=ja&cat=client-works&id=yamamoto-tao-artist-photo` のような形に変わっています
（まだ公開前とのことでしたので、URLの変更を優先しました）。

## ファイル構成

- `work.html` … 全ジャンル・全作品・日本語版/英語版共通の詳細ページ（これ1つだけ）
- `assets/site.js` … 一覧描画・詳細描画・prev/nextの自動計算などのロジック
- `assets/data/exhibition.js` / `performance.js` / `client-works.js` / `music.js`
  … 各ジャンルの実際のデータ（ここだけ編集すればOK）
- `exhibition.html` / `performance.html` / `client-works.html` / `music.html`
  （日本語版・英語版とも）… 一覧ページ。中身は変わらず、リンク先だけ `work.html?...` に変更
- `index.html` / `hello.html` / `contact.html` / `cv.html` … 変更なし

**削除したもの**：`exhibition/`, `performance/`, `client-works/`, `music/` の各フォルダ
（日本語版・英語版とも）。中身はすべて `assets/data/*.js` に統合されています。

## 新しい実績を追加する方法

`assets/data/client-works.js` を開いて、`ja`（日本語）または `en`（英語）の
`works` 配列に、**新しい要素を1つ追加するだけ**です。

```js
{
  "id": "new-work-id",
  "listDate": "2026.7.1",
  "listTitle": "新しい作品名",
  "listSub": "クライアント名",
  "pageTitle": "新しい作品名",
  "date": "2026.7.1",
  "title": "新しい作品名",
  "sub": "クライアント名",
  "bodyHtml": "<div class=\"cwd-gallery\"><img src=\"images/xxx.jpg\" alt=\"新しい作品名\"></div><div class=\"cwd-description cwd-description--justify\"><p>ここに説明文。</p></div>"
}
```

**これだけで完了です。** htmlファイルの作成・コピー・リンクの書き換えは一切不要です。

- 一覧ページに自動的に行が追加される
- 詳細ページ（`work.html?...&id=new-work-id`）が自動的に見られるようになる
- 前後の作品（prev/next）は配列の並び順から自動計算されるので、
  「配列のどこに追加するか」で並び順が決まります（先頭に追加すれば一番新しい扱い）
- 既存の作品を削除・並べ替えしたいときも、配列から消す／順番を入れ替えるだけでOKです

`exhibition` / `performance` / `client-works` の3つは `listSub`（一覧の3列目）と
`sub`（詳細ページのクライアント/場所の行）が同じ内容のことが多いですが、
念のため別々のフィールドとして持たせています（元のサイトで、日付の表記が
一覧と詳細でわずかに違う箇所が実際にあったため）。

`music` だけは `sections`（林朋紘／照山紅葉）という配列の中に `works` があり、
一覧の3列目は `listNote`（"cover" など）というフィールドになります。

```js
// music.js の例
{
  "title": "林朋紘｜HAYASHI Tomohiro",
  "texts": [...],
  "works": [
    {
      "id": "new-song",
      "listDate": "2026.7.1",
      "listTitle": "新曲",
      "listNote": "cover",
      "pageTitle": "新曲",
      "date": "2026.7.1",
      "title": "新曲",
      "sub": null,
      "bodyHtml": "<div class=\"cwd-video-wrap\"><iframe src=\"https://www.youtube.com/embed/xxxx\" ...></iframe></div>"
    }
  ]
}
```

## 画像・動画・クレジットなど

`bodyHtml` はそのまま挿入されるHTMLです。画像パスは `images/xxx.jpg`
（`work.html` がルート直下にあるため、`../` は不要です）。
写真（`cwd-gallery`）・YouTube動画（`cwd-video-wrap`）・クレジット（`cwd-credits`）・
本文（`cwd-description`）・準備中（`cwd-placeholder`）を自由に組み合わせられます。
既存のデータをコピペして書き換えるのが一番早いです。

## 今回、元サイトの状態にあわせて意図的に変えた/落とした点

- 英語版 `performance.html` の一覧に、対応する詳細ページが存在しないリンク
  （`suton-2.html`、日付 2026.7.8）が1件ありましたが、実体のないデータのため
  今回は一覧からも除外しています。もし2026.7.8の「すとん」出演データがあれば、
  `assets/data/performance.js` の `en.works` に追記すれば復活します。
