# Email System - Deployment Quick Start

**Status**: Ready to begin pre-deployment configuration
**Time to Completion**: 2 weeks (including DNS propagation wait)
**Effort Level**: Medium (mostly configuration, no coding)

---

## Phase 1: Resend Configuration (Today - 1 hour)

### Step 1.1: Verify Resend API Key
```bash
API_KEY="re_V39tR44W_PmhRUhmg9k79ZrUpCe6F7AKx"

# Test that API key works
curl -H "Authorization: Bearer $API_KEY" \
  https://api.resend.com/audiences

# Expected response:
# {
#   "data": [...],
#   "object": "list"
# }
```

**Status Check**: ✅ If you get a 200 response with data, API key is valid

### Step 1.2: Add Domain to Resend
1. Go to [resend.com/domains](https://resend.com/domains)
2. Click "Add Domain"
3. Enter: `changeliberia.org`
4. Click "Add"
5. **Copy the DNS records** that appear (will need these in Step 2)

**Records to copy**:
- DKIM record (long text)
- SPF record
- DMARC record

---

## Phase 2: DNS Configuration (Today - 30 mins setup, 24-48 hours wait)

### Step 2.1: Add DNS Records
1. Log in to your domain registrar (e.g., Namecheap, GoDaddy, etc.)
2. Go to DNS management for `changeliberia.org`
3. Add three new records:

#### Record 1: DKIM
```
Type: CNAME
Name: [copy from Resend - e.g., "default._domainkey"]
Value: [copy from Resend - e.g., "default._domainkey.changeliberia.org"]
```

#### Record 2: SPF
```
Type: TXT
Name: @ (or leave blank)
Value: [copy from Resend - e.g., "v=spf1 include:sendingdomain.resend.co ~all"]
```

#### Record 3: DMARC
```
Type: TXT
Name: _dmarc
Value: [copy from Resend - e.g., "v=DMARC1; p=quarantine; ..."]
```

4. Save all records
5. **Wait 24-48 hours** for DNS propagation

**Status Check**: Use nslookup or dig to verify records:
```bash
nslookup -type=CNAME default._domainkey.changeliberia.org
dig default._domainkey.changeliberia.org CNAME
```

---

## Phase 3: Verify Domain (After DNS Propagation - 24-48 hours later)

### Step 3.1: Verify in Resend Dashboard
1. Go to [resend.com/domains](https://resend.com/domains)
2. Find `changeliberia.org` in the list
3. Click to view details
4. Check status of:
   - [ ] Domain: Should show "Verified" (green checkmark)
   - [ ] DKIM: Should show "Verified" (green checkmark)
   - [ ] SPF: Should show "Verified" (green checkmark)
   - [ ] DMARC: Should show "Verified" (green checkmark)

If not verified:
- Wait a few more hours (DNS takes time to propagate)
- Check that DNS records were entered correctly
- Use nslookup to verify records exist

---

## Phase 4: Webhook Configuration (1 hour)

### Step 4.1: Create Webhook Endpoint
The API already has the webhook handler at:
```
POST /api/v1/webhooks/resend
```

Make sure your production domain is set:
```bash
# In .env or environment variables:
NEXT_PUBLIC_APP_URL=https://changeliberia.org
# (or your production domain)
```

### Step 4.2: Configure Webhook in Resend
1. Go to [resend.com/webhooks](https://resend.com/webhooks)
2. Click "Create Webhook"
3. **Endpoint URL**: `https://changeliberia.org/api/v1/webhooks/resend`
4. **Select events** (check all):
   - ✓ email.delivered
   - ✓ email.bounced
   - ✓ email.complained
   - ✓ email.opened
   - ✓ email.clicked
5. Click "Create"
6. **Copy the webhook secret** (starts with `whsec_`)

### Step 4.3: Configure Webhook Secret
Add to your environment variables:
```bash
RESEND_WEBHOOK_SECRET=whsec_[copied_from_resend]
```

### Step 4.4: Test Webhook
1. In Resend dashboard, find your webhook
2. Click "Send Test Event"
3. Check API logs for:
   ```
   [ResendWebhookController] Webhook received and verified
   ```

**Status Check**: ✅ If you see this log message, webhook is working

---

## Phase 5: Pre-Testing Verification (30 mins)

### Step 5.1: Run Quick Verification
```bash
cd /Users/visionalventure/Change\ Liberia
bash scripts/quick-verify.sh
```

**Expected output**:
```
=== Email System Quick Verification ===

1. API Health Endpoint... PASS
2. Redis Connection... PASS
3. Database Migrations Applied... PASS
4. EmailLog Table Exists... PASS
5. Email Module Services... PASS

Results: 5 PASS / 0 FAIL
✓ All quick verification checks passed!
```

### Step 5.2: Verify API Still Running
```bash
curl http://localhost:4000/health
# Expected: {"status":"ok","uptime":...}
```

### Step 5.3: Check Logs for Errors
```bash
# If API running in background, check logs
tail -50 /tmp/api-start.log | grep -i error
# Should show no errors
```

---

## Phase 6: Testing Phase (2-3 hours)

### Test 1: Basic Email Send
```bash
curl -X POST http://localhost:4000/api/v1/email/test-send \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "emailType": "WELCOME",
    "props": {"fullName": "Test User"}
  }'

# Expected response:
# {"status":"queued","jobId":"...","messageId":"..."}
```

Check Resend dashboard - you should see email in sent list within 10 seconds.

### Test 2: Webhook Delivery
After Test 1, wait 30 seconds. Check Resend dashboard:
1. Find the test email you just sent
2. Click on it
3. Verify status shows "Delivered"
4. Check API logs for webhook message:
   ```
   [EmailEventService] Processing delivered event for email: ...
   ```

### Test 3: Email Preferences
```bash
# Update user to mute PETITION emails
curl -X PATCH http://localhost:4000/api/v1/email/preferences \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [USER_TOKEN]" \
  -d '{
    "mutedTypes": ["PETITION_APPROVED", "PETITION_REJECTED"]
  }'

# Try to send PETITION_APPROVED - should not queue
curl -X POST http://localhost:4000/api/v1/email/test-send \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "emailType": "PETITION_APPROVED",
    "props": {"petitionTitle": "Test"}
  }'

# Expected: Should return error or skip (depending on endpoint implementation)
```

### Test 4: Run Full Test Suite
```bash
bash scripts/test-email-system.sh

# Expected: All 12 tests passing
# (Note: Some tests may timeout if auth/admin access needed)
```

---

## Phase 7: Production Deployment (1 hour)

### Step 7.1: Build for Production
```bash
cd /Users/visionalventure/Change\ Liberia/apps/api

# Clean build
rm -rf dist node_modules/.turbo
npm run build

# Verify build succeeded
ls -lh dist/src/main.js
```

### Step 7.2: Deploy API
```bash
# Using your deployment tool (Railway, Docker, etc.)
# Deploy to production server

# Verify production API is running
curl https://api.changeliberia.org/health
# Expected: {"status":"ok",...}
```

### Step 7.3: Deploy Web App
```bash
cd /Users/visionalventure/Change\ Liberia/apps/web

npm run build
npm start  # or deploy to production
```

### Step 7.4: Verify in Production
1. Go to https://changeliberia.org/admin
2. Navigate to Email section
3. Check that email configuration is visible
4. Verify all admin endpoints respond

---

## Phase 8: Post-Deployment Monitoring (Ongoing)

### Daily Checks (First Week)
- [ ] Email delivery rate > 95% (check Resend dashboard)
- [ ] No errors in application logs
- [ ] Webhook processing working (check Resend dashboard)
- [ ] Redis not hitting memory limits
- [ ] API response times < 500ms

### Weekly Checks
- [ ] Review bounce/complaint rates
- [ ] Check that spam complaints < 0.1%
- [ ] Verify scheduled tasks ran (digests, retries)
- [ ] Review analytics metrics

---

## Troubleshooting

### Problem: DNS records not verifying
**Solution**:
- Wait a bit longer (DNS takes 24-48 hours)
- Verify records were entered exactly as provided
- Use nslookup to check records exist
- Contact domain registrar if still not showing

### Problem: Webhook not receiving events
**Solution**:
- Verify webhook URL is correct and accessible
- Check RESEND_WEBHOOK_SECRET is set correctly
- Check API logs for webhook errors
- Test with "Send Test Event" button in Resend

### Problem: Emails not delivering
**Solution**:
- Check Resend dashboard - domain might not be verified
- Check that MAIL_FROM is set to noreply@changeliberia.org
- Verify API logs for send errors
- Check user spam folder

### Problem: API won't start
**Solution**:
- Check all environment variables are set
- Verify PostgreSQL connection working
- Verify Redis connection working
- Check logs: tail /tmp/api-start.log

---

## Timeline Summary

| Phase | Duration | Status |
|-------|----------|--------|
| Resend API + DNS Setup | 1 hour | ⏳ Do Today |
| DNS Propagation Wait | 24-48 hours | ⏳ Automatic |
| Webhook Configuration | 1 hour | ⏳ After DNS |
| Pre-Testing Verification | 30 mins | ⏳ After Webhook |
| Testing (12 tests) | 2-3 hours | ⏳ After Verification |
| Production Deployment | 1 hour | ⏳ After Tests Pass |

**Total Time**: ~3 days (mostly waiting for DNS)

---

## Contacts & Resources

**Resend Documentation**: https://resend.com/docs
**Webhook Testing**: Use Resend dashboard "Send Test Event"
**API Reference**: See [ADMIN_API_DOCUMENTATION.md](ADMIN_API_DOCUMENTATION.md)
**Database Schema**: See Prisma schema at `apps/api/prisma/schema.prisma`

---

**Document Version**: 1.0
**Ready for**: Immediate use
**Last Updated**: May 10, 2026
