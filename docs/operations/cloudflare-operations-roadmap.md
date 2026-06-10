# Cloudflare Operations Roadmap

> Class: Future operations plan
> Owner: Platform maintainer
> Update when: Cloudflare products, pricing assumptions, DNS/proxy topology,
> image delivery, or edge security plans change.

This document records the current Cloudflare operations assessment for Munich
Weekly. It is a future improvement plan, not a statement that every item below
has already been deployed.

## Current Cloudflare Usage

Munich Weekly already uses Cloudflare in production-facing paths:

- DNS and CDN proxying for `munichweekly.art`.
- Cloudflare R2 for production uploaded image storage.
- `image-worker` for R2-backed image delivery and transformations through
  `img.munichweekly.art`.
- Cloudflare Turnstile for anonymous submission abuse protection.
- Cloudflare edge IP allowlisting at Nginx through
  `ops/scripts/update-cloudflare-origin-allowlist.sh`.
- R2 object backup and restore validation in the operations backup scripts.

The near-term goal is to make these existing Cloudflare dependencies more
predictable, safer, and easier to operate before adding larger architecture
changes.

## Operating Goals

1. Reduce direct origin exposure and manual firewall maintenance.
2. Improve image delivery performance without increasing operational risk.
3. Use free or already-included Cloudflare controls before adding paid services.
4. Keep API, upload, authentication, and admin traffic conservative by default.
5. Move Cloudflare dashboard state toward documented, reviewable automation.

## Recommended Future Work

### 1. Constrain Image Transformation Variants

Priority: High

The frontend currently centralizes image URL construction in
`frontend/src/lib/utils.ts`, and the Worker serves transformed images from R2.
Cloudflare Images Free includes a limited number of unique transformations per
month; after that, new transformations can fail even though cached existing
transformations continue to serve.

Future implementation:

- Define a small fixed set of image variants, such as thumbnail, card, hero, and
  full-view.
- Make frontend components choose from those variants instead of each component
  inventing width, quality, and fit combinations.
- Document the variant matrix in `docs/image-cdn.md`.
- Add tests around `createImageUrl()` so new UI work does not accidentally create
  unbounded transformation combinations.

Expected impact:

- Lower chance of exhausting free transformation quota.
- Better Cloudflare cache hit ratio.
- Easier visual QA because image sizes become predictable.

### 2. Add Cloudflare Cache Rules For Safe Paths

Priority: High

Cloudflare Free supports Cache Rules. The site should use edge caching
aggressively for immutable/static paths and image delivery, while explicitly
avoiding authenticated or mutable API paths.

Candidate cache targets:

- `img.munichweekly.art/uploads/*`
- `munichweekly.art/_next/static/*`
- static public assets such as logo, favicon, and long-lived images

Do not cache:

- `/api/*`
- `/frontend-api/*`
- login, admin, account, submission, upload, and voting flows
- any response with user-specific authorization or cookies

Future implementation:

- Start with dashboard rules and record exact match expressions in this document
  or a dedicated Cloudflare configuration document.
- Later convert rules to Terraform or Cloudflare API-managed configuration.
- Add smoke checks that verify public images return expected cache headers and
  API responses remain `no-store` or otherwise uncached.

Expected impact:

- Faster public page and image loads.
- Less traffic to the origin and image Worker.
- Lower R2 read pressure.

### 3. Enable Free WAF And Rate Limiting Guardrails

Priority: High

Cloudflare Free includes a small number of WAF custom rules, one rate limiting
rule, and the Free Managed Ruleset. These should be used as a first edge
defense layer, not as a replacement for backend authorization.

Candidate configuration:

- Enable the Free Managed Ruleset.
- Use the single free rate limiting rule on the highest-risk public write path,
  likely anonymous submissions or authentication.
- Add custom rules to block common malicious probes such as `/.env`, `/.git`,
  `/wp-admin`, `/phpmyadmin`, and obvious non-application attack paths.
- Consider a stricter challenge or allow policy for admin routes, but validate
  carefully to avoid locking out legitimate administration.

Guardrails:

- Do not rely on Cloudflare for authorization decisions.
- Test Turnstile and anonymous submission flows after WAF changes.
- Keep a rollback note for each rule so an accidental false positive can be
  reversed quickly during an incident.

Expected impact:

- Fewer commodity scans reach the origin.
- Basic rate protection around the most sensitive public endpoints.
- Better incident evidence through Cloudflare security events.

### 4. Evaluate Cloudflare Tunnel As An Origin-Hiding Replacement

Priority: Medium

The current plan maintains a Cloudflare IP allowlist in Nginx. That is a valid
control, but it still requires inbound ports and periodic range updates.
Cloudflare Tunnel may simplify this by letting the origin connect outbound to
Cloudflare with `cloudflared`, reducing the need for public inbound web access.

Future proof-of-concept:

- Create a staging tunnel for HTTP traffic to local Nginx or the frontend/backend
  origin.
- Confirm public site, API, file uploads, large request bodies, and WebSocket or
  streaming behavior if any are unaffected.
- Confirm operational recovery paths if `cloudflared` fails.
- Decide whether to keep Nginx Cloudflare IP allowlisting as fallback or replace
  it after confidence is built.

Expected impact:

- Stronger origin hiding.
- Less dependence on Cloudflare IP range allowlist maintenance.
- Potentially simpler firewall rules.

Risks:

- Adds `cloudflared` as a critical production process.
- Misconfiguration can take the site offline.
- Requires explicit monitoring and rollback steps before production migration.

### 5. Add Cloudflare Observability To Weekly Operations

Priority: Medium

Cloudflare Web Analytics is available on all plans and can provide privacy-aware
traffic and performance visibility. Workers Logs are also included with limited
retention on the Free plan.

Future implementation:

- Enable Web Analytics for public site performance trend review.
- Review Image Worker errors, 404 rates, transformation failures, and R2 access
  anomalies during weekly maintenance.
- Add Cloudflare dashboard checks to `docs/operations/runbook.md` once the exact
  metrics and dashboards are chosen.
- Consider alerting on obvious failure signals, such as sustained Worker 5xx or
  sudden R2 read spikes.

Expected impact:

- Faster diagnosis when users report image or page load issues.
- Better evidence during incidents without adding a self-hosted monitoring
  stack immediately.

### 6. Move Cloudflare Configuration Toward IaC

Priority: Medium

Cloudflare dashboard configuration is useful for initial setup, but long-term
operations should prefer reviewable configuration.

Future implementation sequence:

1. Export or manually record current DNS, Worker routes, R2 bucket names,
   Turnstile widgets, cache rules, and WAF rules.
2. Decide whether Terraform or direct Cloudflare API scripts fit this project
   better.
3. Start with low-risk resources such as cache and WAF rules.
4. Keep secrets out of Git; store tokens in the server or CI secret store.

Expected impact:

- Less configuration drift.
- Easier recovery after account or dashboard mistakes.
- Better peer review before edge-security changes.

## Items Not Recommended For Now

- Migrating the full Next.js frontend to Cloudflare Pages before the current
  server, PM2, backup, and deploy workflow is stable.
- Replacing PostgreSQL with D1. The backend is Spring Boot with PostgreSQL, and
  this would be a product architecture migration, not an operations shortcut.
- Moving production image storage from R2 to Cloudflare Images storage. R2 plus
  Worker transformations already fits the current app; first optimize variants
  and caching.
- Adding paid Cloudflare products before free guardrails are configured and
  measured.

## Suggested Task Order

1. Finish the existing operations automation plan.
2. Add image transformation variant limits and tests.
3. Add safe Cache Rules and document them.
4. Enable Free Managed Ruleset, one rate limit, and minimal custom WAF rules.
5. Add Web Analytics and Worker/R2 review steps to weekly operations.
6. Run a Cloudflare Tunnel staging proof-of-concept.
7. Decide whether to codify Cloudflare configuration with Terraform or API
   scripts.

## Source Notes

These conclusions were checked against Cloudflare documentation on 2026-06-10:

- Cloudflare R2 pricing and free tier:
  <https://developers.cloudflare.com/r2/pricing/>
- Cloudflare Images pricing and free transformation behavior:
  <https://developers.cloudflare.com/images/pricing/>
- Cloudflare Workers pricing, logs, KV, queues, and related free limits:
  <https://developers.cloudflare.com/workers/platform/pricing/>
- Cloudflare Cache Rules:
  <https://developers.cloudflare.com/cache/how-to/cache-rules/>
- Cloudflare WAF custom rules:
  <https://developers.cloudflare.com/waf/custom-rules/>
- Cloudflare WAF rate limiting rules:
  <https://developers.cloudflare.com/waf/rate-limiting-rules/>
- Cloudflare WAF managed rules:
  <https://developers.cloudflare.com/waf/managed-rules/>
- Cloudflare Tunnel:
  <https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/>
- Cloudflare Web Analytics:
  <https://developers.cloudflare.com/web-analytics/>
- Cloudflare Turnstile plans:
  <https://developers.cloudflare.com/turnstile/plans/>
