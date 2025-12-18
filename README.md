# Internal Metrics UI

A modern React application built with TypeScript, Vite, and Tailwind CSS for internal metrics tracking and visualization.

## 🚀 Tech Stack

- **Framework**: React 19.2.0
- **Language**: TypeScript 5.9.3
- **Build Tool**: Vite 7.2.4
- **Styling**: Tailwind CSS 4.1.18
- **State Management**: @preact/signals-react 3.6.1
- **UI Components**: Radix UI + shadcn/ui
- **Routing**: React Router DOM 7.10.1
- **Icons**: Lucide React

## 📁 Project Structure

```
internal-metrices-ui/
├── public/                      # Static assets
├── src/                         # Source code
│   ├── assets/                  # Asset files (images, SVG components)
│   │   └── svg/                 # SVG React components
│   │       ├── auth-background-shape.tsx
│   │       └── logo.tsx
│   │
│   ├── components/              # React components
│   │   ├── common/              # Shared/reusable components
│   │   │   ├── Logo.tsx         # Logo component
│   │   │   └── ProtectedRoute.tsx  # Route protection wrapper
│   │   │
│   │   ├── layout/              # Layout components
│   │   │   └── DashboardLayout.tsx  # Main dashboard layout
│   │   │
│   │   ├── ui/                  # UI component library (shadcn/ui)
│   │   │   ├── avatar.tsx
│   │   │   ├── breadcrumb.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── collapsible.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── input-otp.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── skeleton.tsx
│   │   │   └── tooltip.tsx
│   │   │
│   │   ├── app-sidebar.tsx      # Main application sidebar
│   │   ├── environment-switcher.tsx
│   │   ├── nav-main.tsx         # Main navigation component
│   │   ├── nav-projects.tsx     # Project navigation
│   │   ├── nav-user.tsx         # User navigation/profile
│   │   └── team-switcher.tsx    # Team switching component
│   │
│   ├── hooks/                   # Custom React hooks
│   │   └── use-mobile.ts        # Hook for mobile detection
│   │
│   ├── lib/                     # Utility libraries
│   │   ├── icon-map.ts          # Icon mapping utilities
│   │   └── utils.ts             # General utility functions
│   │
│   ├── pages/                   # Page components (Routes)
│   │   ├── Dashboard.tsx        # Dashboard page
│   │   └── Login.tsx            # Login/authentication page
│   │
│   ├── services/                # API and external services
│   │   ├── apiClient.ts         # API client configuration
│   │   └── auth.ts              # Authentication services
│   │
│   ├── signals/                 # State management (Preact Signals)
│   │   └── auth.ts              # Authentication state
│   │
│   ├── types/                   # TypeScript type definitions
│   │   ├── auth.ts              # Authentication types
│   │   └── sidebar.ts           # Sidebar types
│   │
│   ├── App.tsx                  # Main App component
│   ├── main.tsx                 # Application entry point
│   └── index.css                # Global styles
│
├── components.json              # shadcn/ui configuration
├── eslint.config.js             # ESLint configuration
├── index.html                   # HTML entry point
├── package.json                 # Dependencies and scripts
├── tsconfig.json                # TypeScript configuration
├── tsconfig.app.json            # TypeScript app configuration
├── tsconfig.node.json           # TypeScript Node configuration
├── vite.config.ts               # Vite configuration
└── README.md                    # This file
```

## 📂 Folder Descriptions

### `/src/assets/` - Static Assets

Contains static assets like images, SVG components, and other media files.

- **svg/**: React components for SVG icons and graphics (logo, background shapes, etc.)

### `/src/components/` - UI Components

All React components organized by purpose:

- **common/**: Reusable components used across the application (Logo, ProtectedRoute)
- **layout/**: Layout components that define page structure (DashboardLayout)
- **ui/**: UI component library from shadcn/ui - pre-built, accessible, customizable components

### `/src/hooks/` - Custom React Hooks

Custom React hooks for shared logic and state management:

- `use-mobile.ts`: Detects mobile devices and screen sizes

### `/src/lib/` - Utility Functions

Utility functions and helper libraries:

- **icon-map.ts**: Maps icon names to Lucide icon components for dynamic icon rendering
- **utils.ts**: General utility functions (e.g., `cn()` for className merging with Tailwind)

### `/src/pages/` - Pages (Routes)

Page-level components corresponding to different routes in the application:

- **Dashboard.tsx**: Main dashboard page
- **Login.tsx**: Authentication/login page

### `/src/services/` - API Layer

**Handles all external API communication:**

- **apiClient.ts**: Axios/fetch configuration, interceptors, base URL, request/response handling
- **auth.ts**: Authentication API calls (login, logout, token refresh, user data)

### `/src/signals/` - State Management

**Global state using Preact Signals (reactive state management):**

- **auth.ts**: Authentication state (user info, login status, tokens)
- Lightweight alternative to Redux/Zustand with automatic reactivity

### `/src/types/` - TypeScript Definitions

**Type safety across the application:**

- **auth.ts**: Authentication-related types (User, LoginCredentials, AuthResponse, etc.)
- **sidebar.ts**: Sidebar configuration and navigation types
- Interface definitions, type aliases, and enum declarations

## 🛠️ Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Preview production build
npm run preview
```

## 🎨 UI Components

This project uses **shadcn/ui** components built on top of **Radix UI**, providing:

- ✅ Accessible components following WAI-ARIA standards
- ✅ Fully customizable with Tailwind CSS
- ✅ Type-safe with TypeScript
- ✅ Dark mode support
- ✅ Copy-paste component system (not an npm package)

## 🔐 Authentication Flow

Authentication is handled through three layers:

1. **Services** (`/src/services/auth.ts`): API calls to backend
2. **State** (`/src/signals/auth.ts`): Global auth state management
3. **Types** (`/src/types/auth.ts`): Type definitions
4. **Protection** (`/src/components/common/ProtectedRoute.tsx`): Route guards

**Example Flow:**

```
Login Page → auth.service.login() → Updates authSignal → Redirects to Dashboard
Protected Route → Checks authSignal → Allows/Denies access
```

## 🚦 Routing Structure

Routes are managed with React Router DOM v7:

- **Public routes**: Login, landing pages
- **Protected routes**: Dashboard and all authenticated pages
- **Route protection**: Via ProtectedRoute wrapper component

## 📱 Responsive Design

- Mobile-first approach with Tailwind CSS
- Custom `use-mobile` hook for device detection
- Responsive sidebar with collapsible navigation
- Adaptive components for different screen sizes

## 🎯 Code Organization Best Practices

1. **Components**: Keep components small, focused, and single-responsibility
2. **Services**: Separate all API logic from UI components
3. **Types**: Define types in `/types` directory before using them
4. **Signals**: Use for global state that needs reactivity across components
5. **Utils**: Extract common logic to reusable utility functions
6. **Hooks**: Create custom hooks for reusable stateful logic

## 📝 Development Guidelines

### When adding new features:

1. **New API endpoint?** → Add to `/src/services/`
2. **New data type?** → Define in `/src/types/`
3. **Global state needed?** → Create signal in `/src/signals/`
4. **Reusable UI component?** → Add to `/src/components/common/`
5. **New page/route?** → Create in `/src/pages/`
6. **Reusable logic?** → Create custom hook in `/src/hooks/`
7. **Need an icon?** → Use Lucide React icons via icon-map

### File naming conventions:

- **Components**: PascalCase (e.g., `DashboardLayout.tsx`)
- **Utilities/hooks**: kebab-case (e.g., `use-mobile.ts`, `icon-map.ts`)
- **Types**: kebab-case (e.g., `auth.ts`, `sidebar.ts`)

## 🔧 Configuration Files

- **components.json**: shadcn/ui component configuration and paths
- **eslint.config.js**: Code linting rules and standards
- **tsconfig.json**: Base TypeScript compiler options
- **tsconfig.app.json**: TypeScript config for application code
- **tsconfig.node.json**: TypeScript config for Node.js (Vite config)
- **vite.config.ts**: Vite bundler and dev server configuration

## 🚀 Getting Started

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Start development server:**

   ```bash
   npm run dev
   ```

3. **Open browser:**
   ```
   http://localhost:5173
   ```

## 📚 Key Technologies Explained

### Preact Signals

Lightweight reactive state management. Changes to signals automatically update components.

```typescript
// Define a signal
const count = signal(0);

// Update signal
count.value++;

// Use in component - auto re-renders
<div>{count.value}</div>;
```

### shadcn/ui

Copy-paste component library built on Radix UI. Components are in your codebase, not node_modules.

```bash
# Add new component
npx shadcn@latest add button
```

### Lucide React

Icon library with 1000+ icons. Used throughout the application.

```typescript
import { Home, Settings } from "lucide-react";
```

## 📖 Quick Reference

| Need to...           | Go to...                         |
| -------------------- | -------------------------------- |
| Add API call         | `/src/services/`                 |
| Add new page         | `/src/pages/`                    |
| Add UI component     | `/src/components/` or use shadcn |
| Define types         | `/src/types/`                    |
| Add global state     | `/src/signals/`                  |
| Add utility function | `/src/lib/utils.ts`              |
| Add custom hook      | `/src/hooks/`                    |
| Add icons/assets     | `/src/assets/`                   |

## 🤝 Contributing

1. Follow the existing folder structure
2. Use TypeScript types for all new code
3. Keep components small and focused
4. Write meaningful commit messages
5. Test changes before committing

---

Built with ❤️ using React, TypeScript, and modern web technologies.
