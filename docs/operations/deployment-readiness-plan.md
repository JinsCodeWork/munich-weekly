# Manual Production Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:executing-plans` or `superpowers:subagent-driven-development` to
> implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for
> tracking.

**Goal:** Move Munich Weekly from manual server operation to a verified
one-command production deployment without weakening backup, rollback, or smoke
check guarantees.

**Architecture:** Keep `origin/main` as the deployable artifact and install the
versioned operations scripts from this repository onto the production server.
The deploy command must run a verified backup first, then build/restart services
and run local plus public smoke checks before the deployment is considered done.

**Tech Stack:** GitHub Actions, GitHub PRs, SSH, systemd, restic, rclone,
Docker Compose, PostgreSQL, PM2, Next.js, Spring Boot, Cloudflare.

---

## Current Verified State

Verified on 2026-06-13 with read-only local and SSH checks.

- GitHub `main`: `57ecc3783dfbb34b442995bcf4b9660c75b0c749`.
- Production checkout: `/home/deploy/munich-weekly` at `bb05283`, branch
  `main`, clean worktree.
- Running services: `mw-backend` and `mw-postgres` are up; PM2 process
  `munich-frontend` is online.
- Local production probes from the server: frontend `200`, backend health
  `200`.
- Public Cloudflare probes from the server: `/` returns `403` challenge,
  `/api/layout/health` returns `403` challenge, `/favicon.ico` returns `200`.
- `restic`, `rclone`, patched operations scripts, backup/status systemd units,
  root-only `backup.env`, root-only `rclone.conf`, and narrow deploy sudoers
  were installed on 2026-06-13.
- R2 backup bucket `munichweekly-ops-backups` was created on 2026-06-13.
- First successful backup snapshot: `89759db3` on 2026-06-13.
- Restore drill succeeded from snapshot `89759db3` on 2026-06-13.
- `munich-weekly-backup.timer` is enabled. `munich-weekly-status.timer` is not
  enabled yet because the public Cloudflare smoke check still returns `403`.

## Hard Stops

- Do not deploy until a production backup service exists and one backup run has
  succeeded.
- Do not print, commit, or paste production secrets. Use `sudoedit` or the
  password manager for `/etc/munich-weekly/*.env` and `rclone.conf`.
- Do not run the deploy script while the public smoke URL is blocked by the
  Cloudflare challenge. The reviewed smoke URL must exercise the public app or
  public backend through Cloudflare and return `200`.
- Do not include open dependency PRs in this deployment. PR #37 is a green
  frontend security PR that should be handled promptly after current `main` is
  deployed; PR #13 and PR #31 are major upgrades and need separate validation;
  PR #36, #29, #21, #16, and #14 are failing, draft, or blocked.
- Any command that installs packages, writes `/etc`, starts a backup, deploys,
  restarts services, reloads Nginx, or changes Cloudflare needs explicit user
  approval.
- Do not enable `munich-weekly-backup.timer` until the installed backup script
  deletes plaintext staging data after each run and the restore drill has passed.

## Phase 1: Install Deployment Prerequisites

- [x] **Confirm maintenance window**

  Record a quiet 30-minute deployment window and confirm the user approves
  production changes for this window.

- [x] **Install required server packages**

  On the server:

  ```bash
  sudo apt-get update
  sudo apt-get install -y restic rclone
  ```

  Expected: `command -v restic` and `command -v rclone` both return paths.

- [x] **Verify backup script safety patch**

  Before installing scripts on production, verify the local script version
  enforces root-only permissions for `backup.env` and `rclone.conf`, rejects
  `KEEP_BACKUP_STAGING=true` in production, and removes the plaintext
  `RUN_DIR` staging directory on exit.

- [x] **Install versioned scripts and systemd units**

  Source files must come from reviewed `origin/main`, not from hot-edited server
  files. If the server checkout has not been deployed yet, fetch `main` and use
  `git show origin/main:<path>` to install the files without changing the
  running app revision.

  Install:

  ```text
  ops/scripts/backup-production.sh -> /usr/local/sbin/munich-weekly-backup.sh
  ops/scripts/deploy-production.sh -> /usr/local/sbin/munich-weekly-deploy.sh
  ops/scripts/production-status.sh -> /usr/local/sbin/munich-weekly-status.sh
  ops/scripts/restore-backup-drill.sh -> /usr/local/sbin/munich-weekly-restore-drill.sh
  ops/scripts/notify-ops.sh -> /usr/local/sbin/munich-weekly-notify-ops.sh
  ops/systemd/munich-weekly-backup.service -> /etc/systemd/system/munich-weekly-backup.service
  ops/systemd/munich-weekly-backup.timer -> /etc/systemd/system/munich-weekly-backup.timer
  ops/systemd/munich-weekly-status.service -> /etc/systemd/system/munich-weekly-status.service
  ops/systemd/munich-weekly-status.timer -> /etc/systemd/system/munich-weekly-status.timer
  ops/systemd/munich-weekly-alert@.service -> /etc/systemd/system/munich-weekly-alert@.service
  ```

  Then run:

  ```bash
  sudo systemctl daemon-reload
  ```

  Before adding sudoers, verify ownership and permissions:

  ```bash
  sudo stat -c '%U %G %a %n' /usr/local/sbin/munich-weekly-backup.sh /etc/systemd/system/munich-weekly-backup.service
  ```

  Expected: both files are owned by `root root` and are not writable by group or
  others.

- [x] **Create backup configuration**

  Create root-only files:

  ```bash
  sudo install -d -m 0700 /etc/munich-weekly
  sudoedit /etc/munich-weekly/backup.env
  sudoedit /etc/munich-weekly/rclone.conf
  sudo chown root:root /etc/munich-weekly/backup.env /etc/munich-weekly/rclone.conf
  sudo chmod 0600 /etc/munich-weekly/backup.env /etc/munich-weekly/rclone.conf
  ```

  `/etc/munich-weekly/backup.env` must define the variables documented in
  [Backup and Restore Runbook](./backup-restore.md): `RESTIC_REPOSITORY`,
  `RESTIC_PASSWORD`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`,
  `RCLONE_CONFIG`, `RCLONE_R2_SOURCE`, and `RCLONE_R2_BACKUP`.

- [x] **Add narrow sudo rule for the deploy user**

  Verify the systemctl path:

  ```bash
  command -v systemctl
  ```

  Then add a narrow sudoers entry with `visudo`:

  ```text
  deploy ALL=(root) NOPASSWD: /usr/bin/systemctl start munich-weekly-backup.service
  ```

  If `command -v systemctl` is not `/usr/bin/systemctl`, use the verified path.
  Do not grant broad passwordless sudo.

## Phase 2: Prove Backup And Restore

- [x] **Initialize the restic repository**

  ```bash
  sudo bash -lc 'set -a; . /etc/munich-weekly/backup.env; set +a; restic snapshots >/dev/null 2>&1 || restic init'
  ```

- [x] **Run the first production backup**

  ```bash
  sudo systemctl start munich-weekly-backup.service
  sudo journalctl -u munich-weekly-backup.service -n 160 --no-pager
  ```

  Result: the service exited successfully and created snapshot `89759db3`.

- [x] **Run a restore drill before the first automated deploy**

  ```bash
  sudo /usr/local/sbin/munich-weekly-restore-drill.sh
  ```

  Result: `Restore drill succeeded from snapshot 89759db3`.

- [x] **Enable backup timer**

  ```bash
  sudo systemctl enable --now munich-weekly-backup.timer
  sudo systemctl list-timers munich-weekly-backup.timer --no-pager
  ```

  Result: backup timer enabled for daily 02:30 UTC runs.

- [ ] **Enable status timer after public smoke is fixed**

  Do not enable `munich-weekly-status.timer` while `/` and
  `/api/layout/health` return Cloudflare `403`, because the status check will
  correctly fail and create alert noise.

## Phase 3: Fix The Public Smoke Check

- [ ] **Choose the public smoke URL**

  Preferred: configure Cloudflare so `https://munichweekly.art/api/layout/health`
  returns `200` from the production server and remains uncached. This verifies
  the public edge can reach the backend without requiring a browser challenge.

  Do not use static assets such as `/favicon.ico` as the deployment smoke URL.
  A static asset can return `200` while the public frontend or backend is still
  blocked by Cloudflare.

  Current blocker: the Cloudflare connector can manage R2 but is unauthorized
  for zone/ruleset changes. Use the Cloudflare dashboard or re-authorize the
  connector with zone/ruleset permissions. The required rule should only affect
  `http.host == "munichweekly.art"` and
  `http.request.uri.path == "/api/layout/health"`, should not cache the
  response, and should skip the rule or setting that currently challenges this
  health path.

- [ ] **Verify the selected URL before deployment**

  ```bash
  curl -fsSI --connect-timeout 10 --max-time 20 https://munichweekly.art/api/layout/health
  ```

  Expected for the preferred path: HTTP `200` and no `X-Powered-By` header.

## Phase 4: Deploy `origin/main`

- [ ] **Re-check deploy target**

  ```bash
  git ls-remote origin refs/heads/main
  ssh munichweekly 'git -C /home/deploy/munich-weekly rev-parse HEAD'
  ssh munichweekly 'git -C /home/deploy/munich-weekly status --short'
  ```

  Expected: local `origin/main` is the intended deployment target and the
  production worktree is clean.

- [ ] **Run pre-deploy status**

  ```bash
  ssh munichweekly 'sudo /usr/local/sbin/munich-weekly-status.sh'
  ```

  Expected: Docker, backend health, frontend local headers, git status, and
  backup timer checks pass. If public root still returns a Cloudflare challenge,
  confirm this is the expected WAF behavior before continuing.

- [ ] **Run the one-command deploy**

  Preferred command after Phase 3 is fixed:

  ```bash
  ssh munichweekly '/usr/local/sbin/munich-weekly-deploy.sh'
  ```

  Expected: deployment succeeds from `bb05283` to the current `origin/main` SHA.

- [ ] **Run post-deploy checks**

  ```bash
  ssh munichweekly 'git -C /home/deploy/munich-weekly rev-parse --short HEAD'
  ssh munichweekly 'docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"'
  ssh munichweekly 'pm2 status --no-color'
  ssh munichweekly 'curl -fsS http://127.0.0.1:8080/api/layout/health'
  ssh munichweekly 'curl -fsSI http://127.0.0.1:3000/ | sed -n "1,20p"'
  ```

  Also verify the public site in a browser through Cloudflare.

- [ ] **Update the deployment record**

  Fill in the deployment record in [Production State](./production-state.md)
  with the previous SHA, deployed SHA, backup result, deploy command, smoke
  checks, timer state, and rollback status.

## Rollback Plan

The deploy script attempts code rollback automatically after post-checkout
failures. This rollback does not restore PostgreSQL, R2 objects, or local
uploads. If the deployed change can alter schema or data, decide whether a
database/object restore is required before declaring rollback complete.

If manual code rollback is still needed, use the previous SHA recorded before
deployment:

```bash
ssh munichweekly 'git -C /home/deploy/munich-weekly checkout --detach <previous-sha>'
ssh munichweekly 'cd /home/deploy/munich-weekly/backend && docker compose up -d --build backend'
ssh munichweekly 'cd /home/deploy/munich-weekly/frontend && npm ci && npm run build && pm2 startOrReload ecosystem.config.cjs --only munich-frontend && pm2 save'
```

After rollback, run the post-deploy checks and record the rollback in
[Production State](./production-state.md).
