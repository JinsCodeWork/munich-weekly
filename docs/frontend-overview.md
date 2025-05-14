# Munich Weekly - Frontend Overview

## Introduction

The Munich Weekly frontend is a modern, responsive web application built using Next.js and TypeScript. It provides a user-friendly interface for the photography submission and voting platform, designed to be accessible on both desktop and mobile devices.

## Quick Links

- [Frontend Architecture](./frontend-architecture.md) - Detailed architecture overview
- [UI Component Library](./ui-components.md) - Documentation of all UI components
- [Frontend Development Guide](./frontend-development-guide.md) - Step-by-step development guide

## Key Features

The frontend implementation includes the following features:

1. **Responsive Design**
   - Mobile-first approach with adaptive layouts
   - Support for a wide range of devices and screen sizes

2. **Modern Authentication System**
   - JWT-based authentication
   - Email registration and login
   - Persistent sessions
   - Protected routes

3. **User Interface**
   - Clean, modern aesthetic with glassmorphism effects
   - Animated transitions and interactions
   - Consistent design language

4. **Account Management**
   - User profile editing
   - Submission management
   - Account settings

5. **Navigation**
   - Responsive navigation system
   - Mobile navigation with slide-in menu
   - User state-aware navigation elements

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Authentication**: JWT tokens
- **API Integration**: Fetch API with RESTful endpoints

## Getting Started

### Prerequisites

- Node.js (v16.0.0 or later)
- npm (v7.0.0 or later) or Yarn (v1.22.0 or later)

### Quick Start

1. Clone the repository
2. Navigate to the frontend directory: `cd frontend`
3. Install dependencies: `npm install`
4. Start the development server: `npm run dev`
5. Open your browser to `http://localhost:3000`

For detailed setup instructions, refer to the [Frontend Development Guide](./frontend-development-guide.md).

## Project Structure Overview

```
frontend/
├── src/
│   ├── app/                # Next.js pages and layouts
│   │   ├── account/        # User account pages
│   │   └── ...
│   ├── components/         # UI components
│   │   ├── auth/           # Authentication components
│   │   ├── navigation/     # Navigation components
│   │   └── ui/             # Core UI components
│   ├── context/            # React Context providers
│   └── lib/                # Utilities and helpers
└── public/                 # Static assets
```

## Current Status

The frontend currently implements:

- Complete authentication flow (registration, login, logout)
- User profile management
- Responsive navigation
- Account settings page
- Core UI component library

## Roadmap

Planned future enhancements:

1. Photo submission interface
2. Gallery view for weekly issues
3. Voting system
4. User notifications
5. Multi-language support (English/Chinese)

## Contributing

To contribute to the frontend development:

1. Review the [Frontend Architecture](./frontend-architecture.md) document
2. Follow the coding standards in the [Frontend Development Guide](./frontend-development-guide.md)
3. Use components from the [UI Component Library](./ui-components.md) where possible

## Screenshots

_This section will contain screenshots of key pages once the design is finalized._ 