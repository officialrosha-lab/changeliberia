# Production Deployment Quick Reference

## Email System Status

✅ **All endpoints functional and tested**
- Email preferences: GET/PATCH working
- Admin endpoints: Protected with RBAC
- Email tracking: Operational
- Resend integration: Verified with staging domain

## Critical Production Setup Steps

### 1. Environment Variables (Required)
```bash
# Fill in .env.production with:
DATABASE_URL                    # Production PostgreSQL
REDIS_URL                       # Production Redis cluster
JWT_SECRET                      # Strong random (openssl rand -base64 32)
RESEND_API_KEY                 # From https://resend.com/api-keys (re_*)
MAIL_FROM                      # noreply@changeiliberia.org (verified domain)
STRIPE_API_KEY                 # Live key (sk_live_*)
```

### 2. Email Domain in Resend (Required)
```bash
# Steps:
1. https://resend.com/domains - Add production domain
2. Copy DNS records (SPF, DKIM, CNAME)
3. Add records at DNS provider
4. Click Verify in Resend (wait for VERIFIED status)
5. Update MAIL_FROM to match verified domain
```

### 3. Deploy to Production
```bash
# Option A: Vercel + Railway
# - Push to GitHub
# - Vercel deploys frontend automatically
# - Railway deploys API automatically

# Option B: Docker
# docker-compose -f docker-compose.yml up -d

# Option C: Manual
# NODE_ENV=production npm run build && npm start
```

### 4. Verify Deployment
```bash
# Health check
curl https://changeiliberia.org/api/v1/health

# Test JWT auth
JWT=$(curl -X POST https://changeiliberia.org/api/v1/auth/login \
  -H "Content-Type: application/json" -d '{"phone":"...","password":"..."}' | jq -r .accessToken)

# Test email preferences endpoint
curl -H "Authorization: Bearer $JWT" \
  https://changeiliberia.org/api/v1/email/preferences
# Should return 200 with preferences object
```

## Email Endpoints (All Protected with JwtAuthGuard)

### User Endpoints
```
GET    /api/v1/email/preferences         # Get user preferences
PATCH  /api/v1/email/preferences         # Update preferences
GET    /api/v1/email/logs                # Get user email logs
```

### Admin Endpoints (Require EMAIL:READ or EMAIL:UPDATE permissions)
```
GET    /api/v1/email/admin/health        # Service health
GET    /api/v1/email/admin/stats         # Email statistics
GET    /api/v1/email/admin/queue-stats   # Queue status
POST   /api/v1/email/admin/verify-domain # Verify Resend domain
POST   /api/v1/email/admin/send-test     # Send test email
```

## Common Issues & Fixes

### Email Preferences Returns 500
**Fixed** in commit b862989 - JWT claim extraction now uses `req.user.userId`

### Domain Not Verified in Resend
1. Check DNS records are configured
2. Wait 5-10 minutes for propagation
3. Use https://mxtoolbox.com to verify
4. Click "Verify" again in Resend dashboard

### Email Not Sending
1. Verify RESEND_API_KEY is set (format: re_*)
2. Verify MAIL_FROM matches verified domain
3. Check Redis connection: `redis-cli -u $REDIS_URL PING`
4. Check queue: `GET /api/v1/email/admin/queue-stats`

## Monitoring

**Resend Dashboard**
- https://resend.com/emails - View all sent emails
- https://resend.com/domains - Check domain verification status
- Monitor delivery status, bounces, opens, clicks

**API Health**
```bash
GET /api/v1/email/admin/stats
GET /api/v1/email/admin/queue-stats
```

## Rollback

If issues occur:
1. Vercel: Click "Rollback" in Deployments tab
2. Railway: Select previous deployment
3. Check logs: `NODE_ENV=production pm2 logs api`

## Key Configuration Files

- `.env.production` - Production environment variables (NOT in git)
- `apps/api/src/config/env-validation.ts` - Production validation rules
- `apps/api/src/email/providers/resend.provider.ts` - Resend integration
- `apps/api/src/email/controllers/email.controller.ts` - Email endpoints

## Deployment Checklist

- [ ] `.env.production` configured with all values
- [ ] PostgreSQL database created and migrated
- [ ] Redis cluster deployed
- [ ] Email domain added to Resend
- [ ] DNS records configured (SPF, DKIM)
- [ ] Domain verified in Resend (VERIFIED status)
- [ ] HTTPS enabled
- [ ] Health check passes
- [ ] Test email sent and delivered
- [ ] Monitoring alerts configured
- [ ] Backup strategy in place

## Support

- Full docs: PRODUCTION_EMAIL_SETUP.md
- API docs: GET /api/v1/docs (Swagger)
- Email system: CMS_TECHNICAL_REFERENCE.md
