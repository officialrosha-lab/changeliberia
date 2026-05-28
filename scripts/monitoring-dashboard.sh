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
