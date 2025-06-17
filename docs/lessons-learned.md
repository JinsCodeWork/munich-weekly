# Lessons Learned

This document captures key lessons and important technical decisions made during the development of the Munich Weekly platform. It should be consulted by developers before starting new feature work to avoid common pitfalls.

---

## 1. CORS is Not Required for Same-Domain Applications

A significant amount of time was initially spent diagnosing what appeared to be Cross-Origin Resource Sharing (CORS) issues, particularly 401/403 errors on API requests.

- **Lesson**: Our frontend and backend are served from the **same domain**. Therefore, browser same-origin policy applies, and **no CORS configuration is necessary** on the backend.
- **Guideline**: If you encounter authentication or permission errors (401/403), investigate backend security rules (`@PreAuthorize`), token validity, and API path correctness first. Do not assume it is a CORS problem.

---

## 2. Use Relative Paths for All Frontend API Calls

Early development of the Promotion feature involved using absolute URLs (e.g., `http://localhost:8080/api/...`) in the frontend API service layer. This caused immediate issues when moving between development and production environments.

- **Lesson**: Hardcoding absolute URLs ties the frontend to a specific backend environment, making it brittle and difficult to deploy.
- **Guideline**: All API calls made from the frontend **must use relative paths** (e.g., `/api/users/me`). The browser will automatically resolve this to the correct domain, ensuring that the application works seamlessly in any environment (local, staging, production) without code changes.

```javascript
// Correct (Relative Path)
const response = await fetch('/api/promotion/config');

// Incorrect (Absolute Path)
const response = await fetch('http://localhost:8080/api/promotion/config');
``` 