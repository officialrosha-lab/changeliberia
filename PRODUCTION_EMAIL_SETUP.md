# Production Email Setup & Domain Verification Guide

**Status**: Complete email system ready for production deployment  
**Current Domain**: changeiliberia.org (staging, verified in Resend)  
**Last Updated**: $(date)

---

## Overview

The Change Liberia email system uses **Resend** for reliable email delivery with:
- Bull + Redis queue for async email delivery
- Email tracking (opens, clicks)
- RBAC-controlled admin endpoints
- Notification preferences per user
- Digest email support (instant/daily/weekly)

---

## 1. Production Checklist

### ✅ Completed
- [x] Email preferences endpoints fixed (JWT auth corrected)
- [x] All admin email endpoints protected with JwtAuthGuard + PermissionGuard
- [x] Staging domain verified: `changeiliberia.org`
- [x] Email tracking system operational
- [x] RBAC authorization implemented

### ⚠️ In Progress
- [ ] Production environment variables configured
- [ ] Production email domain verified in Resend
- [ ] Database migration to production PostgreSQL
- [ ] Redis cluster set up for email queue
- [ ] HTTPS enabled on production domain

---

## 2. Configure Production Environment

### Step 2.1: Create `.env.production`

The template `.env.production` has been created with required variables. Fill in:

```bash
# Database (required)
DATABASE_URL="postgresql://user:password@host:5432/change_liberia_prod"

# Redis (required for email queue)
REDIS_URL="redis://user:password@host:6379"

# JWT Secret (strong random value)
JWT_SECRET="use: openssl rand -base64 32"

# Resend Email Configuration (required)
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxx"  # From https://resend.com/api-keys
MAIL_FROM="noreply@changeiliberia.org"      # Must match verified domain
EMAIL_REPLY_TO="support@changeiliberia.org"

# URLs
APP_URL="https://changeiliberia.org"
NEXT_PUBLIC_API_URL="https://changeiliberia.org/api/v1"
CORS_ORIGIN="https://changeiliberia.org"

# Stripe (use LIVE keys)
STRIPE_API_KEY="sk_live_xxxxxxxxxxxxx"
STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxx"

# Google OAuth
GOOGLE_OAUTH_CLIENT_ID="your-client-id"
GOOGLE_OAUTH_CLIENT_SECRET="your-client-secret"
GOOGLE_OAUTH_CALLBACK_URL="https://changeiliberia.org/auth/google/callback"
```

### Step 2.2: Deploy Configuration

**Option A: Vercel (Recommended)**
```bash
# Set environment variables in Vercel dashboard
# Project Settings > Environment Variables
# Set NODE_ENV="production" for production deployment
```

**Option B: Railway / Self-hosted**
```bash
# Create .env.production in deployment environment
# Ensure sensitive values are provided as deployment secrets
# NOT committed to version control
```

### Step 2.3: Validate Configuration

```bash
# Test that production config loads without errors
NODE_ENV=production npm run build

# Check validation passes
NODE_ENV=production node -e "require('./dist/config/env-validation.js').validateEmailEnvOrThrow()"
```

---

## 3. Email Domain Verification

### Current Status: Staging Domain Verified ✅

**Verified Domain**: `changeiliberia.org`
- Status: VERIFIED in Resend dashboard
- SPF Record: Configured ✓
- DKIM Record: Configured ✓
- CNAME Record: Configured ✓

### Step 3.1: Add Production Domain to Resend

1. **Log in to Resend Dashboard**: https://resend.com/domains
2. **Click "Add Domain"**
3. **Enter your production domain** (e.g., `mail.changeiliberia.org` or `changeiliberia.org`)
4. **Copy the DNS records** Resend provides

### Step 3.2: Configure DNS Records

Add these records at your DNS provider (e.g., AWS Route53, Cloudflare, GoDaddy):

#### SPF Record
```
Type: TXT
Name: changeiliberia.org (or subdomain)
Value: v=spf1 include:resend.com ~all
TTL: 3600
```

#### DKIM Record
```
Type: CNAME
Name: resend._domainkey.changeiliberia.org
Value: [CNAME value from Resend]
TTL: 3600
```

#### Return Path CNAME (Optional)
```
Type: CNAME
Name: bounce.changeiliberia.org
Value: bounce.resend.com
TTL: 3600
```

### Step 3.3: Verify Domain in Resend

1. **In Resend dashboard**, click "Verify" for your domain
2. **Wait 5-10 minutes** for DNS propagation
3. **Status should change to VERIFIED**

### Step 3.4: Update Configuration

Once domain is verified, update production environment:

```bash
MAIL_FROM="noreply@changeiliberia.org"  # Match verified domain
RESEND_API_KEY="re_xxxxxxxxxxxxx"        # Your Resend API key
```

---

## 4. Email Queue Setup (Redis)

The email system uses Bull + Redis for async delivery. You must have a Redis instance.

### Option A: Managed Redis (Recommended)
- **Railway**: https://railway.app (free tier includes Redis)
- **AWS ElastiCache**
- **DigitalOcean App Platform**

### Option B: Self-hosted Redis
```bash
# Docker compose example
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"
  volumes:
    - redis_data:/data

# Set in production:
REDIS_URL="redis://user:password@redis-host:6379"
```

### Verify Redis Connection
```bash
# Test from production server
redis-cli -u redis://user:password@host:6379 PING
# Should return: PONG
```

---

## 5. Database Setup

### PostgreSQL Production Database

Use a managed service:
- **Railway**: https://railway.app
- **AWS RDS**
- **Azure Database for PostgreSQL**
- **DigitalOcean Managed Database**

### Run Migrations

```bash
# In production environment
NODE_ENV=production npx prisma migrate deploy

# Seed admin user if needed
NODE_ENV=production npx ts-node scripts/seed-admin.ts
```

---

## 6. HTTPS & Security

### Enable HTTPS

1. **Obtain SSL Certificate**
   - Vercel: Automatic (free)
   - Railway: Automatic (free)
   - Self-hosted: Use Let's Encrypt (Certbot)

2. **Update Configuration**
   ```bash
   # Ensure HTTPS URLs
   APP_URL="https://changeiliberia.org"
   NEXT_PUBLIC_API_URL="https://changeiliberia.org/api/v1"
   CORS_ORIGIN="https://changeiliberia.org"
   ```

3. **Test HTTPS**
   ```bash
   curl -I https://changeiliberia.org/api/v1/health
   # Should return 200 OK with HTTPS
   ```

### Security Headers

Add security headers in API configuration:

```typescript
// apps/api/src/main.ts
app.use((req, res, next) => {
  res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('X-XSS-Protection', '1; mode=block');
  next();
});
```

---

## 7. Test Production Deployment

### 7.1: Health Check
```bash
curl -I https://changeiliberia.org/api/v1/health
# Should return 200 OK
```

### 7.2: Authentication Test
```bash
# Get JWT token
JWT=$(curl -s -X POST https://changeiliberia.org/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"+231...","password":"..."}' | jq -r .accessToken)

# Test admin email endpoint
curl -I -H "Authorization: Bearer $JWT" \
  https://changeiliberia.org/api/v1/email/health
# Should return 200 OK
```

### 7.3: Send Test Email
```bash
curl -X POST https://changeiliberia.org/api/v1/email/admin/send-test \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","subject":"Test","body":"Test message"}'
```

### 7.4: Verify Email Delivery

1. Check Resend dashboard: https://resend.com/emails
2. Verify email received in inbox
3. Track opens/clicks in dashboard

---

## 8. Monitoring & Maintenance

### Monitor Email Queue

```bash
# Check Bull queue status
GET /api/v1/email/admin/queue-stats
# Response: { name: "email-queue", count: 0, delayed: 0, failed: 0, ... }
```

### Monitor Email Logs

```bash
# Check recent email logs
GET /api/v1/email/logs?limit=50&offset=0
# Response: [ { id, to, subject, status, openedAt, clickedAt, ... } ]
```

### Alert Rules

Set up alerts for:
- Email queue failures > 10 failed emails
- Redis connection lost
- Database connection errors
- SMTP/Resend API errors

### Resend Dashboard Monitoring

- **https://resend.com/emails**: View all sent emails
- **Delivery Status**: Track bounces, failures
- **Domain Health**: Monitor SPF/DKIM/CNAME verification
- **Logs**: View detailed delivery logs

---

## 9. Troubleshooting

### Email Preferences Endpoint Returns 500

**Fixed in commit b862989** - JWT claim extraction was using `req.user.sub` instead of `req.user.userId`.

If still occurring:
```bash
# Check API logs
NODE_ENV=production pm2 logs api

# Verify JWT token contains userId claim
curl -s http://localhost:4000/api/v1/email/preferences \
  -H "Authorization: Bearer $JWT" | jq .
```

### Email Not Sending

1. **Check Resend API key**
   ```bash
   curl -H "Authorization: Bearer $RESEND_API_KEY" \
     https://api.resend.com/emails
   ```

2. **Verify domain is verified**
   - Log in to Resend dashboard
   - Check domain status = VERIFIED

3. **Check Redis connection**
   ```bash
   redis-cli -u $REDIS_URL PING
   # Should return PONG
   ```

4. **Check email queue**
   ```bash
   GET /api/v1/email/admin/queue-stats
   # Look for failed count
   ```

### Domain Not Verified in Resend

1. **Check DNS records are correctly configured**
   ```bash
   dig changeiliberia.org TXT  # Should show SPF record
   dig resend._domainkey.changeiliberia.org CNAME  # Should show CNAME
   ```

2. **Wait for DNS propagation**
   - Can take up to 24 hours
   - Check status: https://mxtoolbox.com

3. **Resend re-verification**
   - In Resend dashboard, click "Verify" again
   - Wait 5-10 minutes

---

## 10. Deployment Platforms

### Recommended: Vercel + Railway

**Frontend (Vercel)**
- Next.js 16.2.3 deployment
- Automatic SSL
- Environment variables in dashboard
- Free tier available

**Backend (Railway)**
- NestJS API deployment
- PostgreSQL database included
- Redis cache included
- Automatic deployments from Git

**Setup Steps**:
1. Push code to GitHub
2. Connect to Vercel (frontend) - auto deploys on push
3. Connect to Railway (backend) - auto deploys on push
4. Set environment variables in each platform
5. Configure custom domain in Vercel dashboard

### Alternative: Docker + Self-hosted

**Dockerfile exists** at `apps/api/Dockerfile`

```bash
# Build and run with docker-compose
docker-compose -f docker-compose.yml up -d

# Check logs
docker-compose logs -f api
```

---

## 11. Production Readiness Checklist

- [ ] `.env.production` configured with all required values
- [ ] Production PostgreSQL database created and migrated
- [ ] Redis cluster deployed and accessible
- [ ] Email domain added to Resend
- [ ] Domain DNS records configured (SPF, DKIM, CNAME)
- [ ] Domain verified in Resend dashboard (status = VERIFIED)
- [ ] RESEND_API_KEY set in production environment
- [ ] HTTPS enabled on production domain
- [ ] JWT_SECRET set to strong random value
- [ ] CORS_ORIGIN points to production domain
- [ ] Health check endpoint returns 200
- [ ] Admin email endpoints protected and accessible
- [ ] Test email sent and delivered successfully
- [ ] Email logs endpoint accessible
- [ ] Monitoring alerts configured
- [ ] Backup strategy implemented for database

---

## 12. Rollback Procedures

If issues occur in production:

### 1. Email Sending Failures
```bash
# Stop email processing
curl -X POST /api/v1/email/admin/pause-queue

# Check failed emails
GET /api/v1/email/admin/queue-stats

# Fix underlying issue, then resume
curl -X POST /api/v1/email/admin/resume-queue
```

### 2. Database Issues
```bash
# Rollback to previous migration
NODE_ENV=production npx prisma migrate resolve --rolled-back <migration-name>
NODE_ENV=production npx prisma migrate deploy
```

### 3. Deployment Rollback
- **Vercel**: Click "Rollback" in Deployments
- **Railway**: Select previous deployment version
- **Manual**: Re-deploy previous git commit

---

## 13. Support & Documentation

- **Resend Docs**: https://resend.com/docs
- **Email System Reference**: See CMS_TECHNICAL_REFERENCE.md
- **API Documentation**: `GET /api/v1/docs` (Swagger)
- **Email Admin Endpoints**: See ADMIN_API_DOCUMENTATION.md

---

**Next Steps**:
1. Fill in `.env.production` with actual production values
2. Add production domain to Resend dashboard
3. Configure DNS records at your DNS provider
4. Verify domain in Resend (wait for VERIFIED status)
5. Test email sending from production environment
6. Monitor delivery via Resend dashboard

**Questions?** Check the email system logs:
```bash
NODE_ENV=production pm2 logs api | grep -i email
```
