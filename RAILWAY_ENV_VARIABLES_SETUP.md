# Railway API Deployment - Environment Variables Template

## How to Use This Template

1. Open `.env.production` in your repo
2. Find each variable below
3. Copy the VALUE (not the name)
4. Paste into Railway dashboard

---

## Variables Checklist

### Step 1: Basic Configuration

```
NODE_ENV=production
PORT=4000
```

### Step 2: Security (JWT)

```
JWT_SECRET=[FIND IN: .env.production → JWT_SECRET]
```

**Getting JWT_SECRET:**
```bash
cd /Users/visionalventure/Change\ Liberia
grep "JWT_SECRET" .env.production
# Will show: JWT_SECRET=abc123xyz...
# Copy the value: abc123xyz...
```

### Step 3: Database

```
DATABASE_URL=[FIND IN: .env.production → DATABASE_URL]
```

**Getting DATABASE_URL:**
```bash
grep "DATABASE_URL" .env.production
# Will show: DATABASE_URL=postgres://user:pass@host:5432/db
```

### Step 4: Email Service (Resend)

```
EMAIL_PROVIDER=resend
RESEND_API_KEY=[FIND IN: .env.production → RESEND_API_KEY]
MAIL_FROM=noreply@changeliberia.org
MAIL_REPLY_TO=support@changeliberia.org
TRACKING_DOMAIN=track.changeliberia.org
```

### Step 5: Payments (Stripe)

```
STRIPE_API_KEY=[FIND IN: .env.production → STRIPE_API_KEY]
STRIPE_WEBHOOK_SECRET=[FIND IN: .env.production → STRIPE_WEBHOOK_SECRET]
```

### Step 6: Caching (Redis)

```
REDIS_URL=[FIND IN: .env.production → REDIS_URL]
```

### Step 7: Security (CORS)

```
CORS_ORIGIN=https://changeliberia.org,https://www.changeliberia.org,https://[YOUR-FRONTEND-URL]
```

**If deploying frontend to Vercel or Railway, add that URL too**

---

## Quick Copy-Paste Method

Run this command to get all values in one place:

```bash
cd /Users/visionalventure/Change\ Liberia
echo "=== COPY THESE VALUES ===" && \
echo "NODE_ENV=production" && \
echo "PORT=4000" && \
grep "JWT_SECRET" .env.production && \
grep "DATABASE_URL" .env.production && \
grep "EMAIL_PROVIDER" .env.production && \
grep "RESEND_API_KEY" .env.production && \
echo "MAIL_FROM=noreply@changeliberia.org" && \
echo "MAIL_REPLY_TO=support@changeliberia.org" && \
echo "TRACKING_DOMAIN=track.changeliberia.org" && \
grep "STRIPE_API_KEY" .env.production && \
grep "STRIPE_WEBHOOK_SECRET" .env.production && \
grep "REDIS_URL" .env.production && \
echo "CORS_ORIGIN=https://changeliberia.org,https://www.changeliberia.org"
```

This will print all the lines you need. Just copy-paste them into Railway.

---

## Validation Checklist

After adding all variables in Railway, verify:

- [ ] **NODE_ENV** is `production` (not development)
- [ ] **JWT_SECRET** is at least 32 characters
- [ ] **DATABASE_URL** starts with `postgres://`
- [ ] **STRIPE_API_KEY** starts with `sk_live_` (production) or `sk_test_`
- [ ] **RESEND_API_KEY** starts with `re_`
- [ ] **REDIS_URL** is valid connection string
- [ ] No values are empty or `[FIND IN: ...]` placeholders
- [ ] No accidental spaces or newlines in values

---

## Testing After Deployment

Once Railway builds and deploys, test each system:

### Test API Health
```bash
API_URL="https://your-railway-api-url"
curl "$API_URL/health"
```

**Expected:** `{"status":"ok"}`

### Test Database Connection
```bash
curl "$API_URL/api/v1/petitions"
```

**Expected:** Array of petitions or empty array `[]`

### Test JWT Auth
```bash
curl -X POST "$API_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"phone":"1234567890","password":"test"}'
```

**Expected:** 200-400 status (auth endpoint responds)

### Test Email Service
```bash
curl -X POST "$API_URL/api/v1/email/test"
```

**Expected:** Email queued successfully

---

## If Deployment Fails

### Build Fails with Docker Error
```
Error: "Docker build failed"
```

**Check:**
```bash
# From root directory:
docker build -f apps/api/Dockerfile -t test .
```

If this fails locally, the Railway build will also fail.

### Build Succeeds but Service Won't Start
```
Error in logs: "Cannot find main.js"
```

**Check:**
1. Ensure `apps/api/Dockerfile` exists
2. Ensure build output is in `dist/src/main.js`
3. Check start command: `node dist/src/main.js`

### Health Check Timeout
```
Error: "Health check failed 3 times"
```

**Solutions:**
1. API needs 2-3 minutes to start initially
2. Increase timeout in Settings to 300 seconds
3. Check logs for startup errors
4. Test manually: `curl [API_URL]/health`

### Cannot Connect to Database
```
Error: "connect ECONNREFUSED"
```

**Check:**
1. DATABASE_URL is correct
2. Database server is running
3. Database user has permissions
4. No firewall blocking connection

### Secret Variables Not Working
```
Error: "JWT_SECRET is undefined"
```

**Check:**
1. You added the variable in Railway dashboard
2. You clicked "Deploy" to apply changes
3. Service restarted (check logs)
4. Variable name is exact (case-sensitive): `JWT_SECRET`

---

## Common Variable Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| Extra spaces | `JWT_SECRET = value` | Remove spaces: `JWT_SECRET=value` |
| Quotes included | `STRIPE_API_KEY="sk_live_123"` | Remove quotes: `STRIPE_API_KEY=sk_live_123` |
| Newlines | Value spans multiple lines | Use single line only |
| Forgot part of value | Only pasted half the key | Copy entire value from .env.production |
| Used .env.local instead | Wrong values | Use `.env.production` not `.env.local` |

---

## Security Best Practices

When setting Railway variables:

✅ **DO:**
- [ ] Use strong JWT_SECRET (32+ characters, random)
- [ ] Use `sk_live_*` Stripe keys in production (never test keys)
- [ ] Restrict CORS_ORIGIN to your frontend domain only
- [ ] Use HTTPS only (Railway provides this automatically)
- [ ] Rotate secrets periodically
- [ ] Never share variable values in chat/docs

❌ **DON'T:**
- [ ] Commit `.env.production` to git
- [ ] Share API keys publicly
- [ ] Use development keys in production
- [ ] Include secrets in error messages
- [ ] Log sensitive values

---

## Environment Variable Sizes

Most variables are small, but some can be large:

| Variable | Typical Size | Max Size |
|----------|--------------|----------|
| JWT_SECRET | ~32 chars | 256 chars |
| DATABASE_URL | 100-200 chars | 2000 chars |
| STRIPE_API_KEY | ~50 chars | 256 chars |
| CORS_ORIGIN | 100-300 chars | 2000 chars |

If you have large values, ensure Railway accepts them (usually 10KB max per variable).

---

## Migrating from Local to Production

If you had things working locally:

1. **Local setup used:**
   - `NODE_ENV=development`
   - `DATABASE_URL=postgres://localhost:5432/changeliberia`
   - `STRIPE_API_KEY=sk_test_*` (test keys)

2. **Production needs:**
   - `NODE_ENV=production`
   - `DATABASE_URL=postgres://prod-host:5432/changeliberia`
   - `STRIPE_API_KEY=sk_live_*` (live keys)

3. **Update in Railway:**
   - Don't just copy local `.env.local` values
   - Use `.env.production` with production database/API keys
   - Verify differences before deploying

---

## Production Checklist

Before marking as "production ready":

- [ ] All variables from this template are set
- [ ] No test/dummy values (like "dummy-client-id")
- [ ] Stripe keys are `sk_live_*` not `sk_test_*`
- [ ] Database is production database
- [ ] Health endpoint returns 200
- [ ] API can connect to database
- [ ] Email service credentials work
- [ ] CORS is restricted to your frontend domain
- [ ] All sensitive values are strong/random

---

## Support

If you get stuck:

1. Check Railway logs: Click **Logs** tab in service
2. Search error in this document
3. Check the main setup guide: `RAILWAY_API_SEPARATE_SERVICE_SETUP.md`
4. Review NestJS docs: https://docs.nestjs.com/deployment

