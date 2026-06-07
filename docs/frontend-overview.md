# Frontend Overview

> Class: Reference
> Owner: Frontend maintainer
> Update when: frontend feature map, route structure, or major module boundaries change.

This page is the frontend entry point. Keep detailed implementation notes in the
linked documents instead of duplicating them here.

## Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- React Context and custom hooks
- JWT-based client authentication
- Backend integration through `/api/*` rewrite and typed API modules
- Next.js route handlers under `/frontend-api/*`

## Source Documents

| Topic | Document |
| --- | --- |
| Detailed frontend architecture | [Frontend Architecture](./frontend-architecture.md) |
| Next.js `/frontend-api/*` route handlers | [Frontend API Route Handlers](./frontend-api.md) |
| Reusable components | [UI Component Library](./ui-components.md) |
| Tailwind/style helpers | [Style System](./style-system.md) |
| Masonry layout and stored dimensions | [Masonry Layout System](./masonry-layout-system.md) |
| Backend API contract | [API Reference](./api.md) |
| Auth and protected routes | [Authentication & Security](./auth.md) |

## Project Shape

```text
frontend/
├── public/          Static assets and homepage config files
├── src/api/         Typed backend API modules
├── src/app/         Next.js App Router pages and route handlers
├── src/components/  Reusable and feature components
├── src/context/     React context providers
├── src/hooks/       Data, auth, image, and UI hooks
├── src/lib/         Shared frontend utilities and defaults
├── src/styles/      Style tokens and component style helpers
└── src/types/       Shared TypeScript types
```

## Main User Areas

| Area | Routes / Modules | Notes |
| --- | --- | --- |
| Home | `src/app/page.tsx`, `src/components/home/` | Hero image, introduction content, and featured gallery entry points. |
| Auth | login/register/reset pages, `AuthContext` | Login, registration, password reset, session handling. |
| Submit | `src/app/submit/`, submission components | Photo submission and anonymous upload flows. |
| Vote | `src/app/vote/`, vote API/hooks | Public voting and vote status caching. |
| Gallery | `src/app/gallery/`, `src/components/gallery/` | Published gallery issues, featured carousel, image viewing. |
| Account | `src/app/account/` | User settings, own submissions, and protected user workflows. |
| Admin | account admin pages and feature admin components | Issue, submission, gallery, promotion, migration, and home settings tools. |
| Frontend API | `src/app/frontend-api/` | Next.js route handlers documented in [Frontend API Route Handlers](./frontend-api.md). |

## Maintenance Rules

- Update this page only when the high-level frontend map changes.
- Put route-handler inventory in [Frontend API Route Handlers](./frontend-api.md).
- Put component contracts in [UI Component Library](./ui-components.md).
- Put style token/helper details in [Style System](./style-system.md).
- Put masonry behavior and stored-dimension details in
  [Masonry Layout System](./masonry-layout-system.md).
