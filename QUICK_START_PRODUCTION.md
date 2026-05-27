# Production Deployment - Quick Start (5 minutes)

**Date:** May 27, 2026  
**Status:** ✅ Ready to Execute  

---

## 🚀 Quick Start - Copy/Paste Commands

### Step 1: Validate Production Environment (2 min)
```bash
cd /Users/visionalventure/Change\ Liberia

# Validate environment setup
bash scripts/validate-production-config.sh

# Expected: All checks ✅ green
```

### Step 2: Deploy API to Production (15 min)
```bash
# Option A: Railway (Recommended - Already Configured)
npm install -g @railway/cli
railway login
railway link
git add .
git commit -m "Production deployment: Complete email system, monitoring, runbooks"
git push origin main

# Monitor deployment
railway logs --service api

# Wait ~5-10 minutes for deployment
# Then verify:
curl -I https://api.changeliberia.org/health
# Expected: HTTP 200 OK
```

### Step 3: Run Database Migrations (5 min)
```bash
# Via Railway CLI
DATABASE_URL="postgresql://..." npx prisma migrate deploy

# Verify:
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"User\";"
```

### Step 4: Create Admin User (3 min)
```bash
# Run seed (creates default admin)
cd apps/api
DATABASE_URL="postgresql://..." npx prisma db seed

# Or manually:
psql $DATABASE_URL << EOF
INSERT INTO "User" (
  id, "fullName", phone, email, role, "trustScore", "verificationStatus", "createdAt", "updatedAt"
) VALUES (
  gen_random_uuid(),
  'Satta K. Doe',
  '+231770000001',
  'satta@example.com',
  'ADMIN',
  70,
  'VERIFIED_LIBERIAN',
  NOW(),
  NOW()
);
EOF

# Test login:
curl -X POST https://api.changeliberia.org/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phoneOrEmail": "satta@example.com",
    "password": "admin_password"
  }'
```

### Step 5: Setup Monitoring (5 min)
```bash
# Make script executable
chmod +x scripts/monitor-email.sh

# Test it manually
bash scripts/monitor-email.sh
# Expected: Green checks ✓

# Add to crontab (every 15 min)
(crontab -l 2>/dev/null; echo "*/15 * * * * cd /Users/visionalventure/Change\ Liberia && bash scripts/monitor-email.sh") | crontab -

# Verify crontab was added
crontab -l | grep monitor-email
```

### Step 6: Setup Email Domain (24-48 hours, can be in parallel)
```bash
# 1. Go to https://resend.com/domains
# 2. Click "Add Domain"
# 3. Add: changeliberia.org
# 4. Copy DNS records provided
# 5. Add to your domain provider (Namecheap, GoDaddy, Route53, etc)
# 6. Wait 5-30 minutes for DNS propagation
# 7. Click "Verify" in Resend dashboard

# Verify DNS propagation:
dig changeliberia.org TXT
```

### Step 7: Send Test Email (2 min)
```bash
# Get admin token first
TOKEN=$(curl -s -X POST https://api.changeliberia.org/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phoneOrEmail": "satta@example.com",
    "password": "admin_password"
  }' | jq -r '.access_token')

# Send test email
curl -X POST https://api.changeliberia.org/api/v1/email/test-send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientEmail": "your-test-email@gmail.com",
    "emailType": "WELCOME",
    "props": {
      "fullName": "Test User"
    }
  }'

# Check delivery (wait 30 seconds)
sleep 30
curl https://api.changeliberia.org/api/v1/email/logs \
  -H "Authorization: Bearer $TOKEN" | jq '.logs[] | select(.recipientEmail=="your-test-email@gmail.com")'
```

---

## 📋 Verification Checklist

- [ ] **API deployed** - `curl -I https://api.changeliberia.org/health` returns 200
- [ ] **Database connected** - `psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"User\";"` returns count
- [ ] **Admin created** - `psql $DATABASE_URL -c "SELECT email FROM \"User\" WHERE role='ADMIN';"` shows admin
- [ ] **Admin can login** - Auth endpoint returns valid JWT token
- [ ] **Redis connected** - `redis-cli -u $REDIS_URL ping` returns PONG
- [ ] **Monitoring installed** - `crontab -l | grep monitor-email` shows cron job
- [ ] **Email domain DNS added** - DNS records propagated to domain provider
- [ ] **Test email sent** - Email appears in inbox or Resend dashboard

---

## 🎯 Timeline

| Task | Duration | Notes |
|------|----------|-------|
| Validate environment | 2 min | Quick check |
| Deploy API | 15 min | Includes wait time |
| Run migrations | 5 min | Automated |
| Create admin | 3 min | Via seed or SQL |
| Setup monitoring | 5 min | Add to crontab |
| Email domain DNS | 24-48h | Can run parallel |
| Send test email | 2 min | Post DNS setup |

**Total Fast Track:** ~30 minutes (excluding DNS wait)  
**Total with DNS:** 24-48 hours

---

## 🚨 If Anything Goes Wrong

### Common Issues

**"Database connection refused"**
```bash
# Check DATABASE_URL is set
echo $DATABASE_URL

# Test connection directly
psql $DATABASE_URL -c "SELECT 1;"
```

**"Redis connection timeout"**
```bash
# Check REDIS_URL is set
echo $REDIS_URL

# Test connection
redis-cli -u $REDIS_URL ping
```

**"Invalid API Key" when sending email**
```bash
# Verify Resend API key
echo $RESEND_API_KEY
# Should start with: re_

# Check it's in .env.production
grep RESEND_API_KEY .env.production
```

**"Domain not verified" when sending email**
```bash
# Go to: https://resend.com/domains
# Check status is "Verified"
# If not: Wait for DNS propagation

# Manual check:
dig changeliberia.org TXT
# Should show SPF/DKIM records
```

### Get Help
1. Check [PRODUCTION_DEPLOYMENT_EXECUTION.md](PRODUCTION_DEPLOYMENT_EXECUTION.md) → Troubleshooting
2. Check [RUNBOOK_INCIDENT_RESPONSE.md](docs/RUNBOOK_INCIDENT_RESPONSE.md) → Matching issue
3. Run monitoring script to diagnose: `bash scripts/monitor-email.sh`
4. Check logs: `docker logs api`

---

## 📚 Detailed Documentation

After quick start is complete, review:
1. **[PRODUCTION_DEPLOYMENT_EXECUTION.md](PRODUCTION_DEPLOYMENT_EXECUTION.md)** - Complete procedures
2. **[PRODUCTION_ACTION_SUMMARY.md](PRODUCTION_ACTION_SUMMARY.md)** - Task-by-task status
3. **[docs/RUNBOOKS_INDEX.md](docs/RUNBOOKS_INDEX.md)** - Master index for ops
4. **[docs/RUNBOOK_DAILY_OPERATIONS.md](docs/RUNBOOK_DAILY_OPERATIONS.md)** - Daily procedures

---

## ✨ What You Have Now

✅ Production environment fully configured  
✅ API ready for deployment  
✅ Database with admin user  
✅ Email system ready  
✅ Monitoring automated  
✅ Complete runbooks for operations  
✅ All procedures documented  

---

**🎉 You're ready to launch production!**

Start with Step 1 above.

---

**Version:** 1.0  
**Created:** May 27, 2026  
**Last Updated:** May 27, 2026
