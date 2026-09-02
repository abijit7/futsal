#!/usr/bin/env sh
# Applies every versioned migration in backend/src/main/resources/db in order.
#
# All scripts are idempotent, so re-running is safe. Run from the repository root:
#
#   DB_HOST=... DB_NAME=... DB_USERNAME=... DB_PASSWORD=... sh deployment/apply-db-migrations.sh
#
# Azure Database for MySQL requires TLS; add --ssl-mode=REQUIRED via MYSQL_EXTRA_ARGS.
set -eu

: "${DB_HOST:?Set DB_HOST}"
: "${DB_NAME:?Set DB_NAME}"
: "${DB_USERNAME:?Set DB_USERNAME}"
: "${DB_PASSWORD:?Set DB_PASSWORD}"

DB_PORT="${DB_PORT:-3306}"
MYSQL_EXTRA_ARGS="${MYSQL_EXTRA_ARGS:-}"
MIGRATION_DIR="${MIGRATION_DIR:-backend/src/main/resources/db}"

if [ ! -d "$MIGRATION_DIR" ]; then
  echo "Migration directory not found: $MIGRATION_DIR" >&2
  echo "Run this script from the repository root." >&2
  exit 1
fi

found=0
# Order by the numeric version rather than by filename, so V10 follows V9 instead of V1. The
# version is pulled out, sorted numerically, then stripped back off.
MIGRATIONS=$(
  ls "$MIGRATION_DIR"/V*.sql 2>/dev/null \
    | sed -n 's|.*/V\([0-9][0-9]*\)__.*|\1 &|p' \
    | sort -n -k1,1 \
    | cut -d' ' -f2-
)

for script in $MIGRATIONS; do
  [ -e "$script" ] || continue
  found=1
  echo "==> applying $(basename "$script")"
  # shellcheck disable=SC2086
  mysql \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --user="$DB_USERNAME" \
    --password="$DB_PASSWORD" \
    $MYSQL_EXTRA_ARGS \
    "$DB_NAME" \
    < "$script"
done

if [ "$found" -eq 0 ]; then
  echo "No migrations found in $MIGRATION_DIR" >&2
  exit 1
fi

echo "==> all migrations applied"
