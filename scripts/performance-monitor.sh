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
