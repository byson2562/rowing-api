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
