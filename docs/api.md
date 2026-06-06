# API Endpoints

## GalleryIssueAdminController

- **POST** `/api/gallery/admin/configs`

  > **Params**: `GalleryIssueConfigRequestDTO requestDTO`
- **GET** `/api/gallery/admin/issues/{issueId}/selected`

  > **Params**: `Long issueId`
  > Returns selected submission candidates for the issue. Custom admin images are not returned here.
- **GET** `/api/gallery/admin/issues/available`
- **PUT** `/api/gallery/admin/issues/{issueId}`

  > **Params**: `Long issueId, GalleryIssueConfigRequestDTO requestDTO`
- **DELETE** `/api/gallery/admin/issues/{issueId}`

  > **Params**: `Long issueId`
- **GET** `/api/gallery/admin/issues/{issueId}`

  > **Params**: `Long issueId`
- **GET** `/api/gallery/admin/issues/{issueId}/items`

  > **Params**: `Long issueId`
  > Returns the ordered mixed gallery item list for admin management. Response includes both `items` and legacy `submissions` keys containing `GallerySubmissionOrderResponseDTO[]`.
- **PUT** `/api/gallery/admin/issues/{issueId}/order`

  > **Params**: `Long issueId, List orderRequests`
  > Each order request supports `galleryOrderId`, `submissionId`, `itemType`, and `displayOrder`. Submission rows use `itemType=SUBMISSION` and a `submissionId`; custom image rows use `itemType=CUSTOM_IMAGE` and the existing `galleryOrderId`.
- **POST** `/api/gallery/admin/issues/{issueId}/cover`

  > **Params**: `Long issueId, MultipartFile file`
- **POST** `/api/gallery/admin/issues/{issueId}/custom-images`

  > **Params**: `Long issueId, MultipartFile file, String title, String description`
  > Uploads an administrator-managed gallery image, extracts dimensions through the storage service, appends it to the issue gallery order, and returns the created `GallerySubmissionOrderResponseDTO` as `item`.
- **GET** `/api/gallery/admin/configs`

## AdminMigrationController


  > **Params**: `Submission arg0`

  > **Params**: `List batch`

  > **Params**: `List batch`

  > **Params**: `int batchSize, int delayMs, Long issueId`

  > **Params**: `int batchSize, int delayMs, Long issueId`
- **GET** `/api/admin/migration/status`
- **GET** `/api/admin/migration/remigration/status`
- **GET** `/api/admin/migration/analyze`

  > **Params**: `Long issueId`
- **POST** `/api/admin/migration/start`

  > **Params**: `int batchSize, int delayMs, Long issueId`
- **POST** `/api/admin/migration/remigration/start`

  > **Params**: `int batchSize, int delayMs, Long issueId`
- **POST** `/api/admin/migration/stop`
- **POST** `/api/admin/migration/remigration/stop`

  > **Params**: `Submission arg0`

  > **Params**: `int arg0, int arg1, Long arg2`

  > **Params**: `int arg0, int arg1, Long arg2`

## PromotionController

- **GET** `/api/promotion/admin/configs`
- **GET** `/api/promotion/admin/config/{id}`

  > **Params**: `Long id`
- **GET** `/api/promotion/admin/config`
- **PUT** `/api/promotion/admin/config`

  > **Params**: `PromotionConfigRequestDTO requestDTO`
- **GET** `/api/promotion/admin/images`

  > **Params**: `Long configId`
- **POST** `/api/promotion/admin/images`

  > **Params**: `PromotionImageRequestDTO requestDTO`
- **POST** `/api/promotion/admin/images/{imageId}/upload`

  > **Params**: `Long imageId, MultipartFile file`
- **DELETE** `/api/promotion/admin/images/{imageId}`

  > **Params**: `Long imageId`
- **DELETE** `/api/promotion/admin/config/{id}`

  > **Params**: `Long id`
- **GET** `/api/promotion/config`
- **GET** `/api/promotion/page/{pageUrl}`

  > **Params**: `String pageUrl`

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


  > **Params**: `MultipartFile file, LocalStorageService localService`
- **POST** `/api/submissions/{submissionId}/upload`
  > Upload an image file for a specific submission with dimension optimization. The image will be stored and its dimensions captured for improved layout performance.

  > **Params**: `String submissionId, MultipartFile file`
- **POST** `/api/submissions/{submissionId}/anonymous-upload`
  > Upload an image for an anonymous submission using a short-lived upload token.

  > **Params**: `String submissionId, String uploadToken, MultipartFile file`
- **POST** `/api/submissions/admin/upload`
  > Admin upload interface for static resources such as homepage images

  > **Params**: `MultipartFile file, String path, String filename`
- **GET** `/api/submissions/{submissionId}/check-image`

  > **Params**: `String submissionId`
- **GET** `/api/submissions/{submissionId}/direct-image`

  > **Params**: `String submissionId`
- **POST** `/api/submissions/admin/upload-hero`
  > Upload hero image for homepage. The image will be saved as /uploads/hero.jpg, replacing any existing file.

  > **Params**: `MultipartFile file`

## PasswordResetController

- **POST** `/api/auth/reset-password`

  > **Params**: `ResetPasswordRequestDTO dto`
- **POST** `/api/auth/forgot-password`

  > **Params**: `ForgotPasswordRequestDTO dto`

## GalleryController

- **GET** `/api/gallery/featured`
- **GET** `/api/gallery/stats`
- **GET** `/api/gallery/featured/config`
- **GET** `/api/gallery/featured/configs`
- **POST** `/api/gallery/featured/config`

  > **Params**: `GalleryFeaturedConfigDto configDto`
- **GET** `/api/gallery/submissions/{id}/preview`

  > **Params**: `Long id`
- **DELETE** `/api/gallery/featured/config/{id}`

  > **Params**: `Long id`
- **GET** `/api/gallery/debug/auth`
- **GET** `/api/gallery/submissions/{id}/featured-status`

  > **Params**: `Long id`

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
- **DELETE** `/api/votes`
  > Cancel a vote for a submission. Uses userId for authenticated users, visitorId for anonymous users.

  > **Params**: `Long submissionId, String visitorId`
- **GET** `/api/votes/check-batch`
  > Batch check if current user has voted for multiple submissions. Performance optimization for vote page.

  > **Params**: `String submissionIds, String visitorId`

  > **Params**: `Long arg0`

  > **Params**: `Long arg0`

  > **Params**: `String arg0`

## LayoutController


  > **Params**: `HttpServletRequest request`

  > **Params**: `Long issueId, long startTime`
- **GET** `/api/layout/order`
  > Get optimal masonry ordering for hybrid layout approach with enhanced performance

  > **Params**: `Long issueId, HttpServletRequest request`
- **GET** `/api/layout/health`
  > Health check for layout calculation service
- **GET** `/api/layout/debug`
  > Debug endpoint for ordering calculation details - Development only

  > **Params**: `Long issueId, HttpServletRequest request`

  > **Params**: `SubmissionResponseDTO arg0`

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
- **POST** `/api/submissions/anonymous`
  > Submit a new photo anonymously. Requires CAPTCHA verification.

  > **Params**: `AnonymousSubmissionRequestDTO dto`
- **GET** `/api/submissions`
  > Get all approved submissions under a given issue, including vote counts.

  > **Params**: `Long issueId`
- **GET** `/api/submissions/mine`
  > Get the current user's own submissions, optionally filtered by issue.

  > **Params**: `Long issueId`
- **GET** `/api/submissions/all`
  > Get all submissions for an issue, regardless of status. Admin only.

  > **Params**: `Long issueId`
- **GET** `/api/submissions/download-selected/{issueId}`
  > Download all selected submissions for an issue as ZIP. Admin only.

  > **Params**: `Long issueId`

## IssueController

- **GET** `/api/issues/{id}`
  > Get a specific issue by ID - Admin only

  > **Params**: `Long id`
- **POST** `/api/issues`
  > Create a new issue. Admin only. Accepts title, description, and submission/voting periods

  > **Params**: `IssueCreateRequestDTO dto`
- **PUT** `/api/issues/{id}`
  > Update an existing issue. Admin only. Allows editing all issue fields including title, description, and time periods

  > **Params**: `Long id, IssueUpdateRequestDTO dto`
- **GET** `/api/issues`
  > Get all issues in the system

## GalleryIssueController

- **GET** `/api/gallery/issues/{id}`

  > **Params**: `Long id`
- **GET** `/api/gallery/issues`
- **GET** `/api/gallery/issues/{id}/submissions`

  > **Params**: `Long id`
  > Returns ordered gallery items for a published issue. Rows can be `SUBMISSION` items with `submission` details or `CUSTOM_IMAGE` items with `customImage` details.
- **GET** `/api/gallery/issues/stats`
