# Railway API Backend Deployment - Step by Step

## Overview
You'll create a **NEW Railway service** that runs only the NestJS backend API. The frontend (changeliberia.org) will communicate with this separate API service.

---

## Step 1: Log in to Railway Dashboard

1. Go to: **https://railway.app/dashboard**
2. Click on your **Change Liberia project**
3. You should see existing services (database, redis, etc.)

---

## Step 2: Create New Service for API Backend

### Method A: From GitHub (RECOMMENDED)

1. Click **"New"** button → **"Service"**
2. Select **"GitHub Repo"**
3. Choose the branch: **`officialrosha-lab/changeliberia`**
4. Railway will automatically detect `railway.json` in the root
5. Click **"Deploy"**

### Method B: From Dockerfile

1. Click **"New"** → **"Service"**
2. Select **"Dockerfile"**
3. Point to: `apps/api/Dockerfile`
4. Click **"Deploy"**

---

## Step 3: Configure Environment Variables

Once the service is created, go to **Settings → Variables** and add these:

```
NODE_ENV=production
DATABASE_URL=postgresql://postgres:TmYbbaDnOKeKQMHENYiHwXQAdybmVcSJ@monorail.proxy.rlwy.net:35769/railway
REDIS_URL=redis://default:nrAEBUqvMsoIzkSXhyJdwNywjENRnPie@zephyr.proxy.rlwy.net:16708
RESEND_API_KEY=re_3puwiQi1_DPNqBm1WSYbVe6SCWBw9QuKS
MAIL_FROM=noreply@changeliberia.org
JWT_SECRET=ikhAQpkucj+uRwKrNUbWY4jIEy2TsRtGnJagu7jpkCA=
CORS_ORIGIN=https://changeliberia.org,https://changeliberia-web.vercel.app,http://localhost:3000
PORT=4000
ENABLE_SWAGGER=true
```

---

## Step 4: Wait for Deployment & Get URL

1. Railway will build and deploy the service (takes 2-5 minutes)
2. Once deployed, go to **Service Settings → Domains**
3. You'll see the auto-generated URL: `https://api-XXXXX.railway.app`
4. **COPY THIS URL** - you'll need it for the frontends

---

## Step 5: Verify API is Running

Test the health endpoint:
```bash
# Replace with your actual Railway API URL
curl -s https://api-XXXXX.railway.app/api/v1/health

# Expected response:
{"status":"ok","uptime":1234}
```

If you get `{"status":"ok"...}` → ✅ API is working!

---

## Step 6: Update Railway Frontend (changeliberia.org)

1. Go to Railway dashboard → **Frontend service** (not the API service)
2. Click **Settings → Variables**
3. Find or create: `NEXT_PUBLIC_API_URL`
4. **Set the value to:**
   ```
   https://api-XXXXX.railway.app/api/v1
   ```
   (Replace `api-XXXXX` with your actual Railway API domain)

5. Click **"Save"** → Railway auto-redeploys

---

## Step 7: Update Vercel Frontend (changeliberia-web.vercel.app)

1. Go to: **https://vercel.com/dashboard**
2. Click **changeliberia-web** project
3. Go to **Settings → Environment Variables**
4. Find or create: `NEXT_PUBLIC_API_URL`
5. **Set the value to:**
   ```
   https://api-XXXXX.railway.app/api/v1
   ```
6. Click **"Add"** or **"Save"**
7. Go to **Deployments** → Click the latest deployment → **"Redeploy"**

---

## Step 8: Test Both Frontends

### Test changeliberia.org:
1. Open: **https://changeliberia.org/auth/login**
2. Should show login form (not JSON error)
3. Try logging in with: `satta@example.com` / `Quaresma1992$`
4. Should see "Welcome" or be redirected to dashboard

### Test changeliberia-web.vercel.app:
1. Open: **https://changeliberia-web.vercel.app/auth/login**
2. Should show login form (not connection error)
3. Try logging in with same credentials
4. Should work identically to changeliberia.org

---

## Step 9: Verify Multi-Domain Database Sharing

1. Log in on **changeliberia.org** and create a petition
2. Log in on **changeliberia-web.vercel.app** with the same account
3. The petition should appear on both sites (they share the same database)

---

## Troubleshooting

### "Connection refused" or "Cannot reach server"
- ✅ Check that API URL in `.env` is correct (no typos)
- ✅ Verify Railway API service is running (green status in dashboard)
- ✅ Wait 30 seconds and refresh page

### "Invalid JWT" or "401 Unauthorized"
- ✅ Clear browser cookies/cache
- ✅ Restart browsers
- ✅ Try a new login session

### Email not sending
- ✅ Check Resend dashboard: https://resend.com/emails
- ✅ Verify RESEND_API_KEY is correct
- ✅ Verify MAIL_FROM domain is verified in Resend

### Migrations failed on API startup
- ✅ SSH into Railway API service via terminal
- ✅ Run: `npx prisma migrate deploy`
- ✅ Check database connection

---

## Quick Reference

| Component | URL | Status |
|-----------|-----|--------|
| **Railway API** | `https://api-XXXXX.railway.app` | Deploy this now ⏳ |
| **Railway Frontend** | `https://changeliberia.org` | ✅ Ready (needs env update) |
| **Vercel Frontend** | `https://changeliberia-web.vercel.app` | ✅ Ready (needs env update) |
| **Database** | PostgreSQL on Railway | ✅ Running |
| **Redis** | Redis on Railway | ✅ Running |
| **Email** | Resend API | ✅ Verified |

---

## Final Checklist

- [ ] New API service deployed on Railway
- [ ] API URL obtained (e.g., https://api-XXXXX.railway.app)
- [ ] Railway frontend env var updated: `NEXT_PUBLIC_API_URL=https://api-XXXXX.railway.app/api/v1`
- [ ] Vercel frontend env var updated with same URL
- [ ] Both frontends redeployed
- [ ] Health check passed: `curl https://api-XXXXX.railway.app/api/v1/health`
- [ ] Login tested on changeliberia.org ✅
- [ ] Login tested on changeliberia-web.vercel.app ✅
- [ ] Multi-domain data sharing tested (create petition, see on both sites)

---

**NEXT:** Deploy the API service, then report back with the Railway API URL!
