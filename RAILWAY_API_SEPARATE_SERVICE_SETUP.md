# Railway API Service Setup - Option A (RECOMMENDED)

## Overview
Deploy the API as a **separate Railway service** from the frontend. This provides:
- ✅ Independent scaling for API and frontend
- ✅ Separate environment configurations
- ✅ Better performance isolation
- ✅ Easier debugging and monitoring
- ✅ Standard microservices architecture

---

## Prerequisites

✅ **Already in place:**
- `railway.json` configured for API deployment
- Docker setup with `apps/api/Dockerfile`
- Frontend configured to accept `API_SERVICE_URL` environment variable
- Git repository ready

---

## Step-by-Step Setup

### STEP 1: Go to Railway Dashboard
1. Open https://railway.app/dashboard
2. Sign in with your GitHub account
3. Select your **Change Liberia** project (or create new if needed)

### STEP 2: Create New Service for API

#### Option A: From GitHub (Recommended)
1. Click **+ Create** button
2. Select **GitHub Repo**
3. Select `officialrosha-lab/changeliberia` repository
4. Choose the repo
5. Name it: `change-liberia-api` (or similar)
6. Leave "Dockerfile" selected (it will auto-detect `apps/api/Dockerfile`)
7. Click **Deploy**

#### Option B: From Template (if needed)
1. Click **+ Create**
2. Select **Docker**
3. Connect your GitHub repo manually if needed

### STEP 3: Configure Build Settings

After service is created:

1. Go to **Service Settings** (gear icon)
2. Under **Builder**:
   - Ensure **Dockerfile** is selected
   - Path should be: `apps/api/Dockerfile`
   - Root Directory: `/` (monorepo root)

3. Under **Deploy**:
   - Start Command: `node dist/src/main.js`
   - Health Check Path: `/health`
   - Health Check Timeout: 300
   - Restart Policy: ON_FAILURE (max 3 retries)

**Save these settings**

### STEP 4: Set Environment Variables

Click on **Variables** tab and add these critical variables:

```
NODE_ENV = production
JWT_SECRET = [your-strong-secret-key]
DATABASE_URL = [your-production-postgres-url]
STRIPE_API_KEY = sk_live_[your-stripe-key]
STRIPE_WEBHOOK_SECRET = whsec_[your-webhook-secret]
EMAIL_PROVIDER = resend
RESEND_API_KEY = re_[your-resend-key]
MAIL_FROM = noreply@changeliberia.org
MAIL_REPLY_TO = support@changeliberia.org
REDIS_URL = [your-redis-url]
TRACKING_DOMAIN = track.changeliberia.org
CORS_ORIGIN = https://changeliberia.org,https://www.changeliberia.org
PORT = 4000
```

**Reference for sensitive values:**
- Get from your `.env.production` file in the repo root
- Or from previous Railway service if migrating

**Save Variables**

### STEP 5: Get Your API URL

After deployment completes:

1. Go to your API service page
2. Look for the **Public URL** (top right or Overview tab)
3. It will look like: `https://api-xyz123.railway.app`
4. **Copy this URL** - you'll need it for frontends

Example format:
```
https://change-liberia-api-prod.railway.app
```

### STEP 6: Wait for Successful Deployment

1. Check the **Deploy** tab for build status
2. Wait for: ✅ **Build Successful**
3. Check logs for any errors:
   - Click **Logs** tab
   - Look for error messages in stdout/stderr
   - Common issues:
     - `Database connection failed` → Check DATABASE_URL
     - `Missing JWT_SECRET` → Add environment variable
     - `Port already in use` → Railway should auto-assign PORT

4. Once logs show the API is running, test the health endpoint:
   ```bash
   curl https://[your-api-url]/health
   # Should return: {"status":"ok"}
   ```

---

## Step 7: Update Frontends with API URL

Your frontend is already configured to use the `API_SERVICE_URL` environment variable.

### For the Main Frontend (apps/web):

1. **Create a new Railway service for frontend** (follow same process)
   - Use `apps/web/Dockerfile` (if exists) or select Next.js template
   - Or deploy to Vercel (easier for Next.js)

2. **Set environment variable on frontend service:**
   ```
   NEXT_PUBLIC_API_URL = https://[your-api-url]/api/v1
   ```
   
   Where `[your-api-url]` is from Step 5
   
   Example:
   ```
   NEXT_PUBLIC_API_URL = https://change-liberia-api-prod.railway.app/api/v1
   ```

3. **Save and redeploy frontend**

### For Admin Frontend (if separate):
If you have a separate admin frontend, set the same variable:
```
NEXT_PUBLIC_API_URL = https://[your-api-url]/api/v1
```

---

## Verification Checklist

After all deployments complete, verify everything works:

### ✅ API Health Check
```bash
curl https://[your-api-url]/health
# Expected response: {"status":"ok"}
```

### ✅ API Connection from Frontend
1. Open your frontend URL
2. Open browser Developer Tools (F12)
3. Go to **Network** tab
4. Try an action that calls the API (login, create petition, etc.)
5. Look for API requests to `[your-api-url]/api/v1/*`
6. Should see 200/201 status codes (not 404/500)

### ✅ Test Full Flow
1. **Sign up** on frontend
2. **Create a petition**
3. **View petitions list** (should show your test petition)
4. **Test admin panel** (if applicable)

---

## Environment Variables Reference

### Critical (Must Have)
| Variable | Example | Notes |
|----------|---------|-------|
| `NODE_ENV` | `production` | Required for build optimization |
| `JWT_SECRET` | `your-secret-key` | Min 32 chars, use strong random |
| `DATABASE_URL` | `postgres://user:pass@host:5432/db` | PostgreSQL connection |

### Email/Communications
| Variable | Example | Notes |
|----------|---------|-------|
| `EMAIL_PROVIDER` | `resend` | Options: resend, sendgrid, smtp |
| `RESEND_API_KEY` | `re_abc123...` | For Resend email service |
| `MAIL_FROM` | `noreply@changeliberia.org` | Verified domain in Resend |

### Payments (if enabled)
| Variable | Example | Notes |
|----------|---------|-------|
| `STRIPE_API_KEY` | `sk_live_...` | Live key for production |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | For webhook verification |

### Caching/Queues
| Variable | Example | Notes |
|----------|---------|-------|
| `REDIS_URL` | `redis://host:6379` | For BullMQ, sessions, caching |

### CORS/Security
| Variable | Example | Notes |
|----------|---------|-------|
| `CORS_ORIGIN` | `https://changeliberia.org,https://www.changeliberia.org` | Comma-separated frontend URLs |

---

## Troubleshooting

### API Service Won't Start
**Symptom:** Build fails or service crashes immediately

**Solutions:**
1. Check logs: `Click Logs tab → Look for error messages`
2. Verify DATABASE_URL is correct
3. Ensure JWT_SECRET is set
4. Check that Docker build succeeds locally:
   ```bash
   docker build -f apps/api/Dockerfile -t change-liberia-api:test .
   ```

### Frontend Can't Connect to API
**Symptom:** Network errors in browser console, API requests 404

**Solutions:**
1. Verify NEXT_PUBLIC_API_URL is set on frontend service
2. Check it matches your API service URL from Railway
3. Verify API service is running (check health endpoint)
4. Check CORS settings in API (should allow frontend domain)

### Database Migrations Fail
**Symptom:** Logs show "Migration pending" error

**Solutions:**
1. The `start` script in package.json runs migrations automatically
2. If stuck, manually run in Railway terminal:
   ```bash
   npx prisma migrate deploy
   ```
3. Or mark migration as resolved:
   ```bash
   npx prisma migrate resolve --applied <migration-name>
   ```

### Email Not Sending
**Symptom:** Email service errors in logs

**Solutions:**
1. Verify RESEND_API_KEY is correct
2. Check MAIL_FROM domain is verified in Resend
3. Look for specific error messages in logs
4. Test with: `curl -X POST https://[api-url]/api/v1/email/test`

---

## Production Deployment Checklist

Before going live:

- [ ] API service deployed and healthy on Railway
- [ ] Database migrations completed without errors
- [ ] All environment variables set correctly
- [ ] Frontend service has correct NEXT_PUBLIC_API_URL
- [ ] Health endpoint responding: `/health` → `{"status":"ok"}`
- [ ] Test user signup/login flow end-to-end
- [ ] Monitor logs for first 24 hours
- [ ] Set up automated backups for database
- [ ] Enable monitoring/alerts on Railway

---

## Next Steps After Successful Deployment

1. **Set Custom Domain** (Optional)
   - In Railway service settings, add custom domain
   - Point DNS records to Railway
   - Update CORS_ORIGIN with custom domain

2. **Enable Auto-Deployments**
   - Railway auto-deploys on git push
   - Verify this is enabled in your project settings

3. **Set Up Monitoring**
   - Enable Railway's built-in monitoring
   - Set up alerts for failures

4. **Database Backups**
   - Configure daily backups if using Railway's PostgreSQL
   - Or ensure your external database has backups

5. **Documentation**
   - Keep API URL in team docs
   - Document any custom environment variables
   - Create runbooks for common troubleshooting

---

## Cost Estimation

For small to medium traffic:
- **API Service**: ~$5-15/month (depending on CPU/RAM)
- **Frontend Service**: ~$5-10/month
- **PostgreSQL** (if Railway-hosted): ~$15-50/month
- **Redis** (if Railway-hosted): ~$10-15/month

**Total**: ~$35-90/month for production-grade infrastructure

---

## Support Resources

- Railway Docs: https://docs.railway.app/
- NestJS Docs: https://docs.nestjs.com/
- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs/

---

## Success Indicators

✅ Everything is working when you see:
1. API health endpoint returns 200
2. Frontend can load without console errors
3. User signup completes without API errors
4. Created petitions appear in database
5. Email notifications send successfully (if configured)
6. Admin panel can fetch and display data

