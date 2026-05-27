# Database Backup & Recovery Runbook

## Purpose
Procedures for backing up and recovering production database and Redis.

---

## Automated Daily Backups

### PostgreSQL Backup Schedule

**Automated backup runs daily at 2 AM:**

```bash
#!/bin/bash
# scripts/backup-database-daily.sh

BACKUP_DIR="${BACKUP_DIR:-/backups/changeliberia/postgres}"
DB_URL="${DATABASE_URL}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db_backup_$DATE.sql.gz"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Dump and compress database
echo "Starting backup: $BACKUP_FILE"
pg_dump "$DB_URL" | gzip > "$BACKUP_FILE"

# Verify backup was created
if [ -f "$BACKUP_FILE" ]; then
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "✓ Backup completed: $BACKUP_FILE ($SIZE)"
    
    # Keep only last 30 days of backups
    find "$BACKUP_DIR" -mtime +30 -delete
else
    echo "✗ Backup failed!"
    exit 1
fi
```

**Add to crontab:**
```bash
crontab -e

# Add this line (runs daily at 2 AM):
0 2 * * * bash /Users/visionalventure/Change\ Liberia/scripts/backup-database-daily.sh >> /var/log/db-backup.log 2>&1
```

### Redis Backup Schedule

**Automated Redis backup (uses built-in RDB snapshots):**

```bash
# Redis auto-saves to /var/lib/redis/dump.rdb
# Default: Every 15 minutes if 1+ keys changed

# Verify auto-save is working
redis-cli -u $REDIS_URL \
  CONFIG GET save
# Expected: save: "900 1 300 10 60 10000"

# Additional: Backup Redis dump daily
cp /var/lib/redis/dump.rdb /backups/changeliberia/redis/dump_$(date +%Y%m%d).rdb
```

---

## Manual Full Database Backup

### PostgreSQL Full Backup

```bash
# Create backup directory
mkdir -p /backups/manual

# Full uncompressed backup (for easy inspection)
pg_dump $DATABASE_URL > /backups/manual/backup_full_$(date +%Y%m%d_%H%M%S).sql

# Compressed backup (recommended for storage)
pg_dump $DATABASE_URL | gzip > /backups/manual/backup_full_$(date +%Y%m%d_%H%M%S).sql.gz

# Backup specific table only
pg_dump -t "EmailLog" $DATABASE_URL > /backups/manual/table_emaillog_$(date +%Y%m%d).sql

# Verify backup size
du -h /backups/manual/backup_*.sql.gz
```

### PostgreSQL Schema-Only Backup

```bash
# Backup schema without data (useful for recovery planning)
pg_dump -s $DATABASE_URL > /backups/manual/schema_only_$(date +%Y%m%d).sql

# This includes all tables, indices, functions but no actual data
```

### PostgreSQL Data-Only Backup

```bash
# Backup data without schema
pg_dump -a $DATABASE_URL > /backups/manual/data_only_$(date +%Y%m%d).sql

# Useful for quick recovery when schema is already restored
```

---

## Recovery Procedures

### Scenario 1: Corrupted Table (Minimal Downtime Recovery)

**Time to Recovery: 5-10 minutes**

```bash
# 1. Identify corrupt table (example: EmailLog)
psql $DATABASE_URL -c "
  SELECT * FROM \"EmailLog\" LIMIT 1;"
# If getting errors, table is likely corrupted

# 2. Drop corrupted table
psql $DATABASE_URL -c "
  DROP TABLE \"EmailLog\" CASCADE;"

# 3. Restore just that table from backup
# Decompress if needed
gunzip -c /backups/manual/backup_full_20260527.sql.gz > /tmp/backup_20260527.sql

# Extract just the EmailLog table
pg_restore -t "EmailLog" \
  --data-only \
  /tmp/backup_20260527.sql | \
  psql $DATABASE_URL

# 4. Verify table is restored
psql $DATABASE_URL -c "
  SELECT COUNT(*) FROM \"EmailLog\";"

# 5. Application can continue (email logs from crash moment lost, but recoverable)
```

### Scenario 2: Accidental Data Deletion (Full Recovery Needed)

**Time to Recovery: 15-30 minutes**

```bash
# 1. Stop application to prevent writes
docker-compose down

# 2. Backup current (corrupted) database
pg_dump $DATABASE_URL | gzip > /backups/corrupted_state_$(date +%Y%m%d_%H%M%S).sql.gz

# 3. Connect to database and drop all tables
psql $DATABASE_URL << EOF
-- WARNING: This deletes everything!
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO public;
EOF

# 4. Restore from backup
psql $DATABASE_URL < /backups/manual/backup_full_20260520.sql

# OR if compressed:
gunzip -c /backups/manual/backup_full_20260520.sql.gz | psql $DATABASE_URL

# 5. Verify restore is complete
psql $DATABASE_URL -c "
  SELECT 
    tablename 
  FROM pg_tables 
  WHERE schemaname = 'public'
  ORDER BY tablename;"

# 6. Run migrations (if any schema changes since backup)
DATABASE_URL="$DATABASE_URL" npm run migrate:prod

# 7. Restart application
docker-compose up -d

# 8. Verify application comes back online
curl -I https://api.changeliberia.org/health
```

### Scenario 3: Point-in-Time Recovery (Recent Data Recovery)

**If you have WAL (Write-Ahead Logs) configured:**

```bash
# Restore to specific point in time (e.g., before accidental deletion)
# This requires PostgreSQL archive mode + WAL files

psql $DATABASE_URL -c "
  SELECT pg_wal_replay_resume();
  -- Database restored to point before accident
"

# Time-based recovery
pg_basebackup -D /var/lib/postgresql/recovery \
  --waldir=/var/lib/postgresql/wal_archive \
  --checkpoint=fast

# This is advanced - requires DevOps support
```

### Scenario 4: Recovery with Minimal Data Loss

**Rolling back without losing all recent data:**

```bash
# 1. Identify when data became corrupted
psql $DATABASE_URL -c "
  SELECT created_at FROM audit_log 
  WHERE action = 'DELETE' 
  ORDER BY created_at DESC LIMIT 5;"

# 2. If corruption happened < 1 hour ago, consider:
#    - Restore from hourly backup
#    - Manually re-enter lost data via API
#    - Accept minor data loss

# 3. For < 24 hours data loss:
#    - Restore from daily backup
#    - Replay events from logs if available
```

---

## Redis Backup & Recovery

### Manual Redis Backup

```bash
# Trigger Redis save manually
redis-cli -u $REDIS_URL SAVE
# This blocks until save completes - use BGSAVE for non-blocking

redis-cli -u $REDIS_URL BGSAVE
# Background save - doesn't block

# Copy backup file
cp /var/lib/redis/dump.rdb /backups/redis/dump_$(date +%Y%m%d_%H%M%S).rdb
```

### Redis Recovery

```bash
# 1. Stop services that use Redis
docker restart api

# 2. Stop Redis
docker restart redis

# 3. Restore backup
cp /backups/redis/dump_20260527.rdb /var/lib/redis/dump.rdb

# 4. Start Redis
redis-cli -u $REDIS_URL BGREWRITEAOF

# 5. Verify
redis-cli -u $REDIS_URL DBSIZE

# 6. Restart application
docker restart api

# 7. Verify application still works
curl -I https://api.changeliberia.org/health
```

### Flush Redis (DANGEROUS - Complete Data Loss)

```bash
# ⚠️ WARNING: This deletes ALL Redis data including email queues

# Only use if Redis is corrupted and unrecoverable
redis-cli -u $REDIS_URL FLUSHALL

# Redis will be empty - email queue will be lost
# Users won't receive pending emails
```

---

## Backup Verification

### Verify Backup Integrity

```bash
# Test restore into temporary database
# 1. Create test database
createdb backup_test

# 2. Restore backup into test database
psql backup_test < /backups/manual/backup_full_20260527.sql

# 3. Run basic integrity checks
psql backup_test << EOF
  SELECT 'User' as table, COUNT(*) as count FROM "User" 
  UNION ALL
  SELECT 'Petition', COUNT(*) FROM "Petition"
  UNION ALL
  SELECT 'Signature', COUNT(*) FROM "Signature"
  UNION ALL
  SELECT 'EmailLog', COUNT(*) FROM "EmailLog";
EOF

# 4. Expected output:
# | table | count |
# | User | 5000+ |
# | Petition | 200+ |
# | Signature | 50000+ |
# | EmailLog | 100000+ |

# 5. If counts look reasonable, backup is good
# 6. Clean up test database
dropdb backup_test
```

### Backup File Checklist

```bash
# 1. Backup file exists
ls -lah /backups/manual/backup_full_*.sql.gz

# 2. Check file size (should be > 1MB)
du -h /backups/manual/backup_full_*.sql.gz

# 3. Check backup age (should be recent)
find /backups -mtime -1  # Files modified in last 24 hours

# 4. Check backup is valid gzip
gzip -t /backups/manual/backup_full_*.sql.gz
# Exit code 0 = valid, non-zero = corrupted

# 5. Spot check backup contents
gunzip -c /backups/manual/backup_full_*.sql.gz | head -50
# Should see CREATE TABLE statements
```

---

## Backup Best Practices

✅ **DO:**
- [ ] Backup daily (automated)
- [ ] Backup before major changes
- [ ] Test recovery procedures monthly
- [ ] Store backups in multiple locations (on-server + cloud)
- [ ] Encrypt backups (especially if using cloud storage)
- [ ] Document backup procedures
- [ ] Monitor backup job status
- [ ] Keep backups for at least 30 days
- [ ] Verify backup integrity regularly

❌ **DON'T:**
- [ ] Store backups on same server only
- [ ] Skip backup verification tests
- [ ] Keep sensitive unencrypted backups in public cloud
- [ ] Delete oldest backups without reason
- [ ] Restore to production without testing first
- [ ] Leave restoration scripts untested

---

## Cloud Backup Options

### AWS S3 Backup

```bash
# Install AWS CLI
brew install awscli

# Configure AWS credentials
aws configure

# Backup to S3
aws s3 cp /backups/manual/backup_full_$(date +%Y%m%d).sql.gz \
  s3://changeliberia-backups/postgres/backup_$(date +%Y%m%d).sql.gz

# List backups
aws s3 ls s3://changeliberia-backups/postgres/

# Restore from S3
aws s3 cp s3://changeliberia-backups/postgres/backup_20260527.sql.gz - | \
  gunzip | psql $DATABASE_URL
```

### Google Cloud Storage Backup

```bash
# Install gsutil
brew install google-cloud-sdk

# Authenticate
gcloud auth login

# Backup to GCS
gsutil cp /backups/manual/backup_full_$(date +%Y%m%d).sql.gz \
  gs://changeliberia-backups/postgres/

# Restore from GCS
gsutil cp gs://changeliberia-backups/postgres/backup_20260527.sql.gz - | \
  gunzip | psql $DATABASE_URL
```

### Automated Daily S3 Upload

```bash
#!/bin/bash
# scripts/backup-to-s3.sh

LOCAL_BACKUP="/backups/manual/backup_full_$(date +%Y%m%d).sql.gz"
S3_BUCKET="s3://changeliberia-backups"

# Upload to S3
if [ -f "$LOCAL_BACKUP" ]; then
    aws s3 cp "$LOCAL_BACKUP" "$S3_BUCKET/postgres/" \
        --storage-class GLACIER \  # Cheaper storage
        --metadata "backup_date=$(date +%Y%m%d)"
    
    echo "✓ Backup uploaded to S3"
else
    echo "✗ Backup file not found"
fi
```

---

## Backup Retention Policy

```
Daily Backups (Last 7 days): Full daily backups
Weekly Backups (Last 4 weeks): One backup per week
Monthly Backups (Last 12 months): One backup per month
Yearly Backups (Archive): One backup per year

Retention in Cloud:
- 7 days in S3 Standard
- 30 days in S3 Intelligent-Tiering
- 1 year in S3 Glacier

Location Redundancy:
- Local: /backups/changeliberia/
- AWS S3: s3://changeliberia-backups/
- Google Cloud: gs://changeliberia-backups/
```

---

## Disaster Recovery Plan

**If complete data center fails:**

1. **Immediate (0-30 min):**
   - [ ] Activate disaster recovery infrastructure
   - [ ] Restore from latest S3/GCS backup to new database
   - [ ] Point DNS to new infrastructure
   - [ ] Notify team

2. **Urgent (30 min - 2 hours):**
   - [ ] Run all migrations on new database
   - [ ] Verify data integrity
   - [ ] Restore admin accounts
   - [ ] Test admin dashboard

3. **Follow-up (2-24 hours):**
   - [ ] Import any additional data from local backups
   - [ ] Run full system verification tests
   - [ ] Communicate status to stakeholders
   - [ ] Document incident

---

## Quick Reference Commands

```bash
# Create backup
pg_dump $DATABASE_URL | gzip > backup_$(date +%Y%m%d).sql.gz

# List backups
ls -lah /backups/manual/

# Restore from backup
gunzip -c backup_20260527.sql.gz | psql $DATABASE_URL

# Test backup integrity
gzip -t backup_20260527.sql.gz

# Upload to S3
aws s3 cp backup_20260527.sql.gz s3://changeliberia-backups/

# Restore table only
pg_restore -t "TableName" backup.sql | psql $DATABASE_URL

# Check database size
psql $DATABASE_URL -c "SELECT pg_size_pretty(pg_database_size('postgres'));"
```

---

**Last Updated:** May 27, 2026
**Version:** 1.0
