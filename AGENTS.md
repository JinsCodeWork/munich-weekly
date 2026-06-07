# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

Munich Weekly is a photography platform for weekly submission and voting, built for students in Munich. The platform features photo submissions, anonymous voting, admin management tools, JWT authentication, and dual-mode storage (Cloudflare R2/Local).

**Tech Stack:**
- Frontend: Next.js 15 + TypeScript + Tailwind CSS
- Backend: Java 21 + Spring Boot 3 + Gradle
- Database: PostgreSQL (via Docker)
- Authentication: JWT + Spring Security
- Storage: Cloudflare R2 (production) or Local (development)

## Common Development Commands

### Backend (Spring Boot + Gradle)

```bash
# Navigate to backend directory first
cd backend

# Run backend application (starts on port 8080)
./gradlew bootRun

# Run tests
./gradlew test

# Run all checks (tests + linting)
./gradlew check

# Build production JAR
./gradlew build

# Start PostgreSQL with Docker
docker compose up -d postgres

# Start both backend and database
docker compose up -d

# Rebuild and restart backend container
docker compose up -d --build backend

# View backend logs
docker logs -f mw-backend
```

**Important:** When running `bootRun`, you must be in the `backend/` directory (see `.cursor/rules/bootrunrule.mdc`). If Spring Boot runs on the host while PostgreSQL runs via Docker Compose, override the datasource URL to `jdbc:postgresql://localhost:5432/<db>`; the default `postgres` hostname is only valid inside the Docker network. See `docs/local-development.md`.

### API Documentation

```bash
# Run from the repository root while the backend is running
API_BASE_URL=http://localhost:8080 ./scripts/generate-openapi.sh
```

This regenerates `docs/api.json` from the backend's `/v3/api-docs` endpoint. Do not hand-edit endpoint lists in Markdown.

### Frontend (Next.js)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run development server (starts on port 3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

### Docker Commands

```bash
# Start all services
cd backend && docker compose up -d

# Stop all services
docker compose down

# View logs
docker logs -f mw-backend
docker logs -f mw-postgres

# Restart specific service
docker restart mw-backend
```

## Architecture Overview

### Backend Architecture (Spring Boot)

**Package Structure:**
```
com.munichweekly.backend/
├── controller/      # REST API endpoints
├── service/         # Business logic layer
├── repository/      # JPA data access layer
├── model/           # Domain entities (User, Submission, Issue, Vote)
├── dto/             # Data Transfer Objects (*RequestDTO, *ResponseDTO)
├── security/        # JWT filters, SecurityConfig, JwtUtil
├── config/          # Configuration classes (StorageConfig, CacheConfig)
└── exception/       # GlobalExceptionHandler
```

**Key Patterns:**
1. **Layered Architecture:** Controller → Service → Repository → Database
2. **DTO Pattern:** All API requests/responses use DTOs, never expose domain models directly
3. **Strategy Pattern for Storage:** `StorageService` interface with `R2StorageService` and `LocalStorageService` implementations
4. **JWT Authentication:** `JwtAuthenticationFilter` intercepts requests, validates tokens, sets SecurityContext
5. **Role-Based Authorization:** `"user"` and `"admin"` roles, enforced via `SecurityConfig` and `@PreAuthorize`

**Authentication Flow:**
- Login endpoint generates JWT token with userId as subject
- Token stored client-side, sent as `Authorization: Bearer <token>`
- `JwtAuthenticationFilter` validates token and loads user into SecurityContext
- Use `CurrentUserUtil.getUserIdOrThrow()` to get authenticated user ID in controllers

**Storage System:**
- Configured via `storage.mode` property (R2 or LOCAL)
- R2: Production cloud storage with Cloudflare R2
- Local: Development storage in `./uploads` directory
- Image dimensions extracted during upload for performance optimization

**Database Schema Management:**
- Current runtime uses Hibernate `spring.jpa.hibernate.ddl-auto=update`
- Targeted startup schema adjustments also exist, e.g. `GalleryOrderSchemaMigration`
- SQL files exist in `src/main/resources/db/migration/`, but Flyway is not currently configured as an active Gradle dependency
- Do not assume Flyway is running unless the build/config is changed to enable it

### Frontend Architecture (Next.js + TypeScript)

**Directory Structure:**
```
frontend/src/
├── app/                # Next.js App Router pages (file-based routing)
│   ├── page.tsx       # Home page
│   ├── layout.tsx     # Root layout with providers
│   └── account/       # Protected area with sidebar layout
├── api/               # API layer (modular by feature)
│   ├── http.ts        # Base fetchAPI() with auth headers
│   ├── auth/          # Authentication endpoints
│   ├── users/         # User management
│   ├── submissions/   # Submission operations
│   └── votes/         # Voting system
├── context/           # React Context providers
│   ├── AuthContext.tsx      # Global auth state
│   └── VoteStatusContext.tsx # Vote caching with batch API
├── hooks/             # Custom React hooks
│   ├── useAuth.ts           # Auth context consumer
│   ├── useSubmissions.ts    # Submissions data management
│   └── useIssues.ts         # Issues data management
├── components/        # React components
│   ├── ui/           # Reusable UI components (Button, Modal, etc.)
│   ├── auth/         # Auth forms (LoginForm, RegisterForm)
│   ├── admin/        # Admin-specific components
│   └── navigation/   # Navigation components
├── types/            # TypeScript type definitions
├── styles/           # Design system (theme.ts, variants.ts)
└── lib/              # Utilities (config.ts, auth-redirect.ts)
```

**Key Patterns:**
1. **AuthContext:** Central authentication management with JWT tokens stored in localStorage/sessionStorage
2. **Protected Routes:** `<ProtectedRoute>` wrapper component or layout-level protection
3. **API Layer:** Modular API modules with typed responses using `fetchAPI<T>()`
4. **Custom Hooks:** Data fetching logic encapsulated in hooks (useSubmissions, useIssues)
5. **Context Providers:** AuthContext and VoteStatusContext provide global state
6. **Tailwind + Design Tokens:** Styling via Tailwind CSS with design tokens in `styles/theme.ts`

**Authentication Flow:**
- User logs in via `LoginForm` → receives JWT token
- `AuthContext.login()` stores token in localStorage/sessionStorage
- Token auto-parsed to check expiration (30-second buffer)
- All API requests include `Authorization: Bearer <token>` header
- Protected pages use `<ProtectedRoute>` or layout-level guards

**Path Alias:**
- `@/*` maps to `./src/*` (configured in tsconfig.json)

## Important Conventions

### Backend

1. **Always use DTOs:** Never expose domain models directly in controllers
2. **Security checks:** Use `@PreAuthorize("hasAuthority('admin')")` for admin-only endpoints
3. **Current user:** Get authenticated user with `CurrentUserUtil.getUserIdOrThrow()`
4. **Exception handling:** Throw `IllegalArgumentException` or `IllegalStateException` - automatically handled by `GlobalExceptionHandler`
5. **File uploads:** Use `StorageService.storeFileWithDimensions()` for images to extract dimensions during upload
6. **Database queries:** Extend `JpaRepository<T, Long>` with custom `@Query` methods

### Frontend

1. **"use client":** Most components need this directive for interactivity
2. **Type safety:** All API responses must have TypeScript interfaces
3. **Auth checks:** Use `useAuth()` hook or `<ProtectedRoute>` wrapper
4. **API calls:** Always use `fetchAPI<T>()` from `@/api/http.ts`, never raw fetch
5. **Styling:** Use Tailwind utilities + design tokens from `@/styles/theme.ts`
6. **Component organization:** UI components in `components/ui/`, feature-specific in feature folders
7. **Error handling:** Use `LoadingErrorStates` component for consistent error UI

### Git Workflow

Follow GitHub Flow with conventional commits:
```bash
# Branch naming
feat/feature-name        # New features
fix/bug-description      # Bug fixes
refactor/component-name  # Refactoring
docs/topic               # Documentation

# Commit format
type(scope): description

# Examples
feat(gallery): add carousel navigation with auto-play
fix(masonry): resolve mobile layout overflow
docs(api): add authentication examples
```

## Environment Configuration

### Backend Environment Variables

Required in `backend/.env`:
```env
# Database
POSTGRES_DB=mydatabase
POSTGRES_USER=myuser
POSTGRES_PASSWORD=secret

# JWT
JWT_SECRET=your-very-secure-secret
JWT_EXPIRATION_MS=3600000

# Storage (choose R2 or LOCAL when the backend process receives this env var)
STORAGE_MODE=R2

# Cloudflare R2 (if STORAGE_MODE=R2)
CLOUDFLARE_R2_ACCESS_KEY=your-access-key
CLOUDFLARE_R2_SECRET_KEY=your-secret-key
CLOUDFLARE_R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com
CLOUDFLARE_R2_BUCKET=munichweekly-photoupload
CLOUDFLARE_R2_PUBLIC_URL=https://pub-your-account.r2.dev

# Spring profile (do not use dev in production; dev clears and reseeds data)
SPRING_PROFILES_ACTIVE=prod
```

**Security:** Never commit `.env` files - they are in `.gitignore`

## Common Tasks

### Adding a New API Endpoint

1. Create DTO classes in `backend/src/main/java/.../dto/`
2. Add controller method in `backend/src/main/java/.../controller/`
3. Implement service method in `backend/src/main/java/.../service/`
4. Add repository query if needed in `backend/src/main/java/.../repository/`
5. Update security rules in `SecurityConfig` if needed
6. Create TypeScript interface in `frontend/src/types/`
7. Add API function in `frontend/src/api/[feature]/index.ts`
8. Use in component with custom hook or direct API call

### Adding a Protected Page

1. Create page file in `frontend/src/app/[route]/page.tsx`
2. Mark with `"use client"` directive
3. Wrap content with `<ProtectedRoute>` or add to `/account` area
4. Use `useAuth()` hook to access user data
5. Add role checks if admin-only: `<ProtectedRoute requiredRole="admin">`

### Modifying Authentication

Backend:
- JWT generation: `JwtUtil.generateToken()`
- Token validation: `JwtAuthenticationFilter`
- Security rules: `SecurityConfig.filterChain()`
- Current user: `CurrentUserUtil`

Frontend:
- Auth state: `AuthContext.tsx`
- Login/Register: `components/auth/LoginForm.tsx`, `RegisterForm.tsx`
- Protected routes: `components/ProtectedRoute.tsx`
- API headers: `api/http.ts` → `getAuthHeader()`

### Working with Images

Backend:
- Upload: `StorageService.storeFileWithDimensions()` returns URL + dimensions
- Storage mode is controlled by the backend process environment/Spring property `storage.mode` (`STORAGE_MODE` can override it when passed to the process)
- Dimensions extracted during upload for masonry optimization
- File size limits are implementation-specific: R2 storage enforces 20MB, local storage and Spring multipart currently allow 30MB

Frontend:
- Image dimensions: `useImageDimensions()` hook
- Masonry layout: `components/ui/MasonryGrid.tsx`
- Image aspect ratio: Pre-calculated by backend, stored in submission

## Testing

### Backend Tests

```bash
cd backend

# Run all tests
./gradlew test

# Run specific test
./gradlew test --tests="ControllerNameTest"

# With detailed output
./gradlew test --info
```

### Frontend Testing

```bash
cd frontend

# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Build test (catches many issues)
npm run build
```

### Manual Testing Checklist

- Authentication flow (login, register, logout)
- Role-based access (admin vs user pages)
- Image upload with submission
- Voting system
- Mobile responsiveness
- Error handling

## Documentation

Comprehensive documentation is available in `/docs`:
- `docs/api.md` - OpenAPI schema entry point and generation workflow
- `docs/auth.md` - Authentication & security implementation
- `docs/deployment.md` - Production deployment guide
- `docs/contributing.md` - Development workflow
- `docs/frontend-architecture.md` - Detailed frontend architecture
- `docs/database.md` - Database schema
- `docs/storage.md` - Storage system details

## Critical Security Notes

1. **Never expose sensitive data:** JWT secrets, database credentials, API keys
2. **Always validate input:** Use `@Valid` annotation with DTOs
3. **Check authorization:** Verify user owns resource before modification
4. **Banned users:** Checked during authentication in `JwtAuthenticationFilter`
5. **Admin verification:** Backend enforces admin role for sensitive operations
6. **Token expiration:** Frontend checks expiration with 30-second buffer
7. **CORS:** Configured in backend for production domain

## Production Deployment

Backend and database run in Docker containers managed by `docker compose`. Frontend runs via PM2 process manager. Nginx proxies requests:
- `/api/*` → Backend (port 8080)
- `/*` → Frontend (port 3000)

See `docs/deployment.md` for complete deployment instructions.

## Troubleshooting

**Backend won't start:**
- Check PostgreSQL is running: `docker ps | grep postgres`
- Verify `.env` file exists in `backend/` directory
- Check logs: `docker logs mw-backend`

**Frontend build fails:**
- Clear node_modules: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npx tsc --noEmit`
- Verify all imports use `@/` prefix

**Authentication not working:**
- Check token in browser localStorage/sessionStorage
- Verify token not expired (check console for errors)
- Ensure backend JWT_SECRET matches deployed version
- Check CORS headers in Network tab

**Database issues:**
- Reset database: `docker compose down -v && docker compose up -d`
- Check schema updates: look for Hibernate DDL and startup schema-adjustment logs

## Contact

- Project Lead: Dongkai Jin (dongkai.jin@tum.de)
- Repository: https://github.com/JinsCodeWork/munich-weekly
