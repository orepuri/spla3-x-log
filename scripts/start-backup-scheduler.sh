#!/bin/sh
set -eu

CRONTAB_FILE=/tmp/spla3-x-log-backup.crontab
BACKUP_SCHEDULE="${BACKUP_SCHEDULE:-0 6 * * *}"

printf '%s /usr/local/bin/backup-postgres-to-r2.sh\n' "$BACKUP_SCHEDULE" > "$CRONTAB_FILE"

echo "Starting backup scheduler: ${BACKUP_SCHEDULE}"
exec supercronic "$CRONTAB_FILE"
