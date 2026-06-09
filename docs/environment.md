# Environment Variables

> Class: Source of truth
> Owner: Backend/platform maintainer
> Update when: code reads a new environment variable or changes a default.

This document maps environment variables to the current codebase. Code is the
source of truth; when this document conflicts with code, update this document.

## Local Agent Secrets

The repository root `.env.local` file is a local-only agent secret file. It is
ignored by git and is not part of application runtime configuration. Do not
commit it, print its values, copy its values into documentation, or paste its
values into shell commands.

| Variable | Used by | Required for | Notes |
|---|---|---|---|
| `SSH_PASSWORD` | Agent-operated SSH sessions | Remote maintenance through the configured SSH host alias | Use `ssh munichweekly`; do not place the password in the command line. |
| `LOCAL_ADMIN_EMAIL` | Agent browser/API tests | Local admin login flows | Use from environment at runtime; do not hard-code in tests or docs. |
| `LOCAL_ADMIN_PW` | Agent browser/API tests | Local admin login flows | Use from environment at runtime; do not hard-code in tests or docs. |

Agents may load this file for local work, for example by sourcing it in the
current shell, but must not echo or persist the values.

## Operations

These variables are used by production operations scripts. They are not
application runtime variables and must not be committed.

| Variable | Used by | Required for | Notes |
|---|---|---|---|
| `RESTIC_REPOSITORY` | `ops/scripts/backup-production.sh` | Production backups | Encrypted restic repository URL. Use a private backup bucket such as `munichweekly-ops-backups`. |
| `RESTIC_PASSWORD` | `ops/scripts/backup-production.sh` | Production backups | Secret used to encrypt/decrypt restic backups. Store in `/etc/munich-weekly/backup.env` on the server and in the password manager. |
| `AWS_ACCESS_KEY_ID` | restic S3 backend | R2/S3 backup repository | Secret for the private backup bucket, not the public uploads bucket. |
| `AWS_SECRET_ACCESS_KEY` | restic S3 backend | R2/S3 backup repository | Secret for the private backup bucket, not the public uploads bucket. |
| `APP_DIR` | `ops/scripts/backup-production.sh`, `ops/scripts/production-status.sh` | Optional override | Defaults to `/home/deploy/munich-weekly`. |
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
| `OPS_ALERT_CONNECT_TIMEOUT` | `ops/scripts/notify-ops.sh` | Optional alert delivery override | Defaults to `10` seconds for webhook connection setup. |
| `OPS_ALERT_MAX_TIME` | `ops/scripts/notify-ops.sh` | Optional alert delivery override | Defaults to `20` seconds for total webhook delivery time. |
| `ALERT_ENV` | `ops/scripts/notify-ops.sh` | Optional alert env override | Defaults to `/etc/munich-weekly/alerts.env`. Use only for local validation or if production alert config intentionally moves. |
| `BACKUP_UNIT` | `ops/scripts/production-status.sh` | Optional status check override | Defaults to `munich-weekly-backup.service` for recent backup journal output. |
| `BACKUP_TIMER` | `ops/scripts/production-status.sh` | Optional status check override | Defaults to `munich-weekly-backup.timer` for timer status output. |
| `BACKEND_HEALTH_URL` | `ops/scripts/production-status.sh` | Optional status check override | Defaults to `http://127.0.0.1:8080/api/layout/health`. |
| `LOCAL_FRONTEND_URL` | `ops/scripts/production-status.sh` | Optional status check override | Defaults to `http://127.0.0.1:3000/`. |
| `PUBLIC_FRONTEND_URL` | `ops/scripts/production-status.sh` | Optional status check override | Defaults to `https://munichweekly.art`. |
| `STATUS_PROBE_TIMEOUT` | `ops/scripts/production-status.sh` | Optional status check override | Defaults to `20s` for each non-HTTP probe. Increase only for one-off diagnostics on a slow host. |

## Backend

The backend reads defaults from `backend/src/main/resources/application.properties`.
Spring Boot environment variables can override those properties through relaxed
binding, for example `STORAGE_MODE` overrides `storage.mode`.

| Variable | Used by | Required for | Notes |
|---|---|---|---|
| `POSTGRES_DB` | `compose.yaml`, datasource URL placeholder | Docker PostgreSQL and backend container | Database name. |
| `POSTGRES_USER` | `compose.yaml`, datasource username placeholder | Docker PostgreSQL and backend container | Database user. |
| `POSTGRES_PASSWORD` | `compose.yaml`, datasource password placeholder | Docker PostgreSQL and backend container | Secret. |
| `SPRING_DATASOURCE_URL` | Spring Boot override | Host-run backend | Use `jdbc:postgresql://localhost:5432/<db>` when Spring Boot runs outside Docker. |
| `SPRING_DATASOURCE_USERNAME` | Spring Boot override | Host-run backend | Usually matches `POSTGRES_USER`. |
| `SPRING_DATASOURCE_PASSWORD` | Spring Boot override | Host-run backend | Usually matches `POSTGRES_PASSWORD`. |
| `JWT_SECRET` | `jwt.secret` | All backend runs | Required secret used to sign JWTs. Backend startup rejects blank values, the removed fallback value, and values shorter than 32 UTF-8 bytes. Rotating this value invalidates existing JWTs. |
| `JWT_EXPIRATION_MS` | `jwt.expirationMs` | Optional | Defaults to `3600000` in code. |
| `AUTH_RATE_LIMIT_LOGIN_MAX_ATTEMPTS` | `auth.rate-limit.login.max-attempts` | Optional auth throttling | Defaults to `10` failed email/password login attempts per remote address and normalized email. In-memory per backend JVM; restart clears counters. |
| `AUTH_RATE_LIMIT_LOGIN_WINDOW_SECONDS` | `auth.rate-limit.login.window-seconds` | Optional auth throttling | Defaults to `900` seconds. |
| `AUTH_RATE_LIMIT_PASSWORD_RESET_MAX_ATTEMPTS` | `auth.rate-limit.password-reset.max-attempts` | Optional password reset throttling | Defaults to `3` forgot-password requests per remote address and normalized email. In-memory per backend JVM; restart clears counters. |
| `AUTH_RATE_LIMIT_PASSWORD_RESET_WINDOW_SECONDS` | `auth.rate-limit.password-reset.window-seconds` | Optional password reset throttling | Defaults to `3600` seconds. |
| `AUTH_RATE_LIMIT_PASSWORD_RESET_COOLDOWN_SECONDS` | `auth.rate-limit.password-reset.cooldown-seconds` | Optional password reset throttling | Defaults to `300` seconds between accepted forgot-password requests for the same remote address and normalized email. |
| `STORAGE_MODE` | `storage.mode` | Local upload mode or explicit production mode | Supported values are `LOCAL` and `R2`. The code default is `R2`. |
| `UPLOADS_DIR` | `uploads.directory` | Local storage mode | Defaults to `./uploads` when not set. Compose mounts `/uploads`. |
| `CLOUDFLARE_R2_ACCESS_KEY` | R2 storage service | R2 uploads | Secret. |
| `CLOUDFLARE_R2_SECRET_KEY` | R2 storage service | R2 uploads | Secret. |
| `CLOUDFLARE_R2_ENDPOINT` | R2 storage service | R2 uploads | Must be the Cloudflare R2 S3-compatible endpoint. |
| `CLOUDFLARE_R2_BUCKET` | R2 storage service | R2 uploads | Defaults to `munichweekly-photoupload`. |
| `CLOUDFLARE_R2_PUBLIC_URL` | R2 URL generation | R2 uploads | Public base URL for stored objects. |
| `MAILJET_API_KEY` | Mailjet email service | Password reset emails | Secret. |
| `MAILJET_API_SECRET` | Mailjet email service | Password reset emails | Secret. |
| `APP_FRONTEND_URL` | Password reset links | Password reset emails | Defaults to `https://munichweekly.art`. |
| `TURNSTILE_SECRET_KEY` | Anonymous submission CAPTCHA | Anonymous submissions | Secret used by backend verification. |
| `TURNSTILE_VERIFY_URL` | Anonymous submission CAPTCHA | Optional | Defaults to Cloudflare siteverify URL. |
| `ANONYMOUS_UPLOAD_TOKEN_EXPIRATION_MS` | Anonymous upload token service | Optional | Defaults to `900000`. |
| `VOTES_BATCH_STATUS_MAX_SUBMISSION_IDS` | `votes.batch-status.max-submission-ids` | Optional vote status throttling | Defaults to `200` normalized unique submission IDs per `/api/votes/check-batch` request. |
| `ANONYMOUS_VOTE_SECRET` | `anonymous.vote.secret` | Anonymous voting in production | Secret used to sign the HttpOnly `mw_vote_anon` cookie. Required for `prod*` profiles and must be at least 32 characters. Rotating this value invalidates existing anonymous vote cookies. |
| `ANONYMOUS_VOTE_COOKIE_SECURE` | `anonymous.vote.cookie-secure` | Optional anonymous vote cookie setting | Defaults to `false`; `prod*` profiles force `Secure` regardless of this value. |
| `ANONYMOUS_VOTE_COOKIE_MAX_AGE_SECONDS` | `anonymous.vote.cookie-max-age-seconds` | Optional anonymous vote cookie setting | Defaults to `31536000` seconds. |
| `ANONYMOUS_VOTE_TOKEN_ISSUANCE_MAX_ATTEMPTS` | `anonymous.vote.token-issuance-max-attempts` | Optional anonymous vote abuse throttling | Defaults to `50` new anonymous vote tokens per client address per window. In-memory per backend JVM; restart clears counters. |
| `ANONYMOUS_VOTE_TOKEN_ISSUANCE_WINDOW_SECONDS` | `anonymous.vote.token-issuance-window-seconds` | Optional anonymous vote abuse throttling | Defaults to `600` seconds. |
| `ANONYMOUS_VOTE_ATTEMPT_MAX_ATTEMPTS` | `anonymous.vote.vote-attempt-max-attempts` | Optional anonymous vote abuse throttling | Defaults to `200` anonymous vote attempts per client address and submission per window. This is not a one-IP-one-vote rule. |
| `ANONYMOUS_VOTE_ATTEMPT_WINDOW_SECONDS` | `anonymous.vote.vote-attempt-window-seconds` | Optional anonymous vote abuse throttling | Defaults to `600` seconds. |
| `SPRING_PROFILES_ACTIVE` | Spring profiles | Optional | `prod` is compose default. `dev` clears and reseeds data on startup. `prod-init` seeds initial users without clearing existing data. |

Auth throttling uses in-memory counters per backend JVM. It keys attempts by
normalized email and client address. When the direct peer is a local/private
reverse proxy, the backend uses the proxy-provided `X-Real-IP` value or the
last usable `X-Forwarded-For` entry; direct public peers cannot override their
`remoteAddr` with forwarded headers.

Anonymous vote abuse throttling also uses in-memory counters per backend JVM.
The backend treats the signed HttpOnly `mw_vote_anon` cookie as the anonymous
vote identity; client address limits are broad controls for excessive token
issuance or repeated anonymous vote attempts and are not used as the voter
identity.

## Frontend

| Variable | Used by | Required for | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | `frontend/next.config.js`, frontend API routes | Optional | Defaults to `http://localhost:8080/api` for rewrites. `sync-hero` normalizes a trailing `/api` before appending `/api/users/me`; check each frontend API route before changing this value globally. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | `src/app/submit/page.tsx` | Anonymous submission CAPTCHA | Public site key for the Turnstile widget. |
| `DEBUG_CONFIG_API` | `src/app/frontend-api/config/route.ts` | Optional debugging | Set to `1` for config API debug logging. |
| `HERO_IMAGE_ALLOWED_ORIGINS` | `src/app/frontend-api/admin/sync-hero/route.ts` | Optional remote homepage hero sync origins | Comma-separated exact HTTPS origins allowed for admin hero image sync, in addition to the current built-in image CDN origins. Do not include path segments, credentials, or wildcards. |
| `NODE_ENV` | Next.js and image utilities | Managed by Next.js | `development` changes image optimization and upload rewrite behavior. |

## Image Worker

The Cloudflare Image Worker reads bindings and variables from
`image-worker/wrangler.toml` and the Cloudflare Worker environment.

| Variable | Used by | Required for | Notes |
|---|---|---|---|
| `BUCKET_NAME` | `image-worker/wrangler.toml` | Optional metadata | Name of the R2 bucket bound as `PHOTO_BUCKET`. |
| `DEBUG_ROUTES_ENABLED` | `image-worker/src/index.js` | Optional local diagnostics | Set to `true` only for deliberate diagnostics. `/debug-*` routes return `404` unless this is true and `DEBUG_AUTH_SECRET` is configured. |
| `DEBUG_AUTH_SECRET` | `image-worker/src/index.js` | Optional local diagnostics | Secret for debug routes, sent as the `x-debug-secret` header. Must be at least 32 characters. Do not put this value in URLs. |

## Profiles

Use these profiles deliberately:

| Profile | Current behavior |
|---|---|
| unset / `local` | Normal local run, no seed/reset behavior from current profile-specific devtools. |
| `dev` | Runs a database reset and then seeds test users. Destructive by design. |
| `prod` | Default backend container profile from `compose.yaml`. |
| `prod-init` | Seeds initial production users only when the database is empty. |

## Storage Modes

`LOCAL`:
Stores files under `UPLOADS_DIR`, served through `/uploads/**`. Best for local
development.

`R2`:
Uses Cloudflare R2. Requires access key, secret key, endpoint, bucket, and public
URL values for upload flows.

## Database Schema Management

The current backend uses Hibernate `spring.jpa.hibernate.ddl-auto=update` plus
targeted startup schema adjustments such as `GalleryOrderSchemaMigration`.
Although SQL files exist under `backend/src/main/resources/db/migration`, Flyway
is not currently configured as an active dependency in `backend/build.gradle`.

Until the project intentionally enables Flyway, document schema changes against
the JPA entities and any startup migration code that actually runs.
