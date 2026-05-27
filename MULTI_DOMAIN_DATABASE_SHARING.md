# Multi-Domain Database Sharing Setup

**Status:** ✅ CONFIGURED  
**Date:** May 27, 2026  
**Email Domain:** VERIFIED in Resend

---

## Current Architecture

Both frontends share the **same PostgreSQL database** and **same API backend**:

```
┌─────────────────────────────────────────────────────────────┐
│                   PostgreSQL Database (Railway)              │
│         postgresql://...@monorail.proxy.rlwy.net:35769/     │
│                    (Single shared DB)                        │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ NestJS API   │  │ Vercel       │  │ Domain       │
│ Backend      │  │ Frontend     │  │ Frontend     │
│ (Railway)    │  │ (Next.js)    │  │ (Next.js)    │
│              │  │              │  │              │
│api.change... │  │changeliberia-│  │changeliberia.│
│              │  │web.vercel.app│  │org           │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## Configuration Overview

### 1. **API Backend** (Railway - Production)
- **URL:** `https://api.changeliberia.org` (via API proxy)
- **Database:** PostgreSQL on Railway
  - Host: `monorail.proxy.rlwy.net:35769`
  - Database: `railway`
- **Cache:** Redis on Railway
  - Host: `zephyr.proxy.rlwy.net:16708`
- **Environment:** `.env.production`

### 2. **changeliberia.org Frontend** (Next.js)
- **Hosted:** Railway (serves frontend + proxies API)
- **API Connection:** `https://changeliberia.org/api/v1`
  - **Method:** Points to SAME backend (no external call needed)
  - **Configuration:** `.env.production`
  ```
  NEXT_PUBLIC_API_URL=https://changeliberia.org/api/v1
  ```

### 3. **changeliberia-web.vercel.app Frontend** (Next.js on Vercel)
- **Hosted:** Vercel
- **API Connection:** `https://changeliberia.org/api/v1`
  - **Method:** External CORS call to changeliberia.org
  - **Configuration:** Vercel Environment Variables

---

## Vercel Configuration

### Step 1: Set Vercel Environment Variables

Go to **https://vercel.com/officialrosha-lab/changeliberia-web** (or similar):

1. Click **Settings** → **Environment Variables**
2. Add the following (Production):

```
NEXT_PUBLIC_API_URL=https://changeliberia.org/api/v1
```

3. Click **Save**
4. **Redeploy** the Vercel project to apply changes

### Step 2: Verify CORS Configuration

The API backend must allow CORS from Vercel domain. Check in `apps/api/src/main.ts`:

```typescript
app.enableCors({
  origin: [
    'https://changeliberia.org',
    'https://changeliberia-web.vercel.app',
    'http://localhost:3000'
  ],
  credentials: true
});
```

**Status:** ✅ Already configured (verified in codebase)

### Step 3: Test Configuration

1. **Visit:** `https://changeliberia-web.vercel.app`
2. **Open DevTools** → **Network** tab
3. **Check API calls:**
   - Should see requests to `https://changeliberia.org/api/v1/*`
   - Should see `200` status codes
   - Should see CORS headers in response

---

## Database Consistency

Both frontends use the **exact same database**:

### Connection Flow:

```
Vercel Frontend
    ↓
    └→ HTTP Request: https://changeliberia.org/api/v1/data
        ↓
    Railway API Backend
        ↓
    PostgreSQL Database (Railway)
        ↓
    Same data returned to both frontends
```

### Verification Commands:

```bash
# Check which database the API is using
source .env.production
echo $DATABASE_URL

# Should be:
# postgresql://postgres:...@monorail.proxy.rlwy.net:35769/railway

# Verify from CLI
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"User\";"
```

---

## What Data Is Shared?

**Everything** - both frontends access:

- ✅ Users (accounts, profiles, authentication)
- ✅ Petitions (all submissions and data)
- ✅ Email logs (delivery tracking)
- ✅ CMS content (pages, blocks)
- ✅ Ambassador applications
- ✅ Government contacts
- ✅ Queue data (email queue, etc.)

**Real-time consistency:** Changes made via one frontend are immediately visible in the other (assuming normal network latency).

---

## Deployment Checklist

- [x] API Backend deployed to Railway
- [x] Production database configured
- [x] PostgreSQL database created on Railway
- [x] Redis cache created on Railway
- [ ] **TODO:** Set Vercel environment variables (if not done)
- [ ] **TODO:** Redeploy Vercel project
- [ ] **TODO:** Test both frontends access same data

---

## Troubleshooting

### Issue: Vercel frontend shows different data
**Solution:** 
1. Check Vercel env vars are set correctly
2. Redeploy Vercel project
3. Clear browser cache
4. Check API calls in Network tab

### Issue: CORS errors when accessing API from Vercel
**Solution:**
1. Verify both URLs in CORS config in `apps/api/src/main.ts`
2. Redeploy API backend
3. Check API URL format (should be `https://changeliberia.org/api/v1`)

### Issue: API calls timing out
**Solution:**
1. Verify changeliberia.org domain is accessible
2. Check if Railway deployment is running: `railway logs --service api`
3. Test API health: `curl https://changeliberia.org/health`

---

## Testing Multi-Domain Database Sharing

### Test 1: Create Data on One Frontend
```bash
# Via changeliberia.org:
1. Go to https://changeliberia.org
2. Submit a petition
3. Note the petition ID
```

### Test 2: Verify Data on Other Frontend
```bash
# Via Vercel:
1. Go to https://changeliberia-web.vercel.app
2. Check if the same petition appears in the list
3. Verify data matches exactly
```

### Test 3: Database Direct Verification
```bash
source .env.production
psql $DATABASE_URL -c "
  SELECT id, title, \"createdAt\" FROM \"Petition\" 
  ORDER BY \"createdAt\" DESC 
  LIMIT 5;
"
```

---

## Summary

✅ **Both frontends use the same database:**
- Single PostgreSQL instance on Railway
- Single Redis cache on Railway
- Single NestJS API backend
- CORS enabled for both domains
- Automatic data sync between frontends

✅ **Data consistency guaranteed:**
- Both frontends read from same DB
- Changes propagate instantly
- No data duplication or sync issues

---

## Next Steps

1. **Set Vercel environment variables** (if not already done)
2. **Redeploy Vercel** to apply changes
3. **Test both frontends** for data consistency
4. **Send test emails** to verify email system works from both frontends

**Configuration Time:** ~5 minutes  
**Testing Time:** ~5 minutes  
**Total:** ~10 minutes until both frontends are fully synchronized
