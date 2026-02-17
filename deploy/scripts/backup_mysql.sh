#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
DEFAULT_ENV_FILE="/etc/rowing-api/.env.prod"
LOCAL_ENV_FILE="${ROOT_DIR}/deploy/.env.prod"
ENV_FILE="${ENV_FILE:-${DEFAULT_ENV_FILE}}"
BACKUP_DIR="${ROOT_DIR}/deploy/backups"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"

if [[ ! -f "${ENV_FILE}" && -f "${LOCAL_ENV_FILE}" ]]; then
  ENV_FILE="${LOCAL_ENV_FILE}"
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing env file: ${ENV_FILE}" >&2
  echo "Set ENV_FILE=/path/to/.env.prod or create ${DEFAULT_ENV_FILE}" >&2
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
