#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_FILE="${ROOT_DIR}/deploy/.env.prod"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}" >&2
  exit 1
fi

cd "${ROOT_DIR}"

docker compose -f docker-compose.prod.yml --env-file "${ENV_FILE}" pull

docker compose -f docker-compose.prod.yml --env-file "${ENV_FILE}" up -d --build

docker compose -f docker-compose.prod.yml --env-file "${ENV_FILE}" exec -T backend bundle exec rails db:migrate

echo "Deploy completed"
