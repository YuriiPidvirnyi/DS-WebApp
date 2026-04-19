# Performance & Bundle Strategy

> Audit date: 2026-04-19 (B9). Next scheduled review: after each major dependency bump.

---

## 1. Code-splitting strategy

The project uses **Next.js 16 App Router** with **Turbopack** in development. In production, Webpack handles the build.

### Automatic splitting (always on)

- Every `app/` route segment gets its own JS chunk — the router only downloads what the current page needs.
- Server Components (the default) ship zero JS to the browser; only `'use client'` subtrees are bundled.
- `next/dynamic` wraps heavy client-only libraries that would otherwise inflate the shared chunk.

### Manual splitting via `next/dynamic`

All charting and visualisation components use `{ ssr: false }` so recharts is excluded from the SSR bundle entirely and tree-shaken from every route that does not import it.

---

## 2. Recharts — lazy-load status

| Location                                 | Import style                                                  | Status             |
| ---------------------------------------- | ------------------------------------------------------------- | ------------------ |
| `app/admin/page.tsx` (dashboard)         | `dynamic(() => import('recharts').then(...), { ssr: false })` | **Lazy — correct** |
| `src/views/admin/AdminAnalyticsPage.tsx` | No recharts import at all                                     | **Not applicable** |

**Finding (B9 audit):** `AdminAnalyticsPage` renders its timeline and breakdown charts as plain CSS bar charts (styled `<div>` elements) — recharts is not used there. No code change was required.

The dashboard (`app/admin/page.tsx`) already lazy-loads five recharts exports individually:

```typescript
const Tooltip        = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), {
  ssr: false,
  loading: () => <div className="h-48 bg-dental-primary-50 rounded animate-pulse" />,
})
const PieChart = dynamic(() => import('recharts').then(m => m.PieChart), { ssr: false })
const Pie    = dynamic(() => import('recharts').then(m => m.Pie),    { ssr: false })
const Cell   = dynamic(() => import('recharts').then(m => m.Cell),  { ssr: false })
```

---

## 3. Key optimisations already in place

### `optimizePackageImports` (next.config.ts)

```typescript
experimental: {
  optimizePackageImports: ['lucide-react', 'recharts', '@sentry/nextjs'],
}
```

Next.js rewrites these imports at build time to pull only the individual modules that are actually used, avoiding barrel-file re-exports that force the entire package into the chunk.

> **Note:** `i18next` and `react-i18next` are intentionally excluded — adding them breaks JSON resource loading and strips translation keys from bundles.

### `modularizeImports` (next.config.ts)

```typescript
modularizeImports: {
  'lucide-react': {
    transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
  },
},
```

Lucide icons are transformed to direct ESM paths, eliminating the entire icon barrel (`~1 MB` unminified) from every route that imports fewer than all icons.

### `ssr: false` on all chart components

Recharts depends on `window`/`document` APIs. Setting `ssr: false` prevents hydration mismatches and ensures the library is never included in the server-rendered HTML payload.

### PWA / Workbox runtime caching (next.config.ts)

The service worker applies differentiated caching strategies:

| Asset type          | Strategy                    | TTL                 |
| ------------------- | --------------------------- | ------------------- |
| Google Fonts        | CacheFirst                  | 1 year              |
| Remote images (CDN) | CacheFirst                  | 30 days             |
| `/api/*` routes     | NetworkFirst (10 s timeout) | 24 h stale fallback |
| JS / CSS / images   | StaleWhileRevalidate        | 7 days              |

---

## 4. Estimated bundle contributions

These are reference estimates based on published package sizes; run `npm run analyze` to measure actuals.

| Package                     | Estimated gzipped size | Notes                                                               |
| --------------------------- | ---------------------- | ------------------------------------------------------------------- |
| `recharts`                  | ~200 KB                | Lazy-loaded; only on admin dashboard route                          |
| `@sentry/nextjs`            | ~50 KB                 | Initialised at app boot; tree-shaken via `optimizePackageImports`   |
| Vercel AI SDK (`ai`)        | ~40 KB                 | Used only in `/app/symptom-checker`; route-scoped by App Router     |
| `lucide-react`              | ~2–5 KB per icon       | Per-icon via `modularizeImports`; never the full barrel             |
| `i18next` + `react-i18next` | ~20 KB                 | Loaded once in root layout; `en`/`pl` bundles lazy-loaded on demand |

---

## 5. Future optimisation opportunities

1. **Sentry lazy-init on first error** — load the Sentry client only when the first uncaught error occurs rather than at app startup. Saves ~50 KB on the critical path for sessions with no errors.
2. **Route-level AI SDK splitting** — the `ai` package is already confined to the `/symptom-checker` route by the App Router, but the Vercel AI Gateway provider package could be verified for tree-shaking completeness.
3. **Image format audit** — ensure all gallery images are served as WebP/AVIF (Next.js Image already converts, but source formats affect build-time processing).
4. **Font subsetting** — Nunito and Rubik are loaded for all scripts; restricting to `latin` + `cyrillic` would reduce font payload by ~30%.
5. **AdminAnalyticsPage charting** — currently uses CSS bars which have zero JS cost. If richer charts are added in the future (recharts `BarChart`, `LineChart`), wrap them with `dynamic(..., { ssr: false })` following the dashboard pattern.

---

## 6. How to run bundle analysis

```bash
npm run analyze
# or explicitly:
ANALYZE=true npm run build
```

After the build completes, two HTML reports open automatically in the default browser:

- **Client bundle** — chunks downloaded by the browser
- **Server bundle** — code executed server-side (Node.js)

Look for unexpected large modules in the client report. A module appearing in a route chunk that should not use it is a sign of a missing `dynamic()` boundary or accidental barrel import.

---

## 7. Rule of thumb for new heavy libraries

If a library:

- Depends on `window`/`document`, **or**
- Is only used on a subset of routes, **or**
- Exceeds ~50 KB gzipped

…wrap it with `next/dynamic` and `{ ssr: false }`, using the skeleton loader pattern:

```typescript
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  ssr: false,
  loading: () => <div className="h-48 bg-dental-primary/10 rounded animate-pulse" />,
})
```
