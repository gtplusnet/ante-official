# Redis Setup - Next Steps

## Current Status ✓
- [x] Backend code updated to support `REDIS_DB` environment variable
- [x] Installation scripts created
- [x] Documentation written
- [x] Changes committed (not yet pushed)

## What You Need To Do Next

### Step 1: Create Redis Droplet (5 minutes)

Go to: https://cloud.digitalocean.com/droplets/new

**Configuration:**
- Name: `redis-shared`
- OS: Ubuntu 24.04 LTS
- Plan: Basic → Regular
- Size: **1 GB / 1 vCPU / 25 GB SSD** ($6/mo)
- Region: **Singapore 1** (SGP1) - same as your apps
- Additional options:
  - ✓ Enable monitoring
  - ✓ Add your SSH key
- Tags: `redis`, `shared`, `production`, `staging`

Click **Create Droplet** and wait 2-3 minutes.

### Step 2: Install Redis (2 minutes)

Once the droplet is ready, note its IP address, then run:

```bash
# From your local machine
cat scripts/install-redis.sh | ssh root@<DROPLET_IP> bash
```

**CRITICAL**: At the end of installation, you'll see:
```
REDIS_HOST: <DROPLET_IP>
REDIS_PORT: 6379
REDIS_PASSWORD: <LONG_RANDOM_STRING>
```

**Copy and save the password immediately!** You won't see it again.

### Step 3: Get Backend IPs (2 minutes)

You need to get the outbound IPs of your DigitalOcean backend apps:

1. Go to: https://cloud.digitalocean.com/apps
2. Click on **ante-backend-staging**
3. Go to **Settings** → Look for outbound IP or check logs for IP
4. Repeat for **ante-backend-production**

**Alternative method** (if IPs not shown in settings):
```bash
# Deploy current changes first, then check logs for connection attempts
# The Redis firewall logs will show the connecting IPs
ssh root@<DROPLET_IP>
tail -f /var/log/redis/redis-stack-server.log
```

### Step 4: Configure Firewall (3 minutes)

SSH into the Redis droplet and restrict access:

```bash
ssh root@<DROPLET_IP>

# Remove open access
sudo ufw delete allow 6379/tcp

# Add backend IPs only (replace with actual IPs)
sudo ufw allow from <STAGING_BACKEND_IP> to any port 6379 comment 'Staging backend'
sudo ufw allow from <PRODUCTION_BACKEND_IP> to any port 6379 comment 'Production backend'

# Verify
sudo ufw status numbered
```

### Step 5: Update Environment Variables (3 minutes)

#### For Staging:
1. Go to: https://cloud.digitalocean.com/apps → ante-backend-staging
2. **Settings** → **App-Level Environment Variables**
3. Add/Update these variables:

```
REDIS_HOST=<DROPLET_IP>
REDIS_PORT=6379
REDIS_PASSWORD=<PASSWORD_FROM_STEP_2>
REDIS_DB=1
```

4. Click **Save**

#### For Production (when ready):
1. Go to: https://cloud.digitalocean.com/apps → ante-backend-production
2. **Settings** → **App-Level Environment Variables**
3. Add/Update:

```
REDIS_HOST=<DROPLET_IP>
REDIS_PORT=6379
REDIS_PASSWORD=<PASSWORD_FROM_STEP_2>
REDIS_DB=0
```

4. Click **Save**

### Step 6: Push Changes & Deploy (5 minutes)

```bash
# Push the committed changes
git push

# This will trigger GitHub Actions deployment
# Wait for deployment to complete (~2-3 minutes)

# Monitor deployment
gh run watch --interval 5
```

### Step 7: Verify Everything Works (3 minutes)

#### Test Redis Connection:
```bash
# From your local machine
redis-cli -h <DROPLET_IP> -a <PASSWORD> -n 1 PING
# Should return: PONG

# Check staging database
redis-cli -h <DROPLET_IP> -a <PASSWORD> -n 1 DBSIZE
# Should return: (integer) 0 or some number
```

#### Check Backend Logs:
Go to: DigitalOcean Apps → ante-backend-staging → Runtime Logs

Look for:
- ✓ `Redis Main Client Connected`
- ✓ `Queue Redis Client Connected`
- ✗ **NO** "max clients reached" errors
- ✗ **NO** "NOAUTH" errors

#### Test Socket.IO:
```bash
curl https://ante-backend-staging-q6udd.ondigitalocean.app/socket.io/
```

Should return a Socket.IO handshake response (NOT 404).

## Quick Reference

### Redis Access
```bash
# SSH to droplet
ssh root@<DROPLET_IP>

# Check Redis status
systemctl status redis-stack-server

# Monitor logs
tail -f /var/log/redis/redis-stack-server.log

# Test connection
redis-cli -a <PASSWORD> PING

# Check database sizes
redis-cli -a <PASSWORD> -n 0 DBSIZE  # Production
redis-cli -a <PASSWORD> -n 1 DBSIZE  # Staging
```

### Troubleshooting

**"Connection refused"**
```bash
ssh root@<DROPLET_IP>
sudo ufw allow 6379/tcp  # Temporarily open
redis-cli -a <PASSWORD> PING  # Test locally
```

**"NOAUTH Authentication required"**
- Double-check `REDIS_PASSWORD` in DigitalOcean env vars
- Ensure no extra spaces or quotes

**Socket.IO still 404**
- Check backend logs for Redis connection errors
- Verify backend started successfully
- Test /health endpoint first

## Environment Variables Summary

| Variable | Staging | Production | Local Dev |
|----------|---------|------------|-----------|
| REDIS_HOST | \<DROPLET_IP\> | \<DROPLET_IP\> | \<DROPLET_IP\> |
| REDIS_PORT | 6379 | 6379 | 6379 |
| REDIS_PASSWORD | \<PASSWORD\> | \<PASSWORD\> | \<PASSWORD\> |
| REDIS_DB | 1 | 0 | 2 |

## Total Time: ~20-25 minutes

## Questions?

Check the detailed guide: [scripts/README-REDIS-SETUP.md](scripts/README-REDIS-SETUP.md)
