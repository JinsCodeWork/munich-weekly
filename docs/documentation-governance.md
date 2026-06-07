# Documentation Governance

This document defines how Munich Weekly documentation is classified and
maintained. Code and runtime configuration remain the source of truth.

## Document Classes

| Class | Purpose | Update trigger |
| --- | --- | --- |
| Source of truth | Current project facts that other docs should link to. | Any matching code, config, deployment, or API change. |
| Operational guide | Step-by-step workflows for local development, deployment, contribution, or release work. | Any command, profile, environment, port, or process change. |
| Reference | Current architecture, data model, UI, storage, or security details. | Any implementation or contract change in that area. |
| Product guide | User-facing or admin-facing task documentation. | Any visible workflow, role, permission, or UI behavior change. |
| Historical | Past decisions, plans, or lessons. These are not current facts. | Update only to summarize or archive; do not expand as a live source. |

## Ownership

| Area | Primary docs | Owner |
| --- | --- | --- |
| Runtime setup | `local-development.md`, `environment.md`, `deployment.md` | Backend/platform maintainer |
| API contract | `api.md`, `api.json`, backend controllers/DTOs | Backend maintainer |
| Data model | `database.md`, JPA entities, schema adjustment code | Backend maintainer |
| Security and privacy | `auth.md`, `security-summary.md`, `privacy.md` | Security/platform maintainer |
| Frontend architecture | `frontend-overview.md`, `frontend-architecture.md`, `ui-components.md`, `style-system.md` | Frontend maintainer |
| Product workflows | `user-guide.md`, `admin-guide.md` | Product/admin maintainer |
| Historical records | `lessons-learned.md`, `plans/*` | Project maintainer |

## Maintenance Rules

1. Change code or configuration first, then update docs.
2. Prefer one canonical document for each fact; other docs should link to it.
3. Keep `docs/index.md` as navigation plus status metadata, not a duplicate
   knowledge base.
4. Regenerate `docs/api.json` whenever backend controller routes, request
   bodies, response schemas, or auth implications change.
5. Run `./scripts/check-docs.sh` before committing documentation or API changes.
6. Historical documents should be compressed into concise summaries when their
   detailed contents no longer guide current work.

## Historical Document Policy

Historical documents are useful for context, but they must not compete with live
docs. A historical file should answer:

- What was decided or attempted?
- Which current document supersedes it?
- What residual lesson is still useful?

If a historical file only contains step-by-step work that has already shipped,
replace it with a short summary and links to the current source-of-truth docs.
