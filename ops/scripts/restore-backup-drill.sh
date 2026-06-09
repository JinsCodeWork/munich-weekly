#!/usr/bin/env bash
set -euo pipefail

umask 077

BACKUP_ENV="${BACKUP_ENV:-/etc/munich-weekly/backup.env}"
RESTORE_PARENT_DIR="${RESTORE_PARENT_DIR:-/var/tmp}"
CONTAINER_NAME="${CONTAINER_NAME:-mw-restore-drill-postgres}"
RESTORE_RUN_ID="${RESTORE_RUN_ID:-$(date -u +%Y%m%dT%H%M%SZ)-$$}"
ALLOW_EMPTY_R2_RESTORE="${ALLOW_EMPTY_R2_RESTORE:-false}"
DB_NAME="${DB_NAME:-munich_weekly_restore_drill}"
DB_USER="${DB_USER:-restore_drill}"
DB_PASSWORD="${DB_PASSWORD:-restore_drill_password}"

RESTORE_WORK_DIR=""
RESTORED_SNAPSHOT_DIR=""
LATEST_SNAPSHOT=""
R2_RESTORE_DIR=""
DRILL_CONTAINER_NAME=""

die() {
  echo "$*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Required command not found: $1"
}

require_bool() {
  case "$2" in
    true|false) ;;
    *) die "$1 must be true or false" ;;
  esac
}

cleanup() {
  if command -v docker >/dev/null 2>&1 && [ -n "${DRILL_CONTAINER_NAME:-}" ]; then
    local container_id
    container_id="$(docker ps -aq \
      --filter "name=^/${DRILL_CONTAINER_NAME}$" \
      --filter "label=com.munichweekly.role=restore-drill" \
      --filter "label=com.munichweekly.restore-run=${RESTORE_RUN_ID}" \
      | head -n 1 || true)"
    if [ -n "$container_id" ]; then
      docker rm -f "$container_id" >/dev/null 2>&1 || true
    fi
  fi

  if [ -n "${RESTORE_WORK_DIR:-}" ] && [ "$RESTORE_WORK_DIR" != "/" ] && [ -d "$RESTORE_WORK_DIR" ]; then
    case "$RESTORE_WORK_DIR" in
      "$RESTORE_PARENT_DIR"/mw-restore-drill.*) rm -rf "$RESTORE_WORK_DIR" ;;
    esac
  fi
}

find_latest_snapshot() {
  restic snapshots --tag munich-weekly --tag production --json | python3 -c '
import json
import sys

snapshots = json.load(sys.stdin)
if not snapshots:
    sys.exit(1)

snapshots.sort(key=lambda item: item.get("time", ""))
latest = snapshots[-1].get("short_id") or snapshots[-1].get("id")
if not latest:
    sys.exit(1)
print(latest)
'
}

find_restored_snapshot_dir() {
  local dump_path
  dump_path="$(find "$RESTORE_WORK_DIR" -type f -name postgres.dump -print -quit)"
  [ -n "$dump_path" ] || die "Restored snapshot does not contain postgres.dump"
  dirname "$dump_path"
}

file_has_content() {
  [ -s "$1" ]
}

file_prefix_contains() {
  local file="$1"
  local needle="$2"
  head -c 256 "$file" | grep -Fq "$needle"
}

count_files() {
  find "$1" -type f -print | wc -l | tr -d '[:space:]'
}

write_restored_object_list() {
  local source_dir="$1"
  local output_file="$2"

  rclone lsf -R "$source_dir" --files-only --format "sp" | sort > "$output_file"
}

sha256_file() {
  local file="$1"
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$file" | awk '{print $1}'
  elif command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$file" | awk '{print $1}'
  else
    die "Required command not found: sha256sum or shasum"
  fi
}

expected_sha256_for() {
  local checksum_file="$1"
  local basename="$2"
  awk -v name="$basename" '
    $2 == name || $2 ~ "/" name "$" { print $1; found=1; exit }
    END { if (!found) exit 1 }
  ' "$checksum_file"
}

verify_checksum() {
  local file="$1"
  local checksum_file="$RESTORED_SNAPSHOT_DIR/SHA256SUMS"
  local basename expected actual

  [ -f "$checksum_file" ] || die "Restored snapshot does not contain SHA256SUMS"

  basename="$(basename "$file")"
  expected="$(expected_sha256_for "$checksum_file" "$basename")" || die "SHA256SUMS does not contain $basename"
  actual="$(sha256_file "$file")"

  [ "$expected" = "$actual" ] || die "Checksum mismatch for $basename"
}

validate_snapshot_artifacts() {
  [ -f "$RESTORED_SNAPSHOT_DIR/postgres.dump" ] || die "Restored snapshot does not contain postgres.dump"
  [ -f "$RESTORED_SNAPSHOT_DIR/SHA256SUMS" ] || die "Restored snapshot does not contain SHA256SUMS"
  [ -f "$RESTORED_SNAPSHOT_DIR/r2-source-manifest.txt" ] || die "Restored snapshot does not contain r2-source-manifest.txt"
  [ -f "$RESTORED_SNAPSHOT_DIR/r2-backup-manifest.txt" ] || die "Restored snapshot does not contain r2-backup-manifest.txt"
  [ -f "$RESTORED_SNAPSHOT_DIR/r2-backup-path.txt" ] || die "Restored snapshot does not contain r2-backup-path.txt"
  [ -f "$RESTORED_SNAPSHOT_DIR/uploads.tar.gz" ] || die "Restored snapshot does not contain uploads.tar.gz"
  [ ! -e "$RESTORED_SNAPSHOT_DIR/INCOMPLETE_R2_BACKUP.txt" ] || die "Restored snapshot was marked as an incomplete R2 backup"

  if [ -f "$RESTORED_SNAPSHOT_DIR/docker-ps.txt" ] &&
    file_prefix_contains "$RESTORED_SNAPSHOT_DIR/docker-ps.txt" "dry-run docker status placeholder"; then
    die "Restored snapshot metadata indicates a dry-run backup"
  fi
  if file_prefix_contains "$RESTORED_SNAPSHOT_DIR/postgres.dump" "dry-run postgres dump placeholder"; then
    die "Restored postgres.dump indicates a dry-run backup"
  fi

  tar -tzf "$RESTORED_SNAPSHOT_DIR/uploads.tar.gz" >/dev/null
  verify_checksum "$RESTORED_SNAPSHOT_DIR/postgres.dump"
  verify_checksum "$RESTORED_SNAPSHOT_DIR/uploads.tar.gz"
}

r2_source_has_objects() {
  if [ -f "$RESTORED_SNAPSHOT_DIR/r2-source-objects.txt" ]; then
    file_has_content "$RESTORED_SNAPSHOT_DIR/r2-source-objects.txt"
    return
  fi

  if [ -f "$RESTORED_SNAPSHOT_DIR/r2-source-manifest.txt" ]; then
    file_has_content "$RESTORED_SNAPSHOT_DIR/r2-source-manifest.txt"
    return
  fi

  false
}

validate_and_restore_r2_backup() {
  local r2_backup_path
  local expected_objects_file=""
  local restored_objects_file

  if [ -f "$RESTORED_SNAPSHOT_DIR/r2-source-objects.txt" ] && [ -f "$RESTORED_SNAPSHOT_DIR/r2-backup-objects.txt" ]; then
    cmp -s "$RESTORED_SNAPSHOT_DIR/r2-source-objects.txt" "$RESTORED_SNAPSHOT_DIR/r2-backup-objects.txt" ||
      die "R2 source and backup object lists differ"
  fi

  if ! r2_source_has_objects; then
    if [ "$ALLOW_EMPTY_R2_RESTORE" = "true" ]; then
      echo "R2 source object list is empty; continuing because ALLOW_EMPTY_R2_RESTORE=true" >&2
      return 0
    fi
    die "R2 source object list is empty; set ALLOW_EMPTY_R2_RESTORE=true only after confirming production has no upload objects"
  fi

  if [ -s "$RESTORED_SNAPSHOT_DIR/r2-backup-objects.txt" ]; then
    expected_objects_file="$RESTORED_SNAPSHOT_DIR/r2-backup-objects.txt"
  elif [ -s "$RESTORED_SNAPSHOT_DIR/r2-source-objects.txt" ]; then
    expected_objects_file="$RESTORED_SNAPSHOT_DIR/r2-source-objects.txt"
  fi

  r2_backup_path="$(head -n 1 "$RESTORED_SNAPSHOT_DIR/r2-backup-path.txt")"
  if [ -z "$r2_backup_path" ]; then
    die "r2-backup-path.txt is empty"
  fi

  require_cmd rclone

  R2_RESTORE_DIR="$RESTORE_WORK_DIR/r2-restore"
  mkdir -p "$R2_RESTORE_DIR"
  chmod 0700 "$R2_RESTORE_DIR"

  rclone copy "$r2_backup_path" "$R2_RESTORE_DIR" --checksum --metadata --fast-list

  if [ "$(count_files "$R2_RESTORE_DIR")" -eq 0 ]; then
    die "R2 backup restore produced no files"
  fi

  if [ -n "$expected_objects_file" ]; then
    restored_objects_file="$RESTORE_WORK_DIR/r2-restored-objects.txt"
    write_restored_object_list "$R2_RESTORE_DIR" "$restored_objects_file"
    cmp -s "$expected_objects_file" "$restored_objects_file" ||
      die "Restored R2 object list does not match expected backup object list"
  fi

  if [ -z "$expected_objects_file" ]; then
    return 0
  fi
}

wait_for_postgres() {
  local attempt
  for attempt in $(seq 1 30); do
    if docker exec "$DRILL_CONTAINER_NAME" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  die "PostgreSQL restore drill container did not become ready"
}

run_postgres_restore_drill() {
  require_cmd docker

  DRILL_CONTAINER_NAME="${CONTAINER_NAME}-${RESTORE_RUN_ID}"

  docker run -d \
    --name "$DRILL_CONTAINER_NAME" \
    --network none \
    --label com.munichweekly.role=restore-drill \
    --label "com.munichweekly.restore-run=${RESTORE_RUN_ID}" \
    -e POSTGRES_DB="$DB_NAME" \
    -e POSTGRES_USER="$DB_USER" \
    -e POSTGRES_PASSWORD="$DB_PASSWORD" \
    postgres:15 >/dev/null

  wait_for_postgres
  docker cp "$RESTORED_SNAPSHOT_DIR/postgres.dump" "$DRILL_CONTAINER_NAME:/tmp/postgres.dump"
  docker exec "$DRILL_CONTAINER_NAME" pg_restore --list /tmp/postgres.dump >/dev/null
  docker exec "$DRILL_CONTAINER_NAME" pg_restore \
    --username "$DB_USER" \
    --dbname "$DB_NAME" \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    /tmp/postgres.dump >/dev/null
  docker exec "$DRILL_CONTAINER_NAME" psql --username "$DB_USER" --dbname "$DB_NAME" --tuples-only --no-align --command 'select count(*) from users;' >/dev/null
  docker exec "$DRILL_CONTAINER_NAME" psql --username "$DB_USER" --dbname "$DB_NAME" --tuples-only --no-align --command 'select count(*) from issues;' >/dev/null
}

main() {
  require_cmd python3
  require_cmd find
  require_cmd tar
  require_cmd awk
  require_cmd head
  require_cmd grep
  require_cmd cmp
  require_cmd wc
  require_cmd seq
  require_cmd sleep
  require_cmd mktemp

  require_bool ALLOW_EMPTY_R2_RESTORE "$ALLOW_EMPTY_R2_RESTORE"

  [ -r "$BACKUP_ENV" ] || die "Backup env file is missing or unreadable: $BACKUP_ENV"

  set -a
  . "$BACKUP_ENV"
  set +a

  mkdir -p "$RESTORE_PARENT_DIR"
  RESTORE_WORK_DIR="$(mktemp -d "$RESTORE_PARENT_DIR/mw-restore-drill.XXXXXXXX")"
  chmod 0700 "$RESTORE_WORK_DIR"
  trap cleanup EXIT

  require_cmd restic

  LATEST_SNAPSHOT="$(find_latest_snapshot)" || die "No restic snapshot tagged munich-weekly was found"
  restic restore "$LATEST_SNAPSHOT" --target "$RESTORE_WORK_DIR"

  RESTORED_SNAPSHOT_DIR="$(find_restored_snapshot_dir)"
  validate_snapshot_artifacts
  validate_and_restore_r2_backup
  run_postgres_restore_drill

  echo "Restore drill succeeded from snapshot ${LATEST_SNAPSHOT}"
}

main "$@"
