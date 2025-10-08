# Deployment Documentation

## Overview

This guide covers the deployment process for the GEER-ANTE ERP backend across different environments including staging and production. The application can be deployed using traditional server deployment with PM2 or containerized deployment with Docker.

## Deployment Environments

### Environment Overview

| Environment | Infrastructure | URL | Purpose |
|------------|----------------|-----|---------|
| Development | Local | http://localhost:3000 | Local development |
| Staging | DigitalOcean App Platform | https://ante-backend-staging-q6udd.ondigitalocean.app | Testing and QA |
| Production | DigitalOcean App Platform | https://ante-backend-production-gael2.ondigitalocean.app | Live system |

**Note**: Old server-based deployments have been migrated to DigitalOcean App Platform (Docker containers). See Migration section below.

## Pre-Deployment Checklist

### Before Every Deployment

- [ ] All tests pass locally (`yarn test:all`)
- [ ] Code reviewed and approved
- [ ] Database migrations created and tested
- [ ] Environment variables updated
- [ ] Documentation updated
- [ ] No console.log statements in code
- [ ] Security vulnerabilities checked
- [ ] Performance impact assessed
- [ ] Rollback plan prepared

## Current Deployment Method (DigitalOcean App Platform)

### Overview

**Current deployment uses GitHub Actions + DigitalOcean App Platform:**
- ✅ Automated CI/CD via GitHub workflows
- ✅ Docker containers (GHCR registry)
- ✅ Staging and Production environments
- ✅ Automatic deployments on push to `main` (staging) or `production` branches

### Deployment Process

1. **Push to GitHub**
   ```bash
   # For staging
   git push origin main

   # For production
   git push origin production
   ```

2. **GitHub Actions Workflow**
   - Detects changes in backend/
   - Builds Docker image
   - Pushes to GitHub Container Registry (GHCR)
   - Triggers DigitalOcean deployment

3. **Monitor Deployment**
   ```bash
   # View workflow status
   gh run list --limit 5

   # Watch specific run
   gh run watch <run-id>
   ```

### Manual Deployment Trigger

```bash
# Trigger staging deployment
gh workflow run deploy.yml --ref main

# Trigger production deployment
gh workflow run deploy-production.yml --ref production
```

### DigitalOcean App Platform URLs

**Staging:**
- App ID: `c65a4023-4aa4-40c4-92e4-b9b89bb0b4dd`
- URL: https://ante-backend-staging-q6udd.ondigitalocean.app
- Dashboard: https://cloud.digitalocean.com/apps/c65a4023-4aa4-40c4-92e4-b9b89bb0b4dd

**Production:**
- App ID: `7d280155-6063-4dbd-b7ac-31f48a4cf97c`
- URL: https://ante-backend-production-gael2.ondigitalocean.app
- Dashboard: https://cloud.digitalocean.com/apps/7d280155-6063-4dbd-b7ac-31f48a4cf97c

---

## Legacy Deployment Methods (Reference Only)

**⚠️ NOTE**: The sections below document old deployment methods using PM2 on dedicated servers. These servers have been decommissioned:
- Old Staging Server: 157.230.246.107 (Only Redis remains)
- Old Production Server: 178.128.49.38 ❌ **DELETED**

### Traditional Deployment (PM2) - DEPRECATED

**This method is no longer used but documented for reference.**

5. **Install production dependencies**
   ```bash
   yarn install --production
   ```

6. **Run database migrations**
   ```bash
   NODE_ENV=production npx prisma migrate deploy
   ```

7. **Build the application**
   ```bash
   yarn build
   ```

8. **Restart PM2 with zero downtime**
   ```bash
   pm2 reload backend
   ```

9. **Verify deployment**
   ```bash
   pm2 status
   pm2 logs backend --lines 100
   curl https://api.ante.ph/health
   ```

### PM2 Configuration

Create `ecosystem.config.js` in project root:

```javascript
module.exports = {
  apps: [{
    name: 'backend',
    script: './dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 4000,
    kill_timeout: 5000
  }]
};
```

### PM2 Commands

```bash
# Start application
pm2 start ecosystem.config.js

# View status
pm2 status

# View logs
pm2 logs backend
pm2 logs backend --lines 100

# Monitor resources
pm2 monit

# Restart application
pm2 restart backend

# Reload with zero downtime
pm2 reload backend

# Stop application
pm2 stop backend

# Delete from PM2
pm2 delete backend

# Save current process list
pm2 save

# Resurrect saved process list
pm2 resurrect
```

## Docker Deployment

### Building Docker Images

```bash
# Development image
docker build --target development -t ante-backend:dev .

# Production image
docker build --target production -t ante-backend:latest .

# Tag for registry
docker tag ante-backend:latest registry.ante.ph/backend:latest
```

### Running with Docker

#### Development Mode

```bash
docker run -d \
  --name ante-backend-dev \
  -p 3000:3000 \
  -p 4000:4000 \
  -v $(pwd):/app \
  -v /app/node_modules \
  --env-file .env.development \
  ante-backend:dev
```

#### Production Mode

```bash
docker run -d \
  --name ante-backend \
  -p 3000:3000 \
  -p 4000:4000 \
  --env-file .env.production \
  --restart unless-stopped \
  ante-backend:latest
```

### Docker Compose Deployment

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  backend:
    image: ante-backend:latest
    container_name: ante-backend
    ports:
      - "3000:3000"
      - "4000:4000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    depends_on:
      - postgres
      - mongodb
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  postgres:
    image: postgres:14-alpine
    container_name: ante-postgres
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ante_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  mongodb:
    image: mongo:6
    container_name: ante-mongodb
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: ante-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
  mongo_data:
```

Deploy with Docker Compose:

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## Nginx Configuration

### Reverse Proxy Setup

Create `/etc/nginx/sites-available/ante-backend`:

```nginx
upstream backend {
    server localhost:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name api.ante.ph;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.ante.ph;

    ssl_certificate /etc/letsencrypt/live/api.ante.ph/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.ante.ph/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    client_max_body_size 50M;
    
    # API endpoints
    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # WebSocket support
    location /socket.io/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://backend/health;
        access_log off;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/ante-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## SSL Certificate Setup

### Using Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d api.ante.ph

# Auto-renewal
sudo certbot renew --dry-run
```

## Environment Variables

### Production Environment Variables

```env
# Server
NODE_ENV=production
PORT=3000
SOCKET_PORT=4000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ante_production
MONGODB_URI=mongodb://localhost:27017/ante_production

# Security
JWT_SECRET=production-secret-key-change-this
BCRYPT_ROUNDS=12

# AWS
AWS_ACCESS_KEY_ID=production-key
AWS_SECRET_ACCESS_KEY=production-secret
AWS_S3_BUCKET=ante-production

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@ante.ph
SMTP_PASS=production-password

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
NEW_RELIC_LICENSE_KEY=your-new-relic-key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Database Management

### Backup Strategy

#### Automated Backups

Create backup script `/home/jdev/scripts/backup.sh`:

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/home/jdev/backups"
DB_NAME="ante_db"
DB_USER="ante_user"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/postgres_$DATE.sql.gz

# Backup MongoDB (if used)
mongodump --archive=$BACKUP_DIR/mongo_$DATE.archive --gzip

# Backup application files
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /home/jdev/ante/backend

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR/postgres_$DATE.sql.gz s3://ante-backups/
aws s3 cp $BACKUP_DIR/mongo_$DATE.archive s3://ante-backups/
aws s3 cp $BACKUP_DIR/app_$DATE.tar.gz s3://ante-backups/

# Clean old backups
find $BACKUP_DIR -type f -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $DATE"
```

Schedule with cron:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /home/jdev/scripts/backup.sh >> /home/jdev/logs/backup.log 2>&1
```

### Database Migrations

#### Production Migration Process

1. **Test migration locally**
   ```bash
   npx prisma migrate dev --name migration_name
   ```

2. **Test on staging**
   ```bash
   ssh jdev@157.230.246.107
   cd /home/jdev/ante/backend
   npx prisma migrate deploy
   ```

3. **Deploy to production**
   ```bash
   ssh jdev@178.128.49.38
   cd /home/jdev/ante/backend
   
   # Backup database first
   pg_dump ante_db > backup_before_migration.sql
   
   # Run migration
   NODE_ENV=production npx prisma migrate deploy
   ```

### Rollback Procedures

#### Application Rollback

```bash
# Connect to server
ssh jdev@server-ip

# Revert to previous commit
cd /home/jdev/ante/backend
git log --oneline -10  # Find previous commit
git checkout <previous-commit-hash>

# Rebuild and restart
yarn install --production
yarn build
pm2 restart backend
```

#### Database Rollback

```bash
# Restore from backup
psql -U ante_user ante_db < backup_before_migration.sql

# Or use Prisma migration rollback (if supported)
npx prisma migrate resolve --rolled-back
```

## Monitoring and Logging

### Application Monitoring

#### PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# Web-based monitoring
pm2 install pm2-web
pm2 web
```

#### Health Checks

```bash
# Simple health check
curl https://api.ante.ph/health

# Detailed health check
curl https://api.ante.ph/health/detailed
```

### Log Management

#### Application Logs

```bash
# View PM2 logs
pm2 logs backend

# View specific log files
tail -f /home/jdev/ante/backend/logs/error.log
tail -f /home/jdev/ante/backend/logs/global.log

# Search logs
grep "ERROR" /home/jdev/ante/backend/logs/error.log
```

#### Log Rotation

Create `/etc/logrotate.d/ante-backend`:

```
/home/jdev/ante/backend/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 jdev jdev
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### Performance Monitoring

#### Using PM2 Plus

```bash
# Link to PM2 Plus
pm2 link <secret_key> <public_key>

# Monitor metrics
pm2 install pm2-server-monit
pm2 install pm2-auto-pull
```

## Scaling Strategies

### Horizontal Scaling with PM2

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'backend',
    script: './dist/main.js',
    instances: 'max',  // Use all CPU cores
    exec_mode: 'cluster',
    // ... other config
  }]
};
```

### Load Balancing

#### Using Nginx

```nginx
upstream backend_cluster {
    least_conn;
    server localhost:3001;
    server localhost:3002;
    server localhost:3003;
    server localhost:3004;
    keepalive 64;
}
```

## Security Hardening

### Server Security

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Configure firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Fail2ban for SSH protection
sudo apt install fail2ban
sudo systemctl enable fail2ban

# Disable root SSH
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart sshd
```

### Application Security

```bash
# Set proper file permissions
chmod 600 .env.production
chmod 755 /home/jdev/ante/backend

# Use environment variables for secrets
export DATABASE_PASSWORD=$(cat /etc/secrets/db_password)
```

## Troubleshooting Deployment

### Common Issues

1. **Application won't start**
   ```bash
   # Check logs
   pm2 logs backend --lines 100
   
   # Check process status
   pm2 status
   
   # Verify port availability
   sudo lsof -i :3000
   ```

2. **Database connection issues**
   ```bash
   # Test connection
   psql -U ante_user -h localhost -d ante_db
   
   # Check PostgreSQL status
   sudo systemctl status postgresql
   
   # View PostgreSQL logs
   sudo tail -f /var/log/postgresql/postgresql-*.log
   ```

3. **Nginx issues**
   ```bash
   # Test configuration
   sudo nginx -t
   
   # Check logs
   sudo tail -f /var/log/nginx/error.log
   sudo tail -f /var/log/nginx/access.log
   ```

4. **Memory issues**
   ```bash
   # Check memory usage
   free -h
   
   # Check PM2 memory usage
   pm2 status
   
   # Increase Node.js memory
   pm2 start app.js --node-args="--max-old-space-size=2048"
   ```

## Deployment Scripts

### Complete Deployment Script

Create `deploy.sh`:

```bash
#!/bin/bash

set -e

# Configuration
ENV=$1
if [ "$ENV" != "staging" ] && [ "$ENV" != "production" ]; then
    echo "Usage: ./deploy.sh [staging|production]"
    exit 1
fi

if [ "$ENV" = "staging" ]; then
    SERVER="jdev@157.230.246.107"
    BRANCH="develop"
else
    SERVER="jdev@178.128.49.38"
    BRANCH="main"
fi

echo "Deploying to $ENV..."

# Deploy
ssh $SERVER << EOF
    cd /home/jdev/ante/backend
    
    # Backup
    pg_dump ante_db > backup_$(date +%Y%m%d_%H%M%S).sql
    
    # Update code
    git fetch origin
    git checkout $BRANCH
    git pull origin $BRANCH
    
    # Install dependencies
    yarn install --production
    
    # Run migrations
    NODE_ENV=$ENV npx prisma migrate deploy
    
    # Build application
    yarn build
    
    # Restart
    pm2 reload backend
    
    # Verify
    pm2 status
    curl http://localhost:3000/health
EOF

echo "Deployment to $ENV completed!"
```

## Post-Deployment Verification

### Verification Checklist

- [ ] Application is running (`pm2 status`)
- [ ] Health check passes (`curl /health`)
- [ ] Database connections work
- [ ] API endpoints respond correctly
- [ ] WebSocket connections work
- [ ] File uploads work
- [ ] Email sending works
- [ ] Background jobs are running
- [ ] Logs show no critical errors
- [ ] Performance metrics are normal

### Smoke Tests

```bash
# Run smoke tests
curl -X POST https://api.ante.ph/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'

# Check critical endpoints
curl https://api.ante.ph/health
curl https://api.ante.ph/api/version
```

## Rollback Plan

### Emergency Rollback Procedure

1. **Notify team** about the rollback
2. **Stop current deployment**
   ```bash
   pm2 stop backend
   ```
3. **Restore previous version**
   ```bash
   git checkout <previous-version-tag>
   yarn install --production
   yarn build
   ```
4. **Restore database if needed**
   ```bash
   psql ante_db < backup_before_deployment.sql
   ```
5. **Restart application**
   ```bash
   pm2 start backend
   ```
6. **Verify rollback**
7. **Document issues** for post-mortem