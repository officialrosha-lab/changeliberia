# Admin Access Fix - Production Deployment Guide

## Problem
✗ User logged in with `mharygens@gmail.com` but received "Your account does not have admin access" error

## Root Cause
The `create-admin.ts` script was not being run during production deployment. The user account exists in the database but has `role: USER` instead of `role: ADMIN`.

## Solution

### Option 1: Quick Fix (Manual Database Update) - ⚡ Fastest

If you have direct Railway database access via pgAdmin or psql:

```sql
UPDATE "User" 
SET role = 'ADMIN', 
    "trustScore" = 100,
    "verificationStatus" = 'VERIFIED_LIBERIAN',
    "isEmailConfirmed" = true
WHERE email = 'mharygens@gmail.com';
```

Then test by refreshing `https://changeliberia.org/admin` in your browser.

### Option 2: Run Admin Setup Script (Recommended)

1. **Ensure you have Railway PostgreSQL connection locally:**

   ```bash
   # Get your DATABASE_URL from Railway dashboard
   # Then run:
   cd apps/api
   DATABASE_URL="postgresql://..." tsx prisma/setup-production-admin.ts
   ```

   This will:
   - Find your existing account by email
   - Upgrade it to ADMIN role
   - Set verification status to VERIFIED_LIBERIAN
   - Confirm the email

### Option 3: Automatic Fix (Future Deployments) - ✅ Permanent

The `package.json` start script has been updated to run the admin creation automatically:

```json
"start": "npx prisma migrate deploy && npx prisma db seed && tsx prisma/create-admin.ts && node dist/src/main"
```

**Action required:** Redeploy to Railway for this to take effect:
- Push changes to your main branch
- Trigger a new deployment in Railway console

---

## Verification

After applying the fix, verify the admin account:

1. **In database (SQL):**
   ```sql
   SELECT id, email, role, "verificationStatus", "isEmailConfirmed" 
   FROM "User" 
   WHERE email = 'mharygens@gmail.com';
   ```
   Should show: `role: 'ADMIN'`

2. **In browser:**
   - Navigate to `https://changeliberia.org/admin`
   - Should load admin panel (not show permission error)

---

## Environment Variables (Optional Customization)

If you want to use different credentials for the admin account, set:

```bash
ADMIN_EMAIL="custom@example.com"          # Default: mharygens@gmail.com
ADMIN_PHONE="+1234567890"                # Default: +231000000001
ADMIN_PASSWORD="SecurePassword123!"      # Default: Admin231$
```

These are used by:
- `apps/api/prisma/create-admin.ts`
- `apps/api/prisma/setup-production-admin.ts`

---

## Files Modified

1. **apps/api/package.json** - Updated start script to include admin setup
2. **apps/api/prisma/setup-production-admin.ts** - New script for manual admin setup

## Next Steps

1. ✅ Apply the quick fix (Option 1 or 2)
2. Test admin panel access
3. ✅ Redeploy to Railway for permanent fix (Option 3)
