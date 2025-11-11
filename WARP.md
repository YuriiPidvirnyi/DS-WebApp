# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

Essential commands for development workflow:

- `npm run dev` - Start Vite development server (runs on port 3000)
- `npm run build` - Build for production (TypeScript compilation + Vite build)
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint with TypeScript support
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run typecheck` - Run TypeScript type checking without emitting files
- `npm run format` - Format code with Prettier

## Architecture Overview

This is a modern React 18 + TypeScript dental clinic website built with:

### Core Stack

- **React 18** with React Router DOM for client-side routing
- **TypeScript** with strict configuration
- **Vite** as build tool with React plugin
- **Tailwind CSS** with custom dental theme colors and Inter font

### Project Structure

```
src/
├── components/
│   ├── ui/              # Reusable UI components (Button, Card, Input, Spinner)
│   ├── Header.tsx       # Main navigation
│   ├── Footer.tsx       # Site footer
│   ├── Testimonials.tsx # Reviews section
│   ├── ContactForm.tsx  # Contact form with validation
│   └── LoadingPage.tsx  # Loading fallback for lazy routes
├── pages/               # Route components (Home, Services, About, Contact, Gallery, NotFound)
├── hooks/               # Custom hooks (useForm)
├── services/            # API layer (api.ts, appointments.ts)
├── types/               # TypeScript type definitions
├── utils/               # Utilities (constants, validation, formatters)
├── styles/              # Global CSS with Tailwind + accessibility
├── App.tsx              # Main app with lazy loaded routing
└── main.tsx             # React app entry point
```

### Custom Configuration

**Path Aliases**: `@/` maps to `./src/` (configured in both vite.config.ts and tsconfig.json)

**Custom Tailwind Colors**:

- `dental-blue: #2563eb` - Primary brand color
- `dental-teal: #14b8a6` - Secondary/accent color
- `dental-green: #10b981` - Tertiary color
- Extended primary palette (50, 100, 500, 600, 700)

**TypeScript**: Strict mode enabled with additional linting rules for unused locals/parameters

## Language and Content

- **Primary Language**: Ukrainian (all UI text, content, and navigation)
- **Target Audience**: Ukrainian dental patients
- **Content Focus**: Professional dental services, patient comfort, modern equipment

## Development Patterns

### Component Structure

- Functional components with TypeScript interfaces
- React Router DOM for navigation with active state detection
- Responsive design with mobile-first approach using Tailwind breakpoints
- Lucide React for consistent iconography

### Styling Approach

- Utility-first with Tailwind CSS
- Custom color palette for dental branding
- Gradient backgrounds and professional healthcare aesthetics
- Responsive navigation with mobile hamburger menu

### Code Formatting

- Prettier configured with single quotes, no semicolons, 2-space indentation
- ESLint with TypeScript and React hooks rules
- Trailing commas in ES5 style

## Development Workflow

1. Run `npm run dev` to start development
2. Use `npm run typecheck` to verify types during development
3. Run `npm run lint:fix` before commits to maintain code quality
4. Use `npm run format` to ensure consistent formatting
5. Build with `npm run build` and test with `npm run preview` before deployment

## New Components and Features

### UI Components (`src/components/ui/`)

- **Button** - 4 variants, 3 sizes, loading state
- **Card** - with Header, Title, Description, Footer sub-components
- **Input/Textarea/Select** - Full validation, error states, accessibility
- **Spinner** - Multiple sizes and colors for loading states

### Pages

- **Home** - Hero, features, services preview, testimonials
- **Services** - 6 service categories with detailed lists
- **About** - Team, values, equipment, clinic history
- **Contact** - Form with validation, contact info, FAQ
- **Gallery** - Image gallery with lightbox, category filters
- **NotFound (404)** - Custom error page

### Utilities

- **useForm hook** - Universal form state management
- **validation.ts** - Ukrainian phone/name validation
- **formatters.ts** - Date/time/currency formatting
- **constants.ts** - Centralized contact info and navigation

### Performance & Optimization

- React.lazy + Suspense for all routes (code splitting)
- LoadingPage fallback component
- Optimized bundle size

## Key Features to Maintain

- Ukrainian language consistency across all text content
- Professional dental/medical visual theme
- Mobile responsiveness for all components
- Full accessibility (ARIA labels, keyboard navigation, focus states)
- SEO optimization with structured data and Open Graph
- Form validation with real-time error messages
- API-ready structure with mock data for development
