# Redis Shared Instance Setup Guide

## Overview
This guide explains how to set up a shared Redis instance on DigitalOcean for both staging and production environments using database isolation.

## Architecture
- **Single Redis Droplet** ($6/month)
- **Database 0**: Production environment
- **Database 1**: Staging environment
- **Database 2**: Development/Local (optional)

## Step 1: Create Redis Droplet

### Option A: Manual Creation (Web Interface)
1. Go to [DigitalOcean Droplets](https://cloud.digitalocean.com/droplets/new)
2. Configure:
   - **Name**: `redis-shared`
   - **OS**: Ubuntu 24.04 LTS
   - **Plan**: Basic
   - **Size**: Regular - 1 GB / 1 vCPU / 25 GB SSD ($6/mo)
   - **Region**: Singapore 1 (SGP1) or same as your apps
   - **Additional**: Enable monitoring, Add SSH key
3. Create Droplet
4. Wait 2-3 minutes for provisioning
5. Note the droplet IP address

### Option B: Using doctl CLI
```bash
doctl compute droplet create redis-shared \
  --image ubuntu-24-04-x64 \
  --size s-1vcpu-1gb \
  --region sgp1 \
  --enable-monitoring \
  --ssh-keys <YOUR_SSH_KEY_ID> \
  --tag-names redis,shared,production,staging \
  --wait
```

## Step 2: Install Redis

Once you have the droplet IP, run:

```bash
# Test SSH connection
ssh root@<DROPLET_IP>

# Install Redis
cat scripts/install-redis.sh | ssh root@<DROPLET_IP> bash
```

**IMPORTANT**: Save the `REDIS_PASSWORD` shown at the end! You won't see it again.

## Step 3: Configure Firewall

After installation, restrict Redis access to only your backend IPs:

```bash
# SSH into the droplet
ssh root@<DROPLET_IP>

# Get your backend IPs (from DigitalOcean App Platform)
# For staging: Check app platform → ante-backend-staging → Settings
# For production: Check app platform → ante-backend-production → Settings

# Remove open access
sudo ufw delete allow 6379/tcp

# Allow only backend IPs
sudo ufw allow from <STAGING_IP> to any port 6379 comment 'Allow staging backend'
sudo ufw allow from <PRODUCTION_IP> to any port 6379 comment 'Allow production backend'

# Verify rules
sudo ufw status numbered
```

## Step 4: Update Backend Environment Variables

### For Staging (DigitalOcean App Platform)
Go to: Apps → ante-backend-staging → Settings → Environment Variables

Add/Update:
```
REDIS_HOST=<DROPLET_IP>
REDIS_PORT=6379
REDIS_PASSWORD=<PASSWORD_FROM_INSTALLATION>
REDIS_DB=1
```

### For Production (DigitalOcean App Platform)
Go to: Apps → ante-backend-production → Settings → Environment Variables

Add/Update:
```
REDIS_HOST=<DROPLET_IP>
REDIS_PORT=6379
REDIS_PASSWORD=<PASSWORD_FROM_INSTALLATION>
REDIS_DB=0
```

### For Local Development
Update `.env.local`:
```
REDIS_HOST=<DROPLET_IP>
REDIS_PORT=6379
REDIS_PASSWORD=<PASSWORD_FROM_INSTALLATION>
REDIS_DB=2
```

## Step 5: Deploy & Verify

1. **Deploy backend** (will pick up new env vars)
2. **Test connection**:
```bash
# From local machine
redis-cli -h <DROPLET_IP> -a <PASSWORD> -n 0 PING  # Production DB
redis-cli -h <DROPLET_IP> -a <PASSWORD> -n 1 PING  # Staging DB
```

3. **Monitor logs**:
```bash
# Check DigitalOcean app logs for:
# ✓ "Redis Main Client Connected"
# ✓ "Queue Redis Client Connected"
# ✗ No "max clients reached" errors
```

## Monitoring & Maintenance

### Check Redis Health
```bash
ssh root@<DROPLET_IP>

# General info
redis-cli -a <PASSWORD> INFO

# Memory usage
redis-cli -a <PASSWORD> INFO memory

# Connected clients
redis-cli -a <PASSWORD> CLIENT LIST

# Database sizes
redis-cli -a <PASSWORD> -n 0 DBSIZE  # Production
redis-cli -a <PASSWORD> -n 1 DBSIZE  # Staging
redis-cli -a <PASSWORD> -n 2 DBSIZE  # Development
```

### Clear Database (if needed)
```bash
# ⚠️ DANGER: This deletes ALL data in the database!
redis-cli -a <PASSWORD> -n 1 FLUSHDB  # Clear staging only
redis-cli -a <PASSWORD> -n 2 FLUSHDB  # Clear development only
# NEVER run FLUSHDB on database 0 (production)!
```

### Backup Redis Data
```bash
# Manual snapshot
redis-cli -a <PASSWORD> BGSAVE

# Copy dump file
scp root@<DROPLET_IP>:/var/lib/redis-stack/dump.rdb ./redis-backup-$(date +%Y%m%d).rdb
```

## Connection Limits
- **Free tier Redis Cloud**: ~10-30 connections
- **Self-hosted (1GB droplet)**: 10,000 connections (configurable)
- **Current usage per environment**: ~2-4 connections
- **Total expected**: ~4-8 connections (plenty of headroom)

## Cost Comparison
| Solution | Monthly Cost | Connections | Control |
|----------|-------------|-------------|---------|
| Redis Cloud (Free) | $0 | 10-30 | Limited |
| Redis Cloud (Paid) | $15+ | 256+ | Limited |
| Self-hosted (1GB) | $6 | 10,000 | Full |

## Troubleshooting

### "Connection refused"
- Check firewall: `sudo ufw status`
- Verify Redis is running: `systemctl status redis-stack-server`
- Check Redis config: `grep bind /etc/redis-stack.conf`

### "NOAUTH Authentication required"
- Verify `REDIS_PASSWORD` env var is set correctly
- Check password in Redis config: `grep requirepass /etc/redis-stack.conf`

### "ERR max number of clients reached"
- Shouldn't happen with self-hosted Redis
- Check: `redis-cli -a <PASSWORD> CONFIG GET maxclients`
- Increase if needed: `redis-cli -a <PASSWORD> CONFIG SET maxclients 20000`

### Socket.IO still 404
- Verify backend started successfully: Check app logs
- Test health endpoint: `curl https://backend-url/health`
- Check Socket.IO initialization in logs: Look for "SocketGateway afterInit"

## Security Best Practices
✓ Strong password (32+ characters)
✓ Firewall restricting to backend IPs only
✓ Redis bound to 0.0.0.0 but protected by firewall
✓ Regular backups
✓ Monitor connection count
✓ Separate databases for environments

## Next Steps
1. Set up automated backups (daily snapshots)
2. Monitor memory usage (alert at 80%)
3. Consider Redis replica for production (when scaling)
4. Set up CloudWatch/monitoring alerts
