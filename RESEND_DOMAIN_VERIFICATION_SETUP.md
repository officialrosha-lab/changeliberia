# Email Domain Verification Setup for Resend

**Current Status:**
- ✅ Staging domain `changeiliberia.org` - VERIFIED (existing)
- ⏳ Production domain `changeliberia.org` - PENDING VERIFICATION

This guide walks through verifying your production email domain in Resend.

## Step 1: Log in to Resend Dashboard

1. Go to https://resend.com/domains
2. Click "Add Domain" button
3. Enter your domain: `changeliberia.org`
4. Click "Verify Domain"

## Step 2: Get DNS Records from Resend

Resend will provide you with three DNS records to add:

- **SPF Record**: `v=spf1 include:resend.com ~all`
- **DKIM Record**: Two TXT records (selector1 and selector2)
- **Return-Path (Optional CNAME)**: For enhanced bounce handling

Copy each record exactly as shown in Resend dashboard.

## Step 3: Add DNS Records to Your Provider

You need to add these records at your domain registrar/DNS provider.

### If using Route 53 (AWS):
1. Go to https://console.aws.amazon.com/route53/
2. Find your hosted zone for `changeliberia.org`
3. Click "Create Record"
4. For each record from Resend:
   - Select "TXT" as record type
   - Paste the value
   - Click "Create Records"

### If using Cloudflare:
1. Go to https://dash.cloudflare.com/ and select your domain
2. Go to DNS section
3. Click "Add Record"
4. For each record:
   - Type: TXT
   - Name: Enter as shown in Resend (e.g., `default._domainkey`)
   - Content: Paste the value
   - TTL: Auto

### If using GoDaddy, NameCheap, or other provider:
Follow similar steps - look for "DNS Management" or "Zone File" section and add TXT records.

## Step 4: Wait for DNS Propagation

DNS changes take 5-10 minutes to propagate globally. You can check status at:
- https://mxtoolbox.com/mxlookup.aspx (enter `changeliberia.org`)
- Or wait a few minutes and return to Resend dashboard

## Step 5: Verify in Resend Dashboard

1. Go to https://resend.com/domains
2. Click on `changeliberia.org`
3. Click "Verify Domain" button
4. Resend will check DNS records
5. Once all records are valid, domain shows as **VERIFIED** ✅

## Step 6: Update Environment Variables

Once verified, update `.env.production`:

```
MAIL_FROM="noreply@changeliberia.org"
EMAIL_REPLY_TO="support@changeliberia.org"
RESEND_API_KEY="re_3puwiQi1_DPNqBm1WSYbVe6SCWBw9QuKS"
```

## Verification Checklist

- [ ] Domain added to Resend dashboard
- [ ] SPF record added to DNS provider
- [ ] DKIM selector1 record added to DNS provider
- [ ] DKIM selector2 record added to DNS provider
- [ ] DNS propagated (wait 5-10 min)
- [ ] Domain verified in Resend (shows VERIFIED badge)
- [ ] Sent test email from verified domain
- [ ] Email delivered successfully

## Testing After Verification

Once verified, test email sending:

```bash
# Get auth token
TOKEN=$(curl -s -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin2@test.local","password":"password"}' \
  | jq -r '.accessToken')

# Send test email
curl -X POST http://localhost:4000/api/v1/email/send-test \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"recipientEmail":"your-email@example.com"}'
```

## Troubleshooting

**Domain shows as "Pending" after 15 minutes:**
- Check DNS records at https://mxtoolbox.com/mxlookup.aspx
- Ensure records are exactly as shown in Resend
- TTL might need time to update (can be 24-48 hours)

**Email still bouncing after verification:**
- Check spam folder
- Verify Resend delivery logs at https://resend.com/emails
- Ensure Reply-To and From addresses use verified domain

**Can't access Resend dashboard:**
- Verify login at https://resend.com/login
- Check that you're on organization account (not personal)
- Resend API key must be from Production, not Test

## Next Steps

After domain verification is complete:
1. Fill in remaining `.env.production` values (DATABASE_URL, REDIS_URL)
2. Deploy to production environment
3. Configure monitoring and alerts
4. Test full email delivery pipeline

---

**Reference:** [Resend Domain Setup Guide](https://resend.com/docs/dashboard/domains)
