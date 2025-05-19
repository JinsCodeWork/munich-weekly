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
  > Submit a vote for a submission. Uses userId for authenticated users, visitorId for anonymous users.

  > **Params**: `Long submissionId, String visitorId, HttpServletRequest request`
- **GET** `/api/votes/check`
  > Check if current user has voted for a submission.

  > **Params**: `Long submissionId, String visitorId`

## SubmissionController

- **POST** `/api/submissions`
  > Submit a new photo to a specific issue. Requires authentication.

  > **Params**: `SubmissionRequestDTO dto`
- **PATCH** `/api/submissions/{id}/approve`
  > Approve a submission by ID. Admin only.

  > **Params**: `Long id`
- **PATCH** `/api/submissions/{id}/reject`
  > Reject a submission by ID. Admin only.

  > **Params**: `Long id`
- **PATCH** `/api/submissions/{id}/select`
  > Select a submission as featured. Admin only.

  > **Params**: `Long id`
- **GET** `/api/submissions`
  > Get all approved submissions under a given issue, including vote counts.

  > **Params**: `Long issueId`
- **GET** `/api/submissions/mine`
  > Get the current user's own submissions, optionally filtered by issue.

  > **Params**: `Long issueId`
- **GET** `/api/submissions/all`
  > Get all submissions for an issue, regardless of status. Admin only.

  > **Params**: `Long issueId`

## AuthController

- **POST** `/api/auth/register`
  > Register a new user with email, password, and nickname. Returns JWT token

  > **Params**: `UserRegisterRequestDTO dto`
- **POST** `/api/auth/login/email`
  > Login with email and password, returns JWT token and user info

  > **Params**: `EmailLoginRequestDTO dto`
- **POST** `/api/auth/login/provider`
  > Login with a third-party provider (e.g. Google). Auto-creates user on first login

  > **Params**: `UserAuthProviderLoginRequestDTO dto`
- **POST** `/api/auth/bind`
  > Bind a third-party provider (e.g. Google or WeChat) to the currently logged-in user

  > **Params**: `BindRequestDTO dto`
- **GET** `/api/auth/providers`
  > Get all third-party providers linked to the current logged-in user
- **DELETE** `/api/auth/bind/{provider}`
  > Unbind a third-party provider from the current user. Example: DELETE /api/auth/bind/google

  > **Params**: `String provider`

## FileUploadController

- **POST** `/api/submissions/{submissionId}/upload`
  > Upload an image file for a specific submission. The image will be stored in local or cloud storage based on the environment, and the submission's imageUrl will be updated.

  > **Params**: `String submissionId, MultipartFile file`
- **GET** `/api/submissions/{submissionId}/check-image`
  > Check if an image exists for a submission. Returns true/false along with the image URL if it exists.

  > **Params**: `String submissionId`
- **GET** `/api/submissions/{submissionId}/direct-image`
  > Get the actual image binary data for a submission, bypassing the normal URL. Used primarily for local storage access.

  > **Params**: `String submissionId`

## StorageController

- **GET** `/api/storage/info`
  > Get information about the current storage configuration. Admin only.
  
  > Returns mode (LOCAL/R2), status, and configuration details.

- **GET** `/api/storage/status`
  > Check the health and connectivity of the configured storage system. Admin only.
  
  > Returns connectivity status, performance metrics, and error details if any.

## IssueController

- **POST** `/api/issues`
  > Create a new issue. Admin only. Accepts title, description, and submission/voting periods

  > **Params**: `IssueCreateRequestDTO dto`
- **GET** `/api/issues`
  > Get all issues in the system

