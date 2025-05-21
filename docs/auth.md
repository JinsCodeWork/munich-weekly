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
GET /api/votes/check	Public
POST /api/votes	Public
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

---

## 9. Anonymous Voting Mechanism

To allow broader participation, the platform now supports anonymous voting for submissions on the public `/vote` page. This mechanism works alongside the existing authenticated user voting system.

### 9.1. Overview

*   Users do not need to be logged in to cast a vote via the public `/vote` page.
*   To prevent a single anonymous user from voting multiple times for the same submission, a unique `visitorId` is used.

### 9.2. `visitorId` Cookie

*   **Generation**: When a user first visits a page that utilizes the voting feature (specifically, when the `VoteButton` component mounts), the frontend checks for a `visitorId` cookie. If the cookie is not present or is empty, a new UUID v4 is generated and stored in a cookie named `visitorId`. This is handled by the `getOrGenerateVisitorId()` function in `frontend/src/lib/visitorId.ts`.
*   **Usage**:
    *   When checking if an anonymous user has voted for a submission (`GET /api/votes/check`), the `visitorId` from the cookie is sent with the request (implicitly, as cookies are included with `credentials: 'include'`).
    *   When submitting a vote (`POST /api/votes`), the `visitorId` from the cookie is also sent.
*   **Backend Handling**: The backend's `VoteController` reads the `visitorId` from the cookie using `@CookieValue`.
    *   For `POST /api/votes`, if the `visitorId` cookie is missing, a 400 Bad Request ("Missing visitorId cookie.") is returned.
    *   For `GET /api/votes/check`, if the `visitorId` cookie is missing, the backend responds as if the user has not voted (`{"voted": false}`).
*   **Constraint**: The `votes` database table has a unique constraint on the combination of `visitorId` and `submission_id` to enforce the one-vote-per-anonymous-user-per-submission rule.

### 9.3. Backend API Security Configuration

To enable anonymous access to the voting endpoints, the following Spring Security configurations have been applied in `SecurityConfig.java`:

```java
// Example snippet from SecurityConfig.java
.requestMatchers(HttpMethod.POST, "/api/votes").permitAll()
.requestMatchers(HttpMethod.GET, "/api/votes/check").permitAll()
```
This ensures that requests to these specific endpoints do not require JWT authentication, allowing anonymous users (identified by their `visitorId` cookie) to participate in voting. All other protected endpoints still require JWT authentication as described earlier.

## 10. Password Reset Flow

The password reset system enables users to regain access to their accounts when they forget their passwords. This feature utilizes Mailjet email service for delivering secure password reset links.

### 10.1. Overview

*   Users can request a password reset from the login screen by clicking "Forgot password?"
*   A secure, time-limited token is generated and sent via email
*   Users follow the emailed link to set a new password
*   For security, tokens expire after 30 minutes and can only be used once

### 10.2. Implementation Details

*   **Frontend Flow**:
    *   The `LoginForm` component provides a "Forgot password?" link
    *   The `/forgot-password` page allows users to enter their email address
    *   The `/reset-password` page (with token parameter) enables setting a new password

*   **Backend Components**:
    *   `PasswordResetController` handles API endpoints:
        *   `POST /api/auth/forgot-password` - Initiates reset process
        *   `POST /api/auth/reset-password` - Completes password change
    *   `PasswordResetToken` model stores tokens with security controls
    *   `MailjetEmailService` sends password reset emails using Mailjet API

### 10.3. Token Security

*   Tokens are cryptographically secure random strings
*   The system tracks:
    *   Token creation time
    *   Token usage status
    *   User association
*   Tokens expire after 30 minutes (configurable parameter)
*   One-time use: once used, a token cannot be reused

### 10.4. Email Delivery

*   Password reset emails are sent via **Mailjet**, a reliable transactional email service
*   Email templates are responsive and work across all major email clients
*   Both HTML and plaintext versions are provided for maximum compatibility

This secure, user-friendly flow follows industry best practices for account recovery while protecting user security and privacy.
