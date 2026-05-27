# Daily Operations Runbook

## Purpose
Procedures for day-to-day operations monitoring and maintenance of Change Liberia production system.

---

## Morning Checklist (8 AM)

Run these checks every morning to verify the system is healthy:

### 1. API Health Check
```bash
curl -I https://api.changeliberia.org/health
```
**Expected Response:** HTTP/2 200 OK with JSON response
**If Failed:** Check `docker logs api` or restart service

### 2. Web Application Status
```bash
curl -I https://changeliberia.org/
```
**Expected Response:** HTTP/2 200 OK
**If Failed:** Check `docker logs web` or restart service

### 3. Database Connectivity
```bash
psql $DATABASE_URL -c "SELECT COUNT(*) as user_count FROM \"User\";"
```
**Expected Response:** user_count > 0
**If Failed:** Verify DATABASE_URL and network connectivity

### 4. Redis Status
```bash
redis-cli -u $REDIS_URL ping
```
**Expected Response:** PONG
**If Failed:** Verify REDIS_URL and check Redis service status

### 5. Email Queue Status
```bash
curl https://api.changeliberia.org/api/v1/email/queue-status \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```
**Expected Response:**
```json
{
  "queue": {
    "waiting": 0-50,
    "active": 0-5,
    "completed": 1000+,
    "failed": 0-5
  }
}
```
**If waiting > 100:** Possible processing bottleneck
**If failed > 10:** May need to investigate failures

### 6. Email Delivery Rate (Last Hour)
```bash
psql $DATABASE_URL -c "
  SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END) as delivered,
    SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed,
    ROUND(100.0 * SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END) / COUNT(*), 2) as delivery_rate
  FROM \"EmailLog\"
  WHERE \"sentAt\" > NOW() - INTERVAL '1 hour';"
```
**Expected:** delivery_rate >= 95%
**If lower:** Investigate failed emails and contact ops

### 7. Active Admin Sessions
```bash
curl https://api.changeliberia.org/api/v1/admin/sessions \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```
**Expected:** 1-3 active admin sessions
**If 0:** No admins logged in (may need to login)

---

## Hourly Monitoring

### Email Delivery Metrics
Run hourly (or use automated monitoring):
```bash
# Run automated monitoring
bash scripts/monitor-email.sh
```

This script checks:
- ✓ Database connection
- ✓ Redis connection
- ✓ Delivery rate
- ✓ Queue depth
- ✓ API health
- ✓ Failed jobs

---

## End-of-Day Checklist (5 PM)

### 1. Daily Email Summary Report
```bash
psql $DATABASE_URL -c "
  SELECT 
    DATE(\"sentAt\") as date,
    COUNT(*) as total_sent,
    SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END) as delivered,
    SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed,
    SUM(CASE WHEN status = 'BOUNCED' THEN 1 ELSE 0 END) as bounced,
    ROUND(100.0 * SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END) / COUNT(*), 2) as delivery_rate,
    ROUND(AVG(EXTRACT(EPOCH FROM (\"processedAt\" - \"sentAt\"))), 2) as avg_latency_sec
  FROM \"EmailLog\"
  WHERE DATE(\"sentAt\") = TODAY
  GROUP BY DATE(\"sentAt\");"
```

### 2. Active Petition Count
```bash
psql $DATABASE_URL -c "
  SELECT 
    status,
    COUNT(*) as count
  FROM \"Petition\"
  WHERE status = 'APPROVED'
  GROUP BY status;"
```

### 3. New User Signups (Today)
```bash
psql $DATABASE_URL -c "
  SELECT COUNT(*) as new_users
  FROM \"User\"
  WHERE DATE(\"createdAt\") = TODAY;"
```

### 4. Errors & Warnings Log
```bash
# Check for any errors in API logs
docker logs api --since 1h | grep -i "error\|warn" | tail -20
```

### 5. Alert Review
```bash
# Check monitoring alert log
tail -50 /var/log/changeliberia-email-monitor.log | grep "ALERT\|WARNING\|CRITICAL"
```

### 6. Database Backup Verification
```bash
# Verify automated backup completed
ls -lah /backups/changeliberia/ | head -5
```

### 7. Generate Daily Report
```bash
bash scripts/generate-daily-report.sh
```

---

## Weekly Tasks (Every Monday)

### 1. Database Maintenance
```bash
# Analyze tables for query optimization
psql $DATABASE_URL -c "ANALYZE;"

# Vacuum to clean up dead rows
psql $DATABASE_URL -c "VACUUM;"
```

### 2. Review All Failed Emails
```bash
psql $DATABASE_URL -c "
  SELECT 
    \"recipientEmail\",
    COUNT(*) as failure_count,
    array_agg(DISTINCT \"errorMessage\") as error_types,
    MAX(\"sentAt\") as last_failure
  FROM \"EmailLog\"
  WHERE status = 'FAILED'
  AND \"sentAt\" > NOW() - INTERVAL '7 days'
  GROUP BY \"recipientEmail\"
  ORDER BY failure_count DESC
  LIMIT 20;"
```

### 3. Review Failed Payment Transactions
```bash
curl https://api.changeliberia.org/api/v1/admin/stripe/payments?days=7 \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.[] | select(.status=="FAILED")'
```

### 4. Disk Space Check
```bash
df -h
# Expected: All filesystems > 20% free

du -sh /backups/changeliberia
# Expected: Growing by ~500MB per day
```

### 5. Review Admin Activity Log
```bash
psql $DATABASE_URL -c "
  SELECT 
    action,
    COUNT(*) as count,
    STRING_AGG(DISTINCT \"entityType\", ', ') as entity_types
  FROM \"AuditLog\"
  WHERE \"createdAt\" > NOW() - INTERVAL '7 days'
  GROUP BY action
  ORDER BY count DESC;"
```

---

## Monthly Tasks (1st of Month)

### 1. Generate Monthly Report
```bash
# Email stats, top petitions, user growth
bash scripts/generate-monthly-report.sh
```

### 2. Review and Rotate Logs
```bash
# Archive and compress old logs
gzip /var/log/changeliberia-*.log.1
mv /var/log/changeliberia-*.log.1.gz /var/log/archive/
```

### 3. Security Audit
- [ ] Review admin access logs
- [ ] Check for any unauthorized API requests
- [ ] Verify SSL certificates are valid

### 4. Performance Review
- [ ] Analyze query performance reports
- [ ] Check API response times
- [ ] Review database index effectiveness

### 5. Capacity Planning
```bash
# Calculate growth rate
psql $DATABASE_URL -c "
  SELECT 
    'Users' as metric,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE \"createdAt\" > NOW() - INTERVAL '1 month') as new_this_month
  FROM \"User\"
  UNION ALL
  SELECT 
    'Petitions',
    COUNT(*),
    COUNT(*) FILTER (WHERE \"createdAt\" > NOW() - INTERVAL '1 month')
  FROM \"Petition\"
  UNION ALL
  SELECT 
    'Signatures',
    COUNT(*),
    COUNT(*) FILTER (WHERE \"createdAt\" > NOW() - INTERVAL '1 month')
  FROM \"Signature\";"
```

---

## Emergency Procedures

### Service is Down
1. Check status page: https://status.resend.com
2. Verify database is accessible
3. Verify Redis is accessible
4. Restart API service: `docker restart api`
5. Restart Web service: `docker restart web`
6. If still down, check `/var/log/changeliberia-*.log`

### High CPU Usage
```bash
docker top api  # See top processes
docker stats    # See resource usage
```
- If sustained > 80% for > 5 min: Scale up resources or restart

### Disk Space Critical
```bash
df -h
du -sh /backups /var/log /home
```
- Delete old backups: `find /backups -mtime +60 -delete`
- Compress logs: `gzip /var/log/changeliberia-*.log.1`

### Database Connection Timeouts
```bash
# Check active connections
psql $DATABASE_URL -c "
  SELECT count(*) FROM pg_stat_activity;"

# If > 100: Database may be overloaded
# If < 10: Connection pool may be misconfigured
```

---

## Useful Commands Reference

```bash
# View real-time API logs
docker logs -f api

# View real-time Web logs
docker logs -f web

# Stop all services
docker-compose down

# Start all services
docker-compose up -d

# Check service health
docker-compose ps

# Execute command in container
docker-compose exec api npx prisma db execute

# SSH to production server
ssh user@prod-server.com

# Check system resources
top
free -h
df -h

# Restart email monitoring
systemctl restart changeliberia-email-monitor.timer

# View email monitor logs
tail -f /var/log/changeliberia-email-monitor.log
```

---

**Last Updated:** May 27, 2026
**Version:** 1.0
