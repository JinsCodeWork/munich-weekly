# 📸 Munich Weekly Photography Platform

A web-based platform for weekly photography submission and voting, built for students in Munich.

---

## 🌟 Key Features

- 📷 Submit photos for weekly issues
- 🧾 Submissions go through review and approval
- 🗳️ Authenticated users can vote (named voting)
- ⚙️ Admin tools for managing users, reviewing entries, exporting data
- 🔐 JWT-based authentication with role-based access control

---

## 🛠️ Tech Stack

| Layer     | Technology                |
|----------|----------------------------|
| Frontend | Next.js + TypeScript       |
| Backend  | Java 21 + Spring Boot 3    |
| Database | PostgreSQL (via Docker)    |
| Auth     | Email & Google login       |
| Hosting  | Hetzner Cloud (Germany)    |
| Domain   | [munichweekly.art](https://munichweekly.art) |

---

## 📂 Project Structure

```
munich-weekly/
├── backend/       # Spring Boot application
├── frontend/      # Next.js frontend
├── db/            # SQL init/backup scripts
└── docs/          # Project documentation
```

---

## 📚 Documentation

### General Documentation
- 🧭 [Deployment Guide](./docs/deployment.md)
- 📊 [Server Changelog](./docs/server-changelog.md)
- 📦 [API Reference](./docs/api.md)
- 🗃️ [Database Design](./docs/database.md)
- 👤 [User Guide](./docs/user-guide.md)
- 🧑‍💻 [Developer Guide](./docs/dev-guide.md)
- 🔐 [Auth & Security](./docs/auth.md)
- 🔒 [Privacy and Cookies](./docs/privacy.md)

### Frontend Documentation
- 📱 [Frontend Overview](./docs/frontend-overview.md)
- 🏗️ [Frontend Architecture](./docs/frontend-architecture.md)
- 🧩 [UI Component Library](./docs/ui-components.md)
- 🎨 [Style System](./docs/style-system.md)

⸻

🧑‍💼 Project Lead

Dongkai Jin · Munich, Germany 🇩🇪
- GitHub: JinsCodeWork
- Email: dongkai.jin@tum.de
