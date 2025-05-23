# API Endpoints

## UserController

- **POST** `/api/users/change-password`
  > Change the authenticated user's password.

  > **Params**: `ChangePasswordRequestDTO dto`
- **DELETE** `/api/users/me`
  > Delete the currently authenticated user and all their data.
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
- **DELETE** `/api/submissions/{id}`
  > Delete a submission by ID. User can only delete their own submissions.

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
- **POST** `/api/submissions/admin/upload-hero`
  > Upload hero image for homepage. Admin only. The image will be saved as /uploads/hero.jpg, replacing any existing file.

  > **Params**: `MultipartFile file`
- **GET** `/api/submissions/{submissionId}/check-image`

  > **Params**: `String submissionId`
- **GET** `/api/submissions/{submissionId}/direct-image`

  > **Params**: `String submissionId`

  > **Params**: `String arg0`

  > **Params**: `String arg0`

  > **Params**: `String arg0`

## IssueController

- **POST** `/api/issues`
  > Create a new issue. Admin only. Accepts title, description, and submission/voting periods

  > **Params**: `IssueCreateRequestDTO dto`
- **GET** `/api/issues`
  > Get all issues in the system

## PasswordResetController

- **POST** `/api/auth/reset-password`

  > **Params**: `ResetPasswordRequestDTO dto`
- **POST** `/api/auth/forgot-password`

  > **Params**: `ForgotPasswordRequestDTO dto`

---

## Frontend API Endpoints

The frontend also provides its own API routes for configuration management and real-time updates:

## Configuration Controller

- **GET** `/frontend-api/config`
  > Get homepage configuration (public endpoint). Supports ETag caching and force refresh.
  
  > **Query Params**: 
  > - `_t`: Timestamp for cache busting
  > - `_force`: Set to '1' to force refresh and bypass cache
  
  > **Response**: 
  > ```json
  > {
  >   "success": true,
  >   "config": {
  >     "heroImage": {
  >       "imageUrl": "/images/home/hero.jpg",
  >       "description": "Main description text",
  >       "imageCaption": "Image caption"
  >     },
  >     "lastUpdated": "2024-01-01T00:00:00.000Z"
  >   }
  > }
  > ```

- **GET** `/frontend-api/admin/config`
  > Get homepage configuration (admin endpoint). Requires admin authentication.
  
  > **Headers**: `Authorization: Bearer {jwt_token}`
  
  > **Response**: Same as public config endpoint

- **POST** `/frontend-api/admin/config`
  > Update homepage configuration. Admin only. Triggers real-time updates across all connected clients.
  
  > **Headers**: `Authorization: Bearer {jwt_token}`
  
  > **Body**:
  > ```json
  > {
  >   "heroImage": {
  >     "imageUrl": "/images/home/hero.jpg",
  >     "description": "Updated description",
  >     "imageCaption": "Updated caption"
  >   }
  > }
  > ```
  
  > **Response**:
  > ```json
  > {
  >   "success": true,
  >   "message": "Configuration updated successfully",
  >   "config": { /* updated config */ }
  > }
  > ```

## Admin Upload Controller

- **POST** `/frontend-api/admin/upload`
  > Upload files through frontend proxy to backend. Admin only. Forwards requests to backend API.
  
  > **Headers**: `Authorization: Bearer {jwt_token}`
  
  > **Body**: `FormData` with file and metadata

- **POST** `/frontend-api/admin/sync-hero`
  > Sync hero image from backend to frontend directory. Admin only. Ensures image availability for static serving.
  
  > **Headers**: `Authorization: Bearer {jwt_token}`
  
  > **Body**:
  > ```json
  > {
  >   "imageUrl": "/uploads/hero.jpg"
  > }
  > ```
  
  > **Response**:
  > ```json
  > {
  >   "success": true,
  >   "message": "Hero image synced successfully to frontend",
  >   "localPath": "/images/home/hero.jpg",
  >   "sourceType": "backend-file"
  > }
  > ```

## Real-time Update Features

The frontend API endpoints support real-time content synchronization:

- **Event-driven Updates**: Configuration changes trigger custom events for immediate UI updates
- **Cross-tab Communication**: Uses localStorage events to sync updates across browser tabs  
- **Cache Management**: Automatic cache busting with version parameters on image URLs
- **Smart Polling**: 30-second fallback polling for missed events
- **Error Handling**: Graceful degradation with retry mechanisms

