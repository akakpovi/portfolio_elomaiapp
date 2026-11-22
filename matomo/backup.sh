#!/usr/bin/env bash
# Matomo backup: database dump plus the config directory (which holds the
# installation salt, so a restore is only complete with both files).
#
#   ./backup.sh            # writes into /root/backups/matomo on the VPS
set -euo pipefail

ENV_FILE="${ENV_FILE:-/root/infra/.env}"
OUT_DIR="${OUT_DIR:-/root/backups/matomo}"
KEEP_DAYS="${KEEP_DAYS:-14}"

ROOT_PASS=$(grep '^MATOMO_DB_ROOT_PASSWORD=' "$ENV_FILE" | cut -d= -f2)
TS=$(date -u +%Y%m%dT%H%M%SZ)

mkdir -p "$OUT_DIR"

docker exec matomo-db sh -c "exec mariadb-dump -uroot -p'$ROOT_PASS' --single-transaction --quick matomo" \
  | gzip > "$OUT_DIR/matomo-db-$TS.sql.gz"

docker exec matomo tar czf - -C /var/www/html config > "$OUT_DIR/matomo-config-$TS.tar.gz"

find "$OUT_DIR" -type f -mtime "+$KEEP_DAYS" -delete

echo "backup written: $OUT_DIR/matomo-{db,config}-$TS"
ls -la "$OUT_DIR" | tail -4
