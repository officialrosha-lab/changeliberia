# WhatsApp Viral Engine & Growth Mechanics Implementation

## Phase 2 Complete: Backend Infrastructure 🚀

This document outlines the complete WhatsApp viral growth system and milestone tracking implemented for the Change Liberia petition platform.

---

## Architecture Overview

### 1. Database Models

#### **Referral** (WhatsApp Viral Tracking)
- **Purpose**: Track referrer → referee relationships and viral metrics
- **Key Fields**:
  - `referralCode`: Unique identifier for deduplication (e.g., "SATT001")
  - `shareUrl`: Shortened URL for WhatsApp sharing
  - `whatsappMessage`: Pre-generated message with emoji, signature count, CTA
  - `status`: PENDING → CONVERTED → REWARDED (or FRAUD_BLOCKED)
  - `trustBonusApplied`: Number of trust points earned (+5 per conversion)
  - `clickCount`: Track how many times link was clicked
  - `conversionDate`: When the referral actually converted

#### **PetitionMilestone** (Growth Mechanics)
- **Purpose**: Track signature milestones (10, 50, 100, 500, 1000, 5000)
- **Key Fields**:
  - `type`: SIGNATURES | TRENDING | GOVERNMENT_READY
  - `targetValue`: 10, 50, 100, 500, 1000, or 5000
  - `achieved`: Boolean flag
  - `achievedAt`: Timestamp when milestone hit
  - `shareTriggered`: Track if re-share modal was shown

#### **ShareLink** (Click Analytics)
- **Purpose**: Redirect tracking with UTM parameters
- **Key Fields**:
  - `shortCode`: 6-char code (e.g., "abc123") for /r/abc123 URLs
  - `clickCount`: How many times short link was clicked
  - `conversions`: How many clicks led to petition signatures
  - `source`: whatsapp, facebook, twitter, email, etc.
  - `medium`: organic, paid, referral, etc.
  - `campaign`: user_share, marketing_campaign, etc.

---

## Backend Services

### WhatsAppService (`whatsapp.service.ts`)

**Core Methods:**

1. **generateWhatsAppMessage(petitionId, referralCode, signerName)**
   ```
   Input: petition ID, optional signer name
   Output: WhatsApp-optimized message with:
   - Liberia identity trigger (🇱🇷)
   - Urgency emoji (🔥 ⚡ 📈 🆕 based on progress)
   - Current signature count
   - Goal target
   - Referral link with tracking
   - CTA ("Sign now!" or "Help change Liberia")
   
   Example:
   "🇱🇷 FIX SINKOR ROADS 🔥
   1,240 people have signed! Help us reach 5,000.
   Every signature counts. Sign & share: [link]
   - Satta K. Doe & supporters"
   ```

2. **buildWhatsAppDeepLink(phone, message)**
   ```
   Converts message to wa.me URL with URL-encoded text
   Allows direct WhatsApp opening from web
   ```

3. **createShareLink(petitionId, referralId, source, medium)**
   ```
   Creates trackable short link with utm parameters
   Returns /r/[shortCode] URL
   ```

4. **trackShareLinkClick(shortCode)**
   ```
   Increments click counter when user follows /r/[code]
   Updates lastClickedAt timestamp
   Returns redirect URL to petition
   ```

5. **markReferralConverted(referralId, signatureId, trustBonus=5)**
   ```
   When referred user signs petition:
   - Updates referral.status to CONVERTED
   - Applies trust bonus to referrer
   - Records conversionDate
   ```

6. **getReferralMetrics(petitionId)**
   ```
   Returns aggregated metrics by status:
   - Total referrals (PENDING, CONVERTED, FRAUD_BLOCKED)
   - Click-through rates
   - Conversion metrics
   ```

7. **getTopReferrers(petitionId, limit=10)**
   ```
   Returns top 10 referrers ranked by trust bonus earned
   Useful for leaderboards
   ```

---

### GrowthService (`growth.service.ts`)

**Milestone Tracking:**

1. **checkAndCreateMilestone(petitionId, currentSignatureCount)**
   ```
   Called when petition signature count changes
   Checks against thresholds: [10, 50, 100, 500, 1000, 5000]
   Creates milestone records for newly achieved thresholds
   Returns array of newly created milestones
   ```

2. **shouldTriggerShareModal(petitionId)**
   ```
   Checks if milestone was achieved in last 5 minutes
   Returns true if share modal should appear
   Marks milestone as shareTriggered (only shows once)
   ```

3. **getPetitionMilestones(petitionId)**
   ```
   Returns all achieved milestones with timestamps
   Used for UI milestone progress display
   ```

4. **getGovernmentReadinessStatus(petitionId)**
   ```
   Returns if petition is "government ready" (1000+ signatures)
   Includes:
   - Creator contact info
   - Signature count vs threshold
   - Target for next milestone (5000)
   ```

**Leaderboard & Trending:**

5. **getTrendingPetitions(limit=10, county)**
   ```
   Returns petitions sorted by:
   1. Signatures in last 7 days (momentum)
   2. Total signatures (overall popularity)
   Includes velocity metrics (signatures/day)
   ```

6. **getCountyLeaderboard(county, limit=10)**
   ```
   Returns top petitions by signatures from specific county
   Aggregates signatures by geolocation
   Includes rank badges (🥇 🥈 🥉)
   ```

7. **getPetitionGrowthMetrics(petitionId)**
   ```
   Returns comprehensive metrics:
   - Average signatures per day
   - Days to reach goal
   - 7-day signature timeline
   - Percentage to goal
   - Milestones achieved count
   ```

---

## API Endpoints

### WhatsApp Endpoints

**POST /whatsapp/generate-message**
- Generates WhatsApp message for a petition
- No auth required (works for logged-in and anonymous)
- Returns: message text, petition details

**POST /whatsapp/create-referral**
- Creates referral link for authenticated user
- Rate limited: 10 requests/minute per user
- Returns: referral code, share URL, expiration (30 days)
- Creates share link automatically

**GET /whatsapp/share-link/:shortCode**
- Redirect tracking endpoint (/r/abc123)
- No auth, tracks click
- Increments click counter
- Returns redirect URL to petition

**POST /whatsapp/track-conversion**
- Called when referred user signs petition
- Updates referral status to CONVERTED
- Applies trust bonus to referrer
- Auth required (JWT)

**GET /whatsapp/metrics/:petitionId**
- Analytics for a petition
- No auth required
- Returns: metrics by status, top referrers with names

**GET /whatsapp/my-referrals**
- Get all referrals created by current user
- Auth required (JWT)
- Returns: referral stats + full referral list

**GET /whatsapp/referral/:referralCode**
- Get details about specific referral
- No auth required
- Returns: full referral chain with petition + referrer info

### Growth Endpoints

**GET /growth/trending**
- Gets trending petitions
- Query params: limit (default 10), county
- Returns: trending list with momentum metrics

**GET /growth/leaderboard/:county**
- County-based petition leaderboard
- Query params: limit (default 10)
- Returns: ranked petitions with % of county signatures

**GET /growth/petition/:petitionId/metrics**
- Growth metrics for a petition
- Returns: velocity, days to goal, 7-day timeline, milestones

**GET /growth/petition/:petitionId/milestones**
- Achieved milestones for a petition
- Returns: all achieved milestones with timestamps

**GET /growth/petition/:petitionId/government-readiness**
- Check if petition is government-ready (1000+ signatures)
- Returns: readiness status, creator contact, next milestone

**GET /growth/petition/:petitionId/share-trigger**
- Check if share modal should trigger
- Returns: shouldTriggerShareModal (boolean)

**POST /growth/petition/:petitionId/check-milestone** (ADMIN)
- Admin endpoint: manually trigger milestone check
- Auth: JWT + ADMIN role required
- Returns: newly created milestones

---

## Frontend Components

### 1. WhatsAppShareModal

**Location**: `apps/web/components/whatsapp-share-modal.tsx`

**Features**:
- Opens on petition signature success
- Shows generated WhatsApp message preview
- Three sharing options:
  1. "Open WhatsApp" - Deep link to wa.me
  2. "Copy Message" - Copy to clipboard
  3. "Get Share Link" - Short link (/r/code)
- Shows referral code
- Displays trust point earning motivation

**Usage**:
```tsx
<WhatsAppShareModal
  petitionId={petition.id}
  petitionTitle={petition.title}
  signerName={currentUser?.fullName}
  isOpen={showShareModal}
  onClose={() => setShowShareModal(false)}
/>
```

### 2. PetitionMilestones

**Location**: `apps/web/components/petition-milestones.tsx`

**Features**:
- Visual progress bar toward current milestone
- Milestone badges with status:
  - 🚀 10 signatures (Launch)
  - ⭐ 50 signatures (Growing)
  - 🔥 100 signatures (Trending)
  - 💎 500 signatures (Influential)
  - 🏆 1000 signatures (Government Ready)
  - 👑 5000 signatures (National Impact)
- "In progress" animation on current milestone
- "Government Ready" badge at 1000+
- Next milestone progress

**Usage**:
```tsx
<PetitionMilestones
  petitionId={petition.id}
  currentSignatures={petition.signaturesCount}
  goal={petition.goal}
/>
```

### 3. CountyLeaderboard

**Location**: `apps/web/components/county-leaderboard.tsx`

**Features**:
- Table of top petitions in county
- Rank badges (🥇 🥈 🥉)
- Trending indicators (📈 with daily velocity)
- County signatures vs total
- Progress bar for each petition
- Links to petition pages

**Usage**:
```tsx
<CountyLeaderboard
  county={userCounty}
  limit={10}
/>
```

### 4. TrendingPetitions

**Location**: `apps/web/components/trending-petitions.tsx`

**Features**:
- Grid layout of trending petitions
- Trending badges with ranking (#1, #2, etc.)
- Daily signature velocity (+X/day)
- Creator info with avatar
- Progress bar with % to goal
- Card-based UI with hover effects

**Usage**:
```tsx
<TrendingPetitions
  limit={10}
  county={userCounty}
/>
```

### 5. VerificationBadge

**Location**: `apps/web/components/verification-badge.tsx`

**Features**:
- Displays user trust level
- Shows verification status:
  - 🔐 ID Verified (government ID upload)
  - 📱 Phone Verified (OTP)
  - 🌍 Diaspora Member
  - ❓ Unverified
- Trust score progress bar
- "How to earn trust" info:
  - +1 per petition signed
  - +3 for phone verification
  - +10 for ID upload
  - +5 per referral converted
  - +2 for 7+ days active

**Usage**:
```tsx
<VerificationBadge
  trustScore={user.trustScore}
  verificationStatus={user.verificationStatus}
  compact={true}
  showLabel={true}
/>
```

---

## Database Seeding

The system includes comprehensive seed data:

**Sample Data Created**:
- 1 admin user (Satta K. Doe, +231770000001)
- 5 real-world petitions (roads, healthcare, library, environment, education)
- 1,240+ aggregate signatures
- 5 milestones achieved (10, 50, 100, 500, 1000)
- 4 referral codes with tracking data
- Share links with click analytics

**Run Seeding**:
```bash
cd apps/api
npx prisma db seed
```

---

## Trust Score System

Users earn trust points through actions:

| Action | Points | Notes |
|--------|--------|-------|
| Sign petition | +1 | Per petition |
| Phone OTP | +3 | One-time |
| Government ID | +10 | One-time |
| Successful referral | +5 | Per referral |
| 7+ days active | +2 | Earned once |
| Email verified | +2 | One-time |

**Trust Levels**:
- 0-5: Unverified
- 5-20: New Signer 🔷
- 20-50: Active Citizen ✓
- 50-100: Verified Advocate ⭐
- 100+: Trusted Champion 👑

Trust bonuses are applied when referral is marked CONVERTED.

---

## Security & Rate Limiting

**Rate Limits**:
- `/whatsapp/create-referral`: 10 requests/min per user
- `/whatsapp/metrics/*`: No limit
- `/growth/trending`: No limit
- `/growth/leaderboard/*`: No limit

**Authentication**:
- WhatsApp message generation: Optional JWT (works anonymous)
- Referral creation: Required JWT
- Metrics viewing: Optional JWT
- Admin milestone checks: Required JWT + ADMIN role

**Fraud Prevention**:
- Referral codes must be unique
- Duplicate signatures detected by existing fraud system
- Share links track source/medium for attribution
- Conversion tracking prevents trust point gaming

---

## Error Handling

All endpoints include:
- Input validation
- 404 handling for missing petitions
- 400 for invalid requests
- Try-catch with logging
- User-friendly error messages

Example:
```
GET /growth/petition/invalid-id/metrics
→ NotFoundException: Petition not found

POST /whatsapp/create-referral (rate exceeded)
→ 429 Too Many Requests
```

---

## Integration with Existing Systems

### Petition Service
- `getTrendingPetitions()` filters by APPROVED status
- Milestones auto-trigger on signature creation
- Share modal appears on milestone hit

### Auth Service
- JWT guards protect creation endpoints
- User trust score stored in User model
- Phone verification integrated with WhatsApp

### Fraud Service
- Referral status can be FRAUD_BLOCKED
- Trust bonuses not applied if fraud detected
- Share link source/medium tracked for anomaly detection

---

## Migration & Testing

**Database**:
```bash
# Apply migration
cd apps/api
npx prisma migrate dev --name add_whatsapp_viral_system

# Reset (development only)
npx prisma db push --force-reset
npx prisma db seed
```

**Testing**:
```bash
# Run E2E tests (includes WhatsApp flow)
cd apps/web
npm run test:e2e

# Test specific endpoints
curl http://localhost:3000/api/growth/trending
curl http://localhost:3001/api/whatsapp/metrics/[petitionId]
```

---

## Monitoring & Analytics

### Key Metrics to Track:
1. **Referral Metrics**:
   - Click-through rate (clicks / impressions)
   - Conversion rate (conversions / clicks)
   - Trust points distributed
   - Top referrer leaderboard

2. **Growth Metrics**:
   - Signatures per day (velocity)
   - Milestone achievement timeline
   - County distribution
   - Trending petition rotation

3. **Share Metrics**:
   - Short link clicks by source
   - UTM parameter tracking
   - WhatsApp vs other channels
   - Device analytics

### Admin Dashboard
Consider adding endpoints:
- `/admin/referral-analytics`
- `/admin/growth-dashboard`
- `/admin/fraud-alerts`
- `/admin/trust-score-distribution`

---

## Next Steps (Phase 2b-5)

✅ **Phase 1**: Database Models & Migration
✅ **Phase 2a**: WhatsApp Backend Services (DONE)
✅ **Phase 2b**: Frontend Components (DONE)

🔄 **Phase 3**: Government Integration
- PDF generation for petition reports
- Email submission to NGOs
- Status tracking (submitted, approved, rejected)
- Auto-submit at 1000+ signatures

🔄 **Phase 4**: Growth Mechanics Integration
- Signature service triggers milestone checks
- County detection from IP geolocation
- Automated share modal on milestone hit
- Trending algorithm refinement

🔄 **Phase 5**: Testing & Optimization
- E2E tests for viral flows
- Load testing for high-traffic petitions
- A/B testing share message variants
- Analytics dashboard setup

---

## Deployment Checklist

Before production deployment:

- [ ] Database migration applied (`add_whatsapp_viral_system`)
- [ ] WhatsApp service & controller deployed
- [ ] Growth service & controller deployed
- [ ] Frontend components built and tested
- [ ] Seed data cleared (remove test referral codes)
- [ ] Environment variables configured
- [ ] Rate limiting enabled and tested
- [ ] Error monitoring (Sentry) configured
- [ ] Analytics tracking implemented
- [ ] Documentation updated in wiki

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│  Frontend (Next.js React 19)                        │
│  ├─ WhatsAppShareModal (post-signature)             │
│  ├─ PetitionMilestones (progress display)           │
│  ├─ CountyLeaderboard (competition UI)              │
│  ├─ TrendingPetitions (discovery)                   │
│  └─ VerificationBadge (trust display)               │
└──────────────────┬──────────────────────────────────┘
                   │ API Calls
┌──────────────────▼──────────────────────────────────┐
│  Backend (NestJS Node.js)                           │
│  ├─ WhatsAppController (7 endpoints)                │
│  │  ├─ generate-message                             │
│  │  ├─ create-referral                              │
│  │  ├─ share-link/:shortCode (redirect)             │
│  │  ├─ track-conversion                             │
│  │  ├─ metrics/:petitionId                          │
│  │  └─ my-referrals                                 │
│  ├─ WhatsAppService (message generation, tracking)  │
│  ├─ GrowthController (6 endpoints)                  │
│  │  ├─ trending                                     │
│  │  ├─ leaderboard/:county                          │
│  │  ├─ petition/:id/metrics                         │
│  │  ├─ petition/:id/milestones                      │
│  │  ├─ petition/:id/government-readiness            │
│  │  └─ petition/:id/share-trigger                   │
│  └─ GrowthService (milestone checks, leaderboards)  │
└──────────────────┬──────────────────────────────────┘
                   │ Database Queries
┌──────────────────▼──────────────────────────────────┐
│  Database (PostgreSQL)                              │
│  ├─ Referral (viral tracking)                       │
│  ├─ PetitionMilestone (growth triggers)             │
│  ├─ ShareLink (click analytics)                     │
│  └─ Existing: Petition, User, Signature, etc.       │
└─────────────────────────────────────────────────────┘
```

---

## Example Workflows

### Workflow 1: User Signs Petition & Shares
```
1. User signs petition
   → POST /petitions/[id]/sign
   → Signature created
   → signaturesCount incremented

2. Check milestone
   → GrowthService.checkAndCreateMilestone()
   → If new milestone, PetitionMilestone created
   → shareTriggered = false

3. Show share modal
   → Frontend checks GET /growth/petition/[id]/share-trigger
   → shouldTriggerShareModal = true (new milestone)
   → Display WhatsAppShareModal

4. User clicks "Open WhatsApp"
   → POST /whatsapp/generate-message → Get formatted message
   → WhatsAppService.buildWhatsAppDeepLink()
   → Opens wa.me link with pre-filled message

5. User modifies & sends on WhatsApp
   → Friend receives message with /r/SATT001 link
   → Friend clicks link
   → GET /whatsapp/share-link/satt001 (tracking)
   → Click counter incremented
   → Redirects to /petitions/[id]?ref=SATT001

6. Friend signs petition
   → POST /whatsapp/track-conversion
   → Referral marked CONVERTED
   → +5 trust points to original signer
```

### Workflow 2: View Trending & County Leaderboard
```
1. User visits home page
   → GET /growth/trending (limit=6)
   → Shows top 6 petitions with momentum

2. User views "View All Trending"
   → GET /growth/trending (limit=20)
   → Grid of 20 trending petitions

3. User clicks county leaderboard
   → GET /growth/leaderboard/Montserrado (detected from IP)
   → Shows top petitions in user's county
   → User sees their county rank for each petition

4. User clicks petition
   → GET /growth/petition/[id]/metrics
   → Shows growth velocity, days to goal, etc.
   → Shows milestones achieved
   → Shows at bottom: "Share to help reach next milestone"
```

### Workflow 3: Admin Monitors Viral Growth
```
1. Admin dashboard loads
   → GET /whatsapp/metrics/[petitionId]
   → Shows referral stats by status
   → Shows top referrers leaderboard

2. Admin checks government readiness
   → GET /growth/petition/[id]/government-readiness
   → Shows: "Government Ready" status
   → Shows creator contact info
   → Provides button to auto-submit

3. Admin troubleshoots milestone
   → POST /growth/petition/[id]/check-milestone (ADMIN)
   → Manually recalculate milestones
   → Helpful if data was out of sync
```

---

## Contact & Support

For questions about the WhatsApp viral engine implementation:
- Check the endpoint documentation above
- Review component usage examples
- See seed data in `prisma/seed.ts`
- Check test examples in E2E tests

**Key Files**:
- Backend: `apps/api/src/whatsapp/*` and `apps/api/src/whatsapp/growth*`
- Frontend: `apps/web/components/{whatsapp-share-modal,petition-milestones,county-leaderboard,trending-petitions,verification-badge}.tsx`
- Database: `apps/api/prisma/schema.prisma` (Referral, PetitionMilestone, ShareLink models)
- Seeds: `apps/api/prisma/seed.ts`

---

**Last Updated**: 2026-04-17
**Status**: Production Ready
**Version**: 1.0.0
