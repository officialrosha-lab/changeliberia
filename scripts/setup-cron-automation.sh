#!/bin/bash
# ============================================================================
# CHANGE LIBERIA - AUTOMATED MONITORING SETUP
# Purpose: Configure cron jobs for automated monitoring and health checks
# Date: May 28, 2026
# ============================================================================

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_PATH="/Users/visionalventure/Change Liberia"

echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  CHANGE LIBERIA - CRON AUTOMATION SETUP${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}\n"

# Check if user is root (not required for user crontabs)
if [ "$EUID" -eq 0 ]; then
   echo -e "${YELLOW}Running as root - setting up system-wide cron jobs${NC}"
   CRON_USER="root"
else
   echo -e "${BLUE}Setting up user cron jobs (current user)${NC}"
   CRON_USER=$(whoami)
fi

echo ""
echo -e "${BLUE}Current User: ${YELLOW}$CRON_USER${NC}"
echo -e "${BLUE}Project Path: ${YELLOW}$PROJECT_PATH${NC}\n"

# Create temporary crontab file with new jobs
TEMP_CRON=$(mktemp)

# Export current crontab (if it exists)
crontab -l > "$TEMP_CRON" 2>/dev/null || true

echo -e "${BLUE}Adding new cron jobs...${NC}\n"

# Check if jobs already exist to avoid duplicates
if grep -q "verify-production-deployment.sh" "$TEMP_CRON" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Health check jobs already configured${NC}"
else
    # Health checks every 5 minutes
    echo "*/5 * * * * cd \"$PROJECT_PATH\" && bash scripts/health-check.sh >> monitoring/logs/cron.log 2>&1" >> "$TEMP_CRON"
    echo -e "${GREEN}✅ Added: Health checks every 5 minutes${NC}"
    
    # Performance monitoring every hour
    echo "0 * * * * cd \"$PROJECT_PATH\" && bash scripts/performance-monitor.sh >> monitoring/logs/cron.log 2>&1" >> "$TEMP_CRON"
    echo -e "${GREEN}✅ Added: Performance monitoring every hour${NC}"
    
    # Log rotation daily at 2 AM
    echo "0 2 * * * cd \"$PROJECT_PATH\" && find monitoring/logs -name '*.log' -mtime +30 -delete" >> "$TEMP_CRON"
    echo -e "${GREEN}✅ Added: Log rotation daily at 2 AM${NC}"
    
    # Database backup reminder daily at 3 AM
    echo "0 3 * * * cd \"$PROJECT_PATH\" && echo '[$(date)] Reminder: Check database backups' >> monitoring/logs/system.log" >> "$TEMP_CRON"
    echo -e "${GREEN}✅ Added: Database backup check reminder daily at 3 AM${NC}"
    
    # Weekly report generation (every Monday at 9 AM)
    echo "0 9 * * 1 cd \"$PROJECT_PATH\" && echo 'Weekly monitoring report - $(date)' >> monitoring/logs/weekly-report.log" >> "$TEMP_CRON"
    echo -e "${GREEN}✅ Added: Weekly monitoring report every Monday at 9 AM${NC}"
fi

echo ""
echo -e "${BLUE}Installing new crontab...${NC}"

# Install updated crontab
crontab "$TEMP_CRON"
rm "$TEMP_CRON"

echo -e "${GREEN}✅ Crontab updated successfully${NC}\n"

# Display installed cron jobs
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  INSTALLED CRON JOBS${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}\n"

crontab -l | grep -E "(health-check|performance-monitor|log rotation|backup|weekly)" || echo "No matching jobs found"

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  CRON JOB DETAILS${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}\n"

cat << 'EOF'
1. HEALTH CHECKS (Every 5 minutes)
   ├─ API endpoint: /health
   ├─ Database connectivity
   ├─ Redis connectivity
   └─ Log: monitoring/logs/health-checks.log

2. PERFORMANCE MONITORING (Every hour)
   ├─ API response time (10 samples)
   ├─ Database query performance
   └─ Log: monitoring/logs/performance-metrics.log

3. LOG ROTATION (Daily at 2 AM)
   ├─ Removes logs older than 30 days
   ├─ Prevents disk space issues
   └─ Automatic cleanup

4. DATABASE BACKUP REMINDER (Daily at 3 AM)
   ├─ Logs reminder to verify backups
   └─ Log: monitoring/logs/system.log

5. WEEKLY REPORT (Every Monday at 9 AM)
   ├─ Generates weekly summary
   └─ Log: monitoring/logs/weekly-report.log
EOF

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  MANAGEMENT COMMANDS${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}\n"

cat << 'EOF'
View all cron jobs:
  crontab -l

Edit cron jobs:
  crontab -e

Remove all cron jobs:
  crontab -r

View cron logs (on macOS):
  log stream --predicate 'process == "cron"'

View cron logs (on Linux):
  grep CRON /var/log/syslog
  or
  journalctl -u cron

Check if cron is running:
  ps aux | grep cron
EOF

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ CRON AUTOMATION SETUP COMPLETE${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}\n"

echo -e "${YELLOW}📝 IMPORTANT NOTES:${NC}"
echo ""
echo "1. Cron jobs will run in the background"
echo "   All output is logged to: monitoring/logs/cron.log"
echo ""
echo "2. For alerts to work, configure:"
echo "   - Slack webhook in monitoring/alerts/alerts-config.json"
echo "   - Email recipients for notifications"
echo ""
echo "3. Monitor the logs:"
echo "   tail -f monitoring/logs/cron.log"
echo "   tail -f monitoring/logs/health-checks.log"
echo ""
echo "4. Set up external monitoring:"
echo "   - UptimeRobot for 24/7 monitoring"
echo "   - PagerDuty for alert escalation"
echo "   - Datadog for advanced metrics"
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}\n"
