# API Reference

The API reference is generated from the Spring Boot backend. Do not hand-edit
endpoint lists in Markdown; update the backend code and regenerate the OpenAPI
schema.

## Source Of Truth

- Controllers: `backend/src/main/java/com/munichweekly/backend/controller/`
- DTOs: `backend/src/main/java/com/munichweekly/backend/dto/`
- Security rules: `backend/src/main/java/com/munichweekly/backend/security/SecurityConfig.java`
- OpenAPI metadata: `backend/src/main/java/com/munichweekly/backend/config/OpenApiConfig.java`

The committed machine-readable artifact is [api.json](./api.json).

## Runtime Endpoint

When the backend is running, springdoc exposes the JSON schema at:

```text
GET /v3/api-docs
```

The backend intentionally uses the springdoc WebMVC API starter, not the bundled
Swagger UI starter. Use `docs/api.json` with an external OpenAPI viewer when a
visual explorer is needed.

## Regenerate The Schema

Start the backend with a non-destructive profile first. For local development,
follow [Local Development](./local-development.md); do not use the `dev` profile
unless you intentionally want its database reset behavior.

Then run:

```bash
API_BASE_URL=http://localhost:8080 ./scripts/generate-openapi.sh
```

To write to a temporary file for comparison:

```bash
API_BASE_URL=http://localhost:8080 ./scripts/generate-openapi.sh /tmp/munich-weekly-api.json
```

The script fetches `/v3/api-docs`, verifies that the response is an OpenAPI 3
document with paths, and writes formatted JSON atomically.

## Maintenance Rules

1. Change controllers, DTOs, validation annotations, or security config first.
2. Regenerate `docs/api.json`.
3. Review the diff for changed paths, request bodies, response schemas, and auth
   implications.
4. Update human docs only for workflow or behavior explanations that are not
   obvious from the generated schema.

Frontend-only routes under `/frontend-api/*` are implemented by Next.js and are
not part of the Spring OpenAPI schema.
