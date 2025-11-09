# Caching Strategy

**Project**: DS-WebApp  
**Last Updated**: 2024-12-21

## Overview

This document describes the comprehensive caching strategy implemented in DS-WebApp to optimize performance, reduce server load, and provide offline functionality.

## Architecture

### 1. Service Worker Caching (Workbox)

The application uses Workbox for sophisticated service worker caching with multiple strategies based on resource type.

#### Caching Strategies

**Cache-First (Immutable Resources)**

- **Use Case**: Static assets that never change (versioned files)
- **Resources**: Google Fonts, images with content hashing
- **TTL**: 365 days (fonts), 30 days (images)
- **Benefit**: Fastest load times, reduced bandwidth

```typescript
// Google Fonts - CacheFirst
{
  urlPattern: /^https:\/\/(fonts\.gstatic\.com|fonts\.googleapis\.com)\//,
  handler: 'CacheFirst',
  options: {
    cacheName: 'google-fonts',
    expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
  }
}
```

**Network-First (Dynamic Content)**

- **Use Case**: Content that changes frequently
- **Resources**: API responses, HTML pages
- **TTL**: 5 minutes (API), 1 hour (pages)
- **Benefit**: Always fresh data with offline fallback

```typescript
// API responses - NetworkFirst
{
  urlPattern: /^https:\/\/api\.cliniccards\.com\//,
  handler: 'NetworkFirst',
  options: {
    networkTimeoutSeconds: 10,
    expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
  }
}
```

**Stale-While-Revalidate (Balanced Approach)**

- **Use Case**: Resources that should be fresh but can serve stale
- **Resources**: JavaScript bundles, CSS files
- **TTL**: 7 days
- **Benefit**: Fast response + eventual consistency

```typescript
// Static assets (JS, CSS)
{
  urlPattern: /\.(?:js|css)$/,
  handler: 'StaleWhileRevalidate',
  options: {
    cacheName: 'static-resources',
    expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 },
  }
}
```

**Network-Only (Analytics)**

- **Use Case**: Data that must always be fresh and shouldn't be cached
- **Resources**: Google Analytics, tracking pixels
- **Benefit**: Accurate analytics, no stale data

```typescript
// Google Analytics - NetworkOnly
{
  urlPattern: /^https:\/\/www\.google-analytics\.com\//,
  handler: 'NetworkOnly',
}
```

#### Cache Configuration

| Cache Name         | Strategy             | Max Entries | Max Age   | Use Case                           |
| ------------------ | -------------------- | ----------- | --------- | ---------------------------------- |
| `google-fonts`     | CacheFirst           | 30          | 365 days  | Font files                         |
| `api-cache`        | NetworkFirst         | 50          | 5 minutes | CliniCards API                     |
| `images-cache`     | CacheFirst           | 100         | 30 days   | Images (PNG, JPG, SVG, WebP, AVIF) |
| `static-resources` | StaleWhileRevalidate | 100         | 7 days    | JS/CSS bundles                     |
| `pages-cache`      | NetworkFirst         | 20          | 1 hour    | HTML pages                         |

### 2. In-Memory API Cache

**Location**: `src/utils/apiCache.ts`

Advanced in-memory caching layer with stale-while-revalidate support for API calls.

#### Features

- **Stale-While-Revalidate**: Return cached data immediately, update in background
- **Request Deduplication**: Prevent duplicate concurrent requests
- **LRU Eviction**: Automatic cleanup when max size exceeded
- **Persistence**: Save/restore cache from localStorage
- **Pattern Invalidation**: Clear cache by regex pattern
- **TypeScript Support**: Fully typed API

#### Usage

```typescript
import { apiCache, useCachedQuery, generateCacheKey } from '@/utils/apiCache'

// Using the cache directly
const data = await apiCache.get(
  'users-list',
  () => fetchUsers(),
  {
    ttl: 5 * 60 * 1000, // 5 minutes
    staleWhileRevalidate: true
  }
)

// Using React hook
function MyComponent() {
  const { data, isLoading, error, refetch } = useCachedQuery(
    'price-list',
    () => fetchPriceList(),
    { ttl: 10 * 60 * 1000 }
  )

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return <div>{/* Render data */}</div>
}

// Cache invalidation
apiCache.invalidate('users-list')
apiCache.invalidatePattern(/^users-/)
apiCache.clear()
```

#### Configuration

```typescript
class APICache {
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes
  private readonly MAX_CACHE_SIZE = 100
}
```

### 3. HTTP Cache Headers

**Location**: `netlify.toml`

Production cache headers configured for optimal CDN and browser caching.

#### Static Assets (Immutable)

```toml
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

**Benefits**:

- `public`: Can be cached by CDN and browser
- `max-age=31536000`: Cache for 1 year
- `immutable`: Never revalidate (hash-based versioning)

#### JavaScript Bundles

```toml
[[headers]]
  for = "/*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

#### CSS Files

```toml
[[headers]]
  for = "/*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

#### HTML Files (No Cache)

```toml
[[headers]]
  for = "/*.html"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
```

**Rationale**: HTML files reference hashed assets, so they should always be fresh.

#### Service Worker (No Cache)

```toml
[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
```

### 4. Build-Time Optimizations

#### Code Splitting

Vite automatically splits code into chunks for optimal caching:

```typescript
// vite.config.ts
manualChunks: id => {
  if (id.includes('node_modules/react')) return 'react-vendor'
  if (id.includes('node_modules/react-router')) return 'router-vendor'
  if (id.includes('/pages/Home')) return 'home-page'
  // ...more chunks
}
```

**Benefits**:

- Smaller initial bundle
- Better long-term caching (vendor code rarely changes)
- Parallel loading

#### Content Hashing

All production assets include content hash in filename:

- `main.abc123.js` - JavaScript bundles
- `style.def456.css` - CSS files
- `image.789abc.png` - Images (via build pipeline)

**Benefits**:

- Aggressive caching (immutable files)
- Automatic cache invalidation on updates
- No manual cache busting

## Performance Metrics

### Expected Improvements

| Metric                         | Before | After | Improvement |
| ------------------------------ | ------ | ----- | ----------- |
| Time to First Byte (TTFB)      | 500ms  | 100ms | -80%        |
| Largest Contentful Paint (LCP) | 3.5s   | 1.8s  | -49%        |
| Cache Hit Rate                 | 0%     | 75%   | +75%        |
| Bandwidth Usage                | 100%   | 40%   | -60%        |
| Offline Functionality          | ❌     | ✅    | New         |

### Cache Hit Rates (Target)

- **Static Assets**: 95%+ (fonts, images, versioned JS/CSS)
- **API Responses**: 60-70% (stale-while-revalidate helps)
- **HTML Pages**: 80%+ (service worker cache)

## Monitoring

### Cache Statistics

Use browser DevTools to monitor cache performance:

1. **Application Tab > Cache Storage**: View all caches
2. **Network Tab > "Disable cache" off**: See cache hits (gray icon)
3. **Lighthouse > Performance**: Check "Serve static assets with efficient cache policy"

### API Cache Stats

```typescript
const stats = apiCache.getStats()
console.log(`Cache size: ${stats.size}`)
console.log(`Cache keys: ${apiCache.keys().join(', ')}`)
```

## Best Practices

### 1. Cache Invalidation

**When to Invalidate**:

- After mutations (POST, PUT, DELETE)
- On user logout
- When data becomes stale

```typescript
// After creating appointment
await createAppointment(data)
apiCache.invalidatePattern(/^appointments-/)
```

### 2. Cache Keys

Use consistent, descriptive cache keys:

```typescript
// Good
const key = generateCacheKey('appointments', { userId, date })
// Result: "appointments?date=2024-12-21&userId=123"

// Bad
const key = 'data' // Not descriptive
const key = `/api/appointments?userId=${userId}&date=${date}` // Order-dependent
```

### 3. TTL Selection

| Data Type      | Recommended TTL | Rationale                     |
| -------------- | --------------- | ----------------------------- |
| Static content | 1 year          | Immutable (versioned)         |
| User data      | 5 minutes       | Balance freshness/performance |
| Real-time data | 30 seconds      | Frequent updates              |
| Configuration  | 1 hour          | Rarely changes                |
| Analytics      | No cache        | Must be accurate              |

### 4. Offline Support

Ensure critical pages work offline:

```typescript
// Precache critical routes
workbox: {
  globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
  navigateFallback: '/offline.html',
}
```

### 5. Cache Warming

Preload critical data on app initialization:

```typescript
apiCache.preload([
  { key: 'services', fetcher: () => fetchServices() },
  { key: 'doctors', fetcher: () => fetchDoctors() },
])
```

## Troubleshooting

### Issue: Cache Not Updating

**Symptoms**: Seeing old data after deployment

**Solutions**:

1. Check if service worker is updated (should auto-update)
2. Clear cache manually: `apiCache.clear()`
3. Hard refresh: `Ctrl + Shift + R` (Chrome)
4. Check cache headers in Network tab

### Issue: High Memory Usage

**Symptoms**: Browser tab using lots of memory

**Solutions**:

1. Reduce `MAX_CACHE_SIZE` in `apiCache.ts`
2. Lower TTL values to expire cache sooner
3. Use `apiCache.clear()` on navigation away

### Issue: Offline Page Not Showing

**Symptoms**: Blank page when offline

**Solutions**:

1. Verify `/offline.html` exists in `public/`
2. Check service worker registration
3. Check `navigateFallback` in `vite.config.ts`
4. Clear service worker and re-register

## Testing

### Manual Testing

1. **Test Cache Hit**:
   - Load page, check Network tab (should see "from cache")
   - Disconnect internet, reload (should still work)

2. **Test Stale-While-Revalidate**:
   - Load page with stale cache
   - Watch Network tab for background fetch

3. **Test Offline**:
   - Open DevTools > Application > Service Workers
   - Check "Offline" checkbox
   - Navigate app (should show offline page or cached content)

### Automated Testing

```bash
# Run Lighthouse
npm run lighthouse

# Check cache sizes
npm run size

# Test service worker
npm run test:e2e -- --grep "offline"
```

## Future Enhancements

1. **IndexedDB Storage**: For larger datasets
2. **Background Sync**: Queue mutations when offline
3. **Predictive Prefetching**: ML-based cache warming
4. **Cache Compression**: Reduce memory footprint
5. **Cache Analytics**: Track hit rates, eviction patterns

## References

- [Workbox Documentation](https://developers.google.com/web/tools/workbox)
- [HTTP Caching Best Practices](https://web.dev/http-cache/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Cache-Control Header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)

---

**Version**: 1.0  
**Author**: Development Team  
**Last Review**: 2024-12-21
