# 📸 Munich Weekly 慕城摄影周刊平台

A web-based photography submission and voting platform for Chinese students studying in Munich.  
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

munich-weekly/
├── backend/       # Java Spring Boot application
├── frontend/      # Next.js static web frontend
├── db/            # SQL backups, scripts
└── README.md      # You are here

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

🚧 To Do (Coming Soon)
	•	JWT-based user authentication
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
