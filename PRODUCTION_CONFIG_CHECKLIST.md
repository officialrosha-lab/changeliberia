# Production Configuration Checklist

This document provides step-by-step instructions to configure `.env.production` with all required production credentials.

## 📋 Pre-Configuration Requirements

- [ ] Have access to all production service dashboards (Resend, Stripe, Railway/RDS, Redis, etc.)
- [ ] Domain `changeiliberia.org` is registered and configured
- [ ] SSL/TLS certificate is available (auto-provisioned by hosting platform)
- [ ] Git access to repository

---

## 1. 🗄️ Database Configuration (PostgreSQL)

### Option A: Railway (Recommended for simplicity)
1. Create project on [Railway.app](https://railway.app)
2. Add PostgreSQL plugin
3. View Variables: Copy `DATABASE_URL` value
4. Update `.env.production`:
   ```
   DATABASE_URL="postgresql://user:password@host:5432/change_liberia_prod"
   ```

### Option B: AWS RDS
1. Create RDS PostgreSQL instance
2. Wait for availability (~10 minutes)
3. Get endpoint from RDS console
4. Create database user and password
5. Format URL:
   ```
   DATABASE_URL="postgresql://username:password@your-rds-endpoint:5432/change_liberia_prod"
   ```

### Option C: Vercel PostgreSQL
1. Log in to Vercel project dashboard
2. Go to Storage → Create Database
3. Select PostgreSQL
4. Copy connection string

**After setting DATABASE_URL:**
- [ ] Run migrations: `pnpm --filter api db:migrate:deploy`
- [ ] Seed database: `pnpm --filter api db:seed` (if needed)

---

## 2. 🔴 Redis Configuration (Email Queue Backend)

### Option A: Railway
1. In Railway project, add Redis plugin
2. View Variables: Copy `REDIS_URL`
3. Update `.env.production`:
   ```
   REDIS_URL="redis://user:password@host:6379"
   ```

### Option B: Upstash (Serverless Redis)
1. Go to [Upstash.com](https://upstash.com)
2. Create Redis database (free tier available)
3. Copy Redis URL: `redis://...`
4. Update `.env.production`

### Option C: AWS ElastiCache
1. Create ElastiCache Redis cluster
2. Get endpoint URL
3. Configure security group to allow API access

**Validate connection:**
```bash
redis-cli -u "$REDIS_URL" ping
# Should return: PONG
```

---

## 3. 📧 Email Configuration (Resend)

### Required: Verify Production Domain in Resend

**Current Status:** Staging domain `changeiliberia.org` is already VERIFIED ✅

### For Production (if different domain):
1. Log in to [Resend Dashboard](https://resend.com/domains)
2. Click **+ Add Domain**
3. Enter production domain (e.g., `mail.changeiliberia.org`)
4. Copy DNS records (SPF, DKIM, CNAME)
5. Add records at your domain provider
6. Wait 5-10 minutes for DNS propagation
7. Click **Verify** in Resend
8. Wait for VERIFIED status ✓

### Get API Key:
1. Go to [Resend API Keys](https://resend.com/api-keys)
2. Create new API key
3. Copy key (format: `re_*`)
4. **Security:** Never commit API key to Git

### Update `.env.production`:
```
RESEND_API_KEY="re_your_actual_api_key_here"
MAIL_FROM="noreply@changeiliberia.org"  # Must match verified domain
EMAIL_REPLY_TO="support@changeiliberia.org"
```

**Test email sending:**
```bash
curl -X POST "https://api.resend.com/emails" \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "noreply@changeiliberia.org",
    "to": "test@example.com",
    "subject": "Test",
    "html": "<p>Test email</p>"
  }'
```

---

## 4. 🔐 Authentication & Security

### Generate JWT Secret (32+ characters):
```bash
openssl rand -base64 32
# Output: aB3dE1fG9hJkLmN0pQrStUvWxYz+/==
```

Copy output and update `.env.production`:
```
JWT_SECRET="aB3dE1fG9hJkLmN0pQrStUvWxYz+/=="
JWT_EXPIRES_IN="7d"
```

**Security Notes:**
- [ ] JWT_SECRET must be 32+ characters
- [ ] Use cryptographically secure random generation
- [ ] Never use same secret as development
- [ ] Rotate JWT_SECRET if compromised

---

## 5. 🎯 Stripe Payment Processing (Optional but Recommended)

### Get Production Credentials:
1. Log in to [Stripe Dashboard](https://dashboard.stripe.com)
2. Switch to **Production** mode (toggle at top)
3. Go to **API Keys**
4. Copy **Publishable Key** (starts with `pk_live_`)
5. Copy **Secret Key** (starts with `sk_live_`)

### Create Webhook Endpoint:
1. Go to **Webhooks** section
2. Add endpoint: `https://changeiliberia.org/api/v1/webhooks/stripe`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy **Signing Secret** (starts with `whsec_`)

### Update `.env.production`:
```
STRIPE_API_KEY="sk_live_your_secret_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"
FRAUD_RISK_ALERT_THRESHOLD="0.35"
```

**Test Stripe integration:**
```bash
# Use test card: 4242 4242 4242 4242
# Expiry: any future date (e.g., 12/25)
# CVC: any 3 digits
```

---

## 6. 🔑 Google OAuth Integration

### Setup Google Cloud Console:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project (create if needed: "Change Liberia")
3. Enable APIs:
   - Google+ API
   - Google Identity Service
4. Go to **Credentials**
5. Create **OAuth 2.0 Client ID**
   - Type: Web Application
   - Authorized redirect URIs: `https://changeiliberia.org/auth/google/callback`

### Get Credentials:
- **Client ID** (in OAuth 2.0 Client IDs list)
- **Client Secret** (in OAuth 2.0 Client IDs list)

### Update `.env.production`:
```
GOOGLE_OAUTH_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_OAUTH_CLIENT_SECRET="your-client-secret"
GOOGLE_OAUTH_CALLBACK_URL="https://changeiliberia.org/auth/google/callback"
NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
```

---

## 7. 🌐 API & Frontend Configuration

Update with production domain:
```
APP_URL="https://changeiliberia.org"
NEXT_PUBLIC_API_URL="https://changeiliberia.org/api/v1"
CORS_ORIGIN="https://changeiliberia.org"
API_URL_INTERNAL="http://api:4000/api/v1"  # If containerized
ID_DOCUMENT_PUBLIC_BASE_URL="https://changeiliberia.org"
```

---

## 8. 📝 Optional: Twilio SMS (if using SMS OTP)

1. Sign up at [Twilio.com](https://twilio.com)
2. Get **Account SID** and **Auth Token** from console
3. Get or create phone number
4. Update `.env.production`:
```
TWILIO_ACCOUNT_SID="your-account-sid"
TWILIO_AUTH_TOKEN="your-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"
OTP_PROVIDER="twilio"  # or "mock" for disabled
```

---

## 9. 📝 Optional: Captcha (hCaptcha or Turnstile)

### Option A: Turnstile (Cloudflare)
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select site → Security → Turnstile
3. Create widget, copy keys
4. Update `.env.production`:
```
CAPTCHA_PROVIDER="turnstile"
NEXT_PUBLIC_TURNSTILE_SITE_KEY="your-site-key"
TURNSTILE_SECRET_KEY="your-secret-key"
```

### Option B: hCaptcha
1. Go to [hCaptcha Dashboard](https://dashboard.hcaptcha.com)
2. Create new site, copy keys
3. Update `.env.production`:
```
CAPTCHA_PROVIDER="hcaptcha"
HCAPTCHA_SECRET_KEY="your-secret-key"
```

---

## 10. 📁 File Upload Configuration

Update upload directory (ensure directory exists and API has write permission):
```
ID_DOCUMENT_UPLOAD_DIR="/var/lib/change-liberia/uploads"
```

Or use S3/cloud storage (future enhancement).

---

## 11. ✅ Final Verification

Before deploying, verify all critical values are set:

```bash
# Check .env.production file
cat .env.production | grep -E '^[A-Z_]+=.*' | grep -v '^#' | wc -l

# Should output non-empty values for:
# - DATABASE_URL ✓
# - REDIS_URL ✓
# - RESEND_API_KEY ✓
# - JWT_SECRET ✓
# - STRIPE_API_KEY ✓ (if using payments)
```

**Validation checklist:**
- [ ] DATABASE_URL contains valid PostgreSQL connection string
- [ ] REDIS_URL contains valid Redis connection string
- [ ] RESEND_API_KEY starts with `re_`
- [ ] STRIPE_API_KEY starts with `sk_live_`
- [ ] JWT_SECRET is 32+ characters
- [ ] All domain URLs use `https://` (except internal)
- [ ] No localhost URLs in production config
- [ ] No commented-out placeholder values remain

---

## 12. 🚀 Deployment

After filling in all values:

1. **Commit to Git (never push secrets):**
   ```bash
   git add .env.production
   git commit -m "chore: add production environment configuration"
   # But FIRST verify no secrets are committed!
   ```

2. **Set secrets in deployment platform:**
   - Railway: Set environment variables in project settings
   - Vercel: Add to Settings → Environment Variables
   - Docker: Mount as secret volume or pass via docker run

3. **Run migrations on production:**
   ```bash
   DATABASE_URL="your-production-url" pnpm --filter api db:migrate:deploy
   ```

4. **Deploy application:**
   - Follow platform-specific deployment instructions
   - Run health checks to verify all services online

---

## 🔗 Helpful Links

- [Resend Documentation](https://resend.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Stripe Documentation](https://docs.stripe.com)
- [Google OAuth Documentation](https://developers.google.com/identity)
- [Environment Validation](./apps/api/src/config/env-validation.ts)

---

## ⚠️ Security Reminders

- ✅ Never commit `.env.production` with real secrets to public repos
- ✅ Use `.gitignore` to prevent accidental commits
- ✅ Rotate secrets immediately if leaked
- ✅ Use dedicated service accounts for production
- ✅ Enable 2FA on all external service accounts
- ✅ Audit API key permissions (least privilege principle)

---

**Status:** Ready for configuration
**Last Updated:** May 27, 2026
