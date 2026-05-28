# Change Liberia - Production Monitoring & Alerts Setup
**Date**: May 28, 2026  
**Status**: ✅ Ready to Deploy

---

## Overview

This guide covers setting up comprehensive monitoring, alerting, and health checks for the Change Liberia platform in production.

---

## 1. Quick Start

### Run Post-Deployment Verification
```bash
bash scripts/verify-production-deployment.sh
```
This performs 10 comprehensive checks:
- ✅ API health endpoint
- ✅ API version endpoint
- ✅ Authentication service
- ✅ Frontend website
- ✅ Database connectivity
- ✅ Redis connectivity
- ✅ Email service (Resend)
- ✅ API response time
- ✅ SSL certificate validity
- ✅ Database migrations

### Set Up Monitoring Infrastructure
```bash
bash scripts/setup-monitoring.sh
```
This creates:
- Monitoring directories (`monitoring/alerts/`, `monitoring/logs/`, etc.)
- Health check scripts
- Performance monitoring scripts
- Alert configurations
- Logging setup

---

## 2. Monitoring Components

### 2.1 Health Checks
**Script**: `scripts/health-check.sh`

Automated health checks that verify:
- API endpoint responding (`/health`)
- Database connectivity
- Redis connectivity
- System resources

**Usage**:
```bash
bash scripts/health-check.sh
```

**Output**: `monitoring/logs/health-checks.log`

**Recommended Frequency**: Every 5 minutes (via cron)

---

### 2.2 Live Monitoring Dashboard
**Script**: `scripts/monitoring-dashboard.sh`

Real-time dashboard showing:
- API status and response time
- Database status and metrics (user count, petitions)
- Redis connectivity
- SSL certificate expiry

**Usage**:
```bash
bash scripts/monitoring-dashboard.sh
```

**Features**:
- Auto-refresh every 5 seconds
- Color-coded status indicators
- Real-time metrics
- Press Ctrl+C to exit

---

### 2.3 Performance Monitoring
**Script**: `scripts/performance-monitor.sh`

Measures and logs:
- API response time (10 samples, average)
- Database query execution time
- System performance metrics

**Usage**:
```bash
bash scripts/performance-monitor.sh
```

**Output**: `monitoring/logs/performance-metrics.log`

**Recommended Frequency**: Every hour (via cron)

---

## 3. Alert Configuration

### Location
`monitoring/alerts/alerts-config.json`

### Alert Types

#### 1. **API Down** (Critical)
- **Condition**: API health check fails
- **Retry**: 3 attempts, 30-second intervals
- **Notification**: Email + Slack

#### 2. **Database Connection Failed** (Critical)
- **Condition**: Database connection fails
- **Retry**: 3 attempts, 30-second intervals
- **Notification**: Email + Slack

#### 3. **Redis Connection Failed** (High)
- **Condition**: Redis connection fails
- **Retry**: 3 attempts, 30-second intervals
- **Notification**: Email + Slack

#### 4. **High API Response Time** (Medium)
- **Condition**: Response time > 3 seconds
- **Duration**: Alert if sustained for 5 minutes
- **Notification**: Email only

#### 5. **High Error Rate** (High)
- **Condition**: Error rate > 5%
- **Duration**: Alert if sustained for 10 minutes
- **Notification**: Slack

#### 6. **Low Disk Space** (High)
- **Condition**: Disk usage > 80%
- **Notification**: Email + Slack

### Configuration Steps

1. **Add Slack Webhook URL**:
   ```bash
   # Open monitoring/alerts/alerts-config.json
   # Replace "https://hooks.slack.com/services/YOUR/WEBHOOK/URL" with your webhook
   ```

2. **Set Alert Email Addresses**:
   ```json
   "email": "ops@changeliberia.org"
   ```

3. **Adjust Thresholds** (if needed):
   ```json
   "threshold": 3000  // milliseconds for response time
   ```

---

## 4. Logging Setup

### Locations
- **App Logs**: `monitoring/logs/app.log`
- **Error Logs**: `monitoring/logs/error.log`
- **Access Logs**: `monitoring/logs/access.log`
- **Health Checks**: `monitoring/logs/health-checks.log`
- **Performance Metrics**: `monitoring/logs/performance-metrics.log`

### Log Rotation
- **Enabled**: Daily rotation
- **Max Size**: 100MB per file
- **Retention**: 30 days
- **Format**: JSON for structured logging

---

## 5. Setting Up Automated Monitoring

### Option A: Using Cron Jobs

1. **Open crontab**:
```bash
crontab -e
```

2. **Add health check** (every 5 minutes):
```cron
*/5 * * * * cd /Users/visionalventure/Change\ Liberia && bash scripts/health-check.sh >> monitoring/logs/cron.log 2>&1
```

3. **Add performance monitoring** (every hour):
```cron
0 * * * * cd /Users/visionalventure/Change\ Liberia && bash scripts/performance-monitor.sh >> monitoring/logs/cron.log 2>&1
```

4. **Add database backup check** (daily at 2 AM):
```cron
0 2 * * * cd /Users/visionalventure/Change\ Liberia && bash scripts/db-backup-check.sh >> monitoring/logs/cron.log 2>&1
```

### Option B: Using Systemd (Linux/Server)

1. **Create service file** `/etc/systemd/system/changeliberia-monitor.service`:
```ini
[Unit]
Description=Change Liberia Health Monitor
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/changeliberia
ExecStart=/bin/bash scripts/health-check.sh
Restart=always
RestartSec=300

[Install]
WantedBy=multi-user.target
```

2. **Enable and start**:
```bash
sudo systemctl enable changeliberia-monitor
sudo systemctl start changeliberia-monitor
```

---

## 6. External Monitoring Services

### 6.1 UptimeRobot
**Purpose**: Monitor API availability

**Setup**:
1. Go to https://uptimerobot.com
2. Add monitor for: `https://api.changeliberia.org/health`
3. Set check interval: 5 minutes
4. Add alert contact (email/Slack)

**Configuration**:
```
Monitor Type: HTTP(s)
URL: https://api.changeliberia.org/health
Expected Response: 200 OK
Check Interval: 5 minutes
Alert Contacts: support@changeliberia.org
```

---

### 6.2 Datadog
**Purpose**: Advanced metrics, logs, and APM

**Setup**:
1. Create Datadog account
2. Install Datadog agent:
```bash
DD_AGENT_MAJOR_VERSION=7 DD_API_KEY=<YOUR_KEY> \
DD_SITE="datadoghq.com" bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_mac_os.sh)"
```

3. Configure API monitoring:
```yaml
init_config:
    default_timeout: 10

instances:
    - name: Change Liberia API Health
      url: https://api.changeliberia.org/health
      method: GET
      timeout: 10
```

**Benefits**:
- Real-time performance metrics
- Automatic anomaly detection
- Distributed tracing
- Custom dashboards

---

### 6.3 PagerDuty
**Purpose**: Alert escalation and on-call management

**Setup**:
1. Create PagerDuty account
2. Create service for "Change Liberia API"
3. Configure escalation policy
4. Add integrations to Slack/Email

**Escalation Example**:
```
Level 1: Email to ops@changeliberia.org (5 min)
Level 2: Slack notification (5 min)
Level 3: SMS to on-call engineer (immediate)
Level 4: Phone call (escalate if critical)
```

---

## 7. Custom Dashboards

### 7.1 Real-Time Dashboard
**Command**:
```bash
bash scripts/monitoring-dashboard.sh
```

**Shows**:
- API status and response time
- Database metrics
- Redis status
- SSL certificate info

### 7.2 Grafana Dashboard
**Setup** (if using Prometheus):
1. Add data source (Prometheus)
2. Create dashboard with panels:
   - Request rate
   - Response time percentiles
   - Error rate
   - Database connections
   - Memory usage

---

## 8. Alert Response Procedures

### 8.1 API Down Alert
**Response Steps**:
1. Check API logs: `tail -f monitoring/logs/error.log`
2. Verify server status on Railway dashboard
3. Check database connectivity
4. Restart API service if needed
5. Check deployment status on GitHub

---

### 8.2 Database Connection Failed
**Response Steps**:
1. Verify DATABASE_URL in production environment
2. Check PostgreSQL service status
3. Verify network connectivity to RDS/Railway
4. Check firewall rules
5. Review database logs

---

### 8.3 High Response Time
**Response Steps**:
1. Check server load: `top` / Activity Monitor
2. Check database query performance
3. Review recent deployments
4. Check Redis cache status
5. Monitor network latency

---

## 9. Maintenance Tasks

### Daily
- Review error logs for patterns
- Check alert notifications
- Monitor API response times

### Weekly
- Review performance trends
- Check disk space usage
- Verify backup status
- Review security alerts

### Monthly
- Rotate old logs (automated)
- Review monitoring alerts effectiveness
- Update alert thresholds based on trends
- Conduct disaster recovery drill

---

## 10. Performance Baselines

### Expected Performance
| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| API Response Time | < 200ms | > 1000ms | > 3000ms |
| Error Rate | < 0.1% | > 1% | > 5% |
| Database Query Time | < 50ms | > 500ms | > 2000ms |
| Redis Response Time | < 10ms | > 100ms | > 500ms |
| CPU Usage | < 50% | > 70% | > 85% |
| Memory Usage | < 60% | > 80% | > 90% |
| Disk Usage | < 60% | > 80% | > 90% |

---

## 11. Troubleshooting

### Script Issues

**"Permission Denied"**:
```bash
chmod +x scripts/*.sh
```

**"Command not found" (curl/psql)**:
```bash
# Install missing tools
brew install curl postgresql  # macOS
apt-get install curl postgresql-client  # Ubuntu
```

**Database Connection Failed**:
```bash
# Verify DATABASE_URL
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1;"
```

**Redis Connection Failed**:
```bash
# Verify REDIS_URL
echo $REDIS_URL

# Test connection
redis-cli -u $REDIS_URL ping
```

---

## 12. Deployment Checklist

Before declaring production deployment complete:

- [ ] Run `verify-production-deployment.sh` - all tests pass
- [ ] Run `setup-monitoring.sh` - all components created
- [ ] Set up cron jobs for automated monitoring
- [ ] Configure Slack webhook for alerts
- [ ] Add UptimeRobot monitoring
- [ ] Review alert configurations
- [ ] Verify logging is working
- [ ] Conduct load testing if needed
- [ ] Document on-call procedures
- [ ] Notify team of production status

---

## 13. Contact & Support

**On-Call**: [ops@changeliberia.org](mailto:ops@changeliberia.org)  
**Escalation**: [support@changeliberia.org](mailto:support@changeliberia.org)  
**Slack Channel**: #change-liberia-ops

---

## 14. Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Resend Email Service](https://resend.com/docs)
- [PostgreSQL Monitoring](https://www.postgresql.org/docs/current/monitoring.html)
- [Redis Monitoring](https://redis.io/docs/management/monitoring/)
- [UptimeRobot Setup](https://docs.uptimerobot.com)
- [Datadog APM](https://docs.datadoghq.com/tracing/)

---

**Last Updated**: May 28, 2026  
**Version**: 1.0  
**Status**: Production Ready ✅
