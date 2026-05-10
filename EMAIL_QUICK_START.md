# Email System Quick Start Guide

## For Developers

### Sending an Email

```typescript
// From any service in the application, inject EmailService

@Injectable()
export class MyService {
  constructor(private emailService: EmailService) {}

  // Send transactional email (always sent, ignores preferences)
  async onUserSignup(user: User) {
    const jobId = await this.emailService.sendTransactional(
      user.email,
      user.id,
      EmailType.WELCOME,
      { fullName: user.fullName }
    );
    console.log(`Welcome email queued with job ID: ${jobId}`);
  }

  // Send notification email (respects user preferences)
  async notifyPetitionApproved(userId: string, petitionId: string) {
    const jobId = await this.emailService.sendNotification(
      userId,
      user.email,
      EmailType.PETITION_APPROVED,
      { petitionTitle: 'Healthcare Reform', creatorName: 'John Doe' }
    );
    // Returns null if user has muted this type or disabled emails
    if (!jobId) console.log('Email blocked by user preferences');
  }

  // Send bulk emails
  async sendWeeklyDigest(userIds: string[]) {
    const jobIds = await this.emailService.sendBulk(
      userIds,
      EmailType.WEEKLY_DIGEST,
      (userId: string) => ({
        topPetitions: [/* ... */],
        signatureCount: 123
      })
    );
    console.log(`${jobIds.length} digests queued`);
  }
}
```

### Listening to Events

```typescript
// EmailEventService automatically listens to these events:

// User events trigger emails automatically:
// user.created → WELCOME email sent
// user.email.verification-requested → VERIFY_EMAIL sent
// user.password-reset-requested → PASSWORD_RESET sent
// user.password-changed → PASSWORD_RESET_CONFIRMATION sent

// Petition events:
// petition.approved → PETITION_APPROVED email
// petition.milestone → PETITION_MILESTONE_REACHED email
// petition.government-submitted → GOVERNMENT_SUBMISSION email
// petition.government-response → OFFICIAL_RESPONSE email

// You can emit events from anywhere:
this.eventEmitter.emit('user.created', {
  userId: '123',
  email: 'user@example.com',
  fullName: 'John Doe'
});

// Email will be automatically queued!
```

### Checking Email Status

```typescript
// Get email history for user
const logs = await this.emailService.listUserEmails(userId, limit=50, offset=0);
logs.forEach(log => {
  console.log(`${log.type}: ${log.status} (${log.createdAt})`);
});

// Get specific email log
const emailLog = await this.emailService.getEmailLog(emailLogId);
console.log(emailLog);
// {
//   id: '...',
//   recipient: 'user@example.com',
//   type: 'WELCOME',
//   status: 'DELIVERED',
//   sentAt: '2026-05-10T10:00:00Z',
//   openedAt: '2026-05-10T10:15:00Z',
//   clickedAt: null,
//   ...
// }
```

---

## For Operators

### Accessing Admin Dashboard

1. Go to `/admin`
2. Click on **Email** tab
3. Three sub-tabs available:

#### Configuration Tab
- Check system health (API key, Redis, Database)
- Verify Resend domain (DKIM, SPF, DMARC)
- Fix any configuration issues

#### Queue Status Tab
- View real-time BullMQ statistics
- See queued, active, completed, failed jobs
- Auto-refreshes every 30 seconds
- **Warning**: Red cards indicate problems (high failed count = investigate)

#### Analytics Tab
- Select date range (7d, 30d, 90d)
- View email metrics:
  - **Delivery Rate**: Should be >95%
  - **Open Rate**: Typical 20-35%
  - **Bounce Rate**: Should be <2%
- Summary section shows:
  - Success Rate (delivery percentage)
  - Engagement Rate (opens + clicks)
  - Problem Rate (bounces + failures)

### Monitoring

**Red Flags**:
- Delivery Rate < 95% → Check Resend domain verification
- Failed jobs growing → Check error messages in logs
- Redis queue > 1000 → May need to scale up workers
- Bounce rate > 5% → May indicate bad email list quality

**Green Flags**:
- All system health indicators ✓
- Queue depth < 100
- Delivery rate > 98%
- No failed jobs pending

### Troubleshooting

**Issue**: Emails not being sent
```
1. Check Configuration tab → System Health
2. Verify API Key is set correctly (should be green)
3. Check Redis connection (should be green)
4. Check Database connection (should be green)
5. If any red: fix configuration and restart app
```

**Issue**: High bounce rate
```
1. Go to Analytics tab
2. Check Bounce Rate metric
3. If > 5%:
   - Review recent emails in EmailLog table
   - Check recipient email addresses quality
   - Verify DKIM/SPF/DMARC in Configuration tab
```

**Issue**: Queue backing up (high Queued count)
```
1. Check Queue Status tab
2. If Queued > 1000:
   - Check Redis memory (may be full)
   - Check Failed count (errors may be blocking processing)
   - Restart API server to reset queue
```

### Regular Maintenance

**Daily**:
- Check admin dashboard once
- Monitor delivery rate
- Note any Failed jobs

**Weekly**:
- Review analytics (7-day view)
- Check engagement rates
- Verify domain status hasn't changed

**Monthly**:
- Review 30-day analytics
- Check trends in delivery/open rates
- Evaluate email performance by type

---

## Environment Setup

### Development

```bash
# 1. Make sure Redis is running
docker-compose up redis

# 2. Set environment variables (.env or .env.local)
RESEND_API_KEY=re_xxxxx
MAIL_FROM=noreply@localhost
MAIL_REPLY_TO=support@localhost
REDIS_URL=redis://localhost:6379
TRACKING_DOMAIN=localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
RESEND_WEBHOOK_SECRET=whsec_xxxxx

# 3. Run database migrations
cd apps/api
npx prisma migrate dev

# 4. Start API server
npm run dev

# 5. Start web server
cd apps/web
npm run dev
```

### Production

```bash
# 1. Set all environment variables in production
# (AWS Secrets Manager, Vercel Env, etc.)

# 2. Run migrations
npx prisma migrate deploy

# 3. Deploy API (NestJS)
npm run build
npm run start

# 4. Deploy web (Next.js)
npm run build
npm start
```

---

## Email Type Reference

| Type | When Triggered | User Preference | Template |
|------|---|---|---|
| WELCOME | User signup | N/A (transactional) | welcome.tsx |
| VERIFY_EMAIL | Email verification requested | N/A (transactional) | verify-email.tsx |
| PASSWORD_RESET | Password reset requested | N/A (transactional) | password-reset.tsx |
| PASSWORD_RESET_CONFIRMATION | Password changed | N/A (transactional) | password-reset-confirmation.tsx |
| PETITION_APPROVED | Petition approved | PETITION | petition-approved.tsx |
| PETITION_REJECTED | Petition rejected | PETITION | (custom) |
| PETITION_MILESTONE_REACHED | 10/50/100/500/1k signatures | PETITION | milestone-reached.tsx |
| GOVERNMENT_SUBMISSION | 1k+ signatures reached | PETITION | government-submission.tsx |
| OFFICIAL_RESPONSE | Government response received | PETITION | official-response.tsx |
| WELCOME_TO_MOVEMENT | Ambassador joined | COMMUNITY | welcome-to-movement.tsx |
| WEEKLY_DIGEST | Weekly schedule (Sunday 9 AM) | DIGEST | weekly-digest.tsx |
| AMBASSADOR_UPDATE | Community update published | COMMUNITY | ambassador-update.tsx |
| DONATION_RECEIVED | Donation received | DONATIONS | donation-received.tsx |
| COMMENT_REPLY | Reply to your comment | ENGAGEMENT | comment-reply.tsx |
| SIGNATURE_RECEIVED | New petition signature | ENGAGEMENT | signature-received.tsx |

---

## API Endpoints Reference

### Public Endpoints (No Auth)

```bash
# Track email open (returns 1x1 GIF pixel)
GET /api/v1/email/track/open/:emailLogId/:pixelId

# Track email click (redirects to original URL)
GET /api/v1/email/track/click/:emailLogId/:linkId?redirect=https://example.com

# One-click unsubscribe (no render, just confirms)
GET /api/v1/email/unsubscribe/:userId/:token
```

### User Endpoints (JWT Auth)

```bash
# Get email preferences
GET /api/v1/email/preferences
# Response: { emailEnabled, digestFrequency, mutedTypes, ... }

# Update email preferences
PATCH /api/v1/email/preferences
# Body: { emailEnabled, digestFrequency, mutedTypes, ... }

# Get email history (paginated)
GET /api/v1/email/logs?limit=50&offset=0
# Response: [{ id, recipient, type, status, sentAt, ... }]
```

### Admin Endpoints (EMAIL permission + JWT)

```bash
# Get email statistics
GET /api/v1/admin/email/stats?startDate=2026-05-01&endDate=2026-05-10
# Response: { totalSent, delivered, opened, clicked, bounced, openRate, ... }

# Get queue statistics
GET /api/v1/admin/email/queue-stats
# Response: { queued, active, completed, failed, delayed }

# Verify Resend domain
POST /api/v1/admin/email/verify-domain
# Body: { domain: "track.example.com" }
# Response: { domain, verified, dkimVerified, spfVerified, dmarcVerified }

# Check system health
GET /api/v1/admin/email/health
# Response: { status, message, apiKey, redisConnected, databaseConnected }
```

### Webhook Endpoint

```bash
# Receive Resend events (must be configured in Resend dashboard)
POST /api/v1/webhooks/resend
# Headers: svix-id, svix-timestamp, svix-signature
# Body: { type: 'email.delivered' | 'email.bounced' | ... }
```

---

## Scheduled Tasks

The following tasks run automatically:

| Task | Schedule | Purpose |
|------|----------|---------|
| sendWeeklyDigests() | Every Sunday 9 AM | Send trending petitions email |
| retryFailedEmails() | Every 15 minutes | Retry emails that failed to send |
| cleanupOldEmailLogs() | Daily 2 AM | Delete EmailLog records > 90 days old |
| archiveCompletedJobs() | Daily 3 AM | Clean completed BullMQ jobs > 30 days old |
| generateDailyAnalytics() | Daily midnight | Aggregate daily email statistics |

All tasks run on the API server automatically.

---

## Performance Tips

### For High Volume Sending

1. **Increase BullMQ worker concurrency**:
   ```typescript
   // In email.processor.ts, adjust @Processor options
   @Processor('email-queue', {
     concurrency: 10 // Increase from default
   })
   ```

2. **Optimize Resend API calls**:
   - Batch similar sends together
   - Use sendBulk() instead of individual sendTransactional()
   - Monitor Resend rate limits (100 requests/second)

3. **Monitor Redis memory**:
   ```bash
   # Check Redis memory usage
   redis-cli INFO memory
   
   # If full, increase Redis max-memory
   # or reduce job retention period
   ```

### For Analytics Performance

1. **Use appropriate date ranges** in admin dashboard
2. **Archive old EmailLog records** regularly (automated)
3. **Index custom queries** if adding new analytics
4. **Use database connection pooling** in production

---

## Debugging

### Check BullMQ Queue

```bash
# Connect to Redis
redis-cli

# List all email jobs
KEYS email-queue:*

# Check queue length
LLEN email-queue:queue

# Monitor Redis commands in real-time
MONITOR
```

### Check Email Logs

```sql
-- Get recent emails
SELECT id, recipient, type, status, sentAt, openedAt 
FROM EmailLog 
ORDER BY createdAt DESC 
LIMIT 100;

-- Find failed emails
SELECT * FROM EmailLog WHERE status = 'FAILED' LIMIT 20;

-- Check delivery rate
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END) as delivered,
  ROUND(SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as delivery_rate
FROM EmailLog
WHERE createdAt >= NOW() - INTERVAL 7 days;
```

### Check Application Logs

```bash
# Tail API logs
tail -f apps/api/logs/*.log

# Look for email errors
grep -i "email\|resend\|queue" apps/api/logs/error.log

# Check BullMQ processor logs
grep -i "emailprocessor\|send-email" apps/api/logs/app.log
```

---

## Useful Commands

```bash
# Manually trigger event (from API shell)
this.eventEmitter.emit('user.created', {
  userId: '123',
  email: 'test@example.com',
  fullName: 'Test User'
});

# Force retry of failed emails
await this.emailScheduleService.retryFailedEmails();

# Cleanup old logs manually
await this.emailScheduleService.cleanupOldEmailLogs();

# Send test email
await this.emailService.sendTransactional(
  'test@example.com',
  'test-user-id',
  EmailType.WELCOME,
  { fullName: 'Test' }
);

# Check user preferences
const prefs = await this.prismaService.notificationPreference.findUnique({
  where: { userId: 'user-id' }
});
console.log(prefs);

# Get email stats
const stats = await this.emailTrackingService.getEmailStats(
  new Date('2026-05-01'),
  new Date('2026-05-10')
);
console.log(stats);
```

---

## Getting Help

1. **Check logs**: Look in API server logs for error messages
2. **Review memory files**: See `/memories/session/` for implementation details
3. **Check admin dashboard**: Configuration tab shows system health
4. **Read service docs**: JSDoc comments in service files explain methods
5. **Test with curl**: Call endpoints directly to debug API issues

---

## Key Files

- **Services**: `apps/api/src/email/services/*.ts`
- **Controllers**: `apps/api/src/email/controllers/*.ts`
- **Templates**: `apps/api/src/email/templates/*.tsx`
- **Admin UI**: `apps/web/components/admin-email-settings.tsx`
- **Database**: `apps/api/prisma/schema.prisma`
- **Migrations**: `apps/api/prisma/migrations/`

Happy emailing! 🚀
