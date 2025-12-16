# 🚀 Deployment Guide for Munich Weekly

This guide explains how to deploy the **Munich Weekly** photography platform to a production server on **Hetzner Cloud**. It covers backend configuration, database setup, and reverse proxy (Nginx + SSL), as well as frontend deployment with PM2.

## 📚 Related Documentation

**Security & Configuration:**
- 🔐 [Authentication & Security](./auth.md) - JWT configuration and security implementation
- 🔒 [Security Summary](./security-summary.md) - Production security considerations
- 🛡️ [Privacy Policy](./privacy.md) - Data protection and GDPR compliance

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
mkdir -p /opt/munich-weekly
cd /opt/munich-weekly
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

Create a `.env` file inside the `backend/` directory:

```env
# Database config
POSTGRES_DB=mydatabase
POSTGRES_USER=myuser
POSTGRES_PASSWORD=secret

# JWT config
JWT_SECRET=your-very-secure-secret
JWT_EXPIRATION_MS=3600000

# Cloudflare R2 storage (if using cloud storage)
CLOUDFLARE_R2_ACCESS_KEY=your-access-key
CLOUDFLARE_R2_SECRET_KEY=your-secret-key
CLOUDFLARE_R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com
CLOUDFLARE_R2_BUCKET=munichweekly-photoupload
CLOUDFLARE_R2_PUBLIC_URL=https://pub-your-account.r2.dev

# Storage configuration (R2 for cloud storage, LOCAL for local storage)
STORAGE_MODE=R2

# Spring profiles
SPRING_PROFILES_ACTIVE=dev
```

These values are used by:
* `compose.yaml` for launching PostgreSQL and the backend container
* Spring Boot via `${...}` variables in `application.properties`

> ✅ Make sure `.env` is excluded from Git with `.gitignore`

---

## 5. Backend Deployment with Docker

The backend now uses Docker for deployment, incorporating both PostgreSQL and the Spring Boot application.

```bash
cd /opt/munich-weekly/backend
docker compose up -d
```

This command starts two containers:
1. **PostgreSQL database** (`mw-postgres`)
2. **Spring Boot backend** (`mw-backend`)

The `compose.yaml` file configures both services:

```yaml
services:
  postgres:
    image: postgres:15
    container_name: mw-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: mydatabase
      POSTGRES_USER: myuser
      POSTGRES_PASSWORD: secret
    ports:
      - '5432:5432'
    volumes:
      - ./pgdata:/var/lib/postgresql/data

  backend:
    build: .
    container_name: mw-backend
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      - JWT_SECRET=${JWT_SECRET}
      - JWT_EXPIRATION_MS=${JWT_EXPIRATION_MS}
      - CLOUDFLARE_R2_ACCESS_KEY=${CLOUDFLARE_R2_ACCESS_KEY}
      - CLOUDFLARE_R2_SECRET_KEY=${CLOUDFLARE_R2_SECRET_KEY}
      - CLOUDFLARE_R2_ENDPOINT=${CLOUDFLARE_R2_ENDPOINT}
      - CLOUDFLARE_R2_BUCKET=${CLOUDFLARE_R2_BUCKET}
      - CLOUDFLARE_R2_PUBLIC_URL=${CLOUDFLARE_R2_PUBLIC_URL}
      - SPRING_PROFILES_ACTIVE=${SPRING_PROFILES_ACTIVE:-dev}
      - UPLOADS_DIR=/uploads
    volumes:
      - ./uploads:/uploads
      - ../docs:/app/docs

volumes:
  pgdata:
```

### Building and Deploying Backend Changes

When updating the backend code:

```bash
cd /opt/munich-weekly
git pull  # Get latest changes

# Rebuild and restart the backend container
cd backend
docker compose up -d --build backend
```

### Configuring Storage

The platform offers two storage options for image uploads:

1. **Local Storage** - Stores files on the server's filesystem
2. **Cloudflare R2 Cloud Storage** - Stores files in Cloudflare's object storage service

#### Using Local Storage

For development or testing environments, you can use local storage:

```env
# Set in .env file
STORAGE_MODE=LOCAL
UPLOADS_DIR=/uploads
```

This will store uploaded files in the `/uploads` directory inside the container, which is mapped to `./uploads` on the host via Docker volume.

#### Using Cloud Storage (Recommended for Production)

For production environments, using Cloudflare R2 is recommended:

```env
# Set in .env file
STORAGE_MODE=R2
CLOUDFLARE_R2_ACCESS_KEY=your-access-key
CLOUDFLARE_R2_SECRET_KEY=your-secret-key
CLOUDFLARE_R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com
CLOUDFLARE_R2_BUCKET=munichweekly-photoupload
CLOUDFLARE_R2_PUBLIC_URL=https://pub-your-account.r2.dev
```

The R2 storage service will automatically:
- Create the bucket if it doesn't exist
- Generate public URLs for uploaded images
- Optimize storage structure for efficient retrieval

For detailed information on the storage system, see the [Storage Documentation](./storage.md).

### Checking Backend Container Logs

To check logs for the backend container:

```bash
docker logs -f mw-backend
```

---

## 7. Frontend Deployment

### Installing Dependencies

```bash
cd /opt/munich-weekly/frontend
npm install
```

### Development Mode (Not Recommended for Production)

```bash
npm run dev
```

### Production Deployment with PM2

Install PM2 globally:

```bash
npm install -g pm2
```

Start the Next.js application with PM2:

```bash
cd /opt/munich-weekly/frontend
pm2 start npm --name munich-frontend -- run dev
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

## 8. Reverse Proxy with Nginx + SSL

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
        proxy_pass         http://127.0.0.1:8080/;
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

## 9. SSL with Let's Encrypt

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

## 10. Troubleshooting

### 502 Bad Gateway

If you encounter a 502 Bad Gateway error:

1. Check if the frontend service is running:
   ```bash
   pm2 status
   ```

2. If the service is down, restart it:
   ```bash
   cd /opt/munich-weekly/frontend
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
   cd /opt/munich-weekly/backend
   docker compose up -d --build backend
   ```

### SSH Access Issues

If SSH key authentication fails:

1. Use Hetzner Rescue Mode
2. Mount the system disk:
   ```bash
   mount /dev/sda1 /mnt
   ```
3. Fix SSH permissions:
   ```bash
   chmod 700 /mnt/root/.ssh
   chmod 600 /mnt/root/.ssh/authorized_keys
   ```
4. Reboot the server

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
  * 8080 → Spring Boot backend (Docker container)
  * 3000 → Next.js frontend
  * 5432 → PostgreSQL (Docker container)

---

## 📝 Notes

* Backend and PostgreSQL now run in Docker containers
* Frontend is deployed and managed with PM2
* SSH security has been hardened with key-based authentication
