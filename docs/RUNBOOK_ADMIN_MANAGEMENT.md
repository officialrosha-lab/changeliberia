# Admin User Management Runbook

## Purpose
Procedures for creating, updating, and managing admin users in production.

---

## Creating New Admin Users

### Method 1: Via Seed Script (Development/Initial Setup)

If deploying a fresh production instance:

```bash
cd /Users/visionalventure/Change\ Liberia/apps/api

# Run seed which creates default admin
npx prisma db seed

# This creates:
# - Email: satta@example.com
# - Phone: +231770000001
# - Name: Satta K. Doe
# - Role: ADMIN
```

**Note:** Update seed.ts before deploying to change default admin credentials.

### Method 2: Direct Database Insert

For emergency admin creation:

```bash
psql $DATABASE_URL << EOF

-- Create new admin user
INSERT INTO "User" (
  id,
  "fullName",
  phone,
  email,
  "passwordHash",
  role,
  "trustScore",
  "verificationStatus",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'Admin Name Here',
  '+231XXXXXXXXX',
  'admin@example.com',
  '\$2b\$10\$...hash...',  -- Use bcryptjs hash from below
  'ADMIN',
  70,
  'VERIFIED_LIBERIAN',
  NOW(),
  NOW()
);

-- Verify it was created
SELECT id, email, role FROM "User" WHERE email = 'admin@example.com';

EOF
```

**Generate password hash in Node.js:**
```bash
node -e "
const bcrypt = require('bcryptjs');
const password = 'temporary_password_123!';
bcrypt.hash(password, 10).then(hash => console.log(hash));
"
```

### Method 3: Via Admin API (After First Admin Exists)

Once you have one admin account logged in:

```bash
# 1. Get admin token
TOKEN=$(curl -s -X POST https://api.changeliberia.org/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phoneOrEmail": "satta@example.com",
    "password": "admin_password"
  }' | jq -r '.access_token')

# 2. Create new admin via API
curl -X POST https://api.changeliberia.org/api/v1/admin/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Admin",
    "email": "john@example.com",
    "phone": "+231777123456",
    "tempPassword": "TempPass123!"
  }'

# 3. Response:
# {
#   "id": "user_uuid",
#   "email": "john@example.com",
#   "role": "ADMIN",
#   "message": "Admin user created. Send temp password to user."
# }
```

**User receives temporary password and should:**
1. Login at https://changeliberia.org/admin
2. Go to Settings → Change Password
3. Set a new secure password

### Method 4: Via Admin Dashboard UI

Once frontend admin panel is deployed:

1. Log in as existing admin: https://changeliberia.org/admin
2. Go to "Users" tab
3. Click "Create New Admin"
4. Fill form:
   - Full Name
   - Email
   - Phone Number
   - Temporary Password
5. Click "Create"
6. System sends notification to new admin

---

## Verifying Admin User Creation

```bash
# List all admins
psql $DATABASE_URL -c "
  SELECT 
    id,
    email,
    \"fullName\",
    phone,
    role,
    \"createdAt\"
  FROM \"User\"
  WHERE role = 'ADMIN'
  ORDER BY \"createdAt\" DESC;"

# Expected output:
# | id | email | fullName | phone | role | createdAt |
# | uuid_1 | satta@example.com | Satta K. Doe | +231770000001 | ADMIN | 2026-05-27 |
# | uuid_2 | john@example.com | John Admin | +231777123456 | ADMIN | 2026-05-27 |
```

**Test admin can login:**
```bash
curl -X POST https://api.changeliberia.org/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phoneOrEmail": "john@example.com",
    "password": "admin_password"
  }'

# Expected response:
# {
#   "access_token": "eyJhbGc...",
#   "user": {
#     "id": "uuid",
#     "email": "john@example.com",
#     "fullName": "John Admin",
#     "role": "ADMIN"
#   }
# }
```

---

## Revoking Admin Access

### Immediate Revocation (User Removed/Fired)

```bash
# Immediately remove admin role
psql $DATABASE_URL -c "
  UPDATE \"User\"
  SET role = 'USER'
  WHERE email = 'compromised@example.com';"

# Verify
psql $DATABASE_URL -c "
  SELECT email, role FROM \"User\" 
  WHERE email = 'compromised@example.com';"

# User will no longer be able to access admin endpoints
# Any active tokens will continue to work until expiration
# Default JWT expiration: 7 days (configurable)
```

### Force Logout (Invalidate Tokens)

If immediate action needed and user still has valid token:

```bash
# Option 1: Update JWT_SECRET (affects all users)
# ⚠️ WARNING: This logs out EVERYONE
# In .env.production:
# JWT_SECRET="new_random_secret_key_here"
# docker restart api

# Option 2: Maintain revocation list (recommended)
# Add user ID to revocation list in Redis
redis-cli -u $REDIS_URL SET "token_revoked:${USER_ID}" 1 EX 604800
# EX 604800 = 7 days (matches JWT expiration)
```

### Audit Revoked Access

```bash
# View when user was demoted
psql $DATABASE_URL -c "
  SELECT 
    \"userId\",
    action,
    \"createdAt\",
    changes
  FROM \"AuditLog\"
  WHERE \"entityType\" = 'User'
  AND changes::text LIKE '%role%ADMIN%'
  ORDER BY \"createdAt\" DESC
  LIMIT 20;"
```

---

## Resetting Admin Password

### User-Initiated Reset

1. Admin goes to: https://changeliberia.org/auth/forgot-password
2. Enters email: john@example.com
3. Receives email with reset link
4. Clicks link and sets new password

### Force Password Reset (Security Incident)

```bash
# Generate new temporary password
TEMP_PASSWORD="TempReset$(date +%s)"

# In database: Clear password (user must reset)
psql $DATABASE_URL -c "
  UPDATE \"User\"
  SET \"passwordHash\" = NULL,
      \"updatedAt\" = NOW()
  WHERE email = 'john@example.com';"

# Send password reset email to admin
curl -X POST https://api.changeliberia.org/api/v1/auth/request-password-reset \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com"}'

# Admin receives email with reset link
# Admin must click link and set new password before next login
```

### Direct Password Update (Emergency Only)

```bash
# Generate bcrypt hash
PASSWORD_HASH=$(node -e "
  const bcrypt = require('bcryptjs');
  const password = 'NewSecurePassword123!';
  bcrypt.hashSync(password, 10);
")

# Update directly in database
psql $DATABASE_URL -c "
  UPDATE \"User\"
  SET \"passwordHash\" = '$PASSWORD_HASH',
      \"updatedAt\" = NOW()
  WHERE email = 'john@example.com';"

# ⚠️ WARNING: This bypasses normal security flows
# Only use in emergency situations
# Document in audit log why this was done
```

---

## Updating Admin Permissions

### View Current Admin Permissions

```bash
# List what admin can do
psql $DATABASE_URL -c "
  SELECT 
    p.resource,
    p.action,
    p.description
  FROM permissions p
  WHERE p.id IN (
    SELECT \"permissionId\"
    FROM roles_permissions
    WHERE role_id = (SELECT id FROM roles WHERE name = 'ADMIN')
  )
  ORDER BY p.resource, p.action;"
```

### Grant Additional Permission

```bash
# Example: Grant EMAIL permission to admin
psql $DATABASE_URL -c "
  INSERT INTO roles_permissions (\"role_id\", \"permissionId\")
  SELECT 
    r.id,
    p.id
  FROM roles r
  JOIN permissions p ON p.resource = 'EMAIL' AND p.action = 'MANAGE'
  WHERE r.name = 'ADMIN'
  ON CONFLICT DO NOTHING;"
```

### Revoke Permission

```bash
# Remove ADMIN access to FRAUD feature
psql $DATABASE_URL -c "
  DELETE FROM roles_permissions
  WHERE role_id = (
    SELECT id FROM roles WHERE name = 'ADMIN'
  )
  AND \"permissionId\" = (
    SELECT id FROM permissions 
    WHERE resource = 'FRAUD' AND action = 'READ'
  );"
```

---

## Monitoring Admin Activity

### View Admin Login History

```bash
psql $DATABASE_URL -c "
  SELECT 
    u.email,
    u.\"fullName\",
    COUNT(*) as login_count,
    MAX(al.\"createdAt\") as last_login
  FROM \"AuditLog\" al
  JOIN \"User\" u ON u.id = al.\"userId\"
  WHERE al.action IN ('LOGIN', 'TOKEN_ISSUED')
  AND u.role = 'ADMIN'
  GROUP BY u.id, u.email, u.\"fullName\"
  ORDER BY last_login DESC;"
```

### View Admin Actions (Last 24 Hours)

```bash
psql $DATABASE_URL -c "
  SELECT 
    u.email,
    al.action,
    al.\"entityType\",
    al.\"createdAt\",
    al.changes
  FROM \"AuditLog\" al
  JOIN \"User\" u ON u.id = al.\"userId\"
  WHERE u.role = 'ADMIN'
  AND al.\"createdAt\" > NOW() - INTERVAL '24 hours'
  ORDER BY al.\"createdAt\" DESC
  LIMIT 50;"
```

### Generate Admin Activity Report

```bash
# Monthly admin activity report
psql $DATABASE_URL -c "
  SELECT 
    u.email,
    COUNT(*) as total_actions,
    COUNT(DISTINCT DATE(al.\"createdAt\")) as days_active,
    STRING_AGG(DISTINCT al.action, ', ') as actions_performed
  FROM \"AuditLog\" al
  JOIN \"User\" u ON u.id = al.\"userId\"
  WHERE u.role = 'ADMIN'
  AND DATE(al.\"createdAt\") = DATE(CURRENT_DATE) - INTERVAL '1 month'
  GROUP BY u.id, u.email
  ORDER BY total_actions DESC;" > admin_activity_report_$(date +%Y%m%d).txt
```

---

## Two-Factor Authentication (2FA) Setup

### Enable 2FA for Admin Accounts

**(Implementation in progress - future feature)**

Once implemented:

```bash
# Enable 2FA for specific admin
curl -X POST https://api.changeliberia.org/api/v1/admin/users/:userId/enable-2fa \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Admin receives QR code for authenticator app
# Admin scans QR code in Google Authenticator, Microsoft Authenticator, etc.

# Next login requires:
# 1. Email/password
# 2. 2FA code from app
```

---

## Admin Session Management

### View Active Admin Sessions

```bash
# Query Redis for active sessions
redis-cli -u $REDIS_URL \
  KEYS "session:admin:*" | \
  wc -l

# Expected: 1-3 sessions (normal)
# > 10: Possible compromise, investigate

# View session details
redis-cli -u $REDIS_URL \
  GET "session:admin:${USER_ID}"
```

### Force Logout Specific Admin

```bash
# Immediately invalidate admin's session
redis-cli -u $REDIS_URL \
  DEL "session:admin:${USER_ID}"

# User will be logged out
# Must login again to regain access
```

### Log Out All Admins

```bash
# ⚠️ Emergency only - logs out ALL admins
redis-cli -u $REDIS_URL \
  KEYS "session:admin:*" | xargs -I {} redis-cli -u $REDIS_URL DEL {}

# All admins must login again
```

---

## Admin Access Control Best Practices

✅ **DO:**
- [ ] Create unique admin account per person (don't share passwords)
- [ ] Use strong passwords (min 12 characters, mix of upper/lower/numbers/symbols)
- [ ] Enable 2FA when available
- [ ] Rotate admin access quarterly
- [ ] Document who has admin access
- [ ] Review admin activity logs weekly
- [ ] Immediately revoke access when person leaves

❌ **DON'T:**
- [ ] Share admin password between people
- [ ] Use same password across services
- [ ] Leave admin accounts inactive for > 90 days
- [ ] Grant admin access to contractors/consultants
- [ ] Use admin account for testing features
- [ ] Keep admin passwords in chat or email

---

## Quick Reference Commands

```bash
# Create admin
INSERT INTO "User" (...) VALUES (...);

# List admins
SELECT email, "fullName" FROM "User" WHERE role = 'ADMIN';

# Remove admin role
UPDATE "User" SET role = 'USER' WHERE email = '...';

# Reset password
UPDATE "User" SET "passwordHash" = NULL WHERE email = '...';

# View admin activity
SELECT * FROM "AuditLog" WHERE "userId" = '...' ORDER BY "createdAt" DESC LIMIT 20;

# Check active sessions
redis-cli -u $REDIS_URL KEYS "session:admin:*"
```

---

**Last Updated:** May 27, 2026
**Version:** 1.0
