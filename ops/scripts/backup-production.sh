#!/usr/bin/env bash
set -euo pipefail

umask 077

BACKUP_ENV="${BACKUP_ENV:-/etc/munich-weekly/backup.env}"
SHA256_CMD=()

die() {
  echo "$*" >&2
  exit 1
}

require_bool() {
  case "$2" in
    true|false) ;;
    *) die "$1 must be true or false" ;;
  esac
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Required command not found: $1"
}

write_sha256sums() {
  "${SHA256_CMD[@]}" "$RUN_DIR/postgres.dump" "$RUN_DIR/uploads.tar.gz" > "$RUN_DIR/SHA256SUMS"
}

if [ ! -r "$BACKUP_ENV" ]; then
  die "Backup env file is missing or unreadable: $BACKUP_ENV"
fi

set -a
. "$BACKUP_ENV"
set +a

APP_DIR="${APP_DIR:-/home/deploy/munich-weekly}"
BACKUP_WORK_DIR="${BACKUP_WORK_DIR:-/var/backups/munich-weekly}"
DATE_UTC="${DATE_UTC:-$(date -u +%Y%m%dT%H%M%SZ)}"
RUN_DIR="${RUN_DIR:-${BACKUP_WORK_DIR}/${DATE_UTC}}"
RETENTION_DAILY="${RETENTION_DAILY:-14}"
RETENTION_WEEKLY="${RETENTION_WEEKLY:-8}"
RETENTION_MONTHLY="${RETENTION_MONTHLY:-12}"
REQUIRE_R2_BACKUP="${REQUIRE_R2_BACKUP:-true}"
BACKUP_DRY_RUN="${BACKUP_DRY_RUN:-false}"

require_bool REQUIRE_R2_BACKUP "$REQUIRE_R2_BACKUP"
require_bool BACKUP_DRY_RUN "$BACKUP_DRY_RUN"

require_cmd git
require_cmd tar
if command -v sha256sum >/dev/null 2>&1; then
  SHA256_CMD=(sha256sum)
elif command -v shasum >/dev/null 2>&1; then
  SHA256_CMD=(shasum -a 256)
else
  die "Required command not found: sha256sum or shasum"
fi
if [ "$BACKUP_DRY_RUN" != "true" ]; then
  require_cmd docker
  require_cmd restic
fi
if [ "$REQUIRE_R2_BACKUP" = "true" ]; then
  : "${RCLONE_R2_SOURCE:?RCLONE_R2_SOURCE is required when REQUIRE_R2_BACKUP=true}"
  : "${RCLONE_R2_BACKUP:?RCLONE_R2_BACKUP is required when REQUIRE_R2_BACKUP=true}"
  export RCLONE_CONFIG="${RCLONE_CONFIG:-/etc/munich-weekly/rclone.conf}"
  R2_BACKUP_PATH="${RCLONE_R2_BACKUP}/snapshots/${DATE_UTC}"
  if [ "$BACKUP_DRY_RUN" != "true" ]; then
    require_cmd rclone
  fi
fi

mkdir -p "$BACKUP_WORK_DIR" "$RUN_DIR"
chmod 0700 "$BACKUP_WORK_DIR" "$RUN_DIR"

if [ "$BACKUP_DRY_RUN" = "true" ]; then
  printf 'dry-run postgres dump placeholder\n' > "$RUN_DIR/postgres.dump"
else
  cd "$APP_DIR/backend"
  docker compose ps postgres >/dev/null
  docker exec mw-postgres sh -lc 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
  docker exec mw-postgres sh -lc 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$RUN_DIR/postgres.dump"
fi

if [ -d "$APP_DIR/backend/uploads" ]; then
  tar -C "$APP_DIR/backend" -czf "$RUN_DIR/uploads.tar.gz" uploads
else
  tar -czf "$RUN_DIR/uploads.tar.gz" --files-from /dev/null
fi

if [ "$REQUIRE_R2_BACKUP" = "true" ]; then
  if [ "$BACKUP_DRY_RUN" = "true" ]; then
    : > "$RUN_DIR/r2-source-manifest.txt"
    : > "$RUN_DIR/r2-backup-manifest.txt"
  else
    rclone copy "$RCLONE_R2_SOURCE" "$R2_BACKUP_PATH" \
      --checksum \
      --metadata \
      --immutable \
      --fast-list
    rclone lsf -R "$RCLONE_R2_SOURCE" --format "tsp" > "$RUN_DIR/r2-source-manifest.txt"
    rclone lsf -R "$R2_BACKUP_PATH" --format "tsp" > "$RUN_DIR/r2-backup-manifest.txt"
  fi
  printf '%s\n' "$R2_BACKUP_PATH" > "$RUN_DIR/r2-backup-path.txt"
fi

if git -C "$APP_DIR" rev-parse HEAD > "$RUN_DIR/git-commit.txt" 2>/dev/null; then
  :
else
  printf 'unknown\n' > "$RUN_DIR/git-commit.txt"
fi

if [ "$BACKUP_DRY_RUN" = "true" ]; then
  printf 'dry-run docker status placeholder\n' > "$RUN_DIR/docker-ps.txt"
else
  docker ps --format '{{.Names}} {{.Image}} {{.Status}}' > "$RUN_DIR/docker-ps.txt"
fi

write_sha256sums

if [ "$BACKUP_DRY_RUN" = "true" ]; then
  echo "Dry run completed: $RUN_DIR"
  exit 0
fi

restic backup "$RUN_DIR" --tag munich-weekly --tag production --tag "$DATE_UTC"
restic forget --tag munich-weekly \
  --keep-daily "$RETENTION_DAILY" \
  --keep-weekly "$RETENTION_WEEKLY" \
  --keep-monthly "$RETENTION_MONTHLY" \
  --prune
restic snapshots --tag munich-weekly --latest 5
