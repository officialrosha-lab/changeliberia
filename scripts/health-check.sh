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
