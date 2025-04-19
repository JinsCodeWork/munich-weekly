# 📸 Munich Weekly 慕城摄影周刊平台

A web-based photography submission and voting platform for students studying in Munich.  
This project is built with **Spring Boot + PostgreSQL + Next.js**, and deployed on a German Hetzner Cloud server.

---

## 🌟 Project Highlights

- Users can **submit photos** to a weekly issue
- Photos go through an **approval** process before public display
- Authenticated users can **vote for submissions** (named voting)
- Backend admin tools include: submission review, user management, CSV export
- Secure and clean architecture with API-first design

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js + TypeScript |
| Backend | Java 21 + Spring Boot 3 |
| Database | PostgreSQL (via Docker) |
| Auth | Email or WeChat login (TBD) |
| File Storage | OSS or S3-compatible |
| Hosting | Hetzner Cloud (Germany) |
| Domain | [munichweekly.art](https://munichweekly.art) |

---

## 🧱 Project Structure

```text
munich-weekly/
├── backend/       # Java Spring Boot application
├── frontend/      # Next.js static web frontend
├── db/            # SQL backups, scripts
└── README.md      # You are here
```

---

## 📦 Local Development

> Requirements: Java 21, Node.js v22+, Docker

```bash
# Start database
cd backend
docker compose up -d

# Run backend
./gradlew bootRun

# Run frontend
cd ../frontend
npm install
npm run dev


⸻

🔗 API Overview

📚 IssueController

Method	Endpoint	Auth	Description
GET	/api/issues	None	Get all issues



⸻

📸 SubmissionController

Method	Endpoint	Auth	Description
POST	/api/submissions	Login	Submit a photo
GET	/api/submissions?issueId=...	Login	Get all approved submissions with vote counts
PATCH	/api/submissions/{id}/approve	Admin	Approve a submission
PATCH	/api/submissions/{id}/reject	Admin	Reject a submission



⸻

👤 UserController

Method	Endpoint	Auth	Description
GET	/api/users	Admin (TBD)	Get all registered users



⸻

🗳️ VoteController

Method	Endpoint	Auth	Description
POST	/api/votes?submissionId=...	Login	Cast a vote for a submission



⸻
```
## 🔐 Authentication & Security

The backend system uses a stateless JWT-based authentication and role-based access control (RBAC) mechanism to protect API endpoints and manage user identity.

### 📦 Package Structure
```
backend/src/main/java/com/munichweekly/backend/security/
├── CurrentUserUtil.java               # Utility to access the authenticated user
├── CustomAccessDeniedHandler.java    # Handles 403 Forbidden responses
├── CustomAuthenticationEntryPoint.java # Handles 401 Unauthorized responses
├── JwtAuthenticationFilter.java      # Extracts and verifies JWT from headers
├── JwtUtil.java                      # JWT generation and parsing utility
└── SecurityConfig.java               # Main Spring Security configuration
```
---

### 🔑 Features

- **JWT Authentication**
  - Stateless login system
  - Token generated after login, sent in `Authorization: Bearer <token>`
  - Token contains user ID and expiration

- **User Identity Injection**
  - Valid token automatically injects the user into Spring Security Context
  - Available in backend via `CurrentUserUtil.getUser()` or `getUserIdOrThrow()`

- **Authorization with `@PreAuthorize`**
  - Role-based access to API methods (`admin`, `user`)
  - Examples:
    - `@PreAuthorize("hasAuthority('admin')")`
    - `@PreAuthorize("hasAnyAuthority('user', 'admin')")`

- **Public / Protected Route Configuration**
  - Configurable with `.permitAll()`, `.hasAuthority(...)`, etc.
  - Examples:
    - `GET /api/issues` is public
    - `POST /api/submissions` requires login

- **Unified Error Handling**
  - `401 Unauthorized` → handled by `CustomAuthenticationEntryPoint`
  - `403 Forbidden` → handled by `CustomAccessDeniedHandler`
  - Responses returned in standard JSON format

---

### 🧪 Available Security Endpoints

| Endpoint | Method | Auth Required | Description |
|----------|--------|----------------|-------------|
| `/api/auth/login` | POST | ❌ | User login with email/password or provider |
| `/api/users/me`   | GET  | ✅ (`user` or `admin`) | Get current authenticated user's info |
| `/api/submissions` | GET | ❌ | Public view of approved submissions |
| `/api/submissions` | POST | ✅ | Submit a photo (must be logged in) |
| `/api/votes` | POST | ✅ | Vote on a submission |
| `/api/issues` | GET | ❌ | View list of issues |
| `/api/issues` | POST | ✅ (`admin`) | Create a new issue |

---

### 🔐 Example Token Usage (Postman)

1. Login via `/api/auth/login` and obtain a token.
2. Use this token in headers for all protected endpoints:

Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6…

---

### ✅ Best Practices

- Always validate token in backend before trusting user identity.
- Use `@PreAuthorize` to secure sensitive methods.
- For frontend: clear token on logout (stateless logout).
- Consider enabling token expiration and refresh mechanisms (future enhancement).

---

🚧 To Do (Coming Soon)
	•	Email / WeChat login support
	•	Submission image upload to OSS
	•	Voting limits (max N votes per issue)
	•	Admin dashboard UI

⸻

📬 Contact

Project lead: Dongkai Jin
Maintained in Munich, Germany 🇩🇪
GitHub: github.com/JinsCodeWork/munich-weekly

---
