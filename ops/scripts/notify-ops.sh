#!/usr/bin/env bash
set -euo pipefail

ALERT_ENV="${ALERT_ENV:-/etc/munich-weekly/alerts.env}"
FAILED_UNIT="${1:-unknown-unit}"

iso_date() {
  date -Is 2>/dev/null || date -u '+%Y-%m-%dT%H:%M:%SZ'
}

if [ -r "$ALERT_ENV" ]; then
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
  curl -fsS -X POST \
    -H 'Content-Type: text/plain; charset=utf-8' \
    --data-binary "$MESSAGE" \
    "$OPS_ALERT_WEBHOOK_URL" \
    >/dev/null
else
  printf '%s\n' "$MESSAGE" >&2
fi
