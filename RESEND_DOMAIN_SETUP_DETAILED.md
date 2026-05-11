# Resend Domain Setup - Step by Step Guide

**Goal**: Configure changeliberia.org as the custom email domain in Resend

---

## ✅ Phase 1: Add Domain to Resend (10 minutes)

### Step 1.1: Access Resend Dashboard
1. Go to: https://resend.com/
2. Log in with your account
3. Navigate to **Domains** (left sidebar)
4. URL: https://resend.com/domains

### Step 1.2: Click "Add Domain"
1. Look for the **"Add Domain"** button (usually blue, top right)
2. Click it

### Step 1.3: Enter Domain Name
1. A form will appear asking for domain name
2. Enter exactly: `changeliberia.org`
3. Click **"Add"** or **"Create"** button

### Step 1.4: Copy DNS Records
Resend will show you 3 DNS records:

**Record 1 - DKIM (CNAME)**
```
Type: CNAME
Name: default._domainkey
Value: default._domainkey.changeliberia.org.cname.resend.co.
```
👉 **COPY THIS EXACTLY**

**Record 2 - SPF (TXT)**
```
Type: TXT
Name: @ (or leave blank)
Value: v=spf1 include:sendingdomain.resend.co ~all
```
👉 **COPY THIS EXACTLY**

**Record 3 - DMARC (TXT)**
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:postmaster@changeliberia.org
```
👉 **COPY THIS EXACTLY**

---

## 🔧 Phase 2: Add DNS Records (10 minutes)

### Step 2.1: Access Your Domain Provider

Choose your provider below:

#### Option A: Namecheap
1. Log in to Namecheap.com
2. Go to **"Domain List"** → Select **changeliberia.org**
3. Click **"Manage"**
4. Go to **"Advanced DNS"** tab

#### Option B: GoDaddy
1. Log in to GoDaddy.com
2. Go to **"My Products"** → Select **changeliberia.org**
3. Click **"Manage DNS"**
4. Look for DNS records section

#### Option C: Route 53 (AWS)
1. Log in to AWS Console
2. Go to Route 53
3. Find the hosted zone for **changeliberia.org**
4. Click it to open

#### Option D: Other Providers
- Google Domains: Settings → DNS → Custom records
- Bluehost: Advanced → Zone Editor
- Cloudflare: Zone → DNS

### Step 2.2: Add DKIM Record (CNAME)

**In Namecheap**:
1. Click "Add New Record"
2. Type: CNAME
3. Host: `default._domainkey`
4. Value: `default._domainkey.changeliberia.org.cname.resend.co.`
5. TTL: 3600
6. Click ✓

**In GoDaddy**:
1. Click "Add Record"
2. Type: CNAME
3. Name: `default._domainkey`
4. Points to: `default._domainkey.chanceliberia.org.cname.resend.co.`
5. Save

**In Route 53**:
1. Click "Create record"
2. Name: `default._domainkey.changeliberia.org`
3. Type: CNAME
4. Value: `default._domainkey.changeliberia.org.cname.resend.co.`
5. Create

### Step 2.3: Add SPF Record (TXT)

**In Namecheap**:
1. Click "Add New Record"
2. Type: TXT
3. Host: `@` (leave blank/root)
4. Value: `v=spf1 include:sendingdomain.resend.co ~all`
5. TTL: 3600
6. Click ✓

**In GoDaddy**:
1. Click "Add Record"
2. Type: TXT
3. Name: `@` (or leave blank)
4. Value: `v=spf1 include:sendingdomain.resend.co ~all`
5. Save

**In Route 53**:
1. Click "Create record"
2. Name: `changeliberia.org` (or leave blank)
3. Type: TXT
4. Value: `"v=spf1 include:sendingdomain.resend.co ~all"`
5. Create

### Step 2.4: Add DMARC Record (TXT)

**In Namecheap**:
1. Click "Add New Record"
2. Type: TXT
3. Host: `_dmarc`
4. Value: `v=DMARC1; p=quarantine; rua=mailto:postmaster@changeliberia.org`
5. TTL: 3600
6. Click ✓

**In GoDaddy**:
1. Click "Add Record"
2. Type: TXT
3. Name: `_dmarc`
4. Value: `v=DMARC1; p=quarantine; rua=mailto:postmaster@changeliberia.org`
5. Save

**In Route 53**:
1. Click "Create record"
2. Name: `_dmarc.changeliberia.org`
3. Type: TXT
4. Value: `"v=DMARC1; p=quarantine; rua=mailto:postmaster@changeliberia.org"`
5. Create

---

## ⏰ Phase 3: Wait for DNS Propagation (24-48 hours)

### ⏳ **DO NOT PROCEED UNTIL THIS IS COMPLETE**

DNS propagation is automatic. Just wait. This typically takes:
- **2 hours** for most providers
- **24-48 hours** for full global propagation

### Check DNS Status

**Option 1: Using whatsmydns.net**
1. Go to: https://www.whatsmydns.net/
2. Enter: `default._domainkey.changeliberia.org`
3. Type: CNAME
4. Check status - you should see green checkmarks spreading across the world

**Option 2: Using DNS Lookup (Command Line)**
```bash
# Check DKIM
nslookup -type=CNAME default._domainkey.changeliberia.org

# Check SPF
nslookup -type=TXT changeliberia.org

# Check DMARC
nslookup -type=TXT _dmarc.changeliberia.org
```

**Option 3: Using dig (Command Line)**
```bash
dig default._domainkey.changeliberia.org CNAME
dig changeliberia.org TXT
dig _dmarc.changeliberia.org TXT
```

### Signs DNS Has Propagated
✓ whatsmydns.net shows all green  
✓ nslookup/dig returns your records  
✓ Resend dashboard shows partial verification  

---

## ✅ Phase 4: Verify Domain in Resend (2 minutes)

### Step 4.1: Check Resend Dashboard

1. Go to: https://resend.com/domains
2. Find: **changeliberia.org**
3. Look for status indicators:

**Expected to See**:
```
✓ Domain    Verified
✓ DKIM      Verified  
✓ SPF       Verified
✓ DMARC     Verified
```

**If Not All Green**:
- ⏳ Wait a bit longer (DNS still propagating)
- ❌ Double-check DNS records match exactly
- ❌ Check for typos in domain provider

### Step 4.2: Troubleshooting

If domain not verifying after 48 hours:

1. **Check exact record values** (no spaces, typos)
2. **Verify domain is using correct nameservers** (check domain registrar)
3. **Contact domain provider** if records aren't showing
4. **Delete and re-add** domain in Resend if stuck

---

## 🔗 Phase 5: Configure Webhooks (Optional, 10 minutes)

### Step 5.1: Create Webhook

1. Go to: https://resend.com/webhooks
2. Click **"Create Webhook"**
3. Enter endpoint: `https://changeliberia-web.vercel.app/api/v1/webhooks/resend`
4. Select events to track:
   - ✓ email.delivered
   - ✓ email.bounced
   - ✓ email.complained
   - ✓ email.opened
   - ✓ email.clicked
5. Click **"Create"**

### Step 5.2: Save Webhook Secret

Resend will show you the webhook secret starting with `whsec_`

1. **Copy the secret**
2. Go to: `apps/api/.env.local`
3. Update: `RESEND_WEBHOOK_SECRET=whsec_[paste_here]`
4. **Restart API** for webhook to work

---

## 📊 Full Timeline

| Phase | Action | Time | Status |
|-------|--------|------|--------|
| **1** | Add domain to Resend | 10 min | 🔲 Ready |
| **1** | Copy DNS records | 2 min | After step 1 |
| **2** | Add DKIM record | 5 min | After phase 1 |
| **2** | Add SPF record | 2 min | After DKIM |
| **2** | Add DMARC record | 2 min | After SPF |
| **3** | Wait for DNS | 24-48 hrs | After phase 2 |
| **4** | Verify in Resend | 2 min | After phase 3 |
| **5** | Create webhook | 10 min | Optional |
| **6** | Test email | 5 min | After verify |

**Total Active Time**: ~40 minutes
**Total Passive Wait**: 24-48 hours

---

## 🚀 Next Steps After Verification

### Once All 4 DNS Records Show Green ✓

1. Run verification script:
```bash
bash scripts/quick-verify.sh
```

2. Run full email test suite:
```bash
bash scripts/test-email-system.sh
```

3. Send test email:
```bash
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer re_V39tR44W_PmhRUhmg9k79ZrUpCe6F7AKx" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "noreply@changeliberia.org",
    "to": "your-email@example.com",
    "subject": "Test - Change Liberia",
    "html": "<h1>Success!</h1><p>Email domain verified!</p>"
  }'
```

4. Deploy to production
5. Monitor for 24 hours

---

## 📞 Support

- **Resend Docs**: https://resend.com/docs/domains/overview
- **Domain Issues**: Contact your domain provider support
- **DNS Propagation**: https://www.whatsmydns.net/
- **Resend Support**: https://resend.com/support

---

**Status**: Step-by-step guide ready
**Created**: May 10, 2026
**Version**: 1.0
