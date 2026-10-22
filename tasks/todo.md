# ホームに「次の大会」の帯 (2026-10-21)

### 背景
- ホームを「結果のアーカイブ」から「いま何があるか」のメディアに寄せるため、見出し行の下に次の大会を1行で出す。ユーザー提案

### Spec / Plan
- [x] 1. `data/schedule.json`: JARA の大会日程ページから 2026 年度の収録対象4大会(社会人・全日本・インカレ・新人)を転記(category は COMPETITION_CATEGORY_RULES の label)
- [x] 2. `lib/schedule.ts`: 開催中 > 終了して収録前(結果を収録中) > 90日以内の次の大会、の優先で1件を選ぶ。JST のビルド日で判定。`lib/schedule.test.ts`(vitest 9件)
- [x] 3. `app/page.tsx`: 上罫線の1行の帯(ラベル / 大会名 / 日程・会場 / ガイド記事か JARA へのリンク)。カウントダウンは出さない
- [x] 4. design-rules §6 に帯の規定を追記、lint / tsc / vitest / build、コミット。push はユーザー指示待ち

### 判断
- 日程は年4〜5件なので手で転記する(自動取得は作らない)。年度が変わったら schedule.json を更新する
- 静的ビルドのため「あとN日」は出さない。大会終了後は JARA 自動取込の push で再ビルドされ「結果を収録中」→ 収録後は次の大会に切り替わる

### Review
- 帯の表示を dev で desktop 1280 / mobile 375 で確認(「次の大会 第67回全日本新人ローイング選手権大会 10月23日(金)〜25日(日) · 戸田 大会の見かた」)。横はみ出しなし
- `competitionCategoryOf` を results-data.ts から export(収録済み判定に使う)
- 残件: 2027年度の日程が出たら schedule.json を更新。90日より先に大会がない時期は帯が出ない

# 全日本新人ローイング選手権のガイド記事 (2026-10-21)

### 背景
- 第67回全日本新人ローイング選手権大会が 2026-10-23(金)〜25(日) に戸田で開かれる(JARA 大会日程ページで確認)。結果はまだ無いので、大会前に検索される「とは/日程/種目/歴代」のガイド記事を先に出し、インカレと同じ「ハブ記事+年別の結果記事」の型にする
- 収録データ: 2009〜2025年の14大会(2016・2020・2021年は収録なし)、Final A は毎年7種目。大学・高校・社会人・混成クルーが同じ種目で競う

### Spec / Plan
- [x] 1. `lib/articles.ts` に `freshman-championship-guide` を登録(publishedAt 2026-10-21)
- [x] 2. `app/articles/freshman-championship-guide/page.tsx`: 日程・会場・エルゴ基準は静的文言、14大会/7種目/優勝の所属内訳/2025年の優勝と2位差/男子エイト歴代/種目別最速はビルド時集計。`freshman-championship-<年>-results` を自動列挙する受け皿
- [x] 3. 記事の表がグローバルの `table { min-width: 980px }` で 760px 幅からはみ出していたので `articleTable` に `min-w-0 [table-layout:auto]` を足す(既存記事にも効く)
- [x] 4. article-review(yomiyasu → article-proofreader)を回し、事実に関わる指摘は収録データで検証して反映
- [x] 5. サムネイル生成、lint / tsc / build、コミット(first-regatta は含めない)。push はユーザー指示待ち

### 判断
- 出場資格の細則は JARA ページに記載がなく要項PDF参照のため、本文は「大学・高校・社会人・混成が同じ種目で競う(収録データより)」と「シングルスカルのエルゴ基準」だけにした
- 結果記事は大会後(JARA 取込 PR のマージ後)に別途書く

### Review
- `/articles/freshman-championship-guide` を新設。日程・会場・出場資格・エルゴ基準・2026年の8種目は要項PDF(`2026freshman_bulletin.pdf`、2026-08-24付)で裏取りした静的文言、14大会/7種目/優勝の所属内訳(大学72・社会人など16・高校10)/2025年の優勝と2位差/男子エイト歴代(早稲田5・明治4・中央3)/種目別最速はビルド時集計
- article-review: yomiyasu(lint 95→推敲2箇所)→ article-proofreader。校正で直した事実: 2026年は女子エイトを含む8種目(収録データの7種目と分けて記述)、「予選の組み合わせにエルゴ記録を使う」は要項に根拠なしのため削除し「舵手を除く全選手が公式エルゴ記録を提出」に変更、「社会人のクラブや企業チーム」に混成(津幡・鳥取城北混成)が混じるため「社会人のクラブ・企業や混成クルーなど」に変更。推奨から「新人」の定義(要項7(3))、艇の人数の言い回し、日程の重複解消、「例年」、歴代記録の説明、最速タイムの根拠(男子エイト 5:52.49〜6:31.01)を反映
- `articleTable` に `min-w-0 [table-layout:auto]` を追加。グローバルの `table { min-width: 980px }` で記事の表(760px幅)が横にはみ出し、4列目が見えていなかった(既存記事にも効く修正)
- 検証: dev で desktop 1280 / mobile 375、記事内の内部リンク32件が 200、`npx tsc` / lint(既存の img 警告のみ)/ `npm run build` 通過
- 残件: 大会後(10/25以降)に `freshman-championship-2026-results` を書き、タイトル・description・リードの「2026年の日程」を過去形か年なしに直す(latestYear が 2026 になるとフォールバック文と矛盾するため)
# 完全静的サイトへの移行: output: "export" + Cloudflare Workers Static Assets (2026-10-21)

### 背景
- OpenNext の実行時サーバーが負担(Next 15 期限切れで CI 停止、Workers 無料枠の 3MB バンドル上限、`/og` 生成が重なると Worker ごと 503)
- 方針: Next は残し、サーバー実行をやめて `output: "export"` の完全静的サイトにし、Cloudflare の静的配信に乗せる。見た目と URL は変えない
- サーバーで動いていたもの: `app/api/v1/results`(+filters/stats)、`app/og/route.tsx`、`app/feed.xml`、`app/health`、ホームの `permanentRedirect`、`next.config` の `redirects()`

### Spec / Plan
- [x] 1. 検索をクライアント側へ: `lib/results-core.ts`(純粋な絞り込み・集計)と `lib/results-data.ts`(JSON 読み込み+キャッシュ)に分離。検索ページは `useSearchParams` で URL を読み、年 JSON を動的 import で取得して絞り込み・ページング・集計。title/canonical/robots はクライアントで同期。`app/api/` を削除(c7fba05)
- [x] 2. OG 画像をビルド時に生成: `lib/og-targets.ts` で全ページの (title, subtitle) を列挙 → `app/og-manifest.json/route.ts`(force-static)が一覧を書き出し → `scripts/generate-og.mjs` が satori + @resvg/resvg-js で `out/og/<id>.png` を並列生成。`lib/og-image.ts` は `/og/<id>.png` を指す。`public/og-thumb` と `generate-og-thumbs.mjs` は廃止(6778571)
- [x] 3. 残りの route: `feed.xml` は force-static のまま(ビルドで `out/feed.xml`)、`health` 削除、`next.config` の redirects を `public/_redirects` へ、ホームの旧クエリ救済はクライアント側リダイレクトへ(128d408)
- [x] 4. `output: "export"`、`dynamicParams` を false に、`out/` の生成と多バイト URL の確認(8656a21)
- [x] 5. デプロイ先: 既存 Worker `regattanavi` を assets-only に(`wrangler.jsonc` の `main` を外し `assets.directory: out`)。カスタムドメインの設定はそのまま使えるので DNS 変更なし。`@opennextjs/cloudflare` と `open-next.config.ts` を削除。`wrangler deploy --dry-run` で検証(ecd324f)
- [x] 6. 検証: build / lint / tsc / vitest、`npx serve out` で配信してホーム・検索・大会・選手・記事・OG を確認、本番とスクリーンショット比較(`wrangler dev` はこの Mac で起動できず、下記)
- [x] 7. Review を追記してコミット(push はしない)

### 判断
- 検索データは `public/` へ複製せず、年ごとの JSON を動的 `import()` でコード分割チャンクとして配る。サーバー側ローダーと同じ `importYear` を共有でき、チャンク名にハッシュが付くので更新時のキャッシュ事故がない
- OG 画像の URL は `/og/<title+subtitle のハッシュ>.png`。ページ側と生成側が同じ `lib/og-targets.ts` を使うので食い違わない
- `_redirects` はクエリ文字列を照合できない(Cloudflare 仕様)ため、ホームの旧フィルタ URL は JS で `/search` へ置換する。301 が必要になれば `run_worker_first` の小さな Worker で対応できる
- 静的エクスポートでは `/search?year=…` ごとの metadata をサーバーで出せない。HTML は固定(title/canonical=/search)、クライアントで従来の規則(年+大会 → /results 配下へ canonical、対応なしは noindex)を適用する
- OG 画像の見出しは 400(Regular)で描く。旧 route は 700 を指定していたが、next/og が Google Fonts から取れたのは Regular だけで、本番と承認済みサムネイルはすべて 400 で描かれていた。太字にしたければ `scripts/generate-og.mjs` の `HEADING_WEIGHT` と `loadFonts` に 700 を足す
- `.next-dev-preview2/`(30MB の dev ビルド成果物)がコミットされていて、`app/api` を消すと古い型定義が tsc を落とすので追跡を外した(8dc3a97)

### Review
- **コミット**(ブランチ `claude/static-export-325b81`、main から 6 コミット、未 push): 8dc3a97 untrack dev build → c7fba05 検索のクライアント化 → 6778571 OG のビルド時生成 → 128d408 redirects/health → 8656a21 output: export → ecd324f Static Assets デプロイ → (本コミット) Review
- **所要時間**: `npm run build` 83〜102 秒(Mac, 8 コア)= next build 約 60〜80 秒(1,978 ページ)+ OG 生成 15〜25 秒
- **OG 画像**: 1,969 枚(種目 788・選手 674・団体 383・大会 69・歴代 23・年 18・固定ページ 9・記事 4・既定 1)、1200×630 PNG、合計 53MB。8 並列で 15〜18 秒。`out/og-manifest.json` の id と `out/og/*.png`、HTML が参照する `/og/*.png` の 3 者が一致することを確認した。`npm run og` 単体なら既存ファイルをスキップし、`--force` で作り直す
- **out/ の中身**: ファイル 13,994(HTML 1,974 / RSC セグメント `.txt` 9,866 / OG 1,969 / その他)、370MB。`wrangler deploy --dry-run` は 15,975 ファイルを読んで成功("No bindings found")。Workers Static Assets の上限は 20,000 ファイル・1 ファイル 25MiB。**セグメント `.txt` が 1 ページあたり約 5 個**つくので、ページが約 1,200 増えると上限に当たる(年 100〜150 ページ増のペースなら数年は余裕)。Next 16 にこれを止める公開オプションは見つからなかった(PPR/segment cache の内部)
- **Workers から外したもの**: OpenNext ランタイム(`@opennextjs/cloudflare`、`open-next.config.ts`、`.open-next/`)、`/api/v1/results`・`/filters`・`/stats`、`/og`(next/og)、`/health`、`next.config` の `redirects()`、ホームの `permanentRedirect`、`initOpenNextCloudflareForDev`。依存に OpenNext は残っていない(package.json / lock とも 0 件)。追加した devDependencies: satori、@resvg/resvg-js、@fontsource/noto-sans-jp(84MB、woff を使う)
- **検証**: lint(既存の no-img-element 警告 1 件のみ)/ tsc / vitest 10 件 すべて通過。`npx serve out -l 8788` で `/`・`/search`・`/results`・`/results/2026`・`/results/2026/第76回全日本社会人ローイング選手権大会`・`/results/2026/第104回…/男子エイト`・`/records`・`/records/男子エイト`・`/athletes`・`/organizations`・`/articles`・`/articles/rowing-glossary`・`/about`・`/feed.xml`・`/sitemap.xml`(1,970 URL)・`/robots.txt`・`/og/default.png`・`/og/<id>.png` が 200、`/nonexistent`・`/api/v1/results`・`/health` が 404。ブラウザで `/search?year=2025&event=男子エイト` は 31 件と 2 つの図、年を外すと全 18 年のチャンクを読み 534 件と優勝タイム推移。`/?year=2025&event=男子エイト` は JS で `/search?…` へ置換。ホーム・大会ページ・検索の見た目は本番(regattanavi.jp)のスクリーンショットと一致(本番ホームには main の新しいコミット c0dfead「次の大会」帯と 9858618 新人選手権記事が載っていて、その 2 点だけ差がある)
- **検索ページの `<head>`**: Next は静的 HTML の metadata を hydration 後にもう一度 `<head>` へ流し込むため、一度 DOM を書き換えるだけでは既定値に戻る。MutationObserver で `<head>` を監視して当て直し、重複した canonical/robots は 1 つに畳む。`?year=2025&competition=第103回…` で canonical が `/results/2025/第103回…`、`?year=2025&event=男子エイト` で noindex・canonical なし、`/search` 単体で canonical `/search` になることを確認。JS 実行前の HTML は常に「title 既定・canonical /search」なので、Google が JS を実行しない場合は旧サーバー版より弱い
- **できなかったこと**: `wrangler dev` がこの Mac では `spawn EBADF`(wrangler 4.151.3 同梱 esbuild の同期サービス起動)で落ち、サンドボックス外・ターミナル・main 付きの設定でも同じだったため、`_redirects`(9 ルール、`wrangler dev` は "Parsed 9 valid redirect rules" まで出る)と `html_handling` の実挙動は未確認。`/results/2026/`(末尾スラッシュ)→ 307、`/rowing-results` → 301 `/about`、多バイトの `/records/男子舵手なしペア` → 301 は**本番切替直後に curl で確認する**こと。Playwright の e2e(`tests/e2e/*.spec.ts`)は `/api/v1` をモックし `/` を検索ページとして開く古い前提のままで、今回は触っていない(CI でも走っていない)
- **本番切替の手順**(人が実行): (1) main の c0dfead・9858618 をこのブランチへ取り込む(`frontend/app/page.tsx` と `lib/articles.ts` が触れ合うので衝突を確認)→ (2) `cd frontend && npm ci && npm run build && npx wrangler deploy --dry-run` → (3) main へマージして push すると `.github/workflows/deploy-cloudflare.yml` が `npm run build` → `npx wrangler deploy` を実行する。手で流すなら `cd frontend && npm run cf:deploy`。Worker 名 `regattanavi`・カスタムドメイン regattanavi.jp は同じ設定を使うので **DNS・ルートの変更は不要**。初回は約 16,000 ファイル(370MB)のアップロードで数分かかる(2 回目以降は差分のみ)→ (4) 切替後に `curl -I` で `/`、`/results/2026/`、`/rowing-results`、`/records/%E7%94%B7%E5%AD%90%E8%88%B5%E6%89%8B%E3%81%AA%E3%81%97%E3%83%9A%E3%82%A2`、`/og/default.png`、`/feed.xml` を確認し、X の Card Validator か Slack で大会ページの OG 画像が出ることを見る → (5) Cloudflare ダッシュボードの Worker に古い OpenNext のバージョンが残っても害はないが、`observability` の設定が消えるのでログは Static Assets のアナリティクスで見る
- **切替結果(2026-10-21)**: 上記 (1)〜(4) を実施。main へ `--no-ff` マージ(197b807、`lib/results-data.ts` は branch 側+`competitionCategoryOf` の再エクスポート、`tasks/todo.md` は両節を保持)。ローカルで `npm ci` → lint(warning 1 のみ)→ tsc → vitest 19 件 → `npm run build`(OG 1,971 枚生成、out/ 14,003 ファイル)→ `wrangler deploy --dry-run`(15,986 assets 読込)まで通してから push。途中で直したもの: 新人ガイドの `ogImages("…", "…")` 旧シグネチャ(ビルド時生成では `lib/og-targets.ts` の `ARTICLE_OG` に無い画像は作られないので、エントリを足して `ogImages(articleOg(meta))` に揃えた、8f86a8a)。ローカル固有の障害: 残っていた `.open-next/` が lint を、古い `.next-build/.next-dev` の validator.ts が tsc を落としていたので削除。GitHub Actions run 39611986237 は 9,901 assets をアップロードして成功。切替後の curl: `/` 200、`/results/2026/` → 307 `/results/2026`、`/about/` → 307、`/rowing-results` → 301 `/about`、`/support` → 301 `/sponsor`、多バイトの `/records/男子舵手なしペア` → 301 `/records/男子ペア`、`/og/default.png` と記事の og:image 200 image/png、`/feed.xml`・`/sitemap.xml` 200、`/search?year=2025` 200、`/api/v1/results`・`/no-such-page`・`/_redirects` は 404(404.html)。server: cloudflare。**未コミットの `app/articles/first-regatta/`(WIP)も同じ `ogImages` 旧シグネチャのままなので、仕上げるときに `articleOg` 方式へ直すこと**(ローカル build を通すため一時的に stash して戻した)
- **戻し方**: main を ecd324f の前(110773c)へ戻して push すれば旧 workflow が OpenNext でデプロイし直す(Worker 名が同じなので上書きされる)


# デザインシステム刷新: 日経ビジュアルデータ寄りへ (2026-10-20)

### 背景
- 7月のフラット化は業務UI寄り。ユーザーは「業務っぽくないメディア寄り」を希望し、3方向モック(日経ビジュアルデータ / 北欧暮らしの道具店 / note)から日経寄りを選択
- 決定: 順位バッジは青・灰(金銀銅廃止) / 主ボタンは墨色ソリッド / Noto Sans JP に一本化(Inter廃止)
- 計画の詳細は ~/.claude/plans/sequential-hugging-spark.md(承認済み)。単一ソースは docs/design-rules.md

### Spec / Plan
- [x] Phase 1: globals.css の :root / @theme・表・見出し既定、layout.tsx のフォント、button-classes、design-rules §1〜§6 とスキル要約を新仕様へ(1コミット)
- [x] Phase 2: SiteHeader(3列・中央に「データで見るボート」)、フッター、.site-container 1200px、.hero h1 38px(1コミット)
- [x] Phase 3a: 選手ページ(統計dl + 順位の推移の図)
- [x] Phase 3b: 大会ページ(760px一段組 + 2位との差の横棒図、rankBadgeClass を青・灰へ)
- [x] Phase 3c: ホーム(記事3列+小さな図、2列リスト)
- [x] Phase 3d: 検索ページ(箱・影の撤去、Recharts配色、墨ボタン)
- [x] Phase 3e: 記事(一覧の行化、本文h2の左ボーダー撤去、棒グラフ単色)
- [x] Phase 3f: 団体・歴代・年一覧・種目ページ(.static-*/.org-*、🥇→バッジ)
- [x] Phase 3g: LP系(lp-classes の箱撤去、フォーム)
- [x] Phase 4: OG画像を白地・墨見出しへ、サムネイル再生成
- [x] Phase 5: design-rules §1 対応表更新、lint/build、Review 追記。push はユーザー指示待ち

### 判断
- 大会ページの結論型見出し(「早稲田が連覇…」)は人が書くもの。69大会ぶんは生成できないので h1 は正式名のまま
- `first-regatta` 記事(作業中・未コミット)には触れない

### Review
- Phase 1(4155de0): トークン差し替え。墨 #1f1f1f・罫線 #dcdcdc・データの青 #1d5fbf・灰青 #b9c7dc、`--text-body` / `--meta` / `--border-strong` 追加、radius 0/4px、影はリングのみ、Noto Sans JP 一本化(Inter 廃止)、表のヘッダ地と sticky を廃止、見出しのアクセント棒を廃止。design-rules §1〜§8 とスキル要約を書き換え
- Phase 2(a77f61c): ヘッダーを3列(ワードマーク / データで見るボート / 13px ナビ)に、青いロゴをヘッダーから外した。コンテナ 1200px・h1 38px・ヒーローの箱を廃止
- Phase 3a(3550970): 選手ページを 760px 一段組に。統計 dl、Final A の順位の推移(CSS グリッドの図 `rank-timeline.tsx`)、出場レース表。順位バッジを青/灰青/薄灰へ(`rankBadgeClass`)
- Phase 3b(bb78227): 大会ページを 760px 一段組に。入口帯と優勝一覧表を「優勝クルーと2位との差」の横棒図(`gap-bars.tsx`、85パーセンタイルの物差し)に統合
- Phase 3c(23c5cf6): ホームを記事3列+小さな図(`home-figures.tsx`、集計は `lib/univ-championship.ts`)+2列リストに。最新結果テーブル・検索ボックス・見出しアイコンを廃止
- Phase 3d(ee5909a): 検索ページの箱・影・pill を撤去。Recharts を青/灰青/灰グリッドに、金色系列を廃止、主ボタンを墨に
- Phase 3e(cce860c): 記事一覧を行に、本文 760px、棒グラフ単色、用語集 SVG をトークン色に、lpFadeUp 廃止
- Phase 3f(5e7964a): 団体ページのメダルカード(🥇🥈🥉)を統計 dl に、歴代・種目ページの順位をバッジに。未使用の EmptyState / PageTitle を削除
- Phase 3g(96be424): LP の箱・見出しアイコン・固有色を撤去、フォームを新規定に
- Phase 4: OG 画像を白地・墨の見出し・左揃え・青の短い罫線に。記事サムネイル4枚を再生成(first-regatta は未コミット記事なので除外)。about のプレビュー画像を新デザインの検索画面で撮り直し(Playwright、1280×1060)
- 検証: 各ページで desktop 1280 / mobile 375 のスクリーンショット、`scrollWidth === clientWidth`、computed style で Noto Sans JP・バッジ色を実測。`npm run lint` は既存の no-img-element 警告のみ、`npm run build` exit 0
- 残件: `first-regatta` 記事と `articles.ts` のそのエントリは未コミットのまま。push はユーザー指示待ち

# 大会結果ページのA案実装(入口帯+優勝一覧) (2026-10-15)

### 背景
- Designアーティファクトで出した3案のうち、A案(箱根駅伝公式「過去の記録」の入口を帯にし、先頭に優勝クルー一覧、種目別は2列の小さな表)をユーザーが選択
- 対象は `/results/[year]/[competition]` の大会ページ。年度一覧・年ページ・種目ページは今回触らない

### Spec / Plan
- [x] 1. `lib/results-data.ts` に大会名から「第N回」と同時開催の後続名を除いた系列キーと、前年同大会のFinal A優勝団体を引く関数を足す
- [x] 2. 見出しは正式名の先頭セグメント(「第53回全日本大学ローイング選手権大会」)を h1 に、同時開催名は副題へ下げる。metadata/JSON-LD の正式名は変えない
- [x] 3. 入口帯(優勝クルー N種目 / 種目別の結果 Mクルー / 前年からの連覇 J種目 + 記録検索ボタン)をヘアライン区切りで置く。前年データが無い大会は連覇の代わりに収録件数を出す
- [x] 4. 「優勝クルー一覧」表(種目 / 優勝 / タイム / 2位との差 / 前年優勝+連覇チップ)を先頭に置く。`static-table` を使いモバイルはカード積み
- [x] 5. 「種目別の結果」は md 以上で2列の小さな表(順位バッジ / クルー / タイム / 1位との差)。Xシェアは種目ごとではなくページに1つ
- [x] 6. クラス文字列は `components/results/results-classes.ts` に集約し、色は rn-* トークンと既存の順位バッジ色だけを使う
- [x] 7. dev サーバーで desktop(1280)/mobile(375) のスクリーンショットを撮り、design-rules §9 の一覧と突き合わせる
- [x] 8. lint / build を通してコミット(push はユーザー指示待ち)

### 判断
- 開催日・会場は収録データに無いので出さない(§9-10 実データのみ)
- タイム表記は既存の `time_display` のまま。表記変更はサイト全体の判断なので別タスク

### Review
- `/results/[year]/[competition]` を A案に組み替えた。h1 は正式名の先頭セグメント、同時開催名は副題。入口帯(優勝クルー / 種目別の結果 / 前年からの連覇 or 収録件数 + 記録検索ボタン)、優勝クルー一覧(2位との差・前年優勝・連覇チップ)、2列の種目別小テーブル(順位バッジ・1位との差)
- `lib/results-data.ts` に `competitionSeriesKey` / `splitCompetitionName` / `previousYearWinners` を追加。系列が追えない大会は前年列と連覇を出さない
- クラスは `components/results/results-classes.ts` に集約。グローバルの `table { min-width: 980px; table-layout: fixed }` が2列グリッドをはみ出させたので、小テーブル側で打ち消した
- localhost:5175 で desktop 1280 / mobile 375 を実測: 横はみ出しなし(scrollWidth=viewport)、入口帯は md 以上で 1.2fr 1fr 1fr auto・モバイルは3列+全幅ボタン、優勝一覧はモバイルでカード積み
- §9 点検: 1〜12 すべて確認。直したのは 2位との差の接戦2件にアクセント色を使っていた点(§2 の1画面1箇所に反して2箇所)→ 太字のみに変更、クルー名リンクが 12px だった点 → 13px。ほかは該当なし。influence のある常時影はテーブルヘッダの既存ヘアラインのみ
- `npm run lint` は既存の no-img-element 警告のみ、`next build` exit 0、`tsc --noEmit` ok。X シェアは種目ごと15個からページ1個に減らした
- タイム表記(`time_display`)と年度一覧・年ページ・種目ページは今回触っていない。push はユーザー指示待ち

# インカレ2026 結果記事の新設とガイドのハブ化 (2026-10-15)

### 背景
- Search Console 90日: `/articles/university-championship-guide` が表示14,328(全体の約60%)・順位7.5なのにCTR 1.4%。文面が開催予告のままで、大会後の「結果」需要と合っていない
- 2026年インカレの結果146件は `frontend/data/results/2026.json` に取込済み

### Spec / Plan
- [x] 1. 結果記事 `/articles/university-championship-2026-results` を新設する。13種目(JO除く)のFinal A優勝校・タイム・2位との差、男女エイトのFinal A全着順、学校別の金メダル数、前年からの優勝校の入れ替わりをビルド時に `2026.json` から集計する
- [x] 2. 記事タイトルは「インカレ ボート 2026」「インカレ ローイング 2026」「ボート インカレ 2026」を狙う。description は結果訴求にする
- [x] 3. 既存ガイドは title/description から「2026」を外し、開催予告の文言を通年の説明に直す。優勝校テーブルと見出しは収録データの最新年を自動で拾う。「見どころ」節を「年別の結果記事」節に置き換え、`university-championship-<年>-results` の記事を自動で並べる
- [x] 4. 結果記事 → ガイド・勢力図記事・`/results/2026/<大会>`・優勝選手の選手ページ、ガイド → 結果記事 の内部リンクを張る
- [x] 5. article-review スキル(yomiyasu推敲 → article-proofreader校正)を回す
- [x] 6. article-thumbnails で新記事とガイドのサムネイルを再生成し、lint/build を通す
- [x] 7. 自分の変更だけをコミットする(作業中の `first-regatta` 記事と `articles.ts` のそのエントリは含めない)。push はユーザー指示待ち

### 判断
- 既存ガイドを書き換えず別記事にする理由: 大会前(日程・種目)と大会後(結果)で検索意図が違う。年別記事を毎年足し、ガイドは年を外したハブとして順位資産を残す
- カニバリ対策: ガイドの title から年を外し、冒頭から結果記事へリンクする

### Review
- `/articles/university-championship-2026-results` を新設。13種目の優勝校・タイム・2位との差・前年優勝校、男女エイトのFinal A全着順、学校別金メダル数、シングルスカルの優勝者を `2026.json` からビルド時に集計する
- ガイドは title/description から年を外し、最新年の優勝校テーブル・男子エイト歴代優勝・女子エイトの文を収録データから自動で拾う。`university-championship-<年>-results` の記事は registry から正規表現で拾って「年別の結果記事」に並べる
- article-review: yomiyasu(lint 100/98、stance=説明)→ article-proofreader の順で実施。校正で見つかった事実誤り(立命館 女子舵手つきフォアは2018年から9大会連続、2021年合併開催の日大の順位、ガイドの「大学のクルーだけ」の矛盾など)はデータで検証して修正した
- サムネイル2枚を再生成(1200×630)。`npm run lint` は既存の `no-img-element` 警告のみ、`npm run build` は exit 0(静的1984ページ)。localhost:5175 で両記事の表示と内部リンク(全200)を確認
- `first-regatta` 記事と `articles.ts` のそのエントリはコミットに含めていない。push は未実施(ユーザー指示待ち)
- 校正者の推奨項目(「私」vs「筆者」、Final A の説明追加、時刻表記 6:01.26 の統一、2027年の注目点の段落など)は未適用。ユーザー判断待ち

# Next.js一本化 (DBレス化) タスク

## GitHub Actions PR作成権限 Terraform化 (2026-07-17)

### Spec / Plan
- [x] 1. AWS用Terraformとはstate・provider認証を分離し、`infra/github`でGitHubリポジトリ設定を管理する
- [x] 2. `GITHUB_TOKEN`の既定権限はreadのまま、ActionsによるPull Request作成・承認設定だけを有効化する
- [x] 3. owner/repositoryを変数化し、認証・plan/apply・import手順をREADMEへ記載する
- [x] 4. `terraform fmt -check`、`terraform init`、`terraform validate`で定義を検証する

### Review
- AWS用の`infra/ec2`とは分離し、`infra/github`にGitHub Provider 6.xの独立構成を追加した。`terraform init`で6.13.0を選択し、lock fileを保存した。
- `github_workflow_repository_permissions`で`default_workflow_permissions = "read"`を維持しつつ、`can_approve_pull_request_reviews = true`を設定した。GitHub UI上の「ActionsによるPull Requestの作成と承認を許可」に対応する。
- owner/repositoryは変数化し、既定値を`byson2562/rowing-api`とした。tokenをstateやtfvarsへ保存しない`GITHUB_TOKEN`認証、plan/apply、既存stateからのimport方法をREADMEへ記載した。
- `terraform fmt -check -recursive infra/github`、`terraform -chdir=infra/github init -backend=false`、`terraform -chdir=infra/github validate`が成功。provider schemaでも対象3属性の型と利用可否を確認した。
- 実リポジトリへのplan/applyはAdministration権限付きtokenが必要なため未実施。定義の適用時に実施する。

## JARA大会結果 自動更新ワークフロー (2026-07-17)

### Spec / Plan
- [x] 1. Ruby 3.3コンテナでJARA当年度ページを巡回し、既存収録範囲の公開済みFinal A/B完走結果を取得する
- [x] 2. 既存レコードのIDを自然キーで保持し、新規レコードだけを全年度最大IDの続番で追加する
- [x] 3. 取得件数の減少、取得失敗、重複、必須項目不備、index不整合がある場合はファイル更新・PR作成を停止する
- [x] 4. 当年度JSON、`index.json`、新年度の静的import caseを一括生成し、2027年以降も同じ処理で更新可能にする
- [x] 5. GitHub Actionsを毎日21:00 JSTに実行し、差分がある場合のみ自動更新ブランチへcommit/pushしてPRを作成・更新する
- [x] 6. fixtureによる正常系・異常系、2026公式データの冪等再実行、全データ検証、workflow構文、frontend buildを確認する

### Operational specification
- 自動更新対象: 全日本選手権、全日本大学選手権（併催大会を含む）、全日本新人選手権
- 更新方式: 当年度の公式結果を再収集し、既存自然キーのIDを維持した完全スナップショットとして年度JSONを再生成する
- 安全弁: 既存年度より取得件数が減る更新は既定で拒否し、手動実行時のみ明示的な許可で解除可能にする
- 反映方式: Actionsが作成したPRを人が確認・マージし、既存の`main` pushデプロイCIで本番反映する
- 定期実行で結果未公開の新年度は変更なしで正常終了し、空の年度JSONは作成しない

### Review
- `.github/workflows/update-jara-results.yml` を追加。毎日21:00 JSTの定期実行と年度・削除許可を指定できる手動実行に対応し、生成差分がある場合だけ年度別の自動更新PRを作成・更新する。
- `scripts/jara/` にRuby 3.3固定のマルチステージDocker環境、JARA収集・安定ID生成、全年度データ検証、fixtureテスト、運用READMEを追加した。ホスト側のRuby環境は使用しない。
- 正常更新・冪等性・同件数でも自然キーが消える更新の拒否・明示許可時の削除・未公開新年度・ID重複をテストし、5 runs / 27 assertions / failure 0で成功した。
- JARA公式2026年度ページへコンテナから実通信し、対象大会2件・種目20ページ・Final A/B 31レース・完走162件を確認。既存データへの追加0件、生成差分なしとなり、冪等性を確認した。
- 全年度検証は2009〜2026年・5,408件・最大ID 5,733で成功。`index.json`、静的import年度、必須項目、ID・自然キーの一意性を確認した。
- `actionlint 1.7.7` によるWorkflow構文検証と、frontendコンテナでの`npm run lint && npm run build`が成功。lintは既存の`no-img-element` warningのみ。
- 運用開始前にGitHubの`Settings > Actions > General > Workflow permissions`で、ActionsによるPull Request作成を許可する必要がある。

## 2026年度大会データ取込 (2026-07-17)

### Spec / Plan
- [x] 1. 日本ローイング協会の2026年度大会ページを起点に、公開済み大会のレース結果リンクを収集する
- [x] 2. 各種目ページから Final A / Final B（旧表記: 決勝 / 順決 / 順位決定）の完走結果を抽出する
- [x] 3. 既存データと同じ必須項目・団体名名寄せ・タイム変換を適用し、安定した連番IDで `frontend/data/results/2026.json` を生成する
- [x] 4. `frontend/data/results/index.json` と年度別動的import対象へ2026年を追加する
- [x] 5. JSON構造、必須項目、ID/レース行の重複、公式ページとの標本一致、lint/buildを検証する

### Import specification
- Source: `https://www.jara.or.jp/race/current/index.html` および同ページから辿れる大会・種目別レース結果ページ
- Scope: 過年度と同じ全日本選手権・全日本大学選手権（併催大会を含む）・全日本新人選手権のうち、2026年度ページ上で結果が公開され、Final A / Final Bに該当するレース。未開催・結果未掲載大会は後日の再実行で追加する
- Record key: `year, competition_name, event_name, final_group, crew_name, organization, rank`
- Time: 最終計時を秒へ変換し、表示値は既存互換の `MM:SS:CC` とする
- Safety: 同じ入力から同じ並び・IDを生成し、再実行で重複を増やさない

### Review
- リポジトリ上の取込スクリプトは変更せず、Ruby 3.3コンテナから日本ローイング協会の2026年度ページを巡回した。
- 2026-07-17時点で既存収録範囲の結果公開済み大会は「第104回全日本ローイング選手権大会」のみ。20種目リンク・Final A/B 31レースを確認し、計時のある完走結果162行を `frontend/data/results/2026.json` へ追加した。
- 公式上は164順位行あるが、仙台大学の女子舵手つきフォア Final A 6位と女子エイト Final A 5位はゴールタイムが空欄のため、既存仕様どおり取込対象外とした。
- 2026年度IDは5572〜5733。全年度合計は5,408行。必須項目、型、年度、Final区分、正の順位・タイム、全年度ID重複、2026年度自然キー重複、index集計一致を検証済み。
- 公式との標本照合: 男子シングルスカル Final A 1位は永坂 日鼓（東レ滋賀）、07:13:94 / 433.94秒で一致。
- コンテナで `npm run lint && npm run build` 成功。lintは既存の `no-img-element` warningのみ。buildで `/results/2026` と第104回全日本選手権ページの静的生成を確認した。
- 一時起動したコンテナで `/api/v1/results?year=2026&per_page=1` の `pagination.total_count=162`、filtersの2026年・大会名、`/results/2026` のHTTP成功を確認した。

## Plan
- [x] 1. Next.js API Routeで `/api/v1/results` `/api/v1/results/filters` `/api/v1/results/stats` を実装する
- [x] 2. 既存フロント (`/Users/tnakamura/git/rowing-api/frontend/app/page.tsx`) のAPI参照を同一オリジン `/api` 前提に統一する
- [x] 3. ローカル compose から backend 依存を外し、frontend 単体で起動できるようにする
- [x] 4. 本番 compose/Caddy から backend 依存を外し、caddy -> frontend のみで配信する
- [x] 5. CI/CD を frontend image build/deploy のみに簡素化する
- [x] 6. ビルドと型チェックで動作確認し、レビュー結果を記録する

## Review
- `npm ci` 実行時に `getaddrinfo ENOTFOUND registry.npmjs.org` で失敗（実行環境のネットワーク制限）。
- そのため `npm run build` / `npm run lint` はこの環境では未実施。
- `docker compose -f /Users/tnakamura/git/rowing-api/docker-compose.yml config` は成功（構文OK）。
- `docker compose -f /Users/tnakamura/git/rowing-api/docker-compose.prod.yml config` は成功（未設定環境変数の warning のみ）。
- `docker compose run --rm frontend sh -lc \"npm install && npm run lint && npm run build\"` は成功。
- ESLint は warning のみ（`@next/next/no-img-element`、対象: `/Users/tnakamura/git/rowing-api/frontend/app/og/route.tsx`, `/Users/tnakamura/git/rowing-api/frontend/app/rowing-results/page.tsx`）。

## CC-SDD 改善 (2026-02-28)

### Spec
- [x] 1. 同一クエリの計算を避けるため、`results-data.ts` にAPI向けメモ化レイヤを追加する（短TTL）
- [x] 2. `/api/v1/results*` のレスポンスに `Cache-Control` ヘッダを追加し、短時間再利用を有効化する
- [ ] 3. frontendコンテナで build + e2e を再実行し、動作回帰がないことを確認する

### Review
- `docker compose run --rm frontend sh -lc "npm install && npm run build"` は成功。
- `docker compose run --rm frontend sh -lc "npm install && npm run e2e"` はブラウザ未インストールで失敗。
- `docker compose run --rm frontend sh -lc "npm install && npx playwright install --with-deps chromium && npm run e2e"` は apt 署名検証エラーで失敗。
- `docker compose run --rm frontend sh -lc "npm install && npx playwright install chromium && npm run e2e"` は `ENOSPC`（Playwright Chromium ダウンロード時のディスク不足）で失敗。

## ローイング団体向けヒアリング項目整理 (2026-03-01)

### Plan
- [x] 1. 既存会話で合意したヒアリング項目を `tasks/` 配下に保存する
- [x] 2. 30分で運用できる進行順（現状把握/課題深掘り/意向確認）に構成する
- [x] 3. 金額ヒアリングと導入判断に必要な確認項目（決裁者/予算時期/障壁）を追加する

### Review
- `tasks/hearing-script.md` を新規作成し、30分想定の質問項目を固定化した。
- 既存の相談内容をベースに、収益化判断に直結する追加質問（頻度・工数、既存支出、意思決定、導入障壁）を追記した。

## ヒアリング背景の明確化 (2026-03-01)

### Plan
- [x] 1. ユーザーの実績（早稲田大学漕艇部マネージャー経験）をヒアリング台本へ反映する
- [x] 2. 学連幹部（水路部長）経験から見た「団体共通課題」の前提を台本へ反映する
- [x] 3. ヒアリング開始時に使う導入トークと初期仮説を `tasks/hearing-script.md` に追加する

### Review
- `tasks/hearing-script.md` に「ヒアリング導入トーク（信頼形成）」を追加した。
- 「共通課題の初期仮説」を追加し、早稲田固有ではない横断課題の検証目的を明文化した。
- 運用ルールに「冒頭30秒で背景説明を行う」手順を追記した。

## LPデザインレビュー反映 (2026-03-01)

### Plan
- [x] 1. LPヒーローのメトリクスを固定値からデータ連動へ変更する（件数/対象期間/対象大会数）
- [x] 2. LPの見出し階層と余白を調整して、セクション構造を視認しやすくする
- [x] 3. SP表示でFVの縦伸びを抑え、CTA到達性を改善する（メトリクスの2カラム化）
- [x] 4. 変更後にfrontendコンテナで lint と build を実行し、結果をReviewに記録する

### Review
- `frontend/lib/results-data.ts` に `getDatasetSummary()` を追加し、件数・最小年度・最大年度・大会カテゴリ数を取得可能にした。
- `frontend/app/rowing-results/page.tsx` でヒーローメトリクスの固定値を動的値へ置換した（収録レース/対象期間/対象大会）。
- `frontend/app/globals.css` で `h2` と `h3` のコントラストを強化し、LPセクション間隔を調整した。
- SP向けにヒーローメトリクスを2カラム化し、3つ目カードを全幅にしてFVの縦伸びを抑えた。
- `frontend/public/icons/*.svg` を追加し、主な特徴の見出しアイコンを絵文字からローカルSVGへ置換した。
- `docker compose -f /Users/tnakamura/git/rowing-api/docker-compose.yml run --rm frontend sh -lc "npm install && npm run lint && npm run build"` は成功（`no-img-element` warning のみ）。

## LPモダン化 (2026-03-01)

### Plan
- [x] 1. FVを1メッセージ+1CTAへ簡素化し、要点情報を別帯に再配置する
- [x] 2. カードの情報階層を作るため、主カードを強調し他カードを抑える
- [x] 3. 配色とモーションを整理し、青系2トーン中心の軽い表現に寄せる
- [x] 4. frontendコンテナで lint/build を実行して回帰を確認する

### Review
- `/Users/tnakamura/git/rowing-api/frontend/app/rowing-results/page.tsx` のFVを簡素化し、CTAを主ボタン1つに整理した。
- タグ/メトリクスを `lp-hero-strip` としてFV下へ分離し、ヒーローの初見可読性を優先した。
- `lp-value-card-primary` を追加し、主な特徴の1枚目のみ強調するデザインに変更した。
- `/Users/tnakamura/git/rowing-api/frontend/app/globals.css` で配色を青系2トーン中心へ整理し、装飾的なオーブ/浮遊アニメーションを削除した。
- `docker compose -f /Users/tnakamura/git/rowing-api/docker-compose.yml run --rm frontend sh -lc "npm run lint && npm run build"` は成功（`no-img-element` warning のみ）。

## 検索画面デザイナーレビュー反映 (2026-03-01)

### Plan
- [x] 1. フィルターを主要条件/詳細条件の2段に分割し、操作順を明確化する
- [x] 2. グラフの主従をつけるため、主要グラフを強調したレイアウトに変更する
- [x] 3. ローディング表示とテーブル下部余白を調整し、閲覧体験を軽くする
- [x] 4. ヘッダーのトーンをLPと揃え、ブランド一貫性を改善する
- [x] 5. frontendコンテナで lint/build を実行して回帰確認する

### Review
- `/Users/tnakamura/git/rowing-api/frontend/app/page.tsx` で `hero-kicker` を追加し、ヘッダーの文脈を補強した。
- フィルター群を `filters-primary`（年/大会カテゴリ/大会名/種目）と `filters-secondary`（Final/順位/団体/団体区分）に分割した。
- 3つのグラフを `12カラム` 構成に変更し、メダル数グラフを `chart-card-primary` として横幅を広げた。
- `/Users/tnakamura/git/rowing-api/frontend/app/globals.css` でローディングオーバーレイを軽量化し、テーブル見出し/ページャーに区切り線と余白を追加した。
- `docker compose -f /Users/tnakamura/git/rowing-api/docker-compose.yml run --rm frontend sh -lc "npm run lint && npm run build"` は成功（`no-img-element` warning のみ）。

## COOレビュー主要指摘 1-3 対応 (2026-03-01)

### Plan
- [x] 1. North Star KPIをLP/検索画面に明記する
- [x] 2. GAイベントを強化し、運用判断に必要なイベントを送信する
- [x] 3. データ更新SLA（更新方針）をLP/検索画面に表示する
- [x] 4. frontendコンテナで lint/build を実行し回帰がないことを確認する

### Review
- `/Users/tnakamura/git/rowing-api/frontend/app/page.tsx` に `North Star KPI` と `データ更新方針` の運用情報カードを追加。
- `/Users/tnakamura/git/rowing-api/frontend/app/rowing-results/page.tsx` のデータ概要へ `North Star KPI` と `更新SLA` を追記。
- `/Users/tnakamura/git/rowing-api/frontend/app/layout.tsx` で GA 計測を拡張し、`filter_apply` と `rowingapi_analytics_event` のカスタムイベント受信を追加。
- `/Users/tnakamura/git/rowing-api/frontend/app/page.tsx` から `search_results_loaded` / `no_data_view` を送信し、チャート・結果行クリックに `chart_interaction` / `result_open` を付与。
- `docker compose -f /Users/tnakamura/git/rowing-api/docker-compose.yml run --rm frontend sh -lc "npm run lint && npm run build"` は成功（`no-img-element` warning のみ）。

## 検索画面 業務UI改善 (P1-P3) (2026-03-02)

### Plan
- [x] 1. `winner-trend-card` の適用先を修正し、優勝タイム推移カードに専用スタイルが正しく当たるようにする（P1）
- [x] 2. チャートカードのモバイル時レイアウト指定をカード種別で明示し、幅/高さ制御の意図を固定する（P2）
- [x] 3. 主要フィルター（primary）を視覚的に強調し、業務UIとしての初手操作を明確化する（P3）
- [x] 4. frontendコンテナで lint/build を実行して回帰確認し、Reviewへ記録する

### Review
- `/Users/tnakamura/git/rowing-api/frontend/app/page.tsx` で `winner-trend-card` を優勝タイム推移カードへ移し、金メダルカードには `medal-chart-card` を付与した。
- `/Users/tnakamura/git/rowing-api/frontend/app/globals.css` で `nth-child` 依存をやめ、`.winner-trend-card` への明示指定へ変更。モバイル時の `.medal-chart-card` / `.winner-trend-card` 幅・高さ制御を分離した。
- フィルターに `主要条件` / `詳細条件` の見出しを追加し、primary側のみ背景トーンと枠線で視覚強調した。
- `docker compose -f /Users/tnakamura/git/rowing-api/docker-compose.yml run --rm frontend sh -lc "npm run lint && npm run build"` は成功（`no-img-element` warning のみ）。

## GA計測改善（検索KPI/フィルター） (2026-03-04)

### Plan
- [x] 1. 既存の `filter_interaction` / `filter_apply` の発火経路を整理し、DOM委譲依存を減らす
- [x] 2. 検索実行のKPIイベント（`search_execution`）を追加し、初期表示を除外した計測へ変更する
- [x] 3. `search_results_loaded` の送信条件を見直し、検索文脈（active filter有無）を付与する
- [x] 4. frontendコンテナで lint/build を実行して回帰確認し、Reviewへ記録する

### Review
- `/Users/tnakamura/git/rowing-api/frontend/app/layout.tsx` から `change/click` ベースのフィルターDOM委譲イベントを削除し、重複・欠損の原因を低減した。
- `/Users/tnakamura/git/rowing-api/frontend/app/page.tsx` で各フィルター操作（select, tab, quick filter, clear, chip clear, organization選択）ごとに `filter_interaction` / `filter_apply` を明示送信するように変更した。
- `search_results_loaded` に `search_context`（`initial` / `filtered`）を追加した。
- `search_execution` を追加し、`activeFilters > 0 && page === 1` の条件でクエリ単位1回/セッションのみ送信するようにした（`sessionStorage` で重複抑止）。
- `docker compose -f /Users/tnakamura/git/rowing-api/docker-compose.yml run --rm frontend sh -lc "npm run lint && npm run build"` は成功（`no-img-element` warning のみ）。

## 検索画面フィルターUI調整（詳細条件の初期折りたたみ） (2026-03-05)

### Plan
- [x] 1. 検索画面のフィルター構成を確認し、主要/詳細のDOM構造を把握する
- [x] 2. 詳細条件をデフォルト折りたたみに変更し、主要条件側は見出し装飾なしの入力群へ簡素化する
- [x] 3. E2Eテスト（filter-selects）を新UIに合わせて更新する
- [x] 4. frontendコンテナで lint/build を実行し、回帰がないことを確認する

### Review
- `/Users/tnakamura/git/rowing-api/frontend/app/page.tsx` に `showAdvancedFilters` state を追加し、詳細条件はトグル操作で表示する構成に変更した（初期値 `false`）。
- 主要条件ブロックから見出し/装飾を外し、条件入力のみの表示に変更した。
- `/Users/tnakamura/git/rowing-api/frontend/app/globals.css` に `advanced-filter-toggle` スタイルを追加した。
- `/Users/tnakamura/git/rowing-api/frontend/tests/e2e/filter-selects.spec.ts` で、詳細条件操作前にトグルを開く手順を追加した。
- `docker compose -f /Users/tnakamura/git/rowing-api/docker-compose.yml run --rm frontend sh -lc "npm run lint && npm run build"` は成功（`no-img-element` warning のみ）。

## UIUXレビュー指摘1〜8の修正 (2026-07-16)

### Plan
- [x] 1. 種目名の表記ゆれ（舵手つき/付き/付・クォ/クオ）をデータ読み込み時に名寄せする
- [x] 2. タイム表記を慣例形式 m:ss.cc（例 6:12.08）へ統一する（time_display再生成＋ツールチップ）
- [x] 3. 性別切替時に矛盾する種目フィルタを自動解除し、セレクト表示と適用フィルタの不整合を解消する（0件トラップ対策：0件時のクリアボタンも追加）
- [x] 4. フィルタ状態（filters/page/per_page）をURLクエリと双方向同期する
- [x] 5. フィルタ直下に「該当N件の結果へ移動」リンクを追加し、モバイルではグラフをデフォルト折りたたみにする
- [x] 6. 優勝タイム推移のY軸をデータ範囲にフィットさせ、単年時は平均タイム＋案内文の表示に変更する
- [x] 7. 団体コンボボックスに「該当なし」表示と未適用時のヒントを追加する
- [x] 8. 大会名セレクトを開催年の新しい順に並べ替える
- [x] 9. tsc/lint/本番build/E2E/ブラウザ実操作（デスクトップ・モバイル）で検証する

### Review
- `/Users/tnakamura/git/rowing-api/frontend/lib/results-data.ts`: `normalizeEventName` / `formatTimeDisplay` を追加し `loadYearResults` で正規化。`competitionsByRecency` で大会名を年降順ソート。
- `/Users/tnakamura/git/rowing-api/frontend/app/page.tsx`: URL同期（復元・書き込み・page優先制御）、性別×種目の矛盾自動解除、`withCurrentOption` によるセレクト表示同期、0件時クリアボタン、結果ジャンプリンク、モバイル用グラフ折りたたみトグル、推移チャートのY軸domain＋単年表示、コンボボックスの該当なし/ヒント表示。
- `/Users/tnakamura/git/rowing-api/frontend/app/globals.css`: 上記UIのスタイル追記（`#results` の scroll-margin 含む）。
- 検証: `tsc --noEmit` / `next lint`（既存warningのみ）/ `next build` 成功。E2Eは filter-selects・mobile-layout 成功。chart-layout はHEADでも失敗する既存問題（優勝タイム推移カードの空状態高さ190pxと他カード260pxの差）で今回のスコープ外。ブラウザ実操作で1〜8全件の挙動を確認済み。
- 備考: `html { scroll-behavior: smooth }` はテスト環境でスクロールが無効化されるため採用せず、既定のハッシュジャンプとした。

## SEO・グロースレビュー優先度高4項目の実装 (2026-07-17)

### Plan
- [x] 1. メインページ(`/`)をServer Component化し、searchParamsから初期データ（結果・統計・フィルタ候補）をSSRする
- [x] 2. `generateMetadata` でフィルタ条件に応じた動的title/description/OGP/canonicalを生成する
- [x] 3. ロングテールSSGページ `/results`（年度ハブ）・`/results/[year]`・`/results/[year]/[competition]` を新設する（パンくず・BreadcrumbList/ItemList/SportsEvent JSON-LD・内部リンク付き）
- [x] 4. sitemap.xml を動的化し、/results 配下の全ページを登録する
- [x] 5. OG画像（/og）を `?title=&subtitle=` 対応の動的カード生成にする
- [x] 6. siteUrl解決を `lib/site-url.ts` に共通化し、layout/robots/sitemap/og/各ページで共用する
- [x] 7. ヘッダー・フッターに「大会結果一覧」リンクを追加、h1をtitleと差別化
- [x] 8. tsc/lint/build/E2E/ブラウザ実操作（dev・本番startの両方）で検証する

### Review
- `/Users/tnakamura/git/rowing-api/frontend/app/page.tsx`: Server Component化。`getFilteredResults`/`buildFiltersResponse`/`buildStats` で初期表示分をSSRし、UIは `app/search-page.tsx`（client）へ移動してprops受け渡し。JSON-LD（WebSite/Dataset）もサーバー側で出力。
- canonical設計: **Next 14はルートパス+クエリのcanonical（`/?year=...`等）をオリジンのみに丸めるバグがある**（絶対URL・URLオブジェクトでも同様、非ルートパス+クエリは正常）。このため、フィルタが静的ページへ対応付く場合のみcanonicalを出す方針にした（年のみ→`/results/{year}`、年+大会→`/results/{year}/{大会名}`、その他の組み合わせ→canonical省略、`?q=`→noindex）。layoutの一律 `canonical: "/"` は撤去（/rowing-results・/supportは各自定義済み）。
- `/results` 配下: 年度ハブ＋年度ページ（種目別優勝クルー表）＋大会ページ（種目別Final A全結果表）。ビルドで74ページSSG（2026年含む17年度×大会、index.json由来で新年度は自動追随）。`[competition]` は多バイトparamsとdevの `dynamicParams:false` 照合の相性問題があるため `dynamicParams:true` + `notFound()` 判定とした。
- `app/search-page.tsx`: ページリセット判定を「初回スキップref」から「baseQueryスナップショット比較」に変更（StrictModeのエフェクト二重実行で `?page=N` 復元が消えるバグを修正）。URL復元はサーバー側initial propsに一本化し、クライアントの復元エフェクトを撤去。
- 検証: `tsc --noEmit` / `next lint`（既存warningのみ）/ `next build` 成功。E2E filter-selects・mobile-layout 成功（chart-layoutは既存問題で対象外）。dev/本番startの両方で、`/?event=男子エイト&page=2` の完全復元、性別切替時のURL同期・ページリセット、/results各ページの表示・canonical・JSON-LD・404、動的OG画像(200/png)、sitemap.xml 78 URLをブラウザ・curlで確認。

## SEO・グロースレビュー優先度中4項目の実装 (2026-07-17)

### Plan
- [x] 1. 元データJSON（frontend/data/results/*.json）の種目名表記ゆれをバッチ名寄せする（scripts/normalize_event_names.mjs、冪等）
- [x] 2. JARAアップデータ（scripts/jara/update_results.rb）のnormalize_eventにも同一の名寄せ規則を追加し、将来データの揺れ再発を防ぐ
- [x] 3. 技術スタックアイコンをcdn.jsdelivr.netから public/icons/tech/ へ自前ホスト化する
- [x] 4. /rowing-results に「大会結果アーカイブ」内部リンク（/results・最新年度・最新大会）とFAQ 4問＋FAQPage JSON-LDを追加、収録期間表記をデータ由来に動的化
- [x] 5. tsc/lint/build/E2E/ブラウザで検証する

### Review
- `scripts/normalize_event_names.mjs`: 17ファイル769行の event_name を名寄せ（舵手付き/舵手付→舵手つき、クオドルプル→クォドルプル）。event_name以外のフィールド・行数が不変であることをgit HEAD比較で検証済み。2回実行で差分ゼロ（冪等）。
- `scripts/jara/update_results.rb`: normalize_event に同一のgsub規則を追加（ruby -c 構文OK、gsubロジックは単体検証済み）。**Dockerデーモン未起動のためCI相当のupdater testはローカル未実行** — 次回CI（update-jara-results.yml）で実行される。
- `frontend/public/icons/tech/`: devicon SVG 6点（計約12KB）を自前ホスト化し、`app/rowing-results/page.tsx` の参照を差し替え。jsdelivrへの参照はゼロになったことをSSR HTMLで確認。
- `frontend/app/rowing-results/page.tsx`: async化して「大会結果アーカイブ」セクション（/results・最新年度・最新年度の各大会への内部リンク、データ由来で新年度に自動追随）と「よくある質問」4問＋FAQPage JSON-LDを追加。「収録データ 2009年から2025年」の古い固定文言を getDatasetSummary 由来（現在2009〜2026年）へ動的化。
- `frontend/app/globals.css`: `.lp-archive-*` / `.lp-faq-*` スタイル追加。
- 検証: `tsc --noEmit` / `next lint`（既存warningのみ）/ `next build`（90ページ、/rowing-resultsは静的のまま）成功。E2E filter-selects・mobile-layout 成功。ブラウザでアイコン6点のロード成功（naturalWidth>0）・FAQ 4件・アーカイブリンク3件・FAQPage JSON-LDをDOM検証（Browser paneのスクロール後スクリーンショットが空になる環境不具合があり、視覚確認はcomputed styleで代替）。

## フォント改善（next/fontによるWebフォント配信） (2026-07-17)

### Plan
- [x] 1. `next/font/google` で Inter + Noto Sans JP（ともに可変フォント）を自己ホスト配信する
- [x] 2. `globals.css` の font-family を `var(--font-inter), var(--font-noto-sans-jp), ...` に変更する（2箇所）
- [x] 3. tsc / build / E2E / ブラウザで検証する

### Review
- `/Users/tnakamura/git/rowing-api/frontend/app/layout.tsx`: Inter（subsets: latin）と Noto_Sans_JP（preload: false）を `variable` 指定で読み込み、`<html>` にクラス付与。
- `/Users/tnakamura/git/rowing-api/frontend/app/globals.css`: font-family を Inter → Noto Sans JP → ヒラギノ → BIZ UDPGothic の順に変更。数字・欧文はInter、和文はNoto Sans JPで全OS統一表示になる。
- 検証: document.fonts で両フォントの読み込みを確認、テーブルのタイム表示がInterで描画されることを目視確認。`tsc --noEmit` / `next build` / E2E(filter-selects, mobile-layout) 成功。

## UIデザイン改善（toC向けビジュアルパス） (2026-07-17)

### Plan
- [x] 1. タイポグラフィ階層の整理（本文400/ラベル500/操作600/見出し・数値700）
- [x] 2. カラー整理: チャートをブランドブルー＋ゴールドの2系統に統一（旧: オレンジ2種＋緑）
- [x] 3. ヒーロー刷新: H1短縮「ローイング大会結果データベース」＋実績チップ（収録レース数・期間・対象大会）＋波モチーフ
- [x] 4. 種目未選択時は優勝タイム推移カードを非表示（空箱が一等地を占有していた）
- [x] 5. チャート磨き込み: 角丸バー・値ラベル・グリッド簡素化・ツールチップ統一・英語サブラベル日本語化
- [x] 6. テーブル: 全順位を丸バッジ化（メダル色維持）・タイム右揃え・ヘッダ強調・行ホバー
- [x] 7. モバイル: 結果ジャンプをプライマリボタン化＆全幅、カードの団体重複を非表示
- [x] 8. tsc / build / E2E / ブラウザ（デスクトップ・モバイル）検証

### Review
- `/Users/tnakamura/git/rowing-api/frontend/app/search-page.tsx`: ヒーロー刷新、チャート配色定数化(CHART_BLUE/CHART_GOLD)、LabelList追加、推移カードの条件レンダリング、順位バッジ化、モバイルカードの団体重複排除。
- `/Users/tnakamura/git/rowing-api/frontend/app/globals.css`: デザインパス用スタイル追記（タイポ階層オーバーライド、hero-stats/波モチーフ、rank-badge、テーブル磨き込み、モバイル調整）。
- バグ修正: モバイルのグラフ折りたたみ解除時にResizeObserverが発火せず幅0のままチャートが描画されない問題を、chartsExpanded/eventを幅計測エフェクトの依存に追加して解消。
- 検証: tsc / next build / E2E(filter-selects, mobile-layout) 成功。chart-layout は仕様変更（推移カードの条件表示）に伴い書き直しが必要（既存失敗テスト、タスクチップ発行済み）。

## Vercel移行（プロジェクト作成〜Git連携デプロイ） (2026-07-19)

### Plan
- [x] 1. Vercelプロジェクト `rowing-api` を作成しfrontendをリンク（Hobbyプラン、CLI認証済みアカウント）
- [x] 2. `frontend/vercel.json` を追加（buildCommand: next build ※Docker用NEXT_DIST_DIRを回避、regions: hnd1）
- [x] 3. プレビューデプロイで動作検証（SSR・APIルート・チャート）
- [x] 4. GitHubリポジトリ連携＋Root Directory=frontend をAPIで設定
- [x] 5. push起点の本番デプロイが成功し https://rowing-api-ashy.vercel.app で公開されることを確認
- [x] 6a. NEXT_PUBLIC_SITE_URL=https://rowing-api-ashy.vercel.app をproductionへ設定・redeploy済み（2026-07-19。独自ドメイン確定時は値を差し替えて再デプロイ）
- [ ] 6b. NEXT_PUBLIC_GA_MEASUREMENT_ID 設定 ※GA ID提供待ち
- [x] 7a. 本番ドメインDNS切替（2026-07-19: NEXT_PUBLIC_SITE_URL=https://rowing-api.com へ差し替え→ドメインをVercelプロジェクトに追加→redeploy→Route53のapex AレコードをVercel（216.198.79.1/64.29.17.1）へUPSERT。SSL(Let's Encrypt)・canonical/OGP・主要ページ・API v1のJSON応答を本番検証済み。ロールバックはAレコードを18.178.211.215へ戻すだけ）
- [x] 7b. 旧環境の廃止（2026-07-19完了）: ci-deploy-prod.yml削除（74ede55）→ EC2/EIP/SGをterraform targeted destroy → self-hostedランナー登録解除 → ECRイメージ・リポジトリ/OIDCプロバイダ/IAMロール一式をterraform destroy。terraform state空・ECR NotFound・OIDC 0件を確認。インフラはVercel（Hobby）+ Route53のみに。

### Review
- 初回デプロイは `npm run build` の `NEXT_DIST_DIR=.next-build` により出力先不一致で失敗 → vercel.json の buildCommand 上書きで解決。
- プレビューURLはDeployment Protection(要Vercelログイン)のためChromeの実セッションで検証。
- 本番URLで検索(364件)・URLフィルタ復元・API v1(JSON)・タイム表記を確認。JARA自動更新のcommit→pushがそのまま自動デプロイに繋がる構成になった。
- 注意: NEXT_PUBLIC_SITE_URL未設定のため、canonical/OGPがlocalhostフォールバックの状態。ドメイン確定後に設定要。
  → 2026-07-19 対応済み。vercel.app本番URLをproduction環境変数に設定しredeploy。canonical/og:url/og:imageが本番URLで出力されることをcurlで確認。

## マーケレビュー優先度高対応（団体ページ・歴代記録・シェア導線・本番URL） (2026-07-19)

### Plan
- [x] 1. NEXT_PUBLIC_SITE_URL をVercel productionへ設定しredeploy・curl検証
- [x] 2. 団体ページ `/organizations` `/organizations/[slug]`（274団体、通算メダル・種目別ベスト・年度別戦績、SportsOrganization JSON-LD）
- [x] 3. 歴代記録ランキング `/records` `/records/[event]`（30種目、歴代最速Top20、ItemList JSON-LD）
- [x] 4. Xシェアボタン（`app/components/share-x-link.tsx`）を大会ページ種目見出し・団体ページ・記録ページに設置
- [x] 5. sitemap.xml へ records/organizations 系URLを追加、ヘッダー/フッターに「歴代記録」「団体別」ナビ追加、大会結果テーブルの団体名を団体ページへ内部リンク化

### Review
- 団体名に `/` を含むケース（CRIMSON/GANG等）があるため `organizationSlug()` で `--` に置換し、復元は一覧との突き合わせ（`findOrganizationBySlug`）で行う。
- 歴代記録はFinal A/B両方を対象（データはFinal A/Bのみ収録、time_seconds不正値0件を確認済み）。
- 検証: next build（org 274 + records 30ページの静的生成を確認）/ next lint（新規エラーなし）/ dev serverで records・organizations・大会ページのシェアボタン・内部リンク・コンソールエラーなしを確認。
- 未対応（優先度中以下）: 個人結果カードOGP、選手ページ、種目単位の大会ページ、RSS等リテンション導線。
  → 優先度中は下記セクションで対応済み（2026-07-19）。

## マーケレビュー優先度中対応（選手ページ・種目単位ページ・RSS） (2026-07-19)

### Plan
- [x] 1. 選手個人ページ `/athletes` `/athletes/[name]`（シングルスカル543名、種目別自己ベスト・出場レース一覧・個人OGPカード・シェアボタン・Person JSON-LD）
- [x] 2. 種目単位の大会ページ `/results/[year]/[competition]/[event]`（653ページ、Final A/B全結果、優勝者入りOGP・シェアボタン）
- [x] 3. RSSフィード `/feed.xml`（大会単位58件・年降順、layoutにalternate+フッターRSSリンク）
- [x] 4. 内部リンク: 大会ページ種目見出し→種目ページ、スカルのクルー名→選手ページ（大会・記録ページ）、sitemapへathletes/種目ページ追加（計約2,200URL）
- [x] 5. ナビに「選手別」追加

### Review
- 個人名が取れるのはシングルスカルのみ。`isAthleteRecord()` で判定し、`crew_name === organization` の欠損4行は除外。選手ページには同姓同名集約・団体種目非収録の注記を明示。
- 「個人結果カードOGP」はX intentに任意画像を添付できないため、選手ページ/種目ページのOGP（自己ベスト・優勝者入り）として実装。シェアURLのカードで同等の効果を出す方式。
- グローバル `table { table-layout: fixed }` が静的ページの多列テーブルにも適用され長い大会名がセルからはみ出すバグを発見 → `.static-table { table-layout: auto }` で上書き修正。
- 検証: next build（静的1,591ページ）/ next lint エラーなし / devで選手・種目ページ・feed.xml（XML valid）・検索ページ無影響・コンソールエラーなしを確認。

## Vercel Web Analytics導入 (2026-07-20)

### Plan
- [x] 1. @vercel/analytics を導入し layout に <Analytics /> を追加（d028021）
- [x] 2. ダッシュボードで有効化（ユーザー操作）→ 反映には再デプロイが必要なため redeploy 実施
- [x] 3. 本番で計測動作を確認

### Review
- 有効化直後は /_vercel/insights/script.js が404 → 仕様上、有効化後の再デプロイで配信開始。
- 本番(rowing-api.com)でスクリプト読込200・ページビュービーコン POST 200 を確認。スクリプトは難読化パス（/e03ad93f…/script.js）で配信される（アドブロッカー回避のVercel仕様）。
- GA4は併存中。日常のアクセス把握はVercel Analytics、North Star KPI(search_execution等のカスタムイベント)はGA4継続。KPI表示の簡素化(Looker Studio 1枚 or Umami/Plausible移行)は今後の選択肢。

## Clubhouseデザイン全面適用（モバイルファースト） (2026-07-20)

### Plan
- [x] Phase 1: デザイントークン再定義（:root変数拡張、旧パレット→新パレットの一括置換、背景グラデ）
- [x] Phase 2: 検索ページ（カード角丸24px・入力2px枠/44px高・ピルボタン・オレンジCTA・チャート #4d94ff/#ffb84d）
- [x] Phase 3: 周辺ページ（/records /organizations /rowing-results 等はトークン波及で追随を確認。LPの旧UIスクショ lp-fv-screenshot.png を新デザインで再生成）
- [x] Phase 4: 状態磨き（フォーカスリング・ホバー・ページネーション active・単年表示の色）
- [x] Phase 5: 検証（tsc / build / E2E 2本成功。モバイル390・デスクトップ1280でスクショ確認）

### Review
- `/Users/tnakamura/git/rowing-api/frontend/app/globals.css`: :rootにClubhouseトークン（--accent, --radius-card等）を新設し、旧色をperlで一括置換。末尾にClubhouseレイヤー（ピル化・角丸・CTA）を追加。カードは枠線なし+ソフトシャドウに統一。
- `/Users/tnakamura/git/rowing-api/frontend/app/search-page.tsx`: チャート配色を #4d94ff / #ffb84d に、ツールチップ・軸ラベルも新トークンへ。
- CTAはオレンジ地 #ff8a3d + 濃色文字 #46240a でコントラスト確保（白文字はAA未達のため不採用）。
- デザイン方向はA/B/C比較（design-concepts/ にPNG保存）からユーザーがCを選択。

## SEO改善（優先度高: title最適化・不要スクリプト排除） (2026-07-20)

### Plan
- [x] 1. 大会別・イベント別結果ページのtitleに「ローイング」を注入（大会名に既に含む場合は二重回避の条件分岐）
- [x] 2. 団体別・選手別・歴代記録ページのtitleに「ボート」を追加（旧称クエリ対策: 「◯◯のローイング・ボート記録」等）
- [x] 3. Figmaキャプチャスクリプト（mcp.figma.com）を開発環境限定に変更（本番のCWV・セキュリティ配慮）
- [x] 4. tsc / build / E2E で検証、devサーバーで各ページのtitleタグを実測確認

### Review
- 変更ファイル: results/[year]/[competition]/page.tsx、同[event]/page.tsx、organizations/[slug]/page.tsx、athletes/[name]/page.tsx、records/[event]/page.tsx、layout.tsx
- 実測: 「第103回全日本ローイング選手権大会（2025年）結果」（二重回避）/「第88回全日本選手権大会（2010年）ローイング結果」（旧称に注入）/「早稲田大学のローイング・ボート記録」
- 背景: 競技名が「ボート」→「ローイング」に改称された経緯があり、旧称系クエリ（団体名+ボート 記録 等）の取りこぼし防止が目的（marketerレビュー起点）
- 優先度中の項目（本文へのボート/漕艇の自然な言及・sitemap lastModified・SportsEvent構造化データ）は未着手

## SEO改善（優先度中） (2026-07-20)

### Plan
- [x] 1. 団体別ページの本文に「ボート・漕艇」を自然に1箇所追加（h1も「ローイング・ボート記録」へ統一）
- [x] 2. sitemap.tsのlastModifiedをデータ由来に（過年度=年末日付、最新年度=現在時刻。団体/選手/種目は最終掲載年から算出）
- [x] 3. robots.tsに Disallow: /api/ を追加（クロール予算節約）
- [x] 4. SportsEvent構造化データ → 調査の結果、既に実装済みと判明（レビュー時の見落とし）。対応不要
- [x] 5. tsc / build / E2E、devでrobots.txt・sitemap.xml・団体ページ本文を実測検証

### Review
- 変更: organizations/[slug]/page.tsx（h1・subtitle）、app/sitemap.ts、app/robots.ts
- sitemap実測: /results/2010系がビルド時刻→2010-12-31(JST)に。トップ等の静的ページはnow維持
- 本文の「ボート・漕艇」は団体ページのsubtitle 1箇所のみ（競艇との語衝突を避け複合語で自然に）

## サブタイトル整理（ヒーロー圧縮） (2026-07-20)

### Plan
- [x] 1. 英語装飾ラベル(hero-kicker)を全ページから削除（CSSの残骸も掃除）
- [x] 2. 検索トップのsubtitle削除（実績チップと重複のため）
- [x] 3. 詳細ページのsubtitleを1文に圧縮（団体=銀銅は直下のメダルカードと重複、種目記録=最速記録はランキング1位と重複、選手=大会名を省略）
- [x] 4. 一覧ページ（organizations/records/athletes/results）は実情報のため現状維持
- [x] 5. tsc / build / E2E、モバイル390pxでファーストビュー改善を確認

### Review
- モバイルのファーストビューが圧縮され、検索トップでは結果ヘッダまで1画面に収まるようになった
- SEOへの影響: キーワードはtitle/description/h1が担っており本文削減の影響は軽微

## GA4計測の復旧（Vercel移行後の停止対応） (2026-07-20)

### Plan
- [x] 1. NEXT_PUBLIC_GA_MEASUREMENT_ID（G-3WVHGY2Z3S）をVercel Production環境変数に設定
- [x] 2. 本番を再デプロイして反映
- [x] 3. 本番検証: gtag読み込み（正しいID）・page_view送信・カスタムイベント（search_execution等）のdataLayer流入を確認
- [x] 4. Looker Studio KPIダッシュボード手順書（docs/kpi-dashboard.md）をコミット

### Review
- Vercel移行（7/19）〜本日までGA4は計測停止していたため、この期間のデータは欠損（復旧不能）
- Vercel Web Analyticsは並行稼働中。日常はVercel、KPI（週次検索実行数）はGA4+Looker Studioの役割分担

## メディア記事によるSEO強化 (2026-07-21起票)

### Plan
- [x] 1. ブログ基盤の実装: `/articles` セクション(一覧+記事ページ、Article構造化データ、sitemap組み込み、OG対応)
- [x] 2. 1本目: 自前データ分析記事のドラフト「データで見る大学ボート勢力図(過去17年)」— 5,400レースのDBから集計、図表付き
- [ ] 3. 2本目以降の候補: 大会ガイド(「全日本ローイング選手権とは」)→入門・用語系→エルゴ系(アフィリエイト布石)の優先順
- [ ] 4. 運用方針: 月2〜4本まで・データの裏付け必須(AI量産はscaled content abuse対策として回避)。ドラフトはClaude、体験・所感はユーザーが加筆

### メモ
- 狙い: DBページだけでは拾えない裾野クエリの受け皿+被リンク獲得+サイト品質シグナル
- 着手タイミングは自由(インデックス処理待ちと並行可)。8/1の定点観測結果と合わせて優先度を再確認

### Review (2026-07-21 1-2完了)
- /articles(一覧)+ /articles/university-power-map-2009-2025 を公開。集計はビルド時に実データから実施(2009-2025固定)
- 発見: 日大累計67個だが2018年以降はペース半減、仙台大2→14個で台頭、年別最多も7個→3-5個で群雄割拠化
- Article JSON-LD・OGP・ナビ/フッター・サイトマップ対応済み。大会名の表記揺れ(大学選手権/大学ローイング選手権)は正規表現で吸収
- 3本目以降は未着手。記事公開のX告知は別途

## 記事カレンダー 2026年度後半 (2026-07-22作成)

運用方針: 記事は完成したら即公開(月2〜4本上限)。ストックするのは記事ではなくネタと集計。公開タイミングは大会日程に従属させ、ガイド記事は大会3〜4週間前に出す。X告知は「公開直後」+「大会直前の再掲」の2回。

### 大会日程(JARA公式 2026年度)
- 第53回全日本大学ローイング選手権(インカレ): 8/26(水)-30(日) 戸田 ※オックスフォード盾レガッタ併催
- 第67回全日本新人ローイング選手権: 10/23(金)-25(日) 戸田
- 第104回全日本選手権: 6/4-7 済み(収録済み)
- 全日本軽量級: 2026年度日程は公式未記載(判明したら追記)

### 公開スケジュール
- [x] 【〜8/5公開】インカレガイド記事「全日本大学ローイング選手権とは|日程・種目・歴代優勝クルー」(2026-07-22公開: /articles/university-championship-guide)
      - 大会3週間前。検索需要の立ち上がりに合わせる。歴代優勝はDBから自動集計、/results・勢力図記事へ内部リンク
      - X告知: 公開時 + 8/25前日に再掲
- [ ] 【9月上旬】インカレ結果データ記事「2026年インカレで勢力図はどう動いたか」
      - 2026年結果のデータ反映後。勢力図記事(university-power-map)の続編として内部リンクで往復
- [ ] 【10月上旬(〜10/2)】新人戦ガイド記事「全日本新人ローイング選手権とは」
      - 大会3週間前。X告知2回の運用同上
- [ ] 【9月中旬〜10月の谷間】エバーグリーン分析「優勝タイムは速くなっているのか|種目別17年推移」
      - 季節非依存。既存の優勝タイム推移データを活用
- [ ] 【11月〜冬】オフシーズン枠: 入門・用語記事(「レガッタとは」等)、エルゴ関連記事
      - 冬はエルゴシーズン(大学の冬トレ・エルゴテスト時期)。アフィリエイト布石はここから

### 各記事の共通フロー
作成 → article-review(校正サブエージェント) → 要修正反映 → 公開 → X告知(humanizer-ja適用)

## Next 16 への更新と OpenNext 回避フラグの撤去 (2026-10-21)

背景: `@opennextjs/cloudflare` 1.20 の build が Next 15.5 を「公開から2年でサポート外」として拒否し、CI の Deploy to Cloudflare が失敗。aff9014 で `--dangerouslyUseUnsupportedNextVersion` を付けて暫定復旧した。根本対応として Next 16 へ上げる。

### Plan
- [x] 1. `next` 16.4.2 / `eslint-config-next` 16.4.2 / `@opennextjs/cloudflare` 1.20.12 / `wrangler` 4.151 に更新(OpenNext 1.20.12 の peer は `next >=16.4.1`)。react 19.2 は Next 16 の要件(19.2+)を満たすので据え置き
- [x] 2. 破壊的変更の対応: `next lint` 廃止 → ESLint 9 + flat config、`webpack` カスタム設定(dev キャッシュ無効化)は Turbopack 既定化で不要になるので削除、params/searchParams の Promise 化は 15 で対応済みなので確認のみ
- [x] 3. `cf:build` / `cf:preview` / `cf:deploy` からフラグを外し `npm run cf:build` を通す
- [x] 4. `npm run lint` / `npx tsc --noEmit` / `npm test` / `npm run build` を通す
- [x] 5. dev サーバーでホーム・検索・大会・選手・記事・/og を目視確認(見た目は変えない)
- [x] 6. コミット(push は指示待ち)

### Review
- 更新後の版: next 16.4.2 / eslint-config-next 16.4.2 / eslint 9.39 / @opennextjs/cloudflare 1.20.12 / wrangler 4.151.3。react・react-dom は 19.2.0 のまま(Next 16 の要件は 19.2+。OpenNext 1.20.12 は `next >=16.4.1` を要求するので 16.3 以下では解決しない)
- `next lint` 廃止: 公式 codemod `next-lint-to-eslint-cli` で `lint: eslint .` へ。生成された eslint.config.mjs は不要な `path`/`__dirname` を落として整理し、.eslintrc.json / .eslintignore は削除。CI は lint を回していないので workflow の変更は不要
- eslint-config-next 16 に同梱の react-hooks 7 で新ルール `set-state-in-effect` が app/search-page.tsx のページ番号→入力欄の同期 effect をエラーにした。React 公式の「レンダー中に前回値と比較して setState」パターンへ置き換え(挙動は同じ)。`.next-dev-preview2/` の古いビルド産物も lint 対象に入っていたので globalIgnores で除外
- `next.config.mjs` の `webpack` カスタム(dev のキャッシュ無効化、ca6ee22)は Turbopack 既定化で `next build` が拒否するため削除。Turbopack はこのキャッシュ設定を持たない
- Turbopack(lightningcss)が globals.css の記事セクション冒頭コメント(`.article-card*/` と書いていた箇所)を途中でコメント終端と解釈して dev が 500 になった。コメントの表記を変えて解消。`next build` は通っていたので dev のみの事象
- Next 16 が tsconfig.json(`jsx: react-jsx`、`<distDir>/dev/types` の include)と next-env.d.ts(`import` 形式、root-params.d.ts)を書き換える。distDir が 3 つ(.next / .next-dev / .next-build)あるので dev/types の include は 3 つとも先に入れ、以後の churn を防いだ
- 検証: `npm run build` / `npm run cf:build`(フラグなし)/ `npm run lint` / `npx tsc --noEmit` / `npm test` すべて成功。dev サーバー(5174)でホーム・/search?year=2025・大会・選手・記事・/og?title=test を本番とスクリーンショット比較して差分なし。さらに `wrangler dev` で .open-next/worker.js を起動し、同じ 8 ルートが Workers ランタイムで 200 を返すことを確認(/og は image/png)
- 見送り: ESLint 10(eslint-config-next 16.4 は対応しているが、今回は codemod が入れた 9 系に留めた)、React 19.3 / @types/react 19.3(必須ではない)、React Compiler・cacheComponents(未採用のまま)
- push と本番デプロイは指示待ち

## 記事レビューに読者体験の段階と品質ループを追加(2026-10-22)

- [x] `.claude/agents/article-reader-reviewer.md` を新設。記事の種類ごとの既定読者(大会ガイド/結果記事/分析/用語集・入門)と「開く場面」を決め、最初の一画面・情報の順番・見出し・導線・前提知識を見る。指摘に高/中/低を付け、高・中が無ければ「合格」。2回目以降は前回の指摘を1件ずつ判定し、新しい「低」は出さない
- [x] `article-review` スキルを 1 読者体験 → 2 yomiyasu → 3 校正 の3段階にし、1 と 3 は判定が合格になるまで「修正 → 再レビュー」を繰り返す(上限3回、見送りは方針違反と事実の消失だけ)。article-proofreader にも「判定」行を追加
- [x] 動作確認: 新人ガイドで1回目を回し、要改善(高1・中5・低2)の報告が定義どおりの形式で返ることを確認。記事への反映は別途

### Review
- 読者体験は構成を動かすので、文章を整える yomiyasu の前に置いた。校正の「構成・読みやすさ」と重なる部分は、順番・導線・表の取捨選択を 1、リード・見出しの論理・用語補足・まとめを 3 に振り分けた
- ループが終わらないのを防ぐため、レビュー側に「2回目以降は基準を動かさない」、メイン側に「上限3回」と「見送ってよい条件」を固定した

## 新人ガイド記事に article-review のループを適用(2026-10-22)

- [x] 読者体験(article-reader-reviewer): 1回目 要改善(高1・中5・低2)→ 2回目 要改善(修正で生じた中1・低2)→ 3回目 合格。構成を「どんな大会か → 大会期間中の結果の見方 → 日程と会場 → 出場できる人 → 種目構成 → 2025年の優勝クルー → 男子エイトの歴代 → 最速タイム → (年別の結果記事) → 記録を検索する → 注記」に組み替え、JARA の結果・競漕日程・エントリー表へのリンク、3日間の流れ(競漕日程 10/22 時点)、出場資格の箇条書き、用語集・インカレガイドへの導線を追加。結果記事が0件のときは h2 を出さない。最速タイムの表は「タイム(年)」の3列に
- [x] yomiyasu: 新しい地の文の静的検査(93→98点)。4箇所(予定の文末、長文の分割、エルゴ補足の独立、「年のリンクから」)
- [x] 校正(article-proofreader): 1回目 要改善(手書き事実5件: 「例年10月下旬」→「10月から11月にかけて」(2017〜2025の期日を JARA で確認)、24日の Final 範囲 C〜L、出場資格の前提と混成の扱い、インカレとの違いの言い方、臨時駐車場は出場団体向け。推奨7件も実装: 毎年n種目を全年で判定、2026年データ投入後に自動で文言が切り替わる `awaitingResults`、updatedAt)→ 2回目 合格。注意2件(要項にない括弧書きの削除、更新日の表示を formatDate に)も反映
- [x] スマホ幅で積み表示のセル(クルー名+団体リンク、タイム+年リンク)が flex で散らばっていたので `<span>` で包んだ

### Review
- ループは 読者体験3回・校正2回 で収束した。2回目以降に「新しい低は出さない」「前回の指摘を1件ずつ判定」を定義しておいたので、基準が動かず終われた
- 手書きの事実は一次情報の URL と確認日を本文に残す。校正側がそのまま突き合わせられる

## 下書き記事 first-regatta(はじめてのボート大会)を仕上げて公開(2026-10-22)

- [x] 未コミットの下書き(2026-08 作成、どのブランチにも無かった)を静的エクスポート後の OG 方式(`ARTICLE_OG` + `ogImages(articleOg(meta))`)へ移行。旧 `public/og-thumb/first-regatta.png` は削除。publishedAt を公開日 2026-10-22 に
- [x] 手書きの数字(Final B 2,785件 → 実データ 2,841件で古くなっていた、男子エイトの中央値の幅、最速との差、収録大会数)をすべてビルド時集計に置き換え
- [x] 読者体験(article-reader-reviewer): 1回目 要改善(高3・中4・低1: 大会ガイドへの導線なし、結果の見方が末尾FAQに埋もれる、家族・友人の入口なし ほか)→ 2回目 要改善(修正で生じた中1)→ 3回目 合格。h2 を エントリー → 当日の流れ → 予選から決勝 → 結果はどこで見られるか → タイムの見方 に。FAQ は本文に統合。表は女子2種目を足して5種目、列名は「中央値」
- [x] yomiyasu: 静的検査は文末の連続のみ。本文は変えず
- [x] 校正(article-proofreader): 1回目 要改善(「決勝はA・Bに分かれます」が新人ガイドの Final C〜 と矛盾 → 段数は大会で違うと明記。推奨: 歴代最速/全期間の最速の明記、太字+コロン → 太字+句点、推量と表記の統一、記事末の次に読むもの)→ 2回目 合格
- [x] dev サーバーでスマホ幅・PC 幅の表示を確認(積み表示の5行表、ページ内アンカー)。lint・tsc・build 通過

### Review
- 下書きの手書き数字は2か月で実データとずれていた(Final B 件数)。記事の数字は最初から式で出す方針を徹底する
- 入門記事でも「読者がどこへ飛ぶか」(要項・速報・結果)が高の指摘になった。導線は記事の種類に関係なく最初に見る

## 新人ガイドを「大会説明は薄く、データ分析を厚く」に作り直し(2026-10-22)

- [x] 大会説明を「大会の概要」1節(速報・日程・大会ページ → 名称・種目・資格)に圧縮。日程と会場・出場できる人の節は廃止
- [x] データの節を7つに: 2025年の優勝クルーと2位との差(GapBars、連覇表示)/ 男子エイトの歴代(3列+年別結果ページへのリンク)/ 優勝回数の多い団体(棒グラフ上位10、何種目で勝ったか)/ 種目別の優勝団体数・最多優勝・最長の連続優勝 / 大学以外の優勝(所属別件数、大学が独占した年、26件の一覧、高校8校・社会人など7団体)/ 接戦だった決勝(平均差、1秒未満の件数、上位8)/ 種目別の優勝タイムの幅。すべてビルド時集計
- [x] 読者体験: 1回目 要改善(中6・低2: 速報が遠い、種目一覧の重複、Final A の補足、年ごとの歴代、節の順、年×所属表が長い)→ 2回目 合格
- [x] yomiyasu: 静的検査のみ(文末の連続と意味を担う「ではなく」)
- [x] 校正: 1回目 要改善(全集計は再集計と一致。要修正は「32にのぼります」の単位抜け。推奨: 資格要約の「一般団体」「中学卒業」、「唯一の大型艇」、ヒタ市・関西電力の事業所別の注記、GapBars との重複、コロン)→ 2回目 合格。ビルドはバックグラウンドで実行中のまま使用上限に達したため、結果は次のセッションで確認する

## 検証・push とリダイレクト Worker の Route 化(2026-10-22)

- [x] 前セッションで未確認だった新人ガイド作り直し(ad22497)の検証: `npm run lint`(エラー0・既存の `<img>` 警告1)/ `npx tsc --noEmit`(0)/ `npm test`(19件)/ `npm run build`(OG 1,971枚)すべて成功。出力HTMLの h2 がデータ中心の構成に入れ替わっていることも確認
- [x] ad22497 を push。Deploy to Cloudflare 成功(2分9秒)、本番の記事2本が200
- [x] 未コミットだった2件を分けてコミットし push: 8e0182e(tsconfig に `.next-dev-preview/dev/types` を追加)、5269e82(リダイレクト Worker を `custom_domain` から Workers Route へ)
- [x] e7d585c: `.gitignore` に `infra/ec2/` の state・backup・tfvars・`.terraform/` を追加(`infra/github/` しか塞いでいなかった)。`git check-ignore` で4つとも確認
- [x] `workers/rowing-api-redirect` で `wrangler deploy`。トリガーは `rowing-api.com/*` (zone name: rowing-api.com)、Version ID 823db74d-544e-4d44-8d04-06e039f886e4

### Review
- `deploy-cloudflare.yml` の paths は `frontend/**` と workflow 自身だけなので、`.gitignore` や `workers/` の変更では CI は動かない。Worker は手で `wrangler deploy` する必要がある
- wrangler の OAuth は保存済み認証(8/4)が失効していて、Bash からは非対話で弾かれた。ターミナルタブで実行して認可。認可コードの待ち受けは2分程度で閉じるので、ブラウザでの承認はその場で済ませる
- デプロイ前後で同じ5URLを突き合わせ、301の挙動とパス・クエリの引き継ぎに差分がないことを確認した。`www.rowing-api.com` は前後とも名前解決せず(000)。Route のパターンに www は含まれないので、拾うなら DNS と Route の追加が要る
- 未着手: `infra/ec2/` は `.tf` が1つもなく state と lock だけが残っている。削除するか管理下に戻すかは保留
