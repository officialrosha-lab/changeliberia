# Facebook & WhatsApp Admin Integration Guide

## Overview

The admin panel now includes comprehensive monitoring and management capabilities for Facebook and WhatsApp integrations. This document provides setup instructions, usage guidelines, and API reference.

## Features

### Admin Panel Integration
- **New Tab**: "Social Media" tab in admin panel at `/admin`
- **Sub-tabs**: Overview, Facebook Pixel, WhatsApp Growth
- **Real-time Metrics**: 30-second auto-refresh for live data
- **Health Indicators**: Configuration status and connectivity checks

### Facebook Integration
- **Pixel Event Tracking**: Monitor all Facebook pixel events
- **Configuration Status**: Verify required environment variables are set
- **Event Breakdown**: View distribution of different event types
- **Trend Analysis**: Real-time event monitoring

### WhatsApp Integration
- **Viral Growth Metrics**: Track referral conversion and fraud rates
- **Campaign Statistics**: Monitor active campaigns and engagement
- **Trending Petitions**: Identify top-performing petitions
- **Health Checks**: Configuration status and API connectivity

## Setup Instructions

### Prerequisites
```bash
# Ensure environment variables are configured
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
FACEBOOK_PIXEL_ID=your_pixel_id
FACEBOOK_ACCESS_TOKEN=your_access_token

WHATSAPP_API_TOKEN=your_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_account_id
WHATSAPP_WEBHOOK_TOKEN=your_webhook_token
```

### 1. Deploy API Changes
```bash
cd apps/api
npm run build
npm run start
```

### 2. Deploy Web Changes
```bash
cd apps/web
npm run build
npm run start
```

### 3. Access Admin Panel
1. Navigate to `/admin` in your browser
2. Sign in with admin credentials
3. Click "Social Media" tab

## API Reference

### Base URL
```
GET /admin/social-media/dashboard
GET /admin/social-media/facebook/health
GET /admin/social-media/facebook/pixel-stats?days=30
GET /admin/social-media/whatsapp/health
GET /admin/social-media/whatsapp/growth-metrics?days=30
GET /admin/social-media/whatsapp/campaign-stats
```

### 1. Social Media Dashboard
**Endpoint**: `GET /admin/social-media/dashboard`

**Response**:
```json
{
  "facebook": {
    "status": "healthy|degraded|error",
    "configured": {
      "appId": true,
      "appSecret": true,
      "pixelId": true,
      "accessToken": true
    },
    "pixelId": "123456789***"
  },
  "whatsapp": {
    "status": "healthy|degraded|error",
    "configured": {
      "apiToken": true,
      "phoneNumberId": true,
      "businessAccountId": true,
      "webhookToken": true
    },
    "phoneNumberId": "1234567***"
  },
  "metrics": {
    "growth": {
      "totalReferrals": 1250,
      "convertedReferrals": 325,
      "conversionRate": "26.00%",
      "fraudBlockedReferrals": 8,
      "trendingPetitions": [
        { "id": "pet_123", "title": "Climate Action Now" }
      ],
      "period": "30 days"
    },
    "pixelEvents": {
      "totalEvents": 5420,
      "uniqueEvents": 8,
      "eventBreakdown": {
        "ViewContent": 2100,
        "AddToCart": 1200,
        "Purchase": 890
      },
      "period": "30 days"
    }
  },
  "lastUpdated": "2025-01-10T18:30:45.123Z"
}
```

### 2. Facebook Health Check
**Endpoint**: `GET /admin/social-media/facebook/health`

**Response**:
```json
{
  "status": "healthy",
  "configured": {
    "appId": true,
    "appSecret": true,
    "pixelId": true,
    "accessToken": true
  },
  "pixelId": "123456789***"
}
```

**Status Values**:
- `healthy`: All required configurations present
- `degraded`: Some configurations missing
- `error`: Unable to check status

### 3. Facebook Pixel Statistics
**Endpoint**: `GET /admin/social-media/facebook/pixel-stats?days=30`

**Query Parameters**:
- `days` (optional): Number of days to analyze (default: 30)

**Response**:
```json
{
  "totalEvents": 5420,
  "uniqueEvents": 8,
  "eventBreakdown": {
    "ViewContent": 2100,
    "AddToCart": 1200,
    "InitiateCheckout": 600,
    "Purchase": 890,
    "CompleteRegistration": 400,
    "Subscribe": 230
  },
  "period": "30 days"
}
```

### 4. WhatsApp Health Check
**Endpoint**: `GET /admin/social-media/whatsapp/health`

**Response**:
```json
{
  "status": "healthy",
  "configured": {
    "apiToken": true,
    "phoneNumberId": true,
    "businessAccountId": true,
    "webhookToken": true
  },
  "phoneNumberId": "1234567***"
}
```

### 5. WhatsApp Growth Metrics
**Endpoint**: `GET /admin/social-media/whatsapp/growth-metrics?days=30`

**Query Parameters**:
- `days` (optional): Number of days to analyze (default: 30)

**Response**:
```json
{
  "totalReferrals": 1250,
  "convertedReferrals": 325,
  "conversionRate": "26.00%",
  "fraudBlockedReferrals": 8,
  "trendingPetitions": [
    { "id": "pet_abc123", "title": "Climate Action Initiative" },
    { "id": "pet_def456", "title": "Education Reform Bill" },
    { "id": "pet_ghi789", "title": "Healthcare Access" }
  ],
  "period": "30 days"
}
```

### 6. WhatsApp Campaign Statistics
**Endpoint**: `GET /admin/social-media/whatsapp/campaign-stats`

**Response**:
```json
{
  "statusBreakdown": {
    "PENDING": 12,
    "CONVERTED": 325,
    "FRAUD_BLOCKED": 8
  },
  "topPetitions": 45,
  "totalCampaigns": 87
}
```

## UI Components

### Overview Tab
Shows:
- Facebook and WhatsApp health status
- Configuration indicators
- Key metrics cards (Total Referrals, Conversion Rate, Pixel Events, Fraud Blocked)

### Facebook Tab
Shows:
- Pixel event breakdown with count for each event type
- Total events and unique event types
- Period information

### WhatsApp Tab
Shows:
- Growth metrics (total referrals, converted, conversion rate, fraud blocked)
- Campaign statistics breakdown
- Trending petitions list

## Architecture

### Backend Service
**File**: `apps/api/src/admin/admin-social-media.service.ts`

**Methods**:
- `getFacebookHealth()` - Check Facebook SDK configuration
- `getWhatsAppHealth()` - Check WhatsApp service configuration
- `getWhatsAppGrowthMetrics(days)` - Fetch viral growth metrics
- `getFacebookPixelStats(days)` - Fetch pixel event statistics
- `getWhatsAppCampaignStats()` - Fetch campaign metrics
- `getSocialMediaDashboard()` - Unified dashboard data

### Backend Controller
**File**: `apps/api/src/admin/admin.controller.ts`

**Routes**:
- `GET /admin/social-media/dashboard` - Dashboard overview
- `GET /admin/social-media/facebook/health` - Facebook status
- `GET /admin/social-media/facebook/pixel-stats` - Pixel events
- `GET /admin/social-media/whatsapp/health` - WhatsApp status
- `GET /admin/social-media/whatsapp/growth-metrics` - Growth stats
- `GET /admin/social-media/whatsapp/campaign-stats` - Campaign stats

### Frontend Component
**File**: `apps/web/components/admin-social-media-dashboard.tsx`

**Features**:
- Three-tab interface (Overview, Facebook, WhatsApp)
- 30-second auto-refresh
- Error handling and loading states
- Status color indicators
- Real-time metrics display

## Security

### Authentication
- All endpoints require `JwtAuthGuard` (authenticated user)
- All endpoints require `RolesGuard` with `@Roles(UserRole.ADMIN)`
- Only admin users can access social media metrics

### Data Protection
- Sensitive tokens are masked (first 8 chars visible, rest hidden with ***)
- No raw API keys or tokens exposed in responses
- All requests logged for audit trail

## Troubleshooting

### No Data Showing
**Issue**: Dashboard displays but no metrics appear

**Solutions**:
1. Verify environment variables are set correctly
2. Check database connectivity (Redis, PostgreSQL)
3. Ensure services are running:
   ```bash
   # Check API status
   curl http://localhost:4000/health
   
   # Check database
   npx prisma db push
   ```

### Health Status Shows "Degraded"
**Issue**: One or more configurations missing

**Solutions**:
1. Check `.env` file has all required variables
2. Run: `node -e "console.log(Object.entries(process.env).filter(([k]) => k.includes('FACEBOOK') || k.includes('WHATSAPP')))"`
3. Update missing variables and restart services

### "Cannot find module" Errors
**Issue**: Build fails with missing module errors

**Solutions**:
1. Reinstall dependencies: `npm ci`
2. Rebuild: `npm run build`
3. Check service imports in `admin.module.ts`

## Performance Considerations

### Data Refresh Rate
- Dashboard auto-refreshes every 30 seconds
- Configurable by changing interval in component: `setInterval(fetchData, 30000)`

### Database Queries
- Uses efficient aggregations for statistics
- Indices on frequently queried fields (petitionId, status, createdAt)
- Limit queries to specific date ranges

### Optimization Tips
```typescript
// Reduce date range for faster queries
GET /admin/social-media/facebook/pixel-stats?days=7

// Cache results at component level for 30 seconds
// Built-in auto-refresh handles this
```

## Integration with Other Systems

### Email System
- Social media metrics integrated with email notification preferences
- Can trigger campaigns based on referral stats

### Fraud Detection
- Fraud blocked referrals visible in WhatsApp growth metrics
- Integration with fraud rule engine

### Analytics
- Metrics feed into global analytics dashboard
- Supports custom date range queries

## Examples

### Check Integration Health
```bash
# Get complete health status
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/admin/social-media/dashboard

# Check Facebook only
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/admin/social-media/facebook/health

# Check WhatsApp only
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/admin/social-media/whatsapp/health
```

### Get Recent Metrics
```bash
# Last 7 days
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:4000/admin/social-media/facebook/pixel-stats?days=7"

# Last 30 days (default)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/admin/social-media/facebook/pixel-stats

# Last 90 days
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:4000/admin/social-media/facebook/pixel-stats?days=90"
```

## Next Steps

1. **Configure Environment**: Set all required `.env` variables
2. **Deploy Services**: Update API and web apps
3. **Monitor Metrics**: Access `/admin` → "Social Media" tab
4. **Set Up Alerts**: Consider adding threshold-based alerts
5. **Document Procedures**: Create runbooks for common operations

## Files Modified

### Backend
- `apps/api/src/admin/admin-social-media.service.ts` (NEW)
- `apps/api/src/admin/admin.controller.ts` (MODIFIED)
- `apps/api/src/admin/admin.module.ts` (MODIFIED)

### Frontend
- `apps/web/components/admin-social-media-dashboard.tsx` (NEW)
- `apps/web/app/admin/admin-page-client.tsx` (MODIFIED)

## Support

For issues or questions:
1. Check this guide's Troubleshooting section
2. Review API logs: `pm2 logs api`
3. Check browser console for frontend errors
4. Contact platform administrator
