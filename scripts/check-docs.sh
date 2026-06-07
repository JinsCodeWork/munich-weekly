#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "Checking markdown links and documentation content..."
python3 - <<'PY'
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path.cwd()
MARKDOWN_ROOTS = [
    Path("README.md"),
    Path("AGENTS.md"),
    Path("docs"),
    Path("backend/docs"),
    Path(".github"),
]
EXCLUDED_MARKDOWN_DIRS = [
    Path("docs/superpowers"),
]

STALE_PATTERNS = [
    "docs/api.json currently contains",
    "needs cleanup in WU-2",
    "Complete API endpoint documentation",
    "Complete endpoint documentation",
    "Updated API documentation (if applicable)",
    "npm run type-check",
    "secure HTTP-only cookies",
    "Font Awesome",
    "GET /api/config",
    "POST /api/admin/config",
    "Uses Flyway",
    "Create Flyway migration",
    "Flyway logs",
]

REQUIRED_OPENAPI_PATHS = [
    "/api/auth/login/email",
    "/api/gallery/admin/issues/{issueId}/items",
    "/api/gallery/admin/issues/{issueId}/custom-images",
    "/api/submissions/{submissionId}/anonymous-upload",
]

LOCAL_AGENT_SECRET_NAMES = [
    "SSH_PASSWORD",
    "LOCAL_ADMIN_EMAIL",
    "LOCAL_ADMIN_PW",
]


def fail(message: str) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(1)


def markdown_files() -> list[Path]:
    files: list[Path] = []
    for root in MARKDOWN_ROOTS:
        if not root.exists():
            continue
        if root.is_file() and root.suffix == ".md":
            files.append(root)
        elif root.is_dir():
            files.extend(sorted(path for path in root.rglob("*.md") if path.is_file()))
    return [
        file_path for file_path in files
        if not any(file_path.is_relative_to(excluded) for excluded in EXCLUDED_MARKDOWN_DIRS)
    ]


def docs_files_requiring_index_entry() -> list[Path]:
    docs_root = Path("docs")
    if not docs_root.exists():
        return []
    return [
        file_path for file_path in sorted(docs_root.rglob("*.md"))
        if file_path.name != "index.md"
        and not any(file_path.is_relative_to(excluded) for excluded in EXCLUDED_MARKDOWN_DIRS)
    ]


def check_docs_index_coverage() -> None:
    index_path = Path("docs/index.md")
    if not index_path.exists():
        fail("docs/index.md is missing")

    index_text = index_path.read_text(encoding="utf-8")
    missing: list[str] = []
    for file_path in docs_files_requiring_index_entry():
        link_target = file_path.relative_to("docs").as_posix()
        if link_target not in index_text:
            missing.append(str(file_path))

    if missing:
        fail("docs/index.md is missing live documentation entries:\n" + "\n".join(missing))


def github_heading_slug(heading: str) -> str:
    heading = re.sub(r"`([^`]*)`", r"\1", heading)
    heading = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", heading)
    heading = re.sub(r"<[^>]+>", "", heading)
    heading = heading.strip().lower()
    heading = re.sub(r"[^\w\s-]", "", heading, flags=re.UNICODE)
    heading = re.sub(r"\s+", "-", heading)
    return heading


def heading_slugs(file_path: Path) -> set[str]:
    slugs: set[str] = set()
    for line in file_path.read_text(encoding="utf-8").splitlines():
        match = re.match(r"^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$", line)
        if match:
            slugs.add(github_heading_slug(match.group(1)))
    return slugs


def check_markdown_links(files: list[Path]) -> None:
    link_pattern = re.compile(r"!?\[[^\]]+\]\(([^)]+)\)")
    errors: list[str] = []
    slug_cache: dict[Path, set[str]] = {}

    for file_path in files:
        text = file_path.read_text(encoding="utf-8")
        for match in link_pattern.finditer(text):
            link = match.group(1).strip()
            if link.startswith(("http:", "https:", "mailto:")):
                continue

            clean_link = link.removeprefix("<").removesuffix(">").split()[0]
            path_part, _, anchor = clean_link.partition("#")
            target = file_path.resolve() if not path_part else (file_path.parent / path_part).resolve()
            try:
                target.relative_to(ROOT)
            except ValueError:
                errors.append(f"{file_path} -> {link} escapes the repository")
                continue

            if not target.exists():
                errors.append(f"{file_path} -> {link}")
                continue

            if anchor and target.suffix == ".md":
                target_path = target.relative_to(ROOT)
                slug_cache.setdefault(target_path, heading_slugs(target_path))
                if anchor not in slug_cache[target_path]:
                    errors.append(f"{file_path} -> {link} has no matching heading")

    if errors:
        fail("Broken local markdown links:\n" + "\n".join(errors))


def check_stale_patterns(files: list[Path]) -> None:
    errors: list[str] = []

    for file_path in files:
        text = file_path.read_text(encoding="utf-8")
        for pattern in STALE_PATTERNS:
            if pattern in text:
                errors.append(f"{file_path}: contains stale phrase {pattern!r}")

    endpoint_list_pattern = re.compile(r"^- \*\*(GET|POST|PUT|PATCH|DELETE)\*\* `/api", re.MULTILINE)
    for file_path in (Path("docs/api.md"), Path("backend/docs/api.md")):
        if file_path.exists() and endpoint_list_pattern.search(file_path.read_text(encoding="utf-8")):
            errors.append(f"{file_path}: contains a hand-maintained endpoint list")

    if errors:
        fail("Stale documentation content:\n" + "\n".join(errors))


def check_no_local_agent_secret_values(files: list[Path]) -> None:
    assignment_pattern = re.compile(
        r"\b(" + "|".join(re.escape(name) for name in LOCAL_AGENT_SECRET_NAMES) + r")\s*=\s*\S+"
    )
    errors: list[str] = []

    for file_path in files:
        text = file_path.read_text(encoding="utf-8")
        for match in assignment_pattern.finditer(text):
            line_number = text.count("\n", 0, match.start()) + 1
            errors.append(f"{file_path}:{line_number}: do not document local agent secret values")

    if errors:
        fail("Local agent secret values found in documentation:\n" + "\n".join(errors))


def check_trailing_whitespace(files: list[Path]) -> None:
    text_files = list(files)
    text_files.extend(sorted(Path("scripts").glob("*.sh")))
    workflows_dir = Path(".github/workflows")
    if workflows_dir.exists():
        text_files.extend(sorted(workflows_dir.glob("*.yml")))
        text_files.extend(sorted(workflows_dir.glob("*.yaml")))

    errors: list[str] = []
    for file_path in sorted(set(text_files)):
        if not file_path.exists():
            continue
        for line_number, line in enumerate(file_path.read_text(encoding="utf-8").splitlines(), start=1):
            if line.rstrip(" \t") != line:
                errors.append(f"{file_path}:{line_number}")

    if errors:
        fail("Trailing whitespace found:\n" + "\n".join(errors))


def check_positive_sentinels() -> None:
    sentinel_checks = [
        (
            Path("AGENTS.md"),
            "jdbc:postgresql://localhost:5432",
            "AGENTS.md must document host-run datasource override to localhost",
        ),
        (
            Path("docs/local-development.md"),
            "DataResetService.resetAllData()",
            "docs/local-development.md must warn that the dev profile resets data",
        ),
        (
            Path("docs/environment.md"),
            "dev` clears and reseeds data",
            "docs/environment.md must document destructive dev profile behavior",
        ),
        (
            Path("docs/deployment.md"),
            "Production must not use `SPRING_PROFILES_ACTIVE=dev`",
            "docs/deployment.md must warn against using the dev profile in production",
        ),
        (
            Path("backend/docs/api.md"),
            "../../docs/api.json",
            "backend/docs/api.md must remain a pointer to the generated root schema",
        ),
        (
            Path("AGENTS.md"),
            "ssh munichweekly",
            "AGENTS.md must document the configured SSH host alias for agents",
        ),
        (
            Path("AGENTS.md"),
            "SSH_PASSWORD",
            "AGENTS.md must document SSH_PASSWORD as a local-only agent secret name",
        ),
        (
            Path("docs/environment.md"),
            "LOCAL_ADMIN_EMAIL",
            "docs/environment.md must document LOCAL_ADMIN_EMAIL as a local-only agent secret name",
        ),
        (
            Path("docs/environment.md"),
            "LOCAL_ADMIN_PW",
            "docs/environment.md must document LOCAL_ADMIN_PW as a local-only agent secret name",
        ),
        (
            Path("docs/api.md"),
            "does not cover `/frontend-api/*`",
            "docs/api.md must state that Spring OpenAPI does not cover frontend route handlers",
        ),
        (
            Path("docs/frontend-api.md"),
            "frontend/src/app/frontend-api",
            "docs/frontend-api.md must document Next.js frontend route handler source files",
        ),
        (
            Path("docs/frontend-api.md"),
            "/frontend-api/config",
            "docs/frontend-api.md must document the public frontend config API",
        ),
        (
            Path("docs/frontend-api.md"),
            "/frontend-api/admin/config",
            "docs/frontend-api.md must document the admin frontend config API",
        ),
    ]

    errors: list[str] = []
    for file_path, needle, message in sentinel_checks:
        if not file_path.exists() or needle not in file_path.read_text(encoding="utf-8"):
            errors.append(message)

    if errors:
        fail("Missing required documentation sentinels:\n" + "\n".join(errors))


def check_env_local_is_ignored() -> None:
    result = subprocess.run(
        ["git", "check-ignore", "-q", ".env.local"],
        check=False,
    )
    if result.returncode != 0:
        fail(".env.local must be ignored by git")


def frontend_route_path(route_file: Path) -> str:
    relative = route_file.relative_to(Path("frontend/src/app/frontend-api"))
    parts = list(relative.parts[:-1])
    if not parts:
        return "/frontend-api"
    return "/frontend-api/" + "/".join(parts)


def check_frontend_api_inventory() -> None:
    docs_path = Path("docs/frontend-api.md")
    route_root = Path("frontend/src/app/frontend-api")
    if not docs_path.exists() or not route_root.exists():
        return

    docs_text = docs_path.read_text(encoding="utf-8")
    documented = set(
        re.findall(r"\|\s*`(GET|POST|PUT|PATCH|DELETE)`\s*\|\s*`(/frontend-api[^`]*)`", docs_text)
    )

    actual: set[tuple[str, str]] = set()
    for route_file in sorted(route_root.rglob("route.ts")):
        text = route_file.read_text(encoding="utf-8")
        path = frontend_route_path(route_file)
        for method in re.findall(r"export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\b", text):
            actual.add((method, path))

    missing = sorted(actual - documented)
    stale = sorted(documented - actual)
    errors: list[str] = []
    if missing:
        errors.append(
            "docs/frontend-api.md is missing frontend route handlers:\n"
            + "\n".join(f"{method} {path}" for method, path in missing)
        )
    if stale:
        errors.append(
            "docs/frontend-api.md lists frontend route handlers not found in code:\n"
            + "\n".join(f"{method} {path}" for method, path in stale)
        )

    if errors:
        fail("\n".join(errors))


def check_openapi_schema() -> None:
    api_path = Path("docs/api.json")
    if not api_path.exists():
        fail("docs/api.json is missing")

    status = subprocess.run(
        ["git", "status", "--ignored", "--short", str(api_path)],
        check=True,
        capture_output=True,
        text=True,
    ).stdout
    if status.startswith("!!"):
        fail("docs/api.json is ignored by git; it must be a committed generated artifact")

    try:
        schema = json.loads(api_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        fail(f"docs/api.json is not valid JSON: {error}")

    openapi = schema.get("openapi")
    paths = schema.get("paths")
    if not isinstance(openapi, str) or not openapi.startswith("3."):
        fail("docs/api.json is not an OpenAPI 3 document")
    if not isinstance(paths, dict) or not paths:
        fail("docs/api.json does not contain any paths")
    if "error" in schema and "openapi" not in schema:
        fail("docs/api.json looks like an error response instead of an OpenAPI schema")

    security_schemes = schema.get("components", {}).get("securitySchemes", {})
    bearer_auth = security_schemes.get("bearerAuth", {})
    if bearer_auth.get("type") != "http" or bearer_auth.get("scheme") != "bearer":
        fail("docs/api.json must define bearerAuth as an HTTP bearer security scheme")

    frontend_paths = [path for path in paths if path.startswith("/frontend-api/")]
    if frontend_paths:
        fail("docs/api.json must not include frontend-only routes:\n" + "\n".join(frontend_paths))

    missing = [path for path in REQUIRED_OPENAPI_PATHS if path not in paths]
    if missing:
        fail("docs/api.json is missing required paths:\n" + "\n".join(missing))

    print(f"OpenAPI {openapi} with {len(paths)} paths")


files = markdown_files()
check_markdown_links(files)
check_docs_index_coverage()
check_stale_patterns(files)
check_no_local_agent_secret_values(files)
check_trailing_whitespace(files)
check_positive_sentinels()
check_env_local_is_ignored()
check_frontend_api_inventory()
check_openapi_schema()
print("Documentation content checks passed")
PY

echo "Checking whitespace in tracked diffs..."
git diff --check -- . ':!frontend/node_modules' ':!frontend/.next'

echo "Documentation checks passed"
