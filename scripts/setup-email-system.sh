#!/bin/bash

# Email System Setup & Validation Script
# Automates environment configuration and tests

set -e

RESET='\033[0m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'

# Configuration
RESEND_API_KEY="${RESEND_API_KEY:-re_V39tR44W_PmhRUhmg9k79ZrUpCe6F7AKx}"
MAIL_FROM="${MAIL_FROM:-noreply@changeliberia.org}"
MAIL_REPLY_TO="${MAIL_REPLY_TO:-support@changeliberia.org}"
REDIS_URL="${REDIS_URL:-redis://localhost:6379}"
TRACKING_DOMAIN="${TRACKING_DOMAIN:-track.changeliberia.org}"
APP_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:3000}"
API_URL="${API_URL:-http://localhost:4000}"

# Helper functions
print_header() {
  echo ""
  echo -e "${BLUE}========================================${RESET}"
  echo -e "${BLUE}$1${RESET}"
  echo -e "${BLUE}========================================${RESET}"
}

print_success() {
  echo -e "${GREEN}✓ $1${RESET}"
}

print_error() {
  echo -e "${RED}✗ $1${RESET}"
}

print_warning() {
  echo -e "${YELLOW}⚠ $1${RESET}"
}

print_info() {
  echo -e "${BLUE}ℹ $1${RESET}"
}

# Test function
test_command() {
  local description=$1
  local command=$2
  
  if eval "$command" > /dev/null 2>&1; then
    print_success "$description"
    return 0
  else
    print_error "$description"
    return 1
  fi
}

# ====================
# MAIN SCRIPT
# ====================

print_header "Email System Setup & Validation"

# Step 1: Environment Check
print_header "Step 1: Environment Configuration"

print_info "API Key: ${RESEND_API_KEY:0:20}..."
print_info "Mail From: $MAIL_FROM"
print_info "Redis URL: $REDIS_URL"
print_info "Tracking Domain: $TRACKING_DOMAIN"

# Step 2: Check Prerequisites
print_header "Step 2: Checking Prerequisites"

test_command "Node.js installed" "command -v node"
test_command "npm installed" "command -v npm"
test_command "Redis available" "command -v redis-cli"
test_command "PostgreSQL available" "command -v psql"

# Step 3: Setup Environment Files
print_header "Step 3: Setting Up Environment Files"

# Create or update API .env.local
if [ ! -f "apps/api/.env.local" ]; then
  print_info "Creating apps/api/.env.local"
  cat > apps/api/.env.local << EOF
# Email Configuration
RESEND_API_KEY=$RESEND_API_KEY
MAIL_FROM=$MAIL_FROM
MAIL_REPLY_TO=$MAIL_REPLY_TO
RESEND_WEBHOOK_SECRET=whsec_test_xxxxx

# Redis Configuration
REDIS_URL=$REDIS_URL

# Email Tracking Configuration
TRACKING_DOMAIN=$TRACKING_DOMAIN
NEXT_PUBLIC_APP_URL=$APP_URL

# Database (ensure this is already set)
# DATABASE_URL=postgresql://...
EOF
  print_success "Created apps/api/.env.local"
else
  print_info "apps/api/.env.local already exists"
  # Update values if needed
  if grep -q "RESEND_API_KEY=" apps/api/.env.local; then
    sed -i.bak "s|RESEND_API_KEY=.*|RESEND_API_KEY=$RESEND_API_KEY|" apps/api/.env.local
    print_success "Updated RESEND_API_KEY in .env.local"
  fi
fi

# Create or update Web .env.local
if [ ! -f "apps/web/.env.local" ]; then
  print_info "Creating apps/web/.env.local"
  cat > apps/web/.env.local << EOF
# Web-side configuration
NEXT_PUBLIC_APP_URL=$APP_URL
NEXT_PUBLIC_API_URL=$API_URL
NEXT_PUBLIC_EMAIL_TRACKING_DOMAIN=https://$TRACKING_DOMAIN
EOF
  print_success "Created apps/web/.env.local"
else
  print_info "apps/web/.env.local already exists"
fi

# Step 4: Database Validation
print_header "Step 4: Database Validation"

cd apps/api

if test_command "EmailLog table exists" "npx prisma db execute --stdin <<< 'SELECT * FROM \"EmailLog\" LIMIT 1'"; then
  print_success "EmailLog table is present"
else
  print_warning "EmailLog table not found, running migrations..."
  npx prisma migrate dev --name add_email_system
  print_success "Migrations applied"
fi

if test_command "NotificationPreference has emailEnabled" "npx prisma db execute --stdin <<< 'SELECT emailEnabled FROM \"NotificationPreference\" LIMIT 1'"; then
  print_success "NotificationPreference schema is correct"
else
  print_error "NotificationPreference schema needs update"
fi

cd - > /dev/null

# Step 5: Redis Connection Test
print_header "Step 5: Redis Connection Test"

if test_command "Redis is running" "redis-cli -u $REDIS_URL ping"; then
  print_success "Redis connection successful"
  
  # Get Redis memory
  REDIS_MEMORY=$(redis-cli -u $REDIS_URL INFO memory | grep used_memory_human | cut -d: -f2 | tr -d '\r')
  print_info "Redis memory usage: $REDIS_MEMORY"
else
  print_error "Redis connection failed"
  print_warning "Make sure Redis is running: redis-server"
fi

# Step 6: API Server Test
print_header "Step 6: API Server Connectivity Test"

if test_command "API server responding" "curl -s -f $API_URL/health > /dev/null"; then
  print_success "API server is running and responding"
else
  print_warning "API server not responding at $API_URL"
  print_info "Start API server with: cd apps/api && npm run dev"
fi

# Step 7: Resend API Key Validation
print_header "Step 7: Resend API Configuration"

RESEND_TEST=$(curl -s -f \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  https://api.resend.com/audiences 2>&1 || echo "failed")

if [[ $RESEND_TEST != *"failed"* ]]; then
  print_success "Resend API key is valid"
else
  print_error "Resend API key validation failed"
  print_warning "Check API key: $RESEND_API_KEY"
fi

# Step 8: Admin Dashboard Check
print_header "Step 8: Admin Dashboard Configuration"

if test_command "Admin dashboard accessible" "curl -s -f $APP_URL/admin > /dev/null"; then
  print_success "Admin dashboard is accessible"
else
  print_warning "Admin dashboard not responding at $APP_URL/admin"
  print_info "Start web server with: cd apps/web && npm run dev"
fi

# Step 9: Summary
print_header "Setup Validation Summary"

echo ""
echo "Configuration:"
echo "  API Key: ${RESEND_API_KEY:0:30}..."
echo "  Mail From: $MAIL_FROM"
echo "  Redis: $REDIS_URL"
echo "  Tracking: $TRACKING_DOMAIN"
echo ""

echo "Services Status:"
echo "  API Server: $API_URL"
echo "  Web Server: $APP_URL"
echo "  Redis: $REDIS_URL"
echo "  Admin: $APP_URL/admin"
echo ""

print_header "Next Steps"

echo ""
echo "1. Run Email System Tests:"
echo "   bash scripts/test-email-system.sh"
echo ""
echo "2. Send Test Email:"
echo "   curl -X POST $API_URL/api/v1/email/test-send \\"
echo "     -H 'Authorization: Bearer YOUR_JWT_TOKEN' \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"email\": \"test@example.com\", \"type\": \"WELCOME\"}'"
echo ""
echo "3. Check Admin Dashboard:"
echo "   Open: $APP_URL/admin"
echo "   Click: Email tab"
echo "   Check: Configuration → System Health (should be all green)"
echo ""
echo "4. Monitor Queue:"
echo "   Admin → Email → Queue Status tab"
echo "   Auto-refreshes every 30 seconds"
echo ""
echo "5. Verify Resend Domain:"
echo "   https://resend.com/domains"
echo "   Domain should be: $MAIL_FROM (extract domain)"
echo "   Status should be: Verified"
echo ""

print_success "Setup validation complete!"
echo ""
