# RowingAPI

日本ローイング協会の大会記録を検索・可視化する Next.js サービスです。

## 構成
- Frontend/API: Next.js (App Router)
- Data: 年度別JSON (`frontend/data/results/*.json`)
- Reverse Proxy: Caddy (production)

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
使用ファイル:
- `docker-compose.prod.yml`
- `deploy/Caddyfile`
- `deploy/.env.prod.example`
- `frontend/Dockerfile.prod`
- `deploy/scripts/deploy_prod.sh`

### 1) 設定
```bash
cp deploy/.env.prod.example deploy/.env.prod
```

必須値:
- `DOMAIN`
- `ECR_REGISTRY`
- `ECR_REPOSITORY_FRONTEND`

任意:
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`（GA4を使う場合）

### 2) 起動
```bash
docker compose -f docker-compose.prod.yml --env-file deploy/.env.prod up -d
```

### 3) デプロイ更新
`/etc/rowing-api/.env.prod` を優先利用します。

```bash
bash deploy/scripts/deploy_prod.sh
```

## CI/CD
- Workflow: `.github/workflows/ci-deploy-prod.yml`
- 実行内容:
  1. frontend image を ECR へ build/push
  2. self-hosted runner (EC2) で pull / up

## データ更新
現在の本番データは `frontend/data/results/` 配下の年度別JSONを利用します。
