# Railway API Deployment - Complete Setup Index

## 📍 Quick Links

**Quick Start?** → Read [RAILWAY_API_QUICK_REFERENCE.md](RAILWAY_API_QUICK_REFERENCE.md) (5 min read)

**Detailed Setup?** → Read [RAILWAY_API_SEPARATE_SERVICE_SETUP.md](RAILWAY_API_SEPARATE_SERVICE_SETUP.md) (20 min read)

**Stuck on Variables?** → Read [RAILWAY_ENV_VARIABLES_SETUP.md](RAILWAY_ENV_VARIABLES_SETUP.md) (10 min read)

**Having Issues?** → Read [RAILWAY_TROUBLESHOOTING_GUIDE.md](RAILWAY_TROUBLESHOOTING_GUIDE.md) (reference)

**Skip to Checklist?** → Jump to "Full Deployment Checklist" below

---

## 📋 What You're Doing

You're deploying the **NestJS API** as a separate service on Railway, independent from the frontend.

**Benefits:**
- ✅ Independent scaling
- ✅ Separate monitoring
- ✅ Easier debugging
- ✅ Standard microservices pattern
- ✅ Better performance under load

**What's Included:**
- API service (NestJS 11.0.0) running on Railway
- PostgreSQL database connection
- Email service (Resend)
- Stripe payments integration (if enabled)
- Redis caching/queue
- Frontend pointing to API

---

## 🚀 High-Level Steps

```
1. Create API service on Railway          (5 mins)
2. Configure build settings               (3 mins)
3. Add environment variables              (5 mins)
4. Wait for deployment                    (2-5 mins)
5. Get API URL from Railway               (1 min)
6. Update frontend with API URL           (5 mins)
7. Test everything works                  (5 mins)

Total: ~25-30 minutes
```

---

## 📚 Full Documentation Files

### For Immediate Setup
| File | Time | Content |
|------|------|---------|
| [RAILWAY_API_QUICK_REFERENCE.md](RAILWAY_API_QUICK_REFERENCE.md) | ⚡ 5 min | Step-by-step checklist for Railway dashboard |
| [RAILWAY_ENV_VARIABLES_SETUP.md](RAILWAY_ENV_VARIABLES_SETUP.md) | ⏱️ 10 min | Environment variables template & reference |

### For Detailed Understanding
| File | Time | Content |
|------|------|---------|
| [RAILWAY_API_SEPARATE_SERVICE_SETUP.md](RAILWAY_API_SEPARATE_SERVICE_SETUP.md) | 📖 20 min | Complete guide with explanations |
| [RAILWAY_TROUBLESHOOTING_GUIDE.md](RAILWAY_TROUBLESHOOTING_GUIDE.md) | 🔧 reference | Common issues and solutions |

---

## 🎯 Recommended Reading Order

### Path 1: "Just Get It Done" (Fastest)
1. ✅ Read: [RAILWAY_API_QUICK_REFERENCE.md](RAILWAY_API_QUICK_REFERENCE.md)
2. ✅ Do each phase with dashboard open
3. ✅ Test with verification checklist
4. ✅ Skip to "Success!" if all green

**Time: ~30 mins**

### Path 2: "Understand Everything" (Recommended)
1. ✅ Read: [RAILWAY_API_SEPARATE_SERVICE_SETUP.md](RAILWAY_API_SEPARATE_SERVICE_SETUP.md)
2. ✅ Read: [RAILWAY_ENV_VARIABLES_SETUP.md](RAILWAY_ENV_VARIABLES_SETUP.md)
3. ✅ Follow [RAILWAY_API_QUICK_REFERENCE.md](RAILWAY_API_QUICK_REFERENCE.md) with dashboard
4. ✅ Troubleshoot using [RAILWAY_TROUBLESHOOTING_GUIDE.md](RAILWAY_TROUBLESHOOTING_GUIDE.md) if needed

**Time: ~1 hour (but you'll understand everything)**

### Path 3: "I'm Stuck" (Problem Solving)
1. ✅ Note the exact error
2. ✅ Search [RAILWAY_TROUBLESHOOTING_GUIDE.md](RAILWAY_TROUBLESHOOTING_GUIDE.md)
3. ✅ Follow the specific fix
4. ✅ Test again

**Time: ~15 mins per issue**

---

## 🔑 Key Concepts

### What is "API Service"?
The backend server (NestJS) that handles:
- User authentication
- Petition management
- Email sending
- Payments
- Data storage
- Real-time updates

### What is "Separate Service"?
Instead of running API + frontend together:
- ❌ Old: One service running API + frontend
- ✅ New: Separate services for each:
  - Service 1: API only (port 4000)
  - Service 2: Frontend only (Next.js)

### Why Separate?
- **Independent scaling:** If frontend needs 2GB RAM and API needs 1GB, you buy exactly that
- **Better performance:** Each service only does its job
- **Easier debugging:** Isolate problems faster
- **Standard practice:** How modern apps are deployed

### API URL Format
```
Production: https://change-liberia-api-prod.railway.app/api/v1
Staging: https://api-staging.railway.app/api/v1
Local dev: http://localhost:4000/api/v1
```

The frontend needs this URL to communicate with the API.

---

## 📊 Architecture After Setup

```
┌─────────────────────────────────────────────────────┐
│                    Users (Internet)                 │
└────────────────────┬────────────────────────────────┘
                     │
        ┌────────────┴──────────────┐
        │                           │
┌───────▼──────────┐        ┌───────▼────────────┐
│   Frontend       │        │   API Service      │
│   (Next.js)      │        │   (NestJS)         │
│   on Railway     │        │   on Railway       │
│   or Vercel      │◄──────►│                    │
│                  │ /api/v1│  • Auth            │
│   • Pages        │        │  • Petitions       │
│   • Components   │        │  • Email           │
│   • Client logic │        │  • Payments        │
└──────────────────┘        │  • Webhooks        │
                            └────────┬───────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
            ┌───────▼────┐   ┌──────▼──────┐   ┌─────▼────┐
            │ PostgreSQL │   │ Redis       │   │ Resend   │
            │ Database   │   │ Cache/Queue │   │ Emails   │
            │            │   │             │   │          │
            └────────────┘   └─────────────┘   └──────────┘
```

---

## ⚙️ Environment Variables Overview

You'll need to provide these to Railway:

### Essential (Must Have)
```
NODE_ENV=production              # Enables optimizations
JWT_SECRET=your-secret-key      # Authenticates users
DATABASE_URL=postgres://...     # Database connection
```

### Email System
```
RESEND_API_KEY=re_...           # Email sending service
MAIL_FROM=noreply@...           # Email sender address
```

### Payments (If Enabled)
```
STRIPE_API_KEY=sk_live_...      # Payment processor
STRIPE_WEBHOOK_SECRET=whsec_... # Webhook verification
```

### Caching
```
REDIS_URL=redis://...           # Cache and queue database
```

### Full reference: [RAILWAY_ENV_VARIABLES_SETUP.md](RAILWAY_ENV_VARIABLES_SETUP.md)

---

## 🎯 Full Deployment Checklist

### Pre-Deployment
- [ ] Confirm you have `.env.production` file locally
- [ ] Backup current configuration
- [ ] Verify all database credentials work
- [ ] Test environment variables on local machine

### Phase 1: Create Railway Service
- [ ] Go to https://railway.app/dashboard
- [ ] Create new service from GitHub repository
- [ ] Name it appropriately (e.g., `change-liberia-api`)
- [ ] Verify Dockerfile path: `apps/api/Dockerfile`
- [ ] Wait for initial build to complete

### Phase 2: Configure Settings
- [ ] Set Builder type: Dockerfile
- [ ] Set Start command: `node dist/src/main.js`
- [ ] Set Health check path: `/health`
- [ ] Set Health check timeout: `300` seconds
- [ ] Enable auto-deployments if desired

### Phase 3: Add Environment Variables
- [ ] Add NODE_ENV=production
- [ ] Add JWT_SECRET (from .env.production)
- [ ] Add DATABASE_URL (from .env.production)
- [ ] Add STRIPE_API_KEY (if using payments)
- [ ] Add RESEND_API_KEY (if using email)
- [ ] Add REDIS_URL (if using caching)
- [ ] Add CORS_ORIGIN (include frontend domain)
- [ ] Add remaining variables from template
- [ ] Click Deploy to apply variables

### Phase 4: Verify Deployment
- [ ] Check deployment completes successfully
- [ ] Read build logs for any warnings
- [ ] Verify service shows "Running" status
- [ ] Verify no crashes/restarts

### Phase 5: Get API URL
- [ ] Note the public URL from Railway (e.g., https://api-xyz.railway.app)
- [ ] Test health endpoint: `curl https://[url]/health`
- [ ] Confirm response: `{"status":"ok"}`

### Phase 6: Update Frontend
- [ ] Deploy frontend to Railway or Vercel
- [ ] Add environment variable: `NEXT_PUBLIC_API_URL=https://[api-url]/api/v1`
- [ ] Wait for frontend deployment
- [ ] Verify frontend loads without console errors

### Phase 7: End-to-End Testing
- [ ] Open frontend URL in browser
- [ ] Open Developer Tools (F12)
- [ ] Go to Network tab
- [ ] Perform action: Sign up or create petition
- [ ] Verify API requests appear with 200-201 status
- [ ] Verify responses contain expected data
- [ ] Test full user flow (signup, create, view)

### Post-Deployment
- [ ] Configure custom domain (optional)
- [ ] Set up database backups
- [ ] Enable monitoring/alerts
- [ ] Monitor logs for first 24 hours
- [ ] Document for team
- [ ] Plan maintenance windows

---

## ✅ Success Criteria

Your deployment is successful when:

✅ **API Health**
- Health endpoint returns 200 with `{"status":"ok"}`

✅ **Database Connection**
- Can query: `curl https://[api-url]/api/v1/petitions`
- Returns list of petitions (empty array if none)

✅ **Frontend Connection**
- Frontend loads without errors
- Browser network shows requests to `https://[api-url]/api/v1/*`

✅ **Full Flow**
- Users can sign up
- Users can create petitions
- Petitions appear in database
- Admin can manage content

✅ **Performance**
- API response times < 500ms typically
- Health checks passing consistently
- No memory/CPU warnings in logs

---

## 🆘 If Something Goes Wrong

1. **Identify the issue** using the error message
2. **Open** [RAILWAY_TROUBLESHOOTING_GUIDE.md](RAILWAY_TROUBLESHOOTING_GUIDE.md)
3. **Search** for the issue in the guide
4. **Follow** the specific fix steps
5. **Test** again using verification commands
6. **Repeat** if needed

**Most common issues have documented solutions!**

---

## 📞 Support & Resources

### Documentation
- [Railway Docs](https://docs.railway.app/)
- [NestJS Docs](https://docs.nestjs.com/)
- [Next.js Docs](https://nextjs.org/docs)

### Your Files
- [RAILWAY_API_SEPARATE_SERVICE_SETUP.md](RAILWAY_API_SEPARATE_SERVICE_SETUP.md) - Detailed guide
- [RAILWAY_API_QUICK_REFERENCE.md](RAILWAY_API_QUICK_REFERENCE.md) - Quick checklist
- [RAILWAY_ENV_VARIABLES_SETUP.md](RAILWAY_ENV_VARIABLES_SETUP.md) - Environment setup
- [RAILWAY_TROUBLESHOOTING_GUIDE.md](RAILWAY_TROUBLESHOOTING_GUIDE.md) - Problem solving

### Quick Help
- Check Railway logs: https://railway.app/dashboard
- Check Docker build locally: `docker build -f apps/api/Dockerfile .`
- Test database: `psql $DATABASE_URL -c "SELECT 1"`

---

## 📈 Next Steps After Successful Deployment

### Short Term (First Week)
1. Monitor logs daily
2. Test all user flows
3. Check performance metrics
4. Verify email notifications work

### Medium Term (First Month)
1. Set up automated monitoring
2. Create team documentation
3. Plan for scale testing
4. Configure backups

### Long Term (Ongoing)
1. Monitor costs
2. Optimize slow endpoints
3. Update dependencies
4. Plan capacity upgrades

---

## 🎓 Learning Resources

### NestJS + PostgreSQL
- [NestJS Database Guide](https://docs.nestjs.com/techniques/database)
- [Prisma Documentation](https://www.prisma.io/docs/)

### Production Deployment
- [12 Factor App](https://12factor.net/)
- [Railway Best Practices](https://docs.railway.app/guides/deployment)

### Monitoring & Logging
- [ELK Stack](https://www.elastic.co/what-is/elk-stack)
- [Railway Metrics](https://docs.railway.app/features/metrics)

---

## 💡 Tips & Tricks

### Development Speed
- Push to git and Railway auto-deploys
- Use `git push origin main` to trigger new build
- Check Railway's "Deployments" tab to see progress

### Debugging
- Enable verbose logging in NestJS
- Use Railway's built-in terminal for live debugging
- Export logs locally for analysis

### Cost Optimization
- Use Railway's free tier during development
- Upgrade only when needed
- Monitor resource usage regularly

### Security
- Rotate JWT_SECRET quarterly
- Use strong random secrets (32+ characters)
- Never commit `.env.production` to git
- Restrict CORS to known frontend domains

---

## 📝 Version History

This guide supports:
- **Railway**: Latest version
- **NestJS**: 11.0.0+
- **Next.js**: 16.2.3+
- **PostgreSQL**: 12+

Last updated: May 27, 2026

---

## ❓ FAQ

**Q: Can I use this with multiple frontends?**
A: Yes! Set the same API URL on each frontend's environment variables.

**Q: Do I need to know Docker to use this?**
A: No! Railway handles Docker automatically. The `railway.json` file configures everything.

**Q: How do I rollback if something breaks?**
A: Use Railway's "Deployments" tab to rollback to any previous version with one click.

**Q: Can I run API and frontend on the same Railway service?**
A: Not recommended. Separate services provide better isolation and scaling.

**Q: What if my database is external (not on Railway)?**
A: That's fine! Just provide the DATABASE_URL pointing to your external database.

**Q: How much will this cost?**
A: ~$30-50/month for API service + frontend + database on Railway's free tier or starter plan.

**Q: Can I use GitHub Actions for CI/CD?**
A: Yes! Railway integrates with GitHub automatically.

---

## 🎉 You're Ready!

Pick your reading path above and get started. Most deployments take 30-45 minutes from start to working system.

**Good luck! You've got this.** 🚀

