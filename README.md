# 📸 Munich Weekly 慕城摄影周刊平台

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

- 🧭 [Deployment Guide](./docs/deployment.md)
- 📦 [API Reference](./docs/api.md)
- 🗃️ [Database Design](./docs/database.md)
- 👤 [User Guide](./docs/user-guide.md)
- 🧑‍💻 [Developer Guide](./docs/dev-guide.md)
- 🔐 [Auth & Security](./docs/auth.md)

⸻

🧑‍💼 Project Lead

Dongkai Jin · Munich, Germany 🇩🇪
- GitHub: JinsCodeWork
- EMail: dongkai.jin@tum.de
