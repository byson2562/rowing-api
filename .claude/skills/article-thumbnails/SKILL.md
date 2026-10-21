---
name: article-thumbnails
description: OG画像(SNSシェア用の 1200x630 PNG)の仕組みと確認手順。記事を追加・改題した、OG画像のデザイン(scripts/generate-og.mjs)を変えた、新しいページ種別を追加した、「サムネイルを作り直して」「OG画像を再生成して」と頼まれた——このいずれかで読む。
---

# OG画像の生成(ビルド時)

OG画像は**ビルド時に全ページぶんを一括生成**する。手で再生成してコミットする作業はもう無い。

- 絵柄・描画: `frontend/scripts/generate-og.mjs`(satori + @resvg/resvg-js、Noto Sans JP は `@fontsource/noto-sans-jp`)
- 各ページの (title, subtitle): `frontend/lib/og-targets.ts`。ページの `generateMetadata` と、一覧を書き出す `app/og-manifest.json/route.ts` が同じ関数を使う
- URL: `frontend/lib/og-image.ts` の `ogImageUrl()` が `/og/<title+subtitle のハッシュ>.png` を返す
- 流れ: `next build` → `out/og-manifest.json` → `node scripts/generate-og.mjs` → `out/og/*.png`(`npm run build` が両方やる)

## 記事を足した・改題したとき

1. `frontend/lib/articles.ts` に登録する(一覧・サイトマップ・OG はここを読む)
2. OG の見出しを短くしたい場合だけ `lib/og-targets.ts` の `ARTICLE_OG` に slug をキーにして title/subtitle を書く。無ければ記事タイトルの「主題 | 補足」を分割して使う
3. 記事ページの metadata は `ogImages(articleOg(meta))` を使う(他の記事ページと同じ)

## 新しいページ種別を足したとき

`lib/og-targets.ts` に `xxxOg(...)` を足し、`listOgTargets()` にも列挙を足す。ページ側で独自に文字列を組んで `/og/...` を参照してはいけない(一覧に無い画像は生成されず 404 になる)。

## 確認

```bash
cd frontend && npm run build && ls out/og | wc -l
```

- `out/og-manifest.json` の件数と `out/og/*.png` の枚数が一致すること
- 絵柄を変えたときは、任意の1枚を開いて白地・墨の見出し・左揃え・青の短い罫線・「レ」のマークを確認する(docs/design-rules.md §2)
- 1枚だけ試すなら `node scripts/generate-og.mjs --manifest <json> --out <dir> --force`(json は `[{"id":"x","title":"…","subtitle":"…"}]`)

## 関連

- 記事を新規作成したら、公開前に `article-review` スキルで校正を回す。
