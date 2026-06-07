#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_BASE_URL="${API_BASE_URL:-http://localhost:8080}"
OUTPUT_PATH="${1:-$ROOT_DIR/docs/api.json}"
DOCS_URL="${API_BASE_URL%/}/v3/api-docs"
FETCHED_JSON="$(mktemp)"

cleanup() {
  rm -f "$FETCHED_JSON"
}
trap cleanup EXIT

echo "Fetching OpenAPI schema from $DOCS_URL"
HTTP_STATUS="$(curl --silent --show-error --location --output "$FETCHED_JSON" --write-out "%{http_code}" "$DOCS_URL")"

if [[ "$HTTP_STATUS" != "200" ]]; then
  echo "Expected HTTP 200 from $DOCS_URL, got $HTTP_STATUS" >&2
  echo "Response body:" >&2
  sed -n '1,80p' "$FETCHED_JSON" >&2
  exit 1
fi

python3 - "$FETCHED_JSON" "$OUTPUT_PATH" <<'PY'
import json
import os
import sys

source_path, output_path = sys.argv[1], sys.argv[2]

with open(source_path, "r", encoding="utf-8") as source:
    data = json.load(source)

openapi_version = data.get("openapi")
paths = data.get("paths")

if not isinstance(openapi_version, str) or not openapi_version.startswith("3."):
    raise SystemExit("Response is JSON, but it is not an OpenAPI 3 document")

if not isinstance(paths, dict) or not paths:
    raise SystemExit("OpenAPI document does not contain any paths")

output_dir = os.path.dirname(os.path.abspath(output_path))
os.makedirs(output_dir, exist_ok=True)

tmp_output = f"{output_path}.tmp"
with open(tmp_output, "w", encoding="utf-8") as output:
    json.dump(data, output, indent=2, ensure_ascii=False, sort_keys=True)
    output.write("\n")

os.replace(tmp_output, output_path)
print(f"Wrote {output_path} ({len(paths)} paths, OpenAPI {openapi_version})")
PY
