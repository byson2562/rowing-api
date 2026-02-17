#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
DEFAULT_ENV_FILE="/etc/rowing-api/.env.prod"
LOCAL_ENV_FILE="${ROOT_DIR}/deploy/.env.prod"
ENV_FILE="${ENV_FILE:-${DEFAULT_ENV_FILE}}"

if [[ ! -f "${ENV_FILE}" && -f "${LOCAL_ENV_FILE}" ]]; then
  ENV_FILE="${LOCAL_ENV_FILE}"
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing env file: ${ENV_FILE}" >&2
  echo "Set ENV_FILE=/path/to/.env.prod or create ${DEFAULT_ENV_FILE}" >&2
  exit 1
fi

cd "${ROOT_DIR}"

git pull origin main

docker compose -f docker-compose.prod.yml --env-file "${ENV_FILE}" pull

docker compose -f docker-compose.prod.yml --env-file "${ENV_FILE}" up -d --build

docker compose -f docker-compose.prod.yml --env-file "${ENV_FILE}" exec -T backend bundle exec rails db:migrate

echo "Deploy completed"
