# 🔐 Authentication & Security

This document explains how authentication and authorization work in the **Munich Weekly** backend system.

---

## 1. Overview

- All protected endpoints require a valid JWT token.
- Users can log in via **email/password** or **third-party providers** (e.g., Google).
- Authenticated users receive a signed token, which they must include in the `Authorization` header.

---

## 2. Auth Flow

```plaintext
[ Register/Login ]
       ↓
[ Get JWT Token ]
       ↓
[ Include token in Authorization header ]
       ↓
[ Access protected endpoints ]

Example header:

Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI...
```

---

## 3. Public vs Protected Endpoints

```plaintext
Endpoint	Access
POST /api/auth/login/email	Public
POST /api/auth/register	Public
GET /api/issues	Public
GET /api/users/me	Authenticated
POST /api/submissions	Authenticated
PATCH /api/submissions/{id}	Admin only
```


---

## 4. Token Format
```
Header:

{
  "alg": "HS256",
  "typ": "JWT"
}

Payload:

{
  "sub": "42",        // user ID
  "iat": 1714600000,
  "exp": 1714686400
}
```
	•	sub is the user ID (primary key)
	•	iat is issue time; exp is expiry time

---

## 5. Utilities

### JwtUtil
	•	generateToken(Long userId) — create a signed token
	•	parseToken(String token) — extract payload
	•	extractUserId(token) — returns Long

### CurrentUserUtil
	•	getUser() — returns the current User object
	•	getUserIdOrThrow() — returns ID or throws 401

---

## 6. Error Responses

| Scenario                     | HTTP Code | JSON Response                                  |
|-----------------------------|-----------|------------------------------------------------|
| No token / malformed token  | 401       | `{ "error": "Unauthorized - Please login first." }` |
| No permission (e.g. non-admin) | 403       | `{ "error": "Forbidden - You do not have permission." }` |

---

## 7. Security Filter

The JwtAuthenticationFilter:
	•	Intercepts all requests.
	•	Extracts token from the Authorization header.
	•	Validates and parses the token.
	•	Injects the authenticated user into the Spring SecurityContext.

⸻

## 8. Roles
	•	user: Can vote, view own profile, submit photos.
	•	admin: Can manage issues, approve/reject submissions, see all users.
