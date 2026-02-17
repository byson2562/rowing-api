#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
DEFAULT_ENV_FILE="/etc/rowing-api/.env.prod"
LOCAL_ENV_FILE="${ROOT_DIR}/deploy/.env.prod"
ENV_FILE="${ENV_FILE:-${DEFAULT_ENV_FILE}}"
YEAR_FROM="${YEAR_FROM:-2009}"
YEAR_TO="${YEAR_TO:-2025}"
SKIP_BACKUP="${SKIP_BACKUP:-0}"
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

if ! [[ "${YEAR_FROM}" =~ ^[0-9]{4}$ && "${YEAR_TO}" =~ ^[0-9]{4}$ ]]; then
  echo "YEAR_FROM and YEAR_TO must be 4-digit years" >&2
  exit 1
fi

if (( YEAR_FROM > YEAR_TO )); then
  echo "YEAR_FROM must be <= YEAR_TO" >&2
  exit 1
fi

cd "${ROOT_DIR}"

if [[ "${SKIP_BACKUP}" != "1" ]]; then
  mkdir -p "${BACKUP_DIR}"

  set -a
  source "${ENV_FILE}"
  set +a

  OUT_FILE="${BACKUP_DIR}/mysql_${MYSQL_DATABASE}_before_import_${TIMESTAMP}.sql.gz"
  docker compose -f "${ROOT_DIR}/docker-compose.prod.yml" --env-file "${ENV_FILE}" \
    exec -T db sh -lc "mysqldump -u\"${MYSQL_USER}\" -p\"${MYSQL_PASSWORD}\" \"${MYSQL_DATABASE}\"" \
    | gzip > "${OUT_FILE}"

  echo "Backup created: ${OUT_FILE}"
fi

echo "Delete existing records..."
docker compose -f "${ROOT_DIR}/docker-compose.prod.yml" --env-file "${ENV_FILE}" \
  exec -T backend bundle exec rails runner "Result.delete_all"

for (( y=YEAR_FROM; y<=YEAR_TO; y++ )); do
  csv_path="data/source/jara_${y}.csv"
  echo "--- import ${y} (${csv_path}) ---"

  docker compose -f "${ROOT_DIR}/docker-compose.prod.yml" --env-file "${ENV_FILE}" \
    exec -T backend bash -lc "if [[ ! -f ${csv_path} ]]; then echo 'Missing CSV: ${csv_path}' >&2; exit 1; fi; CSV_PATH=${csv_path} bundle exec rake data:import_results"
done

echo "Current row count:"
docker compose -f "${ROOT_DIR}/docker-compose.prod.yml" --env-file "${ENV_FILE}" \
  exec -T backend bundle exec rails runner "puts Result.count"

echo "Import completed (${YEAR_FROM}-${YEAR_TO})"
