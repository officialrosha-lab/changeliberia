# todaySignatures Management Analysis

## Summary
**POTENTIAL BUG FOUND**: `todaySignatures` is being incremented when signatures are created but **there is NO daily reset mechanism** implemented. This counter will continuously grow and never reset.

---

## 1. Where todaySignatures is Incremented

### File: [apps/api/src/signatures/signatures.service.ts](apps/api/src/signatures/signatures.service.ts#L96-L100)

**Location**: Lines 96-100
```typescript
await this.prisma.petition.update({
  where: { id: dto.petitionId },
  data: {
    signaturesCount: { increment: 1 },
    todaySignatures: { increment: 1 },  // ← Incremented with every signature
  },
});
```

**Trigger**: Every time a signature is created via `POST /api/v1/signatures`
- User signs a petition
- Signature record created with fraud detection checks
- Petition's `todaySignatures` counter incremented by 1

---

## 2. Signature Creation Flow

### Complete Flow in signatures.service.ts

1. **Validation** (lines 31-48)
   - Verify petition exists
   - Check for duplicate signatures (user + petition)
   - Upsert device fingerprint if provided

2. **Fraud Detection** (lines 49-77)
   - Call `fraud.evaluateSignatureRisk()` to assess risk
   - If high risk detected, require CAPTCHA

3. **Signature Creation** (lines 79-92)
   - Create Signature record in database
   - Increment Prometheus metrics

4. **Update Petition Counters** (lines 96-100) ← **KEY LINE**
   - `signaturesCount: { increment: 1 }` - Total signatures (working correctly)
   - `todaySignatures: { increment: 1 }` - **NEVER RESET**

5. **Fetch Updated Petition** (lines 105-108)
   - Retrieve updated petition data

6. **Broadcast Updates** (lines 119-137)
   - Notify WebSocket clients of new signature count
   - Broadcast to pulse map and live feed
   - Use `todaySignatures` value for realtime updates

---

## 3. Where todaySignatures is Read/Used

### Growth/Momentum Ranking
**File**: [apps/api/src/petitions/petitions.service.ts](apps/api/src/petitions/petitions.service.ts#L64)
```typescript
const momentum = petition.todaySignatures * 1.5 + petition.signaturesCount * 0.2;
```
- Weights **today's signatures 7.5x heavier** than total signatures in discovery ranking

### Trending Petitions API
**File**: [apps/api/src/petitions/petitions.service.ts](apps/api/src/petitions/petitions.service.ts#L139-L141)
```typescript
const petitions = await this.prisma.petition.findMany({
  where: { status: PetitionStatus.APPROVED },
  orderBy: { todaySignatures: 'desc' },  // ← Sorts by daily counter
  take: 25,
});
```
- `GET /api/v1/petitions/trending` returns top 25 by daily signatures

### WhatsApp Growth Service
**File**: [apps/api/src/whatsapp/growth.service.ts](apps/api/src/whatsapp/growth.service.ts#L89-L108)
```typescript
todaySignatures: true,  // ← Fetches field
// ...
signatureVelocity: p.todaySignatures, // Signatures per day
```
- Used in growth calculations and WhatsApp bot responses

### Real-time Broadcasts
**File**: [apps/api/src/events/petitions.gateway.ts](apps/api/src/events/petitions.gateway.ts#L71-L81)
```typescript
todaySignatures: true,  // ← Sends to WebSocket clients
// ...
todaySignatures: petition.todaySignatures || 0,
```

---

## 4. Daily Reset Mechanism - **MISSING**

### Search Results
Searched codebase for:
- ❌ `@Cron` decorators related to petitions → **NOT FOUND**
- ❌ `@Scheduled` decorators for reset logic → **NOT FOUND**
- ❌ Reset queries in database migrations → **NOT FOUND**
- ❌ Daily reset field (`lastResetDate`, `resetDate`) → **NOT FOUND**
- ❌ Middleware/hooks to reset based on timestamp → **NOT FOUND**

### Scheduled Tasks That DO Exist
**File**: [apps/api/src/fraud/fraud.scheduler.ts](apps/api/src/fraud/fraud.scheduler.ts)
- Cron jobs for fraud detection (every 10 minutes, every minute)
- **No petition counter reset logic**

**File**: [apps/api/src/email/services/email-schedule.service.ts](apps/api/src/email/services/email-schedule.service.ts)
- Email scheduling and digest jobs
- **No petition counter reset logic**

### App Module Configuration
**File**: [apps/api/src/app.module.ts](apps/api/src/app.module.ts#L10)
```typescript
ScheduleModule.forRoot(),  // ← Module is loaded
```
The `@nestjs/schedule` module is available but **not used for todaySignatures reset**

---

## 5. Database Schema

### Field Definition
**File**: [apps/api/prisma/schema.prisma](apps/api/prisma/schema.prisma#L141)
```prisma
todaySignatures  Int  @default(0)
```

### Initial Value
**File**: [apps/api/prisma/seed.ts](apps/api/prisma/seed.ts#L28)
```typescript
todaySignatures: 95,  // Seed data
```

### Migration
**File**: [apps/api/prisma/migrations/20260414212553_fraud_phase2/migration.sql](apps/api/prisma/migrations/20260414212553_fraud_phase2/migration.sql#L38)
```sql
"todaySignatures" INTEGER NOT NULL DEFAULT 0,
```
- Introduced in Phase 2 fraud implementation
- No triggers or constraints for reset

---

## 🐛 **BUG ANALYSIS**

### The Problem

1. **Counter Never Resets**
   - `todaySignatures` increments with every signature
   - No daily reset mechanism exists
   - Value grows indefinitely

2. **Data Integrity Issue**
   - After 1 year: counter could be 365+ petitions × 1000+ signatures = meaningless
   - Trending API will be dominated by oldest petitions (highest cumulative count)
   - "Today's" metrics actually represent "all-time daily"

3. **Real-time Impact**
   - Momentum calculation (`todaySignatures * 1.5`) becomes inaccurate
   - Trending page won't show truly trending petitions
   - WhatsApp bot growth metrics are skewed

### Severity: **HIGH**
- Affects core discovery algorithm
- Impacts user experience (wrong petitions ranked)
- Business logic broken (can't identify actual daily trends)

---

## 6. Current Usage in Frontend

### Trending Petitions Display
**Receives** `todaySignatures` from `GET /api/v1/petitions/trending`
- Displays momentum meter based on daily counter
- Users think metric represents "today" but it's cumulative

### Real-time Updates
- WebSocket broadcasts include `todaySignatures`
- Shown on live signature feed

---

## 🔧 **RECOMMENDED FIX**

### Option A: Add Daily Reset (Recommended)

Add to `apps/api/src/petitions/petitions.scheduler.ts` (new file):

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PetitionsScheduler {
  private readonly logger = new Logger(PetitionsScheduler.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT) // Runs at 00:00 UTC
  async resetDailySignatures() {
    const result = await this.prisma.petition.updateMany({
      data: { todaySignatures: 0 },
    });
    this.logger.log(
      `Reset todaySignatures for ${result.count} petitions`,
    );
  }
}
```

Then add to `apps/api/src/petitions/petitions.module.ts`:
```typescript
import { PetitionsScheduler } from './petitions.scheduler';

@Module({
  // ...
  providers: [PetitionsService, PetitionEmailService, PetitionMediaStorageService, PetitionsScheduler],
})
```

### Option B: Track Reset Date

Add field to schema:
```prisma
todaySignaturesResetAt  DateTime  @default(now())
```

Compute "today's signatures" dynamically:
```typescript
// In trending() method:
const today = new Date().toDateString();
const petitions = await this.prisma.$queryRaw`
  SELECT p.*, 
    COUNT(s.id) as computed_today_signatures
  FROM "Petition" p
  LEFT JOIN "Signature" s ON p.id = s."petitionId"
    AND DATE(s."createdAt") = ${today}
  WHERE p.status = 'APPROVED'
  GROUP BY p.id
  ORDER BY computed_today_signatures DESC
  LIMIT 25
`;
```

---

## Summary Table

| Aspect | Status | Details |
|--------|--------|---------|
| **Incremented** | ✅ Working | Line 100 in signatures.service.ts |
| **Read** | ✅ Working | trending(), momentum calculation, WhatsApp growth |
| **Reset** | ❌ **MISSING** | No cron job, no reset logic anywhere |
| **Data Model** | ✅ Exists | Defined in schema.prisma |
| **Bug Impact** | 🔴 HIGH | Breaks trending discovery, momentum ranking |
| **Fix Priority** | 🔴 HIGH | Add reset scheduler or compute dynamically |

