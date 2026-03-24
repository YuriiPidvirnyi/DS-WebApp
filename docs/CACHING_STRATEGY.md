# Caching Strategy

## Overview

DentalStory WebApp uses a three-layer caching architecture:

1. **Server-side:** Upstash Redis for API response caching and rate limiting
2. **Client-side:** PWA Service Worker (Workbox) for offline support and asset caching
3. **Framework:** Next.js built-in caching (static generation, ISR, HTTP headers)

---

## 1. Redis Caching (Server-Side)

**Client:** `@upstash/redis` (REST-based, edge-compatible)  
**Config:** `src/lib/redis.ts`  
**Env vars:** `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (or Vercel KV aliases `KV_REST_API_URL` + `KV_REST_API_TOKEN`)

### Graceful degradation

All Redis operations fall back silently when credentials are missing. The app works without Redis -- caching and rate limiting are simply bypassed.

### Cache keys and TTL

| Key prefix   | TTL          | Usage                                    |
| ------------ | ------------ | ---------------------------------------- |
| `slots`      | 60s          | CliniCards appointment slot availability |
| `analytics`  | 300s (5 min) | Admin dashboard analytics queries        |
| `session`    | 86400s (24h) | Session data storage                     |
| `rate_limit` | 60s          | Rate limiting sliding window             |

### Core functions

| Function                                  | Purpose                                                              |
| ----------------------------------------- | -------------------------------------------------------------------- |
| `getCachedData(key, fetcher, ttl)`        | Cache-aside: returns cached value or calls fetcher and caches result |
| `invalidateCache(key)`                    | Deletes a cache entry                                                |
| `checkRateLimit(id, limit, window)`       | Sliding-window rate limiter per identifier                           |
| `setSession / getSession / deleteSession` | Session data CRUD                                                    |

### Rate limiting

Two layers:

- **Edge (proxy.ts):** 60 req/min per IP (via Redis `checkRateLimit`)
- **Per-route:** Individual API routes apply tighter limits (e.g., feedback: 20 req/min) via `src/lib/api-security.ts`

---

## 2. PWA / Service Worker (Client-Side)

**Plugin:** `@ducanh2912/next-pwa` wrapping Workbox  
**Config:** `next.config.ts` (`withPWA({...})`)  
**Disabled in dev:** `disable: process.env.NODE_ENV === 'development'`

### Runtime caching strategies

Configured in `next.config.ts` under `workbox.runtimeCaching`:

| Resource                           | Strategy             | Cache name         | TTL         | Max entries |
| ---------------------------------- | -------------------- | ------------------ | ----------- | ----------- |
| Google Fonts (`fonts.gstatic.com`) | CacheFirst           | `google-fonts`     | 365 days    | 30          |
| Images (`/assets/`, `next/image`)  | CacheFirst           | `images`           | 30 days     | 60          |
| CliniCards API                     | NetworkFirst         | `clinicards-api`   | 10s timeout | 50 (1 day)  |
| Static JS/CSS (`_next/static`)     | StaleWhileRevalidate | `static-resources` | 30 days     | 60          |

### Offline support

- `public/offline.html` -- fallback page when network is unavailable
- `public/manifest.json` -- PWA manifest for install prompts

### Security note

Transitive dependency `serialize-javascript` is pinned to `7.0.4` via `package.json` overrides to avoid [GHSA-5c6j-r48x-rmvq](https://github.com/advisories/GHSA-5c6j-r48x-rmvq) from the `workbox-build` -> `@rollup/plugin-terser` chain.

---

## 3. Next.js Framework Caching

### HTTP headers

Set in `next.config.ts` `headers()`:

| Path pattern           | Header          | Value                                                  |
| ---------------------- | --------------- | ------------------------------------------------------ |
| `/_next/static/:path*` | `Cache-Control` | `public, max-age=31536000, immutable`                  |
| `/assets/:path*`       | `Cache-Control` | `public, max-age=86400, stale-while-revalidate=604800` |

### Static generation

- Public pages (`/`, `/about`, `/services`, etc.) use static generation by default
- API routes use `dynamic = 'force-dynamic'` where fresh data is required

### Image optimization

Next.js `next/image` handles automatic:

- Format conversion (WebP/AVIF)
- Size optimization and responsive `srcSet`
- Caching at the CDN edge (Vercel)

---

## Cache Invalidation

| Scenario                 | Strategy                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------- |
| Appointment slots change | `invalidateCache('slots')` -- 60s TTL also provides natural expiry                  |
| Admin updates analytics  | `invalidateCache('analytics:*')`                                                    |
| Deploy/redeploy          | All server caches are fresh (new Lambda instances); Vercel CDN purges static assets |
| PWA update               | Service Worker lifecycle handles cache busting via versioned URLs                   |

---

## Monitoring

- Redis operations log errors to `console.error('[Redis]')` with context
- Sentry captures unhandled cache failures
- `@vercel/speed-insights` tracks real-user performance metrics
