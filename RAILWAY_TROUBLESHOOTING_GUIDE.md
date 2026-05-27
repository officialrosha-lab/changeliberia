# Railway API Deployment - Troubleshooting Guide

## Quick Diagnosis

**Step 1:** Check service status in Railway dashboard
- [ ] Service shows "Running" (green)? → Jump to Specific Issues
- [ ] Service shows "Failed" or "Building"? → Jump to Build Issues
- [ ] Service shows "Stopped"? → Click "Resume" button

**Step 2:** Check logs
```
In Railway dashboard:
1. Click on your API service
2. Click "Logs" tab
3. Look for error messages (usually red text)
```

---

## Build Issues

### Issue: Build Fails Immediately
**Error:** `Build failed` or `Container build error`

**Cause:** Docker image won't build

**Fix:**
1. Check Dockerfile path is correct: `apps/api/Dockerfile`
2. Test locally:
   ```bash
   cd /Users/visionalventure/Change\ Liberia
   docker build -f apps/api/Dockerfile -t change-liberia-api:test .
   ```
3. If local build fails, fix Dockerfile first before retrying Railway

### Issue: Build Takes 10+ Minutes
**Error:** Build step hangs or times out

**Cause:** 
- Installing many dependencies (normal first time)
- Network issues downloading packages
- Railway queueing your builds

**Fix:**
1. Wait - first build takes 5-10 minutes
2. Check build logs to see actual progress
3. If truly stuck (no new logs for 30+ mins), cancel and retry

### Issue: Out of Memory During Build
**Error:** `killed` or `OOM` in build logs

**Cause:** Large project, limited build machine

**Fix:**
1. Check Railway plan (free tier has limited resources)
2. Upgrade to Pro plan if needed
3. Or split monorepo into separate deployments

---

## Startup Issues

### Issue: Service Starts but Crashes Immediately
**Error:** `Exited with code 1` or service keeps restarting

**Common Causes:**
```
1. Missing required environment variables
2. Cannot connect to database
3. Syntax error in code
4. Prisma migration issues
```

**Fix - Step 1: Check Logs**
```
Click "Logs" tab and look for:
- "Error: JWT_SECRET is undefined" → Add JWT_SECRET variable
- "Error: connect ECONNREFUSED" → DATABASE_URL is wrong
- "Error: Cannot find module" → Missing dependency
```

**Fix - Step 2: If DATABASE_URL Error**
```bash
# Verify database connection locally:
psql $DATABASE_URL -c "SELECT 1"
# Should return: 1

# If fails, check:
1. URL format is correct (postgres://user:pass@host:port/db)
2. Database server is running
3. Firewall allows connection
```

**Fix - Step 3: If JWT_SECRET Missing**
```
Go to Railway Variables tab:
1. Click "Add Variable"
2. Name: JWT_SECRET
3. Value: [paste from .env.production]
4. Click "Save"
5. Deploy again
```

**Fix - Step 4: Migrations Stuck**
```bash
# If logs show: "Migration xxx is pending"
# The start script runs: npx prisma migrate deploy

# Manually resolve stuck migration:
npx prisma migrate resolve --applied <migration-name>

# Then deploy in Railway again
```

---

## Connection Issues

### Issue: Frontend Can't Reach API
**Error in browser console:**
```
GET https://[api-url]/api/v1/petitions 404 Not Found
# or
CORS error
# or
ERR_FAILED (network error)
```

**Cause 1: API URL Wrong**
```
Frontend expects: https://[your-api-url]/api/v1
But Railway provides: https://[your-api-url]

Fix: Add "/api/v1" to end of URL in frontend variables
```

**Cause 2: Health Check Failing**
```
If API health fails, Railway thinks API isn't ready
Frontend waits or gets error
```

Fix:
```bash
# Test manually:
curl https://[your-api-url]/health

# If returns 200 with {"status":"ok"} → API is healthy
# If returns 503 or times out → API is starting, wait 2 minutes
# If returns 404 → Wrong URL or health endpoint broken
```

**Cause 3: CORS Not Configured**
```
Error: "Access to XMLHttpRequest from origin blocked by CORS"

Fix:
1. Check CORS_ORIGIN in Railway Variables
2. Should include your frontend domain
3. Example: https://changeliberia.org,https://www.changeliberia.org
4. If frontend on different domain, add it
```

**Cause 4: Network Timeout**
```
Error: "Connection timeout" or "No response"

Causes:
- API server is very slow (loading resources)
- Database is slow
- Network between regions is slow

Fix:
1. Check Railway logs for slow queries
2. Optimize database queries
3. Try adding more CPU/RAM to service
```

---

## Health Check Issues

### Issue: Health Check Failing
**Error:** `Health check failed` (service keeps restarting)

**Symptoms:**
- Service restarts every few seconds
- Logs show health check path failed
- Status shows "Failing" or restarting

**Diagnosis:**
```bash
# Check what's happening:
curl -v https://[your-api-url]/health
# Look at:
# 1. HTTP status code (should be 200)
# 2. Response body (should be {"status":"ok"})
# 3. Connection errors (if can't connect, network issue)
```

**Fix - If Getting 503:**
```
API is still starting (can take 30-60 seconds)
- Wait 2 minutes
- Check logs to see progress
- If still 503 after 2 mins, see "Startup Issues" section
```

**Fix - If Getting 404:**
```
Health endpoint doesn't exist or path is wrong
- Check Settings → Deploy → Health Check Path: /health
- Verify API has /health endpoint implemented
```

**Fix - If Connection Refused:**
```
API might be out of memory or crashed
- Check logs for crash messages
- Increase RAM in service settings
- Check database connection (see Connection Issues)
```

**Fix - If Timeout:**
```
API is very slow to start or respond
- Increase Health Check Timeout (in Settings) to 300 seconds
- Check logs for what's taking so long
- Optimize startup code or database queries
```

---

## Database Issues

### Issue: "connect ECONNREFUSED" or "database connection failed"

**Cause:** API can't reach database

**Fix - Step 1: Verify DATABASE_URL**
```bash
# Print your database URL:
grep "DATABASE_URL" /Users/visionalventure/Change\ Liberia/.env.production

# Check format:
# postgres://user:password@host:port/database
# Should have all parts
```

**Fix - Step 2: Test Connection**
```bash
# Can you connect from your local machine?
psql postgres://[your-database-url] -c "SELECT 1"

# If "connection refused":
# - Database server not running
# - Wrong host/port
# - Firewall blocking

# If "password authentication failed":
# - Wrong password in URL
# - User doesn't exist
```

**Fix - Step 3: Check in Railway**
```
1. Go to Railway dashboard
2. If PostgreSQL service exists:
   - Click on it
   - Check it shows "Running"
   - Get connection string from "Connect" tab
3. Compare with DATABASE_URL in Variables
   - Should match exactly
```

**Fix - Step 4: Network/Firewall**
```
If DATABASE_URL is correct but still fails:
- Railway API service might not have access to database
- If database is external (not Railway):
  - Check database firewall allows Railway IP
  - Check credentials are correct
  - Try resetting password
```

### Issue: Migrations Won't Run

**Error:** `Migration xxx is pending` or `Migration failed`

**Fix - Option 1: Auto-resolve**
```bash
cd /Users/visionalventure/Change\ Liberia/apps/api
source ../../.env.production
npx prisma migrate resolve --applied <migration-name>
# Then redeploy in Railway
```

**Fix - Option 2: Force Reset (CAREFUL!)**
```bash
# This DELETES all data - only for development!
npx prisma migrate reset --force
# Then redeploy
```

**Fix - Option 3: Manual Run**
```
1. Get Railway terminal access
2. Run: npx prisma migrate deploy
3. Check for error messages
4. Fix schema if syntax errors
```

---

## Environment Variable Issues

### Issue: "undefined" Errors for Specific Variables

**Example:** Logs show `JWT_SECRET is undefined`

**Cause:** Variable not set in Railway

**Fix:**
```
1. Railway Dashboard → Your API Service
2. Go to "Variables" tab
3. Look for "JWT_SECRET" in list
4. If missing:
   a. Click "Add Variable"
   b. Name: JWT_SECRET
   c. Value: [get from .env.production]
   d. Click "Save"
5. Click "Deploy" button to apply changes
6. Wait for redeployment
```

**Note:** Changes to variables require redeployment!

### Issue: Variables Have Wrong Values

**Symptom:** Stripe payments failing, email not sending, etc.

**Cause:** Variable value is incomplete or wrong

**Fix - Step 1: Compare**
```bash
# Get value from local file:
grep "STRIPE_API_KEY" /Users/visionalventure/Change\ Liberia/.env.production
# Should show: STRIPE_API_KEY=sk_live_abc123xyz...

# Compare with Railway:
# Dashboard → API Service → Variables
# Find STRIPE_API_KEY in the list
# Should have same full value
```

**Fix - Step 2: Update if Wrong**
```
1. Click the variable in list
2. Edit the value
3. Copy exact value from .env.production
4. Include FULL value (not just partial)
5. Save
6. Deploy
```

### Issue: Secrets Visible in Logs

**Security Issue:** Sensitive values showing in logs

**Fix:**
1. Check what's being logged in code
2. Don't log: JWT_SECRET, API keys, passwords, etc.
3. Use `redactSensitiveData()` for logs
4. Rotate compromised keys

---

## Deployment Issues

### Issue: Deployment Stuck

**Symptom:** Says "Deploying" for 30+ minutes

**Cause:**
- Build taking very long
- Deployment queue
- System issue

**Fix:**
1. Check build logs to see progress
2. If truly stuck:
   - Click "Cancel" button
   - Wait 1 minute
   - Click "Deploy" again
3. If still stuck, restart service

### Issue: Can't Rollback After Bad Deployment

**Problem:** New version broken, need old version back

**Fix:**
```
1. In Railway dashboard, go to "Deployments" tab
2. Find last known-good deployment
3. Click it
4. Click "Rollback" button
5. Wait for rollback to complete
```

### Issue: Redeploy Not Picking Up Code Changes

**Symptom:** Updated code but Railway still running old version

**Cause:**
- Railway cache not cleared
- Need full rebuild

**Fix:**
```
1. Railway dashboard → API Service
2. Click menu (⋯) → "Redeploy"
3. Or push new commit to git (auto-redeploys)
4. Or click "Trigger Deploy" button
```

---

## Performance Issues

### Issue: API Very Slow (5+ second responses)

**Symptom:** Requests timeout, frontend hangs

**Causes:**
```
1. Database queries slow
2. Not enough CPU/RAM allocated
3. Network latency
4. Many requests at once (queue)
```

**Fix - Check Service Resources:**
```
1. Railway dashboard → API Service
2. Click "Settings" → "Resources"
3. Current: [shows CPU/RAM]
4. Try upgrading if on minimal plan
```

**Fix - Check Database Performance:**
```bash
# Enable slow query log:
source .env.production
psql $DATABASE_URL << 'EOF'
ALTER SYSTEM SET log_min_duration_statement = 1000;
SELECT pg_reload_conf();
EOF

# Then check PostgreSQL logs for slow queries
```

**Fix - Optimize Code:**
1. Check API logs for specific slow endpoints
2. Add caching for frequently accessed data
3. Optimize database queries (add indexes)
4. Use pagination for large result sets

### Issue: High Memory Usage

**Symptom:** Service keeps restarting, memory error in logs

**Cause:** Memory leak or large data transfer

**Fix:**
1. Upgrade service RAM in Settings
2. Check code for memory leaks
3. Reduce response payload sizes
4. Enable compression for API responses

---

## Email Issues

### Issue: Emails Not Sending

**Error:** No emails arriving, or logs show send failure

**Check 1: API Logging**
```bash
# Check Resend integration in logs:
# Should see: "Email queued" or "Email sent"
# If sees: "Resend API error" or "Invalid API key"
```

**Check 2: Resend API Key**
```
1. Verify RESEND_API_KEY is set in Variables
2. Get correct key from: https://resend.com/api-keys
3. Should start with: re_
4. Paste entire key (including re_ prefix)
```

**Check 3: Domain Verification**
```
1. Go to https://resend.com/domains
2. Verify domain is confirmed (green checkmark)
3. If not, follow domain verification steps
4. Mail sent from unverified domain will fail
```

**Check 4: Email Address**
```
1. Check MAIL_FROM matches verified domain
2. Example: MAIL_FROM=noreply@changeliberia.org
3. Domain changeliberia.org must be verified in Resend
```

**Check 5: Test Endpoint**
```bash
curl -X POST https://[your-api-url]/api/v1/email/test \
  -H "Content-Type: application/json" \
  -d '{"to":"your-test-email@gmail.com"}'

# Check email inbox (and spam folder)
```

---

## Redis Issues

### Issue: "Redis connection refused"

**Error in logs:** `Error: connect ECONNREFUSED 127.0.0.1:6379`

**Cause:**
- Redis not running
- Wrong REDIS_URL
- Redis server inaccessible

**Fix:**
1. Check REDIS_URL in Variables
2. Verify Redis server is running
3. If using Railway's Redis service, ensure it's running
4. Test connection locally:
   ```bash
   redis-cli -u redis://[your-redis-url] ping
   ```

### Issue: Email Queue Not Processing

**Error:** Emails stuck in queue, not being sent

**Cause:** BullMQ needs Redis

**Fix:**
1. Verify REDIS_URL is set correctly
2. Test Redis connection (see above)
3. Check Redis has enough memory
4. Manually trigger job processing if needed

---

## Testing After Fixes

After fixing any issue, verify with:

```bash
API_URL="https://your-railway-api-url"

# 1. Health check
echo "Testing health endpoint..."
curl $API_URL/health

# 2. Database connection
echo "Testing database..."
curl $API_URL/api/v1/petitions

# 3. Auth endpoint
echo "Testing auth..."
curl -X POST $API_URL/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"1234567890","password":"test"}'

# 4. Admin endpoint (if auth works)
echo "Testing admin access..."
curl -H "Authorization: Bearer [your-jwt-token]" \
  $API_URL/api/v1/admin/petitions/pending
```

---

## Getting Help

If none of these solutions work:

1. **Check Railway Docs:** https://docs.railway.app/
2. **Check NestJS Docs:** https://docs.nestjs.com/
3. **Railway Support:** https://railway.app/support
4. **Community:** Railway Discord or NestJS discussions

When asking for help, provide:
- [ ] Error message (exact text from logs)
- [ ] What you tried
- [ ] Which step in deployment guide you're on
- [ ] Screenshot of railway dashboard if helpful

---

## Emergency Recovery

If everything is broken:

**Option 1: Rollback Last Deploy**
```
Railway Dashboard → Deployments tab
Find last known-good version
Click Rollback
```

**Option 2: Restart Service**
```
Dashboard → API Service
Click menu (⋯) → Restart
Wait for it to come back up
```

**Option 3: Redeploy from Scratch**
```
1. In Railway, click "Settings" → Delete service
2. Create new service following original guide
3. Reuse database (DATABASE_URL same)
4. Set environment variables again
5. Deploy
```

**Option 4: Local Backup Plan**
```
If Railway is down but you need API:
1. Run locally: npm run dev
2. Update frontend to point to http://localhost:4000/api/v1
3. Use for testing/recovery
```

---

## Prevention Checklist

To avoid issues in future:

- [ ] Keep `.env.production` secure and backed up
- [ ] Test all variables before deploying
- [ ] Monitor logs regularly for errors
- [ ] Set up alerts for service failures
- [ ] Keep dependencies updated
- [ ] Use database backups
- [ ] Document custom configurations
- [ ] Review security settings monthly

