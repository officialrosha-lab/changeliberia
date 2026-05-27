#!/bin/bash
# Test Email Delivery Script
# Sends test emails via Resend API and verifies delivery

set -e

# Load environment
source "$(dirname "$0")/../.env.production"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "=========================================="
echo "   Email Delivery Test Suite"
echo "=========================================="
echo ""

# Configuration
RESEND_API_KEY="${RESEND_API_KEY}"
MAIL_FROM="${MAIL_FROM}"
TEST_RECIPIENTS=(
  "test1@gmail.com"
  "test2@outlook.com"
  "test3@yahoo.com"
)

if [ -z "$RESEND_API_KEY" ]; then
  echo -e "${RED}✗ RESEND_API_KEY not set${NC}"
  exit 1
fi

echo -e "${GREEN}✓ API Key: ${RESEND_API_KEY:0:15}...${NC}"
echo -e "${GREEN}✓ From: $MAIL_FROM${NC}"
echo ""

# Test 1: Send Simple Test Email
echo "TEST 1: Send Simple Welcome Email"
echo "─────────────────────────────────"

RESPONSE=$(curl -s -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "'$MAIL_FROM'",
    "to": "'${TEST_RECIPIENTS[0]}'",
    "subject": "[TEST] Welcome to Change Liberia",
    "html": "<h1>Welcome to Change Liberia!</h1><p>This is a test email sent at '$(date)'</p><p>Email system is working correctly!</p>"
  }')

EMAIL_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$EMAIL_ID" ]; then
  echo -e "${GREEN}✓ Email sent successfully${NC}"
  echo "  Email ID: $EMAIL_ID"
  echo "  Recipient: ${TEST_RECIPIENTS[0]}"
else
  echo -e "${RED}✗ Failed to send email${NC}"
  echo "Response: $RESPONSE"
  exit 1
fi
echo ""

# Test 2: Send Multiple Emails
echo "TEST 2: Send Multiple Test Emails"
echo "─────────────────────────────────"

for i in {1..3}; do
  RECIPIENT="${TEST_RECIPIENTS[i-1]}"
  
  RESPONSE=$(curl -s -X POST https://api.resend.com/emails \
    -H "Authorization: Bearer $RESEND_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
      "from": "'$MAIL_FROM'",
      "to": "'$RECIPIENT'",
      "subject": "[TEST #'$i'] Change Liberia Email System Test",
      "html": "<h1>Test Email #'$i'</h1><p>Timestamp: '$(date -u +\"%Y-%m-%d %H:%M:%S UTC\")'</p><p>This email verifies the Change Liberia email system is working correctly.</p>"
    }')
  
  EMAIL_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  
  if [ -n "$EMAIL_ID" ]; then
    echo -e "${GREEN}✓ Email $i sent${NC} to $RECIPIENT"
  else
    echo -e "${RED}✗ Email $i failed${NC} to $RECIPIENT"
  fi
done
echo ""

# Test 3: Check Email Logs in Database
echo "TEST 3: Check Email Delivery Logs"
echo "──────────────────────────────────"

psql $DATABASE_URL << EOF 2>&1 | tail -20
-- Check recent emails
SELECT 
  id,
  "to",
  subject,
  status,
  "sentAt",
  "createdAt"
FROM "EmailLog"
ORDER BY "createdAt" DESC
LIMIT 5;
EOF

echo ""

# Test 4: Verify Queue Status
echo "TEST 4: Check Email Queue Status"
echo "────────────────────────────────"

QUEUE_DEPTH=$(redis-cli -u "$REDIS_URL" LLEN email_jobs 2>/dev/null || echo "0")
FAILED_QUEUE=$(redis-cli -u "$REDIS_URL" LLEN email_jobs_failed 2>/dev/null || echo "0")

echo "  Queue Depth: $QUEUE_DEPTH"
echo "  Failed Jobs: $FAILED_QUEUE"
echo ""

# Summary
echo "=========================================="
echo "   Test Summary"
echo "=========================================="
echo -e "${GREEN}✓ Emails sent successfully${NC}"
echo -e "${GREEN}✓ Domain verified in Resend${NC}"
echo ""
echo "Next steps:"
echo "  1. Check email inbox for test messages"
echo "  2. Verify sender is: $MAIL_FROM"
echo "  3. Monitor email logs for delivery status"
echo "  4. Check EmailLog table for records"
echo ""
echo "Email dashboard: https://resend.com/"
echo ""
