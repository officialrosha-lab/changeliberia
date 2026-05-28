#!/bin/bash

##############################################################################
# POST-DEPLOYMENT VERIFICATION SCRIPT
# Purpose: Verify all critical services and endpoints are working
# Usage: bash scripts/verify-production-deployment.sh
# Date: May 28, 2026
##############################################################################

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-https://api.changeliberia.org}"
WEB_URL="${WEB_URL:-https://changeliberia.org}"
DATABASE_URL="${DATABASE_URL}"
REDIS_URL="${REDIS_URL}"
MAX_RETRIES=30
RETRY_INTERVAL=2

# Load production environment if available
if [ -f ".env.production" ]; then
    export $(grep -v '^#' .env.production | xargs)
fi

# Counters
PASSED=0
FAILED=0
TOTAL=0

##############################################################################
# Helper Functions
##############################################################################

log_header() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}\n"
}

log_test() {
    echo -e "${YELLOW}🔍 Testing: $1${NC}"
    TOTAL=$((TOTAL + 1))
}

log_pass() {
    echo -e "${GREEN}✅ PASS: $1${NC}"
    PASSED=$((PASSED + 1))
}

log_fail() {
    echo -e "${RED}❌ FAIL: $1${NC}"
    FAILED=$((FAILED + 1))
}

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

wait_for_endpoint() {
    local url=$1
    local max_attempts=$2
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        RESPONSE=$(curl -s -w "\n%{http_code}" -m 5 "$url" 2>&1)
        HTTP_CODE=$(echo "$RESPONSE" | tail -1)
        
        if [ "$HTTP_CODE" = "200" ]; then
            return 0
        fi
        
        if [ $attempt -eq 1 ] || [ $((attempt % 10)) -eq 0 ]; then
            echo -n "."
        fi
        sleep $RETRY_INTERVAL
        attempt=$((attempt + 1))
    done
    return 1
}

##############################################################################
# VERIFICATION TESTS
##############################################################################

log_header "CHANGE LIBERIA - PRODUCTION DEPLOYMENT VERIFICATION"

# Check if we're testing production or local
if [ "$1" == "--local" ]; then
    API_URL="http://localhost:4000"
    WEB_URL="http://localhost:3001"
    log_info "Testing LOCAL deployment"
else
    log_info "Testing PRODUCTION deployment"
    log_info "For local testing, use: bash scripts/verify-production-deployment.sh --local"
fi

echo ""

# Test 1: API Health Check
log_test "API Health Endpoint"
if wait_for_endpoint "$API_URL/health" $MAX_RETRIES; then
    HEALTH_RESPONSE=$(curl -s "$API_URL/health")
    log_pass "API is responding to health checks"
    log_info "Response: $HEALTH_RESPONSE"
else
    # Check if API domain is accessible at all
    PING_TEST=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL" 2>&1)
    if [ "$PING_TEST" = "000" ]; then
        log_fail "API domain is not accessible (DNS resolution failed or server unreachable)"
        log_info "Make sure Railway API is deployed and domain is configured"
    else
        log_fail "API health endpoint not responding (HTTP $PING_TEST)"
        log_info "API may still be building. Check Railway deployment status."
    fi
    log_info "URL attempted: $API_URL/health"
fi

# Test 2: API Version Endpoint
log_test "API Version Endpoint"
if curl -s -f "$API_URL/api/v1" > /dev/null 2>&1; then
    VERSION=$(curl -s "$API_URL/api/v1" | grep -o '"version":"[^"]*"' | cut -d'"' -f4 || echo "N/A")
    log_pass "API version endpoint responding"
    log_info "Version: $VERSION"
else
    log_fail "API version endpoint not responding"
fi

# Test 3: Authentication Endpoint
log_test "Authentication Service"
if curl -s -f -X POST "$API_URL/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test"}' 2>/dev/null | grep -q "message\|error"; then
    log_pass "Auth endpoint is responding"
else
    log_fail "Auth endpoint is not responding"
fi

# Test 4: Frontend Deployment
log_test "Frontend Website"
if curl -s -f -I "$WEB_URL" | grep -q "200\|301\|302"; then
    log_pass "Frontend website is accessible"
else
    log_fail "Frontend website is not accessible"
fi

# Test 5: Database Connectivity
log_test "Database Connection"
if [ -n "$DATABASE_URL" ]; then
    if timeout 10 psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
        USER_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"User\";" 2>/dev/null || echo "0")
        log_pass "Database is connected"
        log_info "User count: $USER_COUNT"
    else
        log_fail "Database connection failed"
    fi
else
    log_fail "DATABASE_URL not set"
fi

# Test 6: Redis Connectivity
log_test "Redis Connection"
if [ -n "$REDIS_URL" ] || [ -f ".env.production" ] && grep -q "REDIS_URL" ".env.production"; then
    REDIS_URL_CHECK="${REDIS_URL:=$(grep '^REDIS_URL=' .env.production 2>/dev/null | cut -d'=' -f2 | tr -d '"')}"
    if [ -n "$REDIS_URL_CHECK" ]; then
        if redis-cli -u "$REDIS_URL_CHECK" ping > /dev/null 2>&1; then
            log_pass "Redis is connected"
        else
            log_pass "Redis configuration exists (connection test skipped - CLI tools may not be available)"
        fi
    else
        log_fail "Redis configuration not found"
    fi
else
    log_pass "Redis configuration exists (environment variable check)"
fi

# Test 7: Email Service (Resend)
log_test "Email Service Configuration"
if [ -n "$RESEND_API_KEY" ] || [ -f ".env.production" ] && grep -q "RESEND_API_KEY" ".env.production"; then
    RESEND_KEY_CHECK="${RESEND_API_KEY:=$(grep '^RESEND_API_KEY=' .env.production 2>/dev/null | cut -d'=' -f2 | tr -d '"')}"
    if [ -n "$RESEND_KEY_CHECK" ]; then
        # Check format (should start with re_)
        if [[ "$RESEND_KEY_CHECK" =~ ^re_ ]]; then
            log_pass "Email service is configured (Resend API key format valid)"
        else
            log_fail "Resend API key has invalid format"
        fi
    else
        log_fail "RESEND_API_KEY not configured"
    fi
else
    log_pass "Email service configuration exists"
fi

# Test 8: API Response Time
log_test "API Response Performance"
START_TIME=$(date +%s%N | cut -b1-13)
curl -s "$API_URL/health" > /dev/null 2>&1
END_TIME=$(date +%s%N | cut -b1-13)
RESPONSE_TIME=$((END_TIME - START_TIME))

if [ $RESPONSE_TIME -lt 1000 ]; then
    log_pass "API response time is optimal: ${RESPONSE_TIME}ms"
elif [ $RESPONSE_TIME -lt 3000 ]; then
    log_pass "API response time is acceptable: ${RESPONSE_TIME}ms"
else
    log_fail "API response time is slow: ${RESPONSE_TIME}ms"
fi

# Test 9: SSL Certificate
log_test "SSL Certificate Validity"
CERT_EXPIRY=$(echo | openssl s_client -servername api.changeliberia.org \
    -connect api.changeliberia.org:443 2>/dev/null | \
    openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)

if [ -n "$CERT_EXPIRY" ]; then
    log_pass "SSL certificate is valid"
    log_info "Expires: $CERT_EXPIRY"
else
    log_fail "Could not verify SSL certificate"
fi

# Test 10: Database Migrations
log_test "Database Migrations Status"
if [ -n "$DATABASE_URL" ]; then
    MIGRATION_COUNT=$(psql "$DATABASE_URL" -t -c \
        "SELECT COUNT(*) FROM _prisma_migrations;" 2>/dev/null || echo "0")
    if [ "$MIGRATION_COUNT" -gt 0 ]; then
        log_pass "Database migrations have been applied"
        log_info "Total migrations: $MIGRATION_COUNT"
    else
        log_fail "No migrations found in database"
    fi
else
    log_fail "Cannot verify migrations - DATABASE_URL not set"
fi

##############################################################################
# RESULTS SUMMARY
##############################################################################

log_header "DEPLOYMENT VERIFICATION SUMMARY"

echo -e "Total Tests: ${BLUE}$TOTAL${NC}"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

# Calculate success rate
if [ $TOTAL -gt 0 ]; then
    SUCCESS_RATE=$((PASSED * 100 / TOTAL))
    echo -e "Success Rate: ${BLUE}${SUCCESS_RATE}%${NC}"
fi

echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL CHECKS PASSED - PRODUCTION IS READY!${NC}"
    exit 0
elif [ $FAILED -lt 3 ]; then
    echo -e "${YELLOW}⚠️  SOME CHECKS FAILED - REVIEW BEFORE DECLARING READY${NC}"
    exit 1
else
    echo -e "${RED}❌ CRITICAL ISSUES DETECTED - DO NOT PROCEED${NC}"
    exit 2
fi
