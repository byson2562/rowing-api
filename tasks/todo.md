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
