# Email System - Production Deployment Checklist

## Pre-Deployment Phase

### Environment Setup
- [ ] **API Server Configuration**
  - [ ] RESEND_API_KEY set to: `re_V39tR44W_PmhRUhmg9k79ZrUpCe6F7AKx`
  - [ ] MAIL_FROM set to: `noreply@changeliberia.org`
  - [ ] MAIL_REPLY_TO set to: `support@changeliberia.org`
  - [ ] REDIS_URL configured (local or production Redis)
  - [ ] TRACKING_DOMAIN set to: `track.changeliberia.org`
  - [ ] NEXT_PUBLIC_APP_URL set to production domain
  - [ ] DATABASE_URL pointing to production PostgreSQL

- [ ] **Web Server Configuration**
  - [ ] NEXT_PUBLIC_APP_URL set to production domain
  - [ ] NEXT_PUBLIC_API_URL pointing to API endpoint
  - [ ] NEXT_PUBLIC_EMAIL_TRACKING_DOMAIN set

### Database Preparation
- [ ] **Migrations Applied**
  - [ ] Run: `cd apps/api && npx prisma migrate deploy`
  - [ ] Verify: EmailLog table created with 17 fields
  - [ ] Verify: NotificationPreference extended with 5 email fields
  - [ ] Verify: PermissionResource has EMAIL entry
  - [ ] Verify: User.emailLogs relation created

- [ ] **Initial Data**
  - [ ] EMAIL resource added to PermissionResource enum
  - [ ] Admin role created (if not exists)
  - [ ] EMAIL:READ permission assigned to admin role
  - [ ] EMAIL:UPDATE permission assigned to admin role
  - [ ] At least one admin user created

### Resend Configuration
- [ ] **API Key Validation**
  - [ ] API Key format verified: `re_V39tR44W_PmhRUhmg9k79ZrUpCe6F7AKx` ✓
  - [ ] API key tested: `curl -H "Authorization: Bearer <KEY>" https://api.resend.com/audiences`
  - [ ] Response shows 200 (not 401/403)

- [ ] **Domain Configuration**
  - [ ] Domain added to Resend: `changeliberia.org`
  - [ ] DNS records added to domain provider:
    - [ ] DKIM record added (provided by Resend)
    - [ ] SPF record added (provided by Resend)
    - [ ] DMARC record added (provided by Resend)
  - [ ] Wait 24-48 hours for DNS propagation
  - [ ] Domain verified in Resend dashboard (status: "Verified")
  - [ ] DKIM verified (status: "Verified")
  - [ ] SPF verified (status: "Verified")
  - [ ] DMARC verified (status: "Verified")

- [ ] **Webhook Configuration**
  - [ ] Webhook endpoint created: `https://changeliberia.org/api/v1/webhooks/resend`
  - [ ] Webhook secret copied: `RESEND_WEBHOOK_SECRET=whsec_...`
  - [ ] Webhook events subscribed:
    - [ ] email.delivered
    - [ ] email.bounced
    - [ ] email.complained
    - [ ] email.opened
    - [ ] email.clicked
  - [ ] Webhook URL tested (send test event from Resend)
  - [ ] API logs show webhook received successfully

### Infrastructure Setup
- [ ] **Redis Configuration**
  - [ ] Redis instance running (local or cloud)
  - [ ] Redis connection tested: `redis-cli -u $REDIS_URL ping` → PONG
  - [ ] Redis memory configured: ≥ 1GB recommended
  - [ ] Redis persistence enabled (AOF or RDB)
  - [ ] Redis backups configured
  - [ ] Redis monitoring configured (memory alerts)

- [ ] **PostgreSQL Configuration**
  - [ ] PostgreSQL instance running and accessible
  - [ ] Database created: `changeliberia_production`
  - [ ] Database user created with proper permissions
  - [ ] SSL/TLS enabled for remote connections
  - [ ] Connection pooling configured (PgBouncer or similar)
  - [ ] Backup strategy implemented
  - [ ] Monitoring and alerts configured

### Application Deployment
- [ ] **API Server (NestJS)**
  - [ ] Build successful: `npm run build` (no errors)
  - [ ] Start successful: `npm run start` (no errors)
  - [ ] Health endpoint responds: `GET /health` → 200
  - [ ] Email module initialized: logs show "EmailModule dependencies initialized"
  - [ ] Schedule module initialized: logs show "Nest schedule module initialized"
  - [ ] No error messages in startup logs

- [ ] **Web Server (Next.js)**
  - [ ] Build successful: `npm run build` (no errors)
  - [ ] Start successful: `npm start` (no errors)
  - [ ] Admin page loads: `GET /admin` → 200
  - [ ] Email tab visible in admin dashboard
  - [ ] No build errors or warnings

## Testing Phase

### Basic Functionality Tests
- [ ] **Test 1: Email Sending**
  - [ ] Send test email from API
  - [ ] Email appears in Resend dashboard within 10 seconds
  - [ ] Status shows "Delivered"
  - [ ] EmailLog table shows entry with status: SENT or DELIVERED

- [ ] **Test 2: Queue Processing**
  - [ ] BullMQ queue visible in admin dashboard
  - [ ] Test email processed from queue
  - [ ] Completed job count increases
  - [ ] Failed job count remains 0

- [ ] **Test 3: Event Triggering**
  - [ ] Create test user via signup
  - [ ] WELCOME email sent automatically
  - [ ] Email appears in Resend dashboard
  - [ ] EmailLog shows event-triggered email

- [ ] **Test 4: Tracking Pixel**
  - [ ] Tracking pixel endpoint: `GET /track/open/:id/:pixelId`
  - [ ] Returns 1x1 GIF pixel (Content-Type: image/gif)
  - [ ] EmailLog.openedAt updated
  - [ ] EmailLog.status = OPENED

- [ ] **Test 5: Click Tracking**
  - [ ] Click tracking endpoint: `GET /track/click/:id/:linkId?redirect=...`
  - [ ] Redirects to original URL
  - [ ] EmailLog.clickedAt updated
  - [ ] EmailLog.status = OPENED (or new CLICKED status)

- [ ] **Test 6: User Preferences**
  - [ ] Update user preference: mute PETITION emails
  - [ ] Try to send PETITION_APPROVED email
  - [ ] Email not queued (returns null)
  - [ ] EmailLog entry not created

- [ ] **Test 7: Webhook Handling**
  - [ ] Send test webhook from Resend dashboard
  - [ ] API logs show webhook received
  - [ ] Svix signature verified successfully
  - [ ] EmailLog.deliveredAt updated
  - [ ] EmailLog.status = DELIVERED

- [ ] **Test 8: Admin Dashboard**
  - [ ] Load admin dashboard: `GET /admin`
  - [ ] Navigate to Email tab
  - [ ] Configuration tab loads (no errors)
  - [ ] Queue Status tab shows statistics
  - [ ] Analytics tab shows metrics
  - [ ] System Health section shows all green ✓

- [ ] **Test 9: Admin API Endpoints**
  - [ ] `/admin/email/stats` returns metrics
  - [ ] `/admin/email/queue-stats` returns queue data
  - [ ] `/admin/email/health` returns status ok
  - [ ] `/admin/email/verify-domain` verifies domain

- [ ] **Test 10: Scheduled Tasks**
  - [ ] Verify weekly digest scheduled for Sunday 9 AM
  - [ ] Verify retry job scheduled every 15 minutes
  - [ ] Verify cleanup job scheduled daily 2 AM
  - [ ] Verify archive job scheduled daily 3 AM
  - [ ] Verify analytics job scheduled daily midnight

### Performance & Load Tests
- [ ] **Test 11: Bulk Send**
  - [ ] Send 100 emails
  - [ ] Queue processes without errors
  - [ ] All 100 delivered within 5 minutes
  - [ ] Delivery rate > 95%
  - [ ] No failed jobs

- [ ] **Test 12: High Volume**
  - [ ] Stress test with 1000 emails
  - [ ] Redis memory stays < 80% of max
  - [ ] API response time < 500ms
  - [ ] Queue processes all jobs
  - [ ] Delivery rate > 95%

### Monitoring & Alerts
- [ ] **Monitoring Setup**
  - [ ] APM configured (Datadog, New Relic, etc.)
  - [ ] Email metrics tracked
  - [ ] Error tracking enabled (Sentry, etc.)
  - [ ] Log aggregation configured (CloudWatch, ELK, etc.)
  - [ ] Health checks configured

- [ ] **Alerts Configured**
  - [ ] Alert: Delivery rate < 95%
  - [ ] Alert: Queue depth > 1000
  - [ ] Alert: Failed emails > 10
  - [ ] Alert: Redis memory > 80%
  - [ ] Alert: API response time > 1000ms
  - [ ] Alert: Webhook failures > 5 in 1 hour

## Production Verification

### Go-Live Checklist
- [ ] **Final Verification**
  - [ ] All tests passing (12/12 ✓)
  - [ ] No unhandled errors in logs
  - [ ] Admin dashboard fully functional
  - [ ] Metrics visible and accurate
  - [ ] Webhooks receiving and processing events
  - [ ] Delivery rate consistently > 95%

- [ ] **Documentation**
  - [ ] EMAIL_SYSTEM_COMPLETE.md updated
  - [ ] EMAIL_QUICK_START.md current
  - [ ] EMAIL_PRODUCTION_SETUP.md current
  - [ ] Runbooks created for operators
  - [ ] Troubleshooting guide available

- [ ] **Notifications**
  - [ ] Engineering team notified
  - [ ] Operations team trained
  - [ ] Support team has contact info
  - [ ] Escalation path documented
  - [ ] On-call rotation established

## Post-Deployment Phase

### First 24 Hours
- [ ] **Monitoring**
  - [ ] Monitor email delivery rate (check every 4 hours)
  - [ ] Watch queue depth (should stay < 100)
  - [ ] Check error logs (should be minimal)
  - [ ] Monitor Redis memory
  - [ ] Verify webhooks are processing

- [ ] **User Testing**
  - [ ] Test signup flow (welcome email)
  - [ ] Test password reset (reset email)
  - [ ] Test petition creation (notification email)
  - [ ] Verify email delivery to multiple addresses
  - [ ] Check that emails appear in spam folder analysis

- [ ] **Incident Response**
  - [ ] If delivery rate drops < 90%:
    - [ ] Check Resend dashboard for domain issues
    - [ ] Check API logs for errors
    - [ ] Verify webhook is working
    - [ ] Check Redis connection
  - [ ] If queue backs up:
    - [ ] Check BullMQ worker logs
    - [ ] Increase worker concurrency if needed
    - [ ] Monitor Resend rate limits
  - [ ] If webhooks not received:
    - [ ] Verify webhook URL is accessible
    - [ ] Check webhook secret matches
    - [ ] Test with manual webhook send from Resend

### First Week
- [ ] **Performance Review**
  - [ ] Delivery rate stable > 95%
  - [ ] Bounce rate < 2%
  - [ ] Open rate > 20%
  - [ ] No spike in failed jobs
  - [ ] User feedback positive

- [ ] **Optimization**
  - [ ] Review slow endpoints (if any)
  - [ ] Optimize database queries (if needed)
  - [ ] Tune Redis memory settings
  - [ ] Adjust BullMQ concurrency if needed
  - [ ] Review error logs for patterns

- [ ] **Operations**
  - [ ] Run cleanup task: delete old EmailLog (90+ days)
  - [ ] Archive completed jobs (30+ days)
  - [ ] Generate weekly analytics report
  - [ ] Update monitoring dashboards
  - [ ] Review logs for any warnings

### First Month
- [ ] **Comprehensive Review**
  - [ ] Analyze email metrics by type
  - [ ] Review engagement rates
  - [ ] Check bounce and complaint trends
  - [ ] Evaluate event trigger accuracy
  - [ ] Review user preference settings

- [ ] **Enhancements**
  - [ ] Implement email template editor (if needed)
  - [ ] Add A/B testing capability
  - [ ] Create dashboard for users
  - [ ] Set up automated reporting
  - [ ] Plan future features

- [ ] **Security Review**
  - [ ] Audit all email permissions
  - [ ] Review webhook signature validation
  - [ ] Check API authentication
  - [ ] Verify no secrets in logs
  - [ ] Review access logs

## Success Criteria

**System is production-ready when:**

✅ All 12 tests passing
✅ Delivery rate > 95% (24 hours minimum)
✅ Queue processing < 5 seconds per email
✅ No unhandled errors in logs
✅ Admin dashboard fully functional
✅ Webhooks processing 100% of events
✅ Domain verified (DKIM/SPF/DMARC)
✅ Bounce rate < 2%
✅ Open rate > 20%
✅ Zero security vulnerabilities
✅ Monitoring and alerts active
✅ Operations team trained

## Rollback Plan

**If critical issues occur:**

1. **Stop new emails**:
   ```bash
   # Pause email processing
   docker pause <api-container>
   ```

2. **Investigate**:
   ```bash
   # Check logs
   tail -f apps/api/logs/error.log
   
   # Check Resend
   curl -H "Authorization: Bearer <KEY>" https://api.resend.com/emails
   
   # Check queue
   redis-cli LLEN email-queue:queue
   ```

3. **Scale back**:
   - Reduce BullMQ worker concurrency
   - Limit email sending to admins only
   - Disable event-triggered emails

4. **Communicate**:
   - Notify engineering team
   - Update status page
   - Notify affected users if necessary

5. **Recover**:
   - Fix underlying issue
   - Resume with reduced load
   - Gradually increase as metrics improve

## Support Contacts

- **Resend Support**: support@resend.com
- **Engineering Lead**: [name/contact]
- **Operations Lead**: [name/contact]
- **On-Call**: [name/contact]

## Maintenance Windows

- **Scheduled**: Sundays 2-4 AM UTC
- **Notice Period**: 48 hours
- **Expected Impact**: 0 (asynchronous processing)
- **Rollback Time**: < 15 minutes

## Sign-Off

- [ ] **Engineering Manager**: _________________ Date: _______
- [ ] **Operations Manager**: _________________ Date: _______
- [ ] **Security Lead**: _________________ Date: _______
- [ ] **Product Manager**: _________________ Date: _______

---

**Status**: Ready for deployment after all checklist items completed.

**Last Updated**: May 10, 2026
**Next Review**: May 17, 2026 (7 days post-deployment)
