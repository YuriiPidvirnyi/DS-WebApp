#!/bin/bash
# Dental Story - First Run Setup Script
# Usage: bash setup.sh

set -e

echo "🦷 Dental Story - Setup Script"
echo "=================================="
echo ""

# Check Node version
echo "✓ Checking Node.js version..."
NODE_VERSION=$(node -v)
echo "  Node.js: $NODE_VERSION"

if ! command -v npm &> /dev/null; then
    echo "✗ npm not found. Please install Node.js"
    exit 1
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo ""
    echo "⚠️  .env.local not found!"
    echo ""
    echo "Create .env.local with:"
    echo "========================================="
    echo "NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co"
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key"
    echo "UPSTASH_REDIS_REST_URL=https://your-redis-url"
    echo "UPSTASH_REDIS_REST_TOKEN=your-redis-token"
    echo "NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-site-key"
    echo "TURNSTILE_SECRET_KEY=your-secret-key"
    echo "========================================="
    echo ""
    exit 1
fi

echo "✓ .env.local found"

# Run type check
echo ""
echo "🔍 Running TypeScript check..."
npm run typecheck

# Run tests
echo ""
echo "🧪 Running tests..."
npm test -- --passWithNoTests

# Build verification
echo ""
echo "🏗️  Building application..."
npm run build

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Start dev server: npm run dev"
echo "2. Open http://localhost:3000"
echo "3. Test the booking page"
echo ""
echo "For detailed setup, see QUICK_START.md"
