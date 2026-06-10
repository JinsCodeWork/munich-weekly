# Incident Response Runbook

> Class: Operational runbook
> Owner: Platform maintainer
> Update when: alerting, secrets, hosting, backup, or recovery procedures change.

Use this runbook for suspected Munich Weekly production security incidents,
data integrity incidents, dependency compromise, backup failure, or operational
events that may affect personal data or uploaded photos.

Do not paste secrets into chat, Git, docs, shell history, tickets, incident
timelines, or evidence files. Do not run commands that print `.env`,
`/etc/munich-weekly/*.env`, PM2 environment output, database passwords, API
tokens, backup credentials, or private keys.

## Severity Levels

| Severity | Trigger | Response |
| --- | --- | --- |
| P0 | Active compromise, exposed production secrets, unauthorized data access, destructive activity, data integrity loss, or public service outage with no workaround. | Immediate response. Preserve evidence unless active harm requires immediate isolation. Rotate exposed secrets first. |
| P1 | Confirmed high-risk vulnerability, failed production backup, suspicious privileged activity, partial outage, or incident with plausible personal data or uploaded photo exposure. | Same day response. Assign owner, preserve evidence, contain affected path, and track recovery. |
| P2 | Low-risk suspicious activity, non-exploited dependency alert, degraded monitoring, or operational issue with limited blast radius. | Scheduled response with documented owner and due date. |

## First 15 Minutes

1. Assign incident commander, scribe, and technical lead. Open a private
   incident timeline.
2. Preserve evidence before changing production state unless active harm
   requires immediate isolation.
3. Record current time and production state from outside the production server:

```bash
date -u
ssh munichweekly 'date -u'
ssh munichweekly 'cd /home/deploy/munich-weekly && git rev-parse HEAD'
ssh munichweekly 'docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"'
ssh munichweekly 'sudo -n -u deploy env HOME=/home/deploy PM2_HOME=/home/deploy/.pm2 pm2 status --no-color'
ssh munichweekly 'sudo journalctl -u nginx -n 200 --no-pager'
ssh munichweekly 'sudo -n -u deploy env HOME=/home/deploy PM2_HOME=/home/deploy/.pm2 pm2 logs --lines 200 --nostream --raw'
```

4. If any secret is known or likely exposed, rotate that secret before broad
   investigation or redeploy. Treat screenshots, logs, and pasted terminal
   output containing secrets as additional exposure.
5. If active attack traffic is present and Cloudflare controls the edge, enable
   a Cloudflare WAF rule, challenge, or managed mitigation for the narrowest
   matching path or source class available.
6. If origin bypass is suspected, restrict origin access with the configured
   allowlist or host firewall before continuing normal service.
7. If data integrity is in doubt, stop write paths before repair. Prefer the
   narrowest control that prevents new writes, such as disabling affected API
   routes, blocking upload/admin paths at the edge, or stopping the backend only
   when narrower controls are not enough.

## Evidence Preservation

Store incident evidence outside the production server in a private local
directory. Do not copy secret env files or private keys.

```bash
mkdir -p incident-evidence/YYYY-MM-DD-incident
ssh munichweekly 'date -u' > incident-evidence/YYYY-MM-DD-incident/server-date.txt
ssh munichweekly 'cd /home/deploy/munich-weekly && git rev-parse HEAD && git status --short' > incident-evidence/YYYY-MM-DD-incident/git-state.txt
ssh munichweekly 'docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"' > incident-evidence/YYYY-MM-DD-incident/docker-ps.txt
ssh munichweekly 'sudo journalctl -u nginx --since "2 hours ago" --no-pager' > incident-evidence/YYYY-MM-DD-incident/nginx-journal.txt
ssh munichweekly 'sudo -n -u deploy env HOME=/home/deploy PM2_HOME=/home/deploy/.pm2 pm2 logs --lines 1000 --nostream --raw' > incident-evidence/YYYY-MM-DD-incident/backend-logs.txt
```

Keep evidence files private. Redact personal data before sharing outside the
incident team. Preserve original files when redaction is needed, and write
redacted copies separately.

## Credential Rotation Inventory

Rotate credentials based on exposure scope. Record who rotated each item, when
it was rotated, where the new value was installed, and how production was
validated afterward.

- SSH keys or passwords for the production host alias.
- GitHub user tokens, deploy keys, repository secrets, and Actions secrets.
- Cloudflare API tokens.
- Cloudflare R2 access keys.
- Turnstile site secret.
- Image worker secrets and Worker bindings.
- `JWT_SECRET`.
- `ANONYMOUS_VOTE_SECRET`.
- PostgreSQL application and administrative passwords.
- Mailjet API key and secret.
- Backup repository credentials.
- `RESTIC_PASSWORD`.

After rotating application or infrastructure secrets, restart only the services
that must reload those values and confirm the running production version.

## Isolation

Choose the least destructive isolation that stops active harm. Preserve evidence
first unless continuing normal traffic would increase compromise, data loss, or
personal data exposure.

Isolation is appropriate when:

- A production credential is actively abused or cannot be trusted.
- Unauthorized writes, deletes, uploads, votes, or admin actions are occurring.
- Malware, persistence, or unauthorized shell access is suspected.
- Database integrity is uncertain.
- Uploaded photos or personal data may be exfiltrating.

Isolation options:

- Cloudflare WAF block or managed challenge for attacker IPs, paths, countries,
  methods, or suspicious request patterns.
- Cloudflare development mode or cache changes only when cache behavior is part
  of the incident.
- Origin allowlist or host firewall restriction to Cloudflare and trusted
  operator IPs.
- Temporarily block upload, vote, auth, or admin paths at the edge.
- Stop the backend process if narrow write-path isolation is insufficient.
- Put a maintenance page in front of the service if user traffic must stop while
  preserving the host for investigation.

## Communications And Disclosure

The platform maintainer owns technical incident coordination. Product/legal
ownership is required before notifying users, public channels, regulators, or
third parties.

Consider disclosure when:

- Personal data, account data, email addresses, IP-linked logs, uploaded photos,
  voting data, or admin actions may have been accessed by an unauthorized party.
- Uploaded photos may have been altered, deleted, or copied.
- Secrets or infrastructure credentials may allow future access.
- Service integrity or public content authenticity is in doubt.

External statements must avoid unverified claims. Include what happened, what
data may be affected, what users should do, what was fixed, and where updates
will appear.

## Timeline Template

```text
Incident ID:
Severity:
Incident commander:
Scribe:
Technical lead:
Start time UTC:
Detection source:
Affected systems:
Potential data impact:

Timeline:
- YYYY-MM-DDTHH:MM:SSZ - Event, observation, command, or decision.

Containment:
- Action:
- Owner:
- Time UTC:

Eradication:
- Action:
- Owner:
- Time UTC:

Recovery:
- Action:
- Owner:
- Time UTC:

Follow-ups:
- Owner:
- Due date:
- Verification:
```

## Dependency Vulnerability Response

Treat critical exploited-in-the-wild dependency issues as P0 or P1 depending on
exposure and exploitability.

1. Review the Dependabot alert, affected package, vulnerable version range,
   patched version, and reachable production code path.
2. Create a minimal dependency update or apply the relevant upstream patch.
3. Run CI checks before deployment. Include backend tests, frontend build/lint,
   and docs checks when touched.
4. Deploy through the documented deployment script or approved deployment
   process. Do not hot-edit production files.
5. Confirm the production git SHA and package version after deployment:

```bash
ssh munichweekly 'cd /home/deploy/munich-weekly && git rev-parse HEAD'
ssh munichweekly 'cd /home/deploy/munich-weekly/backend && ./gradlew dependencyInsight --dependency PACKAGE_NAME --configuration runtimeClasspath'
ssh munichweekly 'cd /home/deploy/munich-weekly/frontend && npm ls PACKAGE_NAME'
```

6. Close the Dependabot alert only after production is confirmed on the fixed
   version or the alert is proven not applicable.

## Backup Failure Response

Treat every failed production backup as P1 until a later backup succeeds and a
restore drill verifies recoverability.

1. Preserve the failed unit logs:

```bash
ssh munichweekly 'sudo journalctl -u munich-weekly-backup.service -n 240 --no-pager'
ssh munichweekly 'sudo systemctl status munich-weekly-backup.service --no-pager'
```

2. Identify whether the failure affects PostgreSQL dump creation, uploaded file
   capture, R2 object backup, restic repository access, credentials, disk space,
   or alert delivery.
3. Fix the cause without weakening production backup requirements. Do not set
   production dry-run flags or disable required R2 backup validation.
4. Run a manual backup and confirm success.
5. Run the restore drill from [Backup and Restore Runbook](./backup-restore.md)
   after the fix. Recovery is not complete until the drill succeeds.

## Recovery Exit Criteria

Close the incident only when all relevant items are true:

- Active harm has stopped and isolation can be safely relaxed.
- Exposed or suspect credentials have been rotated and old credentials revoked.
- Production is running a known git SHA and expected service versions.
- Data integrity has been checked or restored from a verified backup.
- A fresh backup has succeeded after the fix when backup health was involved.
- A restore drill has succeeded after backup, database, or storage recovery.
- User, legal, or third-party disclosure decisions are recorded.
- Evidence, timeline, root cause, impact, and follow-up actions are stored in a
  private incident record.
- Monitoring, alerts, and normal health checks are green.
