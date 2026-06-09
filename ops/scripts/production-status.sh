#!/usr/bin/env bash
set -uo pipefail

APP_DIR="${APP_DIR:-/home/deploy/munich-weekly}"
BACKUP_UNIT="${BACKUP_UNIT:-munich-weekly-backup.service}"
BACKUP_TIMER="${BACKUP_TIMER:-munich-weekly-backup.timer}"
BACKEND_HEALTH_URL="${BACKEND_HEALTH_URL:-http://127.0.0.1:8080/api/layout/health}"
LOCAL_FRONTEND_URL="${LOCAL_FRONTEND_URL:-http://127.0.0.1:3000/}"
PUBLIC_FRONTEND_URL="${PUBLIC_FRONTEND_URL:-https://munichweekly.art}"
STATUS_PROBE_TIMEOUT="${STATUS_PROBE_TIMEOUT:-20s}"
STATUS_FAILED=0

iso_date() {
  date -Is 2>/dev/null || date -u '+%Y-%m-%dT%H:%M:%SZ'
}

section() {
  printf '\n## %s\n' "$1"
}

mark_failed() {
  STATUS_FAILED=1
  printf 'STATUS CHECK FAILED: %s\n' "$*" >&2
}

run_with_timeout() {
  local label="$1"
  shift

  if ! command -v timeout >/dev/null 2>&1; then
    printf 'Required command not found: timeout\n' >&2
    return 127
  fi

  timeout --foreground "$STATUS_PROBE_TIMEOUT" "$@"
  local status=$?
  if [ "$status" -eq 124 ]; then
    printf 'Check timed out after %s: %s\n' "$STATUS_PROBE_TIMEOUT" "$label" >&2
  fi
  return "$status"
}

run_required() {
  local label="$1"
  shift

  section "$label"
  if ! command -v "$1" >/dev/null 2>&1; then
    mark_failed "required command not found: $1"
    return 1
  fi
  if ! run_with_timeout "$label" "$@"; then
    mark_failed "$label failed"
    return 1
  fi
}

run_optional() {
  local label="$1"
  shift

  section "$label"
  if ! command -v "$1" >/dev/null 2>&1; then
    printf 'Optional command not found: %s\n' "$1"
    return 0
  fi
  if ! run_with_timeout "$label" "$@"; then
    printf 'Optional check failed: %s\n' "$label"
    return 0
  fi
}

run_optional_shell() {
  local label="$1"
  shift

  section "$label"
  if ! command -v "$1" >/dev/null 2>&1; then
    printf 'Optional command not found: %s\n' "$1"
    return 0
  fi
  if ! run_with_timeout "$label" "$@"; then
    printf 'Optional check failed: %s\n' "$label"
  fi
}

curl_headers() {
  local url="$1"
  curl -fsSI --connect-timeout 10 --max-time 20 "$url" | sed -n '1,20p'
}

printf '# Munich Weekly Production Status\n'
printf 'Date: %s\n' "$(iso_date)"
printf 'Host: %s\n' "$(hostname)"

run_required "Uptime" uptime

section "Disk"
if command -v df >/dev/null 2>&1; then
  if ! run_with_timeout "Disk" df -hT / /var /home 2>/dev/null; then
    run_with_timeout "Disk fallback" df -hT || mark_failed "disk usage check failed"
  fi
else
  mark_failed "required command not found: df"
fi

run_required "Memory" free -h

section "Reboot Required"
if [ -e /var/run/reboot-required ]; then
  printf 'Reboot required: yes\n'
  if [ -r /var/run/reboot-required.pkgs ]; then
    sed -n '1,50p' /var/run/reboot-required.pkgs
  fi
else
  printf 'Reboot required: no\n'
fi

section "Apt Upgradable Count"
if command -v apt >/dev/null 2>&1; then
  if ! run_with_timeout "Apt Upgradable Count" apt list --upgradable 2>/dev/null | awk 'NR > 1 { count++ } END { print count + 0 }'; then
    printf 'Optional check failed: Apt Upgradable Count\n'
  fi
else
  printf 'Optional command not found: apt\n'
fi

run_required "Docker Containers" docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'

run_optional "PM2 Status" sudo -n -u deploy env HOME=/home/deploy PM2_HOME=/home/deploy/.pm2 pm2 status --no-color

section "Backend Health"
if command -v curl >/dev/null 2>&1; then
  if ! curl -fsS --connect-timeout 10 --max-time 20 "$BACKEND_HEALTH_URL"; then
    mark_failed "backend health check failed"
  else
    printf '\n'
  fi
else
  mark_failed "required command not found: curl"
fi

section "Local Frontend Headers"
if command -v curl >/dev/null 2>&1; then
  curl_headers "$LOCAL_FRONTEND_URL" || mark_failed "local frontend header check failed"
else
  mark_failed "required command not found: curl"
fi

section "Public Frontend Headers"
if command -v curl >/dev/null 2>&1; then
  curl_headers "$PUBLIC_FRONTEND_URL" || mark_failed "public frontend header check failed"
else
  mark_failed "required command not found: curl"
fi

section "Git"
if command -v git >/dev/null 2>&1; then
  if [ -d "$APP_DIR/.git" ]; then
    run_with_timeout "Git revision" git -C "$APP_DIR" rev-parse --short HEAD || mark_failed "git revision check failed"
    git_status_output="$(run_with_timeout "Git status" git -C "$APP_DIR" status --short)"
    git_status_code=$?
    if [ "$git_status_code" -ne 0 ]; then
      mark_failed "git status check failed"
    elif [ -n "$git_status_output" ]; then
      printf '%s\n' "$git_status_output"
      mark_failed "git working tree has uncommitted or untracked changes"
    else
      printf 'Working tree clean\n'
    fi
  else
    mark_failed "APP_DIR is not a git checkout: $APP_DIR"
  fi
else
  mark_failed "required command not found: git"
fi

run_optional "Backup Timer" systemctl list-timers "$BACKUP_TIMER" --no-pager
run_optional_shell "Recent Backup Journal" journalctl -u "$BACKUP_UNIT" -n 80 --no-pager

exit "$STATUS_FAILED"
