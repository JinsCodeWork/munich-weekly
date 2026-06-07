# 📸 Munich Weekly Photography Platform

A web-based platform for weekly photography submission and voting, built for students in Munich.

---

## 🌟 Key Features

- 📷 Submit photos for weekly issues
- 🧾 Submissions go through review and approval
- 🗳️ Anonymous public voting with historical results viewing
- ⚙️ Admin tools for managing users, reviewing entries, exporting data
- 🔐 JWT-based authentication with role-based access control and password recovery
- 🖼️ Advanced image optimization and on-demand processing
- ⚡ Performance optimizations: 60-75% faster mobile loading, 95% reduction in vote API calls

---

## 🛠️ Tech Stack

| Layer     | Technology                |
|----------|----------------------------|
| Frontend | Next.js + TypeScript       |
| Backend  | Java 21 + Spring Boot 3    |
| Database | PostgreSQL (via Docker)    |
| Auth     | Email login + provider auth APIs |
| Storage  | Local & Cloudflare R2      |
| CDN      | Cloudflare Workers + Images |
| Hosting  | Hetzner Cloud (Germany)    |
| Domain   | [munichweekly.art](https://munichweekly.art) |

---

## 📂 Project Structure

```
munich-weekly/
├── backend/       # Spring Boot application
├── frontend/      # Next.js frontend
├── image-worker/  # Cloudflare Worker for image processing
├── db/            # SQL init/backup scripts
└── docs/          # Project documentation
```

---

## 📚 Documentation

**📑 [Complete Documentation Index](./docs/index.md)** - Navigate all documentation from one place

### 🚀 Getting Started
- 🧪 [Local Development](./docs/local-development.md) - Run PostgreSQL, backend, and frontend locally
- 🧭 [Deployment Guide](./docs/deployment.md) - Production deployment instructions for Hetzner Cloud
- ⚙️ [Environment Variables](./docs/environment.md) - Current backend/frontend environment variable reference
- 🤝 [Contributing Guide](./docs/contributing.md) - GitHub Flow workflow for developers
- 👤 [User Guide](./docs/user-guide.md) - End-user documentation

### 🔐 Security & Privacy
- 🔐 [Authentication & Security](./docs/auth.md) - Complete security implementation guide
- 🔒 [Security Summary](./docs/security-summary.md) - Executive overview of security posture
- 🛡️ [Privacy Policy](./docs/privacy.md) - GDPR-compliant privacy documentation

### 🏗️ Architecture & API
- 📦 [API Reference](./docs/api.md) - OpenAPI schema and generation workflow
- 🗃️ [Database Design](./docs/database.md) - Database schema and design decisions
- 💾 [Storage System](./docs/storage.md) - File storage architecture (Local + Cloudflare R2)
- 🖼️ [Image CDN System](./docs/image-cdn.md) - Advanced image optimization pipeline

### 📱 Frontend Development
- 📱 [Frontend Overview](./docs/frontend-overview.md) - Architecture and features overview
- 🏗️ [Frontend Architecture](./docs/frontend-architecture.md) - Detailed technical architecture
- 🧩 [UI Component Library](./docs/ui-components.md) - Component specifications and usage
- 🎨 [Style System](./docs/style-system.md) - Typography and styling framework
---

## 📄 License & Usage

This project is licensed under **Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0)**.

### 🔒 Permitted Use
- ✅ View and study the source code
- ✅ Clone or fork for personal/academic use
- ✅ Share unmodified copies with attribution

### 🚫 Prohibited Use
- ❌ **Commercial use** of any kind
- ❌ **Public deployment** without written permission
- ❌ **Modification or rebranding** for distribution

### 📌 Trademark Notice
"Munich Weekly®" and associated branding are registered trademarks. Unauthorized use is prohibited.

**Full license terms**: See [LICENSE](./LICENSE) file  
**Commercial inquiries**: contact@munichweekly.art

⸻

🧑‍💼 Project Lead

Dongkai Jin · Munich, Germany 🇩🇪
- GitHub: JinsCodeWork
- Email: dongkai.jin@tum.de
