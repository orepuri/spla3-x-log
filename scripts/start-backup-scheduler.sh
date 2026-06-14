#!/bin/sh
set -eu

CRONTAB_FILE=/etc/crontabs/root
ENV_FILE=/tmp/spla3-x-log-backup.env
BACKUP_SCHEDULE="${BACKUP_SCHEDULE:-0 6 * * *}"

export -p > "$ENV_FILE"

{
  echo "SHELL=/bin/sh"
  echo "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
  printf '%s . %s; /usr/local/bin/backup-postgres-to-r2.sh\n' "$BACKUP_SCHEDULE" "$ENV_FILE"
} > "$CRONTAB_FILE"

echo "Starting backup scheduler: ${BACKUP_SCHEDULE}"
exec crond -f -l 8 -L /dev/stdout
