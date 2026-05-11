# Resend Email Configuration Guide - changeliberia-web.vercel.app

**Production Domain**: https://changeliberia-web.vercel.app/
**Email Domain**: changeliberia.org (custom domain)
**Resend API Key**: re_V39tR44W_PmhRUhmg9k79ZrUpCe6F7AKx

---

## 📋 Configuration Checklist

### Step 1: Add Domain to Resend ✓

**URL**: https://resend.com/domains

1. Click **"Add Domain"**
2. Enter: `changeliberia.org`
3. Click **"Add"**

Resend will generate 3 DNS records. **Copy each one exactly**.

---

## 🔧 DNS Records to Add

Copy these records from Resend and add them to your domain provider:

### Record 1: DKIM (CNAME)
```
Type: CNAME
Name: default._domainkey
Value: [Copy from Resend]
TTL: 3600
```

### Record 2: SPF (TXT)
```
Type: TXT
Name: @ (or leave blank for root)
Value: v=spf1 include:sendingdomain.resend.co ~all
TTL: 3600
```

### Record 3: DMARC (TXT)
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:...
TTL: 3600
```

---

## ⏱️ Timeline

| Phase | Action | Duration | Status |
|-------|--------|----------|--------|
| 1 | Add domain to Resend | 10 min | 🔲 Ready |
| 2 | Copy DNS records | 2 min | 🔲 After step 1 |
| 3 | Add records to domain provider | 10 min | 🔲 After step 2 |
| 4 | DNS propagation | 24-48 hrs | ⏳ After step 3 |
| 5 | Verify in Resend | 2 min | 🔲 After step 4 |
| 6 | Configure webhooks | 10 min | 🔲 Optional |

**Total Active Time**: ~32 minutes
**Total Wait Time**: 24-48 hours

---

## 🚀 Environment Configuration

### API Server (.env)
```bash
# Email Configuration
RESEND_API_KEY="re_V39tR44W_PmhRUhmg9k79ZrUpCe6F7AKx"
MAIL_FROM="noreply@changeliberia.org"
MAIL_REPLY_TO="support@changeliberia.org"
EMAIL_PROVIDER="production"  # Changed from "development"

# Tracking
TRACKING_DOMAIN="track.changeliberia.org"

# URLs for Webhooks
APP_URL="https://changeliberia-web.vercel.app"
NEXT_PUBLIC_APP_URL="https://changeliberia-web.vercel.app"
WEBHOOK_URL="https://changeliberia-web.vercel.app/api/v1/webhooks/resend"

# Resend Webhook
RESEND_WEBHOOK_SECRET="whsec_[to_be_filled_after_webhook_creation]"
```

### Web App (.env.local)
```bash
NEXT_PUBLIC_APP_URL="https://changeliberia-web.vercel.app"
NEXT_PUBLIC_API_URL="https://api.changeliberia.org/api/v1"
# OR if using same domain:
NEXT_PUBLIC_API_URL="https://changeliberia-web.vercel.app/api/v1"
```

---

## 🔗 Production URLs

| Component | URL |
|-----------|-----|
| **Web App** | https://changeliberia-web.vercel.app |
| **API** | https://api.changeliberia.org (or vercel subdomain) |
| **Webhook** | https://changeliberia-web.vercel.app/api/v1/webhooks/resend |
| **Email From** | noreply@changeliberia.org |
| **Email Domain** | changeliberia.org |

---

## 📧 Resend Webhook Configuration

### Create Webhook in Resend

**URL**: https://resend.com/webhooks

1. Click **"Create Webhook"**
2. Enter endpoint: `https://changeliberia-web.vercel.app/api/v1/webhooks/resend`
3. Select events:
   - ✓ email.delivered
   - ✓ email.bounced
   - ✓ email.complained
   - ✓ email.opened
   - ✓ email.clicked
4. Click **"Create"**
5. Copy webhook secret (starts with `whsec_`)
6. Add to `.env`: `RESEND_WEBHOOK_SECRET=whsec_...`
7. Redeploy API

---

## ✅ Verification Steps

### After DNS Propagation (24-48 hours)

**In Resend Dashboard**:
1. Go to https://resend.com/domains
2. Find `changeliberia.org`
3. Verify all 4 items show green checkmarks:
   - ✓ Domain: Verified
   - ✓ DKIM: Verified
   - ✓ SPF: Verified
   - ✓ DMARC: Verified

### Send Test Email

```bash
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer re_V39tR44W_PmhRUhmg9k79ZrUpCe6F7AKx" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "noreply@changeliberia.org",
    "to": "test@example.com",
    "subject": "Test Email",
    "html": "<h1>Hello!</h1><p>This is a test email from Change Liberia.</p>"
  }'
```

**Expected Response**:
```json
{
  "id": "msg_...",
  "from": "noreply@changeliberia.org",
  "to": "test@example.com",
  "created_at": "2026-05-10T..."
}
```

---

## 🎯 Next Steps

### Immediate (Today)
1. [ ] Go to Resend dashboard
2. [ ] Add domain: changeliberia.org
3. [ ] Copy DNS records
4. [ ] Add records to domain provider
5. [ ] Wait for DNS propagation

### After DNS Propagates (24-48 hours)
1. [ ] Verify domain in Resend (all 4 green)
2. [ ] Create webhook
3. [ ] Add webhook secret to .env
4. [ ] Redeploy API
5. [ ] Send test email
6. [ ] Check webhook delivery

### Final (After Verification)
1. [ ] Run email system tests: `bash scripts/test-email-system.sh`
2. [ ] Run quick verification: `bash scripts/quick-verify.sh`
3. [ ] Deploy to production
4. [ ] Monitor for 24 hours

---

## 🔐 Security Notes

1. **API Key**: Keep `RESEND_API_KEY` secure (restricted to send-only)
2. **Webhook Secret**: Add `RESEND_WEBHOOK_SECRET` to production .env only
3. **Domain**: Use custom domain (changeliberia.org) not generic provider domain
4. **DMARC Policy**: Set to "quarantine" for security

---

## 📞 Troubleshooting

### DNS Records Not Verifying
- Wait a bit longer (DNS propagation takes time)
- Check records are entered exactly as shown
- Verify with: `nslookup -type=CNAME default._domainkey.changeliberia.org`
- Contact domain provider if still not showing

### Webhook Not Receiving Events
- Verify endpoint URL is correct and accessible
- Check `RESEND_WEBHOOK_SECRET` is set in .env
- Test with "Send Test Event" button in Resend dashboard
- Check API logs for webhook errors

### Emails Not Delivering
- Ensure domain is verified (all 4 green in Resend)
- Check `MAIL_FROM` is set to noreply@changeliberia.org
- Verify user not in spam folder
- Check bounce report in Resend dashboard

---

## 📚 Reference Links

- **Resend Docs**: https://resend.com/docs
- **Domain Setup**: https://resend.com/docs/domains/overview
- **Webhooks**: https://resend.com/docs/webhooks
- **DNS Propagation Checker**: https://www.whatsmydns.net/

---

**Status**: Ready for Resend configuration
**Production Domain**: https://changeliberia-web.vercel.app/
**Email Domain**: changeliberia.org
**Estimated Timeline**: 24-48 hours to go-live

---

**Document Version**: 1.0
**Last Updated**: May 10, 2026
**Next Step**: Add domain to Resend dashboard
