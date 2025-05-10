# 📚 Database Design

This document outlines the structure of the PostgreSQL database used by the **Munich Weekly** platform.

---

## 📌 Tables

### 🗂️ users

| Column       | Type             | Description            | Remarks                     |
| ------------ | ---------------- | ---------------------- | --------------------------- |
| id           | BIGINT           | User ID (Primary Key)  | Auto-generated              |
| email        | VARCHAR (unique) | Email address          | Used for login              |
| password     | VARCHAR          | Encrypted password     | For email login             |
| nickname     | VARCHAR          | User nickname          |                             |
| avatarUrl    | VARCHAR          | URL of user's avatar   |                             |
| role         | VARCHAR          | User role              | Default: `user`, or `admin` |
| registeredAt | TIMESTAMP        | Registration timestamp | Default current time        |
| isBanned     | BOOLEAN          | Account banned status  | Default: `false`            |

---

### 🗂️ user\_auth\_providers

| Column         | Type        | Description                          | Remarks                |
| -------------- | ----------- | ------------------------------------ | ---------------------- |
| id             | BIGINT      | Primary key                          | Auto-generated         |
| user\_id       | BIGINT (FK) | Linked user ID (users)               | Many-to-one            |
| provider       | VARCHAR     | Auth provider (e.g., Google, WeChat) |                        |
| providerUserId | VARCHAR     | Unique user ID on provider           | Unique with `provider` |
| displayName    | VARCHAR     | Display name from provider           |                        |
| avatarUrl      | VARCHAR     | Avatar URL from provider             | Optional               |
| linkedAt       | TIMESTAMP   | Time linked                          | Default current time   |

---

### 🗂️ issues

| Column          | Type          | Description              | Remarks              |
| --------------- | ------------- | ------------------------ | -------------------- |
| id              | BIGINT        | Issue ID (Primary Key)   | Auto-generated       |
| title           | VARCHAR       | Issue title              |                      |
| description     | VARCHAR(1000) | Description of the issue |                      |
| submissionStart | TIMESTAMP     | Submission period start  |                      |
| submissionEnd   | TIMESTAMP     | Submission period end    |                      |
| votingStart     | TIMESTAMP     | Voting period start      |                      |
| votingEnd       | TIMESTAMP     | Voting period end        |                      |
| createdAt       | TIMESTAMP     | Creation timestamp       | Default current time |

---

### 🗂️ submissions

| Column      | Type          | Description                 | Remarks                                                |
| ----------- | ------------- | --------------------------- | ------------------------------------------------------ |
| id          | BIGINT        | Submission ID (Primary Key) | Auto-generated                                         |
| user\_id    | BIGINT (FK)   | User ID (users table)       | Many-to-one                                            |
| issue\_id   | BIGINT (FK)   | Issue ID (issues table)     | Many-to-one                                            |
| imageUrl    | VARCHAR       | Submission image URL        |                                                        |
| description | VARCHAR(1000) | Submission description      |                                                        |
| isCover     | BOOLEAN       | Cover image status          | Default: `false`                                       |
| status      | VARCHAR       | Review status               | Default: `pending`; `approved`, `rejected`, `selected` |
| submittedAt | TIMESTAMP     | Submission timestamp        | Default current time                                   |
| reviewedAt  | TIMESTAMP     | Review timestamp            | Optional                                               |

---

### 🗂️ votes

| Column         | Type        | Description                       | Remarks              |
| -------------- | ----------- | --------------------------------- | -------------------- |
| id             | BIGINT      | Vote ID (Primary Key)             | Auto-generated       |
| user\_id       | BIGINT (FK) | User ID (users table)             | Many-to-one          |
| submission\_id | BIGINT (FK) | Submission ID (submissions table) | Many-to-one          |
| issue\_id      | BIGINT (FK) | Issue ID (issues table)           | Many-to-one          |
| votedAt        | TIMESTAMP   | Voting timestamp                  | Default current time |

**Unique Constraint:** Each user can vote only once per submission.

---

## 🔗 Relationships

* **User ↔️ Submission** *(one-to-many)*
* **Issue ↔️ Submission** *(one-to-many)*
* **User ↔️ Vote** *(one-to-many)*
* **Submission ↔️ Vote** *(one-to-many)*
* **Issue ↔️ Vote** *(one-to-many)*
* **User ↔️ UserAuthProvider** *(one-to-many)*

---
