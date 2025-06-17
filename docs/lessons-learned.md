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

---

## 3. Spring Security Requires Exact Path Matching for Admin Endpoints

During Gallery feature development, all admin API calls returned 401 Unauthorized errors despite valid JWT tokens. Investigation revealed two critical authentication issues.

- **Lesson 1**: Spring Security's `requestMatchers()` requires **exact path matching** with specific HTTP methods. Wildcard patterns like `/api/gallery/featured/config/**` do not work as expected.
- **Lesson 2**: Frontend API calls must include the `Authorization: Bearer {token}` header. Using only `credentials: 'include'` for cookies is insufficient for JWT-based authentication.

**Backend Fix**:
```java
// Incorrect (Wildcard patterns fail)
.requestMatchers("/api/gallery/featured/config/**").hasAuthority("admin")

// Correct (Exact paths with HTTP methods)
.requestMatchers(HttpMethod.GET, "/api/gallery/featured/config").hasAuthority("admin")
.requestMatchers(HttpMethod.POST, "/api/gallery/featured/config").hasAuthority("admin")
.requestMatchers(HttpMethod.DELETE, "/api/gallery/featured/config/*").hasAuthority("admin")
```

**Frontend Fix**:
```javascript
// Incorrect (Missing Authorization header)
const response = await fetch('/api/gallery/featured/config', {
  credentials: 'include'
});

// Correct (Include JWT token)
const authHeaders = getAuthHeader();
const response = await fetch('/api/gallery/featured/config', {
  headers: { ...authHeaders },
  credentials: 'include'
});
```

---

## 4. JPA @Modifying Annotation Required for UPDATE/DELETE Queries

Gallery configuration saving failed with "Query executed via 'getResultList()' must be a 'select' query" error when deactivating other configurations.

- **Lesson**: Spring Data JPA requires the `@Modifying` annotation for all UPDATE, DELETE, or INSERT `@Query` methods. Without it, JPA treats the query as a SELECT operation.
- **Guideline**: Always add `@Modifying` to repository methods that modify data.

```java
// Incorrect (Missing @Modifying)
@Query("UPDATE GalleryFeaturedConfig gfc SET gfc.isActive = false WHERE gfc.id != :excludeId")
int deactivateOtherConfigs(@Param("excludeId") Long excludeId);

// Correct (With @Modifying)
@Modifying
@Query("UPDATE GalleryFeaturedConfig gfc SET gfc.isActive = false WHERE gfc.id != :excludeId")
int deactivateOtherConfigs(@Param("excludeId") Long excludeId);
``` 