# レガッタナビ (regattanavi)

日本ローイング協会の大会記録を検索・可視化する Next.js サービスです。旧名称は RowingAPI（リポジトリ名・既存ドメイン rowing-api.com に名残があります）。

## 構成
- Frontend/API: Next.js (App Router)
- Data: 年度別JSON (`frontend/data/results/*.json`)
- Hosting: Vercel (production)

## ローカル起動
```bash
docker compose up --build
```

- App: [http://localhost:5173](http://localhost:5173)
- API (Next Route): `http://localhost:5173/api/v1/results`
- Health: `http://localhost:5173/health`

## E2E
Playwright 依存ライブラリを含む専用サービスで実行します。

```bash
docker compose run --rm frontend-e2e
```

## Production
本番は Vercel でホストしています（https://rowing-api.com）。

- デプロイ: `main` への push で自動デプロイ（Root Directory: `frontend`、`frontend/vercel.json` 参照）
- DNS: Route53 の apex A レコードが Vercel を指す
- 環境変数（Vercel の Production に設定、ビルド時埋め込みのため変更後は再デプロイ要）:
  - `NEXT_PUBLIC_SITE_URL=https://rowing-api.com`
  - `NEXT_PUBLIC_GA_MEASUREMENT_ID`（任意、GA4を使う場合）

旧EC2/ECR/self-hostedランナー構成は2026-07に廃止済み（経緯は `tasks/todo.md` 参照）。

## データ更新
現在の本番データは `frontend/data/results/` 配下の年度別JSONを利用します。
