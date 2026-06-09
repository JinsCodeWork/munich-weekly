# 🚀 Deployment Guide for Munich Weekly

> Class: Operational guide
> Owner: Backend/platform maintainer
> Update when: production ports, Nginx, PM2, Docker, profiles, SSL, or deployment process changes.

This guide explains how to deploy the **Munich Weekly** photography platform to a production server on **Hetzner Cloud**. It covers backend configuration, database setup, and reverse proxy (Nginx + SSL), as well as frontend deployment with PM2.

## 📚 Related Documentation

**Security & Configuration:**
- 🔐 [Authentication & Security](./auth.md) - JWT configuration and security implementation
- 🔒 [Security Summary](./security-summary.md) - Production security considerations
- 🛡️ [Privacy Policy](./privacy.md) - Data protection and GDPR compliance
- ⚙️ [Environment Variables](./environment.md) - Runtime configuration reference

**Architecture & Development:**
- 🏠 [Project Overview](../README.md) - Platform overview and tech stack
- 🤝 [Contributing Guide](./contributing.md) - Development workflow and guidelines
- 📦 [API Reference](./api.md) - Endpoint configuration and authentication
- 💾 [Storage System](./storage.md) - File storage setup (Local vs Cloudflare R2)

---

## 1. Prerequisites

* Ubuntu 22.04 LTS server (e.g. CX22 from Hetzner Cloud)
* Domain: `munichweekly.art` pointing to server IP
* Nginx installed and running
* Docker + Docker Compose installed (v28.0.4 and v2.34.0 confirmed)
* Git installed
* Node.js, npm, PM2, curl, flock, sudo, and systemd available for production deploys

---

## 2. SSH Security Configuration

### SSH Key Setup

Ensure SSH key-based authentication is properly configured:

```bash
# On server, ensure proper permissions
chmod 700 /root/.ssh
chmod 600 /root/.ssh/authorized_keys
```

### SSH Configuration

Edit `/etc/ssh/sshd_config` with these security settings:

```
PasswordAuthentication no
PubkeyAuthentication yes
PermitRootLogin yes
MaxAuthTries 3
LoginGraceTime 20
```

Restart SSH service:

```bash
systemctl restart sshd
```

### Local SSH Configuration

Add this to your local `~/.ssh/config` for easy access:

```
Host munichweekly
    HostName YOUR_SERVER_IP
    User deploy
    IdentityFile ~/.ssh/id_ed25519
```

### Emergency Recovery

If SSH key authentication fails:
1. Access Hetzner Cloud Console
2. Enable Rescue Mode for the server
3. Mount the system disk and fix permissions:
   ```bash
   mount /dev/sda1 /mnt
   chmod 700 /mnt/root/.ssh
   chmod 600 /mnt/root/.ssh/authorized_keys
   ```
4. Reboot the server

---

## 3. Directory Setup

On the server:

```bash
mkdir -p /home/deploy/munich-weekly
cd /home/deploy/munich-weekly
git clone https://github.com/JinsCodeWork/munich-weekly.git .
```

This creates the expected project structure:

```
munich-weekly/
├── backend/         # Spring Boot application
├── frontend/        # Next.js frontend
├── db/              # SQL scripts (optional)
└── docs/            # Documentation
```

---

## 4. Environment Configuration

Create `backend/.env` on the server. The variable inventory, defaults, and
profile meanings are maintained in [Environment Variables](./environment.md);
do not duplicate the full list here.

These values are consumed by `backend/compose.yaml` and Spring Boot property
binding. Make sure `.env` is excluded from Git with `.gitignore`.

> Production must not use `SPRING_PROFILES_ACTIVE=dev`. The current `dev`
> profile clears core data on startup and reseeds test users.

Set `JWT_SECRET` to a strong random value before starting the backend. The
backend has no default for this secret and refuses blank values, the removed
development fallback, and values shorter than 32 UTF-8 bytes. Rotating
`JWT_SECRET` invalidates existing JWTs.

Set `ANONYMOUS_VOTE_SECRET` to a separate strong random value before starting
the backend in `prod` or `prod-init`. It signs the anonymous voting
`mw_vote_anon` HttpOnly cookie. Rotating it invalidates existing anonymous vote
cookies, but stored votes remain in the database.

---

## 5. Production Deployment

Production deployment is controlled by
[`ops/scripts/deploy-production.sh`](../ops/scripts/deploy-production.sh).
Run that script on the production server instead of manually pulling code and
restarting individual services.

The script defaults to:

```bash
APP_DIR=/home/deploy/munich-weekly
BRANCH=main
LOCK_FILE=/tmp/munich-weekly-deploy.lock
BACKUP_SERVICE=munich-weekly-backup.service
SMOKE_TIMEOUT_SECONDS=120
SMOKE_INTERVAL_SECONDS=3
```

The script:

* Acquires an exclusive deployment lock with `flock`.
* Refuses to run if the production working tree is dirty.
* Validates `BRANCH` as a plain branch name using common branch-name characters
  and fetches it through an explicit `refs/heads/...` refspec.
* Records the current commit and ref before fetching.
* Fetches `origin/main` and computes the target commit.
* Starts the production backup service with non-interactive `sudo -n` before
  changing code.
* Checks out `origin/main` in detached HEAD state. This matches the current
  production deployment style and avoids moving a branch pointer on the server.
* Runs `npm ci`, `npm audit --omit=dev --audit-level=high`, and
  `npm run build` for the frontend.
* Rebuilds and restarts the backend with `docker compose up -d --build backend`
  from `backend/`.
* Reloads the PM2 frontend process and runs `pm2 save`.
* Runs bounded retry smoke checks against the local backend health endpoint,
  local frontend, and public site.
* Fails if the public site exposes an `X-Powered-By` response header.
* Attempts a best-effort rollback to the previous commit if any post-checkout
  deploy step fails. The original deployment failure still exits nonzero.

### Install or Update the Deploy Command

On the production server:

```bash
cd /home/deploy/munich-weekly
git fetch origin main
git checkout --detach origin/main
sudo install -m 0755 ops/scripts/deploy-production.sh /usr/local/sbin/munich-weekly-deploy.sh
```

The deploy command starts `munich-weekly-backup.service` with `sudo -n`, so the
`deploy` user needs either an active sudo credential cache or a narrow sudoers
rule for that service start command before running unattended deployments.

Run a deployment:

```bash
/usr/local/sbin/munich-weekly-deploy.sh
```

For non-default deployments, pass environment overrides explicitly:

```bash
BRANCH=release-candidate /usr/local/sbin/munich-weekly-deploy.sh
```

### PM2 Frontend Reload Behavior

The production PM2 process is named `munich-frontend`. The versioned process
definition lives in
[`frontend/ecosystem.config.cjs`](../frontend/ecosystem.config.cjs) and is the
preferred production path:

```bash
pm2 startOrReload ecosystem.config.cjs --only munich-frontend
```

The deploy script runs that command from `frontend/` after building the app.
The old unversioned fallback exists only for bootstrapping hosts that have not
received the PM2 definition yet:

```bash
pm2 restart munich-frontend
```

If the process does not exist, it starts the app with:

```bash
pm2 start npm --name munich-frontend -- start
```

After the reload or start, the script runs `pm2 save`.

### PM2 Logs

Install `pm2-logrotate` on production so PM2 logs are bounded:

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 5
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss
pm2 save
```

Use the versioned ecosystem file for normal frontend process changes:

```bash
cd /home/deploy/munich-weekly/frontend
pm2 startOrReload ecosystem.config.cjs --only munich-frontend
pm2 save
```

### Backend Runtime

The backend uses Docker for deployment, incorporating both PostgreSQL and the
Spring Boot application. The service definitions live in `backend/compose.yaml`;
treat that file as the source of truth for container names, ports, volumes, and
environment wiring.

The deploy script rebuilds only the backend application service:

```bash
cd /home/deploy/munich-weekly/backend
docker compose up -d --build backend
```

The compose project runs:

1. **PostgreSQL database** (`mw-postgres`)
2. **Spring Boot backend** (`mw-backend`)

### Configuring Storage

Production deployments should use Cloudflare R2. Storage modes and required
variables are documented in [Environment Variables](./environment.md); storage
behavior is documented in [Storage System](./storage.md).

For local upload testing, prefer the host-run backend flow in
[Local Development](./local-development.md), or use an explicit compose override
before relying on local container storage.

### Checking Backend Container Logs

To check logs for the backend container:

```bash
docker logs -f mw-backend
```

---

## 6. Frontend PM2 Setup

The deploy script builds and reloads the frontend. These commands are only for
initial PM2 installation and manual process inspection.

Install PM2 globally:

```bash
npm install -g pm2
```

Start or reload the Next.js application with the versioned PM2 definition:

```bash
cd /home/deploy/munich-weekly/frontend
npm run build
pm2 startOrReload ecosystem.config.cjs --only munich-frontend
```

Configure PM2 to start on system boot:

```bash
pm2 save
pm2 startup
# Execute the command that PM2 outputs
```

PM2 Management Commands:

```bash
# Check status
pm2 status

# View logs
pm2 logs munich-frontend

# Restart application
pm2 restart munich-frontend

# Stop application
pm2 stop munich-frontend
```

---

## 7. Reverse Proxy with Nginx + SSL

File: `/etc/nginx/sites-available/10-munichweekly.conf`

```nginx
# Redirect HTTP → HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name munichweekly.art www.munichweekly.art;
    return 301 https://$host$request_uri;
}

# HTTPS site
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name munichweekly.art www.munichweekly.art;

    ssl_certificate     /etc/letsencrypt/live/munichweekly.art/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/munichweekly.art/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    # API reverse proxy to Spring Boot
    location /api/ {
        # Keep the /api prefix. Do not add a trailing slash to proxy_pass here.
        proxy_pass         http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        add_header         X-Debug-Proxy "api-hit";
    }

    # Frontend (Next.js on port 3000)
    location / {
        proxy_pass         http://127.0.0.1:3000/;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_set_header   Upgrade           $http_upgrade;
        proxy_set_header   Connection        "upgrade";
        add_header         X-Debug-Proxy "frontend-hit";
    }
}
```

Enable and reload:

```bash
sudo ln -s /etc/nginx/sites-available/10-munichweekly.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 8. SSL with Let's Encrypt

Install and enable HTTPS certificate:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d munichweekly.art -d www.munichweekly.art
```

Check cert status:

```bash
sudo certbot certificates
```

---

## 9. Troubleshooting

### 502 Bad Gateway

If you encounter a 502 Bad Gateway error:

1. Check if the frontend service is running:
   ```bash
   pm2 status
   ```

2. If the service is down, restart it:
   ```bash
   cd /home/deploy/munich-weekly/frontend
   pm2 restart munich-frontend
   ```

3. Check Nginx logs:
   ```bash
   tail -f /var/log/nginx/error.log
   ```

### Backend Container Issues

If the backend container is having issues:

1. Check container status:
   ```bash
   docker ps -a | grep mw-backend
   ```

2. View container logs:
   ```bash
   docker logs mw-backend
   ```

3. Restart the container if needed:
   ```bash
   docker restart mw-backend
   ```

4. If problems persist, rebuild the container:
   ```bash
   cd /home/deploy/munich-weekly/backend
   docker compose up -d --build backend
   ```

### SSH Access Issues

If SSH key authentication fails, follow the [Emergency Recovery](#emergency-recovery)
steps above.

---

## ✅ Status Summary

* Server IP: `YOUR_SERVER_IP` (configured in Hetzner Cloud)
* OS: Ubuntu 24.04 LTS
* Docker: v28.0.4
* Docker Compose: v2.34.0
* Nginx: installed & SSL enabled
* Node.js: installed for frontend
* PM2: managing frontend service
* Ports:

  * 80/443 → Nginx
  * 127.0.0.1:8080 → Spring Boot backend (Docker container)
  * 3000 → Next.js frontend
  * 127.0.0.1:5432 → PostgreSQL (Docker container)

---

## 📝 Notes

* Backend and PostgreSQL now run in Docker containers
* Frontend is deployed and managed with PM2
* SSH security has been hardened with key-based authentication
