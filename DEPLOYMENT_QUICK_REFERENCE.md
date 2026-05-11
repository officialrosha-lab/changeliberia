# Deployment Quick Reference - Vercel vs Railway

**Goal**: Deploy Change Liberia to production
**Timeline**: ~2-3 hours (including DNS propagation)
**Status**: Ready ✅

---

## 🎯 Overview

| Component | Platform | URL | Status |
|-----------|----------|-----|--------|
| **Frontend** (Next.js web app) | Vercel | https://changeliberia-web.vercel.app | Ready ✅ |
| **Backend** (NestJS API) | Railway | https://api.changeliberia.org | Ready ✅ |
| **Database** | Railway PostgreSQL | Internal | Ready ✅ |
| **Cache** | Railway Redis | Internal | Ready ✅ |

---

## 📊 Deployment Comparison

### Vercel (Frontend)

| Aspect | Details |
|--------|---------|
| **Service** | Next.js web app |
| **Repository** | officialrosha-lab/changeliberia |
| **Directory** | apps/web |
| **URL** | https://changeliberia-web.vercel.app |
| **Trigger** | Push to main branch |
| **Build time** | 2-3 minutes |
| **Cost** | Free tier includes production |
| **CDN** | Global (included) |
| **SSL** | Free (automatic) |

### Railway (Backend)

| Aspect | Details |
|--------|---------|
| **Service** | NestJS API + Database + Cache |
| **Repository** | officialrosha-lab/changeliberia |
| **Directory** | apps/api |
| **URL** | https://api.changeliberia.org |
| **Trigger** | Push to main branch |
| **Build time** | 5-10 minutes |
| **Cost** | ~$5/month starter |
| **Infrastructure** | Docker containers |
| **SSL** | Free (automatic) |

---

## 🚀 Quick Start Summary

### ✅ STEP 1: Vercel Frontend Deployment (10 minutes)

```bash
# 1. Go to Vercel dashboard
https://vercel.com/projects

# 2. Connect GitHub repo (if not already done)
# Click "Add New..." → "Project"
# Select changeliberia repository

# 3. Add environment variables
Settings → Environment Variables

NEXT_PUBLIC_API_URL=https://api.changeliberia.org/api/v1
NEXT_PUBLIC_APP_URL=https://changeliberia-web.vercel.app
NEXT_PUBLIC_GOOGLE_CLIENT_ID=[production-id]

# 4. Deploy
git push origin main
# Vercel auto-deploys and shows build progress

# 5. Verify
https://changeliberia-web.vercel.app ✓
```

**Detailed Guide**: [VERCEL_DEPLOYMENT_STEPS.md](VERCEL_DEPLOYMENT_STEPS.md)

---

### ✅ STEP 2: Railway Backend Deployment (15 minutes)

```bash
# 1. Go to Railway dashboard
https://railway.app/

# 2. Create project
"New Project" → "Deploy from GitHub"
Select changeliberia repository

# 3. Add services (if needed)
- PostgreSQL
- Redis

# 4. Configure environment variables
Variables tab → Add all API variables

DATABASE_URL=[from PostgreSQL service]
REDIS_URL=[from Redis service]
RESEND_API_KEY=re_V39tR44W_PmhRUhmg9k79ZrUpCe6F7AKx
MAIL_FROM=noreply@changeliberia.org
# ... add all others (see detailed guide)

# 5. Add custom domain
Domains → "Add Custom Domain"
Enter: api.changeliberia.org
Add CNAME record to your domain provider

# 6. Deploy
git push origin main
# Railway auto-detects and builds

# 7. Verify
https://api.changeliberia.org/health ✓
```

**Detailed Guide**: [RAILWAY_DEPLOYMENT_STEPS.md](RAILWAY_DEPLOYMENT_STEPS.md)

---

### ✅ STEP 3: Add DNS Records for API Domain

**For api.changeliberia.org**:

1. Go to your domain provider (Namecheap, GoDaddy, Route 53, etc.)
2. Add CNAME record from Railway:
   ```
   Type: CNAME
   Name: api
   Value: [from Railway dashboard]
   ```
3. Wait 5-30 minutes for DNS propagation

**Verification**:
```bash
# Check DNS resolved
nslookup api.changeliberia.org

# Test API endpoint
curl https://api.changeliberia.org/health
# Expected: { "status": "ok" }
```

---

## 📋 Pre-Deployment Checklist

### Code & Configuration ✓
- [ ] All code committed to main branch
- [ ] No build errors locally
- [ ] Environment variables prepared
- [ ] `.env.local` files updated
- [ ] Database migrations ready
- [ ] Email system configured

### Vercel ✓
- [ ] GitHub repository connected
- [ ] Environment variables set
- [ ] Build settings configured
- [ ] Custom domain added (optional)
- [ ] Deployment triggered or auto-configured

### Railway ✓
- [ ] Project created with services
- [ ] PostgreSQL connected
- [ ] Redis connected
- [ ] All environment variables set
- [ ] Custom domain configured
- [ ] Docker build validated

### DNS & Domains ✓
- [ ] API domain provider access available
- [ ] DNS records ready to add
- [ ] TTL set appropriately
- [ ] Domain verification plan ready

---

## 🔄 Deployment Flow

```
┌─────────────────────────────────────────────┐
│  1. Push to GitHub main branch              │
│     git push origin main                    │
└───────────────┬───────────────────────────────┘
                │
    ┌───────────┴─────────────┐
    │                         │
    ▼                         ▼
┌──────────────────┐   ┌──────────────────┐
│  VERCEL           │   │  RAILWAY         │
│  Frontend Deploy  │   │  Backend Deploy  │
│  (2-3 minutes)    │   │  (5-10 minutes)  │
└────────┬─────────┘   └────────┬─────────┘
         │                      │
         ▼                      ▼
┌──────────────────┐   ┌──────────────────┐
│  Web Running ✓   │   │  API Running ✓   │
│  https://...     │   │  https://api...  │
└──────────────────┘   └──────────────────┘
         │                      │
         └───────────┬──────────┘
                     │
                     ▼
        ┌───────────────────────────┐
        │  Production Ready ✓        │
        │  Both services running     │
        │  with all features active  │
        └───────────────────────────┘
```

---

## 🎯 Timeline

| Phase | Task | Duration | Dependencies |
|-------|------|----------|--------------|
| 1 | Vercel setup | 10 min | GitHub connected |
| 2 | Railway setup | 15 min | Vercel deployed |
| 3 | DNS records | 5 min | Railway API URL ready |
| 4 | DNS propagation | 5-30 min | Records added |
| 5 | Testing | 10 min | DNS verified |
| 6 | Monitoring | Ongoing | Both live |

**Total Active Time**: ~40 minutes
**Total Passive Time**: 5-30 minutes (DNS)
**Total Timeline**: ~1 hour

---

## 📞 After Deployment

### Verify Everything Works

```bash
# 1. Frontend
curl https://changeliberia-web.vercel.app
# Check pages load, no 404s

# 2. API Health
curl https://api.changeliberia.org/health
# Expected: { "status": "ok" }

# 3. API Docs
# Visit: https://api.changeliberia.org/api/docs
# Try endpoints in Swagger UI

# 4. Connect Frontend to Backend
# Visit: https://changeliberia-web.vercel.app/admin
# Try logging in
# Try creating/editing content
```

### Monitor Performance

**Vercel Dashboard**:
- https://vercel.com/projects/changeliberia
- Check Analytics, Build status, Errors

**Railway Dashboard**:
- https://railway.app/
- Monitor CPU, Memory, Logs

---

## 🚨 Troubleshooting Quick Links

| Issue | Guide |
|-------|-------|
| Build fails | See "Common Issues" in [VERCEL_DEPLOYMENT_STEPS.md](VERCEL_DEPLOYMENT_STEPS.md) |
| API not responding | See "Common Issues" in [RAILWAY_DEPLOYMENT_STEPS.md](RAILWAY_DEPLOYMENT_STEPS.md) |
| DNS not resolving | Check domain provider, verify CNAME record |
| Frontend can't reach API | Check CORS_ORIGIN in Railway, check API URL in Vercel env vars |
| Database connection failed | Verify DATABASE_URL in Railway environment |
| Email not sending | Check Resend API key, verify MAIL_FROM address |

---

## 📚 Detailed Guides

1. **[VERCEL_DEPLOYMENT_STEPS.md](VERCEL_DEPLOYMENT_STEPS.md)**
   - Complete Vercel setup guide
   - Environment variables
   - Custom domains
   - Troubleshooting

2. **[RAILWAY_DEPLOYMENT_STEPS.md](RAILWAY_DEPLOYMENT_STEPS.md)**
   - Complete Railway setup guide
   - Services configuration
   - Database & Cache setup
   - Monitoring

3. **[RESEND_CONFIGURATION_GUIDE.md](RESEND_CONFIGURATION_GUIDE.md)**
   - Email domain setup
   - DNS configuration
   - Webhook setup

4. **[PRODUCTION_ENVIRONMENT_SETUP.md](PRODUCTION_ENVIRONMENT_SETUP.md)**
   - Environment variable reference
   - Configuration files

---

## 🎉 Success Criteria

You'll know deployment is successful when:

✅ **Frontend** (Vercel)
- Web app loads at https://changeliberia-web.vercel.app
- All pages render correctly
- Admin dashboard accessible
- No console errors

✅ **Backend** (Railway)
- API responds at https://api.changeliberia.org/health
- Swagger docs accessible at /api/docs
- Database connected and migrations applied
- Email service initialized

✅ **Integration**
- Frontend can reach backend API
- Authentication works end-to-end
- Pages can be created/edited
- Emails send successfully

✅ **Monitoring**
- Both dashboards show healthy services
- No critical errors in logs
- Performance metrics acceptable

---

**Status**: Ready for deployment
**Created**: May 11, 2026
**Version**: 1.0
**Next Step**: Start with Vercel deployment (10 minutes)
