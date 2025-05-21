# 📸 Munich Weekly Photography Platform

A web-based platform for weekly photography submission and voting, built for students in Munich.

---

## 🌟 Key Features

- 📷 Submit photos for weekly issues
- 🧾 Submissions go through review and approval
- 🗳️ Authenticated users can vote (named voting)
- ⚙️ Admin tools for managing users, reviewing entries, exporting data
- 🔐 JWT-based authentication with role-based access control and password recovery
- 🖼️ Advanced image optimization and on-demand processing

---

## 🛠️ Tech Stack

| Layer     | Technology                |
|----------|----------------------------|
| Frontend | Next.js + TypeScript       |
| Backend  | Java 21 + Spring Boot 3    |
| Database | PostgreSQL (via Docker)    |
| Auth     | Email & Google login       |
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

### General Documentation
- 🧭 [Deployment Guide](./docs/deployment.md)
- 📦 [API Reference](./docs/api.md)
- 🗃️ [Database Design](./docs/database.md)
- 💾 [Storage System](./docs/storage.md)
- 🖼️ [Image CDN System](./docs/image-cdn.md)
- 👤 [User Guide](./docs/user-guide.md)
- 🧑‍💻 [Developer Guide](./docs/dev-guide.md)
- 🔐 [Auth & Security](./docs/auth.md)
- 🔒 [Privacy and Cookies](./docs/privacy.md)

### Frontend Documentation
- 📱 [Frontend Overview](./docs/frontend-overview.md)
- 🏗️ [Frontend Architecture](./docs/frontend-architecture.md)
- 🧩 [UI Component Library](./docs/ui-components.md)
- 🎨 [Style System](./docs/style-system.md) - *Updated with enhanced typography system*

⸻

🧑‍💼 Project Lead

Dongkai Jin · Munich, Germany 🇩🇪
- GitHub: JinsCodeWork
- Email: dongkai.jin@tum.de
