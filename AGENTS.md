# AGENTS.md

This file is the operating guide for Codex and other coding agents working in
this repository. Keep detailed product, deployment, API, and architecture facts
in `docs/`; keep this file focused on how agents should work safely.

## Working Principle

Code and runtime configuration are the source of truth. When documentation and
code disagree, inspect code first and update documentation. Do not change
business code to match outdated documentation unless the user explicitly asks
for a code change.

## Project Snapshot

- Frontend: Next.js 15, TypeScript, Tailwind CSS
- Backend: Java 21, Spring Boot 3, Gradle
- Database: PostgreSQL via Docker
- Auth: JWT with Spring Security
- Storage: Cloudflare R2 in production or local uploads in development

Use [docs/index.md](./docs/index.md) as the documentation map.

## Commands

Backend commands run from `backend/`:

```bash
cd backend
./gradlew bootRun
./gradlew test
./gradlew check
./gradlew build
docker compose up -d postgres
docker compose up -d
```

Important: `./gradlew bootRun` must run from `backend/`. If Spring Boot runs on
the host while PostgreSQL runs in Docker Compose, override the datasource URL to
`jdbc:postgresql://localhost:5432/<db>` because the default `postgres` hostname
only works inside the Docker network. See [Local Development](./docs/local-development.md).

Frontend commands run from `frontend/`:

```bash
cd frontend
npm install
npm run dev
npm run lint
npm run build
```

Documentation/API commands run from the repository root:

```bash
API_BASE_URL=http://localhost:8080 ./scripts/generate-openapi.sh
./scripts/check-docs.sh
```

## Local Agent Secrets

The repository root may contain a local-only `.env.local` file for agent
operations. It is ignored by git and must never be committed, printed, copied
into docs, pasted into commands, or included in commit messages.

Known agent-only fields:

- `SSH_PASSWORD`: password for the existing SSH host alias.
- `LOCAL_ADMIN_EMAIL`: local admin account email for browser/API testing.
- `LOCAL_ADMIN_PW`: local admin account password for browser/API testing.

Use the SSH host alias exactly as configured:

```bash
ssh munichweekly
```

Do not write the password into the SSH command. If an automation needs these
values, load them from `.env.local` at runtime and keep them in process memory
only; do not echo them or persist derived files.

## Architecture Pointers

Do not duplicate architecture details here. Use these source documents:

- Backend/API contract: [docs/api.md](./docs/api.md), [docs/api.json](./docs/api.json)
- Next.js route handlers under `/frontend-api/*`: [docs/frontend-api.md](./docs/frontend-api.md)
- Frontend architecture: [docs/frontend-architecture.md](./docs/frontend-architecture.md)
- Environment variables and profiles: [docs/environment.md](./docs/environment.md)
- Database behavior: [docs/database.md](./docs/database.md)
- Storage: [docs/storage.md](./docs/storage.md)
- Deployment: [docs/deployment.md](./docs/deployment.md)

## Backend Rules

- Keep controller, service, repository, model, DTO, security, config, and
  exception responsibilities separated.
- Controllers must use DTOs for API requests/responses; do not expose domain
  models directly.
- Use `@Valid` on request DTOs that have validation constraints.
- Use `@PreAuthorize("hasAuthority('admin')")` or the established role rule for
  admin-only endpoints.
- Use `CurrentUserUtil.getUserIdOrThrow()` when controller logic needs the
  authenticated user.
- Throw `IllegalArgumentException` or `IllegalStateException` for expected
  business errors handled by `GlobalExceptionHandler`.
- Use `StorageService.storeFileWithDimensions()` for image uploads that need
  persisted dimensions.
- The runtime currently uses Hibernate `ddl-auto=update` plus targeted startup
  schema adjustments. SQL migration files exist, but Flyway is not active unless
  the build/config is changed to enable it.

## Frontend Rules

- Use `"use client"` for interactive App Router components.
- Use typed API functions through `frontend/src/api/http.ts` and feature modules;
  avoid raw backend fetches in components.
- Use `useAuth()` or protected layouts/components for authenticated UI.
- Keep reusable UI in `components/ui/`; keep feature-specific components in
  their feature folder.
- Use Tailwind utilities and the established design tokens in `frontend/src/styles`.
- Route handlers under `frontend/src/app/frontend-api/**/route.ts` are frontend
  APIs and must be documented in [docs/frontend-api.md](./docs/frontend-api.md),
  not in `docs/api.json`.

## API Documentation Rules

- Spring backend `/api/*` routes are documented by generated OpenAPI.
- Do not hand-edit endpoint lists for backend controllers in Markdown.
- When controller routes, DTOs, validation, response shapes, or auth rules
  change, regenerate `docs/api.json`.
- Add OpenAPI metadata for new or changed backend endpoints:
  `@Tag`, `@Operation(summary = "...")`, `@SecurityRequirement(name = "bearerAuth")`
  for protected operations, and explicit `@ApiResponse` for non-obvious status
  codes.
- Next.js `/frontend-api/*` routes are not covered by Spring OpenAPI; update
  [docs/frontend-api.md](./docs/frontend-api.md) when those route handlers change.

## Common Task Checklists

Adding a backend endpoint:

1. Add request/response DTOs.
2. Add controller method with OpenAPI metadata.
3. Add service logic and repository query if needed.
4. Update `SecurityConfig` or method security if access rules change.
5. Add or update backend tests.
6. Regenerate `docs/api.json`.
7. Update frontend types/API functions if the frontend consumes it.
8. Run `./scripts/check-docs.sh` and relevant tests.

Adding a frontend route handler:

1. Add or modify `frontend/src/app/frontend-api/**/route.ts`.
2. Document route, auth behavior, and operational notes in `docs/frontend-api.md`.
3. Update `docs/environment.md` if it reads a new environment variable.
4. Run `./scripts/check-docs.sh` and frontend validation.

Changing environment, deployment, or local startup behavior:

1. Change code/config first.
2. Update the single source document: `docs/environment.md`,
   `docs/deployment.md`, or `docs/local-development.md`.
3. Link from other docs instead of copying details.

## Verification

Backend:

```bash
cd backend
./gradlew test
```

Frontend:

```bash
cd frontend
npx tsc --noEmit
npm run lint
npm run build
```

Docs:

```bash
./scripts/check-docs.sh
```

Run the smallest useful verification while iterating, then run broader checks
before claiming completion.

## Security

- Never commit `.env` files, `.env.local`, credentials, JWT secrets, database
  passwords, R2 keys, Mailjet keys, Turnstile secrets, SSH passwords, or local
  admin credentials.
- Verify ownership/authorization before mutating user-owned resources.
- Banned users are checked during authentication in `JwtAuthenticationFilter`.
- Frontend token expiration checks are convenience only; backend authorization is
  authoritative.
- Production must not use destructive development profile behavior. See
  [Environment Variables](./docs/environment.md) and [Deployment Guide](./docs/deployment.md).
