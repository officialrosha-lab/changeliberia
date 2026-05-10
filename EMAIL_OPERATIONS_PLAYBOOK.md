# Email System Operations Playbook

## Quick Reference

**Admin Dashboard**: `/admin` → **Email** tab

**Key Metrics**:
- Delivery Rate: Target > 95%
- Bounce Rate: Target < 2%
- Open Rate: Typical 20-35%
- Queue Depth: Target < 100

**Emergency Contacts**:
- On-Call: [phone/email]
- Escalation: [manager phone/email]

---

## Common Scenarios & Solutions

### Scenario 1: "Emails Suddenly Stopped Sending"

**Symptoms**:
- Admin dashboard shows Queue Status queued count increasing
- Completed count hasn't changed in 5 minutes
- Email logs show status QUEUED

**Diagnosis** (5 minutes):
```bash
# Check API logs
tail -f apps/api/logs/error.log | grep -i "email\|error"

# Check Redis
redis-cli LLEN email-queue:queue
# If > 1000: queue is backed up

# Check Resend API
curl -H "Authorization: Bearer $RESEND_API_KEY" \
  https://api.resend.com/audiences
# If 401/403: API key issue

# Check database
psql $DATABASE_URL
SELECT COUNT(*) FROM "EmailLog" WHERE status = 'PROCESSING';
# If > 0: processor stuck
```

**Resolution** (10 minutes):

**If Resend API key invalid**:
```bash
# 1. Verify API key in Resend dashboard
#    https://resend.com/api-keys

# 2. Update environment variable
export RESEND_API_KEY=re_xxxxx
# or update in deployment config

# 3. Restart API server
docker restart <api-container>

# 4. Verify health
curl $API_URL/api/v1/admin/email/health
```

**If Redis disconnected**:
```bash
# 1. Check Redis status
redis-cli ping
# If no response: Redis down

# 2. Restart Redis
docker restart redis
# or systemctl restart redis

# 3. Verify connection
redis-cli -u $REDIS_URL ping

# 4. Check queue integrity
redis-cli LLEN email-queue:queue
```

**If BullMQ processor hung**:
```bash
# 1. Check processor status
docker logs <api-container> | grep "emailprocessor\|processor"

# 2. Increase worker concurrency
# Edit email.processor.ts: @Processor('email-queue', { concurrency: 10 })

# 3. Restart API
docker restart <api-container>

# 4. Monitor queue decrease
watch -n 5 'redis-cli LLEN email-queue:queue'
```

---

### Scenario 2: "High Bounce Rate (> 5%)"

**Symptoms**:
- Admin dashboard Analytics tab shows high bounce count
- Users reporting emails in spam
- Resend dashboard shows bounce events

**Diagnosis** (10 minutes):
```bash
# Check bounce pattern
SELECT type, COUNT(*) as bounces 
FROM "EmailLog" 
WHERE status = 'BOUNCED' 
AND createdAt > NOW() - INTERVAL 24 hours
GROUP BY type;

# Check specific bounces
SELECT recipient, bounceType, bounceReason 
FROM "EmailLog" 
WHERE status = 'BOUNCED' 
ORDER BY createdAt DESC 
LIMIT 20;

# Check domain reputation
# https://resend.com/domains → Check domain status
```

**Resolution** (varies):

**If domain issue**:
```bash
# 1. Check domain verification
curl -X POST $API_URL/api/v1/admin/email/verify-domain \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"domain": "changeliberia.org"}'

# 2. If DKIM/SPF not verified:
#    Add DNS records from Resend dashboard
#    Wait 24-48 hours for propagation

# 3. Check Resend domain status
#    https://resend.com/domains
```

**If email list quality issue**:
```bash
# 1. Identify bad email patterns
SELECT recipient, bounceType, COUNT(*) 
FROM "EmailLog" 
WHERE status = 'BOUNCED' 
GROUP BY recipient, bounceType 
HAVING COUNT(*) > 3
ORDER BY COUNT(*) DESC;

# 2. Review bounce types
#    Permanent: Invalid email (remove from list)
#    Temporary: Server down (retry later)
#    Complaint: Marked as spam (unsubscribe)

# 3. Implement email validation
#    Add email validation to signup form
#    Use service like ZeroBounce for list cleaning

# 4. Monitor going forward
#    Set alert if bounce rate > 2% in 24h
```

**If reputation issue**:
```bash
# 1. Check email sending rate
#    Admin → Email → Analytics
#    If sending > 1000/hour: may trigger blocks

# 2. Reduce sending rate temporarily
#    Spread sends over 24 hours

# 3. Warm up domain
#    Start with small volume
#    Gradually increase over 1-2 weeks

# 4. Request review from ISPs
#    https://postmaster.google.com (Gmail)
#    https://sendersupport.olc.protection.outlook.com (Outlook)
```

---

### Scenario 3: "Queue Backing Up (> 500 jobs)"

**Symptoms**:
- Admin dashboard Queue Status shows high Queued count
- New emails slow to process
- Completed count not increasing

**Diagnosis** (5 minutes):
```bash
# Check queue depth
redis-cli -u $REDIS_URL LLEN email-queue:queue

# Check processor health
docker logs <api-container> | tail -50

# Check Resend rate limits
# Resend allows 100 requests/second
# If sending 1000+ emails: may hit rate limit

# Check failed jobs
SELECT COUNT(*) FROM "EmailLog" WHERE status = 'FAILED' AND createdAt > NOW() - INTERVAL 1 hour;
```

**Resolution** (15 minutes):

**If Resend rate limiting**:
```bash
# 1. Check Resend rate
#    (total queued + active) / 60 seconds
#    If > 100: reduce rate

# 2. Adjust BullMQ worker settings
#    apps/api/src/email/email.processor.ts
#    @Processor('email-queue', {
#      concurrency: 5  // Reduce from 10
#    })

# 3. Restart API
docker restart <api-container>

# 4. Monitor queue drain
watch -n 2 'redis-cli LLEN email-queue:queue'
```

**If Redis memory full**:
```bash
# 1. Check Redis memory
redis-cli INFO memory | grep used_memory_human

# 2. If > 90% of max:
#    a) Clear old jobs
#       redis-cli KEYS "email-queue:*" | wc -l
#    b) Increase Redis memory
#       redis-cli CONFIG SET maxmemory 4gb
#    c) Or clean up old logs
#       DELETE FROM "EmailLog" WHERE createdAt < NOW() - INTERVAL 30 days AND status = 'DELIVERED'

# 3. Restart Redis
docker restart redis
```

**If processor errors**:
```bash
# 1. Check error details
grep "error\|Error\|ERROR" apps/api/logs/error.log | tail -20

# 2. If processor hung:
#    a) Check stuck jobs
#       SELECT COUNT(*) FROM "EmailLog" WHERE status = 'PROCESSING' AND createdAt < NOW() - INTERVAL 5 minutes;
#    b) Reset stuck jobs
#       UPDATE "EmailLog" SET status = 'FAILED' WHERE status = 'PROCESSING' AND createdAt < NOW() - INTERVAL 5 minutes;

# 3. Restart API
docker restart <api-container>
```

---

### Scenario 4: "Delivery Rate Below 95%"

**Symptoms**:
- Analytics shows delivery rate < 95%
- Some emails marked as FAILED
- Users not receiving emails

**Diagnosis** (15 minutes):
```bash
# Calculate delivery rate
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END) as delivered,
  ROUND(SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as rate
FROM "EmailLog"
WHERE createdAt > NOW() - INTERVAL 24 hours;

# Check failure reasons
SELECT failureReason, COUNT(*) as count
FROM "EmailLog"
WHERE status = 'FAILED'
AND createdAt > NOW() - INTERVAL 24 hours
GROUP BY failureReason
ORDER BY count DESC;

# Check if retries working
SELECT retryCount, COUNT(*) as count
FROM "EmailLog"
WHERE createdAt > NOW() - INTERVAL 24 hours
GROUP BY retryCount
ORDER BY retryCount;
```

**Resolution**:

**If rate limiting from Resend**:
```bash
# See: "Queue Backing Up" scenario above
# Reduce sending rate, increase retry delay
```

**If invalid emails**:
```bash
# Implement email validation
# Review failed recipient list
SELECT recipient FROM "EmailLog" 
WHERE status = 'FAILED' 
AND failureReason LIKE '%invalid%'
LIMIT 20;

# Remove invalid emails from list
```

**If domain not verified**:
```bash
# Check domain status
curl -X POST $API_URL/api/v1/admin/email/verify-domain \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"domain": "changeliberia.org"}'

# If not verified: add DNS records (see Domain Issue resolution)
```

---

### Scenario 5: "Admin Dashboard Not Loading"

**Symptoms**:
- Admin panel loads but Email tab empty/broken
- Configuration tab shows errors
- Queue Status doesn't update

**Diagnosis** (5 minutes):
```bash
# Check if API responding
curl -f $API_URL/api/v1/admin/email/health
# If fails: API issue

# Check admin permissions
# User should have EMAIL:READ permission

# Check browser console
# Open /admin in browser
# Press F12 → Console tab
# Look for errors
```

**Resolution**:

**If API not responding**:
```bash
# 1. Check API status
curl -f $API_URL/health

# 2. Check API logs
docker logs <api-container> | tail -50

# 3. Restart API
docker restart <api-container>

# 4. Verify connection
curl -f $API_URL/api/v1/admin/email/health
```

**If permission denied**:
```bash
# 1. Check user permissions
SELECT u.email, r.name, p.resource, p.action
FROM users u
JOIN roles r ON u.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE u.email = 'admin@example.com'
AND p.resource = 'EMAIL';

# 2. If missing EMAIL permission:
#    a) Add permission
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'ADMIN' AND p.resource = 'EMAIL' AND p.action = 'READ';

#    b) User must logout/login to get new token
```

**If CORS error**:
```bash
# Check API CORS config
# apps/api/src/main.ts should have:
app.enableCors({
  origin: ['http://localhost:3000', 'https://changeliberia.org'],
  credentials: true
});

# Update if needed and restart API
```

---

### Scenario 6: "Tracking Not Working (Opens/Clicks Not Recorded)"

**Symptoms**:
- Open rate stays 0%
- Click rate stays 0%
- Tracking pixel hits API but no EmailLog update

**Diagnosis** (5 minutes):
```bash
# Check if tracking pixel URL in email
# View email source in recipient inbox
# Look for: <img src="...track/open/...">

# Check if pixel endpoint working
curl -v "http://localhost:4000/api/v1/email/track/open/test-id/test-pixel" 
# Should return 1x1 GIF (Content-Type: image/gif)

# Check if click link in email
# Look for: href="...track/click/..."

# Check tracking data in database
SELECT openedAt, clickedAt FROM "EmailLog" WHERE id = '...';
# Should be NULL if not tracked yet
```

**Resolution**:

**If tracking pixel not in email**:
```bash
# 1. Check template includes pixel
#    apps/api/src/email/templates/welcome.tsx
#    Should have: <EmailTrackingPixel emailLogId={emailLogId} />

# 2. Check pixel ID being passed
#    EmailService.sendTransactional should inject:
#    trackingPixelId: generateTrackingPixelId()

# 3. Verify in EmailLog
SELECT trackingPixelId FROM "EmailLog" WHERE id = '...'
# Should NOT be NULL

# 4. If NULL: update template and resend
```

**If tracking endpoint not working**:
```bash
# 1. Check endpoint exists
curl -v "$API_URL/api/v1/email/track/open/test/test"
# Should return 200 (not 404/500)

# 2. Check database update
#    Add logging to EmailTrackingService.recordOpen()
#    Verify it's being called

# 3. Check email log permission
#    SELECT * FROM permissions WHERE resource = 'EMAIL' AND action = 'UPDATE';
#    May need to add permission for unauthenticated tracking

# 4. Restart API if permissions changed
docker restart <api-container>
```

**If Resend webhook tracking disabled**:
```bash
# Resend can send open/click events if configured
# To enable:
# 1. Go to: https://resend.com/emails
# 2. Find email → Click settings
# 3. Enable: "Track opens"
# 4. Enable: "Track clicks"

# Note: Resend email link wrapping may interfere
# Use our custom tracking as primary method
```

---

### Scenario 7: "Webhook Events Not Received"

**Symptoms**:
- Emails show SENT but never DELIVERED
- Bounce events not being recorded
- Admin sees "0 delivered"

**Diagnosis** (10 minutes):
```bash
# Check webhook URL is registered
# https://resend.com/webhooks
# Should show endpoint: https://changeliberia.org/api/v1/webhooks/resend

# Test webhook manually
# https://resend.com/webhooks → Click endpoint → "Send test event"

# Check API logs for webhook receipt
docker logs <api-container> | grep -i webhook

# Check Resend webhook delivery status
# https://resend.com/webhooks → Click endpoint → "Delivery attempts"
# Should show successful attempts (200 status)

# Verify EmailLog updates
SELECT status, COUNT(*) FROM "EmailLog" WHERE createdAt > NOW() - INTERVAL 1 hour GROUP BY status;
# Should see DELIVERED entries if webhooks working
```

**Resolution**:

**If webhook URL incorrect**:
```bash
# 1. Check endpoint URL is accessible
curl -X POST https://changeliberia.org/api/v1/webhooks/resend \
  -H "Content-Type: application/json" \
  -d '{}' 
# Should not be 404/502

# 2. Update webhook in Resend
#    https://resend.com/webhooks
#    Change endpoint to correct URL

# 3. Test again
#    Click "Send test event"
#    Check API logs: should see webhook received
```

**If webhook secret mismatch**:
```bash
# 1. Get current webhook secret
#    https://resend.com/webhooks → Click endpoint → Show secret
#    Format: whsec_xxxxx

# 2. Update environment variable
export RESEND_WEBHOOK_SECRET=whsec_xxxxx
# or update in deployment config

# 3. Restart API
docker restart <api-container>

# 4. Test webhook again
#    Should see "Signature verified" in logs
```

**If webhook signature verification failing**:
```bash
# Check verification code
# apps/api/src/email/webhooks/resend-webhook.controller.ts
# verifySignature() method

# Ensure:
# 1. svix-id, svix-timestamp, svix-signature headers present
# 2. Secret matches RESEND_WEBHOOK_SECRET
# 3. Body not modified after signing
# 4. Timestamp validation (5 min window)

# Enable detailed logging
# Add: console.log('Webhook signature:', signature, 'Computed:', computed);

# Restart API and test again
```

**If webhook not being called**:
```bash
# 1. Check Resend dashboard logs
#    https://resend.com/webhooks → Delivery attempts
#    If status != 200: API returning error

# 2. Check API health
curl -f $API_URL/health
# Should return 200

# 3. Check firewall allows webhook traffic
#    Should allow POST from resend.com IPs

# 4. Check API server logs
docker logs <api-container> | tail -100
# Look for any startup errors

# 5. Restart API
docker restart <api-container>

# 6. Test webhook again
```

---

### Scenario 8: "User Not Receiving Transactional Emails"

**Symptoms**:
- User didn't receive password reset email
- Signup welcome email missing
- User says they're not in any email preference settings

**Diagnosis** (5 minutes):
```bash
# Check if email was queued
SELECT * FROM "EmailLog" 
WHERE recipient = 'user@example.com' 
AND createdAt > NOW() - INTERVAL 1 hour
ORDER BY createdAt DESC;

# Check preference settings
SELECT * FROM "NotificationPreference"
WHERE user_id = '...'
LIMIT 1;

# Check Resend dashboard
# https://resend.com/emails
# Filter by recipient address
# Should show email and status
```

**Resolution**:

**If email not in EmailLog**:
```bash
# 1. Check if event was triggered
#    For WELCOME: should trigger on user.created

# 2. Verify event listener is active
#    Check EmailEventService
#    Should have @OnEvent('user.created')

# 3. Check API logs for event emission
docker logs <api-container> | grep "user.created"

# 4. If event not emitted:
#    Emit manually for testing:
this.eventEmitter.emit('user.created', {
  userId: 'test-id',
  email: 'user@example.com',
  fullName: 'Test User'
});

# 5. Verify email queued
SELECT * FROM "EmailLog" WHERE recipient = 'user@example.com' LIMIT 1;
```

**If email in EmailLog but status FAILED**:
```bash
# 1. Check failure reason
SELECT failureReason FROM "EmailLog" 
WHERE recipient = 'user@example.com'
LIMIT 1;

# 2. Common failures:
#    - "Invalid email": Check email format
#    - "Rate limit": Wait or reduce volume
#    - "API error": Check Resend API key

# 3. Check if retry ran
SELECT retryCount FROM "EmailLog"
WHERE recipient = 'user@example.com';
# Should be > 0 if retry mechanism worked

# 4. Resend manually
#    Create new email entry
#    Or emit event again for different user
```

**If email in EmailLog but not received**:
```bash
# 1. Check delivery status
SELECT status FROM "EmailLog"
WHERE recipient = 'user@example.com'
LIMIT 1;
# If BOUNCED: email invalid
# If SENT but not DELIVERED: webhook may have failed (see Scenario 7)

# 2. Check spam folder
#    User should check spam/junk folder

# 3. Check domain reputation
#    May need to warm up domain (see Scenario 2)

# 4. Ask user to whitelist sender
#    Email from: $MAIL_FROM (noreply@changeliberia.org)
```

---

## Maintenance Tasks

### Daily (5 minutes)
```bash
# Check dashboard metrics once
# Visit: /admin → Email → Configuration tab
# Verify: ✓ API Key ✓ Redis ✓ Database

# Monitor queue depth
redis-cli LLEN email-queue:queue
# Should be < 100
```

### Weekly (30 minutes)
```bash
# Review email analytics
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END) as delivered,
  ROUND(SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as delivery_rate,
  SUM(CASE WHEN bounceType = 'Permanent' THEN 1 ELSE 0 END) as permanent_bounces,
  SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed
FROM "EmailLog"
WHERE createdAt > NOW() - INTERVAL 7 days;

# Check scheduled tasks ran
SELECT * FROM "EmailLog" 
WHERE type = 'WEEKLY_DIGEST'
AND createdAt > NOW() - INTERVAL 7 days;
# Should show at least 1 digest from Sunday

# Review error logs
grep -i "error\|warn" apps/api/logs/error.log | tail -20
```

### Monthly (1 hour)
```bash
# Cleanup old records
DELETE FROM "EmailLog"
WHERE createdAt < NOW() - INTERVAL 90 days
AND status IN ('FAILED', 'BOUNCED');
# Expected: 100-1000 rows

# Archive completed jobs
redis-cli DEL email-queue:completed  # Clears > 30 days old

# Review metrics trends
# Compare delivery rate, bounce rate, open rate vs last month

# Update runbooks if needed
# Test disaster recovery procedures
```

---

## Escalation Matrix

| Issue | Severity | Response Time | Action |
|-------|----------|---|---|
| No emails sending | Critical | 15 min | Call on-call |
| Delivery rate < 90% | High | 1 hour | Check Resend, increase logging |
| Queue backup > 1000 | High | 1 hour | Reduce rate, scale workers |
| Webhooks not received | Medium | 4 hours | Check endpoint, verify secret |
| Bounce rate > 5% | Medium | 4 hours | Review email list, domain status |
| Tracking not working | Low | 24 hours | Check template, verify pixel |
| High memory usage | Medium | 4 hours | Clean Redis, increase memory |
| API slow (> 500ms) | Medium | 4 hours | Check logs, optimize queries |

---

## Contact Information

- **On-Call Engineer**: [name/phone/email]
- **Engineering Manager**: [name/phone/email]  
- **Resend Support**: support@resend.com
- **Status Page**: https://status.changeliberia.org

---

**Last Updated**: May 10, 2026
**Next Review**: June 10, 2026
