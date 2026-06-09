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

Install scripts and timers:

```bash
sudo install -m 0755 ops/scripts/backup-production.sh /usr/local/sbin/munich-weekly-backup.sh
sudo install -m 0644 ops/systemd/munich-weekly-backup.service /etc/systemd/system/munich-weekly-backup.service
sudo install -m 0644 ops/systemd/munich-weekly-backup.timer /etc/systemd/system/munich-weekly-backup.timer
sudo systemctl daemon-reload
sudo systemctl enable --now munich-weekly-backup.timer
```

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

## Restore Drill

Run a restore drill monthly and after changing backup logic. A restore is considered valid only when `pg_restore --list` succeeds and the restored database can answer basic count queries.
