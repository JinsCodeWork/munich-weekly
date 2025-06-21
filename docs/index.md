# 📚 Munich Weekly Documentation Index

Welcome to the comprehensive documentation for the Munich Weekly photography platform. This index provides easy navigation to all available documentation.

## 🚀 Quick Start

- 🏠 **[Project Overview](../README.md)** - Start here for platform overview and features
- 🚀 **[Deployment Guide](./deployment.md)** - Production deployment instructions

---

## 🔐 Security & Privacy

### Core Security Documentation
- 🔐 **[Authentication & Security](./auth.md)** - Complete security implementation guide
- 🔒 **[Security Summary](./security-summary.md)** - Executive security overview and improvement roadmap
- 🛡️ **[Privacy Policy](./privacy.md)** - GDPR compliance and data protection policies

### Key Security Features
- **JWT Authentication** with 1-hour token expiration
- **Anonymous Voting System** using UUID-based visitor tracking
- **Role-Based Access Control** (User/Admin permissions)
- **BCrypt Password Hashing** with secure reset functionality
- **GDPR-Compliant Data Handling** for EU users

---

## 🏗️ Architecture & API

### Technical Architecture
- 📦 **[API Reference](./api.md)** - Complete endpoint documentation
- 🗃️ **[Database Design](./database.md)** - Data model and schema design
- 💾 **[Storage System](./storage.md)** - File storage architecture
- 🖼️ **[Image CDN System](./image-cdn.md)** - Advanced image optimization and delivery

### Infrastructure
- 🚀 **[Deployment Guide](./deployment.md)** - Production server setup on Hetzner Cloud

---

## 📱 Frontend Development

### Frontend Architecture
- 📱 **[Frontend Overview](./frontend-overview.md)** - Architecture and features overview
- 🏗️ **[Frontend Architecture](./frontend-architecture.md)** - Detailed technical architecture
- 🧩 **[UI Component Library](./ui-components.md)** - Component specifications and usage
- 🎨 **[Style System](./style-system.md)** - Typography and styling framework
- 🧱 **[Masonry Layout System](./masonry-layout-system.md)** - Advanced layout system

### Key Frontend Features
- **Next.js 15** with App Router and TypeScript
- **Stored Dimension Optimization** - 60-80% faster masonry layout calculation
- **Gallery Carousel System** - Featured submissions with auto-play and full-screen viewing
- **Enhanced Responsive Container System** with professional spacing (20px mobile → 60px ultra-wide)
- **Multi-Variant Layout Support** (narrow/wide/ultrawide containers for different content types)
- **Hybrid Masonry Layout** with backend ordering and frontend Skyline positioning
- **Progressive Loading** with mobile-optimized batch processing and stored dimension fallback
- **Admin Performance Metrics** - Real-time optimization statistics for administrators
- **Issue Management Interface** with full CRUD operations for administrators
- **Specialized Page Configurations** (Vote page optimized for large images, Account pages for sidebar layouts)
- **Three-Breakpoint Responsive Design** (mobile/tablet/desktop) optimized for photography presentation
- **Tailwind CSS** styling with glassmorphism effects and professional spacing
- **JWT Authentication Context** with automatic token management
- **Anonymous Voting System** with cookie-based visitor tracking

---

## 👥 User & Admin Guides

### End User Documentation
- 👤 **[User Guide](./user-guide.md)** - Platform usage instructions for end users

### Administrative Documentation
- 🔧 **[Admin Guide](./admin-guide.md)** - Platform administration and management

### Admin Features
- **Data Migration Tools** - Safe batch processing for image dimension optimization
- **Gallery Management** - Issue-based gallery organization and featured carousel curation
- **Performance Monitoring** - Real-time optimization metrics and statistics
- **Migration Analytics** - Analysis mode to preview migration requirements
- **Batch Configuration** - Configurable processing sizes and delays

---

## 📊 Documentation by Role

### For Developers
1. Start with [Project Overview](../README.md)
2. Follow the [Contributing Guide](./contributing.md) for GitHub Flow workflow
3. Understand security: [Authentication & Security](./auth.md)
4. Learn the frontend: [Frontend Overview](./frontend-overview.md)
5. Explore stored dimension optimization: [Masonry Layout System](./masonry-layout-system.md)
6. API integration: [API Reference](./api.md)

### For DevOps/System Administrators
1. Review security architecture: [Security Summary](./security-summary.md)
2. Production deployment: [Deployment Guide](./deployment.md)
3. Security implementation: [Authentication & Security](./auth.md)
4. Storage configuration: [Storage System](./storage.md)
5. Database schema updates: [Database Design](./database.md)

### For Project Managers/Stakeholders
1. Platform overview: [Project Overview](../README.md)
2. Performance enhancements overview (see section above)
3. Security status: [Security Summary](./security-summary.md)
4. Privacy compliance: [Privacy Policy](./privacy.md)
5. User documentation: [User Guide](./user-guide.md)

### For Platform Administrators
1. Platform administration: [Admin Guide](./admin-guide.md)
2. Data migration procedures for performance optimization
3. Performance monitoring and optimization metrics
4. Batch processing configuration and execution

### For End Users
1. How to use the platform: [User Guide](./user-guide.md)
2. Privacy and data handling: [Privacy Policy](./privacy.md)

---

## 🔄 Documentation Maintenance

### Contributing to Documentation
When updating documentation, ensure:
1. Cross-references are updated in related documents
2. The security documentation reflects actual implementation
3. Examples use current API endpoints and authentication methods
4. Links in this index page are verified and working
5. Follow the [Contributing Guide](./contributing.md) for documentation changes
6. Performance optimization features are accurately documented
7. Database schema changes are reflected across all relevant docs
8. Admin migration procedures are clearly explained
9. Masonry layout documentation reflects current stored dimension implementation
10. New features are documented in both API reference and frontend overview

---

## 🆘 Need Help?

- **Performance Questions**: See [Masonry Layout System](./masonry-layout-system.md)
- **Migration Issues**: Check [Admin Guide](./admin-guide.md) migration section
- **Security Concerns**: See [Security Summary](./security-summary.md)
- **Privacy Questions**: Check [Privacy Policy](./privacy.md)
- **Contact**: dongkai.jin@tum.de

---

*This documentation index provides navigation to all Munich Weekly platform documentation.*

- **User Authentication**: Secure JWT-based authentication (login, registration, password reset).
- **Submission System**: Users can submit photos to active issues.
- **Voting System**: Users can vote on submissions.
- **Gallery System** - Issue-based gallery organization with cover images and submission ordering
- **Gallery Carousel System** - Featured submissions with auto-play and full-screen viewing
- **Promotion Management System**: Admins can create and manage dedicated promotion pages.
- **Admin Dashboard**: Comprehensive tools for managing users, issues, and submissions.
- **Image CDN & Optimization**: On-the-fly image processing via Cloudflare for optimal performance.
- **Data Migration**: Tools for seamless data analysis and migration.
- **Responsive UI**: Modern, responsive design built with Next.js and Tailwind CSS.
- **Lessons Learned**: [Lessons Learned](./lessons-learned.md)

---

*This documentation index provides navigation to all Munich Weekly platform documentation.* 