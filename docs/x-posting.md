# X(Twitter)ポスト環境

`scripts/x-post.mjs` でCLIからXへポストできる。依存パッケージなし。

## 初回セットアップ(手動作業)

1. **Xアカウント作成**: RowingAPI用のアカウントを https://x.com で作成する
2. **開発者登録**: そのアカウントでログインした状態で https://developer.x.com にアクセスし、
   Freeプランで登録する(用途は「自サービスの更新情報の投稿」等でよい)
3. **アプリ作成と権限設定**: Developer Portalでプロジェクト/アプリを作成し、
   User authentication settings で **Read and write** を有効にする
   (App permissionsがReadのままだと投稿できない。変更後はトークン再生成が必要)
4. **キー取得**: 以下の4点を生成して控える
   - API Key / API Key Secret(Consumer Keys)
   - Access Token / Access Token Secret(自アカウント用、Read and write)
5. **設定**: リポジトリ直下に `.env` を作成して貼り付ける(`.env` はgitignore済み)

```
X_API_KEY=...
X_API_SECRET=...
X_ACCESS_TOKEN=...
X_ACCESS_SECRET=...
```

## 使い方

```bash
# 内容の確認だけ(投稿しない)
node scripts/x-post.mjs --dry-run "本文"

# 投稿する
node scripts/x-post.mjs "本文"
```

成功するとポストのURLが表示される。

## 注意

- Freeプランの投稿上限は月500件程度(仕様は変わりうるので Developer Portal で確認)
- 認証情報をコミットしないこと。`.env` の置き場所はリポジトリ直下のみとする
- 文字数はスクリプトが素朴にカウントして警告するだけなので、全角140字前後の長文は投稿前に確認する
