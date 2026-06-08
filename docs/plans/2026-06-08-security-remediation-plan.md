# Security Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the 10 reportable findings from `/tmp/codex-security-scans/munich-weekly/83ceaae_20260607T140719Z/report.md` with minimal product behavior change and repeatable regression coverage.

**Architecture:** Apply narrow authorization and input-boundary checks at the existing controller/route-handler edges, then move shared logic into small local helpers or services only where it prevents duplicated security decisions. Preserve public read, upload, voting, and admin workflows unless the old behavior is the vulnerable behavior.

**Tech Stack:** Next.js 15 route handlers, TypeScript, Java 21, Spring Boot 3, Spring Security, Gradle, PostgreSQL/JPA, Cloudflare Worker, Vitest.

---

## Execution Rules

- Use subagents only with model `gpt-5.5` and reasoning `medium`.
- Keep each subagent write set disjoint.
- Do not touch `.env.local` or print secret values.
- Do not change public UX copy or page layout unless a test proves the current call path requires a small error-handling adjustment.
- Prefer focused tests before implementation. If a frontend route has no test harness, keep code extraction minimal and verify with `npx tsc --noEmit`, `npm run lint`, `npm run build`, and a local admin smoke test.
- Run `./scripts/check-docs.sh` after docs changes. Regenerate `docs/api.json` when backend DTOs, response statuses, auth rules, or endpoint metadata change.

## Subagent Map

1. `frontend-admin-worker` (`gpt-5.5`, `medium`): Tasks 1 and 2. Owns `frontend/src/app/frontend-api/**`, `frontend/src/hooks/useConfigAdmin.ts` only if needed, `image-worker/**`, and related docs.
2. `backend-auth-worker` (`gpt-5.5`, `medium`): Tasks 3, 5, and 6. Owns auth/JWT/provider/rate-limit backend files and related docs/tests.
3. `backend-content-worker` (`gpt-5.5`, `medium`): Tasks 4 and 7. Owns submission image read authorization, vote batch query hardening, tests, and related docs.
4. `backend-vote-integrity-worker` (`gpt-5.5`, `medium`): Task 8 only after Tasks 5 and 7 land. Owns anonymous vote identity and fraud-control changes.
5. `reviewer` (`gpt-5.5`, `medium`): Spec review after each task, then final code quality review over all changed files.

## Baseline

### Task 0: Branch And Baseline Checks

**Files:**
- Read only: repository status and existing test setup.

- [ ] Confirm the worktree is clean enough to distinguish these changes.

Run:

```bash
git status --short
```

Expected: no unrelated modified files, or unrelated files explicitly recorded and left untouched.

- [ ] Run the smallest baseline checks before edits.

Run:

```bash
cd backend
./gradlew test
```

Run:

```bash
cd frontend
npx tsc --noEmit
npm run lint
```

Run:

```bash
cd image-worker
npm test
```

Expected: record current pass/fail. If `image-worker` fails because `vitest.config.js` points to missing `wrangler.jsonc`, keep that as the first fix in Task 2.

---

## High Priority

### Task 1: Lock Down `/frontend-api/admin/sync-hero`

**Findings:** 1, 2

**Files:**
- Modify: `frontend/src/app/frontend-api/admin/sync-hero/route.ts`
- Modify: `frontend/src/app/frontend-api/admin/config/route.ts` only if extracting shared admin auth helpers
- Optional create: `frontend/src/app/frontend-api/admin/auth.ts`
- Optional create: `frontend/src/app/frontend-api/admin/hero-source.ts`
- Modify: `docs/frontend-api.md`
- Modify: `docs/environment.md` if adding `HERO_IMAGE_ALLOWED_ORIGINS`

**Security invariant:**
- Missing token returns `401`.
- Invalid or non-admin token returns `403`.
- Authorization is completed before reading request JSON, fetching a URL, or touching the filesystem.
- Remote hero sync only fetches explicitly allowed storage origins.
- Local fallback remains available for the existing backend upload flow.

- [x] Add a shared admin auth helper or copy the existing admin-config pattern into `sync-hero`.

Implementation shape:

```ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:8080';

export function getAuthToken(request: NextRequest): string | null {
  return request.cookies.get('jwt')?.value
    ?? request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
    ?? null;
}

export async function verifyAdminRole(token: string): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/api/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!response.ok) return false;
  const user = await response.json();
  return user.role === 'admin';
}
```

- [x] In `sync-hero`, reject before request-body parsing.

Expected behavior:
- No token: `401`.
- Bad token: `403`.
- Valid non-admin token: `403`.
- Valid admin token: proceeds to source validation.

- [x] Replace `heroImageUrl.startsWith('http')` with URL parsing and allowlist logic.

Policy:
- Allow no-body fallback to existing backend uploads path.
- Allow relative local hero upload paths only when the path is exactly `/uploads/hero.jpg`, `/uploads/hero.jpeg`, or `/uploads/hero.png`; read from the backend uploads directory without using network fetch.
- Allow remote URLs only when `new URL(imageUrl).origin` is in `HERO_IMAGE_ALLOWED_ORIGINS`.
- Reject usernames/passwords in URLs.
- Reject redirects by using `redirect: 'error'`.
- Cap downloaded bytes at `30 * 1024 * 1024`.
- Require `Content-Type` of `image/jpeg` or `image/png`.

- [x] Add a local helper for bounded response reading instead of `response.arrayBuffer()` on untrusted responses.

Implementation shape:

```ts
async function readResponseWithLimit(response: Response, maxBytes: number): Promise<Buffer> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Response body is empty');
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) throw new Error('Image exceeds maximum size');
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}
```

- [x] Update `docs/frontend-api.md`.

Expected doc change: `POST /frontend-api/admin/sync-hero` auth becomes "JWT plus backend admin check"; operational notes mention `HERO_IMAGE_ALLOWED_ORIGINS`.

- [x] Run verification.

Run:

```bash
cd frontend
npx tsc --noEmit
npm run lint
npm run build
```

Run:

```bash
./scripts/check-docs.sh
```

Manual smoke:
- Login as local admin.
- Upload a JPEG hero image from the admin UI.
- Confirm `/images/home/hero.jpg` updates.
- Try `curl` with `Authorization: Bearer nope` and confirm `403` with no file change.

### Task 2: Disable Production Worker Debug Routes

**Finding:** 10

**Files:**
- Modify: `image-worker/src/index.js`
- Modify: `image-worker/test/index.spec.js`
- Modify: `image-worker/vitest.config.js`
- Modify: `docs/image-cdn.md`
- Modify: `docs/environment.md` if adding Worker vars

**Security invariant:**
- `/health` remains public.
- `/uploads/**` remains public.
- `/debug-params`, `/debug-auth`, and `/debug-request` return `404` by default.
- If debug is deliberately enabled, it requires a strong secret header and returns no R2 key listings or reflected request headers by default.

- [x] Fix Worker test baseline.

Implementation shape:

```js
// image-worker/vitest.config.js
wrangler: { configPath: './wrangler.toml' }
```

- [x] Move debug handling behind a helper.

Implementation shape:

```js
function isDebugEnabled(env) {
  return env.DEBUG_ROUTES_ENABLED === 'true' && typeof env.DEBUG_AUTH_SECRET === 'string' && env.DEBUG_AUTH_SECRET.length >= 32;
}

function isDebugAuthorized(request, env) {
  return request.headers.get('x-debug-secret') === env.DEBUG_AUTH_SECRET;
}
```

- [x] Default debug paths to `404`.

Expected behavior:
- `GET /debug-auth` with default env: `404`.
- `GET /debug-request` with default env: `404`.
- `GET /debug-params` with default env: `404`.

- [x] Remove public R2 object listing and request header reflection.

If debug mode stays available, return bounded operational booleans only, for example "bucket binding present" and "test object accessible"; do not include object keys, stack traces, or all request headers.

- [x] Replace template Worker tests with targeted tests.

Test cases:
- `/health` returns `200`.
- `/debug-auth` returns `404` by default.
- `/debug-request` returns `404` by default.
- A valid `/uploads/...` path is still routed to the image handler.

- [x] Update docs.

Expected doc change: debug endpoints are disabled by default and require `DEBUG_ROUTES_ENABLED=true` plus `DEBUG_AUTH_SECRET` for local diagnostics only.

- [x] Run verification.

Run:

```bash
cd image-worker
npm test
```

Run:

```bash
./scripts/check-docs.sh
```

---

## Medium Priority, Low Product Impact

### Task 3: Require Explicit JWT Secret

**Finding:** 4

**Files:**
- Modify: `backend/src/main/resources/application.properties`
- Modify: `backend/src/main/java/com/munichweekly/backend/security/JwtUtil.java`
- Modify: backend tests that load Spring context and need `jwt.secret`
- Create or modify: `backend/src/test/java/com/munichweekly/backend/security/JwtUtilTest.java`
- Modify: `docs/environment.md`
- Modify: `docs/deployment.md` if startup requirements are listed there

**Security invariant:**
- The backend must not start with the committed fallback secret.
- `JWT_SECRET` must be present and at least 32 bytes for HS256.
- Test contexts supply their own deterministic test secret.

- [x] Remove the fallback from `application.properties`.

Expected property:

```properties
jwt.secret=${JWT_SECRET}
```

- [x] Validate the secret in `JwtUtil.init()`.

Implementation shape:

```java
if (secret == null || secret.isBlank()) {
    throw new IllegalStateException("JWT_SECRET must be configured");
}
if (sha256Hex(secret).equals(OLD_FALLBACK_SECRET_SHA256)) {
    throw new IllegalStateException("JWT_SECRET must not use the old fallback value");
}
if (secret.getBytes(StandardCharsets.UTF_8).length < 32) {
    throw new IllegalStateException("JWT_SECRET must be at least 32 bytes");
}
this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
```

- [x] Add focused tests.

Test cases:
- Blank secret fails initialization.
- Old fallback fails initialization.
- Short secret fails initialization.
- Valid test secret can sign and parse a token.

- [x] Update every `@SpringBootTest` or sliced test that needs context properties.

Use a non-production test value such as:

```properties
jwt.secret=test-jwt-secret-32-bytes-minimum-value
```

- [x] Run verification.

Run:

```bash
cd backend
./gradlew test
```

Run:

```bash
./scripts/check-docs.sh
```

### Task 4: Authorize Submission Image Debug Reads

**Findings:** 5, 6

**Files:**
- Modify: `backend/src/main/java/com/munichweekly/backend/controller/FileUploadController.java`
- Modify: `backend/src/main/java/com/munichweekly/backend/service/SubmissionUploadService.java`
- Modify: `backend/src/test/java/com/munichweekly/backend/controller/FileUploadControllerAnonymousTest.java` or create `FileUploadControllerImageReadTest.java`
- Regenerate: `docs/api.json` if response metadata/status docs are updated

**Security invariant:**
- Owner can inspect/read their own submission image.
- Admin can inspect/read any submission image.
- Non-owner regular user receives `403` before `imageUrl`, metadata, or bytes are read.
- Anonymous users remain blocked by existing `@PreAuthorize`.

- [x] Add a read helper next to existing upload helper.

Implementation shape:

```java
public boolean currentUserMayReadSubmissionImage(Submission submission) {
    User currentUser = CurrentUserUtil.getUser();
    if (currentUser == null) return false;
    return "admin".equals(currentUser.getRole())
            || submission.getUser().getId().equals(currentUser.getId());
}
```

- [x] Use the helper in `checkImage` immediately after `requireSubmission`.

Expected: non-owner returns `403` before `response.put("imageUrl", imageUrl)`.

- [x] Use the helper in `getImageDirectly` immediately after `requireSubmission`.

Expected: non-owner returns `403` before `r2StorageService.getObjectBytes(imageUrl)`.

- [x] Add tests.

Test cases:
- Owner `check-image` returns `200` and may call storage.
- Non-owner `check-image` returns `403` and does not call R2 metadata.
- Admin `check-image` returns `200`.
- Owner `direct-image` returns bytes.
- Non-owner `direct-image` returns `403` and does not call `getObjectBytes`.
- Admin `direct-image` returns bytes.

- [x] Run verification.

Run:

```bash
cd backend
./gradlew test --tests '*FileUploadController*'
./gradlew test
```

### Task 5: Add Auth And Password Reset Throttles

**Finding:** 9

**Files:**
- Modify: `backend/src/main/java/com/munichweekly/backend/controller/AuthController.java`
- Modify: `backend/src/main/java/com/munichweekly/backend/controller/PasswordResetController.java`
- Create: `backend/src/main/java/com/munichweekly/backend/service/AuthRateLimitService.java`
- Create: `backend/src/main/java/com/munichweekly/backend/config/AuthRateLimitProperties.java`
- Create tests under `backend/src/test/java/com/munichweekly/backend/service/` and/or `backend/src/test/java/com/munichweekly/backend/controller/`
- Modify: `docs/environment.md`
- Modify: OpenAPI annotations and regenerate `docs/api.json` if adding explicit `429` responses

**Security invariant:**
- Repeated login failures are throttled by IP and normalized email.
- Forgot-password email side effects are throttled by IP and normalized email.
- Forgot-password response remains non-enumerating for existing vs missing emails.
- Normal users are not blocked by overly aggressive defaults.

- [x] Add configurable defaults.

Suggested properties:

```properties
auth.rate-limit.login.max-attempts=${AUTH_RATE_LIMIT_LOGIN_MAX_ATTEMPTS:10}
auth.rate-limit.login.window-seconds=${AUTH_RATE_LIMIT_LOGIN_WINDOW_SECONDS:900}
auth.rate-limit.password-reset.max-attempts=${AUTH_RATE_LIMIT_PASSWORD_RESET_MAX_ATTEMPTS:3}
auth.rate-limit.password-reset.window-seconds=${AUTH_RATE_LIMIT_PASSWORD_RESET_WINDOW_SECONDS:3600}
auth.rate-limit.password-reset.cooldown-seconds=${AUTH_RATE_LIMIT_PASSWORD_RESET_COOLDOWN_SECONDS:300}
```

- [x] Implement in-memory fixed-window counters with cleanup.

Implementation notes:
- Use `ConcurrentHashMap`.
- Keys include action, remote IP, and normalized email where available.
- Return a typed decision with `allowed`, `retryAfterSeconds`, and a generic error message.
- Do not persist emails in logs beyond existing behavior.

- [x] Apply login throttle before `userService.loginWithEmail(dto)`.

Expected behavior:
- First 10 failed attempts within 15 minutes proceed to normal password validation.
- Attempt 11 returns `429`.
- Successful login clears the email-specific failure counter.

- [x] Apply forgot-password throttle before `userService.requestPasswordReset(dto)`.

Expected behavior:
- Over-limit responses still do not reveal whether the email exists.
- Under-limit missing-email responses remain `200` with existing generic message.

- [x] Add tests.

Test cases:
- Login under limit calls service.
- Login over limit returns `429`.
- Successful login clears failure state.
- Forgot-password under limit calls service.
- Forgot-password over limit returns `429`.
- Missing and existing email reset responses remain indistinguishable except throttling.

- [x] Run verification.

Run:

```bash
cd backend
./gradlew test --tests '*Auth*' --tests '*PasswordReset*'
./gradlew test
```

Run after backend starts for OpenAPI changes:

```bash
API_BASE_URL=http://localhost:8080 ./scripts/generate-openapi.sh
./scripts/check-docs.sh
```

### Task 6: Disable Unconfigured Third-Party Auth Writes

**Finding:** 3

**Files:**
- Modify: `backend/src/main/java/com/munichweekly/backend/controller/AuthController.java`
- Create tests under `backend/src/test/java/com/munichweekly/backend/controller/`
- Modify: `backend/src/test/java/com/munichweekly/backend/OpenApiSchemaIntegrationTest.java`
- Regenerate: `docs/api.json`

**Security invariant:**
- Third-party login and provider binding are not available until a verified provider flow is deliberately introduced.
- `POST /api/auth/login/provider` returns `501` and never calls `UserService.loginWithThirdParty`.
- `POST /api/auth/bind` returns `501` and never calls `UserService.bindThirdPartyAccount`.
- Client-supplied `providerUserId`, display name, or avatar cannot reach provider lookup/save code paths.
- Existing provider listing and unbinding remain available for viewing or cleaning any historical bindings.

- [x] Confirm there is no active frontend UI using provider login or provider bind.

Expected: only unused API wrapper exports remain; no page/component calls these functions.

- [x] Disable provider login.

Expected behavior:
- `POST /api/auth/login/provider` returns `501`.
- The controller does not call `userService.loginWithThirdParty`.

- [x] Disable provider bind.

Expected behavior:
- `POST /api/auth/bind` returns `501`.
- The controller does not call `CurrentUserUtil` or `userService.bindThirdPartyAccount`.

- [x] Preserve provider list and unbind endpoints.

Expected: `GET /api/auth/providers` and `DELETE /api/auth/bind/{provider}` retain their existing authenticated behavior for historical binding cleanup.

- [x] Add tests.

Test cases:
- Provider login rejects before trusting client-supplied provider identity.
- Provider bind rejects before trusting client-supplied provider identity.
- Disabled endpoints do not call the provider login/bind service methods.
- OpenAPI documents `501` for the disabled POST endpoints.

- [x] Run verification.

Run:

```bash
cd backend
./gradlew test --tests '*AuthProviderDisabledControllerTest' --tests '*OpenApi*'
./gradlew test
```

Run after backend starts:

```bash
API_BASE_URL=http://localhost:8080 ./scripts/generate-openapi.sh
./scripts/check-docs.sh
```

---

## Medium Priority, Performance And Integrity

### Task 7: Cap And Batch Vote Status Checks

**Finding:** 8

**Files:**
- Modify: `backend/src/main/java/com/munichweekly/backend/controller/VoteController.java`
- Modify: `backend/src/main/java/com/munichweekly/backend/service/VoteService.java`
- Modify: `backend/src/main/java/com/munichweekly/backend/repository/VoteRepository.java`
- Create: `backend/src/test/java/com/munichweekly/backend/service/VoteServiceTest.java`
- Optional create: `backend/src/test/java/com/munichweekly/backend/controller/VoteControllerTest.java`
- Modify: `docs/auth.md` or `docs/frontend-architecture.md` if documenting the batch cap
- Regenerate: `docs/api.json` if documenting `400` over-limit response

**Security invariant:**
- Public batch endpoint has a maximum request fanout.
- Duplicate IDs are de-duplicated before DB work.
- Missing IDs still return `false`.
- Vote page remains fast and does not need per-card fallback calls.

- [x] Add a conservative configurable cap.

Suggested default:

```properties
votes.batch-status.max-submission-ids=${VOTES_BATCH_STATUS_MAX_SUBMISSION_IDS:200}
```

- [x] Normalize IDs in `VoteController`.

Implementation shape:

```java
List<Long> normalizedIds = Arrays.stream(submissionIds.split(","))
        .map(String::trim)
        .filter(s -> !s.isEmpty())
        .map(Long::valueOf)
        .distinct()
        .limit(max + 1)
        .toList();
if (normalizedIds.size() > max) {
    return ResponseEntity.badRequest().body("Too many submission IDs");
}
```

- [x] Replace per-ID repository work with batched vote lookup.

Repository methods:

```java
List<Vote> findByUserIdAndSubmissionIdIn(Long userId, List<Long> submissionIds);
List<Vote> findByVisitorIdAndSubmissionIdIn(String visitorId, List<Long> submissionIds);
```

Service behavior:
- Initialize all normalized IDs to `false`.
- Mark IDs with matching vote rows as `true`.
- Set `totalChecked` to normalized ID count.

- [x] Add tests.

Test cases:
- Over-limit request returns `400` before service DB work.
- Duplicate-heavy input performs one normalized lookup.
- Missing IDs are present as `false`.
- Authenticated lookup uses `userId`.
- Anonymous lookup uses visitor identity.

- [x] Run verification.

Run:

```bash
cd backend
./gradlew test --tests '*Vote*'
./gradlew test
```

### Task 8: Replace Mutable Anonymous Vote Identity With Backend-Managed Identity

**Finding:** 7

**Files:**
- Modify: `backend/src/main/java/com/munichweekly/backend/controller/VoteController.java`
- Modify: `backend/src/main/java/com/munichweekly/backend/service/VoteService.java`
- Create: `backend/src/main/java/com/munichweekly/backend/service/AnonymousVoteIdentityService.java`
- Modify: `backend/src/main/java/com/munichweekly/backend/repository/VoteRepository.java` if adding IP/session fraud checks
- Modify: `frontend/src/lib/visitorId.ts`
- Modify: `frontend/src/api/votes/index.ts`
- Modify: `frontend/src/context/VoteStatusContext.tsx` only if response/cookie bootstrapping requires it
- Modify: `docs/auth.md`
- Modify: `docs/database.md`
- Modify: `docs/privacy.md`
- Modify: `docs/security-summary.md`
- Modify: `docs/environment.md`

**Security invariant:**
- The backend no longer treats a JavaScript-writable `visitorId` cookie as authoritative for anonymous vote identity.
- Anonymous voting still works without login.
- Existing visitors are migrated without losing vote-status display where feasible.
- Clearing/changing the old `visitorId` cookie alone does not create a new authoritative identity.

- [x] Add a signed, HttpOnly anonymous vote cookie.

Suggested cookie:
- Name: `mw_vote_anon`
- Attributes: `HttpOnly`, `Secure` in production, `SameSite=Lax`, `Path=/`
- Value: signed token containing random identity, issued-at, and version.
- Secret: `ANONYMOUS_VOTE_SECRET`; fail startup or anonymous voting if absent in production.

- [x] Add compatibility migration for old `visitorId`.

Low-break rollout:
- If `mw_vote_anon` exists and verifies, use it.
- If missing and legacy `visitorId` is present, issue `mw_vote_anon` with the legacy visitor ID as the initial subject only for migration.
- After a documented sunset date, remove legacy migration.
- Never accept a changed legacy `visitorId` when a valid signed cookie already exists.

- [x] Pair identity signing with abuse throttling.

Reason: signed tokens stop client-side mutation, but do not by themselves stop clearing all cookies to receive a new identity.

Initial low-break control:
- Limit anonymous vote-token issuance per IP over a short window.
- Limit repeated votes for the same submission from the same IP over a short window.
- Keep thresholds configurable and generous enough for shared networks.

- [x] Update frontend.

Expected change:
- Stop relying on `js-cookie` generated `visitorId` as the authoritative identity.
- Keep a non-authoritative client identifier only if needed for UI cache keys.
- Ensure `fetchAPI` includes credentials for vote check, batch check, vote, and cancel.

- [x] Add tests.

Test cases:
- Valid signed cookie can vote and then cannot vote again for the same submission.
- Changing legacy `visitorId` while signed cookie remains valid does not create a new identity.
- Missing signed cookie receives one.
- Existing legacy `visitorId` is migrated once.
- Clearing all cookies is rate-limited by IP/session controls.
- Logged-in voting remains keyed by user ID and unaffected.
- Vote cancellation still works for anonymous users.

- [x] Run verification.

Run:

```bash
cd backend
./gradlew test --tests '*Vote*'
./gradlew test
```

Run:

```bash
cd frontend
npx tsc --noEmit
npm run lint
npm run build
```

Run:

```bash
./scripts/check-docs.sh
```

---

## Final Verification

- [x] Run backend checks.

```bash
cd backend
./gradlew test
./gradlew check
```

- [x] Run frontend checks.

```bash
cd frontend
npx tsc --noEmit
npm run lint
npm run build
```

- [x] Run Worker checks.

```bash
cd image-worker
npm test
```

- [x] Regenerate backend OpenAPI if backend contracts changed.

```bash
API_BASE_URL=http://localhost:8080 ./scripts/generate-openapi.sh
```

  Verified on 2026-06-08 by running `./scripts/generate-openapi.sh` against the
  local backend on `localhost:8080`; it wrote `docs/api.json` with 70 paths and
  OpenAPI 3.1.0.

- [x] Run docs check.

```bash
./scripts/check-docs.sh
```

- [x] Run manual smoke on local or staging.

  Verified on 2026-06-08 with local PostgreSQL, host-run backend, `next start`,
  and local Wrangler dev. Admin login succeeded; homepage and vote page returned
  200; bad bearer token on `/frontend-api/admin/sync-hero` returned 403; admin
  hero upload and sync returned 200; Worker `/health` returned 200 while
  `/debug-auth` and `/debug-params` returned 404; admin submission image check
  returned 200 and non-owner check returned 403; forgot-password and login
  throttles returned 429 after the configured local thresholds; anonymous vote,
  repeat rejection, batch status, anonymous cancel, logged-in vote, and
  logged-in cancel all completed with expected statuses. Smoke-created issues,
  submissions, upload files, and temporary user were cleaned up.

Smoke list:
- Admin can upload and sync homepage hero.
- Bad bearer token cannot mutate hero.
- Worker `/health` works and `/debug-*` is closed.
- Backend refuses startup without `JWT_SECRET`.
- Owner and admin can read/check submission images; non-owner cannot.
- Login and forgot-password work under threshold and throttle over threshold.
- Vote page loads batch statuses.
- Anonymous vote, repeat vote rejection, and cancel still work.
- Logged-in vote still works.

## Residual Risk To Track

- In-memory rate limits do not share state across multiple backend instances. Move to Redis or edge rate limiting if the deployment scales horizontally.
- Full anonymous voting abuse prevention cannot be perfect without stronger identity requirements such as login, CAPTCHA, or contest-specific moderation. The plan preserves current anonymous voting UX and reduces easy cookie mutation abuse.
- Provider verification needs actual production provider metadata and client IDs before rollout. Do not deploy a partially configured verifier that silently trusts request fields.
