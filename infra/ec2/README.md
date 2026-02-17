# EC2 Terraform (Cost-First)

この定義は、既存VPC/サブネットに以下を作成します。

- EC2 (Amazon Linux 2023, ARM)
- Security Group (22/80/443)
- Elastic IP

`user_data` で Docker/Git を導入し、`/opt/rowing-api` にリポジトリを配置します。

## 前提

- Terraform >= 1.5
- AWS認証済み (`aws configure` など)
- 既存VPCとPublic Subnet
- EC2キーペア

## 使い方

```bash
cd infra/ec2
cp terraform.tfvars.example terraform.tfvars
# terraform.tfvars を編集
terraform init
terraform plan
terraform apply
```

## 作成後の手順

1. EC2へSSH

```bash
ssh -i <your-key>.pem ec2-user@<public_ip>
```

2. 本番環境変数を設定

```bash
cd /opt/rowing-api
cp deploy/.env.prod.example deploy/.env.prod
vi deploy/.env.prod
```

3. 本番起動

```bash
docker compose -f docker-compose.prod.yml --env-file deploy/.env.prod up -d --build
docker compose -f docker-compose.prod.yml --env-file deploy/.env.prod exec -T backend bundle exec rails db:migrate
```

4. DNS設定

- ドメインのAレコードを `public_ip` に向ける
- Caddy が自動で証明書を取得

## 破棄

```bash
terraform destroy
```

## 注意

- `instance_type` は `t4g.small` をデフォルトにしています（コスト重視）。
- SSHは `ssh_cidr` を `/32` で固定推奨です。
