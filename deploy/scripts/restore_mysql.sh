#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <backup.sql.gz>" >&2
  exit 1
fi

BACKUP_FILE="$1"
ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_FILE="${ROOT_DIR}/deploy/.env.prod"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}" >&2
  exit 1
fi

if [[ ! -f "${BACKUP_FILE}" ]]; then
  echo "Missing backup file: ${BACKUP_FILE}" >&2
  exit 1
fi

set -a
source "${ENV_FILE}"
set +a

gunzip -c "${BACKUP_FILE}" | docker compose -f "${ROOT_DIR}/docker-compose.prod.yml" --env-file "${ENV_FILE}" \
  exec -T db sh -lc "mysql -u\"${MYSQL_USER}\" -p\"${MYSQL_PASSWORD}\" \"${MYSQL_DATABASE}\""

echo "Restore completed from: ${BACKUP_FILE}"
