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
│   │   │   ├── ProtectedRoute.tsx  # Route protection wrapper
│   │   │   └── FormPopup.tsx    # Reusable form dialog component
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
│   │   ├── use-mobile.ts        # Hook for mobile detection
│   │   └── useSidebar.ts        # Hook for sidebar data consumption
│   │
│   ├── lib/                     # Utility libraries
│   │   ├── icon-map.ts          # Icon mapping utilities
│   │   └── utils.ts             # General utility functions
│   │
│   ├── pages/                   # Page components (Routes)
│   │   ├── Dashboard.tsx        # Dashboard home page
│   │   ├── DynamicContent.tsx   # Dynamic pages based on sidebar items
│   │   └── Login.tsx            # Login/authentication page
│   │
│   ├── services/                # API and external services
│   │   ├── apiClient.ts         # API client configuration
│   │   ├── auth.ts              # Authentication services
│   │   └── sidebar.ts           # Sidebar data API services
│   │
│   ├── signals/                 # State management (Preact Signals)
│   │   ├── auth.ts              # Authentication state
│   │   ├── login.ts             # Login flow state (phone, OTP, loading)
│   │   ├── sidebar.ts           # Sidebar data state
│   │   ├── dynamicContent.ts    # Dynamic content page state
│   │   └── formPopup.ts         # Form popup data state
│   │
│   ├── types/                   # TypeScript type definitions
│   │   ├── auth.ts              # Authentication types
│   │   └── sidebar.ts           # Sidebar config types (DrawerItem, SubMenuItem, Button, etc.)
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
├── .env.development             # Development environment variables
├── .env.production              # Production environment variables
└── README.md                    # This file
```

## 📂 Folder Descriptions

### `/src/assets/` - Static Assets

Contains static assets like images, SVG components, and other media files.

- **svg/**: React components for SVG icons and graphics (logo, background shapes, etc.)

### `/src/components/` - UI Components

All React components organized by purpose:

- **common/**: Reusable components used across the application
  - `Logo.tsx`: App logo component
  - `ProtectedRoute.tsx`: Route protection wrapper
  - `FormPopup.tsx`: Reusable dialog form with dynamic fields (text, select, date)
- **layout/**: Layout components that define page structure (DashboardLayout)
- **ui/**: UI component library from shadcn/ui - pre-built, accessible, customizable components

### `/src/hooks/` - Custom React Hooks

Custom React hooks for shared logic and state management:

- `use-mobile.ts`: Detects mobile devices and screen sizes
- `useSidebar.ts`: Provides sidebar data from signals with loading/error states

### `/src/lib/` - Utility Functions

Utility functions and helper libraries:

- **icon-map.ts**: Maps icon names to Lucide icon components for dynamic icon rendering
- **utils.ts**: General utility functions (e.g., `cn()` for className merging with Tailwind)

### `/src/pages/` - Pages (Routes)

Page-level components corresponding to different routes in the application:

- **Dashboard.tsx**: Main dashboard home page
- **DynamicContent.tsx**: Dynamic pages rendered based on sidebar item clicks (supports buttons, search, tables)
- **Login.tsx**: Authentication/login page with phone + OTP verification

### `/src/services/` - API Layer

**Handles all external API communication:**

- **apiClient.ts**: Axios/fetch configuration, interceptors, base URL, request/response handling
- **auth.ts**: Authentication API calls (sendOtp, verifyOtp, user data)
- **sidebar.ts**: Sidebar configuration API (fetchSidebarData, fetchDataByUrl, submitFormData)

### `/src/signals/` - State Management

**Global state using Preact Signals (reactive state management):**

- **auth.ts**: Authentication state (user info, login status, tokens)
- **login.ts**: Login flow state (loginStep, phoneNumber, otp, loginLoading, loginError)
- **sidebar.ts**: Sidebar configuration data with helper functions
- **dynamicContent.ts**: Dynamic page state (currentContentItem, popupOpen, currentPopupButton)
- **formPopup.ts**: Form popup data state with update/reset functions

**All components use Preact Signals for state management** - no useState/useReducer

### `/src/types/` - TypeScript Definitions

**Type safety across the application:**

- **auth.ts**: Authentication-related types (User, LoginCredentials, AuthResponse, etc.)
- **sidebar.ts**: Complete sidebar API types
  - `DrawerItem`: Main menu items with submenus
  - `SubMenuItem`: Submenu items with tables/buttons/search
  - `Button`: Button configurations (action, popup fields)
  - `TableHeader`, `Search`, `PopupField`, `SelectOption`
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

Authentication is handled through multiple layers:

1. **Services** (`/src/services/auth.ts`): API calls to backend (sendOtp, verifyOtp)
2. **State** (`/src/signals/auth.ts` + `/src/signals/login.ts`): Global auth state management
3. **Types** (`/src/types/auth.ts`): Type definitions
4. **Protection** (`/src/components/common/ProtectedRoute.tsx`): Route guards

**Phone + OTP Flow:**

```
Login Page → Enter Phone → sendOtp() → Enter OTP → verifyOtp() → Updates authSignal → Redirects to Dashboard
Protected Route → Checks authSignal → Allows/Denies access
```

## 🎯 Sidebar & Dynamic Content System

**Sidebar data is fetched from external API and drives the entire navigation:**

1. **API** (`/src/services/sidebar.ts`): Fetches sidebar config from `VITE_SIDEBAR_API_URL`
2. **State** (`/src/signals/sidebar.ts`): Stores sidebar data globally
3. **Hook** (`/src/hooks/useSidebar.ts`): Provides easy access to sidebar data
4. **Types** (`/src/types/sidebar.ts`): Complete type definitions for sidebar structure
5. **Dynamic Pages** (`/src/pages/DynamicContent.tsx`): Renders pages based on sidebar config

**Flow:**

```
API Response → sidebarData signal → nav-main.tsx renders menu → Click item → /dashboard/* route → DynamicContent page → Renders buttons/search/tables from config
```

**Each sidebar item can have:**
- Buttons (with popups, forms, actions)
- Search functionality
- Data tables with headers
- Nested submenus

## 🚦 Routing Structure

Routes are managed with React Router DOM v7:

- **Public routes**: `/login` - Login/authentication page
- **Protected routes**: 
  - `/dashboard` - Dashboard home
  - `/dashboard/*` - Dynamic pages based on sidebar config
- **Route protection**: Via ProtectedRoute wrapper component

**Dynamic Routing:**
Sidebar items automatically generate routes like:
- `/dashboard/lectures`
- `/dashboard/lectures/video-lectures`
- `/dashboard/students`

All these routes are handled by `DynamicContent.tsx` which renders based on the clicked sidebar item.

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

## 🌍 Environment Variables

The project uses environment-specific variables:

**`.env.development`** (Development mode):
```env
VITE_API_BASE_URL=https://platform-dev.arivihan.com/internal-metrics
VITE_SIDEBAR_API_URL=https://master.free.beeceptor.com/get-sidebar-data
```

**`.env.production`** (Production mode):
```env
VITE_API_BASE_URL=https://platform.arivihan.com/internal-metrics
VITE_SIDEBAR_API_URL=https://api.arivihan.com/sidebar-data
```

**Usage in code:**
```typescript
const apiUrl = import.meta.env.VITE_SIDEBAR_API_URL
```

## 🚀 Getting Started

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:**
   - Ensure `.env.development` exists with correct URLs
   - For production, create `.env.production`

3. **Start development server:**

   ```bash
   npm run dev
   ```

4. **Open browser:**
   ```
   http://localhost:3000
   ```

## 📚 Key Technologies Explained

### Preact Signals

Lightweight reactive state management. Changes to signals automatically update components.

**All components in this project use Preact Signals (no useState).**

```typescript
// Define a signal
import { signal } from '@preact/signals-react';
const count = signal(0);

// Update signal
count.value++;

// Use in component with useSignals()
import { useSignals } from '@preact/signals-react/runtime';

function Counter() {
  useSignals(); // Required for automatic reactivity
  return <div>{count.value}</div>;
}
```

**Why Signals?**
- ✅ Auto-reactive (no manual re-renders)
- ✅ Global state without Context
- ✅ TypeScript friendly
- ✅ Smaller bundle size than Redux/Zustand

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

| Need to...                | Go to...                         |
| ------------------------- | -------------------------------- |
| Add API call              | `/src/services/`                 |
| Add new page              | `/src/pages/`                    |
| Add UI component          | `/src/components/` or use shadcn |
| Define types              | `/src/types/`                    |
| Add global state (signal) | `/src/signals/`                  |
| Add utility function      | `/src/lib/utils.ts`              |
| Add custom hook           | `/src/hooks/`                    |
| Add icons/assets          | `/src/assets/`                   |
| Configure environment     | `.env.development`               |
| Modify sidebar            | Update API endpoint              |

## 🤝 Contributing

1. Follow the existing folder structure
2. Use TypeScript types for all new code
3. Keep components small and focused
4. Write meaningful commit messages
5. Test changes before committing

---

Built with ❤️ using React, TypeScript, and modern web technologies.
