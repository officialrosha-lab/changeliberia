#!/bin/bash
# Email System Monitoring Script
# Monitors email delivery rate, queue depth, and system health
# Run via cron every 15 minutes: */15 * * * * bash /path/to/scripts/monitor-email.sh

set -e

# Configuration
PROD_DB_URL="${DATABASE_URL}"
PROD_API_URL="${APP_URL:-https://changeliberia.org}"
ALERT_EMAIL="${OPS_EMAIL:-ops@changeliberia.org}"
THRESHOLD_FAILURE_RATE=${THRESHOLD_FAILURE_RATE:-5}
THRESHOLD_QUEUE_DEPTH=${THRESHOLD_QUEUE_DEPTH:-100}
REDIS_URL="${REDIS_URL}"

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Logging
LOG_FILE="/var/log/changeliberia-email-monitor.log"
mkdir -p "$(dirname "$LOG_FILE")"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to send alert
send_alert() {
    local subject=$1
    local message=$2
    local severity=$3
    
    # Send via email
    if command -v mail &> /dev/null; then
        echo "$message" | mail -s "$subject" "$ALERT_EMAIL"
    fi
    
    # Log to file
    log "ALERT [$severity]: $subject - $message"
}

log "====== Email System Monitoring Check Started ======"

# ============ CHECK 1: Database Connection ============
log "Check 1: Verifying database connection..."
if psql "$PROD_DB_URL" -c "SELECT 1" > /dev/null 2>&1; then
    log "✓ Database connection: OK"
else
    send_alert "🚨 Database Connection Failed" "Cannot connect to production database. Service may be down." "CRITICAL"
    exit 1
fi

# ============ CHECK 2: Redis Connection ============
log "Check 2: Verifying Redis connection..."
if redis-cli -u "$REDIS_URL" ping > /dev/null 2>&1; then
    log "✓ Redis connection: OK"
else
    send_alert "🚨 Redis Connection Failed" "Cannot connect to Redis. Email queue may be stuck." "CRITICAL"
    exit 1
fi

# ============ CHECK 3: Email Delivery Rate ============
log "Check 3: Calculating email delivery rate (last 1 hour)..."

TOTAL=$(psql -t "$PROD_DB_URL" -c "
  SELECT COUNT(*) FROM \"EmailLog\" 
  WHERE \"sentAt\" > NOW() - INTERVAL '1 hour'
" | xargs)

if [ "$TOTAL" -eq 0 ]; then
    log "ℹ No emails sent in last hour"
else
    DELIVERED=$(psql -t "$PROD_DB_URL" -c "
      SELECT COUNT(*) FROM \"EmailLog\" 
      WHERE status = 'DELIVERED' 
      AND \"sentAt\" > NOW() - INTERVAL '1 hour'
    " | xargs)
    
    FAILED=$(psql -t "$PROD_DB_URL" -c "
      SELECT COUNT(*) FROM \"EmailLog\" 
      WHERE status = 'FAILED' 
      AND \"sentAt\" > NOW() - INTERVAL '1 hour'
    " | xargs)
    
    DELIVERY_RATE=$((DELIVERED * 100 / TOTAL))
    
    if [ "$DELIVERY_RATE" -ge 95 ]; then
        log "✓ Delivery rate: ${DELIVERY_RATE}% (${DELIVERED}/${TOTAL} delivered)"
    elif [ "$DELIVERY_RATE" -ge 90 ]; then
        log "⚠ Delivery rate: ${DELIVERY_RATE}% (${DELIVERED}/${TOTAL} delivered, ${FAILED} failed)"
    else
        send_alert "⚠ Email Delivery Rate Low" "Delivery rate: ${DELIVERY_RATE}% (${DELIVERED}/${TOTAL}). ${FAILED} emails failed." "WARNING"
        log "✗ Delivery rate: ${DELIVERY_RATE}% - ALERT SENT"
    fi
    
    # If failure rate exceeds threshold
    FAILURE_RATE=$((FAILED * 100 / TOTAL))
    if [ "$FAILURE_RATE" -gt "$THRESHOLD_FAILURE_RATE" ]; then
        cat > /tmp/email_failure_alert.txt << EOF
🚨 EMAIL FAILURE RATE ALERT

Failure Rate: ${FAILURE_RATE}% (Threshold: ${THRESHOLD_FAILURE_RATE}%)
Failed Emails: ${FAILED} of ${TOTAL}
Time Window: Last 1 hour
Delivery Rate: ${DELIVERY_RATE}%

Recent Failed Emails (Last 10):
$(psql -t "$PROD_DB_URL" -c "
  SELECT \"recipientEmail\", \"errorMessage\", \"sentAt\" 
  FROM \"EmailLog\" 
  WHERE status = 'FAILED' 
  AND \"sentAt\" > NOW() - INTERVAL '1 hour'
  ORDER BY \"sentAt\" DESC
  LIMIT 10
")

Recommended Actions:
1. Check Resend API status: https://status.resend.com
2. Verify email domain is verified in Resend dashboard
3. Check RESEND_API_KEY in .env.production
4. Review API logs: docker logs api | grep -i email
5. Check Redis queue: redis-cli -u $REDIS_URL INFO stats
EOF
        
        send_alert "🚨 EMAIL FAILURE ALERT - ${FAILURE_RATE}% Failure Rate" "$(cat /tmp/email_failure_alert.txt)" "CRITICAL"
    fi
fi

# ============ CHECK 4: Queue Depth ============
log "Check 4: Checking email queue depth..."
QUEUE_DEPTH=$(redis-cli -u "$REDIS_URL" LLEN bull:email:wait 2>/dev/null || echo "0")
log "Email queue depth: ${QUEUE_DEPTH} jobs waiting"

if [ "$QUEUE_DEPTH" -gt "$THRESHOLD_QUEUE_DEPTH" ]; then
    send_alert "⚠ Email Queue Backlog" "Queue depth: ${QUEUE_DEPTH} emails (threshold: ${THRESHOLD_QUEUE_DEPTH}). Processing may be slow." "WARNING"
fi

# ============ CHECK 5: API Health ============
log "Check 5: Checking API health endpoint..."
if curl -s -f "$PROD_API_URL/api/v1/health" > /dev/null 2>&1; then
    log "✓ API health: OK"
else
    send_alert "🚨 API Health Check Failed" "API is not responding to health checks. Service may be down." "CRITICAL"
fi

# ============ CHECK 6: Failed Job Retry ============
log "Check 6: Checking for stuck failed jobs..."
FAILED_JOBS=$(redis-cli -u "$REDIS_URL" LLEN bull:email:failed 2>/dev/null || echo "0")
if [ "$FAILED_JOBS" -gt 5 ]; then
    log "⚠ Found ${FAILED_JOBS} failed jobs - may need manual retry"
    send_alert "⚠ Failed Email Jobs Detected" "Found ${FAILED_JOBS} failed email jobs. May need manual retry." "WARNING"
fi

# ============ CHECK 7: Database Storage ============
log "Check 7: Checking database size..."
DB_SIZE=$(psql -t "$PROD_DB_URL" -c "
  SELECT pg_size_pretty(pg_database_size('postgres'))
")
log "Database size: $DB_SIZE"

# ============ SUMMARY ============
log "====== Monitoring Check Completed Successfully ======"
log "Summary:"
log "  - Database: Connected"
log "  - Redis: Connected"
if [ "$TOTAL" -gt 0 ]; then
    log "  - Delivery Rate: ${DELIVERY_RATE}%"
    log "  - Failed: ${FAILED}"
fi
log "  - Queue Depth: ${QUEUE_DEPTH}"
log "  - DB Size: $DB_SIZE"
log "====== End of Report ======"
