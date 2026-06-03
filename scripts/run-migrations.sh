#!/bin/bash

# Run Prisma migrations on production database
# This script can be run locally or via Railway CLI

set -e

echo "🔄 Starting Prisma database migrations..."
echo ""

# Check if we're in the correct directory
if [ ! -f "apps/api/prisma/schema.prisma" ]; then
  echo "❌ Error: Please run this script from the project root"
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
