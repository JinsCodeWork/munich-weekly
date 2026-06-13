# Production State

> Class: Operational handoff
> Owner: Platform maintainer
> Update when: PRs are merged, production is deployed, timers are installed, secrets rotate, or Cloudflare settings change.

This file records the current operations handoff state. Verify with production
before relying on it.

## Current Handoff

Last updated: 2026-06-13.

| Area | State | Next action |
| --- | --- | --- |
| Ops hardening PR | PR #3 merged on 2026-06-10. | Deploy merged operations code after readiness gates pass. |
| Production deploy | Not performed for current `main`. Production is still at `bb05283`; GitHub `main` is `57ecc37`. | Blocked on Cloudflare public smoke check; follow [Deployment Readiness Plan](./deployment-readiness-plan.md). |
| Backup timer | `restic`, `rclone`, patched scripts, systemd units, root-only `backup.env`, root-only `rclone.conf`, and narrow deploy sudoers are installed. Backup timer is enabled. First successful snapshot: `89759db3` on 2026-06-13. | Monitor next scheduled backup on 2026-06-14 and keep restic password available from local `.env.local`. |
| Restore drill | Restore drill succeeded from snapshot `89759db3` on 2026-06-13. | Run monthly and after backup script changes. |
| Status timer and alerts | Scripts and units are installed, but status timer is not enabled because public Cloudflare smoke currently returns `403`. | Enable after the public health URL returns `200`. |
| Cloudflare origin protection | Repo contains Nginx snippets and allowlist automation; production state not confirmed here. | Verify carefully before Nginx reload. |
| Public smoke check | Server-side `curl` to `/` and `/api/layout/health` receives Cloudflare `403` challenge even with a browser User-Agent; `/favicon.ico` returns `200` but is not an acceptable deploy smoke URL. Current Cloudflare connector can manage R2 but is unauthorized for zone/ruleset changes. | Add a Cloudflare rule so `/api/layout/health` returns `200` uncached, or re-authorize the connector with zone/ruleset permissions. |
| R2 backup bucket | `munichweekly-ops-backups` was created on 2026-06-13 in R2 location `WEUR`. | Use only for encrypted restic data and copied object backups. |
| Dependabot PRs | Open dependency PRs are not part of the deployment target. #37 is a green frontend security PR; #13 and #31 are major upgrades; #36, #29, #21, #16, and #14 are failing, draft, or blocked. | Deploy current stable `main` first, then triage #37 promptly through the dependency maintenance runbook. |

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
