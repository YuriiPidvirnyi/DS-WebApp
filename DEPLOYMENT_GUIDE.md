# Dental Story - Deployment Guide

## Overview

This guide covers deploying Dental Story to production on Vercel, self-hosted servers, or Docker containers.

## Pre-Deployment Checklist

### 1. Code Quality
```bash
# Run tests
npm test
npm run test:e2e

# Type checking
npm run typecheck

# Linting
npm run lint

# Build verification
npm run build
```

### 2. Environment Configuration
- [ ] `.env.local` created with all required variables
- [ ] All sensitive keys secured in vault or Vercel Secrets
- [ ] Database migration script (`scripts/init_database.sql`) ready
- [ ] Supabase project created and configured

### 3. Database Preparation
- [ ] Supabase project created
- [ ] SQL migration executed successfully
- [ ] RLS policies verified
- [ ] Sample data seeded

### 4. External Services
- [ ] Supabase auth configured
- [ ] Upstash Redis created and connected
- [ ] Turnstile CAPTCHA keys generated (optional)
- [ ] Sentry project created (optional)

---

## Deployment Methods

### Option 1: Vercel (Recommended) ⭐

Vercel is the recommended platform as it's optimized for Next.js.

#### Step 1: Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Sign up or log in
3. Click "Add New" → "Project"
4. Select your GitHub repository
5. Click "Import"

#### Step 2: Configure Environment Variables

In Vercel Dashboard:

1. Go to Project Settings → Environment Variables
2. Add all variables from `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
UPSTASH_REDIS_REST_URL=https://your-redis
UPSTASH_REDIS_REST_TOKEN=your-token
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-key
TURNSTILE_SECRET_KEY=your-secret
NEXT_PUBLIC_SENTRY_DSN=your-dsn (optional)
SENTRY_AUTH_TOKEN=your-token (optional)
```

#### Step 3: Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (will create automatic deployment on push)
vercel --prod
```

Or enable automatic deployments:
1. Go to project in Vercel Dashboard
2. Settings → Git
3. Ensure "Deploy on push to main" is enabled

#### Step 4: Verify Deployment

```bash
# Check deployment status
vercel inspect

# View logs
vercel logs --prod
```

Expected output: "✓ Ready. Deployed to production"

---

### Option 2: Self-Hosted (Docker)

For complete control over hosting.

#### Step 1: Create Dockerfile

Already included in project. Verify:

```bash
ls Dockerfile  # Should exist
```

#### Step 2: Build Docker Image

```bash
docker build -t dental-story:latest .

# Verify image created
docker images | grep dental-story
```

#### Step 3: Run Container

```bash
docker run -d \
  --name dental-story \
  -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your-url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key \
  -e UPSTASH_REDIS_REST_URL=your-url \
  -e UPSTASH_REDIS_REST_TOKEN=your-token \
  dental-story:latest
```

Visit http://localhost:3000

#### Step 4: Push to Container Registry

For production, push to Docker Hub or private registry:

```bash
# Docker Hub
docker tag dental-story:latest yourusername/dental-story:latest
docker push yourusername/dental-story:latest

# Or private registry
docker tag dental-story:latest registry.example.com/dental-story:latest
docker push registry.example.com/dental-story:latest
```

#### Step 5: Deploy to Production Server

Using Docker Compose:

```yaml
# docker-compose.yml
version: '3.8'

services:
  web:
    image: yourusername/dental-story:latest
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_KEY}
      - UPSTASH_REDIS_REST_URL=${UPSTASH_URL}
      - UPSTASH_REDIS_REST_TOKEN=${UPSTASH_TOKEN}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
```

```bash
# Deploy
docker-compose up -d

# Check status
docker-compose logs -f
```

---

### Option 3: Railway

Easy serverless deployment.

#### Step 1: Connect Repository

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub"
4. Choose your repository

#### Step 2: Add Environment Variables

In Railway Dashboard:
1. Go to Variables
2. Add all `.env.local` variables

#### Step 3: Deploy

Railway auto-deploys on push to main branch.

View deployment:
```bash
# Get Railway CLI
npm install -g @railway/cli

# Check logs
railway logs
```

---

### Option 4: Heroku (Legacy)

⚠️ Heroku removed free tier. Use Vercel or Railway instead.

---

## Post-Deployment

### 1. Verify Deployment

```bash
# Check site is live
curl https://your-domain.com

# Verify API endpoints
curl https://your-domain.com/api/doctors
curl https://your-domain.com/api/services
```

### 2. Run Database Migrations

If first deployment:

1. Go to Supabase Dashboard
2. SQL Editor
3. Paste `scripts/init_database.sql`
4. Click "Run"

### 3. Configure SSL Certificate

**Vercel**: Automatic ✓

**Self-hosted**: Use Let's Encrypt

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --standalone -d your-domain.com

# Configure NGINX/Apache to use certificate
```

### 4. Set Up Monitoring

#### Sentry

```bash
# Initialize Sentry
npm i @sentry/nextjs

# Create account at sentry.io
# Add NEXT_PUBLIC_SENTRY_DSN to environment

# Deploy
git push  # Auto-deploys in Vercel
```

#### Uptime Monitoring

Use service like:
- Pingdom
- UptimeRobot
- Datadog

Add your domain to check uptime every 5 minutes.

### 5. Enable HTTPS and Security Headers

**Vercel**: Done automatically ✓

**Self-hosted NGINX**:

```nginx
# /etc/nginx/sites-available/default

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL Certificate
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

Reload NGINX:
```bash
sudo systemctl reload nginx
```

---

## Scaling & Performance

### 1. Enable Caching

Already configured in `next.config.ts`:
- Static pages: 1 year
- API routes: 60-120 seconds
- Images: 1 year

### 2. Database Optimization

In Supabase Dashboard:
1. Go to Database → Indexes
2. Verify indexes created (from `init_database.sql`)
3. Monitor slow queries

### 3. CDN Configuration

**Vercel**: Automatic ✓

**Self-hosted**: Use Cloudflare

1. Go to [cloudflare.com](https://cloudflare.com)
2. Add your domain
3. Update nameservers at registrar
4. Enable caching

### 4. Load Balancing

For high traffic, set up load balancer:

```bash
# Use HAProxy or Nginx upstream
upstream backend {
    server docker1:3000;
    server docker2:3000;
    server docker3:3000;
}

server {
    location / {
        proxy_pass http://backend;
    }
}
```

---

## Rollback Procedures

### Vercel

1. Go to Deployment History
2. Click deployment to restore
3. Click "Promote to Production"

### Docker

```bash
# Check image tags
docker images | grep dental-story

# Revert to previous version
docker run -d \
  --name dental-story-v2 \
  -p 3000:3000 \
  dental-story:v1.0.0  # Previous version tag

# Test on separate port
# If working, update load balancer to use v1.0.0
```

---

## Common Deployment Issues

### Issue: "Build failed"

**Solution:**
```bash
# Local verification
npm run build

# Check build logs
vercel logs --prod

# Common causes:
# 1. TypeScript errors - npm run typecheck
# 2. Failing tests - npm test
# 3. Missing env vars - verify in Vercel
```

### Issue: "Database connection timeout"

**Solution:**
- Verify `NEXT_PUBLIC_SUPABASE_URL` correct
- Check Supabase project status (green icon)
- Ensure firewall allows connection
- Restart Supabase if stuck

### Issue: "RLS policy prevents access"

**Solution:**
- Go to Supabase → Authentication
- Verify user exists and authenticated
- Check RLS policies in SQL Editor
- Enable access for service role if needed

### Issue: "Rate limit exceeded"

**Solution:**
- Verify `UPSTASH_REDIS_REST_TOKEN` correct
- Check Redis quota in Upstash Dashboard
- Increase rate limit threshold if needed
- Implement caching in proxy.ts

### Issue: "CAPTCHA not loading"

**Solution:**
- Verify `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- Check Cloudflare Turnstile status
- Add domain to Turnstile allowlist
- Clear browser cache

---

## Performance Monitoring

### Check Performance

```bash
# Run Lighthouse audit
npm run lighthouse

# Expected scores:
# Performance: > 90
# Accessibility: > 95
# Best Practices: > 90
# SEO: > 90
```

### Monitor in Production

**Vercel Analytics:**
1. Dashboard → Analytics
2. View Core Web Vitals
3. Check deployment performance

**Sentry Monitoring:**
1. Go to sentry.io
2. View error rates
3. Check performance transactions

---

## Maintenance

### Weekly
- [ ] Check error logs in Sentry
- [ ] Monitor database size in Supabase
- [ ] Review Redis cache hits

### Monthly
- [ ] Update dependencies: `npm update`
- [ ] Run security audit: `npm audit fix`
- [ ] Review performance metrics
- [ ] Backup database in Supabase

### Quarterly
- [ ] Major dependency updates
- [ ] Security audit
- [ ] Performance optimization
- [ ] User feedback review

---

## Support & Troubleshooting

For deployment issues:
1. Check [Vercel Docs](https://vercel.com/docs)
2. Check [Next.js Docs](https://nextjs.org/docs)
3. Check [Supabase Docs](https://supabase.com/docs)
4. Search [GitHub Issues](https://github.com/search?q=repo:vercel/next.js)

---

**Last Updated**: March 14, 2024
**Questions?** Contact: deployment@dentalstory.ua
