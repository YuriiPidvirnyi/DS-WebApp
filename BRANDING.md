# Dental Story Branding

This document summarizes the branding integration for Dental Story within the DS-WebApp.

## Brand Assets
- Source folder (local): `C:\Users\ipidvirnyi\Projects\DS\DS-Branding`
- Project assets:
  - Logo SVG: `public/assets/images/logo/logo.svg`
  - OG image: `public/assets/images/og/og-image.svg`
  - Favicons:
    - `public/assets/images/favicon/favicon.svg`
    - `public/assets/images/favicon/apple-touch-icon.svg`

## Colors
- Primary: `#AECED3` (RGB 174,206,211; CMYK 31,8,14,0)
- Secondary: `#D1CAC0` (RGB 209,202,192; CMYK 18,17,22,0)
- White: `#FFFFFF`

Tailwind config exposes:
- `bg-dental-primary`, `text-dental-primary`
- `bg-dental-secondary`, `text-dental-secondary`
- `text-dental-white`

CSS variables (globals.css):
- `--dental-primary`, `--dental-secondary`, `--dental-white`

## Typography
- Primary font: Stolzl Medium (fallbacks to Inter, system-ui)
- Config: `globals.css` @font-face and Tailwind `theme.extend.fontFamily.sans`

## Logo Usage
- React component: `src/components/ui/Logo.tsx`
- Examples:
  - Header: `<Logo variant="default" size="md" />`
  - Footer (dark bg): `<Logo variant="white" size="md" />`

## Meta and Theming
- `index.html` theme-color: `#AECED3`
- `manifest.json` theme_color: `#AECED3`

## To refine (next steps)
- Export official SVG from AI/EPS to replace the current constructed SVG if required
- Generate raster icons (32/16/192/512) directly from official mark
- Ensure OG image typography matches Stolzl if available in web-safe format
