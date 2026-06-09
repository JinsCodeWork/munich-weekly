# Operations Runbook

> Class: Operational runbook
> Owner: Platform maintainer
> Update when: daily checks, alerting, maintenance cadence, or production
> service operations change.

This runbook covers normal Munich Weekly production operations. For backup and
restore details, see [Backup and Restore Runbook](./backup-restore.md).

## Daily Automated Checks

The `munich-weekly-status.timer` runs the production status report every day at
08:00 server time with a randomized delay of up to 15 minutes.

Install the status script, alert script, and systemd units on the server:

```bash
sudo install -m 0755 ops/scripts/production-status.sh /usr/local/sbin/munich-weekly-status.sh
sudo install -m 0755 ops/scripts/notify-ops.sh /usr/local/sbin/munich-weekly-notify-ops.sh
sudo install -m 0644 ops/systemd/munich-weekly-alert@.service /etc/systemd/system/munich-weekly-alert@.service
sudo install -m 0644 ops/systemd/munich-weekly-status.service /etc/systemd/system/munich-weekly-status.service
sudo install -m 0644 ops/systemd/munich-weekly-status.timer /etc/systemd/system/munich-weekly-status.timer
sudo systemctl daemon-reload
sudo systemctl enable --now munich-weekly-status.timer
```

The status check is read-only. It reports host uptime, disk usage, memory,
reboot-required state, apt upgrade count, Docker containers, PM2 status as the
`deploy` user, backend health, local and public frontend headers, repository
revision/status, backup timer state, and recent backup journal entries.

PM2 status uses non-interactive sudo:

```bash
sudo -n -u deploy env HOME=/home/deploy PM2_HOME=/home/deploy/.pm2 pm2 status --no-color
```

If that command is not permitted, the status report records the PM2 failure but
does not fail the whole service. Core checks such as Docker, backend health,
frontend reachability, and repository status fail the service so systemd can
alert through `OnFailure`.

Review the latest automated status output:

```bash
sudo journalctl -u munich-weekly-status.service -n 160 --no-pager
sudo systemctl list-timers munich-weekly-status.timer --no-pager
```

## Manual Status Command

Run the same status report manually before and after maintenance:

```bash
sudo /usr/local/sbin/munich-weekly-status.sh
```

The script defaults `APP_DIR` to `/home/deploy/munich-weekly`. For a one-off
check against a different checkout, pass `APP_DIR` without printing secrets:

```bash
sudo APP_DIR=/home/deploy/munich-weekly /usr/local/sbin/munich-weekly-status.sh
```

## Alerts

Systemd `OnFailure` alerts are wired for failed backups, Cloudflare origin
allowlist updates, and production status checks. The alert template calls
`/usr/local/sbin/munich-weekly-notify-ops.sh` with the failed unit name.

Create the alert environment file on the server:

```bash
sudo install -d -m 0700 /etc/munich-weekly
sudoedit /etc/munich-weekly/alerts.env
sudo chmod 0600 /etc/munich-weekly/alerts.env
```

Set only the webhook URL in that file:

```bash
OPS_ALERT_WEBHOOK_URL=https://example.invalid/ops-webhook
```

Do not commit webhook URLs or other alerting secrets. If
`OPS_ALERT_WEBHOOK_URL` is unset, the notification script writes the alert
message to stderr so the failure remains visible in journald. If the webhook is
configured and delivery fails, the alert service exits nonzero and systemd logs
the delivery failure.

Test the local alert path without sending a webhook by using an empty env file:

```bash
sudo ALERT_ENV=/dev/null /usr/local/sbin/munich-weekly-notify-ops.sh manual-test.service
```

## Weekly Maintenance Review

Once per week:

- Review `munich-weekly-status.service` output for disk growth, pending apt
  updates, reboot-required state, container health, PM2 state, and git drift.
- Review backup success and the latest restic snapshots:

```bash
sudo journalctl -u munich-weekly-backup.service -n 160 --no-pager
sudo systemctl list-timers munich-weekly-backup.timer --no-pager
```

- Review Cloudflare allowlist update status:

```bash
sudo journalctl -u munich-weekly-cloudflare-allowlist.service -n 120 --no-pager
sudo systemctl list-timers munich-weekly-cloudflare-allowlist.timer --no-pager
```

- Confirm any pending operating system updates have an assigned maintenance
  window.

## Monthly Maintenance Window

Once per month, schedule a quiet maintenance window and:

- Run the manual production status command before changes.
- Apply approved operating system updates.
- Reboot if `/var/run/reboot-required` exists.
- Run the restore drill from [Backup and Restore Runbook](./backup-restore.md).
- Run the manual production status command after changes.
- Confirm the public site responds through Cloudflare at
  `https://munichweekly.art`.
