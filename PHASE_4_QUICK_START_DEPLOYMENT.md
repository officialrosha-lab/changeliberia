# Phase 4 Production Deployment - Quick Start Guide

**Purpose:** Fast-track deployment of Phase 4 real-time analytics
**Time Required:** 1-2 hours
**Skill Level:** Advanced DevOps/Senior Developer
**Date:** June 1, 2025

---

## ⚡ Quick Reference: 3-Step Deployment

### Step 1: Verify & Prepare (15 minutes)
```bash
# 1. Run automated tests
cd /Users/visionalventure/Change\ Liberia
bash run-e2e-tests.sh

# Expected Output:
# ✅ PASS - Backend TypeScript compilation
# ✅ PASS - Frontend TypeScript compilation
# ✅ PASS - AnalyticsGateway file exists
# ✅ PASS - AnalyticsRealtimeService file exists
# ✅ PASS - useAnalyticsRealtime hook exists
# ✅ PASS - analytics-realtime components exist

# 2. Verify builds are complete
ls -lh apps/api/dist/ apps/web/.next/

# 3. Check environment variables
cat .env | grep -E "FRONTEND_URL|DATABASE_URL|JWT_SECRET"
```

### Step 2: Deploy Backend (30-45 minutes)
```bash
# 1. Build Docker image
cd apps/api
docker build -t change-liberia-api:4.0.0 -f Dockerfile .

# 2. Tag for registry
docker tag change-liberia-api:4.0.0 registry.yourhost.com/change-liberia-api:4.0.0

# 3. Push to registry
docker push registry.yourhost.com/change-liberia-api:4.0.0

# 4. Deploy to Kubernetes or Docker Compose
# For Kubernetes:
kubectl set image deployment/api-deployment \
  api=registry.yourhost.com/change-liberia-api:4.0.0

# For Docker Compose:
docker-compose up -d api

# 5. Run database migrations
docker exec change-liberia-api npx prisma migrate deploy

# 6. Verify API is healthy
curl https://api.your-domain.com/api/health
# Expected: 200 OK or 404 (if health endpoint not available)

# 7. Verify analytics endpoints
curl -H "Authorization: Bearer TOKEN" \
  https://api.your-domain.com/api/analytics/messages?period=week
# Expected: 200 with JSON data or 401 if unauthorized
```

### Step 3: Deploy Frontend (15-30 minutes)
```bash
# 1. Build Next.js app
cd apps/web
pnpm build

# 2. Build Docker image
docker build -t change-liberia-web:4.0.0 -f Dockerfile .

# 3. Tag and push
docker tag change-liberia-web:4.0.0 registry.yourhost.com/change-liberia-web:4.0.0
docker push registry.yourhost.com/change-liberia-web:4.0.0

# 4. Deploy
# For Kubernetes:
kubectl set image deployment/web-deployment \
  web=registry.yourhost.com/change-liberia-web:4.0.0

# For Docker Compose:
docker-compose up -d web

# 5. Verify frontend is accessible
curl https://your-domain.com
# Expected: 200 OK

# 6. Test WebSocket connection (manual)
# Open browser: https://your-domain.com/admin
# Open DevTools → Network → Filter by "WS"
# Navigate to Analytics tab
# Verify connection to ws://api.your-domain.com/socket.io/analytics
```

---

## 🧪 Post-Deployment Verification (15 minutes)

### Quick Smoke Tests
```bash
# 1. API Health
curl https://api.your-domain.com/api/health

# 2. Analytics Messages Endpoint
curl -H "Authorization: Bearer TOKEN" \
  "https://api.your-domain.com/api/analytics/messages?period=week"

# 3. Analytics Broadcasts Endpoint
curl -H "Authorization: Bearer TOKEN" \
  "https://api.your-domain.com/api/analytics/broadcasts?period=week"

# 4. Frontend Home
curl https://your-domain.com

# 5. Admin Analytics Page
# Manual: Open browser and navigate to https://your-domain.com/admin/analytics
# Check for "Live updates enabled" indicator
```

### Real-time Feature Verification
1. Open Analytics dashboard in browser
2. Open DevTools (F12) → Network → WS filter
3. Create a test message or broadcast (in another tab)
4. Verify in Analytics:
   - [ ] WebSocket `analytics_update` event appears
   - [ ] Dashboard metrics update automatically
   - [ ] Green notification badge appears
   - [ ] Live update feed shows new activity
   - [ ] "Last updated" timestamp changes

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────┐
│   Frontend (Next.js)                │
│   - admin-analytics.tsx             │
│   - useAnalyticsRealtime hook       │
│   - analytics-realtime components   │
└────────────┬────────────────────────┘
             │ WebSocket
             │ /analytics namespace
             ▼
┌─────────────────────────────────────┐
│   Backend (NestJS)                  │
│   - AnalyticsGateway                │
│   - AnalyticsRealtimeService        │
│   - Analytics Controllers           │
└────────────┬────────────────────────┘
             │ Database
             ▼
┌─────────────────────────────────────┐
│   PostgreSQL                        │
│   - Messages, Broadcasts, Users     │
└─────────────────────────────────────┘
```

---

## 🔐 Security Checklist

- [ ] JWT tokens enabled and validated
- [ ] ADMIN-only WebSocket access enforced
- [ ] CORS configured for your domain
- [ ] SSL/TLS certificates installed (HTTPS/WSS)
- [ ] Environment variables secured
- [ ] Database access restricted
- [ ] API rate limiting enabled (recommended)
- [ ] Error logging configured

---

## ⚠️ Troubleshooting Quick Fixes

### WebSocket Won't Connect
```bash
# Check FRONTEND_URL in backend environment
echo $FRONTEND_URL
# Should match your production domain

# Verify CORS configuration
# Backend: FRONTEND_URL must exactly match frontend domain

# Check ports are open
lsof -i :4000  # API port
lsof -i :3000  # Frontend port (if running locally)

# Verify SSL/TLS on production
curl -I https://api.your-domain.com/
# Should show 200 or 404, not SSL errors
```

### API Returns 401 Errors
```bash
# Verify JWT token is valid
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.your-domain.com/api/analytics/messages?period=week

# If 401: Token expired or invalid
# Generate new token or check JWT_SECRET
```

### High Memory Usage
```bash
# Check for memory leaks in WebSocket connections
docker stats change-liberia-api

# Monitor connection count
curl https://api.your-domain.com/metrics | grep websocket_connections

# Restart if needed
docker-compose restart api
```

### Dashboard Not Updating
```bash
# Check WebSocket is connected (browser DevTools)
# Network tab should show ws:// connection

# Verify backend is receiving events
# Add console.log to AnalyticsRealtimeService

# Check network latency
# DevTools → Network → measure response times
```

---

## 📈 Monitoring & Alerts

### Key Metrics to Watch
- WebSocket connection count (should be < 50)
- API response time (should be < 500ms)
- Error rate (should be < 1%)
- Database query time (should be < 200ms)

### Alert Thresholds
```
High Priority:
- Error rate > 5%
- API response > 2 seconds
- WebSocket connections > 100
- Database down

Medium Priority:
- Error rate > 1%
- API response > 1 second
- Memory usage > 80%

Low Priority:
- Slow API responses (500-1000ms)
- High CPU usage > 75%
```

---

## 📚 Full Documentation

For detailed information, see:

1. **[PHASE_4_PRODUCTION_DEPLOYMENT_CHECKLIST.md](./PHASE_4_PRODUCTION_DEPLOYMENT_CHECKLIST.md)**
   - Step-by-step deployment guide
   - Environment setup
   - Database migration
   - Rollback procedures

2. **[PHASE_4_E2E_TESTING_GUIDE.md](./PHASE_4_E2E_TESTING_GUIDE.md)**
   - Complete test scenarios
   - Performance benchmarks
   - Debugging procedures

3. **[PHASE_4_REALTIME_INFRASTRUCTURE.md](./PHASE_4_REALTIME_INFRASTRUCTURE.md)**
   - Technical architecture
   - Security implementation
   - API documentation

4. **[PHASE_4_DEPLOYMENT_SUMMARY.md](./PHASE_4_DEPLOYMENT_SUMMARY.md)**
   - Build status
   - Deployment readiness
   - Pre-deployment checklist

---

## 🎯 Success Criteria

✅ Deployment is successful when:
- API responds on port 4000
- Frontend loads on production domain
- WebSocket connects to /analytics namespace
- Dashboard updates in real-time
- No TypeScript errors in console
- No network errors in DevTools
- Performance metrics within benchmarks

---

## 🚀 Next Steps After Deployment

1. **Monitor for 24 hours** - Watch logs and metrics
2. **Gather feedback** - From admin users
3. **Plan Phase 5** - E2E testing & performance optimization
4. **Update documentation** - With any learnings
5. **Schedule Phase 5** - Start date and team allocation

---

## 📞 Support

**Need Help?**
- Technical Issues: See troubleshooting section above
- Architecture Questions: See [PHASE_4_REALTIME_INFRASTRUCTURE.md](./PHASE_4_REALTIME_INFRASTRUCTURE.md)
- Deployment Issues: See [PHASE_4_PRODUCTION_DEPLOYMENT_CHECKLIST.md](./PHASE_4_PRODUCTION_DEPLOYMENT_CHECKLIST.md)
- General Reference: See [DOCUMENTATION_INDEX_UPDATED.md](./DOCUMENTATION_INDEX_UPDATED.md)

---

**Deployment Ready:** ✅ YES
**Build Status:** ✅ SUCCESS (0 errors)
**Documentation:** ✅ COMPLETE
**Go/No-Go:** ✅ GO FOR DEPLOYMENT

**Last Updated:** June 1, 2025
**Maintained By:** Development Team
**Version:** 1.0
