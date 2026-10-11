# hayashitomohiro

林朋紘のウェブサイト。GitHub Pages で公開しています。

## URLのかたち

| ページ | 日本語 | 英語 |
|---|---|---|
| トップ | `/` | `/en/` |
| こんにちは・contact・CV | `/hello/` `/contact/` `/cv/` | `/en/hello/` … |
| 一覧 | `/performance/` など | `/en/performance/` など |
| 作品の詳細 | `/performance/freq-260530-deer-revenge/` | `/en/performance/freq-260530-deer-revenge/` |

詳細ページのURLの最後の部分は、データの `id` がそのまま使われます。
`id` に使えるのは英数字・`-`・`_` だけです。

## 作品を追加・編集する

`assets/data/` の `exhibition.js` / `performance.js` / `client-works.js` / `music.js` を編集して、
GitHub に push するだけです。数分後にサイトに反映されます。

- `ja` と `en` の `works` 配列に、同じ `id` で1件ずつ追加する
  （同じ id にしておくと、詳細ページの JP / EN 切り替えがつながります）
- 配列の先頭ほど新しい扱いになり、一覧の順番と previous / next がそれで決まります
- `bodyHtml` の中の画像やリンクは、サイトのいちばん上から見た書き方にします
  （例: `images/xxx.jpg`、`contact.html`、`en/contact.html`）

## しくみ

- `build.js` が、上のHTMLとデータから `_site/` にサイト一式を書き出します
- `.github/workflows/deploy.yml` が、`main` に push されるたびに `build.js` を実行して公開します
- `_site/` は自動生成されるので、Git には入れません（`.gitignore` 済み）

手元で確認したいとき（Node.js が必要）:

```
node build.js
python3 -m http.server -d _site
```

ブラウザで http://localhost:8000 を開きます。
`index.html` などをダブルクリックで開くと、リンクがうまく動きません。
