#!/bin/sh
set -eu

require_env() {
  name="$1"
  eval "value=\${$name:-}"
  if [ -z "$value" ]; then
    echo "Missing required environment variable: $name" >&2
    exit 1
  fi
}

require_env PGHOST
require_env PGDATABASE
require_env PGUSER
require_env PGPASSWORD
require_env R2_BUCKET
require_env RCLONE_CONFIG_R2_ACCESS_KEY_ID
require_env RCLONE_CONFIG_R2_SECRET_ACCESS_KEY
require_env RCLONE_CONFIG_R2_ENDPOINT

R2_PREFIX="${R2_PREFIX:-postgres}"
BACKUP_NAME_PREFIX="${BACKUP_NAME_PREFIX:-spla3-x-log}"
STAMP="$(date +%Y%m%d-%H%M%S)"
FILE="${BACKUP_NAME_PREFIX}-${STAMP}.sql.gz"
TMP_DIR="$(mktemp -d)"
TMP_FILE="${TMP_DIR}/${FILE}"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT INT TERM

echo "Creating PostgreSQL dump: ${FILE}"
pg_dump \
  --host="$PGHOST" \
  --port="${PGPORT:-5432}" \
  --username="$PGUSER" \
  --dbname="$PGDATABASE" \
  --no-password \
  | gzip -9 > "$TMP_FILE"

echo "Uploading backup to R2: r2:${R2_BUCKET}/${R2_PREFIX}/${FILE}"
rclone copyto "$TMP_FILE" "r2:${R2_BUCKET}/${R2_PREFIX}/${FILE}"

echo "Backup completed: ${FILE}"
