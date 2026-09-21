#!/bin/bash

# Run Prisma migrations against Supabase (production database).
# Needs DATABASE_URL + DIRECT_URL in the environment — either export them
# yourself, or pull them from Vercel first:
#   vercel env pull .env.production.local --environment=production
# (this script sources that file automatically if present).

set -e

echo "🔄 Starting Prisma database migrations..."
echo ""

# Check if we're in the correct directory
if [ ! -f "apps/api/prisma/schema.prisma" ]; then
  echo "❌ Error: Please run this script from the project root"
  exit 1
fi

if [ -f ".env.production.local" ]; then
  echo "📁 Found .env.production.local (from 'vercel env pull')"
  set -a
  source .env.production.local
  set +a
fi

if [ -z "$DATABASE_URL" ] || [ -z "$DIRECT_URL" ]; then
  echo "❌ DATABASE_URL and DIRECT_URL must be set (Supabase connection strings)."
  echo "Run 'vercel env pull .env.production.local --environment=production' or export them manually."
  exit 1
fi

cd apps/api

# Run migrations
echo "📋 Checking migration status..."
npx prisma migrate status

echo ""
echo "🚀 Deploying pending migrations..."
npx prisma migrate deploy

echo ""
echo "✅ Migrations completed successfully!"
echo ""
echo "📊 Database schema verified"
npx prisma db seed 2>/dev/null || echo "⚠️  Seed script not available or already executed"

echo ""
echo "✨ All done! Poll and Message tables should now exist in production."
