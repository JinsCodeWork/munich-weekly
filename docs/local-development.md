# Local Development

> Class: Operational guide
> Owner: Backend/platform maintainer
> Update when: local startup commands, profiles, ports, or smoke checks change.

This guide is the source of truth for running Munich Weekly on a developer machine.
It follows the current codebase behavior; it does not require code changes.

## Recommended Path

Use Docker only for PostgreSQL, and run Spring Boot plus Next.js on the host.
This keeps logs and hot reload simple, and it avoids relying on Docker-only hostnames
from a host-run backend process.

### 1. Start PostgreSQL

Create `backend/.env` with at least:

```env
POSTGRES_DB=munichweekly
POSTGRES_USER=munichweekly
POSTGRES_PASSWORD=munichweekly
JWT_SECRET=replace-with-a-long-local-secret
JWT_EXPIRATION_MS=3600000
```

Then start the database:

```bash
cd backend
docker compose up -d postgres
```

### 2. Run the Backend on the Host

When `bootRun` runs on the host, the default datasource URL
`jdbc:postgresql://postgres:5432/...` is not valid because `postgres` is a Docker
network hostname. Override it with the localhost URL exposed by `compose.yaml`.

```bash
cd backend
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/munichweekly \
SPRING_DATASOURCE_USERNAME=munichweekly \
SPRING_DATASOURCE_PASSWORD=munichweekly \
STORAGE_MODE=LOCAL \
UPLOADS_DIR=./uploads \
JWT_SECRET=replace-with-a-long-local-secret \
JWT_EXPIRATION_MS=3600000 \
SPRING_PROFILES_ACTIVE=local \
./gradlew bootRun
```

`STORAGE_MODE=LOCAL` is important for local upload testing without Cloudflare R2
credentials. Spring Boot maps it to the `storage.mode` property.

Do not use `SPRING_PROFILES_ACTIVE=dev` unless you intentionally want a reset
database. The current `dev` profile runs `DataResetService.resetAllData()` on
startup and then seeds test users.

Smoke checks:

```bash
curl http://localhost:8080/ping
curl http://localhost:8080/api/layout/health
```

### 3. Run the Frontend

The frontend rewrite configuration defaults API calls to `http://localhost:8080/api`.
Use Node.js 20 or newer; `frontend/package.json` declares this runtime floor.

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

For anonymous submission CAPTCHA testing, set `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
for the frontend and `TURNSTILE_SECRET_KEY` for the backend. Without those values,
regular browsing and most authenticated flows can still be developed, but the
anonymous submission CAPTCHA path will not be complete.

## Docker Backend Path

`backend/compose.yaml` can run the backend container too:

```bash
cd backend
docker compose up -d
```

Current compose behavior is production-like:

- PostgreSQL and backend ports bind to `127.0.0.1`.
- The backend profile defaults to `prod`.
- The compose file does not explicitly pass `STORAGE_MODE`.
- Because `application.properties` defaults `storage.mode` to `R2`, upload testing
  in this path requires working R2 environment variables unless you add an
  environment override before running the container.

For day-to-day local feature work, prefer the host-run backend path above.

## Validation Commands

Backend:

```bash
cd backend
./gradlew test
```

Frontend:

```bash
cd frontend
npx tsc --noEmit
npm run test:routes
npm run build
npm run lint
```

`frontend/package.json` currently does not define a `type-check` script, so use
`npx tsc --noEmit` directly.

## Common Problems

`UnknownHostException: postgres` when running `bootRun`:
Use `SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/...` for host-run
Spring Boot.

Uploads fail locally with R2 credential errors:
Use `STORAGE_MODE=LOCAL` for host-run Spring Boot, or provide the full R2
credential set when running the backend container.

Local data disappears after backend startup:
Check `SPRING_PROFILES_ACTIVE`. The `dev` profile intentionally clears core data
on startup.
