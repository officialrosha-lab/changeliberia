# Facebook Real Pixel Integration Documentation

## Overview

This comprehensive Facebook integration implements the Facebook Conversions API for server-side pixel tracking, enabling accurate conversion measurement and audience targeting for the Change Liberia petition platform.

## Architecture

### Core Services

#### 1. **FacebookSDKService**
Manages Facebook SDK initialization, configuration, and core API operations.

**Key Methods:**
- `getSdkInitCode()` - Returns Facebook SDK initialization script
- `getPixelInitCode()` - Returns Conversions API initialization script
- `generateOpenGraphMeta()` - Generates OG meta tags for content sharing
- `trackConversion()` - Sends conversion events to Conversions API
- `validateShareUrl()` - Validates URLs for Facebook sharing
- `getShareCount()` - Retrieves share count for URLs
- `healthCheck()` - Verifies SDK connectivity

**Configuration Required:**
```typescript
// environment.ts
FACEBOOK_APP_ID=your-app-id
FACEBOOK_PIXEL_ID=your-pixel-id
FACEBOOK_ACCESS_TOKEN=your-access-token
FACEBOOK_API_VERSION=v18.0
```

#### 2. **ShareDialogService**
Handles Facebook Share Dialog initialization and completion tracking.

**Key Methods:**
- `getShareDialogConfig()` - Returns configuration for Share Dialog
- `getShareButtonSnippet()` - Returns HTML/JS for share button
- `recordShareCompletion()` - Tracks when user completes share
- `getShareAnalytics()` - Returns share analytics for petitions
- `trackShareDialogImpression()` - Tracks Share Dialog impressions
- `validateShareCallback()` - Validates share completion callbacks

**Features:**
- Deep linking support for shared content
- Share method tracking (dialog, native, other)
- User metadata capture (name, email, etc.)
- Hashtag and quote customization
- Callback handling for share completion

**Example Usage:**
```typescript
const config = await shareDialog.getShareDialogConfig('petition-123', {
  quote: 'Join me in supporting this petition!',
  hashtag: '#ChangeLiberia',
});

// In frontend:
FB.ui(config, (response) => {
  await fetch('/api/facebook/record-share', {
    method: 'POST',
    body: JSON.stringify({
      petitionId: 'petition-123',
      method: 'dialog',
    })
  });
});
```

#### 3. **RealPixelTrackingService**
Implements server-side pixel tracking using Facebook Conversions API.

**Tracked Events:**

1. **ViewContent** - User views petition
   ```typescript
   trackViewContent(petitionId, userId, metadata?: {
     email?: string;
     phone?: string;
     firstName?: string;
     lastName?: string;
   })
   ```

2. **Lead** - User starts signing petition
   ```typescript
   trackLead(petitionId, userId, metadata?: {
     email?: string;
     firstName?: string;
     lastName?: string;
   })
   ```

3. **Share** - User shares petition
   ```typescript
   trackShare(petitionId, userId, method: 'dialog' | 'native' | 'other', metadata?: {...})
   ```

4. **Purchase** - User makes donation
   ```typescript
   trackPurchase(petitionId, userId, amount, currency, metadata?: {...})
   ```

5. **Custom Events** - Application-defined events
   ```typescript
   trackCustomEvent(eventName, petitionId, userId, metadata)
   ```

**Advanced Features:**

- **Custom Audiences** - Create audiences from pixel events
  ```typescript
  const audience = await pixelTracking.createCustomAudience(
    'Engaged Viewers',
    'petition-123',
    'ViewContent'
  );
  // Returns: { audienceId, size, success }
  ```

- **Pixel Statistics** - Analyze conversion funnel
  ```typescript
  const stats = await pixelTracking.getPixelStats('petition-123');
  // Returns: { 
  //   totalEvents, 
  //   eventsByType, 
  //   conversionRate, 
  //   lastEventAt 
  // }
  ```

- **Pixel Configuration** - Check SDK status
  ```typescript
  const config = pixelTracking.getPixelConfig();
  // Returns: { pixelId, appId, configured }
  ```

## Database Schema

### FacebookPixelEvent Table
Stores all tracked conversion events for analytics and debugging.

```prisma
model FacebookPixelEvent {
  id          String    @id @default(cuid())
  petitionId  String
  userId      String?
  eventType   String    // ViewContent, Lead, Share, Purchase, Custom
  eventData   Json      // Event metadata
  eventId     String?   // Facebook's event ID
  success     Boolean   @default(false)
  error       String?
  createdAt   DateTime  @default(now())
  
  petition    Petition  @relation(fields: [petitionId], references: [id])
  user        User?     @relation(fields: [userId], references: [id])
}

model CustomAudience {
  id            String    @id @default(cuid())
  name          String
  audienceType  String    // PIXEL_ViewContent, PIXEL_Lead, etc.
  size          Int
  facebookId    String?
  lastSyncedAt  DateTime?
  createdAt     DateTime  @default(now())
}
```

## Event Flow Diagram

```
User Journey:
1. Visit Petition
   └─> ViewContent Event ──┐
                            ├─> Custom Audience: "Viewers"
2. Read & Interact         │
   └─> Continue ────────────┤
                            ├─> Custom Audience: "Engaged"
3. Share Petition
   └─> Share Event ─────────┤
       └─> Validation ──────┤
       └─> Analytics ──────┤
                            └─> Retargeting Campaigns
4. New User Views Shared
   └─> ViewContent ────────→ Custom Audience: "Social Traffic"

5. Sign Petition
   └─> Lead Event
       └─> Metadata: name, email, etc.

6. Donate (Optional)
   └─> Purchase Event
       └─> Value: amount, currency
       └─> Custom Audience: "Donors"
```

## API Endpoints

### SDK & Configuration
```
GET  /api/facebook/sdk-init          → SDK initialization code
GET  /api/facebook/pixel              → Pixel initialization code
GET  /api/facebook/og-meta/:id        → Open Graph meta tags
GET  /api/facebook/health             → SDK health status
```

### Share Dialog
```
GET  /api/facebook/share-dialog/:id   → Share dialog configuration
POST /api/facebook/record-share       → Record share completion
GET  /api/facebook/share-count        → Get URL share count
POST /api/facebook/validate-url       → Validate share URL
```

### Pixel Tracking
```
POST /api/facebook/track-view         → Track ViewContent event
POST /api/facebook/track-lead         → Track Lead event
POST /api/facebook/track-share        → Track Share event
POST /api/facebook/track-purchase     → Track Purchase event
GET  /api/facebook/pixel-stats/:id    → Get pixel statistics
POST /api/facebook/create-audience    → Create custom audience
```

## Integration Points

### 1. Petition Module
Track engagement on petition views:
```typescript
// In petition.controller.ts
@Get(':id')
async getPetition(@Param('id') id: string) {
  const petition = await this.petitionService.findOne(id);
  
  // Track view (non-blocking)
  this.pixelTracking.trackViewContent(id, currentUserId).catch(console.error);
  
  return petition;
}
```

### 2. Signature Module
Track sign-ups as Lead conversions:
```typescript
// In signature.controller.ts
@Post()
async createSignature(@Body() dto: CreateSignatureDto) {
  const signature = await this.signatureService.create(dto);
  
  // Track as Lead
  this.pixelTracking.trackLead(
    dto.petitionId,
    signature.userId,
    { 
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName
    }
  ).catch(console.error);
  
  return signature;
}
```

### 3. Share Dialog Frontend
Initialize sharing with client-side SDK:
```typescript
// In React component
const config = await fetch('/api/facebook/share-dialog/petition-id').then(r => r.json());

const handleShare = () => {
  FB.ui(config.dialogConfig, (response) => {
    if (response) {
      // Backend will track the share
      fetch('/api/facebook/record-share', {
        method: 'POST',
        body: JSON.stringify({
          petitionId: 'petition-id',
          method: 'dialog'
        })
      });
    }
  });
};
```

### 4. Donation Module
Track donations as Purchase events:
```typescript
// In donation.controller.ts
@Post()
async createDonation(@Body() dto: CreateDonationDto) {
  const donation = await this.donationService.create(dto);
  
  // Track Purchase
  this.pixelTracking.trackPurchase(
    dto.petitionId,
    donation.userId,
    donation.amount,
    donation.currency
  ).catch(console.error);
  
  return donation;
}
```

## Analytics & Reporting

### Real-Time Analytics
- **ViewContent → Lead Conversion Rate**: measure effectiveness of petition pages
- **Share Impact**: track conversions from shared links
- **Donation Value**: optimize fundraising campaigns
- **Custom Audiences**: retarget engaged users

### Dashboard Integration
```typescript
// Create a metrics endpoint
@Get('/analytics/petition/:id')
async getPetitionAnalytics(@Param('id') petitionId: string) {
  const stats = await this.pixelTracking.getPixelStats(petitionId);
  
  return {
    totalViews: stats.eventsByType['ViewContent'] || 0,
    signups: stats.eventsByType['Lead'] || 0,
    shares: stats.eventsByType['Share'] || 0,
    donations: stats.eventsByType['Purchase'] || 0,
    conversionRate: stats.conversionRate,
    lastUpdated: stats.lastEventAt,
  };
}
```

## Audience Targeting

### Creating Custom Audiences
```typescript
// All viewers
const viewerAudience = await pixelTracking.createCustomAudience(
  'All Petition Viewers',
  'petition-123',
  'ViewContent'
);

// People who almost signed
const almostSignedAudience = await pixelTracking.createCustomAudience(
  'Almost Signed',
  'petition-123',
  'Lead'
);

// Donors
const donorAudience = await pixelTracking.createCustomAudience(
  'Petition Donors',
  'petition-123',
  'Purchase'
);
```

### Lookalike Audiences
Use custom audiences to create Lookalike Audiences in Facebook Ads Manager to find similar users.

## Error Handling

The service gracefully handles:
- Network failures (retries with exponential backoff)
- Invalid user data (sanitization)
- Database errors (non-blocking, logged)
- SDK initialization failures (fallback mode)

### Logging
```typescript
// All events are logged to database
const pixelEvent = await prisma.facebookPixelEvent.findMany({
  where: {
    petitionId: 'petition-123',
    success: false
  }
});
```

## Best Practices

### 1. Data Privacy
- Hash email/phone before sending to Facebook
- Respect user privacy preferences
- Comply with GDPR/CCPA requirements
- Clear user opt-in/opt-out mechanisms

### 2. Event Quality
- Avoid duplicate tracking (use eventId deduplication)
- Validate email addresses before tracking
- Include complete user metadata
- Use correct currency codes (ISO 4217)

### 3. Performance
- Track events asynchronously (non-blocking)
- Batch events when possible
- Cache pixel configuration
- Monitor API rate limits

### 4. Testing
```typescript
// Use mock data in development
NODE_ENV=development
FACEBOOK_APP_ID=development-app-id
FACEBOOK_PIXEL_ID=development-pixel-id

// Test with the spec files
npm run test -- real-pixel-tracking.service.spec.ts
npm run test:e2e -- facebook-real-integration.e2e-spec.ts
```

## Troubleshooting

### Pixel Not Tracking
1. Verify `FACEBOOK_PIXEL_ID` and `FACEBOOK_ACCESS_TOKEN` in env
2. Check database for failed events: `FacebookPixelEvent where success=false`
3. Verify Open Graph meta tags are properly formatted
4. Check Facebook Conversions API dashboard for API errors

### Share Dialog Not Opening
1. Verify `FACEBOOK_APP_ID` is correct
2. Check domain is whitelisted in Facebook App Settings
3. Verify SDK is initialized before calling `FB.ui()`
4. Check browser console for SDK initialization errors

### Audience Creation Failed
1. Ensure minimum 100 users in audience
2. Check custom audience name is unique
3. Verify Facebook Business Account has necessary permissions
4. Check audience type is supported

## Monitoring

Set up alerts for:
- Failed conversion tracking (> 1% error rate)
- Pixel API response time (> 500ms)
- Database insert failures
- Share dialog completion rate (< 30%)

## Future Enhancements

1. **A/B Testing**: Track conversion rate by share method
2. **Attribution Modeling**: Multi-touch attribution
3. **Prediction**: ML-based next-best-action
4. **Dynamic Retargeting**: Auto-generate ads from petitions
5. **Privacy Compliance**: Automated GDPR/CCPA consent handling

## References

- [Facebook Conversions API Docs](https://developers.facebook.com/docs/marketing-api/conversions-api)
- [Share Dialog Documentation](https://developers.facebook.com/docs/sharing/web/share-dialog)
- [Open Graph Protocol](https://ogp.me/)
- [Custom Audiences Guide](https://www.facebook.com/business/help/463435257334548)

## Support

For issues or questions:
1. Check this documentation
2. Review spec files for examples
3. Check Facebook Developer Community
4. Contact platform team
