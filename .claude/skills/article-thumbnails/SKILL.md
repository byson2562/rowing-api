---
name: article-thumbnails
description: 記事のサムネイルPNGを再生成する。frontend/lib/articles.ts に記事を追加した、記事のタイトルを変えた、記事を削除した、OG画像のデザイン(app/og/route.tsx)を変えた——このいずれかを行ったら、明示的な指示がなくてもこのスキルを実行する。「サムネイルを作り直して」「OG画像を再生成して」の依頼でも使う。
---

# 記事サムネイルの再生成

ホームと `/articles` に並ぶ記事サムネイルは、`frontend/public/og-thumb/<slug>.png` の**静的PNG**を配信している。記事を足したり改題したりしても自動では作られないので、ここで再生成してコミットする。

## なぜ静的PNGなのか

以前はページ内サムネイルも `/og` を直接参照していた。すると**ホームを開くたびに satori の画像生成が3回走り**、Cloudflare Workers 無料枠の CPU 上限を超えて Worker 全体が停止した(Error 1102 / 静的ページまで503)。絵柄は `/og` が返すものと同一なので、静的化しても見た目は変わらない。

OGPメタタグ側は今も `/og` を使う(SNSシェア時にしか叩かれず頻度が低い。エッジキャッシュも入れてある)。**メタタグを静的PNGに変えてはいけない** — 全1,900ページ分の画像が必要になる。

## 手順

1. 記事の登録が `frontend/lib/articles.ts` に入っていることを確認する(スクリプトはここを読む)。

2. 再生成する:

   ```bash
   cd frontend && npm run og:thumbs
   ```

   既定では**本番の `/og`** から取得する。デザイン変更を反映したい場合など、まだ本番に出ていない絵柄を使うときはローカルの dev サーバーを起動して:

   ```bash
   cd frontend && OG_ORIGIN=http://localhost:5173 npm run og:thumbs
   ```

3. 生成物を確認する。**1200x630 の PNG**であること、記事数と枚数が一致することを見る:

   ```bash
   ls -la frontend/public/og-thumb/
   ```

4. ページ内で実際に表示されるか確かめる(dev サーバーで `/` と `/articles` を開き、`img` の `naturalWidth > 0` を確認する)。

5. PNG をコミットする。CI(`.github/workflows/deploy-cloudflare.yml`)が main への push で本番へ配信する。

## 注意

- **`/og` が 503 を返すことがある**。画像生成が重なるとリソース上限に当たるため。スクリプトは5秒間隔で6回まで再試行し、各記事の間も3秒空ける。それでも失敗したら少し待って再実行する。
- スクリプトはタイトルを `主題 | 補足` で分割し、`title` と `subtitle` に割り当てる。この規則は `lib/og-image.ts` の `articleOgImageUrl` と一致させてある。**片方だけ変えない**。
- 記事を削除したときは `public/og-thumb/<slug>.png` も手で消す(スクリプトは古いファイルを掃除しない)。
- サムネイルの参照は `articleThumbUrl(slug)`(`lib/og-image.ts`)。ページ内で `articleOgImageUrl` を使うと Error 1102 が再発する。

## 関連

- 生成スクリプト: `frontend/scripts/generate-og-thumbs.mjs`
- OG画像の生成本体: `frontend/app/og/route.tsx`(エッジキャッシュ付き)
- 記事を新規作成したら、公開前に `article-review` スキルで校正を回す。
