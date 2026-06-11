# Dependency Maintenance

> Class: Operational runbook
> Owner: Platform maintainer
> Update when: Dependabot grouping, CI gates, package managers, or security policy changes.

Use this when GitHub or Dependabot opens dependency PRs or sends vulnerability
emails.

## Current Policy

Dependabot is intentionally low-noise:

- Security updates still create PRs and are grouped per ecosystem.
- Routine version updates create PRs only for SemVer major updates.
- Version update checks run monthly, not daily.
- Minor and patch updates are handled during planned maintenance unless they are
  part of a security fix.

This keeps urgent vulnerability fixes visible without turning dependency
maintenance into daily manual work.

## Priority

Handle in this order:

1. Critical/high runtime vulnerability in production code.
2. Critical/high build or deployment tooling vulnerability.
3. CI failure caused by a security scan.
4. Major version update without an active vulnerability.
5. Routine minor/patch update during a planned maintenance window.

## Triage

```bash
gh pr list --state open --author app/dependabot
gh pr view <pr-number> --json title,files,statusCheckRollup,mergeable
gh pr checks <pr-number>
```

Check:

- Which manifest changed.
- Whether the package is runtime or development-only.
- Whether the same package is already fixed by a larger PR.
- Whether CI is green.
- Whether the update is major, minor, or patch.
- Whether the PR is a security update or a routine version update.

## Rules

- If a large security PR already updates or removes the affected manifest, merge
  that PR first, then close stale Dependabot PRs.
- Do not merge a Dependabot PR with failing CI.
- Do not auto-merge major updates without reviewing release notes and tests.
- Runtime security PRs should be merged and deployed promptly after CI and review.
- Development-only toolchain PRs can usually be batched, unless they affect CI,
  deploy, Cloudflare Worker tooling, or known exploited vulnerabilities.
- Non-security minor/patch Dependabot PRs should normally be closed if they were
  opened by an older noisy configuration.
- Do not add `target-branch` to Dependabot entries; security updates must target
  the default branch.

## Batch Handling

Use this default decision tree:

1. Merge urgent security PRs first after CI and review.
2. Keep major PRs open for deliberate review and release-note checks.
3. Close non-security minor/patch PRs unless they are needed for a planned
   maintenance batch.
4. If many PRs touch the same manifest, prefer the highest-priority PR and close
   stale duplicates after `main` already contains the fix.

## Local Checks

Frontend:

```bash
cd frontend
npm ci
npx tsc --noEmit
npm run lint
npm run build
npm audit --omit=dev --audit-level=high
```

Image Worker:

```bash
cd image-worker
npm ci
WRANGLER_LOG_PATH=/tmp/wrangler-logs CI=true npm test
npm audit --audit-level=high
```

Backend:

```bash
cd backend
./gradlew test --no-daemon
./gradlew build --no-daemon
```

Docs:

```bash
./scripts/check-docs.sh
```

## Closing Stale Dependabot PRs

After a larger PR is merged, re-check alerts and open PRs. If the affected
manifest no longer exists or the package is already fixed on `main`, close the
stale Dependabot PR with a short note.

Example:

```text
Closed as stale. The dependency was already updated or removed by PR #<number>.
```
