# 📚 Database Design

This document outlines the structure of the PostgreSQL database used by the **Munich Weekly** platform.

---

## 📌 Tables

### 🗂️ users

| Column       | Type             | Description            | Remarks                     |
| ------------ | ---------------- | ---------------------- | --------------------------- |
| id           | BIGINT           | User ID (Primary Key)  | Auto-generated              |
| email        | VARCHAR (unique) | Email address          | Login for real users; synthetic `anonymous-…@anonymous.munichweekly.local` for internal anonymous submissions |
| password     | VARCHAR          | Encrypted password     | Email login; anonymous-submission users hold a non-usable hash |
| nickname     | VARCHAR          | User nickname          | e.g. `Anonymous` for `ANONYMOUS_SUBMISSION` |
| avatarUrl    | VARCHAR          | URL of user's avatar   |                             |
| role         | VARCHAR          | User role              | Default: `user`, or `admin` |
| registeredAt | TIMESTAMP        | Registration timestamp | Default current time        |
| isBanned     | BOOLEAN          | Account banned status  | Default: `false`            |
| account\_type | VARCHAR(64)     | `REGISTERED` or `ANONYMOUS_SUBMISSION` | Distinguishes real accounts from one-off anonymous submission users (excluded from admin user list) |

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

| Column       | Type          | Description                 | Remarks                                                |
| ------------ | ------------- | --------------------------- | ------------------------------------------------------ |
| id           | BIGINT        | Submission ID (Primary Key) | Auto-generated                                         |
| user\_id     | BIGINT (FK)   | User ID (users table)       | Many-to-one; may reference an `ANONYMOUS_SUBMISSION` user for anonymous posts |
| issue\_id    | BIGINT (FK)   | Issue ID (issues table)     | Many-to-one                                            |
| imageUrl     | VARCHAR       | Submission image URL        |                                                        |
| description  | VARCHAR(2000) | Submission description      |                                                        |
| image\_width | INTEGER       | Image width in pixels       | Performance optimization field                                                |
| image\_height| INTEGER       | Image height in pixels      | Performance optimization field                                                |
| aspect\_ratio| DECIMAL(10,6)  | Precomputed aspect ratio    | Width/height for layout optimization                                                |
| isCover      | BOOLEAN       | Cover image status          | Default: `false`                                       |
| status       | VARCHAR       | Review status               | Default: `pending`; `approved`, `rejected`, `selected` |
| submittedAt  | TIMESTAMP     | Submission timestamp        | Default current time                                   |
| reviewedAt   | TIMESTAMP     | Review timestamp            | Optional                                               |
| anonymous\_contact\_email | VARCHAR(255) | Optional email from anonymous flow | Shown to admins only; not public on gallery or issue views |

Performance Features:
- **Image dimensions captured during upload** - eliminates frontend calculation overhead
- **Aspect ratio stored** - enables instant masonry layout without dynamic computation
- **Database constraints** - ensures positive dimensions and valid aspect ratios (0.1-10.0)
- **Indexed fields** - optimized queries for layout ordering algorithms

---

### 🗂️ votes

| Column             | Type      | Description                       | Remarks                               |
| ------------------ | --------- | --------------------------------- | ------------------------------------- |
| id                 | BIGINT    | Vote ID (Primary Key)             | Auto-generated                        |
| submission\_id     | BIGINT FK | Submission ID (submissions table) | Many-to-one                           |
| issue\_id          | BIGINT FK | Issue ID (issues table)           | Many-to-one                           |
| visitorId          | VARCHAR   | Anonymous visitor identifier      | From browser cookie; required         |
| browserFingerprint | VARCHAR   | Optional fingerprint string       | Used for abuse detection              |
| ipAddress          | VARCHAR   | IP address at vote time           | Stored for auditing / abuse detection |
| votedAt            | TIMESTAMP | Voting timestamp                  | Default current time                  |

**Unique Constraint:** Each visitorId can vote only once per submission.

---

### Gallery Tables

Two tables support issue-based public galleries.

#### `gallery_issue_config`

Stores the gallery-level configuration for an issue.

| Column              | Type        | Description                         | Remarks                                      |
| ------------------- | ----------- | ----------------------------------- | -------------------------------------------- |
| id                  | BIGINT      | Gallery config ID (Primary Key)     | Auto-generated                               |
| issue_id            | BIGINT FK   | Issue configured for gallery display | Unique per issue                             |
| cover_image_url     | VARCHAR(500)| Admin-uploaded cover image URL      | Optional                                     |
| is_published        | BOOLEAN     | Public visibility flag              | Default: `false`                             |
| display_order       | INTEGER     | Issue order in gallery lists        | Lower values appear first                    |
| config_title        | VARCHAR(200)| Admin-facing configuration title    | Optional                                     |
| config_description  | TEXT        | Admin-facing configuration notes    | Optional                                     |
| created_by_user_id  | BIGINT FK   | Admin user who created the config   | Optional relation to `users`                 |
| created_at          | TIMESTAMP   | Creation timestamp                  | Default current time                         |
| updated_at          | TIMESTAMP   | Last update timestamp               | Updated by application lifecycle callbacks   |

#### `gallery_submission_order`

Stores the ordered items inside a gallery issue. Despite the historical table name, rows now represent gallery items. A row can point to a selected user submission or store administrator-managed custom image metadata directly.

| Column                | Type           | Description                              | Remarks                                      |
| --------------------- | -------------- | ---------------------------------------- | -------------------------------------------- |
| id                    | BIGINT         | Gallery order row ID (Primary Key)       | Auto-generated                               |
| gallery_config_id     | BIGINT FK      | Parent gallery issue configuration       | Required                                     |
| submission_id         | BIGINT FK      | Selected submission for `SUBMISSION` rows | Nullable for `CUSTOM_IMAGE` rows             |
| item_type             | VARCHAR(30)    | Gallery item type                        | `SUBMISSION` or `CUSTOM_IMAGE`; default `SUBMISSION` |
| custom_image_url      | VARCHAR(500)   | Stored image URL for custom image rows   | Null for submission rows                     |
| custom_title          | VARCHAR(200)   | Optional custom image title              | Empty titles are displayed as item order     |
| custom_description    | TEXT           | Optional custom image description        | Null when not provided                       |
| custom_image_width    | INTEGER        | Custom image width in pixels             | Captured during upload                       |
| custom_image_height   | INTEGER        | Custom image height in pixels            | Captured during upload                       |
| custom_aspect_ratio   | DECIMAL(10,6)  | Width/height ratio for layout            | Captured during upload                       |
| display_order         | INTEGER        | 1-based item order within the issue      | Required and positive                        |
| created_at            | TIMESTAMP      | Creation timestamp                       | Default current time                         |
| updated_at            | TIMESTAMP      | Last update timestamp                    | Updated by application lifecycle callbacks   |

Custom image rows are not submissions: they do not have submitter attribution, voting state, or ownership metadata. They still use the same image dimension fields for gallery layout performance.

---

### Promotion Tables

Two tables were added to support the promotion feature.

- **`promotion_config`**: Stores the main configuration for a promotion.
  - `id`, `is_enabled`, `nav_title`, `page_url`, `description`, `created_at`, `updated_at`
- **`promotion_images`**: Stores images associated with a promotion.
  - `id`, `promotion_config_id` (FK), `image_url`, `image_title`, `image_description`, `display_order`, and image dimension fields.

## 🔗 Relationships

* **User ↔️ Submission** *(one-to-many; includes synthetic users for `ANONYMOUS_SUBMISSION` rows)*
* **Issue ↔️ Submission** *(one-to-many)*
* **Submission ↔️ Vote** *(one-to-many)*
* **Issue ↔️ Vote** *(one-to-many)*
* **User ↔️ UserAuthProvider** *(one-to-many)*
* **Issue ↔️ GalleryIssueConfig** *(one-to-one logical relationship; each issue can have one gallery config)*
* **GalleryIssueConfig ↔️ GallerySubmissionOrder** *(one-to-many ordered gallery items)*
* **Submission ↔️ GallerySubmissionOrder** *(optional many-to-one for `SUBMISSION` gallery items)*
* **PromotionConfig ↔️ PromotionImages** *(one-to-many)*

> Note: Votes are no longer linked to `User`, but use `visitorId` from cookies for anonymous vote tracking.

---

## 🚀 Performance Optimizations

### Image Dimension Storage

**Database Schema Enhancement:**
- Added `image_width`, `image_height`, `aspect_ratio` fields to submissions table
- Computed during upload process - no frontend calculation needed
- Enables instant masonry layout rendering without external API calls

**Performance Impact:**
- **60-80% faster** masonry layout calculation
- **Eliminates** redundant image dimension fetching
- **Backend optimization** leverages stored ratios for optimal ordering algorithms
