# Contributing to Munich Weekly

Welcome to the Munich Weekly photography platform! We appreciate your interest in contributing to our project. This document provides guidelines and workflows for contributing code, documentation, and other improvements.

## 📚 Documentation Navigation

**Getting Started:**
- 🏠 [Project Overview](../README.md) - Platform features and architecture overview
- 🚀 [Deployment Guide](./deployment.md) - Local development setup and production deployment
- 📱 [Frontend Overview](./frontend-overview.md) - Frontend architecture and development guide

**Technical Documentation:**
- 🏗️ [Frontend Architecture](./frontend-architecture.md) - Detailed technical architecture
- 📦 [API Reference](./api.md) - Complete endpoint documentation
- 🗃️ [Database Design](./database.md) - Database schema and design decisions

**Security & Best Practices:**
- 🔐 [Authentication & Security](./auth.md) - Security implementation guidelines
- 📝 [Lessons Learned](./lessons-learned.md) - Important technical decisions and best practices

---

## 🛠️ Development Setup

### Prerequisites

Before contributing, ensure you have the following installed:

- **Java 21** - For backend development
- **Node.js 18+** - For frontend development
- **Docker & Docker Compose** - For local database and containerization
- **Git** - For version control
- **Your preferred IDE** - IntelliJ IDEA (backend) or VS Code (frontend) recommended

### Local Development Environment

1. **Clone the repository:**
   ```bash
   git clone https://github.com/JinsCodeWork/munich-weekly.git
   cd munich-weekly
   ```

2. **Backend setup:**
   ```bash
   cd backend
   # Copy environment template
   cp .env.example .env
   # Edit .env with your local configuration
   
   # Start PostgreSQL with Docker
   docker compose up -d postgres
   
   # Run Spring Boot application
   ./gradlew bootRun
   ```

3. **Frontend setup:**
   ```bash
   cd frontend
   # Install dependencies
   npm install
   
   # Start development server
   npm run dev
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - Database: localhost:5432

---

## 🔄 GitHub Flow Workflow

We follow the **GitHub Flow** for all contributions. This ensures code quality, proper review processes, and stable releases.

### Step 1: Prepare Your Development Environment

```bash
# Ensure you're on the main branch
git checkout main

# Pull the latest changes
git pull origin main

# Create a new feature branch
git checkout -b feat/your-feature-name
```

### Step 1.1: Detailed Branch Creation Guide

**Before creating a branch, always ensure you have the latest code:**

```bash
# Check your current branch
git branch

# Switch to main branch if not already there
git checkout main

# Fetch latest changes from remote
git fetch origin

# Pull latest changes to your local main
git pull origin main
```

**Creating different types of branches:**

```bash
# For new features
git checkout -b feat/gallery-image-carousel
git checkout -b feat/user-profile-settings

# For bug fixes
git checkout -b fix/mobile-layout-overflow
git checkout -b fix/authentication-token-expiry

# For documentation updates
git checkout -b docs/api-endpoint-examples
git checkout -b docs/deployment-guide-updates

# For performance improvements
git checkout -b perf/image-loading-optimization
git checkout -b perf/database-query-caching

# For refactoring
git checkout -b refactor/authentication-service
git checkout -b refactor/ui-component-structure
```

**Verify your branch creation:**

```bash
# Check that you're on the correct branch
git branch
# The current branch will be marked with *

# Check branch status
git status
# Should show "On branch feat/your-feature-name"

# Verify no uncommitted changes from main
git status
# Should show "working tree clean"
```

**If you make a mistake with branch naming:**

```bash
# Rename current branch
git branch -m feat/better-branch-name

# Or delete and recreate (only if no commits yet)
git checkout main
git branch -d feat/wrong-name
git checkout -b feat/correct-name
```

### Step 2: Branch Naming Conventions

Use clear, descriptive branch names following these patterns:

| Type | Format | Example |
|------|--------|---------|
| **New Feature** | `feat/feature-description` | `feat/gallery-carousel-system` |
| **Bug Fix** | `fix/bug-description` | `fix/masonry-layout-mobile-overflow` |
| **Refactoring** | `refactor/component-name` | `refactor/authentication-context` |
| **Documentation** | `docs/topic` | `docs/api-authentication-guide` |
| **Performance** | `perf/optimization-area` | `perf/image-dimension-caching` |
| **Testing** | `test/test-area` | `test/submission-upload-flow` |

### Step 3: Development and Commits

#### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(scope): description

[optional body]

[optional footer]
```

**Examples:**
```bash
# Feature addition
git commit -m "feat(gallery): add carousel navigation with auto-play functionality"

# Bug fix
git commit -m "fix(masonry): resolve mobile layout overflow on narrow screens"

# Documentation update
git commit -m "docs(api): add authentication examples for admin endpoints"

# Performance improvement
git commit -m "perf(images): implement stored dimension optimization for 60% faster loading"
```

#### Commit Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(voting): add batch vote checking API` |
| `fix` | Bug fix | `fix(auth): resolve JWT token expiration handling` |
| `docs` | Documentation | `docs(deployment): update Hetzner Cloud setup guide` |
| `style` | Code style changes | `style(frontend): apply consistent Tailwind formatting` |
| `refactor` | Code refactoring | `refactor(storage): simplify R2 service interface` |
| `perf` | Performance improvement | `perf(masonry): optimize layout calculation algorithm` |
| `test` | Adding tests | `test(api): add integration tests for submission endpoints` |
| `chore` | Maintenance tasks | `chore(deps): update Spring Boot to 3.2.1` |

### Step 4: Push and Create Pull Request

```bash
# Push your feature branch
git push origin feat/your-feature-name
```

**On GitHub:**
1. Navigate to the repository
2. Click "Compare & pull request" (appears automatically)
3. Fill out the PR template (see below)
4. Assign reviewers if you have permissions
5. Click "Create pull request"

---

## 📝 Pull Request Guidelines

### PR Title Format

Use the same format as commit messages:
```
type(scope): clear description of changes
```

**Examples:**
- `feat(gallery): implement featured carousel with admin configuration`
- `fix(masonry): resolve progressive loading timeout on mobile`
- `docs(contributing): add comprehensive GitHub Flow workflow guide`

### PR Description Template

When creating a PR, include the following information:

```markdown
## 📋 Summary
Brief description of what this PR accomplishes.

## 🎯 Changes Made
- List specific changes
- Include any new features or modifications
- Mention any breaking changes

## 🧪 Testing
- [ ] Local testing completed
- [ ] Backend tests pass (`./gradlew test`)
- [ ] Frontend builds successfully (`npm run build`)
- [ ] Manual testing on mobile/desktop
- [ ] Admin functionality tested (if applicable)

## 📱 Screenshots (if UI changes)
Include before/after screenshots for visual changes.

## 🔗 Related Issues
Closes #123
References #456

## 📚 Documentation
- [ ] Updated relevant documentation
- [ ] Added code comments for complex logic
- [ ] Updated API documentation (if applicable)

## ⚠️ Breaking Changes
None / List any breaking changes and migration steps.
```

### Review Process

1. **Automated Checks**: Ensure all CI/CD checks pass
2. **Code Review**: At least one project maintainer will review your code
3. **Testing**: Verify the changes work as expected
4. **Documentation**: Ensure documentation is updated if needed
5. **Approval**: PR must be approved before merging

### Review Criteria

Reviewers will check for:
- **Code Quality**: Clean, readable, and maintainable code
- **Security**: No security vulnerabilities or data exposure
- **Performance**: No significant performance regressions
- **Testing**: Adequate test coverage for new features
- **Documentation**: Updated documentation for public APIs or user-facing changes
- **Consistency**: Follows existing code patterns and architecture

---

## 🏗️ Project Architecture Overview

### Frontend Structure
```
frontend/src/
├── api/              # API integration modules
├── app/              # Next.js App Router pages
├── components/       # Reusable UI components
├── hooks/            # Custom React hooks
├── styles/           # Style management system
├── types/            # TypeScript type definitions
└── utils/            # Utility functions
```

### Backend Structure
```
backend/src/main/java/com/munichweekly/backend/
├── config/           # Configuration classes
├── controller/       # REST API controllers
├── dto/              # Data Transfer Objects
├── model/            # JPA entity models
├── repository/       # Data access layer
├── security/         # Security configuration
└── service/          # Business logic layer
```

### Key Technologies

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 15 + TypeScript | React framework with App Router |
| **Backend** | Spring Boot 3 + Java 21 | REST API and business logic |
| **Database** | PostgreSQL | Data persistence |
| **Storage** | Cloudflare R2 + Local | Image storage and CDN |
| **Authentication** | JWT + BCrypt | User authentication and security |
| **Styling** | Tailwind CSS | Utility-first CSS framework |

---

## 🧪 Testing Guidelines

### Backend Testing

```bash
# Run all tests
./gradlew test

# Run specific test class
./gradlew test --tests="SubmissionControllerTest"

# Run with coverage
./gradlew test jacocoTestReport
```

### Frontend Testing

```bash
# Run development build
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check

# Linting
npm run lint
```

### Manual Testing Checklist

Before submitting a PR, manually test:

- [ ] **Authentication Flow**: Login, registration, password reset
- [ ] **Core Features**: Submission upload, voting, gallery viewing
- [ ] **Admin Features**: Issue management, submission approval
- [ ] **Responsive Design**: Test on mobile, tablet, and desktop
- [ ] **Error Handling**: Test error scenarios and edge cases

---

## 🚀 Deployment and CI/CD

### Automated Deployment

The project uses automated deployment when changes are merged to `main`:

1. **GitHub Actions** trigger on merge to main
2. **Backend** is built and deployed to Hetzner Cloud
3. **Frontend** is built and deployed via PM2
4. **Database migrations** run automatically if needed

### Manual Deployment

For testing deployment changes:

```bash
# Backend deployment
cd backend
docker compose up -d --build

# Frontend deployment
cd frontend
npm run build
pm2 restart munich-weekly-frontend
```

---

## 📋 Code Style Guidelines

### TypeScript/JavaScript

- Use **TypeScript** for all new frontend code
- Follow **ESLint** and **Prettier** configurations
- Use **meaningful variable names** and **JSDoc comments** for complex functions
- Prefer **functional components** and **React hooks**

### Java

- Follow **Spring Boot** conventions and best practices
- Use **meaningful class and method names**
- Add **Javadoc comments** for public APIs
- Follow **SOLID principles** and **clean code** practices

### General Principles

- **DRY (Don't Repeat Yourself)**: Extract reusable logic into utilities or components
- **SOLID Principles**: Write maintainable and extensible code
- **Security First**: Always consider security implications of your changes
- **Performance**: Be mindful of performance impact, especially for image handling and layout calculations

---

## 🐛 Bug Reports and Feature Requests

### Bug Reports

When reporting bugs, include:

1. **Clear description** of the issue
2. **Steps to reproduce** the problem
3. **Expected vs actual behavior**
4. **Environment details** (browser, device, etc.)
5. **Screenshots or videos** if applicable
6. **Console logs** or error messages

### Feature Requests

For new features, provide:

1. **Use case description** and motivation
2. **Detailed feature specification**
3. **Mockups or wireframes** if applicable
4. **Implementation considerations**
5. **Impact on existing functionality**

---

## 🤝 Getting Help

### Resources

- **Documentation**: Start with the [Documentation Index](./index.md)
- **Architecture**: Review [Frontend Architecture](./frontend-architecture.md) and [API Reference](./api.md)
- **Security**: Understand our [Authentication & Security](./auth.md) implementation
- **Lessons Learned**: Read [important technical decisions](./lessons-learned.md)

### Communication

- **GitHub Issues**: For bug reports and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Email**: Contact dongkai.jin@tum.de for urgent matters or security concerns

### Common Development Tasks

| Task | Command | Documentation |
|------|---------|---------------|
| **Start local development** | `./gradlew bootRun` + `npm run dev` | [Deployment Guide](./deployment.md) |
| **Add new API endpoint** | Create controller + service + tests | [API Reference](./api.md) |
| **Create UI component** | Add to `/components` with TypeScript | [UI Components](./ui-components.md) |
| **Modify database schema** | Create Flyway migration | [Database Design](./database.md) |
| **Update authentication** | Modify security configuration | [Authentication & Security](./auth.md) |

---

## 📄 License and Code of Conduct

### License

This project is licensed under **Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0)**. By contributing, you agree that your contributions will be licensed under the same license.

### Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please:

- **Be respectful** and constructive in all interactions
- **Focus on the code and ideas**, not personal attributes
- **Help create a positive environment** for learning and collaboration
- **Report inappropriate behavior** to the project maintainers

---

## 🎉 Recognition

Contributors will be recognized in:

- **GitHub Contributors** section
- **Project documentation** acknowledgments
- **Release notes** for significant contributions

Thank you for contributing to Munich Weekly! Your efforts help create a better platform for the photography community in Munich.

---

## 🔗 Quick Links

- 🏠 [Project Overview](../README.md)
- 📚 [Documentation Index](./index.md)
- 🚀 [Deployment Guide](./deployment.md)
- 🔐 [Security Guide](./auth.md)
- 📝 [Lessons Learned](./lessons-learned.md)

*For the latest updates, see the [Documentation Index](./index.md)* 