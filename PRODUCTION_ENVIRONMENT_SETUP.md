# Production Environment Configuration

**Status**: Ready for Production Deployment
**Target Domain**: https://changeliberia-web.vercel.app/
**Email Domain**: changeliberia.org

---

## 📍 Current Environment Files

### API Server: apps/api/.env.local
```bash
# Email Configuration ✓
RESEND_API_KEY=re_V39tR44W_PmhRUhmg9k79ZrUpCe6F7AKx
MAIL_FROM=noreply@changeliberia.org
MAIL_REPLY_TO=support@changeliberia.org
RESEND_WEBHOOK_SECRET=whsec_test_xxxxx

# Redis Configuration ✓
REDIS_URL=redis://localhost:6379

# Email Tracking ✓
TRACKING_DOMAIN=track.changeliberia.org
NEXT_PUBLIC_APP_URL=http://localhost:3000

# To Update for Production:
# - NEXT_PUBLIC_APP_URL → https://changeliberia-web.vercel.app
# - EMAIL_PROVIDER → production
# - APP_URL → https://changeliberia-web.vercel.app
# - NEXT_PUBLIC_API_URL → https://api.changeliberia.org/api/v1
```

### Web App: apps/web/.env.local
```bash
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_GOOGLE_CLIENT_ID=dummy-client-id

# To Update for Production:
# - NEXT_PUBLIC_API_URL → https://api.changeliberia.org/api/v1 OR https://changeliberia-web.vercel.app/api/v1
# - NEXT_PUBLIC_GOOGLE_CLIENT_ID → actual production client ID
```

---

## 🔄 Production Configuration Steps

### Step 1: Update apps/api/.env (main environment)

Update these fields in `apps/api/.env`:

```bash
# Current development settings:
EMAIL_PROVIDER="development"
SMTP_HOST="localhost"
SMTP_PORT="1025"
NEXT_PUBLIC_API_URL="http://localhost:4000/api/v1"
CORS_ORIGIN="http://localhost:3000"
APP_URL="http://localhost:4000"

# Change to production:
EMAIL_PROVIDER="production"
# Remove SMTP_HOST and SMTP_PORT (not needed for Resend)

NEXT_PUBLIC_API_URL="https://changeliberia-web.vercel.app/api/v1"
# OR if using separate API domain:
# NEXT_PUBLIC_API_URL="https://api.changeliberia.org/api/v1"

CORS_ORIGIN="https://changeliberia-web.vercel.app"
APP_URL="https://changeliberia-web.vercel.app"
```

### Step 2: Update apps/api/.env.local (local overrides)

Already configured! Just update:

```bash
# Current:
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Change to:
NEXT_PUBLIC_APP_URL=https://changeliberia-web.vercel.app
```

### Step 3: Update apps/web/.env.local

```bash
# Current:
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1

# Change to:
NEXT_PUBLIC_API_URL=https://changeliberia-web.vercel.app/api/v1
# OR if using separate API domain:
# NEXT_PUBLIC_API_URL=https://api.changeliberia.org/api/v1
```

### Step 4: Deploy Environment Variables

**For Vercel Deployment**:

1. Go to Vercel Project Settings → Environment Variables
2. Add/Update:
   - `NEXT_PUBLIC_API_URL` = `https://changeliberia-web.vercel.app/api/v1`
   - `NEXT_PUBLIC_APP_URL` = `https://changeliberia-web.vercel.app`
   - Any other needed variables

**For API Server** (if deployed separately):

1. Add environment variables to hosting platform
2. Update .env files
3. Redeploy

---

## 🌐 Domain Configuration Timeline

| Timeline | Task | Details |
|----------|------|---------|
| **Now** | Add domain to Resend | Takes 10 minutes |
| **Now** | Copy DNS records | Takes 2 minutes |
| **Now** | Add DNS records | Contact domain provider, ~10 minutes |
| **24-48 hrs** | Wait for DNS | Automatic - no action needed |
| **After DNS** | Verify in Resend | All 4 items must show ✓ |
| **After Verify** | Create webhook | Optional but recommended |
| **After Webhook** | Deploy & Test | Run verification suite |

---

## 📊 Configuration Verification Checklist

### API Configuration
- [ ] EMAIL_PROVIDER changed to "production"
- [ ] CORS_ORIGIN updated to https://changeliberia-web.vercel.app
- [ ] APP_URL updated to https://changeliberia-web.vercel.app
- [ ] NEXT_PUBLIC_API_URL set correctly
- [ ] RESEND_API_KEY present in .env.local
- [ ] MAIL_FROM set to noreply@changeliberia.org
- [ ] TRACKING_DOMAIN set to track.changeliberia.org
- [ ] REDIS_URL configured (redis://localhost:6379)

### Web Configuration
- [ ] NEXT_PUBLIC_API_URL set correctly
- [ ] NEXT_PUBLIC_APP_URL set to https://changeliberia-web.vercel.app
- [ ] NEXT_PUBLIC_GOOGLE_CLIENT_ID has production value

### Resend Configuration
- [ ] Domain added: changeliberia.org
- [ ] DNS records copied from Resend
- [ ] DNS records added to domain provider
- [ ] DNS propagation verified (24-48 hours)
- [ ] Domain verified in Resend (all 4 green)
- [ ] Webhook created (optional)
- [ ] Webhook secret in .env.local

---

## 🚀 Next Immediate Action

1. **Go to Resend Dashboard**: https://resend.com/domains
2. **Click "Add Domain"**
3. **Enter**: changeliberia.org
4. **Copy DNS Records** provided by Resend
5. **Add to Domain Provider** (Namecheap/GoDaddy/Route 53)
6. **Wait 24-48 hours** for DNS propagation
7. **Verify** in Resend dashboard

See `RESEND_CONFIGURATION_GUIDE.md` for detailed DNS setup instructions.

---

## 📞 Questions?

- **Resend Domain Docs**: https://resend.com/docs/domains/overview
- **Environment Variables**: See .env.local files
- **Deployment**: See DEPLOYMENT.md
- **Email System**: See EMAIL_DEPLOYMENT_README.md

---

**Document Version**: 1.0
**Status**: Ready for Production
**Created**: May 10, 2026
