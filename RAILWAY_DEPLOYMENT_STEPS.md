# Railway Deployment Steps - Complete Guide

**Target**: Deploy NestJS API to Railway
**Base URL**: https://api.changeliberia.org/ (custom domain)
**Repository**: officialrosha-lab/changeliberia (branch: main)
**Service**: API (apps/api)

---

## 📋 Prerequisites

Before starting, ensure:
- [ ] Railway account (free tier can start here)
- [ ] GitHub account with access to officialrosha-lab/changeliberia
- [ ] PostgreSQL database ready
- [ ] Redis instance available
- [ ] Resend API key configured
- [ ] Environment variables prepared
- [ ] railway.json in root directory ✓

---

## 🚀 Step-by-Step Deployment

### Step 1: Create Railway Project

**Option A: From GitHub (Recommended)**

1. Go to: https://railway.app/
2. Sign in with GitHub
3. Click **"New Project"** (top right)
4. Select **"Deploy from GitHub"**
5. Choose repository: **officialrosha-lab/changeliberia**
6. Select services to add:
   - [x] GitHub repository
   - [x] PostgreSQL (if needed)
   - [x] Redis (if needed)
7. Click **"Deploy"**

**Option B: Using Railway CLI**

```bash
# Install Railway CLI
npm install -g railway

# Login
railway login

# Initialize project
railway init

# Link to GitHub repo
railway link --repo officialrosha-lab/changeliberia

# Deploy
railway up
```

---

### Step 2: Configure Services

**In Railway Dashboard** (https://railway.app/):

1. Find your project: **changeliberia**
2. Click on it to open
3. You should see services:
   - GitHub repository ✓
   - PostgreSQL (if created)
   - Redis (if created)

---

### Step 3: Add Environment Variables

**For API Service**:

1. In Railway dashboard, click on **GitHub** service
2. Go to **Variables** tab
3. Add all required variables:

```bash
# === DATABASE ===
DATABASE_URL=postgresql://user:password@hostname:5432/dbname
# Get from PostgreSQL service info

# === JWT ===
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# === EXTERNAL SERVICES ===
TWILIO_ACCOUNT_SID=ACxxx...
TWILIO_AUTH_TOKEN=xxx...
TWILIO_PHONE_NUMBER=+1xxx...

STRIPE_API_KEY=sk_live_xxx...
STRIPE_WEBHOOK_SECRET=whsec_xxx...

# === EMAIL (Resend) ===
RESEND_API_KEY=re_V39tR44W_PmhRUhmg9k79ZrUpCe6F7AKx
MAIL_FROM=noreply@changeliberia.org
MAIL_REPLY_TO=support@changeliberia.org
RESEND_WEBHOOK_SECRET=whsec_xxx...
EMAIL_PROVIDER=production

# === REDIS ===
REDIS_URL=redis://hostname:6379
# Get from Redis service info

# === OAUTH ===
GOOGLE_OAUTH_CLIENT_ID=xxx...
GOOGLE_OAUTH_CLIENT_SECRET=xxx...
GOOGLE_OAUTH_CALLBACK_URL=https://api.changeliberia.org/auth/google/callback

# === APP URLS ===
NEXT_PUBLIC_API_URL=https://api.changeliberia.org/api/v1
CORS_ORIGIN=https://changeliberia-web.vercel.app
APP_URL=https://api.changeliberia.org
ID_DOCUMENT_PUBLIC_BASE_URL=https://api.changeliberia.org

# === FEATURES ===
OTP_PROVIDER=twilio  # or 'mock' for testing
CAPTCHA_PROVIDER=recaptcha  # or 'mock' for testing
ENABLE_SWAGGER=true
```

4. For each variable, set scope: **Development**, **Staging**, **Production**
5. Click **"Add"** to save

---

### Step 4: Configure PostgreSQL Service

1. In Railway dashboard, find **PostgreSQL** service (or create one)
2. Click on it
3. Go to **Variables** tab
4. Note the connection string:
   ```
   DATABASE_URL=postgresql://...
   ```
5. Click the **copy icon** to copy URL
6. Paste into GitHub service's environment variables

---

### Step 5: Configure Redis Service

1. In Railway dashboard, find **Redis** service (or create one)
2. Click on it
3. Go to **Variables** tab
4. Note the connection URL:
   ```
   REDIS_URL=redis://...
   ```
5. Copy and paste into GitHub service environment variables

---

### Step 6: Add Custom Domain

1. In Railway dashboard, go to your API service (GitHub)
2. Find **Domains** section
3. Click **"Add Custom Domain"**
4. Enter: `api.changeliberia.org`
5. Railway generates DNS instructions
6. Go to your domain provider (Namecheap, GoDaddy, etc.)
7. Add the CNAME record provided by Railway:
   ```
   Type: CNAME
   Name: api
   Value: [value from Railway]
   ```
8. Wait for DNS propagation (5-30 minutes)
9. Back in Railway, click **"Verify Domain"**

---

### Step 7: Deploy

**Automatic Deployment** (Recommended):

Railway auto-deploys on GitHub push:

```bash
# Make changes and push to main
git add .
git commit -m "deployment: api ready for production"
git push origin main

# Railway automatically:
# 1. Detects changes
# 2. Builds Docker image (uses Dockerfile in apps/api/)
# 3. Starts service with npm run start
# 4. Applies health checks
# 5. Routes traffic through custom domain
```

**Manual Deployment**:

1. In Railway dashboard → your API service
2. Look for **"Deploy"** button
3. Click to trigger manual deploy
4. Watch build logs in real-time

---

### Step 8: Monitor Deployment

**Check Build Status**:
1. In Railway dashboard → **Deployments** tab
2. Latest deployment should show:
   - ✅ Building... → Running ✅
   - Build time (typically 3-5 minutes)
   - Start time

**View Logs**:
1. In service details, go to **Logs** tab
2. See real-time output:
   ```
   [NestApplication] Nest application started on port 4000
   [TypeOrmModule] Connected successfully to the database with name 'default'
   ```

**Check Health Endpoint**:
```bash
# Verify API is running
curl https://api.changeliberia.org/health

# Expected response:
# { "status": "ok" }
```

---

## 📊 Deployment Architecture

```
┌─────────────────────────────────────────────┐
│         Railway Dashboard                   │
│  https://railway.app/projects/changeliberia │
├─────────────────────────────────────────────┤
│                                              │
│  ┌──────────────┐  ┌──────────────┐        │
│  │   GitHub     │  │ PostgreSQL   │        │
│  │   Service    │  │   Database   │        │
│  │  (NestJS API)├──┤ (Production) │        │
│  └──────────────┘  └──────────────┘        │
│         ↓                                   │
│  ┌──────────────────────────────────────┐  │
│  │  Custom Domain: api.changeliberia.org│  │
│  └──────────────────────────────────────┘  │
│         ↓                                   │
│  ┌──────────────┐  ┌──────────────┐        │
│  │   Redis      │  │   Resend     │        │
│  │   Cache      │  │   Email API  │        │
│  └──────────────┘  └──────────────┘        │
│                                              │
└─────────────────────────────────────────────┘
```

---

## 🔄 Rollback (If Needed)

If deployment has issues:

1. In Railway dashboard → **Deployments** tab
2. Find previous working deployment (green checkmark)
3. Click **"Redeploy"** button
4. Railway immediately reverts to that version

**Or from GitHub**:
```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Railway auto-detects and re-deploys
```

---

## ✅ Deployment Checklist

Before pushing to production:

- [ ] All environment variables set in Railway
- [ ] DATABASE_URL configured from PostgreSQL
- [ ] REDIS_URL configured from Redis
- [ ] Resend API key added
- [ ] CORS_ORIGIN set to Vercel URL
- [ ] JWT_SECRET updated
- [ ] Custom domain verified (DNS records added)
- [ ] Local build succeeds: `npm run build`
- [ ] No errors in local dev: `npm run dev`
- [ ] Database migrations ready
- [ ] Swagger docs accessible at `/api/docs`
- [ ] Health check passes: `/health` returns 200
- [ ] Email service initialized
- [ ] All services started without errors

---

## 🚨 Common Issues & Fixes

### Issue: "Failed to connect to database"

**Cause**: DATABASE_URL not set or wrong credentials
**Solution**:
1. Get connection string from PostgreSQL service
2. Copy exact URL to Railway environment variables
3. Redeploy: Railway → Deployments → Redeploy

### Issue: "Cannot find module @nestjs/bull"

**Cause**: Dependency not installed
**Solution**:
```bash
cd apps/api
pnpm install @nestjs/bull

# Or update package-lock:
pnpm install --force
git add pnpm-lock.yaml
git commit -m "fix: update dependencies"
git push origin main
```

### Issue: Build timeout

**Cause**: Docker build takes too long
**Solution**:
1. Optimize Dockerfile
2. Cache Docker layers
3. Increase timeout in Railway settings (if available)

### Issue: "Service not healthy" after deployment

**Cause**: Health check endpoint failing
**Solution**:
1. Check logs: Railway → Logs tab
2. Ensure API starts on correct port (4000)
3. Verify health endpoint: `/health` exists
4. Check environment variables are set

### Issue: Domain not resolving

**Cause**: DNS records not propagated
**Solution**:
1. Check DNS records were added correctly
2. Wait 5-30 minutes for propagation
3. Verify with: `nslookup api.changeliberia.org`
4. If still not working, contact domain provider

---

## 📊 Monitoring & Maintenance

### View Service Metrics

1. In Railway dashboard → your API service
2. Go to **Metrics** tab
3. Monitor:
   - CPU usage
   - Memory usage
   - Disk usage
   - Request count
   - Error rate

### Set Up Alerts (Optional)

1. In service details → **Alerts**
2. Create alert for:
   - High CPU (> 80%)
   - High memory (> 85%)
   - Service down
   - Build failures

### View Logs

```bash
# Real-time logs in dashboard
Railway → Logs tab

# Last 100 lines
# Searchable by keyword
```

---

## 🔗 Useful Links

| Link | Purpose |
|------|---------|
| https://railway.app/ | Dashboard |
| https://api.changeliberia.org/ | Live API |
| https://api.changeliberia.org/api/docs | Swagger API docs |
| https://railway.app/docs | Railway docs |
| https://docs.railway.app/guides/deployment | Deployment guide |

---

## ⏭️ Next Steps After Deployment

1. **Verify API Connection**:
   ```bash
   curl https://api.changeliberia.org/health
   # Expected: { "status": "ok" }
   ```

2. **Test API Endpoints**:
   ```bash
   curl https://api.changeliberia.org/api/v1/auth/ping
   ```

3. **Check Swagger Docs**:
   - Go to: https://api.changeliberia.org/api/docs
   - Test endpoints directly from UI

4. **Monitor Logs**:
   - Watch for errors in Railway dashboard
   - Set up alerts for failures

5. **Run Integration Tests**:
   ```bash
   # Test from web app that API is accessible
   npm run test:integration
   ```

6. **Database Backup** (Optional):
   - Set up automated backups in Railway
   - Recommended for production

7. **SSL Certificate**:
   - Railway includes free SSL automatically
   - No additional setup needed
   - HTTPS enabled by default

---

**Status**: Ready to deploy to Railway
**Created**: May 11, 2026
**Version**: 1.0
