# Backup and Restore Runbook

> Class: Operational runbook
> Owner: Platform maintainer
> Update when: database container names, backup storage, retention, or restore commands change.

## Backup Scope

The production backup captures:

- PostgreSQL logical dump from container `mw-postgres` using `pg_dump -Fc`.
- Local uploads directory from `backend/uploads`.
- R2-hosted production upload objects copied to an independent private backup bucket through `rclone`.
- Git commit metadata and Docker container status.
- SHA256 checksums for the dump and uploads archive.
- R2 source and backup object manifests.

Production backups are not healthy unless both database data and uploaded objects are restorable.

## Server Setup

Install packages:

```bash
sudo apt-get update
sudo apt-get install -y restic rclone
```

Create the private env directory:

```bash
sudo install -d -m 0700 /etc/munich-weekly
sudoedit /etc/munich-weekly/backup.env
sudo chmod 0600 /etc/munich-weekly/backup.env
```

The file `/etc/munich-weekly/backup.env` must define `RESTIC_REPOSITORY`, `RESTIC_PASSWORD`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `RCLONE_CONFIG`, `RCLONE_R2_SOURCE`, and `RCLONE_R2_BACKUP`.

Do not set `BACKUP_DRY_RUN=true`, `ALLOW_BACKUP_DRY_RUN=true`, or
`REQUIRE_R2_BACKUP=false` in the production env file. The production script
rejects dry-run mode and requires R2 object backups so a successful service run
means both database data and upload objects were captured.

Install scripts and timers:

```bash
sudo install -d -m 0700 /var/backups/munich-weekly
sudo install -m 0755 ops/scripts/backup-production.sh /usr/local/sbin/munich-weekly-backup.sh
sudo install -m 0644 ops/systemd/munich-weekly-backup.service /etc/systemd/system/munich-weekly-backup.service
sudo install -m 0644 ops/systemd/munich-weekly-backup.timer /etc/systemd/system/munich-weekly-backup.timer
sudo systemctl daemon-reload
sudo systemctl enable --now munich-weekly-backup.timer
```

The service references `OnFailure=munich-weekly-alert@%n.service`. Full
production rollout installs the alert template and `notify-ops.sh` before
timers are enabled. If installing only this backup task early, verify failures
through journald until the alert template from the operations status task is
installed.

The systemd unit hardens the root service with read-only system paths and
allows writes only to `/var/backups/munich-weekly`, the restic cache directory,
and the Docker socket. If `APP_DIR` or `BACKUP_WORK_DIR` is changed, update the
unit's `ReadOnlyPaths=` and `ReadWritePaths=` before enabling the timer.

Initialize the encrypted backup repository once:

```bash
sudo bash -lc 'set -a; . /etc/munich-weekly/backup.env; set +a; restic snapshots >/dev/null 2>&1 || restic init'
```

## Manual Backup

```bash
sudo systemctl start munich-weekly-backup.service
sudo journalctl -u munich-weekly-backup.service -n 120 --no-pager
```

Expected result: restic prints the latest snapshots and the service exits successfully.

If the service fails with `R2 backup manifest mismatch`, upload objects changed
during the copy or the destination did not receive the same object set. Rerun
the backup after upload activity settles and treat the failed run as
non-restorable until a later run succeeds.

## Restore Drill

Run a restore drill monthly and after changing backup logic. A restore is considered valid only when `pg_restore --list` succeeds and the restored database can answer basic count queries.
