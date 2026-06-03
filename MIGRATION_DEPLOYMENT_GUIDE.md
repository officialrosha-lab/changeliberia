# Database Migration Guide for Production

## Overview
This guide explains how to run Prisma migrations on your production Railway database to create missing tables (Poll, Message, etc).

## Current Status
Missing tables in production:
- ❌ `Poll` table (needed for civic pulse polling system)
- ❌ `Message` table (needed for messaging infrastructure)

## Pending Migrations
The following migrations need to be deployed:
- `20260531110655_add_civic_pulse_polling_system` → Creates Poll table
- `20260531174209_add_messaging_infrastructure` → Creates Message table
- `20260531190909_add_message_broadcast_email_types`
- `20260531204426_add_message_threading`

## Option 1: Using Railway CLI (Recommended)

### Prerequisites
1. Install Railway CLI: https://docs.railway.app/cli/quick-start
2. Ensure you're logged in: `railway login`
3. Link to your project: `railway link`

### Run Migrations
```bash
# From project root
railway run bash scripts/run-migrations.sh
```

Or directly:
```bash
railway run "cd apps/api && npx prisma migrate deploy"
```

## Option 2: Deploy via GitHub (Automatic)

### Add Migration Hook to package.json
The `start` script already includes migrations:
```json
"start": "npx prisma migrate deploy && npx prisma db seed && tsx prisma/create-admin.ts && node dist/src/main"
```

**When you redeploy your Railway service:**
1. Migrations run automatically
2. Tables are created
3. Application starts

To trigger deployment:
```bash
git push origin main
```

## Option 3: Manual SSH Connection (Advanced)

If you have direct database access:

```bash
# Connect to production database
psql "postgresql://postgres:TmYbbaDnOKeKQMHENYiHwXQAdybmVcSJ@monorail.proxy.rlwy.net:35769/railway"

# Check current tables
\dt

# Exit
\q
```

Then run migrations using Railway CLI.

## Verification

### Check Migration Status
```bash
railway run "cd apps/api && npx prisma migrate status"
```

### Verify Tables Exist
```bash
railway run "cd apps/api && npx prisma db execute --stdin" << 'EOF'
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
EOF
```

### Test Endpoints
After migration completes:
1. Navigate to `/admin` → should see Polls tab
2. Navigate to `/messages` → should see empty inbox (not 500 error)

## Troubleshooting

### Issue: "Can't reach database server"
- Railway proxy connection timeout
- Solution: Use `railway run` instead of local connection

### Issue: "Migration already applied"
- Migrations are idempotent
- Safe to run multiple times
- Check status: `railway run "cd apps/api && npx prisma migrate status"`

### Issue: "Table already exists"
- Migration may have partially executed
- Solution: Check `_prisma_migrations` table status
- May need to manually mark migration as complete

### Rollback (if needed)
⚠️ **Warning**: Rollback requires manual intervention
1. Contact Railway support for database restore
2. Or manually delete tables and run migrations again

## Next Steps

1. **Run migrations:**
   ```bash
   railway run bash scripts/run-migrations.sh
   ```

2. **Verify completion:**
   - Check admin panel loads
   - Check messages page loads
   - Monitor Railway logs for errors

3. **Monitor:**
   - Keep Railway dashboard open
   - Check application logs after deployment
   - Test both `/admin` and `/messages` routes

## Files Modified
- `scripts/run-migrations.sh` - Migration script
- `apps/api/package.json` - Already has migration in start script (no changes needed)

## Important Notes

- ⚠️ Always backup production database before running migrations
- ✅ Migrations are backward compatible
- ✅ No data loss expected
- ✅ Tables are created if they don't exist
- ✅ Safe to re-run on already-migrated databases
