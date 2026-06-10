# Production State

> Class: Operational handoff
> Owner: Platform maintainer
> Update when: PRs are merged, production is deployed, timers are installed, secrets rotate, or Cloudflare settings change.

This file records the current operations handoff state. Verify with production
before relying on it.

## Current Handoff

Last updated: 2026-06-11.

| Area | State | Next action |
| --- | --- | --- |
| Ops hardening PR | PR #3 is ready for review, CI green, not merged. | Review and merge when approved. |
| Production deploy | Not performed for PR #3. | Schedule maintenance window before deploying. |
| Backup timer | Scripts and units exist in repo; server installation not confirmed here. | Verify after merge on production. |
| Restore drill | Script exists in repo; latest successful drill not recorded here. | Run after backup setup is confirmed. |
| Status timer and alerts | Scripts and units exist in repo; server installation not confirmed here. | Install or verify on production. |
| Cloudflare origin protection | Repo contains Nginx snippets and allowlist automation; production state not confirmed here. | Verify carefully before Nginx reload. |
| Dependabot PRs | Several were opened from old `main`; PR #3 updates/removes many affected manifests. | Merge PR #3 first, then close or rebase stale Dependabot PRs. |

## Required Deployment Record

After each production deployment, update this section:

```text
Deployment date:
Operator:
Deployed git SHA:
Previous git SHA:
Backup before deploy: pass/fail, snapshot id:
Deploy command:
Backend health:
Frontend local check:
Public HTTPS check:
PM2 status:
Docker status:
Backup timer status:
Status timer status:
Rollback needed: yes/no
Notes:
```

## Minimum Production Verification

Use non-secret commands only:

```bash
ssh munichweekly 'date -Is'
ssh munichweekly 'git -C /home/deploy/munich-weekly rev-parse HEAD'
ssh munichweekly 'docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"'
ssh munichweekly 'sudo systemctl list-timers munich-weekly-backup.timer munich-weekly-status.timer --no-pager'
ssh munichweekly 'sudo journalctl -u munich-weekly-status.service -n 80 --no-pager'
```

Do not print `.env` files, service environments, tokens, database passwords, or
Cloudflare credentials while updating this file.
