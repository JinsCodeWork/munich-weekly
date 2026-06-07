# Contributing

> Class: Operational guide
> Owner: Project maintainer
> Update when: branch, validation, CI, or PR process changes.

This guide covers contribution workflow only. For project facts, start at the
[Documentation Index](./index.md).

## Before You Start

- Run the app using [Local Development](./local-development.md).
- Check runtime variables in [Environment Variables](./environment.md).
- Read the relevant architecture or API document before changing a subsystem.
- Keep code and runtime configuration as the source of truth; update docs after
  code changes, not the other way around.

## Workflow

Use GitHub Flow:

1. Start from the current main branch.
2. Create a focused branch.
3. Make small commits with clear messages.
4. Run relevant checks.
5. Open a pull request using [.github/pull_request_template.md](../.github/pull_request_template.md).
6. Address review feedback.

Branch names:

| Type | Format | Example |
| --- | --- | --- |
| Feature | `feat/<topic>` | `feat/gallery-carousel` |
| Bug fix | `fix/<topic>` | `fix/mobile-overflow` |
| Refactor | `refactor/<topic>` | `refactor/auth-context` |
| Documentation | `docs/<topic>` | `docs/api-workflow` |
| Test | `test/<topic>` | `test/submission-upload` |

Commit messages follow Conventional Commits:

```text
type(scope): short description
```

Examples:

```text
feat(gallery): add carousel navigation
fix(auth): handle expired token redirect
docs(api): document OpenAPI regeneration
```

## Pull Requests

The pull request template is the single source for PR checklist content. Do not
copy it into this document. Keep PRs focused enough that reviewers can reason
about behavior, tests, and docs together.

Reviewers check:

- Behavior matches the request.
- Tests or verification cover the change.
- Security and authorization rules are preserved.
- Docs are updated when public behavior, APIs, environment variables, or
  operations change.
- The implementation follows local code patterns.

## Validation

Run the smallest useful checks while iterating, then broader checks before
submitting.

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

Docs and API:

```bash
./scripts/check-docs.sh
API_BASE_URL=http://localhost:8080 ./scripts/generate-openapi.sh
```

For backend API changes, regenerate [api.json](./api.json) and run the OpenAPI
drift test or the backend test suite.

## Documentation Rules

- Backend `/api/*` routes are generated from Spring controllers. See
  [API Reference](./api.md).
- Next.js `/frontend-api/*` route handlers are tracked in
  [Frontend API Route Handlers](./frontend-api.md).
- Environment variable names and defaults belong in
  [Environment Variables](./environment.md).
- Deployment commands and server operations belong in
  [Deployment Guide](./deployment.md).
- Do not copy long facts between documents; link to the source document instead.

## Common Change Map

| Change | Start with |
| --- | --- |
| Backend endpoint | [API Reference](./api.md) |
| Frontend route handler | [Frontend API Route Handlers](./frontend-api.md) |
| Local startup behavior | [Local Development](./local-development.md) |
| Environment variable | [Environment Variables](./environment.md) |
| Database schema/entity | [Database Design](./database.md) |
| Storage behavior | [Storage System](./storage.md) |
| Frontend architecture | [Frontend Architecture](./frontend-architecture.md) |
| UI component contract | [UI Component Library](./ui-components.md) |

## Security

- Never commit secrets or `.env` files.
- Do not paste local agent secrets from `.env.local` into commands, docs, issues,
  commits, or PRs.
- Confirm authorization and ownership rules when changing protected resources.
- Report urgent security concerns to the project maintainer directly.
