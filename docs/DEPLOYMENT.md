# Deployment Guide

This document outlines the deployment process for the DS-WebApp dental clinic website.

## Table of Contents

- [Overview](#overview)
- [Netlify Deployment](#netlify-deployment)
- [Environment Variables](#environment-variables)
- [CI/CD Pipeline](#cicd-pipeline)
- [Manual Deployment](#manual-deployment)
- [Troubleshooting](#troubleshooting)

## Overview

The DS-WebApp is configured for automatic deployment to Netlify when changes are pushed to the `main` branch. Deploy previews are automatically created for pull requests.

### Deployment Environments

- **Production**: `main` branch → https://dentalstory.com.ua
- **Staging**: `develop` branch → automatic deploy preview
- **PR Previews**: Pull requests → unique preview URLs

## Netlify Deployment

### Prerequisites

1. Netlify account with access to the site
2. GitHub repository connected to Netlify
3. Required secrets configured in GitHub repository settings

### Required GitHub Secrets

Add these secrets in your repository settings (`Settings → Secrets and variables → Actions`):

```
NETLIFY_AUTH_TOKEN - Your Netlify personal access token
NETLIFY_SITE_ID - Your Netlify site ID (found in Site settings)
```

#### Getting Netlify Credentials

1. **Netlify Auth Token**:
   - Log in to Netlify
   - Go to User settings → Applications → Personal access tokens
   - Click "New access token"
   - Copy the token and add it to GitHub secrets

2. **Netlify Site ID**:
   - Go to your site in Netlify dashboard
   - Navigate to Site settings → General → Site details
   - Copy the "API ID" and add it to GitHub secrets

### Netlify Configuration

The site is configured via `netlify.toml` in the project root:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

This configuration:

- Runs the build command
- Publishes the `dist` folder
- Handles SPA routing with client-side redirects
- Sets security headers
- Configures caching for optimal performance

## Environment Variables

### Build-time Variables

Set these in Netlify dashboard (`Site settings → Environment variables`):

```bash
# Required
NODE_VERSION=20

# Optional - API endpoints
VITE_API_BASE_URL=https://api.dentalstory.com.ua
VITE_SENTRY_DSN=your-sentry-dsn
VITE_TURNSTILE_SITE_KEY=your-cloudflare-turnstile-key

# Environment indicator
VITE_ENVIRONMENT=production
```

### Environment-specific Variables

Different values per deployment context:

| Variable            | Production | Staging     | Preview  |
| ------------------- | ---------- | ----------- | -------- |
| `VITE_ENVIRONMENT`  | production | staging     | preview  |
| `VITE_API_BASE_URL` | prod URL   | staging URL | mock API |

## CI/CD Pipeline

### Workflow Overview

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs on push and pull requests:

```
1. Lint and Type Check
   ├─ ESLint
   ├─ TypeScript check
   └─ Format check

2. Tests
   ├─ Unit tests
   └─ Coverage report

3. Build
   └─ Production build

4. E2E Tests
   └─ Playwright tests

5. Security Audit
   ├─ npm audit
   └─ Dependency check

6. Lighthouse (PR only)
   └─ Performance audit

7. Deploy (main branch only)
   └─ Netlify deployment
```

### Deployment Process

1. **Automatic Deployment**:
   - Merge PR to `main` branch
   - CI pipeline runs all checks
   - If all checks pass, deploys to production
   - Deployment URL posted as commit comment

2. **Deploy Preview**:
   - Open pull request
   - Netlify automatically creates preview deployment
   - Preview URL posted as PR comment

### Monitoring Deployments

- View deployment status in GitHub Actions tab
- Check Netlify dashboard for deploy logs
- Review Lighthouse performance reports in PR comments

## Manual Deployment

### Via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Build the project
npm run build

# Deploy to production
netlify deploy --prod --dir=dist

# Deploy preview
netlify deploy --dir=dist
```

### Via Netlify Dashboard

1. Go to Netlify dashboard
2. Select your site
3. Go to "Deploys" tab
4. Click "Trigger deploy" → "Deploy site"

## Troubleshooting

### Common Issues

#### Build Fails with "Module not found"

**Solution**: Ensure all dependencies are in `package.json` and run:

```bash
npm ci
npm run build
```

#### SPA Routes Return 404

**Solution**: Verify `netlify.toml` has redirect rule:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### Environment Variables Not Working

**Solution**:

1. Check variable names start with `VITE_`
2. Verify variables are set in Netlify dashboard
3. Redeploy the site (env vars only applied on new deploys)

#### Build Timeout

**Solution**:

1. Check for circular dependencies
2. Optimize bundle size
3. Contact Netlify support to increase timeout

#### Assets Not Loading (404 on CSS/JS)

**Solution**:

1. Check `vite.config.ts` base path configuration
2. Verify assets are in `dist/assets/` after build
3. Check browser console for actual file paths

### Debug Mode

Enable verbose logging in build:

```bash
# In netlify.toml
[build]
  command = "npm run build -- --debug"
```

### Rollback Deployment

Via Netlify dashboard:

1. Go to "Deploys" tab
2. Find previous successful deploy
3. Click "Publish deploy"

Via CLI:

```bash
netlify rollback
```

## Performance Optimization

### Build Optimization

```bash
# Analyze bundle size
npm run build -- --mode production

# Check bundle composition
npx vite-bundle-visualizer
```

### CDN and Caching

Netlify automatically provides:

- Global CDN distribution
- Smart CDN caching
- Asset optimization
- Brotli compression

Headers configured in `netlify.toml`:

```toml
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

## Monitoring

### Available Metrics

- **Netlify Analytics**: Pageviews, unique visitors, bandwidth
- **Lighthouse CI**: Performance, accessibility, SEO scores
- **Sentry**: Error tracking and performance monitoring
- **GitHub Actions**: Build times, test results

### Setting Up Monitoring

1. **Lighthouse CI**:

   ```bash
   npm install -g @lhci/cli
   lhci autorun --config=lighthouserc.json
   ```

2. **Sentry**:
   - Add `VITE_SENTRY_DSN` to environment variables
   - Errors automatically tracked in production

## Security

### Security Headers

Configured in `netlify.toml`:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

### SSL/TLS

- Automatic HTTPS via Netlify
- Free SSL certificate (Let's Encrypt)
- Automatic renewal

## Support

For deployment issues:

- Check Netlify docs: https://docs.netlify.com
- GitHub Actions logs: Repository → Actions tab
- Contact DevOps team: devops@dentalstory.com.ua

## Checklist Before Deploying

- [ ] All tests passing locally
- [ ] Build completes without errors
- [ ] Environment variables configured
- [ ] API endpoints tested
- [ ] Security headers verified
- [ ] Performance benchmarks met
- [ ] Error tracking configured
- [ ] Rollback plan in place
