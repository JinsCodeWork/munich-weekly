#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/home/deploy/munich-weekly}"
BRANCH="${BRANCH:-main}"
LOCK_FILE="${LOCK_FILE:-/tmp/munich-weekly-deploy.lock}"
BACKUP_SERVICE="${BACKUP_SERVICE:-munich-weekly-backup.service}"
SMOKE_TIMEOUT_SECONDS="${SMOKE_TIMEOUT_SECONDS:-120}"
SMOKE_INTERVAL_SECONDS="${SMOKE_INTERVAL_SECONDS:-3}"

BACKEND_HEALTH_URL="${BACKEND_HEALTH_URL:-http://127.0.0.1:8080/api/layout/health}"
FRONTEND_LOCAL_URL="${FRONTEND_LOCAL_URL:-http://127.0.0.1:3000/}"
PUBLIC_URL="${PUBLIC_URL:-https://munichweekly.art}"
PM2_PROCESS_NAME="${PM2_PROCESS_NAME:-munich-frontend}"

CURRENT_COMMIT=""
CURRENT_COMMIT_SHORT=""
CURRENT_REF=""
CURRENT_WAS_BRANCH=false
TARGET_COMMIT=""
TARGET_COMMIT_SHORT=""
ROLLBACK_ENABLED=false
ROLLBACK_RUNNING=false

log() {
  printf '\n== %s ==\n' "$*"
}

info() {
  printf '%s\n' "$*"
}

die() {
  printf '%s\n' "$*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Required command not found: $1"
}

require_docker_compose() {
  docker compose version >/dev/null 2>&1 || die "Required Docker Compose plugin not available: docker compose"
}

require_app_layout() {
  [ -d "$APP_DIR/.git" ] || die "APP_DIR is not a Git working tree: $APP_DIR"
  [ -d "$APP_DIR/backend" ] || die "Backend directory missing: $APP_DIR/backend"
  [ -d "$APP_DIR/frontend" ] || die "Frontend directory missing: $APP_DIR/frontend"
}

validate_config() {
  case "$BRANCH" in
    ""|-*|+*|@*|refs/*|*:*|*..*|*~*|*^*|*\\*|*//*|*/.|*.|*/*.|*.lock)
      die "Invalid deploy branch: $BRANCH"
      ;;
  esac
  [[ "$BRANCH" =~ ^[A-Za-z0-9][A-Za-z0-9._/-]*$ ]] || die "Invalid deploy branch: $BRANCH"
  git check-ref-format --branch "$BRANCH" >/dev/null 2>&1 || die "Invalid deploy branch: $BRANCH"

  case "$SMOKE_TIMEOUT_SECONDS" in
    ''|*[!0-9]*) die "SMOKE_TIMEOUT_SECONDS must be a positive integer" ;;
  esac
  case "$SMOKE_INTERVAL_SECONDS" in
    ''|*[!0-9]*) die "SMOKE_INTERVAL_SECONDS must be a positive integer" ;;
  esac
  [ "$SMOKE_TIMEOUT_SECONDS" -gt 0 ] || die "SMOKE_TIMEOUT_SECONDS must be greater than 0"
  [ "$SMOKE_INTERVAL_SECONDS" -gt 0 ] || die "SMOKE_INTERVAL_SECONDS must be greater than 0"
}

acquire_lock() {
  local lock_dir
  lock_dir="$(dirname "$LOCK_FILE")"
  mkdir -p "$lock_dir"
  exec 9>"$LOCK_FILE"
  flock -n 9 || die "Another deployment is already running."
}

require_clean_worktree() {
  local status
  status="$(git status --short)"
  if [ -n "$status" ]; then
    printf '%s\n' "Working tree is dirty; refusing to deploy." >&2
    printf '%s\n' "$status" >&2
    exit 1
  fi
}

record_current_revision() {
  CURRENT_COMMIT="$(git rev-parse HEAD)"
  CURRENT_COMMIT_SHORT="$(git rev-parse --short HEAD)"
  CURRENT_REF="$(git symbolic-ref --quiet --short HEAD || true)"
  if [ -n "$CURRENT_REF" ]; then
    CURRENT_WAS_BRANCH=true
  else
    CURRENT_REF="detached:${CURRENT_COMMIT}"
  fi

  info "Current ref: ${CURRENT_REF}"
  info "Current commit: ${CURRENT_COMMIT_SHORT}"
}

fetch_target_revision() {
  git fetch origin "refs/heads/${BRANCH}:refs/remotes/origin/${BRANCH}"
  TARGET_COMMIT="$(git rev-parse --verify "refs/remotes/origin/${BRANCH}^{commit}")"
  TARGET_COMMIT_SHORT="$(git rev-parse --short "$TARGET_COMMIT")"
  info "Target ref: origin/${BRANCH}"
  info "Target commit: ${TARGET_COMMIT_SHORT}"
}

run_backup() {
  sudo -n systemctl start "$BACKUP_SERVICE"
}

checkout_target() {
  git checkout --detach "$TARGET_COMMIT"
}

frontend_install_audit_build() {
  cd "$APP_DIR/frontend"
  npm ci
  npm audit --omit=dev --audit-level=high
  npm run build
}

backend_rebuild_restart() {
  cd "$APP_DIR/backend"
  docker compose up -d --build backend
}

pm2_process_exists() {
  pm2 describe "$PM2_PROCESS_NAME" >/dev/null 2>&1
}

pm2_reload_frontend() {
  cd "$APP_DIR/frontend"

  if [ -f ecosystem.config.cjs ]; then
    pm2 startOrReload ecosystem.config.cjs --only "$PM2_PROCESS_NAME"
  elif pm2_process_exists; then
    pm2 restart "$PM2_PROCESS_NAME"
  else
    pm2 start npm --name "$PM2_PROCESS_NAME" -- start
  fi

  pm2 save
}

smoke_url() {
  local url="$1"
  local start now
  start="$(date +%s)"

  info "Waiting for ${url}"
  while true; do
    if curl -fsS --max-time 10 "$url" >/dev/null; then
      return 0
    fi

    now="$(date +%s)"
    if [ $((now - start)) -ge "$SMOKE_TIMEOUT_SECONDS" ]; then
      printf '%s\n' "Smoke check timed out for ${url}" >&2
      return 1
    fi

    sleep "$SMOKE_INTERVAL_SECONDS"
  done
}

smoke_public_headers() {
  local headers_file
  local start now
  start="$(date +%s)"
  headers_file="$(mktemp)"

  info "Waiting for response headers from ${PUBLIC_URL}"
  while true; do
    if curl -fsSI --max-time 10 "$PUBLIC_URL" -o "$headers_file"; then
      if grep -iq '^x-powered-by:' "$headers_file"; then
        printf '%s\n' "X-Powered-By header is present on ${PUBLIC_URL}" >&2
        rm -f "$headers_file"
        return 1
      fi
      rm -f "$headers_file"
      return 0
    fi

    now="$(date +%s)"
    if [ $((now - start)) -ge "$SMOKE_TIMEOUT_SECONDS" ]; then
      printf '%s\n' "Public header check timed out for ${PUBLIC_URL}" >&2
      rm -f "$headers_file"
      return 1
    fi

    sleep "$SMOKE_INTERVAL_SECONDS"
  done
}

smoke_checks() {
  smoke_url "$BACKEND_HEALTH_URL"
  smoke_url "$FRONTEND_LOCAL_URL"
  smoke_url "$PUBLIC_URL"
  smoke_public_headers
}

restore_git_revision() {
  if [ "$CURRENT_WAS_BRANCH" = "true" ]; then
    git checkout "$CURRENT_REF" || git checkout --detach "$CURRENT_COMMIT"
    if [ "$(git rev-parse HEAD)" != "$CURRENT_COMMIT" ]; then
      printf '%s\n' "Original branch ${CURRENT_REF} no longer points at ${CURRENT_COMMIT_SHORT}; using detached rollback commit." >&2
      git checkout --detach "$CURRENT_COMMIT"
    fi
  else
    git checkout --detach "$CURRENT_COMMIT"
  fi
}

rollback() {
  local exit_code=$?
  local rollback_exit=0

  if [ "$ROLLBACK_RUNNING" = "true" ]; then
    exit "$exit_code"
  fi
  ROLLBACK_RUNNING=true
  trap - ERR

  if [ "$ROLLBACK_ENABLED" = "true" ]; then
    set +e
    printf '%s\n' "Deployment failed; attempting rollback to ${CURRENT_COMMIT_SHORT}" >&2

    cd "$APP_DIR" && restore_git_revision
    rollback_exit=$((rollback_exit || $?))

    backend_rebuild_restart
    rollback_exit=$((rollback_exit || $?))

    cd "$APP_DIR/frontend" && npm ci
    rollback_exit=$((rollback_exit || $?))

    cd "$APP_DIR/frontend" && npm run build
    rollback_exit=$((rollback_exit || $?))

    pm2_reload_frontend
    rollback_exit=$((rollback_exit || $?))

    if [ "$rollback_exit" -eq 0 ]; then
      printf '%s\n' "Rollback attempted. Inspect service logs and smoke checks before retrying deploy." >&2
    else
      printf '%s\n' "Rollback was attempted but one or more rollback commands failed. Inspect production manually." >&2
    fi
  fi

  exit "$exit_code"
}

main() {
  require_cmd dirname
  require_cmd flock
  require_cmd git
  require_cmd sudo
  require_cmd systemctl
  require_cmd npm
  require_cmd docker
  require_cmd curl
  require_cmd pm2
  require_cmd mktemp
  require_cmd grep
  require_cmd date
  require_cmd sleep
  require_docker_compose
  require_app_layout
  validate_config
  acquire_lock

  cd "$APP_DIR"

  log "Pre-deploy status"
  require_clean_worktree
  record_current_revision

  log "Fetch"
  fetch_target_revision

  log "Backup"
  run_backup

  log "Checkout"
  checkout_target
  ROLLBACK_ENABLED=true
  trap rollback ERR

  log "Frontend install, audit, and build"
  frontend_install_audit_build

  log "Backend rebuild and restart"
  backend_rebuild_restart

  log "Frontend reload"
  pm2_reload_frontend

  log "Smoke checks"
  smoke_checks

  ROLLBACK_ENABLED=false
  trap - ERR
  info "Deployment succeeded: ${CURRENT_COMMIT_SHORT} -> ${TARGET_COMMIT_SHORT}"
}

main "$@"
