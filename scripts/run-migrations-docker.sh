#!/bin/bash

# Docker-based migration script for development/testing
# This runs migrations in a controlled environment

set -e

echo "🐳 Docker Migration Runner"
echo ""

# Check if Docker is running
if ! command -v docker &> /dev/null; then
  echo "❌ Docker is not installed or not in PATH"
  exit 1
fi

# Get database URL from .env.production or prompt user
if [ -f ".env.production" ]; then
  echo "📁 Found .env.production"
  source .env.production
fi

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL not set"
  echo "Please set DATABASE_URL environment variable or create .env.production file"
  exit 1
fi

echo "🔐 Database: $DATABASE_URL"
echo ""
echo "Starting migration container..."

# Create a temporary container to run migrations
docker run --rm \
  -e DATABASE_URL="$DATABASE_URL" \
  -v "$(pwd)/apps/api:/app" \
  -w /app \
  node:18-alpine \
  sh -c "npm install && npx prisma migrate deploy"

echo ""
echo "✅ Migration container completed successfully!"
echo ""
echo "Next steps:"
echo "1. Verify tables exist in your production database"
echo "2. Test /admin and /messages routes"
echo "3. Monitor application logs for any errors"
