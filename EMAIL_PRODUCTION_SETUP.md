# Email System Production Setup & Testing Guide

## 🔐 Step 1: Environment Configuration

### API Server Setup (apps/api/.env.local or deployment config)

```bash
# Email Configuration
RESEND_API_KEY=re_V39tR44W_PmhRUhmg9k79ZrUpCe6F7AKx
MAIL_FROM=noreply@changeliberia.org
MAIL_REPLY_TO=support@changeliberia.org
RESEND_WEBHOOK_SECRET=whsec_test_xxxxx  # Get from Resend webhook setup

# Redis Configuration
REDIS_URL=redis://localhost:6379  # Production: redis://redis-prod:6379

# Email Tracking Configuration
TRACKING_DOMAIN=track.changeliberia.org
NEXT_PUBLIC_APP_URL=https://changeliberia.org  # Production domain

# Database (existing, ensure it's set)
DATABASE_URL=postgresql://...
```

### Web Server Setup (apps/web/.env.local)

```bash
# Web-side configuration
NEXT_PUBLIC_APP_URL=https://changeliberia.org
NEXT_PUBLIC_API_URL=https://api.changeliberia.org  # If using subdomain

# Email tracking domain for pixel injection
NEXT_PUBLIC_EMAIL_TRACKING_DOMAIN=https://track.changeliberia.org
```

### Resend Setup Checklist

```bash
✅ Create Resend account: https://resend.com
✅ Get API Key: Copy from https://resend.com/api-keys
✅ Add Domain: https://resend.com/domains
   - Input: changeliberia.org
   - Verify DNS records (DKIM, SPF, DMARC)
   - Wait for "Verified" status

✅ Create Webhook Endpoint: https://resend.com/webhooks
   - URL: https://changeliberia.org/api/v1/webhooks/resend
   - Events: email.delivered, email.bounced, email.complained, email.opened, email.clicked
   - Copy webhook secret (whsec_...)

✅ Set EMAIL_PERMISSION for admin role in database
   INSERT INTO roles_permissions (role_id, permission_id)
   SELECT r.id, p.id FROM roles r, permissions p
   WHERE r.name = 'ADMIN' AND p.resource = 'EMAIL' AND p.action = 'READ';
```

---

## 🧪 Step 2: Email System Testing

### Test 1: Database Setup Verification

```bash
cd apps/api

# Run migrations
npx prisma migrate dev

# Check schema
npx prisma studio
# Look for:
# ✓ EmailLog table with 17 fields
# ✓ NotificationPreference with email fields
# ✓ PermissionResource includes EMAIL
# ✓ User.emailLogs relation

# Query existing tables
npx prisma db execute
# SELECT * FROM "EmailLog" LIMIT 5;
# SELECT COUNT(*) FROM "User";
```

### Test 2: Redis Connection Test

```bash
# Check Redis is running
redis-cli ping
# Output: PONG

# Check Redis memory
redis-cli INFO memory
# Output: used_memory_human:...

# Monitor Redis (in separate terminal)
redis-cli MONITOR
# You'll see commands as emails are queued
```

### Test 3: API Server Startup Test

```bash
cd apps/api

# Start dev server (if not already running)
npm run dev

# You should see:
# [Nest] 12345  - 05/10/2026, 10:00:00 AM   [NestFactory] Nest application successfully started +1234ms
# [InstanceLoader] EmailModule dependencies initialized +234ms
# [ScheduleModule] Nest schedule module initialized +123ms

# Look for any errors in email module initialization
# grep -i "email\|error\|warn" in console output
```

### Test 4: Send Test Email via API

```bash
# From your terminal or API client

# Option A: Using curl
curl -X POST http://localhost:4000/api/v1/email/test-send \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientEmail": "your-test-email@example.com",
    "userId": "test-user-123",
    "emailType": "WELCOME",
    "props": {
      "fullName": "Test User"
    }
  }'

# Option B: Using NestJS REPL
npm run repl
# > const emailService = get(EmailService)
# > await emailService.sendTransactional('test@example.com', 'test-id', 'WELCOME', {fullName: 'Test'})
# Should return: { jobId: 'abc123', queued: true }

# Option C: From admin dashboard
# 1. Go to http://localhost:3000/admin
# 2. Click "Email" tab
# 3. Configuration tab → Check System Health
# 4. Should show all green: ✓ API Key ✓ Redis ✓ Database
```

### Test 5: Verify Email in Resend Dashboard

```bash
# After sending test email:

# 1. Check Resend Dashboard
#    https://resend.com/emails
#    You should see:
#    - Email from: noreply@changeliberia.org
#    - Subject: "Welcome to Change Liberia!"
#    - Status: Delivered (or Sent)
#    - Timestamp: just now

# 2. Check admin dashboard Queue Status
#    http://localhost:3000/admin → Email → Queue Status
#    Should show:
#    - Queued: 0
#    - Active: 0
#    - Completed: 1
#    - Failed: 0

# 3. Check database EmailLog
#    SELECT * FROM "EmailLog" WHERE type = 'WELCOME' ORDER BY createdAt DESC LIMIT 1;
#    Should show:
#    - status: DELIVERED
#    - sentAt: NOT NULL
#    - resendMessageId: NOT NULL
```

### Test 6: Open Tracking Test

```bash
# 1. Get the EmailLog ID from previous test
#    SELECT id, trackingPixelId FROM "EmailLog" WHERE type = 'WELCOME' LIMIT 1;

# 2. Manually hit the tracking pixel endpoint
curl -X GET "http://localhost:4000/api/v1/email/track/open/{emailLogId}/{pixelId}" \
  -H "Accept: image/*"
# Should return: 1x1 GIF pixel (binary data)

# 3. Check if open was recorded
#    SELECT openedAt, status FROM "EmailLog" WHERE id = '{emailLogId}';
#    Should show:
#    - openedAt: NOT NULL (just now)
#    - status: OPENED
```

### Test 7: Click Tracking Test

```bash
# 1. Get the EmailLog ID
#    SELECT id FROM "EmailLog" WHERE type = 'WELCOME' LIMIT 1;

# 2. Hit the click tracking endpoint
curl -X GET "http://localhost:4000/api/v1/email/track/click/{emailLogId}/{linkId}?redirect=https%3A%2F%2Fexample.com"
# Should redirect to https://example.com

# 3. Check database
#    SELECT clickedAt, status FROM "EmailLog" WHERE id = '{emailLogId}';
#    Should show:
#    - clickedAt: NOT NULL
#    - status: OPENED or CLICKED
```

### Test 8: Event-Triggered Email Test

```bash
# 1. Create a test user via signup or admin panel
#    User email: test-event@example.com

# 2. This should trigger:
#    - user.created event
#    - EmailEventService listener
#    - WELCOME email queued

# 3. Check EmailLog
#    SELECT COUNT(*) FROM "EmailLog" WHERE type = 'WELCOME' AND createdAt > NOW() - INTERVAL 1 minute;
#    Should show: 1 new email

# 4. Check Resend dashboard
#    New WELCOME email should appear within seconds

# Alternative: Emit event directly
curl -X POST http://localhost:4000/api/v1/test/emit-event \
  -H "Content-Type: application/json" \
  -d '{
    "eventName": "user.created",
    "eventData": {
      "userId": "test-123",
      "email": "test@example.com",
      "fullName": "Test User"
    }
  }'
```

### Test 9: Preference Management Test

```bash
# 1. Get user's email preferences
curl -X GET http://localhost:3000/api/v1/email/preferences \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Response should be:
# {
#   "emailEnabled": true,
#   "digestFrequency": "weekly",
#   "mutedTypes": [],
#   "emailCategories": ["AUTHENTICATION", "PETITION"],
#   "preferredSendTime": "09:00"
# }

# 2. Mute PETITION emails
curl -X PATCH http://localhost:3000/api/v1/email/preferences \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mutedTypes": ["PETITION_APPROVED", "PETITION_REJECTED", "PETITION_MILESTONE_REACHED"]
  }'

# 3. Try to send PETITION_APPROVED email to this user
#    Should be blocked by EmailPreferenceService
#    Email NOT queued
#    No entry in EmailLog

# 4. Send WELCOME email (transactional, always sent)
#    Should be queued and sent regardless of preferences
```

### Test 10: Admin Statistics Test

```bash
# 1. Load admin dashboard
curl -X GET "http://localhost:4000/api/v1/admin/email/stats?startDate=2026-05-01&endDate=2026-05-10" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"

# Response should be:
# {
#   "totalSent": 5,
#   "totalDelivered": 5,
#   "totalOpened": 2,
#   "totalClicked": 1,
#   "totalBounced": 0,
#   "totalFailed": 0,
#   "openRate": 0.4,
#   "clickRate": 0.2,
#   "deliveryRate": 1.0
# }

# 2. Check queue stats
curl -X GET http://localhost:4000/api/v1/admin/email/queue-stats \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"

# Response should be:
# {
#   "queued": 0,
#   "active": 0,
#   "completed": 5,
#   "failed": 0,
#   "delayed": 0
# }

# 3. Check health status
curl -X GET http://localhost:4000/api/v1/admin/email/health \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"

# Response should be:
# {
#   "status": "ok",
#   "message": "All systems operational",
#   "apiKey": true,
#   "redisConnected": true,
#   "databaseConnected": true,
#   "lastChecked": "2026-05-10T10:00:00Z"
# }
```

### Test 11: Domain Verification Test

```bash
# Verify domain is setup in Resend
curl -X POST http://localhost:4000/api/v1/admin/email/verify-domain \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "changeliberia.org"
  }'

# Response should be:
# {
#   "domain": "changeliberia.org",
#   "verified": true,
#   "dkimVerified": true,
#   "spfVerified": true,
#   "dmarcVerified": true,
#   "verificationStatus": "verified"
# }

# ⚠️ If not verified:
# 1. Go to Resend dashboard
# 2. Add DNS records to your domain provider
# 3. Wait 24 hours for propagation
# 4. Re-verify
```

### Test 12: Webhook Reception Test

```bash
# 1. Trigger a test webhook from Resend
#    https://resend.com/webhooks → Find your endpoint → "Send test event"

# 2. Check API logs for:
#    "Received Resend webhook"
#    "Event type: email.delivered"

# 3. Verify database updated
#    SELECT status, deliveredAt FROM "EmailLog" WHERE resendMessageId = '...' LIMIT 1;
#    Should show:
#    - status: DELIVERED
#    - deliveredAt: NOT NULL

# 4. If webhook failed:
#    - Check endpoint URL is accessible
#    - Check RESEND_WEBHOOK_SECRET is correct
#    - Check API logs for errors
#    - Verify POST /webhooks/resend route exists
```

---

## 📊 Step 3: Load Testing (Optional)

### Bulk Send Test

```bash
# Send 100 emails
curl -X POST http://localhost:4000/api/v1/email/bulk-send \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": ["user-1", "user-2", ..., "user-100"],
    "emailType": "WEEKLY_DIGEST",
    "templateProps": {
      "topPetitions": [],
      "signatureCount": 1000
    }
  }'

# Check queue growth
watch -n 1 'redis-cli LLEN email-queue:queue'

# Monitor processing
watch -n 1 'echo "SELECT status, COUNT(*) FROM \"EmailLog\" WHERE createdAt > NOW() - INTERVAL 5 minutes GROUP BY status" | psql'

# Expected:
# status      | count
# -----------|-------
# QUEUED     | 20
# PROCESSING | 5
# SENT       | 75
```

### Sustained Load Test

```bash
# Simulate 10 emails/second for 5 minutes

for i in {1..3000}; do
  curl -X POST http://localhost:4000/api/v1/email/send \
    -H "Authorization: Bearer USER_JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"user-${i}@test.com\"}" &
done

# Monitor in admin dashboard
# Watch Queue Status tab auto-refresh
# Check that Failed stays at 0
# Watch Queued → Active → Completed flow
```

---

## ✅ Step 4: Production Deployment Checklist

### Before Deploying

- [ ] All environment variables set (7 required)
- [ ] Resend domain verified (DKIM/SPF/DMARC)
- [ ] Resend webhook configured and tested
- [ ] Database migrations applied
- [ ] Redis running in production
- [ ] Email permission assigned to admin roles
- [ ] Test email sent and received
- [ ] Admin dashboard accessible and healthy
- [ ] API logs show no errors
- [ ] All tests pass (Tests 1-12 above)

### Deployment Steps

```bash
# 1. Deploy API (NestJS)
cd apps/api
npm run build
npm run start

# 2. Deploy Web (Next.js)
cd apps/web
npm run build
npm start

# 3. Run migrations
npx prisma migrate deploy

# 4. Verify deployment
curl -X GET https://api.changeliberia.org/api/v1/admin/email/health \
  -H "Authorization: Bearer ADMIN_TOKEN"
# Should return: { status: "ok", ... }
```

### Post-Deployment Validation

```bash
# 1. Send test email to admin inbox
curl -X POST https://api.changeliberia.org/api/v1/email/test-send \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"email": "admin@example.com", "type": "WELCOME"}'

# 2. Check admin dashboard
# https://changeliberia.org/admin → Email → Configuration
# Should show: ✓ All systems operational

# 3. Monitor queue stats
# https://changeliberia.org/admin → Email → Queue Status
# Should show: Queued: 0, Completed: 1+

# 4. Check analytics
# https://changeliberia.org/admin → Email → Analytics
# Should show metrics from today

# 5. Set up monitoring alerts
# - High email failure rate (> 5%)
# - Queue depth > 500
# - Redis memory > 80%
# - API response time > 1000ms
```

---

## 🚨 Troubleshooting Common Issues

### Issue: "API Key is invalid"

**Solution**:
```bash
# 1. Verify API key format
#    Should start with: re_
#    Current key: re_V39tR44W_PmhRUhmg9k79ZrUpCe6F7AKx ✓

# 2. Check environment variable
echo $RESEND_API_KEY
# Should output: re_V39tR44W_PmhRUhmg9k79ZrUpCe6F7AKx

# 3. Verify in Resend dashboard
#    https://resend.com/api-keys
#    Should show API key as "Active"

# 4. Test API key directly
curl -X GET https://api.resend.com/audiences \
  -H "Authorization: Bearer re_V39tR44W_PmhRUhmg9k79ZrUpCe6F7AKx"
# Should return 200, not 401
```

### Issue: "Emails not delivering"

**Checklist**:
```bash
# 1. Check domain is verified
POST /api/v1/admin/email/verify-domain
# Should show: verified: true

# 2. Check email address is valid
# Use online validator or test with known good email

# 3. Check Resend dashboard
# https://resend.com/emails
# Look for your email → Check status and error message

# 4. Check database EmailLog
SELECT status, failureReason FROM "EmailLog" ORDER BY createdAt DESC LIMIT 5;

# 5. If status is FAILED
# Check failureReason field for error details
```

### Issue: "Webhook not receiving events"

**Troubleshooting**:
```bash
# 1. Verify webhook URL is correct
#    https://resend.com/webhooks → Check endpoint

# 2. Test webhook endpoint manually
curl -X POST https://changeliberia.org/api/v1/webhooks/resend \
  -H "Content-Type: application/json" \
  -H "svix-id: test-123" \
  -H "svix-timestamp: $(date +%s)" \
  -H "svix-signature: test-sig" \
  -d '{"type": "email.delivered", "data": {...}}'

# 3. Check webhook secret matches
#    Resend dashboard secret == RESEND_WEBHOOK_SECRET env var

# 4. Check firewall/network allows POST to /webhooks/resend

# 5. Monitor API logs
tail -f apps/api/logs/error.log | grep -i webhook
```

### Issue: "Redis connection failed"

**Solution**:
```bash
# 1. Check Redis is running
redis-cli ping
# Should return: PONG

# 2. Verify Redis URL
echo $REDIS_URL
# Should be: redis://localhost:6379 (or your prod URL)

# 3. Test Redis connection
redis-cli
# If it connects, then it works

# 4. Check firewall allows connection
# If on cloud, check security groups allow inbound 6379

# 5. Increase Redis memory if needed
redis-cli CONFIG GET maxmemory
redis-cli CONFIG SET maxmemory 2gb
```

---

## 📈 Monitoring & Alerts

### Key Metrics to Monitor

```
1. Email Delivery Rate
   - Goal: > 95%
   - Check: Admin dashboard → Analytics
   - Alert: If < 90%, check domain verification

2. Email Queue Depth
   - Goal: < 100 jobs
   - Check: Admin dashboard → Queue Status
   - Alert: If > 500, may need to scale workers

3. Bounce Rate
   - Goal: < 2%
   - Check: Admin dashboard → Analytics
   - Alert: If > 5%, investigate email list quality

4. Webhook Response Time
   - Goal: < 200ms
   - Check: API logs
   - Alert: If > 1000ms, may need to optimize

5. Redis Memory Usage
   - Goal: < 80% of max
   - Check: redis-cli INFO memory
   - Alert: If > 90%, increase memory or clear old jobs

6. API Response Time
   - Goal: < 200ms
   - Check: API logs / APM
   - Alert: If > 500ms, investigate bottleneck
```

### Setting Up Monitoring

```bash
# Option 1: Datadog
# Set up APM in apps/api/main.ts
# Monitor: Email endpoints, BullMQ processor, Resend API calls

# Option 2: Sentry
# Set up error tracking in apps/api
# Monitor: Email service errors, webhook failures

# Option 3: CloudWatch (AWS)
# Log group: /aws/changeliberia/api
# Query: fields @timestamp, @message | filter @message like /email/

# Option 4: Prometheus
# Expose metrics at /metrics
# Track: email_sent_total, email_delivered_total, queue_jobs_total
```

---

## 🎯 Success Criteria

**System is production-ready when:**

✅ All 12 tests pass
✅ Delivery rate > 95% over 24 hours
✅ Queue depth stays < 100
✅ No unhandled errors in logs
✅ Webhooks processed within 200ms
✅ Admin dashboard shows all green
✅ Domain verified (DKIM/SPF/DMARC)
✅ Bounce rate < 2%
✅ Weekly digest sends on schedule
✅ Failed email retry works
✅ User preferences honored
✅ Event triggers emails correctly

---

## 📞 Support

If issues arise:

1. **Check logs first**:
   ```bash
   tail -f apps/api/logs/error.log
   tail -f apps/api/logs/app.log
   ```

2. **Review admin dashboard**:
   ```
   /admin → Email → Configuration tab
   Check: ✓ API Key ✓ Redis ✓ Database
   ```

3. **Test specific component**:
   ```bash
   # Test API endpoint directly
   curl -X GET http://localhost:4000/api/v1/admin/email/health
   
   # Test Resend API key
   curl https://api.resend.com/audiences \
     -H "Authorization: Bearer re_V39tR44W_PmhRUhmg9k79ZrUpCe6F7AKx"
   
   # Test Redis
   redis-cli ping
   ```

4. **Consult documentation**:
   - EMAIL_SYSTEM_COMPLETE.md - Architecture reference
   - EMAIL_QUICK_START.md - Developer guide
   - This file - Setup & testing

---

**Status**: Ready for production testing with API key configured.
**Next**: Run tests 1-12 and proceed to deployment when all pass.
