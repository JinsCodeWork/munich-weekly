# Environment Variables

This document maps environment variables to the current codebase. Code is the
source of truth; when this document conflicts with code, update this document.

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
| `JWT_SECRET` | `jwt.secret` | All backend runs | Secret used to sign JWTs. Do not use the fallback value outside disposable local runs. |
| `JWT_EXPIRATION_MS` | `jwt.expirationMs` | Optional | Defaults to `3600000` in code. |
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
| `SPRING_PROFILES_ACTIVE` | Spring profiles | Optional | `prod` is compose default. `dev` clears and reseeds data on startup. `prod-init` seeds initial users without clearing existing data. |

## Frontend

| Variable | Used by | Required for | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | `frontend/next.config.js`, frontend API routes | Optional | Defaults to `http://localhost:8080/api` for rewrites. If set for frontend API routes, use the backend base expected by that route. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | `src/app/submit/page.tsx` | Anonymous submission CAPTCHA | Public site key for the Turnstile widget. |
| `DEBUG_CONFIG_API` | `src/app/frontend-api/config/route.ts` | Optional debugging | Set to `1` for config API debug logging. |
| `NODE_ENV` | Next.js and image utilities | Managed by Next.js | `development` changes image optimization and upload rewrite behavior. |

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
