# Operations Quickstart

> Class: Operational guide
> Owner: Platform maintainer
> Update when: production workflow, deployment gates, alerting, or handoff state changes.

Read this file first when taking over Munich Weekly operations.

## Operating Model

- `main` is the deployable branch, not a working area.
- Normal changes go through branch, pull request, CI, review, merge, then deploy.
- Production changes should be made from reviewed repository code, not by hot-editing files on the server.
- Secrets live on the server, GitHub secrets, Cloudflare, or the password manager. Do not print or commit them.
- Production deployment requires an explicit maintenance window unless the user says it is an emergency.

## First Checks

1. Read [Production State](./production-state.md) for the current handoff state.
2. Check open PRs and CI before changing code:

```bash
gh pr list --state open
gh pr checks <pr-number>
```

3. Read the relevant runbook:

| Situation | Read |
| --- | --- |
| Normal production checks | [Operations Runbook](./runbook.md) |
| Deploying | [Deployment Guide](../deployment.md) |
| Current deployment readiness | [Deployment Readiness Plan](./deployment-readiness-plan.md) |
| Backup or restore | [Backup and Restore](./backup-restore.md) |
| Security incident or outage | [Incident Response](./incident-response.md) |
| Dependabot emails or PRs | [Dependency Maintenance](./dependency-maintenance.md) |
| Cloudflare improvements | [Cloudflare Roadmap](./cloudflare-operations-roadmap.md) |

## Safe Without Approval

- Read code and docs.
- Check PR status, CI logs, and Dependabot alerts.
- Run local tests and linters.
- Prepare patches and PRs.
- Read production status commands when explicitly asked to inspect, without changing services.

## Needs Explicit Approval

- Merge PRs.
- Deploy to production.
- Restart production services.
- Reload Nginx.
- Change Cloudflare DNS, WAF, tunnel, or cache settings.
- Rotate secrets.
- Restore data or modify backups.
- Run commands that can interrupt traffic or mutate production data.

## Normal Flow

```text
branch -> code/docs -> local checks -> PR -> CI green -> review -> merge -> deploy -> smoke checks
```

Before saying work is complete, verify the exact thing you are claiming:

```bash
git status --short
gh pr view <pr-number> --json statusCheckRollup,mergeable,reviewDecision
./scripts/check-docs.sh
```

## Production Flow

1. Confirm PR is merged to `main`.
2. Confirm maintenance window.
3. Record current production SHA and service state.
4. Run the deployment script from [Deployment Guide](../deployment.md).
5. Confirm backend, frontend, public HTTPS, timers, and backup state.
6. Update [Production State](./production-state.md).

Do not skip backup and smoke checks to make a deployment look successful.
