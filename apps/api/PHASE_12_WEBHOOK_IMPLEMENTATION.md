# Phase 12: Stripe Webhook Integration - Implementation Guide

## Overview

Phase 12 implements comprehensive Stripe webhook handling for the Change Liberia payment system. Webhooks enable real-time processing of payment events including one-time donations, recurring subscriptions, refunds, and payment failures.

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────┐
│                   Stripe Platform                        │
│  (payment processing, subscriptions, webhooks)           │
└──────────────────────────┬──────────────────────────────┘
                           │
                    Webhook Events
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│            POST /api/v1/payments/webhook                  │
│                  (Webhook Endpoint)                       │
└──────────────────────────┬───────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│          RawBodyMiddleware (capture raw body)             │
│     (required for signature verification)                 │
└──────────────────────────┬───────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│         PaymentController.webhook()                       │
│       (route handler, delegating to service)              │
└──────────────────────────┬───────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│      PaymentWebhookService.processWebhook()              │
│  (validate signature, prevent duplicates, route events)   │
└──────────────────────────┬───────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│    WebhookEventHandlerService.handleWebhookEvent()       │
│  (process specific event types, update database)          │
└──────────────────────────┬───────────────────────────────┘
                           │
                ┌──────────┼──────────┬─────────────┐
                │          │          │             │
                ▼          ▼          ▼             ▼
             Update    Queue      Update        Log
             Payment   Emails   Petition    Analytics
             Status            Signature
```

### Key Files Created

1. **RawBodyMiddleware** (`common/middleware/raw-body.middleware.ts`)
   - Captures raw request body for webhook signature verification
   - Must be registered before body parser middleware

2. **PaymentWebhookService** (`payments/payment-webhook.service.ts`)
   - Validates Stripe webhook signatures
   - Prevents duplicate event processing
   - Routes events to appropriate handlers

3. **WebhookEventHandlerService** (`payments/webhook-event-handler.service.ts`)
   - Handles specific webhook event types
   - Updates database records
   - Queues emails and analytics

4. **PaymentConstants** (`payments/payments.constants.ts`)
   - Enums for payment statuses, subscription intervals, etc.
   - Stripe event types and webhook configuration
   - Error codes and retry policies

5. **Documentation**
   - `STRIPE_WEBHOOK_SETUP.md` - Complete webhook setup guide
   - This guide - Implementation architecture and reference

## Event Flow

### 1. One-Time Payment

```
User initiates payment
        ↓
Create PaymentIntent (client or server)
        ↓
User completes payment
        ↓
Stripe: payment_intent.succeeded webhook
        ↓
POST /api/v1/payments/webhook
        ↓
Signature verified ✓
        ↓
Update Payment status → COMPLETED
        ↓
Queue confirmation email
        ↓
Update petition signature count (if applicable)
        ↓
Log analytics event
        ↓
Return 200 OK
```

### 2. Failed Payment

```
User initiates payment
        ↓
Payment processing fails
        ↓
Stripe: payment_intent.payment_failed webhook
        ↓
POST /api/v1/payments/webhook
        ↓
Signature verified ✓
        ↓
Update Payment status → FAILED
        ↓
Queue failure notification
        ↓
Log analytics event
        ↓
Return 200 OK
```

### 3. Recurring Subscription

```
User starts subscription (monthly $X)
        ↓
Create Stripe Subscription
        ↓
Stripe: customer.subscription.created webhook
        ↓
POST /api/v1/payments/webhook
        ↓
Signature verified ✓
        ↓
Create Subscription record in DB
        ↓
Queue welcome email
        ↓
Log analytics event
        ↓
[Monthly billing cycle]
        ↓
Stripe: invoice.payment_succeeded webhook
        ↓
Create Payment record for charge
        ↓
Queue receipt email
```

### 4. Subscription Cancellation

```
User cancels subscription
        ↓
Stripe: customer.subscription.deleted webhook
        ↓
POST /api/v1/payments/webhook
        ↓
Signature verified ✓
        ↓
Update Subscription status → CANCELLED
        ↓
Queue cancellation email
        ↓
Log analytics event
        ↓
Return 200 OK
```

## Webhook Events Handled

### Payment Intent Events

| Event | Trigger | Action |
|-------|---------|--------|
| `payment_intent.succeeded` | One-time payment succeeds | Update Payment to COMPLETED, send confirmation |
| `payment_intent.payment_failed` | One-time payment fails | Update Payment to FAILED, send notification |
| `payment_intent.canceled` | Payment is canceled | Update Payment to CANCELLED |

### Subscription Events

| Event | Trigger | Action |
|-------|---------|--------|
| `customer.subscription.created` | Subscription started | Create Subscription record, send welcome |
| `customer.subscription.updated` | Subscription modified | Update Subscription record |
| `customer.subscription.deleted` | Subscription canceled | Update Subscription to CANCELLED, send notification |

### Invoice Events

| Event | Trigger | Action |
|-------|---------|--------|
| `invoice.payment_succeeded` | Recurring payment succeeds | Create/update Payment record, send receipt |
| `invoice.payment_failed` | Recurring payment fails | Create/update Payment record, send retry notice |

### Charge Events

| Event | Trigger | Action |
|-------|---------|--------|
| `charge.succeeded` | Charge completes | Log (handled via payment_intent) |
| `charge.failed` | Charge fails | Log (handled via payment_intent) |
| `charge.refunded` | Charge refunded | Update Payment to REFUNDED, send confirmation |

## Database Schema

### Payment Table Fields

```typescript
interface Payment {
  id: string;                      // UUID
  userId: string;                  // Foreign key to User
  petitionId?: string;             // Optional foreign key to Petition
  amount: number;                  // Amount in cents (e.g., 5000 = $50.00)
  currency: string;                // ISO 4217 code (USD, EUR, etc.)
  type: PaymentType;               // DONATION, SIGNATURE_FEE, etc.
  status: PaymentStatus;           // PENDING, PROCESSING, COMPLETED, FAILED, etc.
  
  // Stripe identifiers
  stripePaymentIntentId?: string;  // Links to Stripe PaymentIntent
  stripeChargeId?: string;         // Links to Stripe Charge
  stripeInvoiceId?: string;        // Links to Stripe Invoice (for subscriptions)
  stripeCustomerId?: string;       // Links to Stripe Customer
  
  // Webhook tracking
  lastWebhookEventId?: string;     // ID of last webhook event processed
  
  // Timestamps
  createdAt: Date;
  completedAt?: Date;
  failureReason?: string;
  
  // Payment method info
  lastFourDigits?: string;
  brand?: string;                  // VISA, MASTERCARD, etc.
  
  // Metadata
  description?: string;
  metadata?: Record<string, string>;
}
```

### Subscription Table Fields

```typescript
interface Subscription {
  id: string;                      // UUID
  userId: string;                  // Foreign key to User
  
  amount: number;                  // Amount in cents per billing period
  currency: string;                // ISO 4217 code
  interval: SubscriptionInterval;  // DAILY, WEEKLY, MONTHLY, YEARLY
  
  // Stripe identifiers
  stripeSubscriptionId: string;    // Unique Stripe subscription ID
  stripeCustomerId: string;        // Linked Stripe customer
  
  status: SubscriptionStatus;      // ACTIVE, PAUSED, CANCELLED
  
  // Webhook tracking
  lastWebhookEventId?: string;     // ID of last webhook event processed
  
  // Timestamps
  startDate: Date;
  cancelledAt?: Date;
  nextBillingDate?: Date;
  
  // Metadata
  description?: string;
  autoRenew: boolean;
}
```

## Implementation Checklist

### Core Services
- [x] Raw body middleware for webhook signature verification
- [x] Payment webhook service (signature verification, deduplication)
- [x] Webhook event handler service (process events)
- [x] Payment constants (enums, event types)

### Controller Updates
- [ ] Create/update PaymentController webhook route
- [ ] Add webhook endpoint documentation
- [ ] Add error handling and logging

### Database Updates
- [ ] Add `lastWebhookEventId` to Payment table
- [ ] Add `lastWebhookEventId` to Subscription table
- [ ] Create indices for webhook lookup
- [ ] Add webhook event log table (optional, for debugging)

### Module Updates
- [ ] Register PaymentWebhookService in PaymentModule
- [ ] Register WebhookEventHandlerService in PaymentModule
- [ ] Register RawBodyMiddleware in main.ts (DONE ✓)

### Email Integration
- [ ] Implement confirmation email queue
- [ ] Implement failure notification queue
- [ ] Implement subscription welcome email
- [ ] Implement subscription cancellation email
- [ ] Implement receipt email for recurring payments

### Analytics Integration
- [ ] Implement payment analytics event logging
- [ ] Set up event tracking for:
  - payment_completed
  - payment_failed
  - subscription_created
  - subscription_cancelled
  - subscription_payment_succeeded

### Testing
- [ ] Unit tests for webhook signature verification
- [ ] Unit tests for event handlers
- [ ] Integration tests with Stripe test webhooks
- [ ] End-to-end tests with Stripe CLI

### Documentation
- [x] Webhook setup guide
- [ ] API documentation for webhook endpoint
- [ ] Event schema documentation
- [ ] Troubleshooting guide

### Deployment
- [ ] Configure webhook endpoint in Stripe Dashboard (test environment)
- [ ] Obtain webhook signing secret
- [ ] Add `STRIPE_WEBHOOK_SECRET` to `.env`
- [ ] Deploy to staging environment
- [ ] Test with Stripe CLI
- [ ] Configure production webhook endpoint
- [ ] Update production environment variables
- [ ] Monitor webhook delivery in Stripe Dashboard

## Environment Variables

Required for webhook processing:

```bash
# Stripe Credentials
STRIPE_API_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_test_..."

# Optional
STRIPE_CURRENCY="USD"
WEBHOOK_SIGNATURE_TOLERANCE=300  # 5 minutes in seconds
ENABLE_WEBHOOK_LOGGING="true"
```

## Webhook Signature Verification

All webhooks are automatically verified using Stripe's HMAC-SHA256 signature:

```typescript
// Verification process:
1. Extract timestamp (t) from Stripe-Signature header
2. Check timestamp freshness (default: 5 minutes)
3. Create signed content: "{timestamp}.{body}"
4. Compute HMAC-SHA256 using webhook signing secret
5. Compare computed signature with provided signature (v1)
6. If all checks pass, process webhook
```

Stripe can send the same webhook multiple times (network issues, timeouts). Prevent duplicate processing by:
- Storing processed webhook event IDs in `lastWebhookEventId`
- Checking database before processing each event
- Using database transactions for atomic updates

## Error Handling

### Webhook Signature Verification Failures

If signature verification fails:
- Log security warning
- Return 400 Bad Request
- Don't process webhook
- Alert operations team if repeated

### Event Processing Errors

If event processing fails:
- Log error with event ID
- Return 500 Internal Server Error (allows Stripe to retry)
- Stripe will retry up to 5 times with exponential backoff
- Monitor failed deliveries in Stripe Dashboard

### Database Errors

If database update fails:
- Log error with context
- Return 500 Internal Server Error
- Stripe will retry
- Check database connectivity and logs

## Monitoring and Debugging

### Webhook Delivery Status

In Stripe Dashboard → Developers → Webhooks → [Endpoint]:
- View all events sent to your endpoint
- See delivery status (success, failure, pending)
- Manual retry for failed deliveries
- View request/response details

### Application Logs

```bash
# View webhook processing logs
tail -f logs/payment.log | grep webhook

# Filter by event type
tail -f logs/payment.log | grep "payment_intent.succeeded"

# Filter errors
tail -f logs/payment.log | grep ERROR
```

### Testing Webhooks Locally

```bash
# Start Stripe CLI listener
stripe listen --forward-to localhost:4000/api/v1/payments/webhook

# Copy webhook signing secret from output
export STRIPE_WEBHOOK_SECRET="whsec_test_..."

# Update .env with secret

# Trigger test events in another terminal
stripe trigger payment_intent.succeeded
stripe trigger customer.subscription.created
```

## Security Considerations

1. **Signature Verification**: Always verify webhook signatures using the signing secret
2. **HTTPS Only**: Webhooks must be delivered over HTTPS
3. **Timestamp Tolerance**: Prevent replay attacks by checking timestamp freshness
4. **Idempotency**: Handle duplicate webhooks gracefully
5. **Secrets Management**: Never commit signing secret to git
6. **Rate Limiting**: Implement rate limiting on webhook endpoint
7. **Timeout Protection**: Process webhooks within 30 seconds
8. **Error Handling**: Don't expose sensitive information in error messages

## Performance Optimization

1. **Async Processing**: Queue emails and analytics events asynchronously
2. **Caching**: Cache customer and subscription data to reduce lookups
3. **Batch Processing**: Batch multiple webhook events when possible
4. **Database Indices**: Create indices on:
   - `stripePaymentIntentId`
   - `stripeSubscriptionId`
   - `stripeInvoiceId`
   - `lastWebhookEventId`

## Webhook Retry Logic

Stripe automatically retries failed webhook deliveries:

- **Initial delivery**: Immediate
- **5-minute window**: Retry up to 6 times
- **1-hour window**: Retry up to 5 times
- **Manual retry**: Available in Stripe Dashboard

If your endpoint consistently returns errors:
1. Check application logs for errors
2. Verify database connectivity
3. Ensure webhook signing secret is correct
4. Review webhook event in Stripe Dashboard
5. Manual retry after fix

## Next Steps

1. Implement PaymentWebhookService and WebhookEventHandlerService
2. Create/update PaymentController webhook route
3. Add database fields for webhook tracking
4. Integrate email queue for notifications
5. Set up analytics event logging
6. Test with Stripe CLI
7. Deploy to production

## References

- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Payment Intent API](https://stripe.com/docs/api/payment_intents)
- [Subscription API](https://stripe.com/docs/api/subscriptions)
- [Webhook Signature Verification](https://stripe.com/docs/webhooks/signatures)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
