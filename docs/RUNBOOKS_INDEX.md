# Production Operations Runbooks - Master Index

**Last Updated:** May 27, 2026  
**Version:** 1.0  
**Status:** ✅ Ready for Production Use

---

## Quick Navigation

### 🚨 Emergency Response (Start Here)
- **Service Down:** See [RUNBOOK_INCIDENT_RESPONSE.md](RUNBOOK_INCIDENT_RESPONSE.md) → "API Service Down"
- **Email Not Delivering:** See [RUNBOOK_INCIDENT_RESPONSE.md](RUNBOOK_INCIDENT_RESPONSE.md) → "Email Service Not Delivering"
- **Database Issues:** See [RUNBOOK_INCIDENT_RESPONSE.md](RUNBOOK_INCIDENT_RESPONSE.md) → "Database Connection Issues"
- **Out of Disk Space:** See [RUNBOOK_INCIDENT_RESPONSE.md](RUNBOOK_INCIDENT_RESPONSE.md) → "Out of Disk Space"

### 📋 Daily/Routine Tasks
- **Morning Health Check:** [RUNBOOK_DAILY_OPERATIONS.md](RUNBOOK_DAILY_OPERATIONS.md) → Morning Checklist
- **End of Day Report:** [RUNBOOK_DAILY_OPERATIONS.md](RUNBOOK_DAILY_OPERATIONS.md) → End-of-Day Checklist
- **Weekly Maintenance:** [RUNBOOK_DAILY_OPERATIONS.md](RUNBOOK_DAILY_OPERATIONS.md) → Weekly Tasks
- **Monthly Tasks:** [RUNBOOK_DAILY_OPERATIONS.md](RUNBOOK_DAILY_OPERATIONS.md) → Monthly Tasks

### 👥 Admin Management
- **Create New Admin:** [RUNBOOK_ADMIN_MANAGEMENT.md](RUNBOOK_ADMIN_MANAGEMENT.md) → Creating New Admin Users
- **Reset Admin Password:** [RUNBOOK_ADMIN_MANAGEMENT.md](RUNBOOK_ADMIN_MANAGEMENT.md) → Resetting Admin Password
- **Revoke Admin Access:** [RUNBOOK_ADMIN_MANAGEMENT.md](RUNBOOK_ADMIN_MANAGEMENT.md) → Revoking Admin Access
- **Monitor Admin Activity:** [RUNBOOK_ADMIN_MANAGEMENT.md](RUNBOOK_ADMIN_MANAGEMENT.md) → Monitoring Admin Activity

### 💾 Backup & Recovery
- **Manual Backup:** [RUNBOOK_BACKUP_RECOVERY.md](RUNBOOK_BACKUP_RECOVERY.md) → Manual Full Database Backup
- **Restore from Backup:** [RUNBOOK_BACKUP_RECOVERY.md](RUNBOOK_BACKUP_RECOVERY.md) → Recovery Procedures
- **Verify Backup:** [RUNBOOK_BACKUP_RECOVERY.md](RUNBOOK_BACKUP_RECOVERY.md) → Backup Verification
- **Cloud Backup:** [RUNBOOK_BACKUP_RECOVERY.md](RUNBOOK_BACKUP_RECOVERY.md) → Cloud Backup Options

---

## Complete Runbook Catalog

### 1. [RUNBOOK_DAILY_OPERATIONS.md](RUNBOOK_DAILY_OPERATIONS.md)
**Purpose:** Day-to-day operations and health checks

**Topics:**
- ✓ Morning checklist (8 AM)
- ✓ Hourly monitoring
- ✓ End-of-day checklist (5 PM)
- ✓ Weekly tasks
- ✓ Monthly tasks
- ✓ Emergency procedures
- ✓ Useful command reference

**When to Use:**
- Every morning before work
- End of each working day
- Routine maintenance tasks
- Quick command reference

**Estimated Time:** 15-30 minutes/day

---

### 2. [RUNBOOK_INCIDENT_RESPONSE.md](RUNBOOK_INCIDENT_RESPONSE.md)
**Purpose:** Step-by-step procedures for production incidents

**Topics:**
- ✓ Email service not delivering (most common)
- ✓ API service down
- ✓ Database connection issues
- ✓ Out of disk space
- ✓ Common issues & fixes
- ✓ Escalation procedures
- ✓ Post-incident procedures

**When to Use:**
- Production incident detected
- Monitoring alert triggered
- Customer reports service issue
- Emergency situation

**Estimated Time:** 5-30 minutes (depending on severity)

---

### 3. [RUNBOOK_ADMIN_MANAGEMENT.md](RUNBOOK_ADMIN_MANAGEMENT.md)
**Purpose:** Admin user creation, access control, and management

**Topics:**
- ✓ Creating new admin users (4 methods)
- ✓ Revoking admin access
- ✓ Resetting admin passwords
- ✓ Updating permissions
- ✓ Monitoring admin activity
- ✓ 2FA setup (when available)
- ✓ Session management
- ✓ Security best practices

**When to Use:**
- New team member joins
- Security incident (compromised admin)
- Onboarding/offboarding staff
- Permission updates
- Compliance audits

**Estimated Time:** 5-15 minutes per user

---

### 4. [RUNBOOK_BACKUP_RECOVERY.md](RUNBOOK_BACKUP_RECOVERY.md)
**Purpose:** Database and Redis backup/recovery procedures

**Topics:**
- ✓ Automated backup schedule
- ✓ Manual backup procedures
- ✓ PostgreSQL recovery scenarios
- ✓ Redis backup/recovery
- ✓ Backup verification
- ✓ Cloud backup options (S3, GCS)
- ✓ Disaster recovery plan
- ✓ Backup retention policy

**When to Use:**
- Scheduled maintenance windows
- Data corruption detected
- Testing disaster recovery
- Compliance/audit requirements
- Backup storage setup

**Estimated Time:** 15-60 minutes (depending on scenario)

---

## Monitoring & Automation

### Automated Monitoring Script

**Location:** `scripts/monitor-email.sh`

**Function:** Monitors email delivery, queue depth, and system health

**Checks:**
- Database connectivity
- Redis connectivity
- Email delivery rate (target: 95%)
- Email queue depth (alert if > 100)
- API health endpoint
- Failed email jobs
- Database size

**Installation:**
```bash
# Make executable
chmod +x scripts/monitor-email.sh

# Add to crontab (runs every 15 minutes)
(crontab -l 2>/dev/null; echo "*/15 * * * * cd /Users/visionalventure/Change\ Liberia && bash scripts/monitor-email.sh") | crontab -
```

**Alert Escalation:**
- Warning: 2-5% failure → Email ops@changeliberia.org
- Critical: 5-10% failure → Email + SMS
- Severe: >10% failure → Page on-call engineer

---

## System Architecture Overview

```
Production Infrastructure:
├── API Server (NestJS 11.0.0)
│   ├── PostgreSQL (Railway)
│   ├── Redis (Railway)
│   ├── Email Service (Resend API)
│   └── Monitoring (Prometheus metrics)
│
├── Web Server (Next.js 16.2.3)
│   ├── Static assets (CDN/S3)
│   └── API integration
│
├── Backup System
│   ├── Daily PostgreSQL backups
│   ├── Daily Redis snapshots
│   └── Cloud storage (S3/GCS)
│
└── Monitoring & Alerting
    ├── Email delivery tracking
    ├── Health checks
    ├── Resource monitoring
    └── Incident alerts
```

---

## Key Performance Indicators (KPIs)

Monitor these daily:

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Email Delivery Rate | 95-99% | < 90% | < 50% |
| API Response Time | < 200ms | < 500ms | > 1000ms |
| Database Size Growth | +500MB/month | +1GB/month | +5GB/month |
| Email Queue Depth | 0-20 jobs | 50-100 jobs | > 100 jobs |
| API Uptime | 99.9% | < 99% | < 95% |
| Admin Active Sessions | 1-3 | > 5 | > 10 |

---

## Escalation Matrix

### Email Delivery Failure

```
Detection (Monitoring Alert)
  ↓
[< 5% failure] → Email ops@: "Warning - delivery rate XX%"
  ↓
[5-10% failure] → Email + SMS ops@: "Critical - delivery rate XX%"
  ↓
[> 10% failure] → SMS + Page on-call + Slack: "SEVERE - Email service down"
  ↓
[> 30 min unresolved] → Escalate to Tech Lead
  ↓
[> 60 min unresolved] → Escalate to CTO
```

### API Service Degradation

```
[API response time > 500ms] → Log in monitoring dashboard
  ↓
[> 1 second for > 5 min] → Email tech lead
  ↓
[Service timeout] → Page on-call engineer
  ↓
[Complete outage] → All-hands alert
```

### Database Issues

```
[Connection pool > 80%] → Monitor, log alert
  ↓
[> 100 connections] → Investigate and kill idle connections
  ↓
[Connection attempts failing] → Restart DB connection pool
  ↓
[Data corruption detected] → Initiate restore from backup
```

---

## Contact Information

**On-Call Engineer (24/7):**
- PagerDuty: [link]
- Phone: [number]

**Slack Channels:**
- #incident - Production issues
- #ops - Daily operations
- #deployment - Deployment announcements
- #monitoring - Monitoring alerts

**Email:**
- ops@changeliberia.org - Operations team
- tech-lead@changeliberia.org - Tech lead
- cto@changeliberia.org - CTO/Emergency

---

## Runbook Quick Reference

### When to Use Each Runbook

```
Is there an emergency?
  ├─ YES → RUNBOOK_INCIDENT_RESPONSE.md
  └─ NO  → Continue below...

Is it a routine task?
  ├─ YES → RUNBOOK_DAILY_OPERATIONS.md
  └─ NO  → Continue below...

Is it about admins/users?
  ├─ YES → RUNBOOK_ADMIN_MANAGEMENT.md
  └─ NO  → Continue below...

Is it about backups/recovery?
  ├─ YES → RUNBOOK_BACKUP_RECOVERY.md
  └─ NO  → Check general troubleshooting below...
```

---

## Troubleshooting Decision Tree

**Problem: API not responding**
→ See: RUNBOOK_INCIDENT_RESPONSE.md → "API Service Down"

**Problem: Emails not being sent**
→ See: RUNBOOK_INCIDENT_RESPONSE.md → "Email Service Not Delivering"

**Problem: Can't login**
→ See: RUNBOOK_DAILY_OPERATIONS.md → "Emergency Procedures: Service is Down"

**Problem: Disk space critical**
→ See: RUNBOOK_INCIDENT_RESPONSE.md → "Out of Disk Space"

**Problem: Database is slow**
→ See: RUNBOOK_DAILY_OPERATIONS.md → "Database Maintenance"

**Problem: Need to add new admin**
→ See: RUNBOOK_ADMIN_MANAGEMENT.md → "Creating New Admin Users"

**Problem: Need to restore data**
→ See: RUNBOOK_BACKUP_RECOVERY.md → "Recovery Procedures"

---

## Monthly Maintenance Calendar

```
Week 1 (Every Monday):
  - [ ] Database maintenance (VACUUM, ANALYZE)
  - [ ] Review failed emails report
  - [ ] Check disk space

Week 2:
  - [ ] Rotate SSL certificates (if needed)
  - [ ] Review security logs
  - [ ] Capacity planning analysis

Week 3:
  - [ ] Admin access audit
  - [ ] Performance review
  - [ ] Backup retention review

Week 4:
  - [ ] Monthly report generation
  - [ ] Team briefing on incidents
  - [ ] Planning next month tasks
```

---

## Documentation Maintenance

These runbooks should be updated:
- [ ] After each major incident (document lessons learned)
- [ ] Quarterly (review and refresh procedures)
- [ ] When process changes
- [ ] When new team member onboards
- [ ] Before major deployments

**Last Reviewed:** May 27, 2026
**Next Review:** August 27, 2026 (Quarterly)

---

## Getting Started

### Day 1 (New Operator)
1. Read this index: 10 min
2. Read RUNBOOK_DAILY_OPERATIONS.md: 20 min
3. Do morning checklist with supervisor: 15 min
4. Read RUNBOOK_INCIDENT_RESPONSE.md: 20 min

### Week 1
- Practice all runbooks with supervisor
- Run through a mock incident scenario
- Verify you can login and access production systems
- Set up monitoring alerts on your devices

### Ongoing
- Run morning/end-of-day checklists daily
- Review monitoring dashboard hourly
- Study one runbook per week in depth
- Participate in monthly team briefings

---

## Support & Questions

**Don't know what to do?**
1. Check this index
2. Find matching runbook
3. Follow step-by-step procedures
4. If still unclear, contact tech lead
5. Document issue for future reference

**Found a problem in runbooks?**
1. Document the issue
2. Post in #ops Slack channel
3. Include date, runbook, and issue
4. Runbooks will be updated based on feedback

---

**Version:** 1.0  
**Last Updated:** May 27, 2026  
**Status:** ✅ Production Ready  
**Reviewed By:** [Name]  
**Next Review:** August 27, 2026
