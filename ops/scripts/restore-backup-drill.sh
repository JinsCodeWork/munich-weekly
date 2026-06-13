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

stat_owner_mode() {
  local file_path="$1"
  if stat -c '%U %a' "$file_path" 2>/dev/null; then
    return 0
  fi
  stat -f '%Su %Lp' "$file_path" 2>/dev/null
}

require_root_only_file_permissions() {
  local file_path="$1"
  local label="$2"
  require_cmd stat
  local owner mode owner_perms group_perms other_perms
  read -r owner mode < <(stat_owner_mode "$file_path") || die "Could not stat $label: $file_path"

  if [ "$owner" != "root" ]; then
    die "$label must be owned by root: $file_path"
  fi

  mode=$((10#$mode))
  owner_perms=$((mode / 100 % 10))
  group_perms=$((mode / 10 % 10))
  other_perms=$((mode % 10))

  if [ $((owner_perms & 4)) -eq 0 ] || [ "$group_perms" -ne 0 ] || [ "$other_perms" -ne 0 ]; then
    die "$label must be readable only by root: $file_path"
  fi
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
  restic snapshots --tag munich-weekly,production --json | python3 -c '
import json
import sys

snapshots = json.load(sys.stdin)
if not snapshots:
    sys.exit(1)

required_tags = {"munich-weekly", "production"}
matching = [
    snapshot
    for snapshot in snapshots
    if required_tags.issubset(set(snapshot.get("tags") or []))
]
if not matching:
    sys.exit(1)

matching.sort(key=lambda item: item.get("time", ""))
latest = matching[-1].get("short_id") or matching[-1].get("id")
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

write_object_list_from_manifest() {
  local manifest_file="$1"
  local output_file="$2"

  awk -F ';' '
    NF >= 3 {
      path = $0
      sub(/^[^;]*;[^;]*;/, "", path)
      if ($2 != "" && path != "") {
        print $2 ";" path
      }
    }
  ' "$manifest_file" | sort > "$output_file"
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

validate_and_restore_r2_backup() {
  local r2_backup_path
  local expected_objects_file
  local restored_objects_file
  local source_objects_file="$RESTORED_SNAPSHOT_DIR/r2-source-objects.txt"
  local backup_objects_file="$RESTORED_SNAPSHOT_DIR/r2-backup-objects.txt"

  if [ ! -f "$source_objects_file" ]; then
    source_objects_file="$RESTORE_WORK_DIR/r2-source-objects-from-manifest.txt"
    write_object_list_from_manifest "$RESTORED_SNAPSHOT_DIR/r2-source-manifest.txt" "$source_objects_file"
  fi
  if [ ! -f "$backup_objects_file" ]; then
    backup_objects_file="$RESTORE_WORK_DIR/r2-backup-objects-from-manifest.txt"
    write_object_list_from_manifest "$RESTORED_SNAPSHOT_DIR/r2-backup-manifest.txt" "$backup_objects_file"
  fi

  if [ ! -s "$source_objects_file" ]; then
    if [ -s "$backup_objects_file" ]; then
      die "R2 backup object list is non-empty but source object list is empty"
    fi
    if [ "$ALLOW_EMPTY_R2_RESTORE" = "true" ]; then
      echo "R2 source object list is empty; continuing because ALLOW_EMPTY_R2_RESTORE=true" >&2
      return 0
    fi
    die "R2 source object list is empty; set ALLOW_EMPTY_R2_RESTORE=true only after confirming production has no upload objects"
  fi

  if [ ! -s "$backup_objects_file" ]; then
    die "R2 backup object list is empty but source object list is non-empty"
  fi

  cmp -s "$source_objects_file" "$backup_objects_file" ||
    die "R2 source and backup object lists differ"

  expected_objects_file="$backup_objects_file"

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

  restored_objects_file="$RESTORE_WORK_DIR/r2-restored-objects.txt"
  write_restored_object_list "$R2_RESTORE_DIR" "$restored_objects_file"
  cmp -s "$expected_objects_file" "$restored_objects_file" ||
    die "Restored R2 object list does not match expected backup object list"
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
  require_cmd sort
  require_cmd seq
  require_cmd sleep
  require_cmd mktemp

  require_bool ALLOW_EMPTY_R2_RESTORE "$ALLOW_EMPTY_R2_RESTORE"

  [ -r "$BACKUP_ENV" ] || die "Backup env file is missing or unreadable: $BACKUP_ENV"
  require_root_only_file_permissions "$BACKUP_ENV" "Backup env file"

  set -a
  . "$BACKUP_ENV"
  set +a
  export RCLONE_CONFIG="${RCLONE_CONFIG:-/etc/munich-weekly/rclone.conf}"
  require_root_only_file_permissions "$RCLONE_CONFIG" "Rclone config file"

  mkdir -p "$RESTORE_PARENT_DIR"
  RESTORE_WORK_DIR="$(mktemp -d "$RESTORE_PARENT_DIR/mw-restore-drill.XXXXXXXX")"
  chmod 0700 "$RESTORE_WORK_DIR"
  trap cleanup EXIT

  require_cmd restic

  LATEST_SNAPSHOT="$(find_latest_snapshot)" || die "No restic snapshot tagged munich-weekly and production was found"
  restic restore "$LATEST_SNAPSHOT" --target "$RESTORE_WORK_DIR"

  RESTORED_SNAPSHOT_DIR="$(find_restored_snapshot_dir)"
  validate_snapshot_artifacts
  validate_and_restore_r2_backup
  run_postgres_restore_drill

  echo "Restore drill succeeded from snapshot ${LATEST_SNAPSHOT}"
}

main "$@"
