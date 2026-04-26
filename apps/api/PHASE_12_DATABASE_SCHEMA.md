# Phase 12: Database Schema Updates

## Overview

Phase 12 requires adding webhook tracking to the database schema. This document shows the exact Prisma schema updates needed.

## New Table: WebhookEventLog

Tracks processed webhook events to prevent duplicate processing.

```prisma
model WebhookEventLog {
  /// Unique identifier
  id          String   @id @default(cuid())
  
  /// Stripe webhook event ID (unique)
  stripeEventId String @unique
  
  /// When event was received from Stripe
  receivedAt  DateTime @default(now())
  
  /// When event was processed
  processedAt DateTime @updatedAt
  
  /// Optional: Store event details for debugging
  eventType   String?
  eventData   Json?
  
  /// Optional: Store processing result
  success     Boolean @default(true)
  error       String?
  
  @@index([stripeEventId])
  @@index([processedAt])
  @@index([success])
  @@map("webhook_event_logs")
}
```

## Updated Table: Payment

Add webhook tracking fields to Payment model.

```prisma
model Payment {
  // ... existing fields ...
  
  /// Track last webhook event that updated this payment
  lastWebhookEventId String?
  
  // ... rest of model ...
  
  @@index([lastWebhookEventId])
}
```

**Changes**:
- Add `lastWebhookEventId String?` field
- Add index for webhook lookups

## Updated Table: Subscription

Add webhook tracking fields to Subscription model.

```prisma
model Subscription {
  // ... existing fields ...
  
  /// Track last webhook event that updated this subscription
  lastWebhookEventId String?
  
  // ... rest of model ...
  
  @@index([lastWebhookEventId])
}
```

**Changes**:
- Add `lastWebhookEventId String?` field
- Add index for webhook lookups

## Updated Table: User

Add Stripe customer ID tracking.

```prisma
model User {
  // ... existing fields ...
  
  /// Stripe customer ID for this user
  stripeCustomerId String?
  
  // ... rest of model ...
  
  @@index([stripeCustomerId])
}
```

**Changes**:
- Add `stripeCustomerId String?` field
- Add index for customer lookups

## Migration Script

Create a new migration file:

```bash
# Generate migration
npx prisma migrate dev --name add_webhook_tracking

# Or create manually: prisma/migrations/[timestamp]_add_webhook_tracking/migration.sql
```

### Migration SQL

```sql
-- Create WebhookEventLog table
CREATE TABLE "webhook_event_logs" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "stripeEventId" TEXT NOT NULL UNIQUE,
  "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "eventType" TEXT,
  "eventData" TEXT,
  "success" BOOLEAN NOT NULL DEFAULT 1,
  "error" TEXT
);

-- Create indices on WebhookEventLog
CREATE INDEX "webhook_event_logs_stripeEventId_idx" ON "webhook_event_logs"("stripeEventId");
CREATE INDEX "webhook_event_logs_processedAt_idx" ON "webhook_event_logs"("processedAt");
CREATE INDEX "webhook_event_logs_success_idx" ON "webhook_event_logs"("success");

-- Add webhook tracking to Payment table
ALTER TABLE "payments" ADD COLUMN "lastWebhookEventId" TEXT;
CREATE INDEX "payments_lastWebhookEventId_idx" ON "payments"("lastWebhookEventId");

-- Add webhook tracking to Subscription table
ALTER TABLE "subscriptions" ADD COLUMN "lastWebhookEventId" TEXT;
CREATE INDEX "subscriptions_lastWebhookEventId_idx" ON "subscriptions"("lastWebhookEventId");

-- Add Stripe customer ID to User table
ALTER TABLE "users" ADD COLUMN "stripeCustomerId" TEXT;
CREATE INDEX "users_stripeCustomerId_idx" ON "users"("stripeCustomerId");
```

## Complete Schema Sections

### WebhookEventLog Table (New)

```prisma
model WebhookEventLog {
  id            String   @id @default(cuid())
  stripeEventId String   @unique
  receivedAt    DateTime @default(now())
  processedAt   DateTime @updatedAt
  eventType     String?
  eventData     Json?
  success       Boolean  @default(true)
  error         String?

  @@index([stripeEventId])
  @@index([processedAt])
  @@index([success])
  @@map("webhook_event_logs")
}
```

### Payment Table (Updated)

```prisma
model Payment {
  id                      String   @id @default(cuid())
  userId                  String
  user                    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  petitionId              String?
  petition                Petition? @relation(fields: [petitionId], references: [id], onDelete: SetNull)
  
  amount                  Int      // in cents
  currency                String
  
  type                    String   // DONATION, SIGNATURE_FEE, etc.
  status                  String   // PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED
  
  // Stripe identifiers
  stripePaymentIntentId   String?  @unique
  stripeChargeId          String?  @unique
  stripeInvoiceId         String?  @unique
  stripeCustomerId        String?
  
  // Webhook tracking
  lastWebhookEventId      String?  @index
  
  // Payment details
  lastFourDigits          String?
  brand                   String?
  
  // Timestamps
  createdAt               DateTime @default(now())
  completedAt             DateTime?
  failureReason           String?
  
  // Metadata
  description             String?
  metadata                Json?
  
  @@index([userId])
  @@index([petitionId])
  @@index([stripePaymentIntentId])
  @@index([stripeChargeId])
  @@index([stripeInvoiceId])
  @@index([stripeCustomerId])
  @@index([lastWebhookEventId])
  @@map("payments")
}
```

### Subscription Table (Updated)

```prisma
model Subscription {
  id                    String   @id @default(cuid())
  userId                String
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  amount                Int      // in cents per billing period
  currency              String
  interval              String   // DAILY, WEEKLY, MONTHLY, YEARLY
  
  // Stripe identifiers
  stripeSubscriptionId  String   @unique
  stripeCustomerId      String
  
  status                String   // ACTIVE, PAUSED, CANCELLED
  
  // Webhook tracking
  lastWebhookEventId    String?  @index
  
  // Timestamps
  startDate             DateTime
  cancelledAt           DateTime?
  nextBillingDate       DateTime?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  // Configuration
  autoRenew             Boolean  @default(true)
  
  // Metadata
  description           String?
  metadata              Json?
  
  @@index([userId])
  @@index([stripeSubscriptionId])
  @@index([stripeCustomerId])
  @@index([lastWebhookEventId])
  @@map("subscriptions")
}
```

### User Table (Updated)

```prisma
model User {
  id                  String   @id @default(cuid())
  email               String   @unique
  password            String   // hashed
  firstName           String?
  lastName            String?
  
  // Stripe integration
  stripeCustomerId    String?  @unique @index
  
  // Account status
  status              String   @default("ACTIVE")
  emailVerified       Boolean  @default(false)
  
  // Timestamps
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  // Relations
  payments            Payment[]
  subscriptions       Subscription[]
  
  @@map("users")
}
```

## Implementation Steps

### 1. Update Prisma Schema

Edit `apps/api/prisma/schema.prisma`:

1. Add WebhookEventLog model
2. Update Payment model with `lastWebhookEventId`
3. Update Subscription model with `lastWebhookEventId`
4. Update User model with `stripeCustomerId`

### 2. Create and Run Migration

```bash
cd apps/api

# Generate migration based on schema changes
npx prisma migrate dev --name add_webhook_tracking

# This will:
# - Create migration file
# - Apply migration to database
# - Generate Prisma Client
```

### 3. Verify Migration

```bash
# Check migration was applied
npx prisma migrate status

# Validate schema
npx prisma validate
```

### 4. Generate Updated Types

```bash
# Regenerate Prisma types
npx prisma generate
```

## Indices Strategy

### WebhookEventLog Indices

- **stripeEventId**: Primary lookup to check for duplicates (UNIQUE)
- **processedAt**: For cleanup queries (remove old logs)
- **success**: For monitoring failed webhook processing

### Payment Indices

- **userId**: Query payments by user
- **stripePaymentIntentId**: Webhook event lookup
- **stripeChargeId**: Refund tracking
- **stripeInvoiceId**: Subscription payment lookup
- **lastWebhookEventId**: Prevent duplicate updates

### Subscription Indices

- **userId**: Query subscriptions by user
- **stripeSubscriptionId**: Webhook event lookup
- **lastWebhookEventId**: Prevent duplicate updates

### User Indices

- **stripeCustomerId**: Link Stripe customer to user
- **email**: User lookup (already indexed)

## Query Examples

### Check if Event Already Processed

```typescript
const processed = await prisma.webhookEventLog.findUnique({
  where: { stripeEventId: 'evt_...' }
});

if (processed) {
  // Duplicate event - skip processing
  return;
}
```

### Find Payment by Stripe Intent

```typescript
const payment = await prisma.payment.findUnique({
  where: { stripePaymentIntentId: 'pi_...' }
});
```

### Find User by Stripe Customer

```typescript
const user = await prisma.user.findFirst({
  where: { stripeCustomerId: 'cus_...' }
});
```

### Record Processed Event

```typescript
await prisma.webhookEventLog.create({
  data: {
    stripeEventId: 'evt_...',
    eventType: 'payment_intent.succeeded',
    eventData: event.data,
    success: true
  }
});
```

### Update Payment with Webhook Event

```typescript
await prisma.payment.update({
  where: { id: 'payment_...' },
  data: {
    status: 'COMPLETED',
    lastWebhookEventId: 'evt_...',
    completedAt: new Date()
  }
});
```

## Performance Considerations

### Index Coverage

All webhook lookups are covered by indices:
- Duplicate check: `stripeEventId` (UNIQUE)
- Payment lookup: `stripePaymentIntentId`, `stripeChargeId`, `stripeInvoiceId`
- Subscription lookup: `stripeSubscriptionId`
- User lookup: `stripeCustomerId`

### Query Optimization

1. **Webhook Event Lookup**: O(1) via unique index
2. **Payment Lookup**: O(1) via unique index on `stripePaymentIntentId`
3. **User Lookup**: O(1) via unique index on `stripeCustomerId`

### Cleanup Strategy

Remove old webhook event logs periodically:

```typescript
// Keep logs for 30 days
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

await prisma.webhookEventLog.deleteMany({
  where: {
    processedAt: { lt: thirtyDaysAgo }
  }
});
```

## Data Validation

### Stripe ID Formats

```typescript
// Stripe IDs follow these patterns:
const eventId = 'evt_1234567890abcdefghijklmn';      // Webhook event
const paymentIntentId = 'pi_1234567890abcdefghijklmn'; // Payment intent
const chargeId = 'ch_1234567890abcdefghijklmn';       // Charge
const invoiceId = 'in_1234567890abcdefghijklmn';      // Invoice
const customerId = 'cus_1234567890abcdefghijklmn';    // Customer
```

### Validation Rules

```typescript
export const isValidStripeId = (id: string, prefix: string): boolean => {
  const pattern = new RegExp(`^${prefix}_[a-zA-Z0-9]+$`);
  return pattern.test(id);
};

// Usage:
isValidStripeId('pi_...', 'pi');     // true
isValidStripeId('cus_...', 'cus');   // true
isValidStripeId('evt_...', 'evt');   // true
```

## Migration Rollback

If issues occur, rollback the migration:

```bash
# See migration history
npx prisma migrate status

# Rollback last migration
npx prisma migrate resolve --rolled-back "add_webhook_tracking"

# Manually revert if needed
# Edit Prisma schema to remove changes
# Then: npx prisma migrate resolve --rolled-back "add_webhook_tracking"
```

## Testing Schema Changes

```bash
# Validate schema with Prisma
npx prisma validate

# Check for database inconsistencies
npx prisma db pull

# Reset test database
npx prisma db push --skip-generate
```

## References

- [Prisma Migrations Guide](https://www.prisma.io/docs/orm/prisma-migrate/getting-started)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Database Indexing Best Practices](https://www.prisma.io/dataguide/postgresql/indexes)
