# API Endpoints

This document provides a comprehensive reference for all API endpoints in the Munich Weekly platform.

## 📚 Documentation Navigation

**Security Implementation:** See [Authentication & Security](./auth.md) for complete security details

**Related Documentation:**
- 🔐 [Security Summary](./security-summary.md) - Security overview and authentication requirements
- 🏠 [Project Overview](../README.md) - Platform features and architecture
- 🚀 [Deployment Guide](./deployment.md) - Production API configuration
- 📱 [Frontend Overview](./frontend-overview.md) - Client-side API integration
- 🛡️ [Privacy Policy](./privacy.md) - Data handling and GDPR compliance

## 🔐 Authentication Requirements

Most endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

**Public Endpoints:** No authentication required
- All `/api/auth/**` endpoints (login, register, password reset)
- `GET /api/issues` - Public issue listing
- `GET /api/submissions` - Public approved submissions
- Voting endpoints (`/api/votes/**`) - Anonymous voting with visitorId cookie

**Authenticated Endpoints:** Require valid JWT token
- User management (`/api/users/**`)
- Submission management (POST, PATCH, DELETE)
- Account operations

**Admin-Only Endpoints:** Require admin role
- User administration
- Submission approval/rejection
- **Issue management** (create, edit, get details)

For detailed security implementation, see [Authentication & Security](./auth.md).

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
- **DELETE** `/api/votes`
  > Cancel/delete a vote for a submission. Uses userId for authenticated users, visitorId for anonymous users.

  > **Params**: `Long submissionId, String visitorId`
- **GET** `/api/votes/check`
  > Check if current user has voted for a submission.

  > **Params**: `Long submissionId, String visitorId`
- **GET** `/api/votes/check-batch`
  > Batch check vote status for multiple submissions. Optimizes performance by reducing API calls from N to 1.

  > **Params**: `List<Long> submissionIds, String visitorId`
  
  > **Response**: 
  > ```json
  > {
  >   "votedSubmissionIds": [123, 456, 789]
  > }
  > ```

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
  > Select a submission as featured. Admin only. Multiple submissions can be selected for the same issue.

  > **Params**: `Long id`
- **GET** `/api/submissions/download-selected/{issueId}`
  > Download all selected submissions for an issue as a ZIP file. Admin only. 
  > 
  > Downloads original uncompressed images directly from storage (bypassing CDN optimization).
  > Files are renamed for better organization: `001_UserNickname_SubmissionId.jpg`
  > Includes a summary text file with submission details.

  > **Params**: `Long issueId`
  
  > **Response**: ZIP file download with filename format: `{IssueTitle}_selected_submissions.zip`
  
  > **Errors**: 
  > - `404`: Issue not found
  > - `204`: No selected submissions found for this issue
- **DELETE** `/api/submissions/{id}`
  > Delete a submission by ID. User can only delete their own submissions.

  > **Params**: `Long id`
- **GET** `/api/submissions`
  > Get approved submissions for a specific issue (public endpoint)

  > **Query Params**: `issueId` (required)
  
  > **Response**: ✨ **ENHANCED** with stored image dimensions
  > ```json
  > [
  >   {
  >     "id": 10,
  >     "imageUrl": "https://img.munichweekly.art/uploads/issues/1/submissions/1_10_20250606-182805.jpg",
  >     "description": "Photo description",
  >     "nickname": "User123",
  >     "submittedAt": "2024-01-01T12:00:00",
  >     "voteCount": 42,
  >     "imageWidth": 3648,     // ✨ NEW: Stored image width
  >     "imageHeight": 5472,    // ✨ NEW: Stored image height
  >     "aspectRatio": 0.666667 // ✨ NEW: Precomputed aspect ratio
  >   }
  > ]
  > ```
  
  > **Performance**: Eliminates need for client-side dimension calculation

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

- **GET** `/api/issues`
  > Get all issues in the system (public endpoint - no authentication required)

- **GET** `/api/issues/{id}`
  > Get a specific issue by ID. Admin only.

  > **Params**: `Long id`
  
  > **Response**: Issue object with all details including title, description, and time periods

- **POST** `/api/issues`
  > Create a new issue. Admin only. Accepts title, description, and submission/voting periods

  > **Params**: `IssueCreateRequestDTO dto`
  
  > **Request Body**:
  > ```json
  > {
  >   "title": "Weekly Issue Title",
  >   "description": "Issue description and guidelines",
  >   "submissionStart": "2024-01-01T00:00:00",
  >   "submissionEnd": "2024-01-07T23:59:59",
  >   "votingStart": "2024-01-08T00:00:00",
  >   "votingEnd": "2024-01-14T23:59:59"
  > }
  > ```

- **PUT** `/api/issues/{id}`
  > Update an existing issue. Admin only. Allows editing title, description, and all time periods

  > **Params**: `Long id, IssueUpdateRequestDTO dto`
  
  > **Request Body**: Same format as create, all fields are editable
  
  > **Validation**: Ensures logical time ordering (submission before voting, start before end dates)

## SubmissionController ✨ **ENHANCED**

- **GET** `/api/submissions`
  > Get approved submissions for a specific issue (public endpoint)

  > **Query Params**: `issueId` (required)
  
  > **Response**: ✨ **ENHANCED** with stored image dimensions
  > ```json
  > [
  >   {
  >     "id": 10,
  >     "imageUrl": "https://img.munichweekly.art/uploads/issues/1/submissions/1_10_20250606-182805.jpg",
  >     "description": "Photo description",
  >     "nickname": "User123",
  >     "submittedAt": "2024-01-01T12:00:00",
  >     "voteCount": 42,
  >     "imageWidth": 3648,     // ✨ NEW: Stored image width
  >     "imageHeight": 5472,    // ✨ NEW: Stored image height
  >     "aspectRatio": 0.666667 // ✨ NEW: Precomputed aspect ratio
  >   }
  > ]
  > ```
  
  > **Performance**: Eliminates need for client-side dimension calculation

## AdminMigrationController ✨ **NEW**

**Admin-only endpoints for managing image dimension data migration**

- **GET** `/api/admin/migration/analyze`
  > Analyze submissions requiring dimension migration. Returns statistics without executing migration.

  > **Authorization**: Admin JWT token required
  
  > **Response**:
  > ```json
  > {
  >   "totalSubmissions": 150,
  >   "submissionsWithDimensions": 120,
  >   "submissionsNeedingMigration": 30,
  >   "optimizationPercentage": 80.0,
  >   "estimatedDuration": "5-10 minutes"
  > }
  > ```

- **POST** `/api/admin/migration/start`
  > Begin dimension migration for submissions without stored dimensions

  > **Authorization**: Admin JWT token required
  
  > **Request Body**:
  > ```json
  > {
  >   "batchSize": 10,        // 1-20 submissions per batch
  >   "delaySeconds": 5       // 1-30 seconds delay between batches
  > }
  > ```
  
  > **Response**:
  > ```json
  > {
  >   "message": "Migration started successfully",
  >   "migrationId": "mig_20240101_120000",
  >   "estimatedCompletion": "2024-01-01T12:10:00"
  > }
  > ```

- **POST** `/api/admin/migration/stop`
  > Stop active migration process safely

  > **Authorization**: Admin JWT token required
  
  > **Response**:
  > ```json
  > {
  >   "message": "Migration stopped successfully",
  >   "processed": 25,
  >   "remaining": 5,
  >   "finalStatus": "STOPPED_BY_ADMIN"
  > }
  > ```

- **GET** `/api/admin/migration/status`
  > Get real-time migration status and progress

  > **Authorization**: Admin JWT token required
  
  > **Response**:
  > ```json
  > {
  >   "isActive": true,
  >   "progress": {
  >     "totalItems": 30,
  >     "processedItems": 15,
  >     "successCount": 14,
  >     "failureCount": 1,
  >     "percentageComplete": 50.0
  >   },
  >   "currentBatch": 3,
  >   "estimatedTimeRemaining": "00:05:30",
  >   "lastProcessedAt": "2024-01-01T12:05:30"
  > }
  > ```

## PasswordResetController

- **POST** `/api/auth/reset-password`

  > **Params**: `ResetPasswordRequestDTO dto`
- **POST** `/api/auth/forgot-password`

  > **Params**: `ForgotPasswordRequestDTO dto`

## Promotion API

Endpoints for managing and viewing promotions.

### Public Endpoints

- `GET /api/promotion/config`: Retrieves the currently enabled promotion configuration for the navigation link.
- `GET /api/promotion/page/{pageUrl}`: Retrieves the full content (config and images) for a public promotion page.

### Admin Endpoints

All admin endpoints require `admin` authority and are prefixed with `/api/promotion/admin`.

- `GET /configs`: Get a list of all promotion configurations.
- `GET /config/{id}`: Get a specific promotion configuration by its ID.
- `PUT /config`: Create or update a promotion configuration.
- `DELETE /config/{id}`: Delete a promotion configuration and its associated images.
- `GET /images?configId={id}`: Get all images for a specific configuration.
- `POST /images`: Create a new image record.
- `POST /images/{imageId}/upload`: Upload a file for an image record.
- `DELETE /images/{imageId}`: Delete an image record and its file.

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

