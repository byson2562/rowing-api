# smart-rowing

日本ローイング協会の大会記録データを検索・可視化するための構成です。

- Frontend: React (Next.js App Router)
- Backend: Rails API
- DB: MySQL 8
- Runtime: docker compose

## 起動

```bash
docker compose up --build
```

起動後:

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Health check: http://localhost:3000/health
- MySQL(host): localhost:3307

## API

### 検索

`GET /api/v1/results`

クエリ:

- `q`: キーワード（大会名・種目・クルー・所属）
- `year`: 年
- `event`: 種目名
- `competition`: 大会名
- `organization`: 所属名
- `rank_from`, `rank_to`: 順位範囲
- `time_from`, `time_to`: タイム秒範囲
- `limit`: 上限件数（デフォルト100、最大500）

例:

```bash
curl "http://localhost:3000/api/v1/results?year=2024&event=シングルスカル&rank_to=3"
```

### 集計

`GET /api/v1/results/stats?group_by=...`

- `year_count`: 年別レコード件数
- `organization_medals`: 所属別メダル数(1〜3位)
- `event_count`: 種目別件数
- `winner_time_trend`: 優勝タイムの年次平均(秒)

例:

```bash
curl "http://localhost:3000/api/v1/results/stats?group_by=winner_time_trend"
```

## ETL / データ取り込み

### 1) スクレイピングでCSV生成

```bash
docker compose exec backend bundle exec rake data:scrape_results SOURCE_URL="https://example.com/results.html" OUTPUT_CSV="/app/data/source/scraped_results.csv"
```

### 2) CSVをDBへ取り込み

```bash
docker compose exec backend bundle exec rake data:import_results CSV_PATH="/app/data/source/scraped_results.csv"
```

- CSVの列: `year,competition_name,event_name,crew_name,organization,rank,time`
- `time` は `7:00.4` または `420.4` 形式を受け付けます。
- 所属名や種目の表記揺れを一部正規化します（例: `慶応義塾大学 -> 慶應義塾大学`, `M1X -> 男子シングルスカル`）。

## フロント表示

Next.js UI で以下を表示します。

1. 年別レコード件数
2. 所属別メダル数(上位10)
3. 優勝タイム推移
4. 検索結果テーブル

## JARA実データ取り込み（年度単位）

```bash
docker compose exec backend bundle exec rake data:import_jara_year YEAR=2025
```

- 取得元: `https://www.jara.or.jp/race/<YEAR>/`
- 年度ページの国内大会リンクを巡回し、各種目ページの `Final` の順位・2000mタイムを取り込みます。
- 出力CSV: `backend/data/source/jara_<YEAR>.csv`

## テスト

### Backend (フィルタの挙動)

```bash
docker compose exec backend bundle exec rails test
```

### Frontend E2E (select連動)

```bash
docker compose exec frontend npx playwright install --with-deps chromium
docker compose exec frontend npm run e2e
```

## EC2 Terraform定義

EC2で構築する場合は以下を利用してください。

- `infra/ec2/main.tf`
- `infra/ec2/variables.tf`
- `infra/ec2/outputs.tf`
- `infra/ec2/templates/user_data.sh.tftpl`
- `infra/ec2/terraform.tfvars.example`
- `infra/ec2/README.md`

## Lightsail向け本番構成

追加した本番用ファイル:

- `docker-compose.prod.yml`
- `deploy/Caddyfile`
- `deploy/.env.prod.example`
- `frontend/Dockerfile.prod`
- `backend/Dockerfile.prod`
- `deploy/scripts/deploy_prod.sh`
- `deploy/scripts/backup_mysql.sh`
- `deploy/scripts/restore_mysql.sh`
- `deploy/scripts/import_all_results_prod.sh`

### 1) 初期設定

```bash
cp deploy/.env.prod.example deploy/.env.prod
# deploy/.env.prod の値を本番用に編集
```

必須で設定する値:

- `DOMAIN`
- `SECRET_KEY_BASE`
- `RAILS_MASTER_KEY`
- `MYSQL_ROOT_PASSWORD`
- `MYSQL_USER`
- `MYSQL_PASSWORD`

`SECRET_KEY_BASE` は以下で生成できます。

```bash
docker compose -f docker-compose.prod.yml --env-file deploy/.env.prod run --rm backend bundle exec rails secret
```

### 2) 起動

```bash
docker compose -f docker-compose.prod.yml --env-file deploy/.env.prod up -d --build
```

DBマイグレーション:

```bash
docker compose -f docker-compose.prod.yml --env-file deploy/.env.prod exec -T backend bundle exec rails db:migrate
```

### 3) デプロイ更新

`/etc/rowing-api/.env.prod` を優先利用します。

```bash
bash deploy/scripts/deploy_prod.sh
```

### 4) バックアップ/リストア

バックアップ:

```bash
bash deploy/scripts/backup_mysql.sh
```

リストア:

```bash
bash deploy/scripts/restore_mysql.sh deploy/backups/mysql_smart_rowing_production_YYYYMMDD_HHMMSS.sql.gz
```

`/etc/rowing-api/.env.prod` 以外を使う場合は `ENV_FILE` で上書きできます。

```bash
ENV_FILE=/path/to/.env.prod bash deploy/scripts/backup_mysql.sh
```

### 5) Lightsail 側の推奨設定

- インスタンス: Linux 2GB以上
- 静的IPを割り当て
- ポート開放: `80`, `443`, `22`
- DNS: `A` レコードを静的IPへ向ける
- SSL: Caddyが自動で取得/更新

### 6) Cron例（毎日3:00にバックアップ）

```bash
0 3 * * * cd /home/ubuntu/rowing-api && bash deploy/scripts/backup_mysql.sh >> /var/log/rowing_backup.log 2>&1
```

### 7) 本番データ再投入（CSV一括）

バックアップ -> 全削除 -> 年次CSV再投入までを一括実行:

```bash
bash deploy/scripts/import_all_results_prod.sh
```

オプション例:

```bash
# 2015〜2025のみ再投入
YEAR_FROM=2015 YEAR_TO=2025 bash deploy/scripts/import_all_results_prod.sh

# バックアップをスキップ
SKIP_BACKUP=1 bash deploy/scripts/import_all_results_prod.sh
```

`/etc/rowing-api/.env.prod` 以外を使う場合:

```bash
ENV_FILE=/path/to/.env.prod bash deploy/scripts/import_all_results_prod.sh
```

### 8) GitHub Actionsで自動デプロイ

`main` へ push すると `.github/workflows/deploy-prod.yml` が実行され、EC2へSSHしてデプロイします。

GitHubリポジトリの `Settings > Secrets and variables > Actions` に以下を登録してください。

- `PROD_HOST`: EC2のパブリックIPまたはドメイン
- `PROD_USER`: SSHユーザー（例: `ec2-user`）
- `PROD_SSH_KEY`: 秘密鍵の内容（PEM全文）
- `PROD_PORT`: SSHポート（通常 `22`）

デプロイ処理はEC2上で以下を実行します。

```bash
cd /opt/rowing-api
ENV_FILE=/etc/rowing-api/.env.prod bash deploy/scripts/deploy_prod.sh
```

### 9) systemdで自動起動

```bash
sudo cp deploy/rowing-api.service /etc/systemd/system/rowing-api.service
sudo systemctl daemon-reload
sudo systemctl enable --now rowing-api.service
```
