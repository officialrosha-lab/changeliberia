#!/bin/bash
# Script to validate .env.production configuration

set -e

ENV_FILE=".env.production"
ERRORS=0
WARNINGS=0

echo "🔍 Validating Production Environment Configuration..."
echo "=================================================="

# Check if file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ ERROR: .env.production file not found!"
    exit 1
fi

# Color codes
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Helper functions
check_required() {
    local key=$1
    local value=$(grep "^$key=" "$ENV_FILE" | cut -d'=' -f2- | sed 's/"//g' | xargs)
    
    if [ -z "$value" ] || [ "$value" = "your-" ] || [[ "$value" =~ ^placeholder ]]; then
        echo -e "${RED}❌ REQUIRED: $key is empty or placeholder${NC}"
        ((ERRORS++))
    else
        echo -e "${GREEN}✓ $key is configured${NC}"
    fi
}

check_optional() {
    local key=$1
    local value=$(grep "^$key=" "$ENV_FILE" | cut -d'=' -f2- | sed 's/"//g' | xargs)
    
    if [ -z "$value" ] || [ "$value" = "your-" ] || [[ "$value" =~ ^placeholder ]]; then
        echo -e "${YELLOW}⚠ OPTIONAL: $key is empty${NC}"
        ((WARNINGS++))
    else
        echo -e "${GREEN}✓ $key is configured${NC}"
    fi
}

check_format() {
    local key=$1
    local pattern=$2
    local value=$(grep "^$key=" "$ENV_FILE" | cut -d'=' -f2- | sed 's/"//g' | xargs)
    
    if [ -z "$value" ]; then
        echo -e "${RED}❌ REQUIRED: $key is empty${NC}"
        ((ERRORS++))
        return
    fi
    
    if [[ "$value" =~ $pattern ]]; then
        echo -e "${GREEN}✓ $key format valid (${value:0:20}...)${NC}"
    else
        echo -e "${RED}❌ INVALID: $key format incorrect (expected: $pattern)${NC}"
        ((ERRORS++))
    fi
}

echo ""
echo "📦 Database Configuration:"
check_required "DATABASE_URL"

echo ""
echo "🔴 Redis Configuration:"
check_required "REDIS_URL"

echo ""
echo "📧 Email Configuration (Resend):"
check_format "RESEND_API_KEY" "^re_" 
check_required "MAIL_FROM"
check_optional "EMAIL_REPLY_TO"

echo ""
echo "🔐 Security Configuration:"
check_required "JWT_SECRET"
check_optional "JWT_EXPIRES_IN"

echo ""
echo "💳 Stripe Configuration (Recommended):"
check_format "STRIPE_API_KEY" "^sk_live_"
check_format "STRIPE_WEBHOOK_SECRET" "^whsec_"

echo ""
echo "🔑 Google OAuth Configuration (Recommended):"
check_optional "GOOGLE_OAUTH_CLIENT_ID"
check_optional "GOOGLE_OAUTH_CLIENT_SECRET"

echo ""
echo "🌐 API & Frontend Configuration:"
check_required "APP_URL"
check_required "CORS_ORIGIN"

echo ""
echo "📝 Additional Configuration:"
check_optional "NODE_ENV"
check_optional "ENABLE_SWAGGER"

echo ""
echo "=================================================="

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All required configurations are set!${NC}"
    echo -e "${YELLOW}⚠ Warnings: $WARNINGS (optional values)${NC}"
    echo ""
    echo "🚀 Ready for production deployment!"
    exit 0
else
    echo -e "${RED}❌ Configuration errors found: $ERRORS${NC}"
    echo -e "${YELLOW}⚠ Warnings: $WARNINGS${NC}"
    echo ""
    echo "📋 Please review PRODUCTION_CONFIG_CHECKLIST.md for setup instructions"
    exit 1
fi
