#!/bin/bash

##############################################################################
# PRODUCTION MONITORING SETUP SCRIPT
# Purpose: Set up monitoring, alerting, and health checks
# Usage: bash scripts/setup-monitoring.sh
# Date: May 28, 2026
##############################################################################

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

##############################################################################
# Helper Functions
##############################################################################

log_header() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}\n"
}

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

##############################################################################
# MAIN SETUP
##############################################################################

log_header "CHANGE LIBERIA - PRODUCTION MONITORING SETUP"

# Check if we're in the project root
if [ ! -f "package.json" ]; then
    log_error "Not in project root. Please run from /Users/visionalventure/Change Liberia"
    exit 1
fi

log_info "Step 1: Creating monitoring directories"
mkdir -p monitoring/{alerts,logs,dashboards}
log_success "Directories created"

log_info "Step 2: Checking for required monitoring tools"
TOOLS_INSTALLED=0

if command -v node &> /dev/null; then
    log_success "Node.js is installed: $(node --version)"
else
    log_warning "Node.js not found"
fi

if command -v docker &> /dev/null; then
    log_success "Docker is installed: $(docker --version)"
else
    log_warning "Docker not found (optional for local monitoring)"
fi

if command -v curl &> /dev/null; then
    log_success "curl is installed"
else
    log_error "curl is required but not installed"
    exit 1
fi

# Create cron job for health checks
log_info "Step 3: Setting up automated health checks"

# Create health check script
cat > scripts/health-check.sh << 'EOF'
#!/bin/bash
API_URL="${API_URL:-https://api.changeliberia.org}"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
HEALTH_FILE="monitoring/logs/health-checks.log"

# Check API health
if curl -s -f "$API_URL/health" > /dev/null 2>&1; then
    echo "[$TIMESTAMP] ✅ API is healthy" >> "$HEALTH_FILE"
else
    echo "[$TIMESTAMP] ❌ API health check failed" >> "$HEALTH_FILE"
    # TODO: Send alert
fi

# Check database
if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "[$TIMESTAMP] ✅ Database is accessible" >> "$HEALTH_FILE"
else
    echo "[$TIMESTAMP] ❌ Database check failed" >> "$HEALTH_FILE"
    # TODO: Send alert
fi

# Check Redis
if redis-cli -u "$REDIS_URL" ping > /dev/null 2>&1; then
    echo "[$TIMESTAMP] ✅ Redis is accessible" >> "$HEALTH_FILE"
else
    echo "[$TIMESTAMP] ❌ Redis check failed" >> "$HEALTH_FILE"
    # TODO: Send alert
fi
EOF

chmod +x scripts/health-check.sh
log_success "Health check script created"

# Create monitoring dashboard script
log_info "Step 4: Creating monitoring dashboard"

cat > scripts/monitoring-dashboard.sh << 'EOF'
#!/bin/bash

API_URL="${API_URL:-https://api.changeliberia.org}"
REFRESH_INTERVAL=5

clear

while true; do
    clear
    
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║          CHANGE LIBERIA - PRODUCTION MONITORING DASHBOARD     ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Last Updated: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "Refresh Interval: ${REFRESH_INTERVAL}s"
    echo ""
    
    # API Status
    echo "┌──────────────────────────────────────────────────────────────┐"
    echo "│ API STATUS                                                   │"
    echo "└──────────────────────────────────────────────────────────────┘"
    
    if curl -s -f -m 2 "$API_URL/health" > /dev/null 2>&1; then
        echo "  Status: ✅ RUNNING"
        RESPONSE_TIME=$(curl -w '%{time_total}' -o /dev/null -s "$API_URL/health" | awk '{printf "%.0f", $1*1000}')
        echo "  Response Time: ${RESPONSE_TIME}ms"
    else
        echo "  Status: ❌ DOWN"
    fi
    
    echo ""
    
    # Database Status
    echo "┌──────────────────────────────────────────────────────────────┐"
    echo "│ DATABASE STATUS                                              │"
    echo "└──────────────────────────────────────────────────────────────┘"
    
    if [ -n "$DATABASE_URL" ]; then
        if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
            USER_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"User\";")
            PETITION_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"Petition\";")
            echo "  Status: ✅ CONNECTED"
            echo "  Users: $USER_COUNT"
            echo "  Petitions: $PETITION_COUNT"
        else
            echo "  Status: ❌ CONNECTION FAILED"
        fi
    fi
    
    echo ""
    
    # Redis Status
    echo "┌──────────────────────────────────────────────────────────────┐"
    echo "│ REDIS STATUS                                                 │"
    echo "└──────────────────────────────────────────────────────────────┘"
    
    if [ -n "$REDIS_URL" ]; then
        if redis-cli -u "$REDIS_URL" ping > /dev/null 2>&1; then
            echo "  Status: ✅ CONNECTED"
        else
            echo "  Status: ❌ CONNECTION FAILED"
        fi
    fi
    
    echo ""
    echo "Press Ctrl+C to exit"
    
    sleep $REFRESH_INTERVAL
done
EOF

chmod +x scripts/monitoring-dashboard.sh
log_success "Monitoring dashboard created"

# Create alerts configuration
log_info "Step 5: Creating alerts configuration"

cat > monitoring/alerts/alerts-config.json << 'EOF'
{
  "alerts": [
    {
      "id": "api_down",
      "name": "API Down",
      "condition": "api_health == false",
      "severity": "critical",
      "notification": {
        "channels": ["email", "slack"],
        "email": "support@changeliberia.org",
        "slackWebhook": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
      },
      "retryAttempts": 3,
      "retryInterval": 30
    },
    {
      "id": "database_down",
      "name": "Database Connection Failed",
      "condition": "database_health == false",
      "severity": "critical",
      "notification": {
        "channels": ["email", "slack"],
        "email": "support@changeliberia.org"
      },
      "retryAttempts": 3,
      "retryInterval": 30
    },
    {
      "id": "redis_down",
      "name": "Redis Connection Failed",
      "condition": "redis_health == false",
      "severity": "high",
      "notification": {
        "channels": ["email", "slack"],
        "email": "support@changeliberia.org"
      },
      "retryAttempts": 3,
      "retryInterval": 30
    },
    {
      "id": "high_response_time",
      "name": "High API Response Time",
      "condition": "api_response_time > 3000",
      "severity": "medium",
      "notification": {
        "channels": ["email"],
        "email": "ops@changeliberia.org"
      },
      "threshold": 3000,
      "duration": 300
    },
    {
      "id": "high_error_rate",
      "name": "High Error Rate",
      "condition": "error_rate > 5",
      "severity": "high",
      "notification": {
        "channels": ["slack"],
        "slackWebhook": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
      },
      "threshold": 5,
      "duration": 600
    },
    {
      "id": "disk_space_low",
      "name": "Low Disk Space",
      "condition": "disk_usage > 80",
      "severity": "high",
      "notification": {
        "channels": ["email", "slack"],
        "email": "ops@changeliberia.org"
      },
      "threshold": 80
    }
  ]
}
EOF

log_success "Alerts configuration created"

# Create logging configuration
log_info "Step 6: Creating logging setup"

cat > monitoring/logs/logging-config.json << 'EOF'
{
  "logging": {
    "level": "info",
    "format": "json",
    "outputs": [
      {
        "type": "file",
        "path": "monitoring/logs/app.log",
        "maxSize": "100M",
        "maxDays": 30
      },
      {
        "type": "file",
        "path": "monitoring/logs/error.log",
        "level": "error",
        "maxSize": "50M",
        "maxDays": 30
      },
      {
        "type": "file",
        "path": "monitoring/logs/access.log",
        "format": "combined"
      }
    ],
    "logRotation": {
      "enabled": true,
      "interval": "daily",
      "retention": 30
    }
  }
}
EOF

log_success "Logging configuration created"

# Create performance monitoring
log_info "Step 7: Creating performance monitoring script"

cat > scripts/performance-monitor.sh << 'EOF'
#!/bin/bash

API_URL="${API_URL:-https://api.changeliberia.org}"
MONITOR_FILE="monitoring/logs/performance-metrics.log"

# Test API performance
echo "Testing API performance..."

for i in {1..10}; do
    RESPONSE_TIME=$(curl -w '%{time_total}' -o /dev/null -s "$API_URL/health" | awk '{printf "%.0f", $1*1000}')
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$TIMESTAMP] API Response Time: ${RESPONSE_TIME}ms" >> "$MONITOR_FILE"
    sleep 1
done

# Calculate average
AVG_RESPONSE=$(grep 'API Response Time' "$MONITOR_FILE" | tail -10 | awk -F': ' '{sum+=$2; count++} END {if(count>0) printf "%.0f", sum/count}')

echo "Average Response Time (last 10 samples): ${AVG_RESPONSE}ms"

# Database query performance
if [ -n "$DATABASE_URL" ]; then
    echo "Testing database performance..."
    START=$(date +%s%N)
    psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM \"User\";" > /dev/null
    END=$(date +%s%N)
    DB_TIME=$(( (END - START) / 1000000 ))
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Database Query Time: ${DB_TIME}ms" >> "$MONITOR_FILE"
fi
EOF

chmod +x scripts/performance-monitor.sh
log_success "Performance monitoring script created"

##############################################################################
# SETUP INSTRUCTIONS
##############################################################################

log_header "MONITORING SETUP COMPLETE"

echo -e "${GREEN}✅ All monitoring components have been created!${NC}\n"

echo -e "${BLUE}📊 AVAILABLE MONITORING COMMANDS:${NC}"
echo ""
echo "1. Run post-deployment verification:"
echo -e "   ${YELLOW}bash scripts/verify-production-deployment.sh${NC}"
echo ""
echo "2. Start health check monitoring:"
echo -e "   ${YELLOW}bash scripts/health-check.sh${NC}"
echo ""
echo "3. View monitoring dashboard (live updates):"
echo -e "   ${YELLOW}bash scripts/monitoring-dashboard.sh${NC}"
echo ""
echo "4. Monitor performance metrics:"
echo -e "   ${YELLOW}bash scripts/performance-monitor.sh${NC}"
echo ""

echo -e "${BLUE}📝 NEXT STEPS:${NC}"
echo ""
echo "1. Set up cron jobs for automated monitoring:"
echo "   # Health checks every 5 minutes"
echo "   */5 * * * * cd /Users/visionalventure/Change\\ Liberia && bash scripts/health-check.sh"
echo ""
echo "   # Performance monitoring every hour"
echo "   0 * * * * cd /Users/visionalventure/Change\\ Liberia && bash scripts/performance-monitor.sh"
echo ""
echo "2. Configure alerts in monitoring/alerts/alerts-config.json"
echo "   - Add your Slack webhook URL"
echo "   - Set alert email addresses"
echo "   - Adjust thresholds as needed"
echo ""
echo "3. Set up external monitoring services:"
echo "   - UptimeRobot: Monitor API endpoint"
echo "   - Datadog: Advanced metrics and logs"
echo "   - PagerDuty: Alert escalation"
echo ""
echo "4. Review monitoring files:"
echo "   - monitoring/logs/ - All log files"
echo "   - monitoring/alerts/ - Alert configurations"
echo "   - monitoring/dashboards/ - Dashboard configs"
echo ""

log_info "For detailed setup instructions, see MONITORING_SETUP.md"
