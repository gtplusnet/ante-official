# Deployment Guide - ANTE ERP

## 📋 Overview

The ANTE ERP system uses a modern CI/CD pipeline with GitHub Actions, DigitalOcean App Platform for backend hosting, and Vercel for frontend hosting.

### Infrastructure Stack
- **Backend Hosting**: DigitalOcean App Platform (Docker containers)
- **Frontend Hosting**: Vercel
- **Container Registry**: GitHub Container Registry (GHCR)
- **CI/CD**: GitHub Actions
- **Notifications**: Telegram

### Branch Strategy
- `main` → **Staging** environment
- `production` → **Production** environment

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
  - Project: `ante-main-staging`
  - Project ID: `prj_96zz5i9lKcdV7MlYcQD2fCRyXgD3`
  - URL: https://ante-main-staging.vercel.app

- **Gate App**:
  - Project: `ante-gate-staging`
  - Project ID: `prj_dgxFqGSheEXelIUCTOlV4aT1oB9d`
  - URL: https://ante-gate-staging.vercel.app

- **Guardian App**:
  - Project: `ante-guardian-staging`
  - Project ID: `prj_3p2gtMLxAz25siKsyEyLbb5p9dBa`
  - URL: https://ante-guardian-staging.vercel.app

**Databases:**
- PostgreSQL: Supabase (ofnmfmwywkhosrmycltb.supabase.co)
- MongoDB: `ante-staging` database
- Redis: Database 1 on staging server (157.230.246.107:16379)

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
  - Project: `ante-main-production`
  - Project ID: `prj_aoIACdfG8ZVDNLYrnRpE4S5vzYmV`
  - URL: https://ante-main-production.vercel.app

- **Gate App**:
  - Project: `ante-gate-production`
  - Project ID: `prj_ORcH6osvYvGcHgQ8Oilz11NYQ7cx`
  - URL: https://ante-gate-production.vercel.app

- **Guardian App**:
  - Project: `ante-guardian-production`
  - Project ID: `prj_T7Ugc4QomFnTER1q7burzhRcErUq`
  - URL: https://ante-guardian-production.vercel.app

**Databases:**
- PostgreSQL: Supabase (ccdlrujemqfwclogysjv.supabase.co)
- MongoDB: `ante-production` database
- Redis: Database 0 on staging server (157.230.246.107:16379)

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
   - Copy environment file: `environment/env.development` → `.env`
   - Deploy to Vercel: `npx vercel --prod --token=$VERCEL_TOKEN --yes`
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
- Environment file: `environment/env.production`
- Different DigitalOcean app ID and Vercel project IDs

**Manual Trigger**:
```bash
gh workflow run deploy-production.yml --ref production
```

**⚠️ IMPORTANT**: When manually triggered, ALL components are deployed (not just changed ones).

---

## 🔧 Configuration

### GitHub Secrets

All secrets configured at: https://github.com/gtplusnet/ante-official/settings/secrets/actions

**Vercel:**
- `VERCEL_TOKEN`: Vercel deployment token
- `VERCEL_ORG_ID`: Team organization ID
- **Staging Project IDs**:
  - `VERCEL_PROJECT_ID_FRONTEND_MAIN`
  - `VERCEL_PROJECT_ID_GATE_APP`
  - `VERCEL_PROJECT_ID_GUARDIAN_APP`
- **Production Project IDs**:
  - `VERCEL_PROJECT_ID_MAIN_PROD`
  - `VERCEL_PROJECT_ID_GATE_PROD`
  - `VERCEL_PROJECT_ID_GUARDIAN_PROD`

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

## 📝 Environment Files

### Frontend Environment Files

**Staging**: `frontends/{app}/environment/env.development`
```env
ENVIRONMENT=development
WHITELABEL=ante
API_URL=https://ante-backend-staging-q6udd.ondigitalocean.app
VITE_SOCKET_URL=https://ante-backend-staging-q6udd.ondigitalocean.app
VITE_SUPABASE_URL=https://ofnmfmwywkhosrmycltb.supabase.co
VITE_SUPABASE_ANON_KEY={staging_anon_key}
```

**Production**: `frontends/{app}/environment/env.production`
```env
ENVIRONMENT=production
WHITELABEL=ante
API_URL=https://ante-backend-production-gael2.ondigitalocean.app
VITE_SOCKET_URL=https://ante-backend-production-gael2.ondigitalocean.app
VITE_SUPABASE_URL=https://ccdlrujemqfwclogysjv.supabase.co
VITE_SUPABASE_ANON_KEY={production_anon_key}
```

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
