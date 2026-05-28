# API Configuration Fix - Production Deployment

## Problem
**Error**: "Unexpected token '<', "<!DOCTYPE "... is not valid JSON"

This occurs when the frontend tries to call the API and receives HTML instead of JSON. The cause: frontend environment variable `NEXT_PUBLIC_API_URL` was pointing to itself instead of the actual API.

---

## Solution Applied ✅

### 1. Updated .env.production
Changed from:
```
NEXT_PUBLIC_API_URL="https://changeliberia.org/api/v1"  ❌ Points to frontend
```

To:
```
NEXT_PUBLIC_API_URL="https://api-production-8873.up.railway.app/api/v1"  ✅ Points to Railway API
```

### 2. Updated apps/web/next.config.ts
Now properly defaults to Railway API:
```typescript
const backendUrl = process.env.NEXT_PUBLIC_API_URL || 
                   process.env.RAILWAY_API_URL || 
                   'https://api-production-8873.up.railway.app/api/v1';
```

---

## Critical: Vercel Environment Variables

⚠️ **The .env.production file is NOT used by Vercel!** You must manually set the environment variable in Vercel dashboard.

### Steps to Fix in Vercel Dashboard:

1. Go to: https://vercel.com/dashboard
2. Select the "changeliberia" project
3. Go to Settings → Environment Variables
4. Add or update this variable:
   ```
   Name:  NEXT_PUBLIC_API_URL
   Value: https://api-production-8873.up.railway.app/api/v1
   ```
5. Select "Production" environment
6. Click "Save"
7. **Redeploy** the frontend:
   - Go to Deployments
   - Click "Redeploy" on the latest deployment
   - Or push a new commit to main

---

## Verification

After Vercel redeploys, test the login:

1. Navigate to: https://changeliberia.org/auth/login
2. Click "Email + Password" tab
3. Enter test credentials:
   - Email: test@example.com
   - Password: TestPassword123!
4. Should see ✅ Success or ❌ Invalid credentials
5. Should NOT see: "Unexpected token '<'" error

---

## Alternative: Use Custom API Domain

If you want to use the custom domain `api.changeliberia.org` instead:

1. Configure Railway to expose the API at `api.changeliberia.org`
2. Update Vercel environment variable to:
   ```
   NEXT_PUBLIC_API_URL=https://api.changeliberia.org/api/v1
   ```
3. Make sure CORS is configured to allow `changeliberia.org`

---

## How the API URL Works

```
Frontend (Browser)          Vercel: changeliberia.org
        ↓
        Uses NEXT_PUBLIC_API_URL to make API calls
        ↓
Railway API: api-production-8873.up.railway.app
        ↓
Backend processes request and returns JSON
        ↓
Frontend receives JSON and parses it ✅
```

---

## Current Configuration

| Component | Value | Status |
|-----------|-------|--------|
| Frontend Domain | changeliberia.org | ✅ Deployed |
| Frontend Env Var (code) | Updated to Railway URL | ✅ Fixed & Pushed |
| Frontend Env Var (Vercel) | ⏳ Needs manual update in dashboard | ⚠️ ACTION NEEDED |
| API Railway URL | api-production-8873.up.railway.app | ✅ Ready |
| Database | Railway PostgreSQL | ✅ Connected |
| Redis | Railway Redis | ✅ Connected |

---

## Next Steps

1. ⏳ **IMMEDIATE**: Set Vercel environment variable as described above
2. ⏳ Trigger Vercel redeploy
3. ⏳ Wait ~2-3 minutes for new build and deployment
4. ✅ Test login at https://changeliberia.org/auth/login
5. ✅ Verify error is gone

---

*Updated: May 28, 2026 - 10:50 AM UTC*
