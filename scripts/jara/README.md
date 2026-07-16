# JARA results updater

日本ローイング協会（JARA）の大会ページから、指定年度の公開済み決勝結果を収集します。
実行環境は Ruby 3.3 のコンテナに固定し、ホスト側へ Ruby や gem を導入しません。

## ローカル実行

```sh
docker build --tag rowing-api-jara-updater scripts/jara
docker run --rm \
  --volume "$(pwd):/workspace" \
  --workdir /workspace \
  rowing-api-jara-updater --year 2026
```

取得件数が減る更新は、既定でエラーになります。JARA側の訂正などで削除が意図された場合だけ、
GitHub Actionsの手動実行で `allow_deletions` を有効にしてください。

## 検証

```sh
docker run --rm \
  --entrypoint bundle \
  rowing-api-jara-updater \
  exec ruby /app/test/update_results_test.rb

docker run --rm \
  --volume "$(pwd):/workspace" \
  --workdir /workspace \
  --entrypoint bundle \
  rowing-api-jara-updater \
  exec ruby /app/validate_results.rb
```

## GitHub Actions

`Update JARA Results` は毎日21:00（日本時間）に当年度を確認し、差分がある場合だけ
`automation/jara-results-<年度>` ブランチのPull Requestを作成または更新します。

リポジトリの `Settings > Actions > General > Workflow permissions` で、
GitHub ActionsによるPull Requestの作成を許可しておく必要があります。
