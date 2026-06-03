# Quick Migration Reference

## ⚡ Quick Start (Recommended)

```bash
# Check what migrations are pending
npm run migrate:status

# Deploy all pending migrations to production
npm run migrate:deploy
```

## 🎯 What This Does
When you run `npm run migrate:deploy`:
1. ✅ Checks migration status
2. ✅ Applies all pending migrations
3. ✅ Creates missing `Poll` table (polling system)
4. ✅ Creates missing `Message` table (messaging system)
5. ✅ Creates related supporting tables

## 📋 Expected Output
```
🔄 Starting Prisma database migrations...

📋 Checking migration status...
[Current status of migrations]

🚀 Deploying pending migrations...
[Migrations applying...]

✅ Migrations completed successfully!

📊 Database schema verified

✨ All done! Poll and Message tables should now exist in production.
```

## 🔍 Alternative Methods

### Via Docker (if Railway CLI not available)
```bash
npm run migrate:docker
```

### Manual Railway CLI
```bash
railway run "cd apps/api && npx prisma migrate deploy"
```

### Via Git Push (Automatic)
```bash
git push origin main
# Railway auto-deploys and runs migrations via start script
```

## ✅ Verification

### After Running Migrations

1. **Test Admin Panel:**
   - Navigate to `https://changeliberia.org/admin`
   - Should load without errors (you'll need admin role)
   - Should show Polls data tab

2. **Test Messages Page:**
   - Navigate to `https://changeliberia.org/messages`
   - Should show empty inbox instead of 500 error

3. **Check Logs:**
   ```bash
   railway logs
   ```

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| `Cannot connect to database` | Use `railway run` command (handles proxy connection) |
| `Migrations already applied` | This is normal - Prisma tracks applied migrations |
| `Permission denied` | Make sure scripts are executable: `chmod +x scripts/*.sh` |
| Still seeing 500 errors | Hard refresh browser (Cmd+Shift+R) and wait for deployment to complete |

## 📊 What Gets Created

| Table | Purpose | Migration |
|-------|---------|-----------|
| `Poll` | Civic pulse polling system | `20260531110655_add_civic_pulse_polling_system` |
| `Message` | Direct messaging between users | `20260531174209_add_messaging_infrastructure` |
| `PollApproval` | Poll workflow management | `20260531145312_add_poll_approval_workflow` |
| `Broadcast` | System-wide broadcasts | `20260531190909_add_message_broadcast_email_types` |
| Supporting indexes & relationships | Performance optimization | Various |

## 🎓 How Migrations Work

1. **Tracking**: Prisma tracks which migrations have been applied in `_prisma_migrations` table
2. **Idempotent**: Safe to run multiple times - already-applied migrations are skipped
3. **Ordered**: Migrations run in chronological order based on timestamp prefix
4. **Rollback**: If needed, contact Railway support for database recovery

## 📝 Files Created

- `scripts/run-migrations.sh` - Main migration runner for Railway
- `scripts/run-migrations-docker.sh` - Docker-based alternative
- `MIGRATION_DEPLOYMENT_GUIDE.md` - Detailed documentation
- This file - Quick reference guide

## 🚀 Ready to Deploy?

```bash
npm run migrate:deploy
```

That's it! The script handles everything else.
