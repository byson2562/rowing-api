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

  OUT_FILE="${BACKUP_DIR}/sqlite_before_import_${TIMESTAMP}.sqlite3"
  docker compose -f "${ROOT_DIR}/docker-compose.prod.yml" --env-file "${ENV_FILE}" \
    exec -T backend sh -lc 'if [[ -f "${SQLITE_DATABASE_PATH}" ]]; then cat "${SQLITE_DATABASE_PATH}"; fi' \
    > "${OUT_FILE}"

  if [[ -s "${OUT_FILE}" ]]; then
    echo "Backup created: ${OUT_FILE}"
  else
    rm -f "${OUT_FILE}"
    echo "Skip backup: SQLite DB file not found in container (${SQLITE_DATABASE_PATH:-unset})"
  fi
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
