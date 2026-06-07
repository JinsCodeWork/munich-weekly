# Refactor Baseline and Non-Breaking Contracts

> Class: Historical/reference
> Owner: Frontend maintainer
> Update when: frontend refactor guardrails or preserved contracts change.

This document defines the baseline we verified before and during the Graphify-driven refactor.
It is intended to prevent accidental behavior regressions while reducing coupling.

## Verified Graphify Inferred Edges

From `graphify-out/GRAPH_REPORT.md`:

- `frontend/src/api/gallery/galleryApi.ts -> frontend/src/api/http.ts:getAuthHeader()`
  - Verified in code: gallery admin APIs previously imported and called `getAuthHeader()` repeatedly.
  - Refactor action: moved to unified `fetchAPI` auth handling in `frontend/src/api/http.ts`.
- `resetAnonymousCaptcha()` bridge in `frontend/src/app/submit/page.tsx`
  - Verified in code: function is used inside submit error path to reset Turnstile token/widget.
  - Refactor note: left behavior unchanged; captcha reset remains coupled to anonymous submit failure.

## Non-Breaking API Contracts

These contracts must remain stable during refactor:

### Auth and Identity

- `Authorization: Bearer <jwt>` remains the primary auth mechanism for frontend API requests.
- Requests that depend on anonymous flows still send cookies (`credentials: include`).
- `/api/users/me` response keeps user-facing fields:
  - `id`, `email`, `nickname`, `role`, `avatarUrl`

### Voting

- `/api/votes` returns vote payload with:
  - `vote`
  - `voteCount`
- `/api/votes/check` returns:
  - `voted`
- `/api/votes/check-batch` returns:
  - `statuses`
  - `totalChecked`
- `/api/votes` (DELETE) returns:
  - `success`
  - `voteCount`

### Issues

- `/api/issues` and `/api/issues/{id}` keep issue fields expected by frontend:
  - `id`, `title`, `description`, `submissionStart`, `submissionEnd`, `votingStart`, `votingEnd`, `createdAt`

### Gallery APIs

- Public gallery endpoints remain unauthenticated.
- Admin gallery endpoints remain authenticated and preserve current response shapes used by account/admin pages.

## Critical User Flows (Regression Checklist)

Run this checklist after each significant refactor step:

1. Login and logout flow works; protected pages remain protected.
2. Vote flow works for both authenticated and anonymous users.
3. Gallery pages load issues/submissions and admin gallery config actions work.
4. Promotion/public campaign page still renders with expected config and fallback behavior.
5. Submission upload works for:
  - authenticated upload
  - anonymous upload token flow

## Refactor Guardrails

- Avoid direct `Repository` access in controllers when equivalent service method exists.
- Avoid returning JPA entities directly from controller response models.
- Keep frontend API calls on a single HTTP stack (`fetchAPI`) unless an endpoint has explicit exceptions.
- Prefer shared UI state components over duplicated feature-specific versions.

## Refactor Progress (May 2026)

Completed in this refactor batch:

- Frontend HTTP stack unified: `galleryApi` now uses `fetchAPI` instead of ad-hoc `fetch` patterns.
- Shared UI consolidation: duplicate `LoadingErrorStates` and `IssueSelector` implementations were merged via shared components.
- Backend controller slimming: vote/upload flows were moved further into services to reduce controller-repository coupling.
- API contract hardening: issue/user endpoints now return DTOs instead of exposing JPA entities directly.
- Migration domain split: migration-specific submission operations were isolated into dedicated services.
- Logging cleanup: `System.out` / `printStackTrace` style logging was replaced with structured logger usage in key paths.

Verification status:

- Frontend: type-check and lint pass in current environment.
- Backend: compile and targeted tests pass.
- Full backend suite is environment-dependent (`contextLoads` requires reachable PostgreSQL host).
- Real user login flow was validated through UI flow and admin-route access checks.

## Frontend Low-Risk Refactor Baseline (May 2026)

This checklist is the required guardrail for the adapter-first frontend refactor.

### Build-Time Checks

Run inside `frontend/` after each phase:

1. `npm run lint`
2. `npm run build`

### Critical Manual Flows

1. **Auth modal**
   - Open login modal, submit invalid credentials, verify error text.
   - Submit valid credentials, verify success state and modal auto-close.
2. **Register modal**
   - Mismatched passwords and duplicate email show expected errors.
   - Successful register logs in and closes modal.
3. **Manage submissions**
   - Load issue list, change issue, list refreshes correctly.
   - Retry button still reloads.
   - Download selected photos still triggers ZIP download.
4. **Gallery**
   - Public gallery issue list and detail pages load.
   - Admin gallery config actions still work through existing API exports.
5. **Submit / Vote**
   - Submission and voting pages still load without auth regressions.

### Non-Breaking Frontend Contracts

- Existing import path `@/api/gallery/galleryApi` remains valid for all callers.
- Existing default export `galleryApi` remains available.
- Existing admin wrappers under `components/admin/submissions` remain valid import paths.
