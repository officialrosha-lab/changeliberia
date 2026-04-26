# Facebook Real Pixel Integration - Implementation Guide

## Quick Start

### 1. Install and Setup

```bash
# Services already created in:
# - src/facebook/facebook-sdk.service.ts
# - src/facebook/share-dialog.service.ts
# - src/facebook/real-pixel-tracking.service.ts

# Add to your Facebook module
# Already updated in src/facebook/facebook.module.ts
```

### 2. Environment Variables

Add to your `.env` file:

```env
# Facebook App Configuration
FACEBOOK_APP_ID=your-app-id-here
FACEBOOK_PIXEL_ID=your-pixel-id-here
FACEBOOK_ACCESS_TOKEN=your-access-token-here
FACEBOOK_API_VERSION=v18.0

# Optional
FACEBOOK_BUSINESS_ACCOUNT_ID=your-business-account-id
FACEBOOK_DEBUG_MODE=true
```

### 3. Basic Usage in Controllers

#### Track Petition View
```typescript
import { RealPixelTrackingService } from './facebook/real-pixel-tracking.service';

export class PetitionController {
  constructor(
    private pixelTracking: RealPixelTrackingService,
  ) {}

  @Get(':id')
  async getPetition(@Param('id') id: string, @Req() req) {
    const petition = await this.petitionService.findOne(id);
    
    // Non-blocking pixel tracking
    this.pixelTracking
      .trackViewContent(id, req.user?.id)
      .catch(err => this.logger.error('Pixel tracking failed', err));
    
    return petition;
  }
}
```

#### Track Signature (Lead)
```typescript
export class SignatureController {
  constructor(
    private pixelTracking: RealPixelTrackingService,
  ) {}

  @Post()
  async createSignature(@Body() dto: CreateSignatureDto) {
    const signature = await this.signatureService.create(dto);
    
    // Track as Lead conversion
    this.pixelTracking
      .trackLead(dto.petitionId, signature.userId, {
        email: signature.email,
        firstName: signature.firstName,
        lastName: signature.lastName,
        phone: signature.phone,
      })
      .catch(err => this.logger.error('Lead tracking failed', err));
    
    return signature;
  }
}
```

#### Track Share
```typescript
export class ShareController {
  constructor(
    private shareDialog: ShareDialogService,
    private pixelTracking: RealPixelTrackingService,
  ) {}

  @Post('dialog-complete')
  async recordShareCompletion(
    @Body() dto: RecordShareDto,
    @Req() req,
  ) {
    // Record in database
    const share = await this.shareDialog.recordShareCompletion(
      dto.petitionId,
      req.user?.id,
      dto.method,
    );
    
    // Track pixel event
    this.pixelTracking
      .trackShare(dto.petitionId, req.user?.id, dto.method)
      .catch(err => this.logger.error('Share tracking failed', err));
    
    return { success: true, shareId: share.id };
  }
}
```

#### Track Donation (Purchase)
```typescript
export class DonationController {
  constructor(
    private pixelTracking: RealPixelTrackingService,
  ) {}

  @Post()
  async createDonation(
    @Body() dto: CreateDonationDto,
    @Req() req,
  ) {
    const donation = await this.donationService.create(dto);
    
    // Track as Purchase conversion
    this.pixelTracking
      .trackPurchase(
        dto.petitionId,
        donation.userId,
        donation.amount,
        donation.currency,
        {
          email: donation.email,
          firstName: donation.firstName,
          lastName: donation.lastName,
        },
      )
      .catch(err => this.logger.error('Purchase tracking failed', err));
    
    return donation;
  }
}
```

## Frontend Integration

### 1. Initialize Facebook SDK

In your Next.js layout or main component:

```typescript
// app/layout.tsx
import { FacebookSDKService } from '@/services/facebook-sdk';

export default function RootLayout({ children }) {
  const facebookSdk = new FacebookSDKService();

  return (
    <html>
      <head>
        {/* SDK Initialization Script */}
        <div dangerouslySetInnerHTML={{
          __html: facebookSdk.getSdkInitCode()
        }} />
        
        {/* Pixel Initialization */}
        <div dangerouslySetInnerHTML={{
          __html: facebookSdk.getPixelInitCode()
        }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### 2. Open Graph Meta Tags

For dynamic content sharing:

```typescript
// app/petitions/[id]/page.tsx
import { FacebookSDKService } from '@/services/facebook-sdk';

interface PetitionPageProps {
  params: { id: string };
}

export default async function PetitionPage({ params }: PetitionPageProps) {
  const petition = await getPetition(params.id);
  const facebookSdk = new FacebookSDKService();
  
  const ogMeta = facebookSdk.generateOpenGraphMeta({
    title: petition.title,
    description: petition.description,
    image: petition.imageUrl,
    url: `${process.env.NEXT_PUBLIC_APP_URL}/petitions/${petition.id}`,
    type: 'article',
  });

  return (
    <>
      {/* Meta Tags */}
      <div dangerouslySetInnerHTML={{ __html: ogMeta }} />
      
      {/* Petition Content */}
      <PetitionContent petition={petition} />
    </>
  );
}
```

### 3. Share Dialog Component

```typescript
// components/share-petition.tsx
'use client';

import { useEffect, useState } from 'react';

interface SharePetitionProps {
  petitionId: string;
  petitionTitle: string;
  imageUrl: string;
}

export function SharePetition({
  petitionId,
  petitionTitle,
  imageUrl,
}: SharePetitionProps) {
  const [shareConfig, setShareConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch share dialog configuration
    fetch(`/api/facebook/share-dialog/${petitionId}`)
      .then(r => r.json())
      .then(data => {
        setShareConfig(data.data);
        setLoading(false);
      });
  }, [petitionId]);

  const handleShareClick = () => {
    if (!window.FB) {
      console.error('Facebook SDK not initialized');
      return;
    }

    FB.ui(shareConfig.dialogConfig, async (response) => {
      if (response && response.post_id) {
        // Record share completion on backend
        try {
          await fetch('/api/facebook/record-share', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              petitionId,
              method: 'dialog',
              postId: response.post_id,
            }),
          });
        } catch (error) {
          console.error('Failed to record share:', error);
        }
      }
    });
  };

  if (loading) return <div>Loading...</div>;

  return (
    <button
      onClick={handleShareClick}
      className="btn btn-primary"
    >
      Share This Petition
    </button>
  );
}
```

### 4. Manual Pixel Events (Client-side)

```typescript
// For events not tracked server-side
function trackCustomEvent(eventName: string, data: any) {
  if (window.fbq) {
    fbq('track', eventName, data);
  }
}

// Usage:
trackCustomEvent('ViewContent', {
  content_type: 'petition',
  content_ids: ['petition-123'],
  content_name: 'Save Our Community',
});
```

## Advanced Usage

### 1. Custom Audience Creation

```typescript
// Create audience of petition viewers
const viewerAudience = await pixelTracking.createCustomAudience(
  'Petition Viewers - ' + new Date().toISOString(),
  petitionId,
  'ViewContent'
);

if (viewerAudience.success) {
  console.log(`Created audience with ${viewerAudience.size} users`);
  // Use this audience ID for Facebook Ads Manager
}
```

### 2. Analytics Dashboard

```typescript
// Get conversion funnel
const stats = await pixelTracking.getPixelStats(petitionId);

console.log({
  views: stats.eventsByType['ViewContent'],
  leads: stats.eventsByType['Lead'],
  shares: stats.eventsByType['Share'],
  donations: stats.eventsByType['Purchase'],
  conversionRate: `${stats.conversionRate.toFixed(2)}%`,
});
```

### 3. Metrics Endpoint

```typescript
@Get('analytics/petition/:id')
async getPetitionAnalytics(@Param('id') petitionId: string) {
  const stats = await this.pixelTracking.getPixelStats(petitionId);
  const shareAnalytics = await this.shareDialog.getShareAnalytics(petitionId);

  return {
    funnel: {
      views: stats.eventsByType['ViewContent'] || 0,
      shares: stats.eventsByType['Share'] || 0,
      signatures: stats.eventsByType['Lead'] || 0,
      donations: stats.eventsByType['Purchase'] || 0,
    },
    metrics: {
      conversionRate: stats.conversionRate,
      shareCompletionRate: shareAnalytics.completionRate,
      avgSharesPerView: (stats.eventsByType['Share'] || 0) / 
                        (stats.eventsByType['ViewContent'] || 1),
    },
    timestamps: {
      lastEvent: stats.lastEventAt,
      lastShare: shareAnalytics.lastShareAt,
    },
  };
}
```

## Testing

### Unit Tests

```bash
# Test the RealPixelTrackingService
npm run test -- real-pixel-tracking.service.spec.ts

# Test specific method
npm run test -- real-pixel-tracking.service.spec.ts -t "Track View Content"
```

### E2E Tests

```bash
# Run full integration tests
npm run test:e2e -- facebook-real-integration.e2e-spec.ts

# Test specific workflow
npm run test:e2e -- facebook-real-integration.e2e-spec.ts -t "Share to Conversion"
```

### Manual Testing

```typescript
// In your NestJS app with test database
const pixelTracking = app.get(RealPixelTrackingService);

// Test view tracking
await pixelTracking.trackViewContent('test-petition', 'test-user');

// Test lead tracking
await pixelTracking.trackLead('test-petition', 'test-user', {
  email: 'test@example.com'
});

// Check logs
const events = await prisma.facebookPixelEvent.findMany({
  where: { petitionId: 'test-petition' }
});
console.log(events);
```

## Event Data Structure

### What Gets Tracked

```typescript
interface PixelEventPayload {
  eventId?: string;              // Facebook event ID
  eventType: string;             // ViewContent, Lead, Share, Purchase
  contentType: string;           // petition, page, etc.
  contentCategory: string;       // social_cause, etc.
  value?: number;                // For purchases
  currency?: string;             // USD, EUR, etc.
  email?: string;                // Hashed
  phone?: string;                // Hashed
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  country?: string;
  externalId?: string;           // User ID
  clientIpAddress?: string;
  clientUserAgent?: string;
  customProperties?: Record<string, any>;
}
```

### Database Storage

Each event is stored in `FacebookPixelEvent`:
```typescript
{
  id: 'cuid',
  petitionId: 'petition-123',
  userId: 'user-456',
  eventType: 'ViewContent',
  eventData: { /* Full payload */ },
  eventId: 'facebook-event-id',
  success: true,
  error: null,
  createdAt: Date,
}
```

## Performance Considerations

### 1. Async Event Tracking
Always track events asynchronously to avoid blocking requests:

```typescript
// Good
this.pixelTracking.trackViewContent(id, userId)
  .catch(err => logger.error('Tracking failed', err));

// Avoid
await this.pixelTracking.trackViewContent(id, userId);
```

### 2. Batch Operations
For bulk operations, use database transactions:

```typescript
await prisma.$transaction([
  prisma.facebookPixelEvent.create({ data: event1 }),
  prisma.facebookPixelEvent.create({ data: event2 }),
  // ... more events
]);
```

### 3. Caching
Cache pixel configuration to reduce lookups:

```typescript
private cachedConfig: PixelConfig;

getPixelConfig(): PixelConfig {
  if (!this.cachedConfig) {
    this.cachedConfig = {
      pixelId: this.facebookSdk.getPixelId(),
      appId: this.facebookSdk.getAppId(),
    };
  }
  return this.cachedConfig;
}
```

## Debugging

### Enable Debug Mode

```env
FACEBOOK_DEBUG_MODE=true
LOG_LEVEL=debug
```

### Check Pixel Events

```typescript
// Find failed events
const failed = await prisma.facebookPixelEvent.findMany({
  where: { success: false },
  orderBy: { createdAt: 'desc' },
  take: 10,
});

failed.forEach(event => {
  console.log(`Error in ${event.eventType}: ${event.error}`);
});
```

### Test API Connection

```typescript
const health = await facebookSdk.healthCheck();
console.log({
  appConnected: health.appConnected,
  pixelConnected: health.pixelConnected,
  apiVersion: health.apiVersion,
});
```

## Common Issues & Solutions

### Issue: Pixel events not appearing in Facebook
**Solution:** 
1. Verify Open Graph meta tags are correct
2. Use [Facebook Debugging Tool](https://developers.facebook.com/tools/debug/)
3. Check pixel is active in Facebook Business Suite
4. Verify API access token has correct permissions

### Issue: Share Dialog not opening
**Solution:**
1. Verify domain is whitelisted in Facebook App Settings
2. Clear browser cache
3. Check SDK initialization in console
4. Verify App ID is correct

### Issue: Custom audience creation fails
**Solution:**
1. Ensure at least 100 events of that type
2. Check audience name is unique
3. Verify Business Account has necessary permissions
4. Use Facebook Business Suite to verify

## Next Steps

1. **Deploy**: Push to production with environment variables
2. **Monitor**: Set up alerts for tracking failures
3. **Optimize**: Create lookalike audiences and retargeting campaigns
4. **Analyze**: Use Facebook Analytics to measure ROI
5. **Iterate**: A/B test different share messages and timings

## Support Resources

- [Facebook Conversions API](https://developers.facebook.com/docs/marketing-api/conversions-api)
- [Share Dialog](https://developers.facebook.com/docs/sharing/web/share-dialog)
- [Custom Audiences](https://www.facebook.com/business/help/463435257334548)
- [Open Graph Protocol](https://ogp.me/)
- [Facebook Debugging Tool](https://developers.facebook.com/tools/debug/)
