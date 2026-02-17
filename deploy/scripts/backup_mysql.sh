#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_FILE="${ROOT_DIR}/deploy/.env.prod"
BACKUP_DIR="${ROOT_DIR}/deploy/backups"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}" >&2
  exit 1
fi

mkdir -p "${BACKUP_DIR}"

set -a
source "${ENV_FILE}"
set +a

OUT_FILE="${BACKUP_DIR}/mysql_${MYSQL_DATABASE}_${TIMESTAMP}.sql.gz"

docker compose -f "${ROOT_DIR}/docker-compose.prod.yml" --env-file "${ENV_FILE}" \
  exec -T db sh -lc "mysqldump -u\"${MYSQL_USER}\" -p\"${MYSQL_PASSWORD}\" \"${MYSQL_DATABASE}\"" \
  | gzip > "${OUT_FILE}"

echo "Backup created: ${OUT_FILE}"
