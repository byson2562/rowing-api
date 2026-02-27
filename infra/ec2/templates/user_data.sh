#!/bin/bash
set -euxo pipefail

dnf update -y
dnf install -y docker git
systemctl enable --now docker

if ! command -v docker >/dev/null 2>&1; then
  echo "docker install failed" >&2
  exit 1
fi

usermod -aG docker ec2-user

mkdir -p /opt/rowing-api
chown -R ec2-user /opt/rowing-api

if [ ! -d "/opt/rowing-api/.git" ]; then
  sudo -u ec2-user git clone https://github.com/byson2562/rowing-api.git /opt/rowing-api
fi

cd /opt/rowing-api
sudo -u ec2-user git fetch --all
sudo -u ec2-user git checkout main
sudo -u ec2-user git pull origin main

if [ ! -f "/opt/rowing-api/deploy/.env.prod" ] && [ -f "/opt/rowing-api/deploy/.env.prod.example" ]; then
  cp /opt/rowing-api/deploy/.env.prod.example /opt/rowing-api/deploy/.env.prod
  chown ec2-user /opt/rowing-api/deploy/.env.prod
fi
