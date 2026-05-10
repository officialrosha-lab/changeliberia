# Admin Portal API Documentation

## Overview

The Change Liberia Admin API provides comprehensive endpoints for managing Stripe payments and Facebook integration. All endpoints are protected with JWT authentication and require admin role authorization.

**Base URL:** `http://localhost:4000/api/v1` (development) or `https://api.changelib.org/api/v1` (production)

**Authentication:** JWT Bearer Token  
**Authorization:** `UserRole.ADMIN` required for all endpoints

---

## Authentication

### Getting an Admin Token

First, authenticate with admin credentials:

```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phoneOrEmail": "+231770000001",
    "password": "your-admin-password"
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_123",
    "fullName": "Satta K. Doe",
    "email": "satta@example.com",
    "role": "ADMIN"
  }
}
```

### Using the Token

Include the token in all subsequent requests:

```bash
curl -X GET http://localhost:4000/api/v1/admin/stripe/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

---

## Stripe Admin Endpoints

All Stripe endpoints return payment data filtered by the specified date ranges or pagination parameters.

### GET /admin/stripe/dashboard

Get an overview of Stripe payment metrics for the admin dashboard.

**Query Parameters:** None

**Response:**
```json
{
  "totalRevenue": 125750.50,
  "activeSubscriptions": 342,
  "refundCount": 23,
  "refundRate": 0.018,
  "totalRefunded": 2260.00,
  "lastUpdated": "2026-05-10T14:25:00Z"
}
```

**Example:**
```bash
curl -X GET http://localhost:4000/api/v1/admin/stripe/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

### GET /admin/stripe/payments

Retrieve a list of payments with optional filtering by date range.

**Query Parameters:**
- `days` (optional, default: "30"): Filter payments from the last N days. Options: "7", "30", "90", "all"

**Response:**
```json
{
  "payments": [
    {
      "id": "payment_123",
      "userId": "user_456",
      "amount": 5000.00,
      "status": "COMPLETED",
      "description": "Petition promotion package",
      "createdAt": "2026-05-10T10:30:00Z",
      "updatedAt": "2026-05-10T10:35:00Z"
    }
  ],
  "count": 1,
  "total": 5000.00
}
```

**Example:**
```bash
# Get payments from last 30 days
curl -X GET "http://localhost:4000/api/v1/admin/stripe/payments?days=30" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Get all payments
curl -X GET "http://localhost:4000/api/v1/admin/stripe/payments?days=all" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

### GET /admin/stripe/payments/:id

Retrieve details for a specific payment, including Stripe API data.

**Path Parameters:**
- `id` (required): Payment ID (format: `payment_*`)

**Response:**
```json
{
  "payment": {
    "id": "payment_123",
    "userId": "user_456",
    "amount": 5000.00,
    "currency": "USD",
    "status": "COMPLETED",
    "description": "Petition promotion package",
    "stripeId": "pi_1234567890",
    "stripeStatus": "succeeded",
    "stripePaymentMethod": "card_1234567890",
    "createdAt": "2026-05-10T10:30:00Z",
    "updatedAt": "2026-05-10T10:35:00Z",
    "stripeData": {
      "id": "pi_1234567890",
      "object": "payment_intent",
      "amount": 500000,
      "currency": "usd",
      "status": "succeeded",
      "client_secret": "pi_...secret",
      "confirmation_method": "automatic"
    }
  }
}
```

**Example:**
```bash
curl -X GET http://localhost:4000/api/v1/admin/stripe/payments/payment_123 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

### GET /admin/stripe/subscriptions

List all Stripe subscriptions, filtered by status.

**Query Parameters:**
- `status` (optional): Filter by "ACTIVE" or "CANCELLED"

**Response:**
```json
{
  "subscriptions": [
    {
      "id": "sub_123",
      "userId": "user_456",
      "status": "ACTIVE",
      "amount": 2500.00,
      "interval": "monthly",
      "intervalCount": 1,
      "renewalDate": "2026-06-10T10:30:00Z",
      "cancelledAt": null,
      "createdAt": "2026-04-10T10:30:00Z",
      "updatedAt": "2026-05-10T10:30:00Z"
    }
  ],
  "count": 1
}
```

**Example:**
```bash
# Get all subscriptions
curl -X GET http://localhost:4000/api/v1/admin/stripe/subscriptions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Get active subscriptions only
curl -X GET "http://localhost:4000/api/v1/admin/stripe/subscriptions?status=ACTIVE" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

### PATCH /admin/stripe/subscriptions/:id/cancel

Cancel a specific subscription.

**Path Parameters:**
- `id` (required): Subscription ID (format: `sub_*`)

**Request Body:**
```json
{
  "reason": "User requested cancellation"
}
```

**Response:**
```json
{
  "success": true,
  "subscription": {
    "id": "sub_123",
    "status": "CANCELLED",
    "cancelledAt": "2026-05-10T14:25:00Z",
    "reason": "User requested cancellation"
  }
}
```

**Example:**
```bash
curl -X PATCH http://localhost:4000/api/v1/admin/stripe/subscriptions/sub_123/cancel \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "User requested cancellation"
  }'
```

---

### GET /admin/stripe/refunds

List refunds with optional date filtering.

**Query Parameters:**
- `days` (optional, default: "30"): Filter refunds from the last N days. Options: "7", "30", "90", "all"

**Response:**
```json
{
  "refunds": [
    {
      "id": "refund_123",
      "paymentId": "payment_456",
      "userId": "user_789",
      "amount": 5000.00,
      "reason": "User requested full refund",
      "status": "COMPLETED",
      "stripeRefundId": "re_1234567890",
      "createdAt": "2026-05-10T13:00:00Z",
      "processedAt": "2026-05-10T13:15:00Z"
    }
  ],
  "count": 1,
  "totalRefunded": 5000.00
}
```

**Example:**
```bash
curl -X GET "http://localhost:4000/api/v1/admin/stripe/refunds?days=7" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

### POST /admin/stripe/refunds

Create a new refund for a payment.

**Request Body:**
```json
{
  "paymentId": "payment_123",
  "amount": 2500.00,
  "reason": "Partial refund - service issue"
}
```

**Response:**
```json
{
  "success": true,
  "refund": {
    "id": "refund_124",
    "paymentId": "payment_123",
    "amount": 2500.00,
    "reason": "Partial refund - service issue",
    "status": "PROCESSING",
    "createdAt": "2026-05-10T14:30:00Z"
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:4000/api/v1/admin/stripe/refunds \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentId": "payment_123",
    "amount": 2500.00,
    "reason": "Partial refund - service issue"
  }'
```

---

### GET /admin/stripe/analytics

Get revenue analytics and trends over the past 30 days.

**Query Parameters:** None

**Response:**
```json
{
  "mrr": {
    "value": 45000.00,
    "trend": 12.5,
    "trendDirection": "UP"
  },
  "revenue30Day": [
    {
      "date": "2026-04-10",
      "revenue": 1200.00,
      "transactionCount": 4
    }
  ],
  "dailyBreakdown": [
    {
      "date": "2026-05-10",
      "amount": 3500.00,
      "count": 7
    }
  ],
  "avgTransactionValue": 500.00,
  "totalTransactions": 90
}
```

**Example:**
```bash
curl -X GET http://localhost:4000/api/v1/admin/stripe/analytics \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

### GET /admin/stripe/webhooks/health

Check the health status of Stripe webhooks over the last 24 hours.

**Query Parameters:** None

**Response:**
```json
{
  "webhookStatus": "healthy",
  "lastEvent": {
    "id": "evt_1234567890",
    "type": "payment_intent.succeeded",
    "receivedAt": "2026-05-10T14:00:00Z"
  },
  "event24hCount": 127,
  "failureCount": 0,
  "successRate": 1.0
}
```

**Example:**
```bash
curl -X GET http://localhost:4000/api/v1/admin/stripe/webhooks/health \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

### GET /admin/stripe/customers/:userId

Get payment history for a specific user.

**Path Parameters:**
- `userId` (required): User ID (format: `user_*`)

**Response:**
```json
{
  "user": {
    "id": "user_456",
    "fullName": "John Doe",
    "email": "john@example.com"
  },
  "payments": [
    {
      "id": "payment_123",
      "amount": 5000.00,
      "status": "COMPLETED",
      "description": "Petition promotion",
      "createdAt": "2026-05-10T10:30:00Z"
    }
  ],
  "totalSpent": 12500.00,
  "transactionCount": 3,
  "averageTransaction": 4166.67
}
```

**Example:**
```bash
curl -X GET http://localhost:4000/api/v1/admin/stripe/customers/user_456 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

## Facebook Admin Endpoints

All Facebook endpoints provide insights into Facebook integration performance, pixel tracking, and engagement metrics.

### GET /admin/facebook/dashboard

Get an overview of Facebook integration metrics.

**Query Parameters:** None

**Response:**
```json
{
  "pixelEventsCount": 15234,
  "totalReach": 45632,
  "activeBadges": 8,
  "activeChallenges": 3,
  "lastUpdated": "2026-05-10T14:25:00Z"
}
```

**Example:**
```bash
curl -X GET http://localhost:4000/api/v1/admin/facebook/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

### GET /admin/facebook/pixel-events

Retrieve Facebook pixel events with optional filtering.

**Query Parameters:**
- `eventType` (optional): Filter by event type (e.g., "ViewContent", "AddToCart", "Purchase")
- `days` (optional, default: "7"): Filter events from the last N days

**Response:**
```json
{
  "events": [
    {
      "id": "evt_pixel_123",
      "eventId": "pix_evt_456",
      "eventType": "ViewContent",
      "userId": "user_789",
      "properties": {
        "content_name": "Petition Page",
        "content_type": "page",
        "value": 0
      },
      "createdAt": "2026-05-10T14:20:00Z"
    }
  ],
  "count": 156,
  "breakdown": {
    "ViewContent": 89,
    "AddToCart": 34,
    "Purchase": 12,
    "Other": 21
  }
}
```

**Example:**
```bash
# Get all pixel events from last 7 days
curl -X GET http://localhost:4000/api/v1/admin/facebook/pixel-events \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Get specific event type
curl -X GET "http://localhost:4000/api/v1/admin/facebook/pixel-events?eventType=Purchase&days=30" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

### GET /admin/facebook/share-links

Get performance metrics for all share links.

**Query Parameters:** None

**Response:**
```json
{
  "shareLinks": [
    {
      "id": "link_123",
      "url": "https://changelib.org/p/petition-abc123",
      "reach": 1250,
      "clicks": 340,
      "conversions": 45,
      "conversionRate": 0.1324,
      "createdAt": "2026-05-01T10:00:00Z"
    }
  ],
  "count": 12,
  "totalReach": 45632,
  "totalConversions": 2341
}
```

**Example:**
```bash
curl -X GET http://localhost:4000/api/v1/admin/facebook/share-links \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

### GET /admin/facebook/pixel-config

Get current Facebook pixel configuration status.

**Query Parameters:** None

**Response:**
```json
{
  "pixelId": "123456789012345",
  "apiVersion": "v18.0",
  "isConfigured": true,
  "testEventStatus": "active",
  "lastTestEvent": "2026-05-10T14:15:00Z"
}
```

**Example:**
```bash
curl -X GET http://localhost:4000/api/v1/admin/facebook/pixel-config \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

### PATCH /admin/facebook/pixel-config

Update Facebook pixel configuration.

**Request Body:**
```json
{
  "pixelId": "123456789012345",
  "apiVersion": "v18.0"
}
```

**Response:**
```json
{
  "success": true,
  "config": {
    "pixelId": "123456789012345",
    "apiVersion": "v18.0",
    "updatedAt": "2026-05-10T14:30:00Z"
  }
}
```

**Example:**
```bash
curl -X PATCH http://localhost:4000/api/v1/admin/facebook/pixel-config \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pixelId": "123456789012345",
    "apiVersion": "v18.0"
  }'
```

---

### POST /admin/facebook/pixel/test-event

Send a test event to Facebook pixel for verification.

**Request Body:**
```json
{
  "eventName": "ViewContent",
  "userData": {
    "em": "test@example.com",
    "ph": "+231771234567"
  }
}
```

**Response:**
```json
{
  "success": true,
  "testEvent": {
    "id": "test_evt_123",
    "eventName": "ViewContent",
    "sentAt": "2026-05-10T14:35:00Z",
    "pixelId": "123456789012345"
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:4000/api/v1/admin/facebook/pixel/test-event \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eventName": "ViewContent",
    "userData": {
      "em": "test@example.com",
      "ph": "+231771234567"
    }
  }'
```

---

### GET /admin/facebook/badges

Get social engagement badge statistics.

**Query Parameters:** None

**Response:**
```json
{
  "badges": [
    {
      "badgeType": "FIRST_PETITION",
      "displayName": "First Petitioner",
      "totalUnlocked": 342,
      "recentUnlocks": 12,
      "description": "User created their first petition"
    }
  ],
  "count": 8,
  "totalBadges": 2847
}
```

**Example:**
```bash
curl -X GET http://localhost:4000/api/v1/admin/facebook/badges \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

### GET /admin/facebook/badges/:type/stats

Get detailed statistics for a specific badge type.

**Path Parameters:**
- `type` (required): Badge type (e.g., "FIRST_PETITION", "INFLUENCER")

**Response:**
```json
{
  "badgeType": "FIRST_PETITION",
  "displayName": "First Petitioner",
  "totalUnlocked": 342,
  "recentUnlocks": [
    {
      "userId": "user_123",
      "fullName": "John Doe",
      "earnedAt": "2026-05-10T13:45:00Z"
    }
  ],
  "unlocksLast7Days": 18,
  "unlocksLast30Days": 67
}
```

**Example:**
```bash
curl -X GET http://localhost:4000/api/v1/admin/facebook/badges/FIRST_PETITION/stats \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

### GET /admin/facebook/challenges

Get all active challenges with participation metrics.

**Query Parameters:**
- `status` (optional): Filter by status ("ACTIVE", "COMPLETED", "ARCHIVED")

**Response:**
```json
{
  "challenges": [
    {
      "id": "challenge_123",
      "title": "Share Your Change",
      "description": "Share a petition and get 100 supporters",
      "status": "ACTIVE",
      "totalMembers": 450,
      "completionCount": 123,
      "completionRate": 0.2733,
      "createdAt": "2026-05-01T00:00:00Z"
    }
  ],
  "count": 3
}
```

**Example:**
```bash
curl -X GET http://localhost:4000/api/v1/admin/facebook/challenges \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Get active challenges only
curl -X GET "http://localhost:4000/api/v1/admin/facebook/challenges?status=ACTIVE" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

### GET /admin/facebook/challenges/:id

Get detailed information about a specific challenge.

**Path Parameters:**
- `id` (required): Challenge ID (format: `challenge_*`)

**Response:**
```json
{
  "challenge": {
    "id": "challenge_123",
    "title": "Share Your Change",
    "description": "Share a petition and get 100 supporters",
    "status": "ACTIVE",
    "totalMembers": 450,
    "completionCount": 123,
    "completionRate": 0.2733,
    "members": [
      {
        "userId": "user_456",
        "fullName": "Jane Smith",
        "joinedAt": "2026-05-05T10:30:00Z",
        "participationStatus": "COMPLETED"
      }
    ],
    "createdAt": "2026-05-01T00:00:00Z",
    "endsAt": "2026-06-01T00:00:00Z"
  }
}
```

**Example:**
```bash
curl -X GET http://localhost:4000/api/v1/admin/facebook/challenges/challenge_123 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

### GET /admin/facebook/analytics

Get 30-day Facebook engagement analytics and trends.

**Query Parameters:** None

**Response:**
```json
{
  "period": "30_days",
  "metrics": {
    "totalPixelEvents": 15234,
    "uniqueUsers": 4567,
    "totalReach": 45632,
    "totalConversions": 2341,
    "conversionRate": 0.0513
  },
  "trends": [
    {
      "date": "2026-04-10",
      "pixelEvents": 487,
      "reach": 1230,
      "conversions": 67
    }
  ],
  "topEventTypes": [
    {
      "eventType": "ViewContent",
      "count": 8932,
      "percentage": 0.5865
    }
  ]
}
```

**Example:**
```bash
curl -X GET http://localhost:4000/api/v1/admin/facebook/analytics \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

## Error Responses

All endpoints return standard error responses:

### 401 Unauthorized
```json
{
  "message": "Unauthorized",
  "statusCode": 401
}
```

**Cause:** Missing or invalid JWT token

### 403 Forbidden
```json
{
  "message": "Forbidden",
  "statusCode": 403
}
```

**Cause:** User is not an admin

### 404 Not Found
```json
{
  "message": "Resource not found",
  "statusCode": 404
}
```

**Cause:** The requested resource doesn't exist

### 400 Bad Request
```json
{
  "message": "Validation failed",
  "statusCode": 400,
  "errors": [
    {
      "field": "amount",
      "message": "Amount must be positive"
    }
  ]
}
```

**Cause:** Invalid request parameters

### 500 Internal Server Error
```json
{
  "message": "Internal server error",
  "statusCode": 500
}
```

**Cause:** Unexpected server error

---

## Rate Limiting

All endpoints are subject to rate limiting:

- **Default:** 100 requests per minute per admin user
- **Stripe endpoints:** 150 requests per minute
- **Facebook endpoints:** 120 requests per minute

When rate limited, responses include:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1620000000
```

HTTP Status: `429 Too Many Requests`

---

## Pagination

Endpoints that return lists support pagination via query parameters:

- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20, max: 100): Items per page
- `sort` (optional, default: "-createdAt"): Sort field

Example:
```bash
curl -X GET "http://localhost:4000/api/v1/admin/stripe/payments?page=2&limit=50&sort=-amount" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Webhook Events

### Stripe Webhook Events

The system automatically processes the following Stripe webhook events:

- `payment_intent.succeeded` - Payment completed
- `payment_intent.payment_failed` - Payment failed
- `charge.refunded` - Refund processed
- `customer.subscription.created` - Subscription created
- `customer.subscription.deleted` - Subscription cancelled

### Facebook Webhook Events

Facebook pixel events are automatically tracked and stored when:

- Users view petition pages (`ViewContent`)
- Users sign petitions (`Purchase`)
- Users share petitions (`Share`)

---

## Best Practices

1. **Always use HTTPS in production** - Never send tokens over unencrypted connections
2. **Store tokens securely** - Use secure storage like httpOnly cookies
3. **Implement token refresh** - Refresh tokens before expiration
4. **Monitor rate limits** - Check `X-RateLimit-*` headers and implement backoff
5. **Use pagination** - Don't fetch all records at once, use pagination
6. **Filter by date range** - Use `days` parameter to reduce query scope
7. **Implement error handling** - Handle 401, 403, and 429 errors gracefully
8. **Log all admin actions** - Maintain an audit trail of administrative changes
9. **Validate inputs** - Validate all request parameters client-side before sending
10. **Cache responses** - Cache frequently accessed data to reduce API calls

---

## Support

For technical support or API issues:

- **Email:** api-support@changelib.org
- **Slack:** #admin-api-support
- **Documentation:** https://docs.changelib.org/admin-api
- **Status Page:** https://status.changelib.org

---

**Last Updated:** May 10, 2026  
**API Version:** 1.0.0  
**Endpoint Count:** 23 total (12 Stripe + 11 Facebook)
