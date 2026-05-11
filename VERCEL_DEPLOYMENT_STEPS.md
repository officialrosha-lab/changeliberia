# Vercel Deployment Steps - Complete Guide

**Target**: Deploy Next.js web app to Vercel
**URL**: https://changeliberia-web.vercel.app/
**Repository**: officialrosha-lab/changeliberia (branch: main)

---

## 📋 Prerequisites

Before starting, ensure:
- [ ] GitHub account with access to officialrosha-lab/changeliberia
- [ ] Vercel account (free tier is fine)
- [ ] Code pushed to GitHub main branch
- [ ] All environment variables ready
- [ ] Vercel project linked to GitHub repo

---

## 🚀 Step-by-Step Deployment

### Step 1: Connect Repository to Vercel (One-time setup)

**Option A: If using vercel.json**
```bash
# Vercel will auto-detect from vercel.json in root
# Just push to GitHub and Vercel will trigger
git push origin main
```

**Option B: Manual Connection**

1. Go to: https://vercel.com/
2. Sign in with GitHub
3. Click **"Add New..."** → **"Project"**
4. Select **"changeliberia"** repository
5. Click **"Import"**
6. Vercel will auto-detect:
   - Framework: **Next.js**
   - Root Directory: **./apps/web** ✓
   - Build Command: **npm run build** ✓
7. Click **"Deploy"**

---

### Step 2: Configure Environment Variables

**In Vercel Dashboard** (https://vercel.com/projects):

1. Find project: **changeliberia**
2. Go to **Settings** → **Environment Variables**
3. Add these variables:

```bash
# Frontend-facing variables (NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_APP_URL=https://changeliberia-web.vercel.app
NEXT_PUBLIC_API_URL=https://changeliberia-web.vercel.app/api/v1
# OR if using separate API domain:
# NEXT_PUBLIC_API_URL=https://api.changeliberia.org/api/v1

NEXT_PUBLIC_GOOGLE_CLIENT_ID=[your-production-client-id]

# Server-side variables (if needed)
# Add any API keys or secrets here
```

4. Set scope to: **Production**, **Preview**, **Development** (check all)
5. Click **"Save"**

---

### Step 3: Configure Build Settings

1. Go to **Settings** → **Build & Development Settings**
2. Verify:
   - **Framework Preset**: Next.js ✓
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `pnpm install`
   - **Node.js Version**: 20.x or 22.x

---

### Step 4: Deploy from GitHub

**Automatic Deployment** (Recommended):
```bash
# Any push to main triggers auto-deploy
git add .
git commit -m "deployment: ready for production"
git push origin main

# Vercel automatically:
# 1. Detects changes
# 2. Builds Next.js project
# 3. Runs tests (if configured)
# 4. Deploys to production
```

**Manual Deployment** (Backup):

1. Go to Vercel dashboard → changeliberia project
2. Click **"Deployments"** tab
3. Find latest commit
4. Click **"Redeploy"** button

---

### Step 5: Verify Deployment

**Check Build Status**:
1. Go to: https://vercel.com/projects/changeliberia
2. Look for **"Deployments"** section
3. Latest deployment should show:
   - ✅ Built successfully (green checkmark)
   - Last update time
   - Commit hash

**Check Live URL**:
```bash
# Visit the deployment
https://changeliberia-web.vercel.app/

# Check specific pages
https://changeliberia-web.vercel.app/admin
https://changeliberia-web.vercel.app/about
https://changeliberia-web.vercel.app/how-it-works
```

**View Build Logs**:
1. Go to Deployments
2. Click latest deployment
3. Look at **"Build Logs"** tab for any errors

---

## 📊 Deployment Status Page

**Dashboard**: https://vercel.com/projects/changeliberia

| Section | What to Check |
|---------|---------------|
| **Deployments** | List of all deployments, status, timestamps |
| **Settings** | Environment vars, build config, domains |
| **Analytics** | Page performance, Core Web Vitals |
| **Logs** | Real-time function logs, errors |
| **Monitoring** | Uptime, response times, errors |

---

## 🔄 Rollback (If Needed)

If deployment has issues:

1. Go to Vercel dashboard → **Deployments**
2. Find previous working deployment
3. Click **"Promote to Production"** button
4. This reverts to that version instantly

**Or from GitHub**:
```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Vercel auto-deploys this revert
```

---

## ✅ Deployment Checklist

Before pushing to production:

- [ ] All code changes committed to main
- [ ] Environment variables set in Vercel
- [ ] `.env.local` has correct values:
  ```bash
  NEXT_PUBLIC_API_URL=https://changeliberia-web.vercel.app/api/v1
  NEXT_PUBLIC_APP_URL=https://changeliberia-web.vercel.app
  ```
- [ ] Local build succeeds: `npm run build`
- [ ] No console errors or warnings
- [ ] All pages load correctly
- [ ] API endpoints accessible
- [ ] Authentication works
- [ ] Email forms submit successfully
- [ ] Admin dashboard loads
- [ ] Database migrations applied (on API side)

---

## 🚨 Common Issues & Fixes

### Issue: "Module not found" error

**Solution**: 
- Check import paths (relative paths must be correct)
- Example: `import Component from '../lib/api'` not `../../lib/api`
- See: [admin-social-media-dashboard fix](apps/web/components/admin-social-media-dashboard.tsx#L4-L5)

### Issue: Build fails with TypeScript errors

**Solution**:
- Run `npm run build` locally to see exact errors
- Check `.env` variables are correct
- Example error: HeadersInit type → use `Record<string, string>`

### Issue: "Cannot find module @change-liberia/types"

**Solution**:
- Ensure monorepo packages are built: `pnpm build`
- Check package.json references
- Rebuild: `pnpm install && pnpm build`

### Issue: Static files 404

**Solution**:
- Files should be in `public/` directory
- Access as: `/filename` not `/public/filename`
- Build includes public files automatically

### Issue: API endpoints returning 404

**Solution**:
- Check `NEXT_PUBLIC_API_URL` environment variable
- Verify API is deployed and running
- Test endpoint directly: `curl https://api.changeliberia.org/health`

---

## 📞 Vercel Support

- **Status Page**: https://www.vercel-status.com/
- **Documentation**: https://vercel.com/docs
- **Support**: https://vercel.com/support
- **Community**: https://github.com/vercel/next.js/discussions

---

## 🔗 Useful Links

| Link | Purpose |
|------|---------|
| https://vercel.com/projects/changeliberia | Dashboard |
| https://changeliberia-web.vercel.app/ | Live deployment |
| https://vercel.com/docs/deployments/overview | Deploy docs |
| https://vercel.com/docs/concepts/environment-variables | Env vars |

---

## ⏭️ Next Steps After Deployment

1. **Verify API Connection**:
   ```bash
   curl https://changeliberia-web.vercel.app/api/health
   ```

2. **Monitor Performance**:
   - Check Vercel Analytics dashboard
   - Monitor Core Web Vitals
   - Set up alerts

3. **Smoke Tests**:
   - [ ] Home page loads
   - [ ] Admin login works
   - [ ] Pages can be created/edited
   - [ ] Emails send successfully
   - [ ] API responds correctly

4. **Set Up CDN** (Optional):
   - Vercel includes CDN by default
   - No additional setup needed
   - Files cached globally

5. **Enable Analytics** (Optional):
   - Go to Settings → Analytics
   - Track page performance
   - Get insights on usage

---

**Status**: Ready to deploy to Vercel
**Created**: May 11, 2026
**Version**: 1.0
