# Railway API Deployment - Quick Reference

## One-Page Checklist for Option A

### PHASE 1: Create API Service (5 mins)

- [ ] Go to https://railway.app/dashboard
- [ ] Click **+ Create**
- [ ] Select **GitHub Repo**
- [ ] Choose `officialrosha-lab/changeliberia`
- [ ] Name it: `change-liberia-api`
- [ ] Click **Deploy**

**Expected:** Build starts automatically

---

### PHASE 2: Configure Build Settings (3 mins)

Once service appears on dashboard:

- [ ] Click on the service
- [ ] Go to **Settings** (gear icon)
- [ ] Under **Builder**:
  - [ ] Select: **Dockerfile**
  - [ ] Path: `apps/api/Dockerfile`
  - [ ] Root Directory: `/`
- [ ] Under **Deploy**:
  - [ ] Start Command: `node dist/src/main.js`
  - [ ] Health Check Path: `/health`
  - [ ] Health Check Timeout: `300`
- [ ] **Save**

**Expected:** Build continues

---

### PHASE 3: Add Environment Variables (5 mins)

Click **Variables** tab. Add each line below (copy-paste from your `.env.production`):

```
NODE_ENV=production
JWT_SECRET=[copy from .env.production]
DATABASE_URL=[copy from .env.production]
STRIPE_API_KEY=[copy from .env.production]
STRIPE_WEBHOOK_SECRET=[copy from .env.production]
EMAIL_PROVIDER=resend
RESEND_API_KEY=[copy from .env.production]
MAIL_FROM=noreply@changeliberia.org
MAIL_REPLY_TO=support@changeliberia.org
REDIS_URL=[copy from .env.production]
TRACKING_DOMAIN=track.changeliberia.org
CORS_ORIGIN=https://changeliberia.org,https://www.changeliberia.org
PORT=4000
```

For each variable:
- [ ] Paste name (left side)
- [ ] Paste value (right side)
- [ ] Press Enter or click Add

After all added:
- [ ] Click **Deploy** button (to apply variables)

**Expected:** New deployment starts with variables applied

---

### PHASE 4: Wait for Deployment (2-5 mins)

Go to **Deploy** tab:

- [ ] Watch build log
- [ ] Should see: ✅ Build successful
- [ ] Should see: ✅ Application running
- [ ] Logs should show no errors

**Expected:** Build completes, service shows "Running"

---

### PHASE 5: Get API URL (1 min)

On the service page:

- [ ] Look for **Public URL** (usually top right)
- [ ] Click the URL icon next to it
- [ ] **Copy the full URL**
- [ ] Example: `https://change-liberia-api-prod.railway.app`

**Save this URL! You need it in PHASE 6**

---

### PHASE 6: Test API Health (1 min)

Open terminal and run:

```bash
curl https://[YOUR-API-URL]/health
```

Replace `[YOUR-API-URL]` with the URL from PHASE 5

**Expected response:**
```json
{"status":"ok"}
```

If you see this: ✅ **API is working!**

---

### PHASE 7: Update Frontend URL

#### For web frontend (apps/web):

Option A: **Deploy to Railway** (Recommended)
- [ ] Go back to Project dashboard
- [ ] Click **+ Create**
- [ ] Select **GitHub Repo**
- [ ] Choose `officialrosha-lab/changeliberia` again
- [ ] Name it: `change-liberia-web`
- [ ] After created, go to **Variables**
- [ ] Add:
  ```
  NEXT_PUBLIC_API_URL=https://[YOUR-API-URL]/api/v1
  ```
  (Use the API URL from PHASE 5)
- [ ] Deploy

Option B: **Deploy to Vercel** (Even Easier for Next.js)
- [ ] Go to https://vercel.com
- [ ] Import your GitHub repo
- [ ] Set environment variable:
  ```
  NEXT_PUBLIC_API_URL=https://[YOUR-API-URL]/api/v1
  ```
- [ ] Deploy

**Expected:** Frontend loads and shows no console errors

---

### PHASE 8: Verify Everything Works (5 mins)

Open your frontend URL and test:

- [ ] **Page loads** without errors
- [ ] **Sign up** with test email
- [ ] **Create a petition** with test data
- [ ] **View petitions list** (should see your test petition)
- [ ] Open Developer Tools (F12) → **Network tab**
- [ ] Make a request (sign up, create petition)
- [ ] Should see API calls to `[YOUR-API-URL]/api/v1/*`
- [ ] Responses should be 200/201 (not 404/500)

**Expected:** All tests pass with no errors

---

## Common Issues & Quick Fixes

### API Service Won't Start
```
Error in logs: "Cannot connect to database"
```
**Fix:** Check DATABASE_URL variable - copy exact value from .env.production

### Build Fails
```
Error: "Dockerfile not found"
```
**Fix:** Check "Dockerfile" path is `apps/api/Dockerfile` in Settings

### Frontend Can't Call API
```
Browser error: "CORS error" or "API not found"
```
**Fix:** 
1. Check NEXT_PUBLIC_API_URL is set on frontend
2. Verify it matches your API URL exactly
3. Check CORS_ORIGIN includes your frontend domain

### Health Check Fails
```
Railway logs: "Health check failed"
```
**Fix:** 
1. Ensure API service is fully started (check logs)
2. Manually test: `curl [API-URL]/health`
3. If still fails, restart service

---

## Environment Variable Values Reference

Need to find these? Look in your repo:

```bash
# From root directory:
cat .env.production | grep "JWT_SECRET"
cat .env.production | grep "DATABASE_URL"
cat .env.production | grep "STRIPE"
cat .env.production | grep "RESEND"
cat .env.production | grep "REDIS"
```

---

## Success = Green Checkmarks

When complete, you should have:

✅ API service deployed and running on Railway  
✅ Health endpoint responds correctly  
✅ Frontend deployed (Railway or Vercel)  
✅ Frontend can reach API without errors  
✅ User signup works end-to-end  
✅ Petitions can be created and viewed  

**If all green:** Your Option A deployment is complete! 🎉

---

## Next: Go Live Checklist

After PHASE 8, before production:

- [ ] Set custom domain (optional but recommended)
- [ ] Configure database backups
- [ ] Set up monitoring alerts
- [ ] Do final 24-hour testing
- [ ] Document API URL for team
- [ ] Enable auto-redeploy on git push
- [ ] Test email notifications (if enabled)
- [ ] Test payment flow (if using Stripe)

---

## Estimated Time Total
- PHASE 1-3: ~15 minutes
- PHASE 4: ~5 minutes (wait for build)
- PHASE 5-6: ~2 minutes
- PHASE 7: ~10 minutes (frontend setup)
- PHASE 8: ~5 minutes (testing)

**Total: ~40 minutes** from start to working system

