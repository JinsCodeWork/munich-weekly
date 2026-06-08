# 🔒 Security Summary - Munich Weekly

> Class: Reference snapshot
> Owner: Security/platform maintainer
> Update when: security posture, known risks, or mitigation status changes.

This document provides a concise overview of the current security implementation in the Munich Weekly platform.

## 📚 Related Documentation

Use [Authentication & Security](./auth.md) for implementation details,
[Privacy Policy](./privacy.md) for user-facing data handling, and
[Deployment Guide](./deployment.md) for production security operations.

**Development:**
- 📱 [Frontend Overview](./frontend-overview.md) - Client-side security implementation

---

## 🎯 Current Security Architecture

### Authentication System
- **Primary**: JWT-based authentication with 1-hour expiration
- **Storage**: localStorage (primary) + sessionStorage (fallback)
- **Algorithm**: HS256 (HMAC SHA-256)
- **Secret**: Managed through the JWT settings in [Environment Variables](./environment.md)

### Anonymous User Support
- **Mechanism**: Backend-signed HttpOnly `mw_vote_anon` cookie
- **Purpose**: Enable anonymous voting without user registration
- **Privacy**: No personal data collection for anonymous users
- **Constraint**: One vote per signed anonymous subject per submission, with broad IP-based throttles for excessive token issuance or repeated anonymous vote attempts

### User Roles & Permissions
- **User Role**: Basic functionality (vote, submit, manage own content)
- **Admin Role**: Full system access (manage issues, users, submissions)
- **Enforcement**: Both backend (@PreAuthorize) and frontend (ProtectedRoute)

### Password Security
- **Hashing**: BCrypt with automatic salt generation
- **Reset Flow**: Time-limited tokens (30 min) via Mailjet email service
- **One-time Use**: Tokens cannot be reused after successful reset

## 🛡️ Security Strengths

✅ **Strong Password Protection**
- BCrypt hashing with Spring Security defaults
- Secure password reset with email verification
- Input validation on all authentication endpoints

✅ **Privacy-Compliant Anonymous Voting**
- GDPR-compliant visitor tracking
- Backend-signed HttpOnly anonymous vote identity
- Transparent data handling policies

✅ **Comprehensive Role-Based Access Control**
- Clear separation between user and admin capabilities
- Both backend and frontend permission enforcement
- Automatic redirect to login for protected resources

✅ **Robust Frontend Authentication**
- Automatic token expiration detection (30-second buffer)
- Graceful handling of storage issues (private browsing)
- Dual storage strategy for reliability

✅ **Infrastructure Security**
- Environment variable configuration for secrets
- Secure email delivery via Mailjet
- Database constraints for data integrity

## ⚠️ Security Limitations & Risks

❌ **JWT in localStorage (XSS Vulnerability)**
- Tokens stored in localStorage are accessible to JavaScript
- High risk if XSS attacks succeed
- **Recommendation**: Move to httpOnly cookies

❌ **No Refresh Token Mechanism**
- Single JWT token without refresh capability
- Users must re-authenticate after 1-hour expiration
- **Recommendation**: Implement refresh token rotation

❌ **Limited Rate Limiting**
- No rate limiting on authentication endpoints
- Potential for brute force attacks
- **Recommendation**: Add rate limiting middleware

❌ **Single Secret Key**
- All tokens signed with same secret
- Compromise affects all users globally
- **Recommendation**: Implement key rotation strategy

❌ **Missing Security Headers**
- No Content Security Policy (CSP) implementation
- No additional XSS protection headers
- **Recommendation**: Add security headers middleware

## 🚀 Immediate Security Improvements

### Priority 1 (Critical)
1. **Move JWT to httpOnly Cookies**
   - Prevents XSS attacks from accessing tokens
   - Requires CSRF protection implementation
   - Improves overall security posture

2. **Implement Rate Limiting**
   - Add rate limiting to `/api/auth/**` endpoints
   - Prevent brute force attacks
   - Use Redis or in-memory store for rate tracking

### Priority 2 (High)
3. **Add Content Security Policy**
   - Implement CSP headers to prevent XSS
   - Configure for current tech stack (Next.js/React)
   - Start with report-only mode for testing

4. **Implement Refresh Tokens**
   - Add refresh token rotation mechanism
   - Longer-lived refresh tokens with strict validation
   - Automatic token renewal for better UX

### Priority 3 (Medium)
5. **Add Request Signing**
   - Sign critical requests (password change, admin actions)
   - Implement HMAC-based request verification
   - Additional layer of protection against tampering

6. **Enhance Session Management**
   - Track active sessions per user
   - Ability to revoke sessions remotely
   - Session activity monitoring

## 📊 Security Compliance Status

| Requirement | Status | Notes |
|-------------|--------|-------|
| GDPR Compliance | ✅ Complete | Anonymous voting, data deletion, privacy policy |
| Password Security | ✅ Complete | BCrypt hashing, secure reset flow |
| Access Control | ✅ Complete | Role-based permissions, route protection |
| Data Encryption | ⚠️ Partial | HTTPS in production, but JWT in localStorage |
| Input Validation | ✅ Complete | Validation on all endpoints |
| Error Handling | ✅ Complete | Secure error responses, no data leakage |
| Audit Logging | ❌ Missing | No audit trail for security events |
| Session Security | ⚠️ Partial | JWT validation but no session management |

## 🔍 Security Monitoring Needs

Currently **missing** but recommended:
- Failed login attempt monitoring
- Suspicious activity detection
- Security event logging and alerting
- Regular security health checks
- Automated vulnerability scanning

## 📞 Next Steps

1. **Review this security assessment** with your development team
2. **Prioritize critical improvements** based on risk assessment
3. **Implement security monitoring** for ongoing protection
4. **Schedule regular security reviews** (quarterly recommended)
5. **Consider external security audit** for comprehensive assessment

---

*This document reflects the current security implementation of the Munich Weekly platform*
*For detailed implementation guidance, refer to the complete [Authentication & Security documentation](./auth.md)*

## Protected API Endpoints

Protected route facts are maintained in [API Reference](./api.md),
[api.json](./api.json), and the backend security configuration. This summary
does not keep a hand-written endpoint inventory.

## 🔐 Security Audit History

### 2025-12-16: Comprehensive Security Hardening

**Audit Results:** ✅ No active malware or security threats detected. Previous security breach (June-December 2025) successfully remediated.

**Implemented Fixes:**

**1. PostgreSQL Database Hardening**
- Changed authentication from `trust` to `scram-sha-256` (password required)
- Restricted network access to localhost and Docker network only (172.18.0.0/16)
- Removed overly permissive `host all all all` rule
- Files: `backend/pgdata/pg_hba.conf`, `backend/pgdata/postgresql.conf`

**2. Docker Container Security**
- Backend container now runs as non-root user (`appuser`, UID 1001)
- Implemented principle of least privilege
- File: `backend/Dockerfile`
- Commit: `6b0d8e6`

**3. Process Security**
- Stopped unnecessary root PM2 daemon
- Only deploy user PM2 managing frontend application

**4. Documentation Sanitization**
- Removed server IP addresses from public documentation
- Replaced with `YOUR_SERVER_IP` placeholders
- File: `docs/deployment.md`

**Security Score Improvement:** 6/10 → 9.5/10

**Verification:** All services operational post-deployment, full functionality confirmed.
