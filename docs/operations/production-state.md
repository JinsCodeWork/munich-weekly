# Production State

> Class: Operational handoff
> Owner: Platform maintainer
> Update when: PRs are merged, production is deployed, timers are installed, secrets rotate, or Cloudflare settings change.

This file records the current operations handoff state. Verify with production
before relying on it.

## Current Handoff

Last updated: 2026-06-21.

| Area | State | Next action |
| --- | --- | --- |
| Ops hardening PR | PR #38 merged and deployed on 2026-06-13. | Keep using PR + CI + deploy workflow for future operations changes. |
| Production deploy | Production is deployed at `7d4258c`; previous production SHA was `449a6f0`. | Monitor PR #47's CodeQL alert closure and keep using PR + CI + deploy workflow. |
| Backup timer | `restic`, `rclone`, patched scripts, systemd units, root-only `backup.env`, root-only `rclone.conf`, and narrow deploy sudoers are installed. Backup timer is enabled. First successful snapshot: `89759db3`; latest deploy backup service run on 2026-06-21 exited `0/SUCCESS`, but the snapshot id was not visible from the non-root journal view. | Confirm the next scheduled backup on 2026-06-22 and capture snapshot ids from an authorized journal view. |
| Restore drill | Restore drill succeeded from snapshot `89759db3` on 2026-06-13. | Run monthly and after backup script changes. |
| Status timer and alerts | Status script is installed and `munich-weekly-status.timer` is active. Next run: 2026-06-22 08:10:28 UTC. | Keep monitoring scheduled status output. |
| Cloudflare origin protection | Repo contains Nginx snippets and allowlist automation; production state not confirmed here. | Verify carefully before Nginx reload. |
| Public smoke check | Server-side `curl` to `/` and `/api/layout/health` returns `200`; public `/api/csrf` returns `200` with an HttpOnly CSRF cookie; no-CSRF vote mutation returns `403`. | Keep Bot Fight Mode off unless a replacement health-check allowlist is proven first. |
| R2 backup bucket | `munichweekly-ops-backups` was created on 2026-06-13 in R2 location `WEUR`. | Use only for encrypted restic data and copied object backups. |
| Dependabot PRs | Open dependency PRs are not part of the deployment target. #37 is a green frontend security PR; #13 and #31 are major upgrades; #36, #29, #21, #16, and #14 are failing, draft, or blocked. | Deploy current stable `main` first, then triage #37 promptly through the dependency maintenance runbook. |
| Host package maintenance | Status script reported reboot required and 49 apt-upgradable packages on 2026-06-13. | Schedule a maintenance window for OS updates and reboot after confirming backup health. |

## Latest Deployment Record

```text
Deployment date: 2026-06-21
Operator: Codex with user approval
Deployed git SHA: 7d4258c
Previous git SHA: 449a6f0
Backup before deploy: pass, munich-weekly-backup.service exited 0/SUCCESS; snapshot id not visible from non-root journal view
Deploy command: PUBLIC_URL=https://munichweekly.art/api/layout/health /usr/local/sbin/munich-weekly-deploy.sh
Backend health: pass, local /api/layout/health returned 200
Frontend local check: pass, local root returned 200
Public HTTPS check: pass, /api/layout/health returned 200, /api/csrf returned 200 with HttpOnly XSRF-TOKEN, no-CSRF vote mutation returned 403
PM2 status: munich-frontend online
Docker status: mw-backend up, mw-postgres up and healthy
Backup timer status: active, next run 2026-06-22 02:40:07 UTC
Status timer status: active, next run 2026-06-22 08:10:28 UTC
Rollback needed: no
Notes: PR #47 was merged with CI and CodeQL green before deployment. The pre-deploy status script required interactive sudo from the deploy user, so non-secret production probes were used instead.
```

## Deployment Record Template

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
