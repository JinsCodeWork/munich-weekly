# 🚀 Deployment Guide for Munich Weekly

This guide explains how to deploy the **Munich Weekly** photography platform to a production server on **Hetzner Cloud**. It covers backend configuration, database setup, and reverse proxy (Nginx + SSL), as well as frontend deployment with PM2.

---

## 1. Prerequisites

* Ubuntu 22.04 LTS server (e.g. CX22 from Hetzner Cloud)
* Domain: `munichweekly.art` pointing to server IP
* Nginx installed and running
* Docker + Docker Compose installed (v28.0.4 and v2.34.0 confirmed)
* Java 21 installed (Spring Boot uses Java 21)
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
    HostName 188.245.71.169
    User root
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
# database config
POSTGRES_DB=mydatabase
POSTGRES_USER=myuser
POSTGRES_PASSWORD=secret

# JWT
JWT_SECRET=your-very-secure-secret
JWT_EXPIRATION_MS=3600000
```

These values are used by:

* `compose.yaml` for launching PostgreSQL
* Spring Boot via `${...}` variables in `application.properties`

> ✅ Make sure `.env` is excluded from Git with `.gitignore`

---

## 5. Backend Database Setup (Docker)

Launch the PostgreSQL container with volume persistence:

```bash
cd backend
docker compose up -d
```

This uses the following `compose.yaml`:

```yaml
version: '3.8'
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
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

---

## 6. Building & Running the Backend

Option 1: Run via Gradle (development)

```bash
cd backend
./gradlew bootRun
```

Option 2: Build and run executable JAR (recommended for production)

```bash
./gradlew build
java -jar build/libs/backend-0.0.1-SNAPSHOT.jar
```

> The application starts on port `8080` and uses config from `application.properties`

Spring Boot config sample:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/mydatabase
spring.datasource.username=myuser
spring.datasource.password=secret
spring.profiles.active=dev
jwt.secret=${JWT_SECRET:this-is-a-very-secret-key-123456789077883932032328}
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

## ✅ Status Summary (as of May 2025)

* Server IP: `188.245.71.169`
* OS: Ubuntu 22.04 LTS
* Java: 21 (via toolchain)
* Docker: v28.0.4
* Docker Compose: v2.34.0
* Nginx: installed & SSL enabled
* Node.js: installed for frontend
* PM2: managing frontend service
* Ports:

  * 80/443 → Nginx
  * 8080 → Spring Boot backend
  * 3000 → Next.js frontend

---

## 📝 Notes

* Frontend is deployed and managed with PM2
* Backend sample app running on port 8080
* SSH security has been hardened with key-based authentication
