# Munich Weekly Documentation Index

This page is the navigation entry point for project documentation. Keep it thin:
link to source documents instead of duplicating implementation details.

## Start Here

- [Project Overview](../README.md) - Product summary and repository layout.
- [Local Development](./local-development.md) - Run the project on a developer machine.
- [Environment Variables](./environment.md) - Backend and frontend environment variables as used by the current code.
- [Contributing Guide](./contributing.md) - GitHub Flow, validation commands, and contribution expectations.
- [Deployment Guide](./deployment.md) - Production deployment on Hetzner with Docker, PM2, Nginx, and SSL.

## Security And Privacy

- [Authentication & Security](./auth.md) - Current authentication implementation and security details.
- [Security Summary](./security-summary.md) - Security posture, known risks, and improvement priorities.
- [Privacy Policy](./privacy.md) - User-facing privacy and GDPR information.

## Architecture And Reference

- [API Reference](./api.md) - OpenAPI schema entry point and regeneration workflow.
- [Database Design](./database.md) - Current schema model and relationships.
- [Storage System](./storage.md) - Storage abstraction and local/R2 behavior.
- [Image CDN System](./image-cdn.md) - Cloudflare Worker image delivery and transformation.

## Frontend

- [Frontend Overview](./frontend-overview.md) - High-level frontend architecture and feature map.
- [Frontend Architecture](./frontend-architecture.md) - Detailed frontend implementation notes.
- [UI Component Library](./ui-components.md) - Reusable component documentation.
- [Style System](./style-system.md) - Tailwind/design-token style system.
- [Masonry Layout System](./masonry-layout-system.md) - Stored image dimensions and masonry layout behavior.

## Product Guides

- [User Guide](./user-guide.md) - End-user instructions.
- [Admin Guide](./admin-guide.md) - Platform administration tasks. This should be split by task area in a future docs pass.

## Decisions, Lessons, And Plans

- [Lessons Learned](./lessons-learned.md) - Operational and implementation lessons.
- [Refactor Baseline](./refactor-baseline.md) - Non-breaking contracts and refactor guardrails.
- [Frontend Refactor Plan](./plans/2026-05-frontend-refactor-plan.md) - Historical frontend refactor work plan.

## Maintenance Rules

When updating docs:

1. Treat code and runtime configuration as the source of truth.
2. Prefer linking to a source document over copying detailed behavior into this index.
3. Update [Environment Variables](./environment.md) when code reads a new env var or changes a default.
4. Update [Local Development](./local-development.md) when startup commands or profiles change.
5. Update [Deployment Guide](./deployment.md) when production ports, Nginx, PM2, Docker, or profile behavior changes.
6. Regenerate [api.json](./api.json) when controller routes, request shapes, auth requirements, or response shapes change.
