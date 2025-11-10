# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Build and Development

- `npm run dev` - Start development server (runs on port 3000)
- `npm run build` - Build for production (includes TypeScript compilation)
- `npm run preview` - Preview production build

### Code Quality and Testing

- `npm run lint` - Run ESLint (max 100 warnings allowed)
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run typecheck` - Run TypeScript type checking
- `npm run format` - Format code with Prettier
- `npm run test` - Run unit tests with Vitest
- `npm run test:run` - Run tests once
- `npm run test:coverage` - Run tests with coverage

### End-to-End Testing

- `npm run test:e2e` - Run Playwright E2E tests (requires build first)
- `npm run test:e2e:ui` - Run E2E tests with UI
- `npm run test:visual` - Run visual regression tests

### Performance and Quality Checks

- `npm run perf:build` - Build and check performance budgets
- `npm run lighthouse` - Run Lighthouse audit
- `npm run size` - Check bundle size with size-limit

## Architecture Overview

### Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM v7
- **Forms**: React Hook Form with Zod validation
- **Internationalization**: react-i18next
- **Icons**: Lucide React
- **PWA**: vite-plugin-pwa with Workbox

### Key Directory Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Basic UI primitives (Button, Input, etc.)
│   ├── admin/           # Admin-specific components
│   ├── clinical/        # Clinical/medical components
│   ├── patient/         # Patient portal components
│   └── providers/       # Context providers
├── pages/               # Route components (lazy-loaded)
├── services/            # API services and external integrations
├── hooks/               # Custom React hooks
├── utils/               # Utility functions
├── styles/              # Global CSS and Tailwind config
└── i18n/               # Internationalization files
```

### Core Features

- **Dental Clinic Website**: Modern responsive website for Dental Story clinic
- **Booking System**: Integration with CliniCards API for appointments
- **Multi-language**: Ukrainian language support via i18next
- **Accessibility**: WCAG compliant with accessibility features
- **Performance**: Optimized with lazy loading, code splitting, PWA features
- **Monitoring**: Sentry integration, performance tracking, analytics
- **Security**: Content Security Policy, Turnstile CAPTCHA integration

### Development Patterns

#### Component Architecture

- Components follow the pattern: UI components in `components/ui/`, feature components in domain folders
- Lazy loading used for all pages via `React.lazy()`
- Error boundaries wrap the entire application
- Toast notifications via react-hot-toast

#### State Management

- Form state managed by React Hook Form with Zod schemas
- Global state via React Context (AccessibilityProvider, ToastProvider)
- API state managed through custom services with caching

#### API Integration

- Centralized API client in `services/api.ts`
- CliniCards integration for booking system
- Offline support via service workers and request queuing

#### Testing Strategy

- Unit tests with Vitest and Testing Library
- E2E tests with Playwright
- Visual regression testing
- Accessibility testing with axe-core

### Environment Configuration

The application uses environment variables for configuration. Key variables:

- `VITE_API_URL` - Backend API endpoint
- `VITE_SENTRY_DSN` - Error tracking
- `VITE_GOOGLE_ANALYTICS_ID` - Analytics
- `VITE_TURNSTILE_SITE_KEY` - Cloudflare Turnstile

### Performance Considerations

- Bundle size monitoring with size-limit
- Performance budgets enforced
- Lighthouse CI integration
- Image optimization and lazy loading
- Service worker for caching strategies

### Code Style

- ESLint configuration allows max 100 warnings
- Prettier for code formatting
- TypeScript strict mode enabled
- Specific ESLint rule overrides for admin, service, and test files
