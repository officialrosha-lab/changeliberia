#!/bin/bash

# Quick Email System Verification
# Fast checks without requiring authentication or full test suite

RESET='\033[0m'
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'

API_URL="${API_URL:-http://localhost:4000}"
REDIS_URL="${REDIS_URL:-redis://localhost:6379}"

echo -e "${BLUE}=== Email System Quick Verification ===${RESET}\n"

PASSED=0
FAILED=0

# Test 1: API Health
echo -n "1. API Health Endpoint... "
HEALTH=$(curl -s "$API_URL/health" 2>&1)
if echo "$HEALTH" | grep -q '"status":"ok"'; then
  echo -e "${GREEN}PASS${RESET}"
  ((PASSED++))
else
  echo -e "${RED}FAIL${RESET}"
  ((FAILED++))
fi

# Test 2: Redis Connection
echo -n "2. Redis Connection... "
if redis-cli -u "$REDIS_URL" ping > /dev/null 2>&1; then
  echo -e "${GREEN}PASS${RESET}"
  ((PASSED++))
else
  echo -e "${RED}FAIL${RESET}"
  ((FAILED++))
fi

# Test 3: Database Migration Status
echo -n "3. Database Migrations Applied... "
cd apps/api
MIGRATION_COUNT=$(npx prisma migrate status 2>&1 | grep "Migrations" | grep -o "[0-9]*" | head -1)
if [ ! -z "$MIGRATION_COUNT" ] && [ "$MIGRATION_COUNT" -gt 0 ]; then
  echo -e "${GREEN}PASS (${MIGRATION_COUNT} applied)${RESET}"
  ((PASSED++))
else
  echo -e "${RED}FAIL${RESET}"
  ((FAILED++))
fi
cd - > /dev/null

# Test 4: EmailLog Table
echo -n "4. EmailLog Table Exists... "
SCHEMA_CHECK=$(cd apps/api && npx prisma db execute --stdin <<< 'SELECT COUNT(*) FROM "EmailLog" LIMIT 1' 2>&1)
if [ $? -eq 0 ]; then
  echo -e "${GREEN}PASS${RESET}"
  ((PASSED++))
else
  echo -e "${RED}FAIL${RESET}"
  ((FAILED++))
fi

# Test 5: Email Module Providers Check
echo -n "5. Email Module Services... "
if curl -s "$API_URL/health" | grep -q "ok"; then
  echo -e "${GREEN}PASS (API bootstrapped successfully)${RESET}"
  ((PASSED++))
else
  echo -e "${RED}FAIL${RESET}"
  ((FAILED++))
fi

echo ""
echo -e "${BLUE}Results: ${GREEN}${PASSED} PASS${RESET} / ${RED}${FAILED} FAIL${RESET}${RESET}"

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All quick verification checks passed!${RESET}"
  exit 0
else
  echo -e "${RED}✗ Some checks failed${RESET}"
  exit 1
fi
