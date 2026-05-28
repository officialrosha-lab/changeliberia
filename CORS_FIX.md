# CORS Configuration Fix - Production API Error

## Problem
**Error**: "Unable to reach the server. Please check your connection or try again later."

**Root Cause**: The API on Railway is rejecting requests from the frontend because the `CORS_ORIGIN` environment variable is not configured on Railway.

---

## Solution: Set Railway Environment Variables

⚠️ **Important**: Railway doesn't use `.env.production` file. You must set environment variables in the Railway dashboard.

### Steps to Fix:

1. Go to **Railway Dashboard**: https://railway.app/dashboard
2. Select the **Change Liberia API** service
3. Go to **Variables** tab
4. Add these environment variables:

```
CORS_ORIGIN=https://changeliberia.org,https://changeliberia-web.vercel.app,http://localhost:3000
NODE_ENV=production
ENABLE_SWAGGER=true
```

5. Click **Add** or **Save**
6. **Redeploy** the API service

---

## Verification Steps

1. After redeployment (3-5 minutes), try login again
2. Open browser DevTools → Network tab
3. Click "Sign in" button
4. Look for the POST request to `/api/v1/auth/login/email`
5. Should see `Access-Control-Allow-Origin: https://changeliberia.org` in Response Headers

---

## How CORS Works

```
Browser (changeliberia.org)
  ↓
  Sends request to API with Origin header: "https://changeliberia.org"
  ↓
API checks if this Origin is in CORS_ORIGIN list
  ↓
If YES → Sends back: Access-Control-Allow-Origin: https://changeliberia.org ✅
If NO  → Blocks request (CORS error) ❌
```

---

## Current Status

| Component | Value | Status |
|-----------|-------|--------|
| API Running | Yes (HTTP 200) | ✅ |
| CORS_ORIGIN in .env.production | Configured | ✅ |
| CORS_ORIGIN on Railway | ❌ NOT SET | ⚠️ ACTION NEEDED |
| Frontend URL | https://changeliberia.org | ✅ |
| API Domain | api-production-8873.up.railway.app | ✅ |

---

## What to Check

After setting the environment variable:

```bash
# From browser console, run:
fetch('https://api-production-8873.up.railway.app/health')
  .then(r => r.json())
  .then(console.log)

# Should return: { status: 'ok', uptime: XXX }
```

Or test with curl:
```bash
curl -i https://api-production-8873.up.railway.app/health
```

Should show:
```
HTTP/2 200
...
```

---

## If Still Getting Error After Setting Variables

1. **Wait 5 minutes** for redeployment to complete
2. **Hard refresh** browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
3. **Check Railway logs** for any errors during startup
4. **Verify the exact URL** being called:
   - Open DevTools
   - Click Network tab
   - Try to sign in
   - Look at the failing request
   - Confirm it's going to the right domain

---

## Alternative: Allow All Origins (Temporary Debug Only)

If you need to debug quickly, you can temporarily allow all origins:

```
CORS_ORIGIN=*
```

But this should NOT be used in production long-term. Always specify the exact origins.

---

*Updated: May 28, 2026 - 11:05 AM UTC*
