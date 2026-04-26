# Quick Start Guide - WhatsApp Viral Engine

## 5-Minute Setup

### 1. **Apply Database Migration**
```bash
cd apps/api
npx prisma migrate deploy
# or during development:
npx prisma migrate dev
```

✅ Database now has Referral, PetitionMilestone, ShareLink models

### 2. **Seed Test Data**
```bash
npx prisma db seed
```

✅ Database populated with realistic test scenario (1240+ signatures, milestones, referrals)

### 3. **Configure Authentication** (Optional for Google OAuth)
To enable Google OAuth signup/login:

1. Create OAuth credentials at [Google Cloud Console](https://console.cloud.google.com)
   - Create new OAuth 2.0 Client ID (Web application)
   - Authorized redirect URI: `http://localhost:3001/auth/google/callback`
   - Copy Client ID and Client Secret

2. Update `.env` file:
```bash
GOOGLE_OAUTH_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_OAUTH_CLIENT_SECRET="your-client-secret"
NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
```

✅ Email/password and Google OAuth authentication enabled

### 4. **Start Backend**
```bash
npm run dev
# Backend runs on http://localhost:3001
```

✅ WhatsApp & Growth endpoints accessible

### 5. **Start Frontend**
```bash
cd apps/web
npm run dev
# Frontend runs on http://localhost:3000
```

✅ React components loaded, ready to integrate

---

## Authentication Methods

### Phone + OTP (Default)
- **Signup**: POST `/auth/signup` with phone, fullName, email
- **Login**: POST `/auth/login` with phone, then verify with OTP
- **Status**: ✅ Production ready

### Email + Password (New)
- **Signup**: POST `/auth/signup/email` with fullName, phone, email, password
- **Login**: POST `/auth/login/email` with email and password
- **Password Policy**: Min 8 chars, uppercase, lowercase, number required
- **Status**: ✅ Production ready

### Google OAuth (New)
- **Redirect**: GET `/auth/google`
- **Callback**: GET `/auth/google/callback` (handles OAuth token exchange)
- **Profile Linking**: Automatically links Google account to email if match found
- **Status**: ✅ Ready for configuration

---

## Testing Authentication

### Test Email + Password Signup
```bash
curl -X POST http://localhost:3001/api/auth/signup/email \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "phone": "+231770000000",
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

**Expected Response**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Test Email + Password Login
```bash
curl -X POST http://localhost:3001/api/auth/login/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

**Expected Response**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Test Phone + OTP Signup
```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Jane Smith",
    "phone": "+231770111111",
    "email": "jane@example.com"
  }'
```

### Test Google OAuth Flow
1. **Frontend**: User clicks "Sign in with Google" button
2. **Redirect**: GET `http://localhost:3001/auth/google` → Google login page
3. **Callback**: Google redirects to `http://localhost:3001/auth/google/callback?code=...`
4. **Backend**: Exchanges code for token, creates/links user
5. **Response**: Returns JWT token for authenticated session

---

## Testing WhatsApp & Growth

### Test WhatsApp Message Generation
```bash
curl -X POST http://localhost:3001/api/whatsapp/generate-message \
  -H "Content-Type: application/json" \
  -d '{"petitionId":"[ID_FROM_SEED]"}'
```

**Expected Response**:
```json
{
  "message": "🇱🇷 FIX SINKOR ROADS 🔥\n1,240 people have signed!...",
  "petitionTitle": "Fix Sinkor Community Roads Before Rainy Season",
  "petitionId": "..."
}
```

### Test Trending Petitions
```bash
curl http://localhost:3001/api/growth/trending?limit=5
```

**Expected Response**: List of 5 trending petitions with velocity

### Test County Leaderboard
```bash
curl http://localhost:3001/api/growth/leaderboard/Montserrado
```

**Expected Response**: Ranked petitions in county

### Test Referral Creation
```bash
curl -X POST http://localhost:3001/api/whatsapp/create-referral \
  -H "Authorization: Bearer [JWT_TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{"petitionId":"[ID_FROM_SEED]"}'
```

**Expected Response**:
```json
{
  "referralCode": "SATT001",
  "shareUrl": "https://changelib.org/r/satt001",
  "whatsappMessage": "...",
  "expiresAt": "2026-05-17T..."
}
```

---

## Integrating Components

### 1. Add Share Modal to Petition Page

**File**: `apps/web/app/petitions/[id]/page.tsx`

```tsx
import { WhatsAppShareModal } from '@/components/whatsapp-share-modal';
import { PetitionMilestones } from '@/components/petition-milestones';

export default function PetitionPage({ params }) {
  const [showShareModal, setShowShareModal] = useState(false);
  
  return (
    <div>
      <h1>{petition.title}</h1>
      
      {/* Milestone Progress */}
      <PetitionMilestones
        petitionId={petition.id}
        currentSignatures={petition.signaturesCount}
        goal={petition.goal}
      />
      
      {/* Sign Button */}
      <button 
        onClick={() => handleSign()}
        className="btn btn-primary"
      >
        Sign Petition
      </button>
      
      {/* Share Modal - Auto-trigger on signature */}
      {signedSuccessfully && (
        <WhatsAppShareModal
          petitionId={petition.id}
          petitionTitle={petition.title}
          signerName={currentUser?.fullName}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
```

### 2. Add Trending Section to Home Page

**File**: `apps/web/app/page.tsx`

```tsx
import { TrendingPetitions } from '@/components/trending-petitions';

export default function HomePage() {
  const userCounty = 'Montserrado'; // Get from user location
  
  return (
    <div>
      <h1>Welcome to Change Liberia</h1>
      
      {/* Trending Petitions */}
      <section className="my-12">
        <TrendingPetitions
          limit={6}
          county={userCounty}
        />
      </section>
      
      {/* County Leaderboard */}
      <section className="my-12">
        <CountyLeaderboard
          county={userCounty}
          limit={10}
        />
      </section>
    </div>
  );
}
```

### 3. Add Trust Score Badge to User Profile

**File**: `apps/web/app/profile/page.tsx`

```tsx
import { VerificationBadge } from '@/components/verification-badge';

export default function ProfilePage() {
  return (
    <div>
      <h1>My Profile</h1>
      
      {/* Trust Score */}
      <VerificationBadge
        trustScore={user.trustScore}
        verificationStatus={user.verificationStatus}
        compact={false}
        showLabel={true}
      />
      
      {/* Other profile sections */}
    </div>
  );
}
```

---

## Key API Endpoints

### Frequently Used Endpoints

| Purpose | Endpoint | Method | Auth |
|---------|----------|--------|------|
| Show trending | `GET /growth/trending?limit=6` | GET | Optional |
| Get metrics | `GET /growth/petition/:id/metrics` | GET | Optional |
| Generate message | `POST /whatsapp/generate-message` | POST | Optional |
| Create referral | `POST /whatsapp/create-referral` | POST | Required JWT |
| Track click | `GET /whatsapp/share-link/:code` | GET | No |
| Mark signed | `POST /whatsapp/track-conversion` | POST | Required JWT |

---

## Environment Variables

No new environment variables required. Uses existing:
- `DATABASE_URL` - PostgreSQL connection
- `JWT_SECRET` - For authentication

---

## File Locations

### Backend
```
apps/api/src/whatsapp/
├── whatsapp.service.ts       (230 lines)
├── whatsapp.controller.ts    (250 lines)
├── growth.service.ts         (330 lines)
├── growth.controller.ts      (320 lines)
└── whatsapp.module.ts        (15 lines)
```

### Frontend
```
apps/web/components/
├── whatsapp-share-modal.tsx     (280 lines)
├── petition-milestones.tsx      (250 lines)
├── county-leaderboard.tsx       (300 lines)
├── trending-petitions.tsx       (320 lines)
└── verification-badge.tsx       (260 lines)
```

### Database
```
apps/api/prisma/
├── schema.prisma             (updated with 3 new models)
└── migrations/
    └── [date]_add_whatsapp_viral_system/
        └── migration.sql      (auto-generated)
```

---

## Common Tasks

### Clear Database & Re-seed
```bash
cd apps/api
npx prisma db push --force-reset
npx prisma db seed
```

### View Database Records
```bash
npx prisma studio
# Opens browser UI at http://localhost:5555
```

### Check Referral Stats
```bash
curl "http://localhost:3001/api/whatsapp/metrics/[PETITION_ID]"
```

### Get Trending Petitions
```bash
curl "http://localhost:3001/api/growth/trending?limit=10"
```

### Monitor TypeScript Errors
```bash
npm run build
# or during development
npm run dev -- --watch
```

---

## Troubleshooting

### "Referral model not found"
```
Solution: npx prisma migrate dev
or: npx prisma db push
```

### "JWT token invalid"
```
Solution: Pass valid JWT in Authorization header
curl -H "Authorization: Bearer [token]" http://...
```

### "Petition not found"
```
Solution: Use valid petition ID from seed data
Run: npx prisma studio
View Petition table to get valid IDs
```

### "Rate limit exceeded"
```
Solution: Wait 60 seconds or use different user JWT
/whatsapp/create-referral has 10 req/min limit per user
```

### Components not showing
```
Solution: Check that components are imported in page
import { WhatsAppShareModal } from '@/components/whatsapp-share-modal'
```

---

## Success Indicators

✅ You know things are working when:

1. **Backend**
   - `npm run dev` shows "Listening on port 3001"
   - `GET /growth/trending` returns petition list
   - `POST /whatsapp/generate-message` returns formatted message

2. **Database**
   - `npx prisma studio` shows Referral, PetitionMilestone, ShareLink tables
   - Seed data visible in each table
   - Migrations applied without errors

3. **Frontend**
   - Components import without errors
   - `npm run dev` starts without issues
   - Components render without TypeScript errors

---

## Next Steps

1. **Integrate Components** into your pages (follow examples above)
2. **Wire up Signature Flow** to trigger share modal
3. **Test End-to-End** from signature to WhatsApp share
4. **Monitor Metrics** using `/api/whatsapp/metrics` endpoint
5. **Proceed to Phase 2b** - Government Integration

---

## Need Help?

### Check Documentation
- Main guide: `WHATSAPP_VIRAL_ENGINE.md`
- Status report: `IMPLEMENTATION_STATUS.md`
- Component examples in this file

### Review Code
- Services: Well-commented with JSDoc
- Controllers: Show endpoint patterns
- Components: Include usage examples

### Test Endpoints
```bash
# Visual API testing
npm install -g httpie
http POST localhost:3001/api/whatsapp/generate-message petitionId=[ID]
http GET localhost:3001/api/growth/trending
http GET localhost:3001/api/growth/leaderboard/Montserrado
```

---

## Quick Reference

**WhatsApp Endpoints** (7 total)
```
POST   /whatsapp/generate-message
POST   /whatsapp/create-referral
GET    /whatsapp/share-link/:shortCode
POST   /whatsapp/track-conversion
GET    /whatsapp/metrics/:petitionId
GET    /whatsapp/my-referrals
GET    /whatsapp/referral/:referralCode
```

**Growth Endpoints** (7 total)
```
GET    /growth/trending
GET    /growth/leaderboard/:county
GET    /growth/petition/:id/metrics
GET    /growth/petition/:id/milestones
GET    /growth/petition/:id/government-readiness
GET    /growth/petition/:id/share-trigger
POST   /growth/petition/:id/check-milestone
```

**Components** (5 total)
```
<WhatsAppShareModal />      - Post-signature sharing
<PetitionMilestones />      - Progress display
<CountyLeaderboard />       - County rankings
<TrendingPetitions />       - Discovery grid
<VerificationBadge />       - Trust score display
```

---

**Version**: 1.0.0
**Last Updated**: April 17, 2026
**Status**: ✅ Ready for Use
