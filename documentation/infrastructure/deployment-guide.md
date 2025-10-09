# Deployment Guide - ANTE ERP

## 📋 Overview

The ANTE ERP system uses a modern CI/CD pipeline with GitHub Actions, DigitalOcean App Platform for backend hosting, and Vercel for frontend hosting.

### Infrastructure Stack
- **Backend Hosting**: DigitalOcean App Platform (Docker containers)
- **Frontend Hosting**: Vercel
- **Container Registry**: GitHub Container Registry (GHCR)
- **CI/CD**: GitHub Actions with self-hosted runners (3 concurrent on local PC)
- **Cache/Queue**: DigitalOcean Managed Valkey (Redis-compatible, shared cluster)
- **Notifications**: Telegram

### Branch Strategy
- `main` → **Staging** environment (Vercel Preview)
- `production` → **Production** environment (Vercel Production)

### Vercel Environment Architecture
**Environment-Based Deployment** (3 projects, 2 environments each):
- Each Vercel project supports both **Production** and **Preview** environments
- Environment variables configured separately for each environment in Vercel dashboard
- Custom domains assigned per environment:
  - **Preview** (main branch): *.geertest.com domains
  - **Production** (production branch): ante.ph domains
- No environment file copying needed - Vercel injects variables at build time

---

## 🌍 Environments

### Staging Environment

**Branch**: `main`

**Backend:**
- App Name: `ante-backend-staging`
- App ID: `c65a4023-4aa4-40c4-92e4-b9b89bb0b4dd`
- URL: https://ante-backend-staging-q6udd.ondigitalocean.app
- Docker Image: `ghcr.io/gtplusnet/ante-backend-staging:latest`

**Frontends (Vercel):**
- **Main ERP**:
  - Project: `ante-main`
  - Project ID: `prj_96zz5i9lKcdV7MlYcQD2fCRyXgD3`
  - Environment: Preview (main branch)
  - URL: https://ante.geertest.com

- **Gate App**:
  - Project: `ante-gate`
  - Project ID: `prj_dgxFqGSheEXelIUCTOlV4aT1oB9d`
  - Environment: Preview (main branch)
  - URL: https://ante-gate.geertest.com

- **Guardian App**:
  - Project: `ante-guardian`
  - Project ID: `prj_3p2gtMLxAz25siKsyEyLbb5p9dBa`
  - Environment: Preview (main branch)
  - URL: https://ante-guardian.geertest.com

**Databases:**
- PostgreSQL: Supabase (ofnmfmwywkhosrmycltb.supabase.co)
- MongoDB: Local dev or Atlas (`ante-staging` database)
- Valkey: DigitalOcean Managed (DB 1, shared with production)

---

### Production Environment

**Branch**: `production`

**Backend:**
- App Name: `ante-backend-production`
- App ID: `7d280155-6063-4dbd-b7ac-31f48a4cf97c`
- URL: https://ante-backend-production-gael2.ondigitalocean.app
- Docker Image: `ghcr.io/gtplusnet/ante-backend-production:latest`

**Frontends (Vercel):**
- **Main ERP**:
  - Project: `ante-main`
  - Project ID: `prj_96zz5i9lKcdV7MlYcQD2fCRyXgD3`
  - Environment: Production (production branch)
  - URL: https://ante.ph

- **Gate App**:
  - Project: `ante-gate`
  - Project ID: `prj_dgxFqGSheEXelIUCTOlV4aT1oB9d`
  - Environment: Production (production branch)
  - URL: https://gate.ante.ph

- **Guardian App**:
  - Project: `ante-guardian`
  - Project ID: `prj_3p2gtMLxAz25siKsyEyLbb5p9dBa`
  - Environment: Production (production branch)
  - URL: https://guardian.ante.ph

**Databases:**
- PostgreSQL: Supabase (ccdlrujemqfwclogysjv.supabase.co)
- MongoDB: MongoDB Atlas (`ante-production` database)
- Valkey: DigitalOcean Managed (DB 0, shared with staging)

---

## 🚀 Deployment Workflows

### Staging Deployment (`.github/workflows/deploy.yml`)

**Trigger**: Push to `main` branch

**Process**:
1. **Change Detection**: Detects which components changed
   - Backend: `backend/**`
   - Frontend Main: `frontends/frontend-main/**`
   - Gate App: `frontends/frontend-gate-app/**`
   - Guardian App: `frontends/frontend-guardian-app/**`

2. **Backend Deployment** (if backend changed):
   - Build Docker image with production-alpine target
   - Tag: `ghcr.io/gtplusnet/ante-backend-staging:latest` and `ghcr.io/gtplusnet/ante-backend-staging:main-{sha}`
   - Push to GitHub Container Registry
   - Trigger DigitalOcean deployment via API

3. **Frontend Deployments** (if frontend changed):
   - Deploy to Vercel Preview: `npx vercel --token=$VERCEL_TOKEN --yes`
   - Environment variables injected by Vercel from Preview environment
   - Each frontend deploys independently

4. **Notifications**:
   - Start notification via Telegram
   - End notification with deployment results

**Manual Trigger**:
```bash
gh workflow run deploy.yml --ref main
```

---

### Production Deployment (`.github/workflows/deploy-production.yml`)

**Trigger**: Push to `production` branch

**Process**: Same as staging but with:
- Docker image: `ghcr.io/gtplusnet/ante-backend-production:latest`
- Deploy to Vercel Production: `npx vercel --prod --token=$VERCEL_TOKEN --yes`
- Environment variables injected by Vercel from Production environment
- Different DigitalOcean app ID (same Vercel project IDs, different environment)

**Manual Trigger**:
```bash
gh workflow run deploy-production.yml --ref production
```

**⚠️ IMPORTANT**: When manually triggered, ALL components are deployed (not just changed ones).

---

## 🤖 GitHub Actions Runners

### Self-Hosted Runners
**Location**: Local development PC (jhay-B450M-DS3H-V2)
**Count**: 3 concurrent runners
**Labels**: `self-hosted`, `staging`

**Runner Names**:
- `local-staging-runner`
- `local-staging-runner-2`
- `local-staging-runner-3`

**Health Monitoring**:
- Automated health checks every 5 minutes via systemd timer
- Auto-restart on failures
- Telegram alerts for issues and recoveries
- Status dashboard: `~/projects/ante-official/scripts/check-runner-status.sh`

**Systemd Services**:
```bash
# Check runner status
sudo systemctl status 'actions.runner.gtplusnet-ante-official.local-staging-runner*.service'

# View health monitor timer
systemctl list-timers runner-health-monitor.timer

# Manual health check
~/projects/ante-official/scripts/runner-health-check.sh

# View runner status dashboard
~/projects/ante-official/scripts/check-runner-status.sh
```

**Features**:
- ✅ 3 concurrent workflow execution
- ✅ Automated health monitoring
- ✅ Auto-recovery on failures
- ✅ Telegram notifications
- ✅ Daily health reports

**Note**: All staging and production deployments run on these local runners. Ensure PC is online for deployments to succeed.

---

## 🔧 Configuration

### GitHub Secrets

All secrets configured at: https://github.com/gtplusnet/ante-official/settings/secrets/actions

**Vercel:**
- `VERCEL_TOKEN`: Vercel deployment token
- `VERCEL_ORG_ID`: Team organization ID
- **Project IDs** (used by both staging and production workflows):
  - `VERCEL_PROJECT_ID_FRONTEND_MAIN`: Main ERP project
  - `VERCEL_PROJECT_ID_GATE_APP`: Gate app project
  - `VERCEL_PROJECT_ID_GUARDIAN_APP`: Guardian app project
- **Note**: Same project IDs used for both environments (Vercel manages environments internally)

**DigitalOcean:**
- `DO_API_TOKEN`: DigitalOcean API token
- `DO_APP_ID_STAGING`: Staging backend app ID
- `DO_APP_ID_PRODUCTION`: Production backend app ID

**Telegram:**
- `TELEGRAM_BOT_TOKEN`: Telegram bot token for notifications
- `TELEGRAM_CHAT_ID`: Telegram chat ID for notifications

**GitHub:**
- `GITHUB_TOKEN`: Auto-provided by GitHub Actions

---

## 🗄️ Valkey Configuration

### DigitalOcean Managed Valkey
**Cluster ID**: `4265fffc-c521-4898-8c02-7f04ead68b1b`
**Plan**: Dev DB (1 GiB RAM, $15/month)
**Region**: Singapore (sgp1)
**Version**: Valkey 8.0 (Redis-compatible)
**TLS**: Enabled (rediss:// protocol)

**Connection Details**:
- **Host**: `ante-valkey-shared-do-user-6685298-0.e.db.ondigitalocean.com`
- **Port**: `25061`
- **TLS**: Required (`rediss://` protocol)

**Database Isolation**:
- **DB 0**: Production environment
- **DB 1**: Staging environment

**Environment Variables** (DigitalOcean App Platform):

Staging:
```env
REDIS_HOST=ante-valkey-shared-do-user-6685298-0.e.db.ondigitalocean.com
REDIS_PORT=25061
REDIS_PASSWORD={valkey_password}
REDIS_DB=1
REDIS_TLS=true
```

Production:
```env
REDIS_HOST=ante-valkey-shared-do-user-6685298-0.e.db.ondigitalocean.com
REDIS_PORT=25061
REDIS_PASSWORD={valkey_password}
REDIS_DB=0
REDIS_TLS=true
```

**Migration Note**: Migrated from self-hosted Redis (157.230.246.107) on 2025-10-08. Utility server decommissioned.

---

## 📝 Environment Configuration

### Vercel Environment Variables

Environment variables are configured in the Vercel dashboard for each project and environment. **No environment files are copied during deployment** - Vercel injects these variables at build time.

**Configuration Location**: Vercel Dashboard → Project Settings → Environment Variables

**Preview Environment** (main branch → staging):
```env
ENVIRONMENT=staging
WHITELABEL=ante
API_URL=https://ante-backend-staging-q6udd.ondigitalocean.app
VITE_SOCKET_URL=https://ante-backend-staging-q6udd.ondigitalocean.app
VITE_SUPABASE_URL=https://ofnmfmwywkhosrmycltb.supabase.co
VITE_SUPABASE_ANON_KEY={staging_anon_key}
API_DELAY=0
VITE_GOOGLE_CLIENT_ID={google_client_id}
VITE_FACEBOOK_APP_ID={facebook_app_id}
```

**Production Environment** (production branch):
```env
ENVIRONMENT=production
WHITELABEL=ante
API_URL=https://ante-backend-production-gael2.ondigitalocean.app
VITE_SOCKET_URL=https://ante-backend-production-gael2.ondigitalocean.app
VITE_SUPABASE_URL=https://ccdlrujemqfwclogysjv.supabase.co
VITE_SUPABASE_ANON_KEY={production_anon_key}
API_DELAY=0
VITE_GOOGLE_CLIENT_ID={google_client_id}
VITE_FACEBOOK_APP_ID={facebook_app_id}
```

**How It Works**:
1. GitHub Actions triggers Vercel deployment (with or without `--prod` flag)
2. Vercel automatically selects environment based on:
   - `--prod` flag → Production environment
   - No `--prod` flag → Preview environment
3. Vercel injects environment variables during build
4. Application built with correct environment variables

### Backend Environment Variables

Configured in DigitalOcean App Platform dashboard:
- Database connections (PostgreSQL, MongoDB, Redis)
- JWT secrets
- API keys (OpenAI, Gemini, etc.)
- CORS origins
- SMTP configuration
- Third-party service credentials

**Access**:
- Staging: https://cloud.digitalocean.com/apps/c65a4023-4aa4-40c4-92e4-b9b89bb0b4dd
- Production: https://cloud.digitalocean.com/apps/7d280155-6063-4dbd-b7ac-31f48a4cf97c

---

## 🔍 Monitoring Deployments

### Via GitHub Actions

```bash
# List recent workflow runs
gh run list --workflow=deploy.yml --limit 5
gh run list --workflow=deploy-production.yml --limit 5

# View specific run
gh run view <run-id>

# Watch run in real-time
gh run watch <run-id>
```

### Via DigitalOcean

**Staging**: https://cloud.digitalocean.com/apps/c65a4023-4aa4-40c4-92e4-b9b89bb0b4dd
**Production**: https://cloud.digitalocean.com/apps/7d280155-6063-4dbd-b7ac-31f48a4cf97c

View:
- Build logs
- Runtime logs
- Health check status
- Metrics (CPU, Memory, Network)

### Via Vercel

**Dashboard**: https://vercel.com/ante-73eb5469

View:
- Deployment history
- Build logs
- Runtime logs
- Analytics

### Via Telegram

Deployment notifications sent to configured Telegram channel with:
- Deployment start
- Component-by-component status
- Deployment URLs
- Overall result

---

## 🐛 Troubleshooting

### Backend Deployment Fails

**Check**:
1. GitHub Container Registry (GHCR) for image build status
2. DigitalOcean build logs for deployment errors
3. Environment variables in DigitalOcean dashboard
4. Health check endpoint: `/health`

**Common Issues**:
- Docker build failure: Check `backend/Dockerfile` and `backend/.dockerignore`
- Missing environment variables: Verify all required vars are set in DO
- Database connection issues: Check connection strings and firewall rules

### Frontend Deployment Fails

**Check**:
1. Vercel build logs
2. Environment file exists and is correct
3. `rootDirectory` is NOT set in Vercel project settings
4. Vercel project ID matches in GitHub secrets

**Common Issues**:
- Path not found: Check workflow `cd` command and Vercel `rootDirectory`
- Build errors: Check `package.json` and build command
- Environment variables: Ensure `.env` file is copied correctly

### Health Check Failures

**Backend Health Endpoint**: `{backend_url}/health`

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2025-10-06T12:00:00.000Z",
  "uptime": 3600,
  "database": "connected",
  "redis": "connected"
}
```

**Troubleshooting**:
- Database connection: Verify DATABASE_URL and DIRECT_URL
- Redis connection: Check REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
- Application errors: Check runtime logs in DigitalOcean

---

## 📊 Deployment Checklist

### Before Deploying to Production

- [ ] All tests passing on staging
- [ ] Database migrations applied and tested on staging
- [ ] Environment variables verified in production
- [ ] CORS origins include production frontend URLs
- [ ] Sentry environment set to "production"
- [ ] New Relic configured for production monitoring
- [ ] Telegram notifications working
- [ ] Health checks passing on staging

### Post-Deployment Verification

- [ ] Backend health endpoint responding: `{url}/health`
- [ ] Frontend loads without errors
- [ ] Authentication working (login/logout)
- [ ] Supabase connection working (no 401 errors)
- [ ] Socket.IO connection established
- [ ] Database queries working
- [ ] File uploads working (Digital Ocean Spaces)
- [ ] Email notifications working
- [ ] Telegram notifications received

---

## 🔄 Rollback Procedure

### Backend Rollback

**Via DigitalOcean Dashboard**:
1. Go to app deployments page
2. Find previous successful deployment
3. Click "Redeploy"

**Via CLI**:
```bash
# List recent deployments
doctl apps list-deployments <app-id>

# Trigger deployment with previous image
# Update app spec to use specific tag instead of :latest
```

### Frontend Rollback

**Via Vercel Dashboard**:
1. Go to project deployments
2. Find previous successful deployment
3. Click "Promote to Production"

**Via CLI**:
```bash
# List deployments
vercel ls <project-name>

# Promote previous deployment
vercel promote <deployment-url>
```

---

## 📚 Related Documentation

- **GitHub Actions Workflows**: `.github/workflows/`
- **Environment Configuration**: `CLAUDE.local.md` (credentials)
- **Infrastructure Guide**: `/documentation/infrastructure/`
- **Development Commands**: `/documentation/infrastructure/development-commands-guide.md`

---

**Last Updated**: 2025-10-06
**Maintained By**: Development Team
