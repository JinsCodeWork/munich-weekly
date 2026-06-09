# Munich Weekly Documentation Index

This page is the navigation entry point for project documentation. Keep it thin:
link to source documents instead of duplicating implementation details.

Document classes, ownership, and historical document policy are defined in
[Documentation Governance](./documentation-governance.md).

## Start Here

| Document | Class | Owner | Update when |
| --- | --- | --- | --- |
| [Project Overview](../README.md) | Source of truth | Project maintainer | Product scope, tech stack, or repository layout changes. |
| [Local Development](./local-development.md) | Operational guide | Backend/platform maintainer | Local startup commands, profiles, ports, or smoke checks change. |
| [Environment Variables](./environment.md) | Source of truth | Backend/platform maintainer | Code reads a new env var or changes a default. |
| [Contributing Guide](./contributing.md) | Operational guide | Project maintainer | Branch, validation, CI, or PR process changes. |
| [Documentation Governance](./documentation-governance.md) | Source of truth | Project maintainer | Document classes, owners, or maintenance rules change. |

## Deployment And Runtime

| Document | Class | Owner | Update when |
| --- | --- | --- | --- |
| [Deployment Guide](./deployment.md) | Operational guide | Backend/platform maintainer | Production ports, Nginx, PM2, Docker, profiles, or SSL flow changes. |
| [Backup and Restore Runbook](./operations/backup-restore.md) | Operational runbook | Platform maintainer | Database container names, backup storage, retention, or restore commands change. |
| [Storage System](./storage.md) | Reference | Backend/platform maintainer | Storage modes, upload limits, R2/local behavior, or file paths change. |
| [Image CDN System](./image-cdn.md) | Reference | Backend/platform maintainer | Cloudflare Worker image delivery or transformation behavior changes. |

## API, Data, And Security

| Document | Class | Owner | Update when |
| --- | --- | --- | --- |
| [API Reference](./api.md) | Source of truth | Backend maintainer | Backend API contract changes; regenerate [api.json](./api.json). |
| [Frontend API Route Handlers](./frontend-api.md) | Reference | Frontend maintainer | Next.js `/frontend-api/*` route handlers are added, removed, renamed, or change auth/response behavior. |
| [Database Design](./database.md) | Reference | Backend maintainer | JPA entities, schema adjustment code, or relationships change. |
| [Authentication & Security](./auth.md) | Reference | Security/platform maintainer | Auth flow, JWT behavior, roles, CORS, or protected routes change. |
| [Security Summary](./security-summary.md) | Reference snapshot | Security/platform maintainer | Security posture or risk status changes; link to live auth/deployment docs. |
| [Privacy Policy](./privacy.md) | Product/legal guide | Project maintainer | Data collection, retention, user rights, or public policy language changes. |

## Frontend

| Document | Class | Owner | Update when |
| --- | --- | --- | --- |
| [Frontend Overview](./frontend-overview.md) | Reference | Frontend maintainer | Frontend feature map, route structure, or major module boundaries change. |
| [Frontend Architecture](./frontend-architecture.md) | Reference | Frontend maintainer | App Router structure, state management, auth client behavior, or API layer changes. |
| [UI Component Library](./ui-components.md) | Reference | Frontend maintainer | Reusable components, component contracts, or shared UI behavior changes. |
| [Style System](./style-system.md) | Reference | Frontend maintainer | Tailwind tokens, typography, colors, or style conventions change. |
| [Masonry Layout System](./masonry-layout-system.md) | Reference | Frontend/backend maintainers | Stored dimensions, layout ordering, or image rendering behavior changes. |

## Product Guides

| Document | Class | Owner | Update when |
| --- | --- | --- | --- |
| [User Guide](./user-guide.md) | Product guide | Product maintainer | User-facing account, submission, voting, gallery, or privacy workflows change. |
| [Admin Guide](./admin-guide.md) | Product guide | Product/admin maintainer | Admin issue, submission, gallery, promotion, or moderation workflows change. |

## Decisions And Historical Records

Historical documents preserve context only. They are not current facts unless a
live source-of-truth document links back to them for a specific decision.

| Document | Class | Owner | Status |
| --- | --- | --- | --- |
| [Lessons Learned](./lessons-learned.md) | Historical | Project maintainer | Keep concise; extract current rules into live docs. |
| [Refactor Baseline](./refactor-baseline.md) | Historical/reference | Frontend maintainer | Guardrail record for frontend refactor contracts. |
| [Frontend Refactor Plan](./plans/2026-05-frontend-refactor-plan.md) | Historical | Project maintainer | Summary only; detailed execution belongs in commits/PRs. |
| [Security Remediation Plan](./plans/2026-06-08-security-remediation-plan.md) | Implementation plan | Security/platform maintainer | Execute and then retire into PRs/issues once the scan findings are resolved. |

## Maintenance

For document classes, owners, and update rules, see
[Documentation Governance](./documentation-governance.md).
