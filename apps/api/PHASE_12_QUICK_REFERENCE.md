# Phase 12: Quick Reference Guide

## What's Been Created

### 1. Raw Body Middleware ✅
**File**: `apps/api/src/common/middleware/raw-body.middleware.ts`
**Purpose**: Captures raw request body for Stripe signature verification
**Status**: Registered in `main.ts`

### 2. Payment Constants ✅
**File**: `apps/api/src/payments/payments.constants.ts`
**Purpose**: Enums, event types, and configuration constants
**Exports**:
- PaymentStatus, PaymentType, PaymentMethod enums
- SubscriptionStatus, SubscriptionInterval enums
- StripeEventType enum with all webhook event types
- WEBHOOK_CONFIG with signature verification settings
- Fee structures and retry policies
- Error codes

### 3. Webhook Event Handler Service ✅
**File**: `apps/api/src/payments/webhook-event-handler.service.ts`
**Purpose**: Process specific webhook event types
**Methods**:
- `handleWebhookEvent(event)` - Route event to appropriate handler
- Private methods for each event type:
  - Payment intent events (succeeded, failed, canceled)
  - Subscription events (created, updated, deleted)
  - Invoice events (payment succeeded, failed)
  - Charge events (succeeded, failed, refunded)
  - Customer events (created, deleted)

### 4. Payment Webhook Service ✅
**File**: `apps/api/src/payments/payment-webhook.service.ts`
**Purpose**: Verify webhook signatures and prevent duplicates
**Methods**:
- `processWebhook(req)` - Main entry point
- `verifyWebhookSignature(rawBody, signature)` - Validates signature
- `validateTimestamp(timestamp)` - Checks timestamp freshness
- `isDuplicateEvent(eventId)` - Detects duplicate webhooks
- `recordWebhookEvent(eventId)` - Records processed events
- `getWebhookStats()` - Returns processing statistics
- `healthCheck()` - Service health status

### 5. Documentation ✅
**Files**:
- `STRIPE_WEBHOOK_SETUP.md` - Complete setup guide
- `PHASE_12_WEBHOOK_IMPLEMENTATION.md` - Architecture and implementation guide

## Implementation Flow

```
User Payment/Subscription Event
        ↓
Stripe Webhook Triggered
        ↓
POST /api/v1/payments/webhook
        ↓
RawBodyMiddleware (captures raw body)
        ↓
PaymentController.webhook() handler
        ↓
PaymentWebhookService.processWebhook()
  ├─ Validate inputs
  ├─ Verify signature
  ├─ Check for duplicates
  └─ Route to event handler
        ↓
WebhookEventHandlerService.handleWebhookEvent()
  ├─ Determine event type
  ├─ Call appropriate handler
  ├─ Update database
  ├─ Queue emails
  └─ Log analytics
        ↓
Return 200 OK
```

## How to Wire Everything Together

### Step 1: Update PaymentModule

```typescript
// apps/api/src/payments/payment.module.ts

import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaymentWebhookService } from './payment-webhook.service';
import { WebhookEventHandlerService } from './webhook-event-handler.service';

@Module({
  controllers: [PaymentController],
  providers: [
    PaymentService,
    PaymentWebhookService,
    WebhookEventHandlerService,
  ],
  exports: [PaymentService, PaymentWebhookService],
})
export class PaymentModule {}
```

### Step 2: Update PaymentController

```typescript
// apps/api/src/payments/payment.controller.ts

import { Controller, Post, Req, HttpCode } from '@nestjs/common';
import { PaymentWebhookService } from './payment-webhook.service';
import { RawBodyRequest } from '../common/middleware/raw-body.middleware';

@Controller('payments')
export class PaymentController {
  constructor(
    private readonly paymentWebhookService: PaymentWebhookService,
  ) {}

  /**
   * Webhook endpoint for Stripe
   * Receives payment events and processes them
   */
  @Post('webhook')
  @HttpCode(200)
  async webhook(@Req() req: RawBodyRequest): Promise<{ received: boolean }> {
    await this.paymentWebhookService.processWebhook(req);
    return { received: true };
  }
}
```

### Step 3: Update Database Schema

Add these tables to `prisma/schema.prisma`:

```prisma
model WebhookEventLog {
  id          String   @id @default(cuid())
  stripeEventId String @unique
  receivedAt  DateTime @default(now())
  processedAt DateTime @updatedAt
  
  @@index([stripeEventId])
  @@index([processedAt])
}

// Add to Payment model:
model Payment {
  // ... existing fields
  lastWebhookEventId String?
  
  @@index([lastWebhookEventId])
}

// Add to Subscription model:
model Subscription {
  // ... existing fields
  lastWebhookEventId String?
  
  @@index([lastWebhookEventId])
}
```

## Testing Checklist

### Local Testing with Stripe CLI

```bash
# 1. Install Stripe CLI
brew install stripe/stripe-cli/stripe

# 2. Login
stripe login

# 3. Forward webhook events to local server
stripe listen --forward-to localhost:4000/api/v1/payments/webhook

# 4. Copy webhook secret from output
# Add to .env: STRIPE_WEBHOOK_SECRET="whsec_test_..."

# 5. In another terminal, trigger test events
stripe trigger payment_intent.succeeded
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded

# 6. Check application logs for successful processing
tail -f logs/payment.log
```

### Expected Log Output

```
[INFO] Webhook signature verified: payment_intent.succeeded (evt_...)
[LOG] Payment intent succeeded: pi_... (5000 usd)
[LOG] Payment ... marked as completed
[LOG] Queued confirmation email for payment ...
[LOG] Analytics event: payment_completed
[LOG] Webhook event ... processed successfully
```

## Monitoring

### View Webhook Status in Stripe Dashboard

1. Go to Stripe Dashboard
2. Navigate to **Developers** → **Webhooks**
3. Click your webhook endpoint
4. View delivery history:
   - Green checkmark = Success
   - Red X = Failed (will retry)
   - Clock icon = Pending

### Application Metrics

```bash
# Total events processed
curl localhost:4000/api/v1/payments/webhook/stats

# Service health
curl localhost:4000/api/v1/payments/webhook/health
```

## Environment Variables Reference

```bash
# Required
STRIPE_API_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_test_..."

# Optional (with defaults)
STRIPE_CURRENCY="USD"
WEBHOOK_SIGNATURE_TOLERANCE=300  # seconds
ENABLE_WEBHOOK_LOGGING="true"
```

## Error Handling

### Signature Verification Fails
- **Response**: 400 Bad Request
- **Reason**: Invalid signature or timestamp outside tolerance
- **Action**: Check webhook signing secret and server time sync

### Duplicate Event
- **Response**: 200 OK (silent success)
- **Reason**: Event already processed
- **Action**: Application gracefully handles retry

### Processing Error
- **Response**: 500 Internal Server Error
- **Reason**: Database error, missing records, etc.
- **Action**: Stripe automatically retries

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| 400 Signature verification failed | Wrong secret | Verify STRIPE_WEBHOOK_SECRET |
| 400 Timestamp outside tolerance | Server time wrong | Sync server time with NTP |
| 404 Payment not found | Race condition | Ensure Payment created before webhook |
| 500 Database error | Connection failed | Check database connectivity |
| Duplicate processing | No deduplication | Implement webhook event log table |

## Performance Optimization Tips

1. **Make webhook processing fast**
   - Respond within 5 seconds
   - Queue long operations asynchronously

2. **Use database indices**
   - Index `stripeEventId` for fast lookups
   - Index `stripePaymentIntentId` for payment matching
   - Index `stripeSubscriptionId` for subscription matching

3. **Cache Stripe objects**
   - Cache customer data
   - Cache subscription plans
   - Invalidate cache on updates

4. **Batch processing**
   - Group multiple events for bulk operations
   - Defer non-critical updates

## Security Checklist

- [x] Verify webhook signatures
- [x] Check timestamp freshness (prevent replay attacks)
- [x] Prevent duplicate processing
- [x] Use HTTPS (enforced by Stripe)
- [ ] Implement rate limiting on webhook endpoint
- [ ] Add authentication/authorization checks (if needed)
- [ ] Sanitize error messages (don't expose internals)
- [ ] Monitor for suspicious activity
- [ ] Rotate webhook signing secret regularly
- [ ] Use secure environment variables (no hardcoding)

## Next: Integration Steps

1. Create PaymentWebhookService and update PaymentModule
2. Update PaymentController with webhook route
3. Add webhook event log table to database
4. Add lastWebhookEventId fields to Payment/Subscription
5. Run database migrations
6. Test with Stripe CLI
7. Deploy to staging
8. Configure webhook in Stripe Dashboard (test environment)
9. Test in staging
10. Deploy to production
11. Configure webhook in Stripe Dashboard (production environment)
12. Monitor in production

## Useful Links

- [Stripe Webhooks Documentation](https://stripe.com/docs/webhooks)
- [Stripe Test Data](https://stripe.com/docs/testing)
- [Stripe CLI Reference](https://stripe.com/docs/stripe-cli)
- [Payment Intent API](https://stripe.com/docs/api/payment_intents)
- [Subscription API](https://stripe.com/docs/api/subscriptions)
