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
| Ops hardening PR | PR #38 merged and deployed on 2026-06-13. | Keep using PR + CI + deploy workflow for future operations changes. |
| Production deploy | Production is deployed at `449a6f0`; previous production SHA was `bb05283`. | Triage remaining Dependabot/security PRs after this stable deploy. |
| Backup timer | `restic`, `rclone`, patched scripts, systemd units, root-only `backup.env`, root-only `rclone.conf`, and narrow deploy sudoers are installed. Backup timer is enabled. First successful snapshot: `89759db3`; latest deploy snapshot: `53833799`. | Monitor next scheduled backup on 2026-06-14 and keep restic password available from local `.env.local`. |
| Restore drill | Restore drill succeeded from snapshot `89759db3` on 2026-06-13. | Run monthly and after backup script changes. |
| Status timer and alerts | Status script passes and `munich-weekly-status.timer` is enabled. Next run: 2026-06-14 08:01:48 UTC. | Review status timer output after first scheduled run. |
| Cloudflare origin protection | Repo contains Nginx snippets and allowlist automation; production state not confirmed here. | Verify carefully before Nginx reload. |
| Public smoke check | Server-side `curl` to `/` and `/api/layout/health` returns `200`. Cloudflare Bot Fight Mode was disabled because it challenged production health checks. | Keep Bot Fight Mode off unless a replacement health-check allowlist is proven first. |
| R2 backup bucket | `munichweekly-ops-backups` was created on 2026-06-13 in R2 location `WEUR`. | Use only for encrypted restic data and copied object backups. |
| Dependabot PRs | Open dependency PRs are not part of the deployment target. #37 is a green frontend security PR; #13 and #31 are major upgrades; #36, #29, #21, #16, and #14 are failing, draft, or blocked. | Deploy current stable `main` first, then triage #37 promptly through the dependency maintenance runbook. |
| Host package maintenance | Status script reported reboot required and 49 apt-upgradable packages on 2026-06-13. | Schedule a maintenance window for OS updates and reboot after confirming backup health. |

## Latest Deployment Record

```text
Deployment date: 2026-06-13
Operator: Codex with user approval
Deployed git SHA: 449a6f0
Previous git SHA: bb05283
Backup before deploy: pass, snapshot id 53833799
Deploy command: PUBLIC_URL=https://munichweekly.art/api/layout/health /usr/local/sbin/munich-weekly-deploy.sh
Backend health: pass, local /api/layout/health returned 200
Frontend local check: pass, local root returned 200
Public HTTPS check: pass, / and /api/layout/health returned 200
PM2 status: munich-frontend online
Docker status: mw-backend up, mw-postgres up and healthy
Backup timer status: enabled, next run 2026-06-14 02:34:01 UTC
Status timer status: enabled, next run 2026-06-14 08:01:48 UTC
Rollback needed: no
Notes: Cloudflare Bot Fight Mode was disabled because it challenged curl-based health checks.
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
