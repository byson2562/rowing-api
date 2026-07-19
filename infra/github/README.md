# GitHub repository settings

このTerraform定義は、`byson2562/rowing-api` のGitHub Actions Workflow権限を管理します。

- `GITHUB_TOKEN`の既定権限: read
- GitHub ActionsによるPull Requestの作成・承認: 許可

Workflowごとの権限は引き続き各Workflowの`permissions`で明示します。
JARA自動更新Workflowは`contents: write`と`pull-requests: write`を宣言済みです。

## 前提

- Terraform 1.5以上
- 対象リポジトリのAdministration権限を持つGitHub token

Fine-grained personal access tokenを使う場合は、対象リポジトリに対する
`Administration: Read and write`権限を付与してください。tokenはtfvarsへ保存せず、
環境変数`GITHUB_TOKEN`でproviderへ渡します。

## 適用

```sh
cd infra/github
export GITHUB_TOKEN='<repository-admin-token>'
terraform init
terraform plan
terraform apply
```

ownerまたはrepositoryを変更する場合だけ、`terraform.tfvars.example`を
`terraform.tfvars`へコピーして編集します。

## 既存stateへ取り込む場合

別のTerraform stateで同じ設定をすでに管理している場合は、二重管理を避けてください。
このstateへ移管するときは、既存state側から移動したうえで次を実行します。

```sh
terraform import github_workflow_repository_permissions.this rowing-api
```

ローカルstateはGit管理対象外です。継続運用では、チームのTerraform backendへ
stateを保存してください。
