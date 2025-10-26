# Dental Story - Dental Clinic Website

Modern, responsive website for Dental Story dental clinic built with React, TypeScript, and Tailwind CSS.

## Features

- 🦷 Modern dental clinic design
- 📱 Fully responsive layout
- ⚡ Fast performance with Vite
- 🎨 Beautiful UI with Tailwind CSS
- 📝 Contact form for appointments
- 🌐 Ukrainian language support
- ♿ Accessible design

## Tech Stack

- **Framework**: React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Icons**: Lucide React
- **Routing**: React Router DOM

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd dental-story-webapp
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env.local` in the project root (you can use `.env.example` as a reference):

```env
VITE_API_URL=http://localhost:3001/api
VITE_SITE_URL=http://localhost:3000
# Optional (can be empty locally)
VITE_GOOGLE_MAPS_API_KEY=
VITE_GOOGLE_ANALYTICS_ID=
VITE_SENTRY_DSN=
VITE_TURNSTILE_SITE_KEY=
VITE_ENVIRONMENT=development
VITE_ENABLE_SENTRY_IN_DEV=
VITE_PHONE_NUMBER=+380504554774
VITE_EMERGENCY_PHONE=+380504554774
VITE_EMAIL=info@dentalstory.com.ua
VITE_FACEBOOK_URL=https://facebook.com/dentalstory
VITE_INSTAGRAM_URL=https://instagram.com/dentalstory
VITE_TELEGRAM_URL=https://t.me/dentalstory
```

Notes:
- Dev server runs on port 3000 (see `vite.config.ts`). If it's busy, change the port or stop the process occupying it.
- Backend should be available at `VITE_API_URL`; otherwise some features will be limited locally.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run typecheck` - Run TypeScript type checking
- `npm run format` - Format code with Prettier

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Header.tsx      # Main navigation
│   └── Footer.tsx      # Site footer
├── pages/              # Page components
│   ├── Home.tsx        # Homepage
│   ├── Services.tsx    # Services page
│   ├── About.tsx       # About page
│   └── Contact.tsx     # Contact page
├── styles/             # Global styles
│   └── globals.css     # Tailwind CSS imports
├── utils/              # Utility functions
└── assets/             # Static assets

```

## Features Overview

### Pages

1. **Home** - Hero section, features, services overview
2. **Services** - Detailed list of dental services
3. **About** - Clinic information, team, values
4. **Contact** - Contact form, clinic info, FAQ

### Components

- Responsive navigation with mobile menu
- Professional footer with contact info
- Modern card-based layouts
- Accessible form components

## Deployment

Build for production:

```bash
npm run build
```

The built files will be in the `dist/` directory, ready for deployment.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT License - see LICENSE file for details.

## Contact

For questions about this website, contact Dental Story clinic:
- **Address:** Kyiv, Academician Koroleva Street, 10, Dniprovsky District
- **Phone:** +380 50 455 47 74
- **Email:** info@dentalstory.com.ua
- **Website:** www.dentalstory.com.ua
- **Google Maps:** https://maps.app.goo.gl/euKMW8R8eGTd2wJr9
- **Working Hours:**
  - Mon-Fri: 9:00-19:00
  - Sat: 9:00-16:00
  - Sun: Closed
