#!/usr/bin/env bash
set -euo pipefail

ALERT_ENV="${ALERT_ENV:-/etc/munich-weekly/alerts.env}"
FAILED_UNIT="${1:-unknown-unit}"
OPS_ALERT_CONNECT_TIMEOUT="${OPS_ALERT_CONNECT_TIMEOUT:-10}"
OPS_ALERT_MAX_TIME="${OPS_ALERT_MAX_TIME:-20}"

iso_date() {
  date -Is 2>/dev/null || date -u '+%Y-%m-%dT%H:%M:%SZ'
}

stat_mode() {
  local path="$1"

  stat -c '%a' "$path" 2>/dev/null || stat -f '%Lp' "$path"
}

stat_uid() {
  local path="$1"

  stat -c '%u' "$path" 2>/dev/null || stat -f '%u' "$path"
}

validate_alert_env() {
  if [ "$ALERT_ENV" = "/dev/null" ]; then
    return 0
  fi

  if [ ! -f "$ALERT_ENV" ]; then
    printf 'Alert env is not a regular file: %s\n' "$ALERT_ENV" >&2
    return 1
  fi
  if [ -L "$ALERT_ENV" ]; then
    printf 'Alert env must not be a symlink: %s\n' "$ALERT_ENV" >&2
    return 1
  fi

  local mode
  mode="$(stat_mode "$ALERT_ENV")"
  if [ -z "$mode" ] || [[ "$mode" == *[!0-7]* ]]; then
    printf 'Unable to validate alert env permissions: %s\n' "$ALERT_ENV" >&2
    return 1
  fi
  if (( (8#$mode & 077) != 0 )); then
    printf 'Alert env must not be readable, writable, or executable by group/other: %s\n' "$ALERT_ENV" >&2
    return 1
  fi

  if [ "$(id -u)" -eq 0 ]; then
    local owner_uid
    owner_uid="$(stat_uid "$ALERT_ENV")"
    if [ "$owner_uid" != "0" ]; then
      printf 'Alert env must be owned by root when loaded by root: %s\n' "$ALERT_ENV" >&2
      return 1
    fi
  fi
}

if [ -r "$ALERT_ENV" ]; then
  validate_alert_env
  set -a
  . "$ALERT_ENV"
  set +a
fi

MESSAGE="$(cat <<EOF
Munich Weekly operations alert
Date: $(iso_date)
Host: $(hostname)
Failed unit: ${FAILED_UNIT}
EOF
)"

if [ -n "${OPS_ALERT_WEBHOOK_URL:-}" ]; then
  if ! command -v curl >/dev/null 2>&1; then
    printf 'curl is required to deliver configured operations alerts\n' >&2
    exit 127
  fi

  curl -fsS -X POST \
    --connect-timeout "$OPS_ALERT_CONNECT_TIMEOUT" \
    --max-time "$OPS_ALERT_MAX_TIME" \
    -H 'Content-Type: text/plain; charset=utf-8' \
    --data-binary "$MESSAGE" \
    "$OPS_ALERT_WEBHOOK_URL" \
    >/dev/null
else
  printf '%s\n' "$MESSAGE" >&2
fi
