# Phase 2: Advanced Communication Features - Implementation Plan

## Overview

Phase 2 builds on Phase 1's solid messaging infrastructure to add email notifications, analytics, preferences, threading, and scheduling capabilities.

## Phase 2 Structure: 3 Sub-Phases

### Phase 2A: Email Notifications Foundation (THIS PHASE)
**Objective**: Enable email notifications when messages are sent and broadcasts are delivered
**Tasks**: 4
**Expected Duration**: 2-3 hours
**Priority**: 🔴 CRITICAL - Foundation for all communication

### Phase 2B: Admin Dashboard & Analytics
**Objective**: Give admins visibility into message delivery, engagement, and campaign performance
**Tasks**: 3-4
**Expected Duration**: 3-4 hours
**Priority**: 🟡 HIGH - Business intelligence

### Phase 2C: User Experience Enhancements
**Objective**: Give users control over notifications and enable advanced messaging features
**Tasks**: 4-5
**Expected Duration**: 4-5 hours
**Priority**: 🟡 HIGH - User control

---

## Phase 2A: Email Notifications (CURRENT)

### Architecture
```
Backend Event System (Phase 1)
├── message.created event
│   ├── Emitted by: MessagesService.createMessage()
│   └── Payload: { messageId, senderId, recipientId, subject, content }
│
└── broadcast.sent event
    ├── Emitted by: BroadcastService.broadcastToGroup()
    └── Payload: { broadcastId, groupId, recipientCount, successCount }

Email Event Listeners (Phase 2A)
├── MessageEmailListener
│   ├── Triggers on: message.created
│   └── Action: Send individual message notification
│
└── BroadcastEmailListener
    ├── Triggers on: broadcast.sent
    └── Action: Send batch broadcast notification (if enabled in preferences)
```

### Task Breakdown

#### Task 1: Create Email Event Listeners
**Goal**: Implement NestJS event handlers that listen for message/broadcast events

**Files to Create/Modify**:
- `apps/api/src/email/listeners/message-email.listener.ts` (NEW)
- `apps/api/src/email/listeners/broadcast-email.listener.ts` (NEW)
- `apps/api/src/email/email.module.ts` (MODIFY - register listeners)

**Implementation Details**:
```typescript
// MessageEmailListener
@EventListener()
handle(event: MessageCreatedEvent) {
  - Get recipient user details
  - Get sender user details
  - Prepare email data
  - Call EmailService.sendMessageNotification()
  - Log result
}

// BroadcastEmailListener
@EventListener()
handle(event: BroadcastSentEvent) {
  - Get sender user details
  - Prepare email data with stats
  - Call EmailService.sendBroadcastNotification()
  - Log result
}
```

#### Task 2: Create Email Templates
**Goal**: Design email templates for message and broadcast notifications

**Files to Create/Modify**:
- `apps/api/src/email/templates/message-notification.hbs` (NEW)
- `apps/api/src/email/templates/broadcast-notification.hbs` (NEW)
- `apps/api/src/email/services/email-template.service.ts` (MODIFY - add new template types)

**Template Design**:
```
Message Notification:
- Header: "New Message from [Sender Name]"
- Subject line
- Message preview (first 200 chars)
- "View Full Message" button linking to app
- Footer with preferences link

Broadcast Notification:
- Header: "[Admin Name] sent a broadcast message"
- Subject line
- Message preview
- Delivery stats (X of Y recipients received)
- "View in App" button
- Footer with unsubscribe option
```

#### Task 3: Implement Email Sending Logic
**Goal**: Add methods to EmailService to send notification emails

**Files to Modify**:
- `apps/api/src/email/services/email.service.ts`

**Methods to Add**:
```typescript
sendMessageNotification(to, subject, senderName, messagePreview, messageUrl)
sendBroadcastNotification(to, subject, senderName, messagePreview, stats, broadcastUrl)
```

**Resend Integration**:
- Use Resend API (already configured)
- Use HTML email templates (from email-template.service)
- Include unsubscribe headers
- Handle bounce/delivery tracking

#### Task 4: Testing Email Notifications
**Goal**: Verify email events trigger properly and emails send

**Manual Testing**:
1. Start dev server
2. Create message in database/API
3. Verify event emitted
4. Verify email listener triggered
5. Verify email sent via Resend
6. Check email content in Resend dashboard

**Automated Tests**:
- Unit tests for event handlers
- Mock Resend API calls
- Test event emission
- Test error handling

---

## Phase 2B: Admin Dashboard (Next Phase)

### Overview
Provide admins with real-time analytics and insights into communication campaigns

### Tasks
1. **Message Analytics Dashboard**
   - Total messages sent (this month/all time)
   - Message delivery status
   - Group-wise message counts
   - Read vs unread statistics

2. **Broadcast Performance Tracking**
   - Active broadcasts
   - Delivery rates
   - Engagement metrics
   - Historical broadcast archive

3. **Admin Dashboard Page**
   - React component with charts (recharts)
   - Real-time stats updates
   - Date range filtering
   - Export to CSV functionality

4. **Analytics Endpoints**
   - GET /admin/analytics/messages - Message stats
   - GET /admin/analytics/broadcasts - Broadcast stats
   - GET /admin/analytics/engagement - Engagement metrics

---

## Phase 2C: User Experience Enhancements (Future Phase)

### Task 1: Notification Preferences
**Goal**: Let users control email notifications

**Database Schema**:
```prisma
model NotificationPreference {
  id String @id
  userId String @unique
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Message notifications
  receiveMessageEmails Boolean @default(true)
  receiveMessageDigest Boolean @default(true)
  digestFrequency String @default("daily") // daily, weekly, never
  
  // Broadcast notifications
  receiveBroadcastEmails Boolean @default(true)
  mutedGroups String[] @default([]) // groupIds to mute
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Endpoints**:
- GET /users/notification-preferences - Get user preferences
- PUT /users/notification-preferences - Update preferences
- POST /users/notification-preferences/mute-group/:groupId - Mute group
- DELETE /users/notification-preferences/mute-group/:groupId - Unmute

**Frontend Component**:
- `NotificationPreferences.tsx` - User settings page

### Task 2: Message Threading
**Goal**: Enable replies and conversations

**Schema Changes**:
```prisma
model Message {
  // ... existing fields
  replyToId String? // Reference to original message
  replyTo Message? @relation("MessageReplies", fields: [replyToId], references: [id])
  replies Message[] @relation("MessageReplies")
  conversationId String? // Group related messages
}
```

**Endpoints**:
- POST /messages/:id/reply - Send reply
- GET /messages/:id/thread - Get full conversation thread
- GET /messages/:id/replies - Get replies to message

### Task 3: Scheduled Messages
**Goal**: Send messages at future times

**Schema Changes**:
```prisma
model ScheduledMessage {
  id String @id
  createdBy String
  subject String
  content String
  groupId String
  scheduledFor DateTime
  sent Boolean @default(false)
  sentAt DateTime?
}
```

**Scheduler**:
- Check scheduled messages every minute
- Send ready messages
- Update sent status

### Task 4: Rich Text Messages
**Goal**: Support markdown and basic HTML formatting

**Frontend**:
- Rich text editor component (markdown)
- Preview mode

**Backend**:
- Sanitize HTML input
- Validate markdown
- Render in email templates

### Task 5: Message Attachments
**Goal**: Allow file uploads with messages

**Schema**:
```prisma
model MessageAttachment {
  id String @id
  messageId String
  message Message @relation(fields: [messageId], references: [id], onDelete: Cascade)
  fileUrl String
  fileName String
  fileSize Int
  mimeType String
}
```

---

## Technology Decisions

### Email Handling
- **Provider**: Resend (already configured)
- **Pattern**: Event-driven listeners
- **Queue**: BullMQ (for production, local: synchronous)
- **Retry**: 3 attempts with exponential backoff

### Templates
- **Format**: Handlebars (`.hbs` files)
- **Styling**: Inline CSS for email compatibility
- **Variables**: Passed from listeners to service

### Analytics
- **Charts**: Recharts library (React component library)
- **Real-time**: Server-Sent Events (SSE) or polling
- **Storage**: Aggregate queries on Prisma

---

## Success Criteria for Phase 2A

✅ Email event listeners created and registered
✅ Email templates designed with proper styling
✅ EmailService methods send emails via Resend
✅ Events properly emitted on message/broadcast creation
✅ Emails contain correct recipient, subject, and content
✅ Links in emails direct to correct app URLs
✅ Unsubscribe headers included in emails
✅ Error handling for failed email sends
✅ Logging for debugging and monitoring

---

## Files To Create (Phase 2A)

```
apps/api/src/email/
├── listeners/
│   ├── message-email.listener.ts (NEW)
│   └── broadcast-email.listener.ts (NEW)
├── templates/
│   ├── message-notification.hbs (NEW)
│   └── broadcast-notification.hbs (NEW)
└── services/
    └── email.service.ts (MODIFY)
```

---

## Integration Points

### With Phase 1
- Uses existing event system (EventEmitter2)
- Listens to message.created and broadcast.sent events
- Gets user/group data via Prisma
- Uses existing Resend configuration

### With Future Phases
- Preferences system will check before sending emails
- Message threading will maintain existing message structure
- Scheduled messages use same email templates

---

## Estimated Effort

| Phase | Tasks | Hours | Status |
|-------|-------|-------|--------|
| **2A: Email Notifications** | 4 | 2-3 | 🔴 Starting |
| **2B: Analytics Dashboard** | 3 | 3-4 | ⚪ Not started |
| **2C: Advanced Features** | 5 | 4-5 | ⚪ Not started |
| **TOTAL Phase 2** | 12 | 9-12 | 🔴 In Progress |

---

## Starting Phase 2A Now

Beginning with Task 1: Creating email event listeners...
