# Munich Weekly Operations Automation and Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a repeatable operations workflow for Munich Weekly that automates dependency updates, CI checks, backups, deployment safety, source-server hardening, monitoring, and recovery practice.

**Architecture:** Keep runtime configuration and operating scripts versioned in this repository, while keeping production secrets only on the server or in the chosen secret store. Use GitHub automation for dependency and CI gates, server-side systemd timers for backups and maintenance checks, and a controlled deployment script that always runs backup and smoke checks. Treat Cloudflare as the public edge, but protect the origin directly so Cloudflare can no longer be bypassed by resolving the origin IP.

**Tech Stack:** GitHub Actions, Dependabot, Next.js 16, Node.js 20, Spring Boot 3.4, Java 21, Gradle, Docker Compose, PostgreSQL 15, Nginx, PM2, systemd timers, restic or rclone-backed encrypted offsite storage, Cloudflare R2/Cloudflare WAF.

---

## Current Production Baseline

Facts captured from the read-only SSH review on 2026-06-08:

- Host: `munichweeklyserver`, Ubuntu 24.04.3 LTS.
- Public listeners: Nginx on `80` and `443`, SSH on `22222`.
- Private listeners: backend on `127.0.0.1:8080`, PostgreSQL on `127.0.0.1:5432`.
- Frontend: PM2 process `munich-frontend`, Node `20.19.6`, serving Next.js on `3000`.
- Backend: Docker Compose project under `/home/deploy/munich-weekly/backend`, containers `mw-backend` and `mw-postgres`.
- Database: `munich_weekly_prod`, around 9 MB logical size, around 64 MB data directory.
- Uploads: host bind mount `/home/deploy/munich-weekly/backend/uploads`, currently empty.
- Backups: no database or uploads backup timer found.
- System updates: 59 apt packages pending and `/var/run/reboot-required` exists.
- GitHub automation: only `.github/workflows/docs-quality.yml` exists.
- Dependency status: `frontend` production `npm audit --omit=dev` reports 0 vulnerabilities; `next` is `16.2.7`; several packages are outdated.
- Source-origin risk: direct HTTPS requests to origin IP with `Host: munichweekly.art` return `200`, bypassing Cloudflare challenge/WAF.
- Logging risk: PM2 error log is around 17 MB; Docker json-file logging has no size limit; backend production logs SQL through `spring.jpa.show-sql=true`.

## Execution Model

Use subagent-driven development for implementation.

- Controller agent: this main session. Owns task sequencing, conflict resolution, final integration, and final verification.
- Implementer subagent: one fresh subagent per task. Use `model: gpt-5.5`, `reasoning_effort: medium`.
- Spec reviewer subagent: one fresh subagent after each task implementation. Use `model: gpt-5.5`, `reasoning_effort: medium`.
- Code quality/security reviewer subagent: one fresh subagent after spec approval. Use `model: gpt-5.5`, `reasoning_effort: medium`.
- Parallelism rule: do not run two implementers against overlapping write sets. Parallel review is allowed when reviewers inspect the same completed patch and do not edit files.
- Branch rule: do not implement on `main`. Create a branch named `codex/ops-automation-hardening` before the first code change unless the user explicitly selects another branch.
- Commit rule: commit after each task that produces a coherent, passing unit of work.
- Deployment rule: never run production-changing commands until the corresponding scripts/configs have been reviewed and the user approves the production execution step.

## File Structure

Files to create or modify across this plan:

- Create `.github/dependabot.yml`: dependency version update automation for npm, Gradle, Docker, and GitHub Actions.
- Create `.github/workflows/ci.yml`: main CI for frontend, backend, image worker, audits, and Docker build validation.
- Modify `.github/workflows/docs-quality.yml`: keep docs checks, align permissions and cache behavior with CI.
- Modify `frontend/next.config.js`: disable `X-Powered-By` and keep existing upload/image behavior.
- Modify or remove `frontend/next.config.ts`: remove unused duplicate config file after confirming Next uses `next.config.js`.
- Create `ops/nginx/munichweekly.art.conf`: versioned Nginx site config matching production with hardened request headers and no debug response headers.
- Create `ops/nginx/snippets/security-headers.conf`: versioned reusable Nginx response headers.
- Create `ops/scripts/update-cloudflare-origin-allowlist.sh`: generate an Nginx source allowlist snippet from Cloudflare IP ranges.
- Create `ops/nginx/snippets/cloudflare-authenticated-origin-pull.conf`: require Cloudflare's authenticated origin pull client certificate on HTTPS.
- Create `ops/scripts/backup-production.sh`: encrypted offsite backup wrapper for PostgreSQL dumps and local uploads.
- Create `ops/scripts/restore-backup-drill.sh`: restore latest backup into an isolated verification container/database.
- Create `ops/systemd/munich-weekly-backup.service`: systemd service for daily backup.
- Create `ops/systemd/munich-weekly-backup.timer`: systemd timer for daily backup.
- Create `ops/scripts/deploy-production.sh`: controlled production deploy script with pre-backup and smoke checks.
- Create `ops/scripts/production-status.sh`: read-only production status report.
- Create `ops/scripts/notify-ops.sh`: generic alert notification hook for systemd failures.
- Create `ops/systemd/munich-weekly-status.service`: systemd service for status checks.
- Create `ops/systemd/munich-weekly-status.timer`: systemd timer for status checks.
- Modify `backend/compose.yaml`: add healthchecks and Docker log options.
- Modify `backend/src/main/resources/application-prod.properties`: disable SQL logging and set production log levels.
- Create `frontend/ecosystem.config.cjs`: versioned PM2 process config.
- Create `docs/operations/runbook.md`: normal operations runbook.
- Create `docs/operations/backup-restore.md`: backup and recovery runbook.
- Create `docs/operations/incident-response.md`: incident response checklist.
- Modify `docs/deployment.md`: align deployment docs with the automated workflow and real server state.
- Modify `docs/environment.md`: document new non-secret operational env vars.

---

## Task 1: Create the Implementation Branch

**Files:**
- No file changes.

- [ ] **Step 1: Check the current working tree**

Run:

```bash
git status --short
```

Expected: either no output, or only changes already understood by the controller. If there are unrelated user changes, do not overwrite them.

- [ ] **Step 2: Create the operations branch**

Run:

```bash
git switch -c codex/ops-automation-hardening
```

Expected: `Switched to a new branch 'codex/ops-automation-hardening'`.

- [ ] **Step 3: Record the branch in the task notes**

Run:

```bash
git branch --show-current
```

Expected: `codex/ops-automation-hardening`.

---

## Task 2: Add Dependabot Version Update Automation

**Files:**
- Create: `.github/dependabot.yml`

- [ ] **Step 1: Create the Dependabot config**

Create `.github/dependabot.yml` with this content:

```yaml
version: 2

updates:
  - package-ecosystem: "npm"
    directory: "/frontend"
    schedule:
      interval: "daily"
      time: "06:00"
      timezone: "Europe/Berlin"
    open-pull-requests-limit: 5
    labels:
      - "dependencies"
      - "frontend"
    groups:
      nextjs-runtime:
        patterns:
          - "next"
          - "eslint-config-next"
      react-runtime:
        patterns:
          - "react"
          - "react-dom"
      frontend-minor-patch:
        update-types:
          - "minor"
          - "patch"
        patterns:
          - "*"

  - package-ecosystem: "npm"
    directory: "/image-worker"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "06:20"
      timezone: "Europe/Berlin"
    open-pull-requests-limit: 3
    labels:
      - "dependencies"
      - "image-worker"
    groups:
      cloudflare-worker-tooling:
        patterns:
          - "wrangler"
          - "@cloudflare/*"
          - "vitest"

  - package-ecosystem: "gradle"
    directory: "/backend"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "06:40"
      timezone: "Europe/Berlin"
    open-pull-requests-limit: 5
    labels:
      - "dependencies"
      - "backend"
    groups:
      spring-boot-stack:
        patterns:
          - "org.springframework.boot"
          - "io.spring.dependency-management"
          - "org.springdoc:*"
      aws-sdk:
        patterns:
          - "software.amazon.awssdk:*"

  - package-ecosystem: "docker"
    directory: "/backend"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "07:00"
      timezone: "Europe/Berlin"
    open-pull-requests-limit: 3
    labels:
      - "dependencies"
      - "docker"

  - package-ecosystem: "docker-compose"
    directory: "/backend"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "07:10"
      timezone: "Europe/Berlin"
    open-pull-requests-limit: 3
    labels:
      - "dependencies"
      - "docker"
      - "backend"

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "07:20"
      timezone: "Europe/Berlin"
    open-pull-requests-limit: 3
    labels:
      - "dependencies"
      - "github-actions"
```

- [ ] **Step 2: Validate YAML syntax**

Run:

```bash
ruby -e "require 'yaml'; YAML.load_file('.github/dependabot.yml'); puts 'dependabot yaml ok'"
```

Expected:

```text
dependabot yaml ok
```

- [ ] **Step 3: Confirm monitored manifests exist**

Run:

```bash
test -f frontend/package-lock.json
test -f image-worker/package-lock.json
test -f backend/build.gradle
test -f backend/Dockerfile
test -f backend/compose.yaml
test -d .github/workflows
echo "dependabot manifests ok"
```

Expected:

```text
dependabot manifests ok
```

- [ ] **Step 4: Commit**

Run:

```bash
git add .github/dependabot.yml
git commit -m "chore: enable dependency update automation"
```

Expected: commit succeeds.

---

## Task 3: Add Main CI for Pull Requests and Main

**Files:**
- Create: `.github/workflows/ci.yml`
- Modify: `.github/dependabot.yml`
- Modify: `.github/workflows/docs-quality.yml`
- Delete: `package.json`
- Delete: `package-lock.json`

**Task 3 concern resolution:** Stale root `package.json` and
`package-lock.json` manifests were removed because the repository root has no
npm runtime or tooling responsibility. Frontend and image worker remain the npm
dependency surfaces for Dependabot and CI.

- [ ] **Step 0: Remove the stale root npm dependency surface**

The repository root previously contained `package.json` and
`package-lock.json` with `js-cookie` and `uuid`, but the root has no npm
runtime or tooling responsibility. Code search showed no business imports from
those root dependencies. Delete both files and keep npm automation limited to
the real npm projects:

```bash
git rm package.json package-lock.json
```

Expected: root `npm audit --omit=dev --audit-level=high` is no longer part of
CI because no root npm project remains.

- [ ] **Step 1: Create `.github/workflows/ci.yml`**

Create `.github/workflows/ci.yml` with this content:

```yaml
name: CI

on:
  pull_request:
  push:
    branches:
      - main

permissions:
  contents: read

jobs:
  dependency-review:
    name: Dependency Review
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    permissions:
      contents: read
      pull-requests: read
    steps:
      - name: Check out repository
        uses: actions/checkout@v4

      - name: Review dependency changes
        uses: actions/dependency-review-action@v4
        with:
          fail-on-severity: high
          deny-licenses: GPL-3.0, AGPL-3.0

  frontend:
    name: Frontend
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - name: Check out repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: npm
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npx tsc --noEmit

      - name: Route handler tests
        run: npm run test:routes

      - name: Lint
        run: npm run lint

      - name: Build
        run: npm run build

      - name: Audit production dependencies
        run: npm audit --omit=dev --audit-level=high

  backend:
    name: Backend
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    steps:
      - name: Check out repository
        uses: actions/checkout@v4

      - name: Set up Java
        uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: "21"
          cache: gradle

      - name: Validate Gradle wrapper
        uses: gradle/actions/wrapper-validation@v4

      - name: Test
        run: ./gradlew test --no-daemon

      - name: Build
        run: ./gradlew build --no-daemon

      - name: Scan backend dependencies with OSV
        uses: google/osv-scanner-action/osv-scanner-action@v2
        with:
          scan-args: |-
            --recursive
            ./backend

  image-worker:
    name: Image Worker
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: image-worker
    steps:
      - name: Check out repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: npm
          cache-dependency-path: image-worker/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Test
        run: npm test

      - name: Audit production dependencies
        run: npm audit --omit=dev --audit-level=high

  docker-build:
    name: Backend Docker Build and Scan
    runs-on: ubuntu-latest
    steps:
      - name: Check out repository
        uses: actions/checkout@v4

      - name: Build backend image
        working-directory: backend
        run: docker build -t munich-weekly-backend:ci .

      - name: Scan backend image
        uses: aquasecurity/trivy-action@0.32.0
        with:
          image-ref: munich-weekly-backend:ci
          severity: HIGH,CRITICAL
          exit-code: "1"
          ignore-unfixed: true
```

- [ ] **Step 2: Add explicit permissions to docs workflow**

Modify `.github/workflows/docs-quality.yml` so it includes this block after the `on:` block:

```yaml
permissions:
  contents: read
```

The resulting top section should be:

```yaml
name: Docs Quality

on:
  pull_request:
  push:
    branches:
      - main

permissions:
  contents: read

jobs:
```

- [ ] **Step 3: Validate workflow YAML**

Run:

```bash
ruby -e "require 'yaml'; Dir['.github/workflows/*.yml'].each { |f| YAML.load_file(f); puts \"ok #{f}\" }"
```

Expected output includes:

```text
ok .github/workflows/ci.yml
ok .github/workflows/docs-quality.yml
```

- [ ] **Step 4: Pin GitHub Actions to immutable SHAs**

Resolve every `uses:` entry in `.github/workflows/*.yml` to a full commit SHA before committing. Use this pattern for each action:

```bash
resolve_action_tag() {
  repo="$1"
  tag="$2"
  object_json="$(gh api "repos/${repo}/git/ref/tags/${tag}")"
  sha="$(printf '%s' "${object_json}" | jq -r '.object.sha')"
  type="$(printf '%s' "${object_json}" | jq -r '.object.type')"
  if [ "${type}" = "tag" ]; then
    sha="$(gh api "repos/${repo}/git/tags/${sha}" --jq '.object.sha')"
  fi
  gh api "repos/${repo}/commits/${sha}" --jq '.sha'
}

resolve_action_tag actions/checkout v4
resolve_action_tag actions/setup-node v4
resolve_action_tag actions/setup-java v4
resolve_action_tag actions/dependency-review-action v4
resolve_action_tag gradle/actions v4
resolve_action_tag google/osv-scanner-action v2
resolve_action_tag aquasecurity/trivy-action 0.32.0
```

If a listed movable ref is unavailable, pin the nearest valid ref that preserves
the intended action behavior, keep the resolved valid ref as a trailing comment,
and verify the final SHA through the repository commits API. During
implementation on 2026-06-09, `actions/dependency-review-action` exposed `v4`
as a branch, not a tag; `google/osv-scanner-action` exposed versioned `v2.x`
tags but no `v2` ref; and `aquasecurity/trivy-action` exposed `v0.32.0`, not
`0.32.0`.

Then replace workflow references like:

```yaml
uses: actions/checkout@v4
```

with:

```yaml
uses: actions/checkout@0123456789abcdef0123456789abcdef01234567
```

Add a trailing comment with the original tag for maintainability:

```yaml
uses: actions/checkout@0123456789abcdef0123456789abcdef01234567 # v4
```

Expected: replace the example SHA above with the 40-character commit SHA returned by `resolve_action_tag`. No `.github/workflows/*.yml` file contains `uses: owner/repo@v` or another movable tag after this step. For each pinned action, `gh api repos/OWNER/REPO/commits/SHA` must succeed.

- [ ] **Step 5: Run local frontend verification**

Run:

```bash
cd frontend
npm ci
npx tsc --noEmit
npm run test:routes
npm run lint
npm run build
npm audit --omit=dev --audit-level=high
```

Expected: all commands exit 0.

- [ ] **Step 6: Run local backend verification**

Run:

```bash
cd backend
./gradlew test --no-daemon
./gradlew build --no-daemon
```

Expected: all commands exit 0.

- [ ] **Step 7: Run image worker verification**

Run:

```bash
cd image-worker
npm ci
npm test
npm audit --omit=dev --audit-level=high
```

Expected: all commands exit 0.

- [ ] **Step 8: Commit**

Run:

```bash
git add .github/dependabot.yml .github/workflows/ci.yml .github/workflows/docs-quality.yml docs/superpowers/plans/2026-06-08-operations-automation-hardening.md
git add -u package.json package-lock.json
git commit -m "ci: add application validation workflow"
```

Expected: commit succeeds.

---

## Task 4: Harden Next.js and Version Nginx Security Config

**Files:**
- Modify: `frontend/next.config.js`
- Delete: `frontend/next.config.ts`
- Create: `frontend/src/app/frontend-api/csp-report/route.ts`
- Create: `frontend/test/csp-report-route.test.ts`
- Modify: `frontend/package.json`
- Modify: `.github/workflows/ci.yml`
- Modify: `docs/frontend-api.md`
- Create: `ops/nginx/snippets/security-headers.conf`
- Create: `ops/nginx/snippets/cloudflare-authenticated-origin-pull.conf`
- Create: `ops/nginx/munichweekly.art.conf`

- [ ] **Step 1: Disable Next.js powered-by header**

Modify `frontend/next.config.js` so the exported config includes `poweredByHeader: false` at the top level:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  experimental: {
    // Allow proxied multipart uploads (> default 10MB) to reach backend
    proxyClientMaxBodySize: '30mb'
  },
  turbopack: {
    root: __dirname
  },
  async rewrites() {
    const apiDestination = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

    const uploadsBase =
      process.env.NODE_ENV === 'development'
        ? apiDestination.replace(/\/api\/?$/, '')
        : 'https://img.munichweekly.art';
    const uploadsDestination = `${uploadsBase}/uploads/:path*`;

    return [
      {
        source: '/api/:path*',
        destination: `${apiDestination}/:path*`
      },
      {
        source: '/uploads/:path*',
        destination: uploadsDestination
      }
    ];
  },
  images: {
    unoptimized: process.env.NODE_ENV === 'development',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos'
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8080',
        pathname: '/uploads/**'
      },
      {
        protocol: 'https',
        hostname: 'pub-42cc142968d044e0b7182fa9177333cf.r2.dev',
        pathname: '/munichweekly-photoupload/**'
      },
      {
        protocol: 'https',
        hostname: '*.r2.dev',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'img.munichweekly.art',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com'
      }
    ]
  }
};

module.exports = nextConfig;
```

- [ ] **Step 2: Remove duplicate empty config**

Delete `frontend/next.config.ts`. The project already uses `next.config.js` for rewrites and images.

- [ ] **Step 3: Create reusable Nginx security headers**

Create `ops/nginx/snippets/security-headers.conf`:

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' https://img.munichweekly.art data:; font-src 'self' data:; connect-src 'self' https://challenges.cloudflare.com; frame-src 'self' https://challenges.cloudflare.com; frame-ancestors 'none'; base-uri 'self'; object-src 'none';" always;
add_header Content-Security-Policy-Report-Only "default-src 'self'; script-src 'self' https://challenges.cloudflare.com; style-src 'self'; img-src 'self' https://img.munichweekly.art data:; font-src 'self' data:; connect-src 'self' https://challenges.cloudflare.com; frame-src 'self' https://challenges.cloudflare.com; frame-ancestors 'none'; base-uri 'self'; object-src 'none'; report-uri /frontend-api/csp-report;" always;
```

This is a staged CSP hardening step. The enforced policy removes `unsafe-eval` and restricts images to the production image host. The report-only policy removes `unsafe-inline` so violations can be collected before a later nonce/hash migration.

- [ ] **Step 4: Create authenticated origin pull snippet**

Create `ops/nginx/snippets/cloudflare-authenticated-origin-pull.conf`:

```nginx
ssl_client_certificate /etc/nginx/certs/cloudflare-origin-pull-ca.pem;
ssl_verify_client on;
```

- [ ] **Step 5: Create versioned Nginx site config**

Create `ops/nginx/munichweekly.art.conf`:

```nginx
# This site config is intended to be included from Nginx's http context,
# matching normal sites-enabled includes on Ubuntu/Debian.
map $http_cf_connecting_ip $munichweekly_client_ip {
    default $http_cf_connecting_ip;
    ""      $remote_addr;
}

map $http_cf_connecting_ip $munichweekly_forwarded_for {
    default "$http_cf_connecting_ip, $remote_addr";
    ""      $proxy_add_x_forwarded_for;
}

map $http_upgrade $munichweekly_connection_upgrade {
    default upgrade;
    ""      close;
}

server {
    listen 80;
    listen [::]:80;
    server_name munichweekly.art www.munichweekly.art;
    server_tokens off;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        include /etc/nginx/snippets/cloudflare-origin-allow.conf;
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name munichweekly.art www.munichweekly.art;
    server_tokens off;

    client_max_body_size 30M;
    client_body_buffer_size 10M;
    client_body_timeout 60s;

    ssl_certificate     /etc/letsencrypt/live/munichweekly.art/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/munichweekly.art/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    include /etc/nginx/snippets/cloudflare-authenticated-origin-pull.conf;
    include /etc/nginx/snippets/cloudflare-origin-allow.conf;
    include /etc/nginx/snippets/munichweekly-security-headers.conf;

    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    location /api/ {
        proxy_pass         http://127.0.0.1:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header   Host                    $host;
        proxy_set_header   X-Real-IP               $munichweekly_client_ip;
        proxy_set_header   X-Forwarded-For         $munichweekly_forwarded_for;
        proxy_set_header   X-Forwarded-Proto       $scheme;
        proxy_set_header   x-middleware-subrequest "";
        proxy_cache_bypass $http_upgrade;
        proxy_no_cache     1;
    }

    location = /frontend-api/csp-report {
        client_max_body_size 16K;
        proxy_pass         http://127.0.0.1:3000/frontend-api/csp-report;
        proxy_http_version 1.1;
        proxy_set_header   Host                    $host;
        proxy_set_header   X-Real-IP               $munichweekly_client_ip;
        proxy_set_header   X-Forwarded-For         $munichweekly_forwarded_for;
        proxy_set_header   X-Forwarded-Proto       $scheme;
        proxy_set_header   x-middleware-subrequest "";
    }

    location / {
        proxy_pass         http://127.0.0.1:3000/;
        proxy_http_version 1.1;
        proxy_set_header   Host                    $host;
        proxy_set_header   X-Real-IP               $munichweekly_client_ip;
        proxy_set_header   X-Forwarded-For         $munichweekly_forwarded_for;
        proxy_set_header   X-Forwarded-Proto       $scheme;
        proxy_set_header   Upgrade                 $http_upgrade;
        proxy_set_header   Connection              $munichweekly_connection_upgrade;
        proxy_set_header   x-middleware-subrequest "";
    }

    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    access_log /var/log/nginx/munichweekly-access.log;
    error_log /var/log/nginx/munichweekly-error.log;
}
```

The maps forward Cloudflare's original visitor IP to upstream services without
rewriting `$remote_addr`; do not add `real_ip_header`, because Nginx allow/deny
checks must still evaluate the Cloudflare socket IP.

- [ ] **Step 6: Add CSP report route**

Use TDD to create `frontend/test/csp-report-route.test.ts` first, verify it
fails because `frontend/src/app/frontend-api/csp-report/route.ts` is missing,
then create the route. The route exports `POST` only, accepts unauthenticated
CSP report posts, reads at most 16 KB, parses JSON only for bodies within that
cap, logs bounded parsed field summaries or bounded raw previews, and returns
`204 No Content` for valid, empty, malformed, or oversized bodies without
persistence or external calls. Include tests for oversized bodies rejected by
`Content-Length`, oversized streamed bodies that exceed the cap while reading,
and malformed/raw report previews with control characters normalized before
logging.

- [ ] **Step 7: Document CSP report route**

Update `docs/frontend-api.md` with route inventory and operational notes for
`POST /frontend-api/csp-report`.

- [ ] **Step 8: Verify frontend build**

Run:

```bash
cd frontend
npm run test:routes
npm run build
```

Expected: route tests and build exit 0.

- [ ] **Step 9: Verify powered-by header after local or production deployment**

After deployment, run:

```bash
if curl -I --max-time 10 https://munichweekly.art | grep -iq '^x-powered-by:'; then
  echo "X-Powered-By header is still present" >&2
  exit 1
fi
```

Expected: command exits 0. Do not use `--resolve munichweekly.art:443:127.0.0.1` for this check after Authenticated Origin Pull is enabled, because local curl will not present Cloudflare's client certificate.

- [ ] **Step 10: Commit**

Run:

```bash
git add .github/workflows/ci.yml frontend/package.json frontend/next.config.js frontend/src/app/frontend-api/csp-report/route.ts frontend/test/csp-report-route.test.ts docs/frontend-api.md docs/superpowers/plans/2026-06-08-operations-automation-hardening.md ops/nginx/snippets/security-headers.conf ops/nginx/snippets/cloudflare-authenticated-origin-pull.conf ops/nginx/munichweekly.art.conf
git add -u frontend/next.config.ts
git commit -m "test: run frontend route security tests in CI"
```

Expected: commit succeeds.

---

## Task 5: Add Cloudflare Origin Protection Automation

**Files:**
- Create: `ops/scripts/update-cloudflare-origin-allowlist.sh`
- Create: `ops/systemd/munich-weekly-cloudflare-allowlist.service`
- Create: `ops/systemd/munich-weekly-cloudflare-allowlist.timer`

- [ ] **Step 1: Create the allowlist generator**

Create `ops/scripts/update-cloudflare-origin-allowlist.sh`.

Implementation requirements:

- Use `#!/usr/bin/env bash` and `set -euo pipefail`.
- Default to production paths, with local-test overrides allowed:
  `SNIPPET_DIR=/etc/nginx/snippets`,
  `ALLOW_SNIPPET=${SNIPPET_DIR}/cloudflare-origin-allow.conf`,
  `NGINX_BIN=nginx`, and `SYSTEMCTL_BIN=systemctl`.
- Fetch Cloudflare ranges from `https://www.cloudflare.com/ips-v4` and
  `https://www.cloudflare.com/ips-v6` using `curl -fsSL` with retry and timeout
  options such as `--retry 3 --retry-delay 5 --connect-timeout 10 --max-time 60`.
- Normalize CRLF by stripping trailing `\r`. Blank lines and full-line comments
  may be skipped, but inline comments, whitespace inside CIDRs, semicolons, and
  other unexpected content must be rejected.
- Validate and normalize every CIDR with Python `ipaddress.ip_network(line,
  strict=False)`, enforcing IPv4 input for the IPv4 feed and IPv6 input for the
  IPv6 feed. Reject empty normalized IPv4 or IPv6 lists.
- Generate a candidate snippet containing generated comments, localhost allows,
  every normalized Cloudflare CIDR as `allow <cidr>;`, and a final `deny all;`.
- Validate the candidate before replacing the live snippet by writing a minimal
  temporary Nginx config with `events {}` and an `http { server { location / {
  include <candidate>; } } }` context, then running:
  `nginx -t -c <temp-config> -g 'pid <tmp>/nginx.pid;'`.
- Install the candidate to a temporary file in the parent directory of
  `${ALLOW_SNIPPET}`, then atomically replace `${ALLOW_SNIPPET}` with `mv`.
- If an existing live snippet is present, back it up before replacement. Run the
  full `nginx -t` after replacement; if it fails, restore the previous snippet
  with metadata preserved, re-run `nginx -t` for operator visibility, and exit
  nonzero. If no previous snippet existed, remove the newly installed snippet
  before exiting nonzero.
- After a successful full `nginx -t`, run `systemctl reload nginx`.

The generated snippet must have this shape:

```bash
# Generated by update-cloudflare-origin-allowlist.sh
# Allows direct web traffic only from Cloudflare edge ranges.
# Source: https://www.cloudflare.com/ips-v4
# Source: https://www.cloudflare.com/ips-v6
allow 127.0.0.1;
allow ::1;
allow <cloudflare-ipv4-cidr>;
allow <cloudflare-ipv6-cidr>;
deny all;
```

- [ ] **Step 2: Create the systemd service**

Create `ops/systemd/munich-weekly-cloudflare-allowlist.service`:

```ini
[Unit]
Description=Update Munich Weekly Cloudflare origin allowlist
After=network-online.target
Wants=network-online.target
OnFailure=munich-weekly-alert@%n.service

[Service]
Type=oneshot
ExecStart=/usr/local/sbin/update-cloudflare-origin-allowlist.sh
```

- [ ] **Step 3: Create the systemd timer**

Create `ops/systemd/munich-weekly-cloudflare-allowlist.timer`:

```ini
[Unit]
Description=Run Munich Weekly Cloudflare origin allowlist update weekly

[Timer]
OnCalendar=Mon *-*-* 04:15:00
Persistent=true
RandomizedDelaySec=20m

[Install]
WantedBy=timers.target
```

- [ ] **Step 4: Update production Nginx deployment instructions**

When installing on production, copy the script and units:

```bash
sudo install -m 0755 ops/scripts/update-cloudflare-origin-allowlist.sh /usr/local/sbin/update-cloudflare-origin-allowlist.sh
sudo install -m 0644 ops/systemd/munich-weekly-cloudflare-allowlist.service /etc/systemd/system/munich-weekly-cloudflare-allowlist.service
sudo install -m 0644 ops/systemd/munich-weekly-cloudflare-allowlist.timer /etc/systemd/system/munich-weekly-cloudflare-allowlist.timer
sudo systemctl daemon-reload
sudo systemctl enable --now munich-weekly-cloudflare-allowlist.timer
sudo systemctl start munich-weekly-cloudflare-allowlist.service
```

Expected: `nginx -t` succeeds and Nginx reloads.

Note: `OnFailure=munich-weekly-alert@%n.service` depends on the alert template
created in Task 10. If Task 5 is installed before Task 10, failures are visible
in journald until `munich-weekly-alert@.service` is installed.

- [ ] **Step 5: Install Cloudflare authenticated origin pull CA**

When installing on production, fetch Cloudflare's authenticated origin pull CA certificate into a root-owned path:

```bash
sudo install -d -m 0755 /etc/nginx/certs
curl -fsSL https://developers.cloudflare.com/ssl/static/authenticated_origin_pull_ca.pem -o /tmp/cloudflare-origin-pull-ca.pem
sudo install -m 0644 /tmp/cloudflare-origin-pull-ca.pem /etc/nginx/certs/cloudflare-origin-pull-ca.pem
sudo nginx -t
```

Expected: `nginx -t` succeeds after the Task 4 snippet is installed.

- [ ] **Step 6: Confirm allowlist and origin-pull includes are versioned**

The versioned Nginx config from Task 4 must already include this line inside the HTTPS `server` block:

```nginx
include /etc/nginx/snippets/cloudflare-origin-allow.conf;
include /etc/nginx/snippets/cloudflare-authenticated-origin-pull.conf;
```

It must also include the same snippet inside the HTTP `location /` block, while leaving `/.well-known/acme-challenge/` reachable for certificate renewal.

Do not manually add a second include to production Nginx. Do not combine this Nginx `allow`/`deny` source allowlist with `real_ip_header CF-Connecting-IP` in the same server block. The real IP module rewrites `$remote_addr` before access checks, which can cause valid Cloudflare requests to be denied. If real visitor IPs are required for logs or backend rate limiting, implement host firewall source filtering or Cloudflare Tunnel first, then add real IP restoration as a separate reviewed change.

Then run:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Expected: Nginx reloads successfully.

- [ ] **Step 7: Verify direct origin is blocked**

From a non-Cloudflare client, run:

```bash
curl -k -I --max-time 10 --resolve munichweekly.art:443:94.130.231.146 https://munichweekly.art
```

Expected after allowlist is active: `HTTP/2 403` or connection rejected by firewall. A `200` response means the origin is still bypassable.

- [ ] **Step 8: Commit**

Run:

```bash
git add ops/scripts/update-cloudflare-origin-allowlist.sh ops/systemd/munich-weekly-cloudflare-allowlist.service ops/systemd/munich-weekly-cloudflare-allowlist.timer
git commit -m "ops: automate cloudflare origin allowlist"
```

Expected: commit succeeds.

---

## Task 6: Add Encrypted Backup Automation

**Files:**
- Create: `ops/scripts/backup-production.sh`
- Create: `ops/systemd/munich-weekly-backup.service`
- Create: `ops/systemd/munich-weekly-backup.timer`
- Create: `docs/operations/backup-restore.md`
- Modify: `docs/environment.md`

- [ ] **Step 1: Create the backup script**

Create `ops/scripts/backup-production.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/home/deploy/munich-weekly}"
BACKUP_ENV="${BACKUP_ENV:-/etc/munich-weekly/backup.env}"
BACKUP_WORK_DIR="${BACKUP_WORK_DIR:-/var/backups/munich-weekly}"
DATE_UTC="$(date -u +%Y%m%dT%H%M%SZ)"
RUN_DIR="${BACKUP_WORK_DIR}/${DATE_UTC}"
RETENTION_DAILY="${RETENTION_DAILY:-14}"
RETENTION_WEEKLY="${RETENTION_WEEKLY:-8}"
RETENTION_MONTHLY="${RETENTION_MONTHLY:-12}"
REQUIRE_R2_BACKUP="${REQUIRE_R2_BACKUP:-true}"

if [ ! -r "${BACKUP_ENV}" ]; then
  echo "Backup env file is missing or unreadable: ${BACKUP_ENV}" >&2
  exit 1
fi

set -a
. "${BACKUP_ENV}"
set +a

mkdir -p "${RUN_DIR}"
chmod 0700 "${BACKUP_WORK_DIR}" "${RUN_DIR}"

cd "${APP_DIR}/backend"

docker compose ps postgres >/dev/null
docker exec mw-postgres sh -lc 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"'

docker exec mw-postgres sh -lc 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "${RUN_DIR}/postgres.dump"

if [ -d "${APP_DIR}/backend/uploads" ]; then
  tar -C "${APP_DIR}/backend" -czf "${RUN_DIR}/uploads.tar.gz" uploads
else
  tar -czf "${RUN_DIR}/uploads.tar.gz" --files-from /dev/null
fi

if [ "${REQUIRE_R2_BACKUP}" = "true" ]; then
  : "${RCLONE_R2_SOURCE:?RCLONE_R2_SOURCE is required when REQUIRE_R2_BACKUP=true}"
  : "${RCLONE_R2_BACKUP:?RCLONE_R2_BACKUP is required when REQUIRE_R2_BACKUP=true}"
  command -v rclone >/dev/null
  export RCLONE_CONFIG="${RCLONE_CONFIG:-/etc/munich-weekly/rclone.conf}"
  rclone copy "${RCLONE_R2_SOURCE}" "${RCLONE_R2_BACKUP}/snapshots/${DATE_UTC}" \
    --checksum \
    --metadata \
    --immutable \
    --fast-list
  rclone lsf -R "${RCLONE_R2_SOURCE}" --format "tsp" > "${RUN_DIR}/r2-source-manifest.txt"
  rclone lsf -R "${RCLONE_R2_BACKUP}/snapshots/${DATE_UTC}" --format "tsp" > "${RUN_DIR}/r2-backup-manifest.txt"
  printf '%s\n' "${RCLONE_R2_BACKUP}/snapshots/${DATE_UTC}" > "${RUN_DIR}/r2-backup-path.txt"
fi

git -C "${APP_DIR}" rev-parse HEAD > "${RUN_DIR}/git-commit.txt"
docker ps --format '{{.Names}} {{.Image}} {{.Status}}' > "${RUN_DIR}/docker-ps.txt"
sha256sum "${RUN_DIR}/postgres.dump" "${RUN_DIR}/uploads.tar.gz" > "${RUN_DIR}/SHA256SUMS"

restic backup "${RUN_DIR}" --tag munich-weekly --tag production --tag "${DATE_UTC}"
restic forget --tag munich-weekly --keep-daily "${RETENTION_DAILY}" --keep-weekly "${RETENTION_WEEKLY}" --keep-monthly "${RETENTION_MONTHLY}" --prune
restic snapshots --tag munich-weekly --latest 5
```

- [ ] **Step 2: Create the backup service**

Create `ops/systemd/munich-weekly-backup.service`:

```ini
[Unit]
Description=Munich Weekly production backup
After=docker.service network-online.target
Requires=docker.service
Wants=network-online.target
OnFailure=munich-weekly-alert@%n.service

[Service]
Type=oneshot
User=root
Group=root
ExecStart=/usr/local/sbin/munich-weekly-backup.sh
Environment=RESTIC_CACHE_DIR=/var/cache/munich-weekly-restic
CacheDirectory=munich-weekly-restic
Nice=10
IOSchedulingClass=best-effort
IOSchedulingPriority=7
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=read-only
ReadOnlyPaths=/etc/munich-weekly /home/deploy/munich-weekly
ReadWritePaths=/var/backups/munich-weekly /var/cache/munich-weekly-restic /run/docker.sock /var/run/docker.sock
```

- [ ] **Step 3: Create the backup timer**

Create `ops/systemd/munich-weekly-backup.timer`:

```ini
[Unit]
Description=Run Munich Weekly production backup daily

[Timer]
OnCalendar=*-*-* 02:30:00
Persistent=true
RandomizedDelaySec=15m

[Install]
WantedBy=timers.target
```

- [ ] **Step 4: Document server-only backup env file**

Add this section to `docs/environment.md` under a new `## Operations` heading:

```markdown
## Operations

These variables are used by production operations scripts. They are not application runtime variables and must not be committed.

| Variable | Used by | Required for | Notes |
|---|---|---|---|
| `RESTIC_REPOSITORY` | `ops/scripts/backup-production.sh` | Production backups | Encrypted restic repository URL. Use a private backup bucket such as `munichweekly-ops-backups`. |
| `RESTIC_PASSWORD` | `ops/scripts/backup-production.sh` | Production backups | Secret used to encrypt/decrypt restic backups. Store in `/etc/munich-weekly/backup.env` on the server and in the password manager. |
| `AWS_ACCESS_KEY_ID` | restic S3 backend | R2/S3 backup repository | Secret for the private backup bucket, not the public uploads bucket. |
| `AWS_SECRET_ACCESS_KEY` | restic S3 backend | R2/S3 backup repository | Secret for the private backup bucket, not the public uploads bucket. |
| `APP_DIR` | `ops/scripts/backup-production.sh` | Optional override | Defaults to `/home/deploy/munich-weekly`. |
| `BACKUP_WORK_DIR` | `ops/scripts/backup-production.sh` | Optional override | Defaults to `/var/backups/munich-weekly`. |
| `BACKUP_DRY_RUN` | `ops/scripts/backup-production.sh` | Local validation only | Defaults to `false`. Set to `true` only for local syntax and filesystem checks that must not contact Docker, R2, or restic. |
| `ALLOW_BACKUP_DRY_RUN` | `ops/scripts/backup-production.sh` | Local validation only | Defaults to `false`. Must be set to `true` with a non-production `BACKUP_ENV` before `BACKUP_DRY_RUN=true` is accepted. Never set this in `/etc/munich-weekly/backup.env`. |
| `ALLOW_INCOMPLETE_R2_BACKUP` | `ops/scripts/backup-production.sh` | Local validation or exceptional maintenance only | Defaults to `false`. Required before `REQUIRE_R2_BACKUP=false` is accepted outside production; production backups reject `REQUIRE_R2_BACKUP=false`. |
| `ENFORCE_BACKUP_ENV_PERMISSIONS` | `ops/scripts/backup-production.sh` | Optional local permission check | Defaults to `false`. Production `/etc/munich-weekly/backup.env` is always checked for root ownership and no group/other permissions. |
| `RETENTION_DAILY` | `ops/scripts/backup-production.sh` | Optional retention | Defaults to `14`. |
| `RETENTION_WEEKLY` | `ops/scripts/backup-production.sh` | Optional retention | Defaults to `8`. |
| `RETENTION_MONTHLY` | `ops/scripts/backup-production.sh` | Optional retention | Defaults to `12`. |
| `REQUIRE_R2_BACKUP` | `ops/scripts/backup-production.sh` | Production media backup gate | Defaults to `true`; production backups fail if R2 backup remotes are not configured. |
| `RCLONE_CONFIG` | `rclone` | R2 object backup | Defaults to `/etc/munich-weekly/rclone.conf`. |
| `RCLONE_R2_SOURCE` | `ops/scripts/backup-production.sh` | R2 object backup | Source remote/path for production upload objects, for example an rclone remote pointing to the production R2 bucket prefix. |
| `RCLONE_R2_BACKUP` | `ops/scripts/backup-production.sh` | R2 object backup | Destination remote/path for independent private object backups. Use a separate private backup bucket, preferably via `rclone crypt` or an equivalent encrypted private destination. |
| `RESTORE_PARENT_DIR` | `ops/scripts/restore-backup-drill.sh` | Optional restore drill override | Defaults to `/var/tmp`. The script creates a private temporary drill directory under this path and removes it on exit. |
| `CONTAINER_NAME` | `ops/scripts/restore-backup-drill.sh` | Optional restore drill override | Defaults to `mw-restore-drill-postgres` as the container name prefix. The script appends a unique run suffix and labels the container before cleanup. |
| `RESTORE_RUN_ID` | `ops/scripts/restore-backup-drill.sh` | Optional restore drill override | Defaults to a UTC timestamp plus process ID. Used in the temporary Docker container name and cleanup label. |
| `DB_NAME` | `ops/scripts/restore-backup-drill.sh` | Optional restore drill override | Defaults to `munich_weekly_restore_drill` for the isolated restore database. |
| `DB_USER` | `ops/scripts/restore-backup-drill.sh` | Optional restore drill override | Defaults to `restore_drill` for the isolated restore database user. |
| `DB_PASSWORD` | `ops/scripts/restore-backup-drill.sh` | Optional restore drill override | Defaults to a local restore-drill password. It is only passed to the isolated Docker container. |
| `ALLOW_EMPTY_R2_RESTORE` | `ops/scripts/restore-backup-drill.sh` | Explicit empty-object restore exception | Defaults to `false`. Set to `true` only when production is intentionally expected to have no uploaded R2 objects. |
| `OPS_ALERT_WEBHOOK_URL` | `ops/scripts/notify-ops.sh` | Optional failure alerting | Webhook endpoint for systemd `OnFailure` alerts. Store in `/etc/munich-weekly/alerts.env`, not in Git. |
```

- [ ] **Step 5: Create the backup and restore runbook**

Create `docs/operations/backup-restore.md`:

````markdown
# Backup and Restore Runbook

> Class: Operational runbook
> Owner: Platform maintainer
> Update when: database container names, backup storage, retention, or restore commands change.

## Backup Scope

The production backup captures:

- PostgreSQL logical dump from container `mw-postgres` using `pg_dump -Fc`.
- Local uploads directory from `backend/uploads`.
- R2-hosted production upload objects copied to an independent private backup bucket through `rclone`.
- Git commit metadata and Docker container status.
- SHA256 checksums for the dump and uploads archive.
- R2 source and backup object manifests.

Production backups are not healthy unless both database data and uploaded objects are restorable.

## Server Setup

Install packages:

```bash
sudo apt-get update
sudo apt-get install -y restic rclone
```

Create the private env directory:

```bash
sudo install -d -m 0700 /etc/munich-weekly
sudoedit /etc/munich-weekly/backup.env
sudo chmod 0600 /etc/munich-weekly/backup.env
```

The file `/etc/munich-weekly/backup.env` must define `RESTIC_REPOSITORY`, `RESTIC_PASSWORD`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `RCLONE_CONFIG`, `RCLONE_R2_SOURCE`, and `RCLONE_R2_BACKUP`.

Do not set `BACKUP_DRY_RUN=true`, `ALLOW_BACKUP_DRY_RUN=true`, or
`REQUIRE_R2_BACKUP=false` in the production env file. The production script
rejects dry-run mode and requires R2 object backups so a successful service run
means both database data and upload objects were captured.

Install scripts and timers:

```bash
sudo install -d -m 0700 /var/backups/munich-weekly
sudo install -m 0755 ops/scripts/backup-production.sh /usr/local/sbin/munich-weekly-backup.sh
sudo install -m 0644 ops/systemd/munich-weekly-backup.service /etc/systemd/system/munich-weekly-backup.service
sudo install -m 0644 ops/systemd/munich-weekly-backup.timer /etc/systemd/system/munich-weekly-backup.timer
sudo systemctl daemon-reload
sudo systemctl enable --now munich-weekly-backup.timer
```

The service references `OnFailure=munich-weekly-alert@%n.service`. Full
production rollout installs the alert template and `notify-ops.sh` before
timers are enabled. If installing only this backup task early, verify failures
through journald until the alert template from the operations status task is
installed.

The systemd unit hardens the root service with read-only system paths and
allows writes only to `/var/backups/munich-weekly`, the restic cache directory,
and the Docker socket. If `APP_DIR` or `BACKUP_WORK_DIR` is changed, update the
unit's `ReadOnlyPaths=` and `ReadWritePaths=` before enabling the timer.

Initialize the encrypted backup repository once:

```bash
sudo bash -lc 'set -a; . /etc/munich-weekly/backup.env; set +a; restic snapshots >/dev/null 2>&1 || restic init'
```

## Manual Backup

```bash
sudo systemctl start munich-weekly-backup.service
sudo journalctl -u munich-weekly-backup.service -n 120 --no-pager
```

Expected result: restic prints the latest snapshots and the service exits successfully.

If the service fails with `R2 backup manifest mismatch`, upload objects changed
during the copy or the destination did not receive the same object set. Rerun
the backup after upload activity settles and treat the failed run as
non-restorable until a later run succeeds.

## Restore Drill

Run a restore drill monthly and after changing backup logic. A restore is considered valid only when `pg_restore --list` succeeds and the restored database can answer basic count queries.
````

- [ ] **Step 6: Verify script syntax**

Run:

```bash
bash -n ops/scripts/backup-production.sh
```

Expected: no output and exit 0.

- [ ] **Step 7: Commit**

Run:

```bash
git add ops/scripts/backup-production.sh ops/systemd/munich-weekly-backup.service ops/systemd/munich-weekly-backup.timer docs/operations/backup-restore.md docs/environment.md
git commit -m "ops: add encrypted production backup plan"
```

Expected: commit succeeds.

---

## Task 7: Add Restore Drill Automation

**Files:**
- Create: `ops/scripts/restore-backup-drill.sh`
- Modify: `docs/operations/backup-restore.md`

- [ ] **Step 1: Create restore drill script**

Create `ops/scripts/restore-backup-drill.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

BACKUP_ENV="${BACKUP_ENV:-/etc/munich-weekly/backup.env}"
RESTORE_PARENT_DIR="${RESTORE_PARENT_DIR:-/var/tmp}"
CONTAINER_NAME="${CONTAINER_NAME:-mw-restore-drill-postgres}"
DB_NAME="${DB_NAME:-munich_weekly_restore_drill}"
DB_USER="${DB_USER:-restore_drill}"
DB_PASSWORD="${DB_PASSWORD:-restore_drill_password}"

if [ ! -r "${BACKUP_ENV}" ]; then
  echo "Backup env file is missing or unreadable: ${BACKUP_ENV}" >&2
  exit 1
fi

set -a
. "${BACKUP_ENV}"
set +a

RESTORE_WORK_DIR="$(mktemp -d -p "${RESTORE_PARENT_DIR}" munich-weekly-restore-drill.XXXXXX)"
chmod 0700 "${RESTORE_WORK_DIR}"

cleanup() {
  docker rm -f "${CONTAINER_NAME}" >/dev/null 2>&1 || true
  rm -rf "${RESTORE_WORK_DIR}"
}
trap cleanup EXIT

LATEST_SNAPSHOT="$(restic snapshots --tag munich-weekly --json | python3 -c 'import json,sys; s=json.load(sys.stdin); print(sorted(s, key=lambda x: x["time"])[-1]["short_id"])')"
restic restore "${LATEST_SNAPSHOT}" --target "${RESTORE_WORK_DIR}"

DUMP_PATH="$(find "${RESTORE_WORK_DIR}" -name postgres.dump -type f | head -n 1)"
if [ -z "${DUMP_PATH}" ]; then
  echo "No postgres.dump found in restored snapshot ${LATEST_SNAPSHOT}" >&2
  exit 1
fi

if ! find "${RESTORE_WORK_DIR}" -name r2-backup-manifest.txt -type f | grep -q .; then
  echo "No r2-backup-manifest.txt found in restored snapshot ${LATEST_SNAPSHOT}" >&2
  exit 1
fi

R2_SOURCE_MANIFEST="$(find "${RESTORE_WORK_DIR}" -name r2-source-manifest.txt -type f | head -n 1)"
R2_BACKUP_PATH_FILE="$(find "${RESTORE_WORK_DIR}" -name r2-backup-path.txt -type f | head -n 1)"
if [ -s "${R2_SOURCE_MANIFEST}" ]; then
  if [ ! -s "${R2_BACKUP_PATH_FILE}" ]; then
    echo "R2 source manifest is non-empty, but no r2-backup-path.txt was restored" >&2
    exit 1
  fi
  R2_BACKUP_PATH="$(cat "${R2_BACKUP_PATH_FILE}")"
  R2_RESTORE_DIR="${RESTORE_WORK_DIR}/r2-object-restore"
  mkdir -p "${R2_RESTORE_DIR}"
  export RCLONE_CONFIG="${RCLONE_CONFIG:-/etc/munich-weekly/rclone.conf}"
  rclone copy "${R2_BACKUP_PATH}" "${R2_RESTORE_DIR}" --checksum --metadata --fast-list
  if [ "$(find "${R2_RESTORE_DIR}" -type f | wc -l | tr -d ' ')" = "0" ]; then
    echo "R2 backup restore produced no files even though source manifest is non-empty" >&2
    exit 1
  fi
fi

docker rm -f "${CONTAINER_NAME}" >/dev/null 2>&1 || true
docker run -d \
  --name "${CONTAINER_NAME}" \
  -e POSTGRES_DB="${DB_NAME}" \
  -e POSTGRES_USER="${DB_USER}" \
  -e POSTGRES_PASSWORD="${DB_PASSWORD}" \
  postgres:15 >/dev/null

READY=false
for _ in $(seq 1 30); do
  if docker exec "${CONTAINER_NAME}" pg_isready -U "${DB_USER}" -d "${DB_NAME}" >/dev/null 2>&1; then
    READY=true
    break
  fi
  sleep 1
done
if [ "${READY}" != "true" ]; then
  echo "Restore drill PostgreSQL container did not become ready" >&2
  exit 1
fi

docker cp "${DUMP_PATH}" "${CONTAINER_NAME}:/tmp/postgres.dump"
docker exec "${CONTAINER_NAME}" pg_restore --list /tmp/postgres.dump >/dev/null
docker exec "${CONTAINER_NAME}" pg_restore -U "${DB_USER}" -d "${DB_NAME}" --no-owner --no-acl --clean --if-exists /tmp/postgres.dump
docker exec "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}" -c "select count(*) as users_count from users;"
docker exec "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}" -c "select count(*) as issues_count from issues;"

echo "Restore drill succeeded from snapshot ${LATEST_SNAPSHOT}"
```

Review hardening applied during Task 7:

- Final script filters latest restic snapshots with both `munich-weekly` and
  `production` tags.
- Final script requires `SHA256SUMS`, `uploads.tar.gz`, R2 manifests, and
  `r2-backup-path.txt`, and rejects dry-run or incomplete-R2 backup artifacts.
- Final script fails by default when R2 object manifests are empty; use
  `ALLOW_EMPTY_R2_RESTORE=true` only after confirming production intentionally
  has no uploaded R2 objects.
- Final script restores R2 objects locally and compares the restored size/path
  list to the backup object list when available.
- Final script runs the PostgreSQL drill container with a unique name suffix
  and cleanup labels instead of removing any pre-existing fixed-name container.

- [ ] **Step 2: Document restore drill command**

Append this to `docs/operations/backup-restore.md`:

````markdown
## Monthly Restore Drill Command

```bash
sudo install -m 0755 ops/scripts/restore-backup-drill.sh /usr/local/sbin/munich-weekly-restore-drill.sh
sudo /usr/local/sbin/munich-weekly-restore-drill.sh
```

Expected result:

```text
Restore drill succeeded from snapshot followed by the restored snapshot id
```

If restore fails, treat backups as unavailable until fixed.
````

- [ ] **Step 3: Verify script syntax**

Run:

```bash
bash -n ops/scripts/restore-backup-drill.sh
```

Expected: no output and exit 0.

- [ ] **Step 4: Commit**

Run:

```bash
git add ops/scripts/restore-backup-drill.sh docs/operations/backup-restore.md
git commit -m "ops: add production restore drill"
```

Expected: commit succeeds.

---

## Task 8: Add Controlled Production Deployment Script

**Files:**
- Create: `ops/scripts/deploy-production.sh`
- Modify: `docs/deployment.md`

- [ ] **Step 1: Create deploy script**

Create `ops/scripts/deploy-production.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/home/deploy/munich-weekly}"
BRANCH="${BRANCH:-main}"
LOCK_FILE="${LOCK_FILE:-/tmp/munich-weekly-deploy.lock}"
BACKUP_SERVICE="${BACKUP_SERVICE:-munich-weekly-backup.service}"

exec 9>"${LOCK_FILE}"
flock -n 9 || {
  echo "Another deployment is already running." >&2
  exit 1
}

cd "${APP_DIR}"

echo "== Pre-deploy status =="
if [ -n "$(git status --short)" ]; then
  echo "Working tree is dirty; refusing to deploy." >&2
  git status --short >&2
  exit 1
fi
CURRENT_COMMIT="$(git rev-parse --short HEAD)"
CURRENT_REF="$(git rev-parse HEAD)"
echo "Current commit: ${CURRENT_COMMIT}"
ROLLBACK_ACTIVE=false

rollback() {
  exit_code=$?
  if [ "${ROLLBACK_ACTIVE}" = "true" ]; then
    echo "Deployment failed; attempting rollback to ${CURRENT_COMMIT}" >&2
    cd "${APP_DIR}"
    git checkout "${CURRENT_REF}" || true
    cd "${APP_DIR}/backend"
    docker compose up -d --build backend || true
    cd "${APP_DIR}/frontend"
    npm ci || true
    npm run build || true
    pm2 startOrReload ecosystem.config.cjs --only munich-frontend || true
    pm2 save || true
    echo "Rollback attempted. Run /usr/local/sbin/munich-weekly-status.sh and inspect logs before retrying deploy." >&2
  fi
  exit "${exit_code}"
}
trap rollback ERR

echo "== Fetch =="
git fetch origin "${BRANCH}"
TARGET_COMMIT="$(git rev-parse --short "origin/${BRANCH}")"
echo "Target commit: ${TARGET_COMMIT}"

echo "== Backup =="
sudo systemctl start "${BACKUP_SERVICE}"

echo "== Checkout =="
git checkout "origin/${BRANCH}"
ROLLBACK_ACTIVE=true

echo "== Frontend install and build =="
cd "${APP_DIR}/frontend"
npm ci
npm audit --omit=dev --audit-level=high
npm run build

echo "== Backend rebuild and restart =="
cd "${APP_DIR}/backend"
docker compose up -d --build backend

echo "== Frontend reload =="
cd "${APP_DIR}/frontend"
pm2 startOrReload ecosystem.config.cjs --only munich-frontend
pm2 save

echo "== Smoke checks =="
curl -fsS --max-time 10 http://127.0.0.1:8080/api/layout/health >/dev/null
curl -fsS --max-time 10 http://127.0.0.1:3000/ >/dev/null
curl -fsS --max-time 10 https://munichweekly.art >/dev/null
if curl -I --max-time 10 https://munichweekly.art | grep -iq '^x-powered-by:'; then
  echo "X-Powered-By header is still present" >&2
  exit 1
fi

ROLLBACK_ACTIVE=false
echo "Deployment succeeded: ${CURRENT_COMMIT} -> ${TARGET_COMMIT}"
```

- [ ] **Step 2: Update deployment docs**

Replace the manual frontend/backend deployment sections in `docs/deployment.md` with a section that points to the deploy script:

````markdown
## Production Deployment

Production deployment is controlled by `ops/scripts/deploy-production.sh`.

The script:

- Acquires a deployment lock.
- Fetches `origin/main`.
- Runs a production backup before changing code.
- Checks out the target commit.
- Runs `npm ci`, production dependency audit, and `npm run build` for the frontend.
- Rebuilds and restarts the backend container.
- Reloads the PM2 frontend process through `frontend/ecosystem.config.cjs`.
- Runs backend and frontend smoke checks.
- Attempts rollback to the previous commit if any post-checkout deployment step fails.

Run on the production server:

```bash
cd /home/deploy/munich-weekly
git fetch origin main
git checkout origin/main
sudo install -m 0755 ops/scripts/deploy-production.sh /usr/local/sbin/munich-weekly-deploy.sh
/usr/local/sbin/munich-weekly-deploy.sh
```
````

- [ ] **Step 3: Verify script syntax**

Run:

```bash
bash -n ops/scripts/deploy-production.sh
```

Expected: no output and exit 0.

- [ ] **Step 4: Commit**

Run:

```bash
git add ops/scripts/deploy-production.sh docs/deployment.md
git commit -m "ops: add controlled production deploy script"
```

Expected: commit succeeds.

---

## Task 9: Add PM2 and Production Logging Controls

**Files:**
- Create: `frontend/ecosystem.config.cjs`
- Create: `backend/src/main/resources/application-prod.properties`
- Modify: `backend/compose.yaml`
- Modify: `docs/deployment.md`

- [ ] **Step 1: Create PM2 ecosystem file**

Create `frontend/ecosystem.config.cjs`:

```js
module.exports = {
  apps: [
    {
      name: 'munich-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/home/deploy/munich-weekly/frontend',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '512M',
      time: true,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
```

- [ ] **Step 2: Create production Spring properties**

Create `backend/src/main/resources/application-prod.properties`:

```properties
spring.jpa.show-sql=false
logging.level.org.hibernate.SQL=INFO
logging.level.org.hibernate.orm.jdbc.bind=INFO
logging.level.com.munichweekly.backend=INFO
```

- [ ] **Step 3: Add Docker log options and healthchecks**

Modify `backend/compose.yaml` so `postgres` includes:

```yaml
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \"$${POSTGRES_USER}\" -d \"$${POSTGRES_DB}\""]
      interval: 30s
      timeout: 5s
      retries: 5
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "5"
```

Modify `backend/compose.yaml` so `backend` includes:

```yaml
    depends_on:
      postgres:
        condition: service_healthy
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "5"
```

The backend healthcheck should be added only after verifying the runtime image contains `curl` or `wget`, or after adding one explicitly to `backend/Dockerfile`. Do not add a healthcheck command that silently fails because the binary is missing.

- [ ] **Step 4: Document PM2 log rotation**

Add this section to `docs/deployment.md`:

````markdown
## PM2 Logs

Install PM2 log rotation once on the production server:

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 10
pm2 set pm2-logrotate:compress true
pm2 save
```

The versioned PM2 process definition lives in `frontend/ecosystem.config.cjs`.
````

- [ ] **Step 5: Verify backend tests**

Run:

```bash
cd backend
./gradlew test --no-daemon
```

Expected: tests pass.

- [ ] **Step 6: Verify frontend build**

Run:

```bash
cd frontend
npm run build
```

Expected: build passes.

- [ ] **Step 7: Commit**

Run:

```bash
git add frontend/ecosystem.config.cjs backend/src/main/resources/application-prod.properties backend/compose.yaml docs/deployment.md
git commit -m "ops: add production process and log controls"
```

Expected: commit succeeds.

---

## Task 10: Add Production Status Check Automation

**Files:**
- Create: `ops/scripts/production-status.sh`
- Create: `ops/scripts/notify-ops.sh`
- Create: `ops/systemd/munich-weekly-status.service`
- Create: `ops/systemd/munich-weekly-status.timer`
- Create: `ops/systemd/munich-weekly-alert@.service`
- Create: `docs/operations/runbook.md`

- [ ] **Step 1: Create status script**

Create `ops/scripts/production-status.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/home/deploy/munich-weekly}"

echo "== Munich Weekly production status =="
date -Is
hostname

echo "== Uptime =="
uptime

echo "== Disk =="
df -hT / /var /home 2>/dev/null || df -hT

echo "== Memory =="
free -h

echo "== Reboot required =="
if [ -f /var/run/reboot-required ]; then
  cat /var/run/reboot-required
else
  echo "no"
fi

echo "== Apt upgradable count =="
apt list --upgradable 2>/dev/null | sed '1d' | wc -l

echo "== Docker containers =="
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'

echo "== PM2 =="
sudo -u deploy env HOME=/home/deploy PM2_HOME=/home/deploy/.pm2 pm2 status --no-color

echo "== Backend health =="
curl -fsS --max-time 10 http://127.0.0.1:8080/api/layout/health
echo

echo "== Local frontend =="
curl -I --max-time 10 http://127.0.0.1:3000/ | sed -n '1,20p'

echo "== Public Cloudflare frontend =="
curl -I --max-time 10 https://munichweekly.art | sed -n '1,20p'

echo "== Git =="
git -C "${APP_DIR}" rev-parse --short HEAD
git -C "${APP_DIR}" status --short

echo "== Backup timer =="
systemctl list-timers munich-weekly-backup.timer --no-pager || true

echo "== Recent backup journal =="
journalctl -u munich-weekly-backup.service -n 40 --no-pager || true
```

- [ ] **Step 2: Create alert notification script**

Create `ops/scripts/notify-ops.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

ALERT_ENV="${ALERT_ENV:-/etc/munich-weekly/alerts.env}"
FAILED_UNIT="${1:-unknown-unit}"
HOSTNAME_VALUE="$(hostname)"
TIMESTAMP="$(date -Is)"
MESSAGE="Munich Weekly alert: ${FAILED_UNIT} failed on ${HOSTNAME_VALUE} at ${TIMESTAMP}"

if [ -r "${ALERT_ENV}" ]; then
  set -a
  . "${ALERT_ENV}"
  set +a
fi

if [ -n "${OPS_ALERT_WEBHOOK_URL:-}" ]; then
  curl -fsS -X POST --data-binary "${MESSAGE}" "${OPS_ALERT_WEBHOOK_URL}" >/dev/null
else
  echo "${MESSAGE}" >&2
fi
```

- [ ] **Step 3: Create alert systemd template**

Create `ops/systemd/munich-weekly-alert@.service`:

```ini
[Unit]
Description=Munich Weekly failure alert for %i

[Service]
Type=oneshot
User=root
Group=root
ExecStart=/usr/local/sbin/munich-weekly-notify-ops.sh %i
```

- [ ] **Step 4: Create status service**

Create `ops/systemd/munich-weekly-status.service`:

```ini
[Unit]
Description=Munich Weekly production status report
After=docker.service network-online.target
Wants=network-online.target
OnFailure=munich-weekly-alert@%n.service

[Service]
Type=oneshot
User=root
Group=root
ExecStart=/usr/local/sbin/munich-weekly-status.sh
```

- [ ] **Step 5: Create status timer**

Create `ops/systemd/munich-weekly-status.timer`:

```ini
[Unit]
Description=Run Munich Weekly production status report daily

[Timer]
OnCalendar=*-*-* 08:00:00
Persistent=true
RandomizedDelaySec=15m

[Install]
WantedBy=timers.target
```

- [ ] **Step 6: Create operations runbook**

Create `docs/operations/runbook.md`:

````markdown
# Operations Runbook

> Class: Operational runbook
> Owner: Platform maintainer
> Update when: production services, deployment, monitoring, backup, or maintenance procedures change.

## Daily Automated Checks

The production server runs `munich-weekly-status.timer`, which records a read-only status report through journald.

Systemd services use `OnFailure=munich-weekly-alert@%n.service`. Configure `/etc/munich-weekly/alerts.env` with `OPS_ALERT_WEBHOOK_URL` so failed backups, allowlist updates, and status checks send alerts outside the server.

Manual command:

```bash
sudo /usr/local/sbin/munich-weekly-status.sh
```

## Weekly Maintenance Review

Review:

- Pending apt packages.
- Whether `/var/run/reboot-required` exists.
- Latest backup status.
- Latest restore drill status.
- PM2 restart count and error log growth.
- Docker container status.
- Disk usage.
- Dependabot PRs and GitHub security alerts.

## Monthly Maintenance Window

Run OS updates and reboot when required:

```bash
sudo apt-get update
sudo apt-get upgrade
sudo reboot
```

After reboot:

```bash
ssh munichweekly
sudo /usr/local/sbin/munich-weekly-status.sh
```
````

- [ ] **Step 7: Verify script syntax**

Run:

```bash
bash -n ops/scripts/production-status.sh
bash -n ops/scripts/notify-ops.sh
```

Expected: no output and exit 0.

- [ ] **Step 8: Commit**

Run:

```bash
git add ops/scripts/production-status.sh ops/scripts/notify-ops.sh ops/systemd/munich-weekly-status.service ops/systemd/munich-weekly-status.timer ops/systemd/munich-weekly-alert@.service docs/operations/runbook.md
git commit -m "ops: add production status automation"
```

Expected: commit succeeds.

---

## Task 11: Add Incident Response Runbook

**Files:**
- Create: `docs/operations/incident-response.md`
- Modify: `docs/index.md`

- [ ] **Step 1: Create incident response runbook**

Create `docs/operations/incident-response.md`:

````markdown
# Incident Response Runbook

> Class: Operational runbook
> Owner: Platform maintainer
> Update when: alerting, secrets, hosting, backup, or recovery procedures change.

## Severity Levels

P0: site unavailable, active compromise, data loss, exposed secret, or direct exploit of a critical vulnerability.

P1: degraded user-facing feature, failed backups, failed deployment rollback, high severity dependency alert, or reboot-required state older than 7 days.

P2: non-urgent dependency drift, documentation drift, warning-level monitoring, or planned maintenance.

## First 15 Minutes

1. Preserve evidence before changing state:

```bash
date -Is
git -C /home/deploy/munich-weekly rev-parse HEAD
docker ps
pm2 status --no-color
sudo journalctl -u nginx -n 200 --no-pager
docker logs --tail 200 mw-backend
```

2. If a secret may be exposed, rotate the secret first and invalidate dependent sessions.
3. If Cloudflare is available, enable stricter WAF/challenge rules while investigating.
4. If the origin is being attacked directly, confirm source allowlist is active or temporarily restrict 80/443 at the host firewall.
5. If data integrity is in doubt, stop write paths before restoring.

## Credential Rotation Inventory

Rotate every credential in the affected blast radius:

- SSH keys and deploy user access.
- GitHub deploy keys, fine-grained tokens, and repository secrets.
- Cloudflare API tokens, R2 access keys, Turnstile secret, and image worker secrets.
- `JWT_SECRET` and `ANONYMOUS_VOTE_SECRET`.
- PostgreSQL password and backend datasource credentials.
- Mailjet API key and secret.
- Backup repository credentials and `RESTIC_PASSWORD` if backup access may be exposed.

After rotating `JWT_SECRET`, force user re-authentication and treat old JWTs as invalid.

## Evidence Preservation

Save incident evidence outside the production server:

```bash
mkdir -p incident-evidence
date -Is > incident-evidence/timestamp.txt
ssh munichweekly 'hostname; date -Is; docker ps; pm2 status --no-color' > incident-evidence/runtime-status.txt
ssh munichweekly 'sudo journalctl -u nginx -n 1000 --no-pager' > incident-evidence/nginx-journal.txt
ssh munichweekly 'docker logs --tail 1000 mw-backend' > incident-evidence/backend-container.log
```

Also preserve Cloudflare audit logs, WAF events, R2 audit/activity data, GitHub audit/security alerts, and deployment commit SHAs.

## Isolation Criteria

Temporarily isolate production when any of these are true:

- Active unauthorized writes are suspected.
- Secrets from `.env`, Cloudflare, GitHub, R2, or database access may be exposed.
- Database integrity is unknown.
- Direct-origin attack traffic cannot be blocked at Cloudflare or the host firewall.

Isolation options are Cloudflare WAF block/challenge rules, host firewall restrictions, stopping write endpoints, or stopping the backend container after preserving evidence.

## Communications and Disclosure

Assign one incident owner and one communications owner. Decide user notification and legal/privacy follow-up based on whether personal data, contact emails, uploaded photos, authentication data, or private admin actions were accessed or modified.

## Timeline Template

Record:

- Detection time.
- First responder.
- User impact.
- Suspected entry point.
- Containment action and time.
- Credentials rotated.
- Data restored or verified.
- Permanent fix PR/commit.
- Follow-up owner and deadline.

## Dependency Vulnerability Response

1. Check whether Dependabot has opened a security PR.
2. Run CI on the patch branch.
3. Deploy through `/usr/local/sbin/munich-weekly-deploy.sh`.
4. Confirm the fixed package version on production.
5. Record the incident and mitigation in the incident notes.

## Backup Failure Response

1. Treat a failed backup as P1.
2. Run:

```bash
sudo systemctl start munich-weekly-backup.service
sudo journalctl -u munich-weekly-backup.service -n 160 --no-pager
```

3. Fix the failure before the next business day.
4. Run a restore drill after fixing backup logic.

## Recovery Exit Criteria

An incident is not closed until:

- The root cause is recorded.
- The mitigation is deployed.
- Backups are confirmed healthy.
- Monitoring no longer reports the issue.
- Any exposed secrets are rotated.
- A follow-up issue or PR exists for permanent prevention.
````

- [ ] **Step 2: Link from docs index**

Add operations links to `docs/index.md`:

```markdown
## Operations

- [Operations Runbook](./operations/runbook.md)
- [Backup and Restore Runbook](./operations/backup-restore.md)
- [Incident Response Runbook](./operations/incident-response.md)
```

- [ ] **Step 3: Run docs check**

Run:

```bash
./scripts/check-docs.sh
```

Expected: script exits 0.

- [ ] **Step 4: Commit**

Run:

```bash
git add docs/operations/incident-response.md docs/index.md
git commit -m "docs: add incident response runbook"
```

Expected: commit succeeds.

---

## Task 12: Production Installation and Safe Rollout

**Files:**
- No repository file changes unless production-only notes reveal doc corrections.

- [ ] **Step 1: Push branch and open PR**

Run:

```bash
git push -u origin codex/ops-automation-hardening
```

Expected: branch pushes successfully. Open a draft PR and wait for CI.

- [ ] **Step 2: Review GitHub repository settings**

In GitHub repository settings, enable:

```text
Dependency graph: enabled
Dependabot alerts: enabled
Dependabot security updates: enabled
Secret scanning: enabled if available for the repository plan
Push protection: enabled if available for the repository plan
Branch protection for main: require CI and Docs Quality checks
```

- [ ] **Step 3: Install server scripts after PR merge**

On production:

```bash
ssh munichweekly
cd /home/deploy/munich-weekly
git fetch origin main
git checkout origin/main
sudo install -m 0755 ops/scripts/backup-production.sh /usr/local/sbin/munich-weekly-backup.sh
sudo install -m 0755 ops/scripts/restore-backup-drill.sh /usr/local/sbin/munich-weekly-restore-drill.sh
sudo install -m 0755 ops/scripts/production-status.sh /usr/local/sbin/munich-weekly-status.sh
sudo install -m 0755 ops/scripts/notify-ops.sh /usr/local/sbin/munich-weekly-notify-ops.sh
sudo install -m 0755 ops/scripts/deploy-production.sh /usr/local/sbin/munich-weekly-deploy.sh
sudo install -m 0755 ops/scripts/update-cloudflare-origin-allowlist.sh /usr/local/sbin/update-cloudflare-origin-allowlist.sh
sudo install -m 0644 ops/systemd/*.service /etc/systemd/system/
sudo install -m 0644 ops/systemd/*.timer /etc/systemd/system/
sudo systemctl daemon-reload
```

Alerting note: install `munich-weekly-alert@.service` before enabling timers or
services that reference `OnFailure=munich-weekly-alert@%n.service`. If doing an
early install pass, install units now and enable timers after the Task 10 alert
template is installed.

- [ ] **Step 4: Configure backup secrets without printing them**

On production:

```bash
sudo install -d -m 0700 /etc/munich-weekly
sudoedit /etc/munich-weekly/backup.env
sudo chmod 0600 /etc/munich-weekly/backup.env
```

The file must define:

```bash
RESTIC_REPOSITORY=
RESTIC_PASSWORD=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
RCLONE_CONFIG=/etc/munich-weekly/rclone.conf
RCLONE_R2_SOURCE=
RCLONE_R2_BACKUP=
REQUIRE_R2_BACKUP=true
```

Do not paste the values into chat, Git, shell history, or documentation.

Configure alerting without printing the webhook value:

```bash
sudoedit /etc/munich-weekly/alerts.env
sudo chmod 0600 /etc/munich-weekly/alerts.env
```

The file must define:

```bash
OPS_ALERT_WEBHOOK_URL=
```

- [ ] **Step 5: Initialize and test backup**

On production:

```bash
sudo bash -lc 'set -a; . /etc/munich-weekly/backup.env; set +a; restic snapshots >/dev/null 2>&1 || restic init'
sudo bash -lc 'set -a; . /etc/munich-weekly/backup.env; set +a; restic snapshots'
sudo systemctl start munich-weekly-backup.service
sudo journalctl -u munich-weekly-backup.service -n 160 --no-pager
```

Expected: service exits 0 and restic lists snapshots.

- [ ] **Step 6: Run restore drill**

On production:

```bash
sudo /usr/local/sbin/munich-weekly-restore-drill.sh
```

Expected: `Restore drill succeeded from snapshot ...`.

- [ ] **Step 7: Enable timers**

On production:

```bash
sudo systemctl enable --now munich-weekly-backup.timer
sudo systemctl enable --now munich-weekly-status.timer
sudo systemctl enable --now munich-weekly-cloudflare-allowlist.timer
systemctl list-timers 'munich-weekly-*' --no-pager
```

Expected: all timers are listed with future next-run times.

- [ ] **Step 8: Configure network-layer origin restriction**

Before relying on Nginx-only blocking, configure one of these production controls:

Preferred control:

```text
Cloudflare Tunnel routes munichweekly.art and www.munichweekly.art to the origin, and public inbound 80/443 are closed at the server firewall.
```

Acceptable control:

```text
Hetzner Cloud Firewall or host firewall allows TCP 80/443 only from Cloudflare published IPv4/IPv6 ranges, allows TCP 22222 only from administrator source IPs, and drops other inbound traffic.
```

Safety check before applying firewall rules:

```bash
echo "$SSH_CONNECTION"
```

Expected: the administrator source IP shown by `$SSH_CONNECTION` is explicitly allowed for TCP `22222` before any deny rule is applied. Do not enable a firewall rule set that can lock out SSH recovery.

- [ ] **Step 9: Enable Authenticated Origin Pulls in Cloudflare**

Before installing the Nginx `ssl_verify_client on` snippet, enable Authenticated Origin Pulls for `munichweekly.art` and `www.munichweekly.art` in Cloudflare.

Expected: Cloudflare is configured to present its authenticated origin pull client certificate to the origin. Do not continue to Nginx reload until this Cloudflare-side setting is active.

- [ ] **Step 10: Apply Nginx configs in a maintenance window**

On production:

```bash
sudo systemctl start munich-weekly-cloudflare-allowlist.service
sudo install -d -m 0755 /etc/nginx/certs
curl -fsSL https://developers.cloudflare.com/ssl/static/authenticated_origin_pull_ca.pem -o /tmp/cloudflare-origin-pull-ca.pem
sudo install -m 0644 /tmp/cloudflare-origin-pull-ca.pem /etc/nginx/certs/cloudflare-origin-pull-ca.pem
sudo install -m 0644 ops/nginx/snippets/security-headers.conf /etc/nginx/snippets/munichweekly-security-headers.conf
sudo install -m 0644 ops/nginx/snippets/cloudflare-authenticated-origin-pull.conf /etc/nginx/snippets/cloudflare-authenticated-origin-pull.conf
sudo install -m 0644 ops/nginx/munichweekly.art.conf /etc/nginx/sites-available/munichweekly.art.conf
sudo nginx -t
sudo systemctl reload nginx
curl -fsS --max-time 15 https://munichweekly.art >/dev/null
```

Expected: Nginx reloads successfully and the public Cloudflare-routed site remains reachable.

If the public Cloudflare-routed check fails, immediately roll back the authenticated origin pull snippet and reload:

```bash
sudo sed -i.bak '/cloudflare-authenticated-origin-pull.conf/d' /etc/nginx/sites-available/munichweekly.art.conf
sudo nginx -t
sudo systemctl reload nginx
```

Then verify public HTTPS again and inspect Cloudflare Authenticated Origin Pull settings before retrying.

- [ ] **Step 11: Verify source origin protection**

From a machine outside Cloudflare:

```bash
curl -k -I --max-time 10 --resolve munichweekly.art:443:94.130.231.146 https://munichweekly.art
```

Expected: no `200` response. A `403` response or blocked connection is acceptable.

- [ ] **Step 12: Run the first controlled deploy**

On production:

```bash
/usr/local/sbin/munich-weekly-deploy.sh
```

Expected: deployment succeeds, backup succeeds, smoke checks pass.

- [ ] **Step 13: Apply OS updates and reboot in a maintenance window**

On production:

```bash
sudo apt-get update
sudo apt-get upgrade
sudo reboot
```

After reconnecting:

```bash
ssh munichweekly
sudo /usr/local/sbin/munich-weekly-status.sh
```

Expected: services are healthy and `/var/run/reboot-required` is absent.

---

## Task 13: Final Verification

**Files:**
- No new files unless documentation drift is found.

- [ ] **Step 1: Run repository verification**

Run:

```bash
cd backend
./gradlew test --no-daemon
cd ../frontend
npm ci
npx tsc --noEmit
npm run lint
npm run build
npm audit --omit=dev --audit-level=high
cd ../image-worker
npm ci
npm test
npm audit --omit=dev --audit-level=high
cd ..
./scripts/check-docs.sh
```

Expected: all commands exit 0.

- [ ] **Step 2: Verify production runtime**

On production:

```bash
sudo /usr/local/sbin/munich-weekly-status.sh
sudo systemctl status munich-weekly-backup.timer --no-pager
sudo systemctl status munich-weekly-status.timer --no-pager
sudo systemctl status munich-weekly-cloudflare-allowlist.timer --no-pager
```

Expected: status script succeeds and timers are active.

- [ ] **Step 3: Verify headers**

On production:

```bash
curl -I --max-time 10 https://munichweekly.art
```

Expected:

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
```

Expected absent:

```text
X-Debug-Proxy
X-Powered-By
```

- [ ] **Step 4: Final review**

Dispatch a final `gpt-5.5` medium code reviewer subagent with:

```text
Review the complete operations automation and hardening branch for Munich Weekly. Focus on security regressions, unsafe production commands, missing backup restore coverage, GitHub Actions correctness, and documentation drift. Return findings ordered by severity with exact file paths and commands to reproduce.
```

Expected: no blocking findings remain.

---

## Self-Review Checklist

- Spec coverage: dependency automation, CI, backups, restore drill, origin protection, deploy safety, logging, production maintenance, incident response, and docs are covered by tasks.
- Placeholder scan: production secrets are intentionally excluded from repo content; the plan names required variable keys and storage locations instead of inventing secret values.
- Type and path consistency: scripts use `/home/deploy/munich-weekly`, `mw-postgres`, `mw-backend`, `munich-frontend`, and `/api/layout/health`, matching the observed production baseline.
- Execution safety: production-changing steps are isolated in Task 12 after review, merge, and explicit maintenance-window execution.
