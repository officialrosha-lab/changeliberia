# Incident Response Runbook

## Purpose
Step-by-step procedures for responding to production incidents.

---

## Incident: Email Service Not Delivering (Most Common)

### Detection Indicators
- Email delivery rate drops below 90%
- Monitoring alert: "Email failure rate > 5%"
- Customer complaint: "Didn't receive email"
- Queue depth: > 100 pending emails

### Initial Response (0-5 minutes)

**Step 1: Acknowledge Incident**
```bash
# Document incident start time
date

# Notify team on Slack
# Message: "🚨 Email service degradation detected at [time]. Investigating..."

# Create incident ticket (if using Jira, GitHub Issues, etc)
```

**Step 2: Quick Health Check**
```bash
# API still responding?
curl -I https://api.changeliberia.org/health

# Redis still connected?
redis-cli -u $REDIS_URL ping
# Expected: PONG

# Database still connected?
psql $DATABASE_URL -c "SELECT NOW();"
```

**Step 3: Check Resend Status**
- Go to https://status.resend.com
- If showing outage → Document and wait for resolution
- If green → Continue with investigation

### Investigation Phase (5-15 minutes)

**Step 4: Check Recent Errors**
```bash
# Get last 20 failed emails and error messages
psql $DATABASE_URL -c "
  SELECT 
    \"recipientEmail\",
    \"errorMessage\",
    \"sentAt\",
    status
  FROM \"EmailLog\"
  WHERE status IN ('FAILED', 'BOUNCED')
  ORDER BY \"sentAt\" DESC
  LIMIT 20;"
```

**Step 5: Analyze Error Patterns**
```bash
# If you see "Invalid API Key":
# → Check RESEND_API_KEY in .env.production is correct
# → Restart API service

# If you see "Domain not verified":
# → Go to Resend dashboard and verify DNS records
# → Wait 5-30 minutes for DNS propagation

# If you see "Rate limit exceeded":
# → Reduce concurrency: EMAIL_PROCESSOR_CONCURRENCY=3
# → Restart API service

# If you see "Connection timeout":
# → Check Resend API status
# → Verify network connectivity from prod to Resend
```

**Step 6: Check API Logs**
```bash
# View last 100 lines of API logs
docker logs api --tail 100

# Search for email-related errors
docker logs api | grep -i "email\|resend\|error" | tail -50

# Enable verbose logging (if needed)
docker exec api kill -USR1 $(docker inspect -f '{{.State.Pid}}' api)
```

**Step 7: Check Redis Queue**
```bash
# Check queue depth
redis-cli -u $REDIS_URL \
  LLEN bull:email:wait

# Check failed jobs
redis-cli -u $REDIS_URL \
  LLEN bull:email:failed

# Check active jobs
redis-cli -u $REDIS_URL \
  LLEN bull:email:active

# View specific failed job
redis-cli -u $REDIS_URL \
  LRANGE bull:email:failed 0 -1
```

**Step 8: Check System Resources**
```bash
# CPU and memory usage
docker stats api web

# If CPU > 90% for > 5 min: 
# → Process overloaded, may need to reduce concurrency

# If memory > 500MB:
# → Possible memory leak, restart the service
```

### Common Issues & Immediate Fixes

#### Issue 1: "Invalid API Key"
```bash
# Verify API key format
echo $RESEND_API_KEY
# Should start with: re_

# Test with curl
curl -H "Authorization: Bearer $RESEND_API_KEY" \
  https://api.resend.com/emails

# If 401 Unauthorized: Update .env.production with correct key

# Restart API
docker restart api

# Verify fix
curl https://api.changeliberia.org/api/v1/email/queue-status \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Estimated Fix Time:** 5 minutes

#### Issue 2: "Domain Not Verified"
```bash
# Check Resend dashboard status
# Go to: https://resend.com/domains → changeliberia.org

# View required DNS records (SPF, DKIM, CNAME)
# Add to your domain provider:
# 1. SPF record
# 2. DKIM record  
# 3. CNAME record

# Verify DNS propagation
dig changeliberia.org TXT
dig dkim.resend._domainkey.changeliberia.org TXT

# Once propagated, click "Verify" in Resend dashboard
# Wait 2-5 minutes for verification
```

**Estimated Fix Time:** 10-30 minutes (includes DNS propagation)

#### Issue 3: "Rate Limit Exceeded"
```bash
# Reduce processing concurrency
# In .env.production:
EMAIL_PROCESSOR_CONCURRENCY=3  # Reduce from default 5

# Or set via environment
export EMAIL_PROCESSOR_CONCURRENCY=3

# Restart API
docker restart api

# Monitor queue depth
watch -n 5 "redis-cli -u $REDIS_URL LLEN bull:email:wait"

# Should gradually decrease
```

**Estimated Fix Time:** 10 minutes

#### Issue 4: "Redis Connection Timeout"
```bash
# Verify Redis is running
redis-cli -u $REDIS_URL ping

# If no response:
# Check REDIS_URL format
echo $REDIS_URL
# Should be: redis://default:password@host:port

# Verify network connectivity
ping $(echo $REDIS_URL | cut -d'@' -f2 | cut -d':' -f1)

# If unreachable: Redis service may be down
# Restart Redis
docker restart redis

# Verify fix
redis-cli -u $REDIS_URL ping
# Expected: PONG
```

**Estimated Fix Time:** 5-10 minutes

#### Issue 5: "Queue Stuck with Pending Jobs"
```bash
# Check how many jobs are stuck
redis-cli -u $REDIS_URL LLEN bull:email:wait

# Option A: Restart email processor (recommended)
docker restart api

# Option B: Manual queue reset (⚠️ WARNING: Deletes all pending jobs)
# Only use if restart doesn't work
redis-cli -u $REDIS_URL FLUSHDB

# Re-send failed emails
curl -X POST https://api.changeliberia.org/api/v1/admin/email/retry-failed \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Verify recovery
redis-cli -u $REDIS_URL LLEN bull:email:wait
# Should be back to 0
```

**Estimated Fix Time:** 5-15 minutes

### Escalation Procedures

**If issue NOT resolved after 15 minutes:**

**Escalation Level 1 (15 min):**
- [ ] Page on-call engineer via PagerDuty
- [ ] Post incident #incident channel on Slack
- [ ] Include: Issue description, steps tried, current status

**Escalation Level 2 (30 min):**
- [ ] Escalate to Tech Lead
- [ ] Consider fallback: Disable email temporarily, resume later
- [ ] May need to rollback recent changes

**Escalation Level 3 (60 min):**
- [ ] Escalate to CTO
- [ ] Declare full production incident
- [ ] Consider communicating to users about service delay

### Verification Steps (Before Declaring Resolution)

```bash
# 1. Email delivery rate is > 95%
psql $DATABASE_URL -c "
  SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END) as delivered,
    ROUND(100.0 * SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END) / COUNT(*), 2) as rate
  FROM \"EmailLog\"
  WHERE \"sentAt\" > NOW() - INTERVAL '15 minutes';"
# Expected: rate >= 95

# 2. Queue is processing normally
redis-cli -u $REDIS_URL LLEN bull:email:wait
# Expected: < 20

# 3. Failed jobs are minimal
redis-cli -u $REDIS_URL LLEN bull:email:failed  
# Expected: < 5

# 4. Test send a test email
curl -X POST https://api.changeliberia.org/api/v1/email/test-send \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientEmail": "ops@changeliberia.org",
    "emailType": "WELCOME",
    "props": {"fullName": "OPS Test"}
  }'

# Wait 30 seconds
sleep 30

# Verify email arrived
psql $DATABASE_URL -c "
  SELECT status FROM \"EmailLog\" 
  WHERE \"recipientEmail\" = 'ops@changeliberia.org'
  ORDER BY \"sentAt\" DESC
  LIMIT 1;"
# Expected: status = 'DELIVERED'
```

### Post-Incident (Within 1 hour after resolution)

**Step 1: Declare Resolution**
```
Post to #incident channel:
"🟢 Email service fully recovered at [time]
- Issue: [brief description]
- Root cause: [what caused it]
- Duration: [XX minutes]
- Affected emails: [count]
- Resolution: [what was done]"
```

**Step 2: Document Root Cause**
- What caused the incident?
- Why wasn't this caught by monitoring?
- What can we do to prevent recurrence?

**Step 3: Schedule Post-Mortem**
- Schedule 24 hours after incident
- Include: on-call engineer, tech lead, team lead
- Duration: 30 minutes
- Output: Action items to prevent recurrence

**Step 4: Create Action Items**
- Add monitoring if gap detected
- Fix root cause
- Update runbooks if procedures were unclear
- Share learnings with team

---

## Incident: API Service Down

### Quick Diagnosis
```bash
# 1. Check if container is running
docker ps | grep api

# 2. Check logs
docker logs api | tail -50

# 3. Check health endpoint
curl https://api.changeliberia.org/health

# 4. Check resources
docker stats api
```

### Quick Recovery
```bash
# Restart API service
docker restart api

# Wait 10 seconds
sleep 10

# Verify it's back online
curl https://api.changeliberia.org/health

# Should respond with: {"status":"ok"}
```

---

## Incident: Database Connection Issues

### Diagnosis
```bash
# Can you connect to database?
psql $DATABASE_URL -c "SELECT NOW();"

# How many active connections?
psql $DATABASE_URL -c "
  SELECT 
    usename, 
    application_name,
    state,
    COUNT(*) as connections
  FROM pg_stat_activity
  GROUP BY usename, application_name, state;"

# If > 100: Connection pool exhausted
```

### Recovery
```bash
# Option 1: Kill idle connections
psql $DATABASE_URL -c "
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE state = 'idle'
  AND state_change < NOW() - INTERVAL '5 minutes';"

# Option 2: Restart connection pool (if using PgBouncer)
systemctl restart pgbouncer

# Option 3: Restart API (recycles connections)
docker restart api
```

---

## Incident: Out of Disk Space

### Diagnosis
```bash
df -h
du -sh /*  # Find large directories
```

### Recovery
```bash
# Delete old backups (> 60 days)
find /backups -mtime +60 -delete

# Compress old logs
find /var/log -name "*.log.1" -exec gzip {} \;

# Delete old Docker logs
docker system prune -a --volumes

# If still critical: Ask DevOps about expanding volume
```

---

## Contact Information

**On-Call Engineer:** PagerDuty  
**Slack Channel:** #incident  
**Email:** ops@changeliberia.org  

---

**Last Updated:** May 27, 2026
**Version:** 1.0
