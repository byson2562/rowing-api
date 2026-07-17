# Next.js一本化 (DBレス化) タスク

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
