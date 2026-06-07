# Munich Weekly Photography Platform

Munich Weekly is a web platform for weekly photography submissions, review,
gallery publishing, and voting for students in Munich.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Backend | Java 21, Spring Boot 3, Gradle |
| Database | PostgreSQL via Docker |
| Auth | JWT with Spring Security |
| Storage | Local development storage or Cloudflare R2 |

## Repository Layout

```text
backend/       Spring Boot API and services
frontend/      Next.js app and route handlers
image-worker/  Cloudflare image worker
db/            SQL init and backup utilities
docs/          Project documentation
scripts/       Repository maintenance scripts
```

## Documentation

Start with [docs/index.md](./docs/index.md). It is the documentation navigation
hub and points to the current source-of-truth documents.

Most common entry points:

- [Local Development](./docs/local-development.md)
- [Environment Variables](./docs/environment.md)
- [API Reference](./docs/api.md)
- [Frontend API Route Handlers](./docs/frontend-api.md)
- [Deployment Guide](./docs/deployment.md)
- [Contributing Guide](./docs/contributing.md)

## Development

Backend commands run from `backend/`; frontend commands run from `frontend/`.
See [Local Development](./docs/local-development.md) for the full startup flow.

```bash
cd backend
./gradlew test

cd ../frontend
npm run lint
```

For documentation or API changes, run the docs gate from the repository root:

```bash
./scripts/check-docs.sh
```

## License And Contact

This project is licensed under CC BY-NC-ND 4.0. See [LICENSE](./LICENSE).

Project lead: Dongkai Jin, dongkai.jin@tum.de
