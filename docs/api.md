# API Endpoints

## UserController

- **POST** `/api/users/change-password`
  > Change the authenticated user's password.

  > **Params**: `ChangePasswordRequestDTO dto`
- **GET** `/api/users`
  > Get a list of all users. Admin only.
- **GET** `/api/users/me`
  > Get the profile of the currently authenticated user. Requires JWT token.
- **PATCH** `/api/users/me`
  > Update the authenticated user's nickname and avatar.

  > **Params**: `UserUpdateRequestDTO dto`

## VoteController

- **POST** `/api/votes`
  > Submit a vote for a submission. Uses visitorId from cookie.

  > **Params**: `Long submissionId, String visitorId, HttpServletRequest request`
- **GET** `/api/votes/check`
  > Check if current visitor has voted for a submission.

  > **Params**: `Long submissionId, String visitorId`

## SubmissionController

- **POST** `/api/submissions`
  > Submit a new photo to a specific issue. Requires authentication.

  > **Params**: `SubmissionRequestDTO dto`
- **GET** `/api/submissions`
  > Get all approved submissions under a given issue, including vote counts.

  > **Params**: `Long issueId`
- **GET** `/api/submissions/mine`
  > Get the current user's own submissions, optionally filtered by issue.

  > **Params**: `Long issueId`
- **GET** `/api/submissions/all`
  > Get all submissions for an issue, regardless of status. Admin only.

  > **Params**: `Long issueId`
- **PATCH** `/api/submissions/{id}/approve`
  > Approve a submission by ID. Admin only.

  > **Params**: `Long id`
- **PATCH** `/api/submissions/{id}/reject`
  > Reject a submission by ID. Admin only.

  > **Params**: `Long id`
- **PATCH** `/api/submissions/{id}/select`
  > Select a submission as featured. Admin only.

  > **Params**: `Long id`

## AuthController

- **POST** `/api/auth/register`
  > Register a new user with email, password, and nickname. Returns JWT token

  > **Params**: `UserRegisterRequestDTO dto`
- **POST** `/api/auth/login/provider`
  > Login with a third-party provider (e.g. Google). Auto-creates user on first login

  > **Params**: `UserAuthProviderLoginRequestDTO dto`
- **GET** `/api/auth/providers`
  > Get all third-party providers linked to the current logged-in user
- **POST** `/api/auth/login/email`
  > Login with email and password, returns JWT token and user info

  > **Params**: `EmailLoginRequestDTO dto`
- **POST** `/api/auth/bind`
  > Bind a third-party provider (e.g. Google or WeChat) to the currently logged-in user

  > **Params**: `BindRequestDTO dto`
- **DELETE** `/api/auth/bind/{provider}`
  > Unbind a third-party provider from the current user. Example: DELETE /api/auth/bind/google

  > **Params**: `String provider`

## IssueController

- **POST** `/api/issues`
  > Create a new issue. Admin only. Accepts title, description, and submission/voting periods

  > **Params**: `IssueCreateRequestDTO dto`
- **GET** `/api/issues`
  > Get all issues in the system

