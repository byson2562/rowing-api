# Next.js一本化 (DBレス化) タスク

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
