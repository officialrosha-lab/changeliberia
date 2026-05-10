#!/bin/bash

# Email System Test Suite
# Runs 12 comprehensive tests to validate email system

set -e

RESET='\033[0m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'

# Configuration
API_URL="${API_URL:-http://localhost:4000}"
WEB_URL="${WEB_URL:-http://localhost:3000}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@example.com}"
TEST_EMAIL="${TEST_EMAIL:-test@example.com}"
REDIS_URL="${REDIS_URL:-redis://localhost:6379}"

TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
print_header() {
  echo ""
  echo -e "${BLUE}========================================${RESET}"
  echo -e "${BLUE}$1${RESET}"
  echo -e "${BLUE}========================================${RESET}"
}

print_test() {
  echo ""
  echo -e "${BLUE}TEST: $1${RESET}"
}

print_success() {
  echo -e "${GREEN}✓ PASS: $1${RESET}"
  ((TESTS_PASSED++))
}

print_fail() {
  echo -e "${RED}✗ FAIL: $1${RESET}"
  ((TESTS_FAILED++))
}

print_info() {
  echo -e "${BLUE}ℹ $1${RESET}"
}

# ====================
# TEST SUITE
# ====================

print_header "Email System Test Suite"
echo "API URL: $API_URL"
echo "Web URL: $WEB_URL"
echo "Test Email: $TEST_EMAIL"
echo ""

# Test 1: Database Schema
print_test "1: Database Schema Validation"

if cd apps/api && npx prisma db execute --stdin <<< 'SELECT COUNT(*) FROM "EmailLog"' > /dev/null 2>&1; then
  print_success "EmailLog table exists"
else
  print_fail "EmailLog table not found"
fi

if cd apps/api && npx prisma db execute --stdin <<< 'SELECT emailEnabled FROM "NotificationPreference" LIMIT 1' > /dev/null 2>&1; then
  print_success "NotificationPreference schema correct"
else
  print_fail "NotificationPreference schema issue"
fi

if cd apps/api && npx prisma db execute --stdin <<< 'SELECT COUNT(*) FROM "PermissionResource" WHERE name = '\''EMAIL'\''' > /dev/null 2>&1; then
  print_success "EMAIL permission resource exists"
else
  print_fail "EMAIL permission not found"
fi

cd - > /dev/null

# Test 2: Redis Connection
print_test "2: Redis Connection"

if redis-cli -u $REDIS_URL ping > /dev/null 2>&1; then
  print_success "Redis connection successful"
else
  print_fail "Redis connection failed"
fi

REDIS_MEM=$(redis-cli -u $REDIS_URL INFO memory | grep used_memory_human | cut -d: -f2 | tr -d '\r')
print_info "Redis memory: $REDIS_MEM"

# Test 3: API Server Health
print_test "3: API Server Health"

if curl -s -f "$API_URL/health" > /dev/null 2>&1; then
  print_success "API server responding"
else
  print_fail "API server not responding"
fi

# Test 4: Email Module Initialization
print_test "4: Email Module Health Check"

HEALTH=$(curl -s -f "$API_URL/api/v1/admin/email/health" 2>&1 || echo "{}")

if echo "$HEALTH" | grep -q '"status":"ok"'; then
  print_success "Email system healthy"
else
  print_fail "Email system health check failed"
  print_info "Response: $HEALTH"
fi

# Test 5: Send Test Email
print_test "5: Send Test Email"

SEND_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/email/test-send" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$TEST_EMAIL\", \"emailType\": \"WELCOME\", \"props\": {\"fullName\": \"Test User\"}}" 2>&1 || echo "{}")

if echo "$SEND_RESPONSE" | grep -q '"status":"queued"'; then
  print_success "Test email queued"
  JOB_ID=$(echo "$SEND_RESPONSE" | grep -o '"jobId":"[^"]*' | cut -d'"' -f4)
  print_info "Job ID: $JOB_ID"
else
  print_fail "Failed to queue test email"
  print_info "Response: $SEND_RESPONSE"
fi

# Test 6: Queue Statistics
print_test "6: Queue Statistics"

QUEUE_STATS=$(curl -s -f "$API_URL/api/v1/admin/email/queue-stats" 2>&1 || echo "{}")

if echo "$QUEUE_STATS" | grep -q '"queued"'; then
  print_success "Queue statistics available"
  print_info "Response: $QUEUE_STATS"
else
  print_fail "Queue statistics unavailable"
fi

# Test 7: Email Log Entry
print_test "7: Email Log Entry Creation"

sleep 2  # Give processor time

EMAIL_LOG=$(curl -s -f "$API_URL/api/v1/email/logs?limit=1" 2>&1 || echo "[]")

if echo "$EMAIL_LOG" | grep -q '"type":"WELCOME"'; then
  print_success "Email log entry created"
  EMAIL_ID=$(echo "$EMAIL_LOG" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
  print_info "Email Log ID: $EMAIL_ID"
else
  print_fail "Email log entry not found"
  print_info "Response: $EMAIL_LOG"
fi

# Test 8: Email Preferences
print_test "8: Email Preference Management"

PREFS=$(curl -s -f "$API_URL/api/v1/email/preferences" \
  -H "Authorization: Bearer test-token" 2>&1 || echo "{}")

if echo "$PREFS" | grep -q '"emailEnabled"'; then
  print_success "Email preferences retrievable"
else
  print_fail "Email preferences not accessible"
fi

# Test 9: Tracking Pixel Endpoint
print_test "9: Tracking Pixel Endpoint"

if [ -n "$EMAIL_ID" ]; then
  PIXEL=$(curl -s -f "$API_URL/api/v1/email/track/open/$EMAIL_ID/test-pixel-id" 2>&1 || echo "")
  
  if [ -n "$PIXEL" ] && file - <<< "$PIXEL" | grep -q "GIF"; then
    print_success "Tracking pixel endpoint functional"
  else
    print_fail "Tracking pixel not returned correctly"
  fi
else
  print_warning "Skipping pixel test - no email ID available"
fi

# Test 10: Click Tracking
print_test "10: Click Tracking Endpoint"

if [ -n "$EMAIL_ID" ]; then
  CLICK_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    "$API_URL/api/v1/email/track/click/$EMAIL_ID/test-link-id?redirect=https://example.com")
  
  if [ "$CLICK_STATUS" = "302" ] || [ "$CLICK_STATUS" = "200" ]; then
    print_success "Click tracking endpoint functional"
  else
    print_fail "Click tracking returned status: $CLICK_STATUS"
  fi
else
  print_warning "Skipping click test - no email ID available"
fi

# Test 11: Admin Dashboard Accessibility
print_test "11: Admin Dashboard"

ADMIN_DASHBOARD=$(curl -s -f "$WEB_URL/admin" 2>&1 | grep -o "Email\|email" || echo "")

if [ -n "$ADMIN_DASHBOARD" ]; then
  print_success "Admin dashboard accessible"
else
  print_fail "Admin dashboard not accessible"
fi

# Test 12: Email Statistics
print_test "12: Email Statistics"

STATS=$(curl -s -f "$API_URL/api/v1/admin/email/stats?startDate=2026-05-01&endDate=2026-05-11" 2>&1 || echo "{}")

if echo "$STATS" | grep -q '"totalSent"'; then
  print_success "Email statistics available"
  print_info "Response: $STATS"
else
  print_fail "Email statistics not available"
fi

# Summary
print_header "Test Results Summary"

echo ""
echo -e "${GREEN}Passed: $TESTS_PASSED${RESET}"
echo -e "${RED}Failed: $TESTS_FAILED${RESET}"
TOTAL=$((TESTS_PASSED + TESTS_FAILED))
PASS_RATE=$((TESTS_PASSED * 100 / TOTAL))
echo "Pass Rate: $PASS_RATE%"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  print_header "✓ All Tests Passed!"
  echo ""
  echo "Email system is ready for production!"
  echo ""
  echo "Next steps:"
  echo "1. Verify Resend domain: https://resend.com/domains"
  echo "2. Configure webhook: https://resend.com/webhooks"
  echo "3. Set admin EMAIL permission in database"
  echo "4. Monitor admin dashboard: $WEB_URL/admin → Email"
  echo ""
  exit 0
else
  print_header "✗ Some Tests Failed"
  echo ""
  echo "Issues to resolve:"
  echo "1. Check API logs: tail -f apps/api/logs/error.log"
  echo "2. Verify Redis: redis-cli -u $REDIS_URL ping"
  echo "3. Check database: npx prisma studio"
  echo "4. Review admin dashboard: $WEB_URL/admin → Email → Configuration"
  echo ""
  exit 1
fi
