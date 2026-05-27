# Vercel Setup - Configure Frontend to Share Database

**Status:** Ready to Configure  
**Time Required:** 3-5 minutes  

---

## Step 1: Set Vercel Environment Variable

### Option A: Via Vercel Dashboard (Recommended)

1. Go to **https://vercel.com/dashboard**
2. Click on the **changeliberia-web** project (Next.js frontend)
3. Click **Settings** (top menu)
4. Click **Environment Variables** (left sidebar)
5. Click **Add New** button
6. Fill in:
   - **Name:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://changeliberia.org/api/v1`
   - **Select:** Production (and optionally Preview)
7. Click **Add** or **Save**
8. Click **Deploy** button (top right) to redeploy with new variable

### Option B: Via Vercel CLI

```bash
# If you have Vercel CLI installed
vercel env add NEXT_PUBLIC_API_URL
# Then enter: https://changeliberia.org/api/v1
# Select: Production

# Redeploy
vercel --prod
```

---

## Step 2: Verify Deployment

1. Wait 30-60 seconds for redeploy to complete
2. Go to **https://changeliberia-web.vercel.app**
3. Open **DevTools** (F12 or Cmd+Option+I)
4. Go to **Network** tab
5. Perform an action that makes an API call (login, fetch data, etc.)
6. Look for requests to `https://changeliberia.org/api/v1/*`
7. Verify **Status Code: 200** (not 403 or CORS error)

---

## Step 3: Test Multi-Domain Database Sharing

### Test A: Create Data on changeliberia.org
```
1. Go to https://changeliberia.org
2. Create a new petition or account
3. Note the details (title, ID, etc.)
```

### Test B: Verify Data on Vercel
```
1. Go to https://changeliberia-web.vercel.app
2. Check if the same data appears
3. Verify data matches exactly
```

### Test C: Reverse - Create on Vercel, View on Domain
```
1. Go to https://changeliberia-web.vercel.app
2. Create new content
3. Go to https://changeliberia.org
4. Verify same content is visible
```

---

## Troubleshooting

### Issue: CORS Error in Console
```
Access to XMLHttpRequest at 'https://changeliberia.org/api/v1/...'
from origin 'https://changeliberia-web.vercel.app'
has been blocked by CORS policy
```

**Solution:**
1. Clear browser cache (Cmd+Shift+Delete or Ctrl+Shift+Delete)
2. Hard refresh Vercel page (Cmd+Shift+R or Ctrl+Shift+R)
3. Wait 2-3 minutes for Railway redeploy to complete
4. Try again

### Issue: 404 or Connection Refused
```
Failed to connect to https://changeliberia.org/api/v1/...
```

**Solution:**
1. Verify changeliberia.org domain is accessible
2. Check Railway deployment status: `railway logs --service api`
3. Verify `.env.production` CORS_ORIGIN is correct
4. Redeploy API: `git push origin main` (triggers auto-deploy on Railway)

### Issue: Data Not Syncing Between Frontends
```
Data visible on changeliberia.org but not on Vercel
```

**Solution:**
1. Verify Vercel environment variable is set correctly
2. Verify value is exactly: `https://changeliberia.org/api/v1` (no trailing slash)
3. Hard refresh both pages
4. Check both are accessing same database: `psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"User\";"`

---

## Verification Checklist

- [ ] Vercel environment variable `NEXT_PUBLIC_API_URL` set to `https://changeliberia.org/api/v1`
- [ ] Vercel project redeployed (green checkmark on deployment)
- [ ] No CORS errors in DevTools Console
- [ ] Network tab shows successful API calls
- [ ] Data created on one frontend visible on other frontend
- [ ] Database query shows consistent data: `psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"User\";"`

---

## Architecture Verification

After setup, verify the complete architecture:

```bash
# 1. Check API is running
curl -I https://changeliberia.org/health
# Expected: HTTP 200 OK

# 2. Check database is accessible
source .env.production
psql $DATABASE_URL -c "SELECT version();" | head -1

# 3. Check both frontends can access API
curl -s https://changeliberia.org/api/v1/health | jq .
# Expected: 200 OK response
```

---

## Summary

✅ **Configuration Complete When:**
1. Vercel environment variable set
2. Vercel redeployed
3. No CORS errors
4. API calls successful
5. Data syncs between frontends

**Testing Time:** 3-5 minutes  
**Status:** Ready for production  

---

## Next Steps

1. ✅ Set Vercel environment variable (above)
2. ✅ Redeploy Vercel
3. ✅ Verify CORS and API calls
4. Send test emails from both frontends
5. Monitor email delivery rates

**Questions?** Check [MULTI_DOMAIN_DATABASE_SHARING.md](./MULTI_DOMAIN_DATABASE_SHARING.md) for architecture details.
