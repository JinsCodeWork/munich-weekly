# 📚 Munich Weekly Documentation Index

Welcome to the comprehensive documentation for the Munich Weekly photography platform. This index provides easy navigation to all available documentation.

## 🚀 Quick Start

- 🏠 **[Project Overview](../README.md)** - Start here for platform overview and features
- 🧑‍💻 **[Developer Guide](./dev-guide.md)** - Development environment setup
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
- 📦 **[API Reference](./api.md)** - Complete endpoint documentation with authentication requirements
- 🗃️ **[Database Design](./database.md)** - Data model and schema design
- 💾 **[Storage System](./storage.md)** - File storage architecture (Local + Cloudflare R2)
- 🖼️ **[Image CDN System](./image-cdn.md)** - Advanced image optimization and delivery

### Infrastructure
- 🚀 **[Deployment Guide](./deployment.md)** - Production server setup on Hetzner Cloud
- 💪 **[Robustness Improvements](./robustness-improvements.md)** - System reliability enhancements

---

## 📱 Frontend Development

### Frontend Architecture
- 📱 **[Frontend Overview](./frontend-overview.md)** - Architecture and features overview
- 🏗️ **[Frontend Architecture](./frontend-architecture.md)** - Detailed technical architecture
- 🧩 **[UI Component Library](./ui-components.md)** - Component specifications and usage
- 🎨 **[Style System](./style-system.md)** - Typography and styling framework
- 🧱 **[Masonry Layout System](./masonry-layout-system.md)** - Advanced JavaScript-based layout system

### Key Frontend Features
- **Next.js 15** with App Router and TypeScript
- **Enhanced Responsive Container System** with professional spacing (20px mobile → 60px ultra-wide)
- **Multi-Variant Layout Support** (narrow/wide/ultrawide containers for different content types)
- **Advanced Masonry Layout** with Greedy Best-Fit algorithm and responsive configurations
- **Specialized Page Configurations** (Vote page optimized for large images, Account pages for sidebar layouts)
- **Three-Breakpoint Responsive Design** (mobile/tablet/desktop) optimized for photography presentation
- **Tailwind CSS** styling with glassmorphism effects and professional spacing
- **JWT Authentication Context** with automatic token management
- **Anonymous Voting System** with cookie-based visitor tracking

---

## 👥 User & Admin Guides

### End User Documentation
- 👤 **[User Guide](./user-guide.md)** - Platform usage instructions for end users
- 🧑‍💻 **[Developer Guide](./dev-guide.md)** - Development environment and best practices

### Administrative Documentation
- 🔧 **[Admin Guide](./admin-guide.md)** - Platform administration and management

---

## 📊 Documentation by Role

### For Developers
1. Start with [Project Overview](../README.md)
2. Set up development environment: [Developer Guide](./dev-guide.md)
3. Understand security: [Authentication & Security](./auth.md)
4. Learn the frontend: [Frontend Overview](./frontend-overview.md)
5. Explore advanced layouts: [Masonry Layout System](./masonry-layout-system.md)
6. API integration: [API Reference](./api.md)

### For DevOps/System Administrators
1. Review security architecture: [Security Summary](./security-summary.md)
2. Production deployment: [Deployment Guide](./deployment.md)
3. Security implementation: [Authentication & Security](./auth.md)
4. Storage configuration: [Storage System](./storage.md)
5. System reliability: [Robustness Improvements](./robustness-improvements.md)

### For Project Managers/Stakeholders
1. Platform overview: [Project Overview](../README.md)
2. Security status: [Security Summary](./security-summary.md)
3. Privacy compliance: [Privacy Policy](./privacy.md)
4. User documentation: [User Guide](./user-guide.md)

### For End Users
1. How to use the platform: [User Guide](./user-guide.md)
2. Privacy and data handling: [Privacy Policy](./privacy.md)

---

## 🔄 Documentation Maintenance

### Last Updated
- **Masonry Layout System**: January 2025 (New documentation for advanced JavaScript-based layout system)
- **Security Documentation**: January 2025 (Complete rewrite based on current implementation)
- **Other Documentation**: Various dates (see individual documents)

### Contributing to Documentation
When updating documentation, ensure:
1. Cross-references are updated in related documents
2. The security documentation reflects actual implementation
3. Examples use current API endpoints and authentication methods
4. Links in this index page are verified and working
5. Masonry layout documentation reflects current algorithm implementation

---

## 🆘 Need Help?

- **Technical Questions**: Refer to [Developer Guide](./dev-guide.md)
- **Security Concerns**: See [Security Summary](./security-summary.md)
- **Privacy Questions**: Check [Privacy Policy](./privacy.md)
- **Contact**: dongkai.jin@tum.de

---

*This documentation index provides navigation to all Munich Weekly platform documentation. For quick access, bookmark this page.* 