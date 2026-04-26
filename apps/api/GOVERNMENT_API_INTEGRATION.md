# Government API Integration Guide

## Overview

The Government API enables petition creators to submit their petitions to government bodies and track the status of submissions. This system is designed to bridge the gap between citizen activism and government responsiveness in Liberia.

**Base URL**: `http://localhost:3000/api/government`

---

## Key Features

- ✅ **Petition Submission**: Submit petitions to government/NGO contacts with PDF reports
- ✅ **Status Tracking**: Track submission status and government responses
- ✅ **PDF Reports**: Generate comprehensive reports with signatures and analytics
- ✅ **Government Contacts**: Manage and retrieve government contact information
- ✅ **Email Notifications**: Automatic email delivery of petitions to contacts
- ✅ **Admin Dashboard**: Monitor all submissions and update statuses

---

## Authentication

### JWT Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:

```bash
Authorization: Bearer <your_jwt_token>
```

### Public Endpoints
The following endpoints do not require authentication:
- `GET /government/status/:petitionId`
- `GET /government/report/:petitionId`
- `GET /government/contacts`

### Admin Endpoints
Endpoints marked as **ADMIN ONLY** require:
- Valid JWT token
- User role must be `ADMIN`

---

## API Endpoints

### 1. Submit a Petition to Government

**Endpoint**: `POST /government/submit`

**Authentication**: Required (JWT)

**Requirements**:
- Petition must have **at least 1000 signatures**
- User must own the petition or be an admin

**Request Body**:
```json
{
  "petitionId": "uuid-here",
  "governmentEmail": "minister@liberia.gov.lr",
  "notes": "Optional additional context for government"
}
```

**Response Success (200)**:
```json
{
  "success": true,
  "message": "Petition submitted successfully",
  "submission": {
    "id": "submission-uuid",
    "petitionId": "petition-uuid",
    "governmentEmail": "minister@liberia.gov.lr",
    "status": "SUBMITTED",
    "submittedAt": "2026-04-17T10:30:00Z",
    "updatedAt": "2026-04-17T10:30:00Z",
    "notes": "Optional notes",
    "documentUrl": "https://changelib.org/documents/petition-abc123.pdf"
  }
}
```

**Error Response (400)**:
```json
{
  "statusCode": 400,
  "message": "Petition must have at least 1000 signatures to submit to government",
  "error": "Bad Request"
}
```

**Use Cases**:
- Petition creator submits approved petition to government agency
- Creator provides context about their campaign in notes field
- System automatically generates PDF and sends to government email

---

### 2. Get Petition Status

**Endpoint**: `GET /government/status/:petitionId`

**Authentication**: Optional (provides more details if authenticated)

**Parameters**:
- `petitionId` (path): UUID of the petition

**Response - Not Submitted (200)**:
```json
{
  "petitionId": "petition-uuid",
  "submitted": false,
  "status": "NOT_SUBMITTED",
  "message": "This petition has not been submitted yet"
}
```

**Response - Submitted (200)**:
```json
{
  "petitionId": "petition-uuid",
  "submitted": true,
  "status": "UNDER_REVIEW",
  "submittedAt": "2026-04-17T10:30:00Z",
  "updatedAt": "2026-04-17T14:45:00Z",
  "submissions": [
    {
      "id": "submission-uuid",
      "governmentEmail": "minister@liberia.gov.lr",
      "status": "UNDER_REVIEW",
      "submittedAt": "2026-04-17T10:30:00Z",
      "updatedAt": "2026-04-17T14:45:00Z"
    }
  ]
}
```

**Use Cases**:
- Check if petition has been submitted
- View all submissions for a petition
- Track government response timeline

---

### 3. Get Petition Report

**Endpoint**: `GET /government/report/:petitionId`

**Authentication**: Not required

**Parameters**:
- `petitionId` (path): UUID of the petition

**Response**: 
- Returns PDF file as binary data
- Sets headers:
  - `Content-Type: application/pdf`
  - `Content-Disposition: attachment; filename="petition-{petitionId}.pdf"`

**PDF Report Contents**:
- Petition title and description
- Creator information
- Current signature count and progress to goal
- Daily signature trend chart (HTML)
- Milestone achievements and dates
- List of top 50 signatures
- Government submission notes

**Use Cases**:
- Download comprehensive petition report
- Share petition evidence with government
- Print physical copy for documentation
- Email to government contacts

---

### 4. Get My Submissions

**Endpoint**: `GET /government/submissions`

**Authentication**: Required (JWT)

**Response (200)**:
```json
{
  "success": true,
  "count": 3,
  "submissions": [
    {
      "id": "submission-uuid-1",
      "petitionId": "petition-uuid-1",
      "petitionTitle": "Fix Freetown Road",
      "governmentEmail": "minister@liberia.gov.lr",
      "status": "ACKNOWLEDGED",
      "submittedAt": "2026-04-15T09:00:00Z",
      "updatedAt": "2026-04-17T11:00:00Z"
    },
    {
      "id": "submission-uuid-2",
      "petitionId": "petition-uuid-2",
      "petitionTitle": "Improve Healthcare",
      "governmentEmail": "health@liberia.gov.lr",
      "status": "SUBMITTED",
      "submittedAt": "2026-04-17T10:30:00Z",
      "updatedAt": "2026-04-17T10:30:00Z"
    }
  ]
}
```

**Use Cases**:
- Users see all their submitted petitions
- Track multiple submissions in one view
- Quick status check dashboard

---

### 5. Get Government Contacts

**Endpoint**: `GET /government/contacts`

**Authentication**: Not required

**Query Parameters** (optional):
- `category`: Filter by contact category (e.g., "MINISTRY", "NGO", "PARLIAMENT")
- `region`: Filter by region (e.g., "MONTSERRADO", "BONG")

**Response (200)**:
```json
{
  "success": true,
  "count": 15,
  "contacts": [
    {
      "id": "contact-uuid-1",
      "name": "Hon. Minister of Public Works",
      "email": "minister.works@liberia.gov.lr",
      "phone": "+231-777-123456",
      "category": "MINISTRY",
      "region": "MONTSERRADO",
      "priority": 1,
      "description": "Responsible for road infrastructure"
    },
    {
      "id": "contact-uuid-2",
      "name": "National Health Director",
      "email": "director@liberia-health.gov.lr",
      "phone": "+231-777-987654",
      "category": "MINISTRY",
      "region": "MONTSERRADO",
      "priority": 2
    }
  ]
}
```

**Use Cases**:
- Users browse available government contacts for submission
- Frontend filters contacts by category or region
- Display contact information for verification

---

### 6. Create Government Contact (ADMIN ONLY)

**Endpoint**: `POST /government/contacts`

**Authentication**: Required (JWT) + Admin Role

**Request Body**:
```json
{
  "name": "New Government Minister",
  "email": "new.minister@liberia.gov.lr",
  "phone": "+231-777-999999",
  "category": "MINISTRY",
  "region": "BONG",
  "priority": 3
}
```

**Response Success (201)**:
```json
{
  "success": true,
  "message": "Government contact created",
  "contact": {
    "id": "contact-uuid",
    "name": "New Government Minister",
    "email": "new.minister@liberia.gov.lr",
    "phone": "+231-777-999999",
    "category": "MINISTRY",
    "region": "BONG",
    "priority": 3,
    "createdAt": "2026-04-17T15:00:00Z"
  }
}
```

**Use Cases**:
- Add new government officials to submission targets
- Update contact information when officials change
- Maintain contact database

---

### 7. Update Submission Status (ADMIN ONLY)

**Endpoint**: `POST /government/status/:petitionId`

**Authentication**: Required (JWT) + Admin Role

**Parameters**:
- `petitionId` (path): UUID of the petition

**Request Body**:
```json
{
  "status": "ACKNOWLEDGED"
}
```

**Valid Statuses**:
- `SUBMITTED` - Initial submission
- `ACKNOWLEDGED` - Government acknowledged receipt
- `UNDER_REVIEW` - Being reviewed by government
- `APPROVED` - Request approved
- `REJECTED` - Request rejected

**Response Success (200)**:
```json
{
  "success": true,
  "message": "Status updated successfully",
  "submission": {
    "id": "submission-uuid",
    "petitionId": "petition-uuid",
    "status": "ACKNOWLEDGED",
    "submittedAt": "2026-04-17T10:30:00Z",
    "updatedAt": "2026-04-17T15:30:00Z"
  }
}
```

**Error Response (400)**:
```json
{
  "statusCode": 400,
  "message": "Invalid status: INVALID_STATUS",
  "error": "Bad Request"
}
```

**Use Cases**:
- Admins log government acknowledgments
- Track petition progress through review process
- Update users on government status

---

### 8. Get Submission Statistics (ADMIN ONLY)

**Endpoint**: `GET /government/stats`

**Authentication**: Required (JWT) + Admin Role

**Response (200)**:
```json
{
  "success": true,
  "stats": {
    "totalSubmissions": 42,
    "byStatus": {
      "SUBMITTED": 15,
      "ACKNOWLEDGED": 12,
      "UNDER_REVIEW": 10,
      "APPROVED": 3,
      "REJECTED": 2
    },
    "byMinistry": {
      "Public Works": 18,
      "Health": 12,
      "Education": 8,
      "Others": 4
    },
    "averageDaysToAck": 3.5,
    "successRate": 7.14
  }
}
```

**Use Cases**:
- Dashboard overview of all submissions
- Monitor government responsiveness
- Identify most active ministries

---

## Workflows

### Workflow 1: Submit a Petition to Government

```
1. User creates petition and collects 1000+ signatures
2. User clicks "Submit to Government" button
3. User selects government contact from list (GET /government/contacts)
4. Optional: User adds submission notes
5. System calls POST /government/submit
6. System generates PDF report and sends email
7. Submission status set to "SUBMITTED"
8. User receives confirmation
```

### Workflow 2: Track Government Response

```
1. User navigates to submission tracking page
2. User selects petition from "My Submissions" (GET /government/submissions)
3. User views status (GET /government/status/:petitionId)
4. Admin receives government acknowledgment email
5. Admin updates status to "ACKNOWLEDGED" (POST /government/status/:petitionId)
6. User receives notification of status change
7. Status progresses: SUBMITTED → ACKNOWLEDGED → UNDER_REVIEW → APPROVED/REJECTED
```

### Workflow 3: Download Petition Report

```
1. User navigates to petition page
2. User clicks "Download Report" button
3. System retrieves petition with signatures and milestones
4. System generates comprehensive HTML report
5. System converts to PDF buffer
6. Browser downloads PDF file
7. User can print or email to contacts
```

---

## Error Handling

### Common Errors

**1000+ Signatures Required (400)**
```json
{
  "statusCode": 400,
  "message": "Petition must have at least 1000 signatures to submit to government",
  "error": "Bad Request"
}
```
**Solution**: Petition creator needs to wait until they reach 1000 signatures.

**Petition Not Found (404)**
```json
{
  "statusCode": 404,
  "message": "Petition with ID xyz not found",
  "error": "Not Found"
}
```
**Solution**: Verify petition ID is correct and the petition exists.

**Invalid Email (400)**
```json
{
  "statusCode": 400,
  "message": "Invalid email address",
  "error": "Bad Request"
}
```
**Solution**: Provide valid email address for government contact.

**Unauthorized (401)**
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```
**Solution**: Provide valid JWT token in Authorization header.

**Forbidden - Admin Only (403)**
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```
**Solution**: Only admins can access this endpoint.

---

## Integration Examples

### JavaScript/TypeScript

```typescript
// Submit a petition
async function submitPetition(petitionId: string, email: string, token: string) {
  const response = await fetch('http://localhost:3000/api/government/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      petitionId,
      governmentEmail: email,
      notes: 'Urgent attention needed for community development',
    }),
  });

  if (!response.ok) {
    throw new Error(`Submission failed: ${response.statusText}`);
  }

  return response.json();
}

// Download petition report
async function downloadReport(petitionId: string) {
  const response = await fetch(`http://localhost:3000/api/government/report/${petitionId}`);
  const blob = await response.blob();
  
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `petition-${petitionId}.pdf`;
  a.click();
  window.URL.revokeObjectURL(url);
}

// Get petition status
async function checkStatus(petitionId: string) {
  const response = await fetch(`http://localhost:3000/api/government/status/${petitionId}`);
  return response.json();
}
```

### cURL Examples

```bash
# Submit petition
curl -X POST http://localhost:3000/api/government/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "petitionId": "petition-uuid",
    "governmentEmail": "minister@liberia.gov.lr",
    "notes": "Please review this important petition"
  }'

# Get status
curl http://localhost:3000/api/government/status/petition-uuid

# Download report
curl http://localhost:3000/api/government/report/petition-uuid \
  -o petition-report.pdf

# Get contacts
curl http://localhost:3000/api/government/contacts

# Get my submissions (requires auth)
curl http://localhost:3000/api/government/submissions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Data Models

### PetitionSubmission
```typescript
{
  id: string;                    // UUID
  petitionId: string;            // References petition
  userId: string;                // Submission creator
  governmentEmail: string;       // Target government email
  governmentContactId?: string;  // References government contact
  status: SubmissionStatus;      // SUBMITTED, ACKNOWLEDGED, UNDER_REVIEW, APPROVED, REJECTED
  submittedAt: Date;             // Submission timestamp
  updatedAt: Date;               // Last status update
  notes?: string;                // Optional context
  documentUrl?: string;          // URL to PDF report
  createdAt: Date;
}
```

### GovernmentContact
```typescript
{
  id: string;                    // UUID
  name: string;                  // Contact name
  email: string;                 // Email address
  phone?: string;                // Phone number
  category: string;              // MINISTRY, NGO, PARLIAMENT, OTHER
  region?: string;               // Liberian region
  priority: number;              // Sort order (1 = highest)
  description?: string;          // Notes about contact
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Security Considerations

1. **Authentication**: All endpoints that modify data require JWT authentication
2. **Authorization**: Admin-only endpoints check user role
3. **Validation**: Email format and required fields validated
4. **Rate Limiting**: Consider implementing rate limits for high-volume endpoints
5. **Data Privacy**: Government emails not exposed in public endpoints
6. **CORS**: Configure CORS for trusted frontend domains
7. **HTTPS**: Always use HTTPS in production

---

## Testing Checklist

- [ ] Submit petition with <1000 signatures (should fail)
- [ ] Submit petition with 1000+ signatures (should succeed)
- [ ] Check status of submitted petition
- [ ] Download PDF report and verify content
- [ ] Get all submissions as authenticated user
- [ ] Get government contacts list
- [ ] Create new government contact as admin
- [ ] Update submission status as admin
- [ ] Get statistics dashboard as admin
- [ ] Verify unauthorized access is rejected
- [ ] Test with invalid petition IDs
- [ ] Test with invalid email formats

---

## Support & Questions

For issues or questions about the Government API:
1. Check error messages and troubleshooting section
2. Verify authentication token is valid
3. Ensure petition meets submission requirements
4. Contact admin team for endpoint-specific issues

---

**Last Updated**: April 17, 2026  
**API Version**: 1.0.0  
**Status**: Production Ready
