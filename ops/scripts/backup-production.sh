#!/usr/bin/env bash
set -euo pipefail

umask 077

BACKUP_ENV="${BACKUP_ENV:-/etc/munich-weekly/backup.env}"
PRODUCTION_BACKUP_ENV="/etc/munich-weekly/backup.env"
ENFORCE_BACKUP_ENV_PERMISSIONS="${ENFORCE_BACKUP_ENV_PERMISSIONS:-false}"
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

stat_owner_mode() {
  if stat -c '%U %a' "$BACKUP_ENV" 2>/dev/null; then
    return 0
  fi
  stat -f '%Su %Lp' "$BACKUP_ENV" 2>/dev/null
}

require_backup_env_permissions() {
  require_cmd stat
  local owner mode owner_perms group_perms other_perms
  read -r owner mode < <(stat_owner_mode) || die "Could not stat backup env file: $BACKUP_ENV"

  if [ "$owner" != "root" ]; then
    die "Backup env file must be owned by root: $BACKUP_ENV"
  fi

  mode=$((10#$mode))
  owner_perms=$((mode / 100 % 10))
  group_perms=$((mode / 10 % 10))
  other_perms=$((mode % 10))

  if [ $((owner_perms & 4)) -eq 0 ] || [ "$group_perms" -ne 0 ] || [ "$other_perms" -ne 0 ]; then
    die "Backup env file must be readable only by root: $BACKUP_ENV"
  fi
}

write_sha256sums() {
  "${SHA256_CMD[@]}" "$RUN_DIR/postgres.dump" "$RUN_DIR/uploads.tar.gz" > "$RUN_DIR/SHA256SUMS"
}

require_bool ENFORCE_BACKUP_ENV_PERMISSIONS "$ENFORCE_BACKUP_ENV_PERMISSIONS"

if [ ! -r "$BACKUP_ENV" ]; then
  die "Backup env file is missing or unreadable: $BACKUP_ENV"
fi

if [ "$BACKUP_ENV" = "$PRODUCTION_BACKUP_ENV" ] || [ "$ENFORCE_BACKUP_ENV_PERMISSIONS" = "true" ]; then
  require_backup_env_permissions
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
ALLOW_BACKUP_DRY_RUN="${ALLOW_BACKUP_DRY_RUN:-false}"
ALLOW_INCOMPLETE_R2_BACKUP="${ALLOW_INCOMPLETE_R2_BACKUP:-false}"

require_bool REQUIRE_R2_BACKUP "$REQUIRE_R2_BACKUP"
require_bool BACKUP_DRY_RUN "$BACKUP_DRY_RUN"
require_bool ALLOW_BACKUP_DRY_RUN "$ALLOW_BACKUP_DRY_RUN"
require_bool ALLOW_INCOMPLETE_R2_BACKUP "$ALLOW_INCOMPLETE_R2_BACKUP"

if [ "$BACKUP_ENV" = "$PRODUCTION_BACKUP_ENV" ] && [ "$BACKUP_DRY_RUN" = "true" ]; then
  die "BACKUP_DRY_RUN cannot be true when BACKUP_ENV=$PRODUCTION_BACKUP_ENV"
fi
if [ "$BACKUP_DRY_RUN" = "true" ] && [ "$ALLOW_BACKUP_DRY_RUN" != "true" ]; then
  die "BACKUP_DRY_RUN=true requires ALLOW_BACKUP_DRY_RUN=true"
fi
if [ "$BACKUP_ENV" = "$PRODUCTION_BACKUP_ENV" ] && [ "$REQUIRE_R2_BACKUP" != "true" ]; then
  die "REQUIRE_R2_BACKUP must be true for production backups"
fi
if [ "$REQUIRE_R2_BACKUP" != "true" ] && [ "$ALLOW_INCOMPLETE_R2_BACKUP" != "true" ]; then
  die "REQUIRE_R2_BACKUP=false requires ALLOW_INCOMPLETE_R2_BACKUP=true"
fi

require_cmd git
require_cmd cmp
require_cmd sort
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

if [ "$REQUIRE_R2_BACKUP" != "true" ]; then
  printf '%s\n' \
    "R2 object backup was explicitly skipped for this non-production run." \
    "This restic snapshot is incomplete for production recovery." \
    > "$RUN_DIR/INCOMPLETE_R2_BACKUP.txt"
fi

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
    : > "$RUN_DIR/r2-source-objects.txt"
    : > "$RUN_DIR/r2-backup-objects.txt"
  else
    rclone copy "$RCLONE_R2_SOURCE" "$R2_BACKUP_PATH" \
      --checksum \
      --metadata \
      --immutable \
      --fast-list
    rclone lsf -R "$RCLONE_R2_SOURCE" --files-only --format "tsp" | sort > "$RUN_DIR/r2-source-manifest.txt"
    rclone lsf -R "$RCLONE_R2_SOURCE" --files-only --format "sp" | sort > "$RUN_DIR/r2-source-objects.txt"
    rclone lsf -R "$R2_BACKUP_PATH" --files-only --format "tsp" | sort > "$RUN_DIR/r2-backup-manifest.txt"
    rclone lsf -R "$R2_BACKUP_PATH" --files-only --format "sp" | sort > "$RUN_DIR/r2-backup-objects.txt"
    if ! cmp -s "$RUN_DIR/r2-source-objects.txt" "$RUN_DIR/r2-backup-objects.txt"; then
      if command -v diff >/dev/null 2>&1; then
        diff -u "$RUN_DIR/r2-source-objects.txt" "$RUN_DIR/r2-backup-objects.txt" > "$RUN_DIR/r2-manifest.diff" || true
      fi
      die "R2 backup manifest mismatch; rerun backup after upload activity settles"
    fi
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
  --group-by host \
  --keep-daily "$RETENTION_DAILY" \
  --keep-weekly "$RETENTION_WEEKLY" \
  --keep-monthly "$RETENTION_MONTHLY" \
  --prune
restic snapshots --tag munich-weekly --latest 5
