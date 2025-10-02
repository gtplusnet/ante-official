# Deployment Commands Guide

## 🚢 Deployment

### Quick Deploy Commands
```bash
# Staging
./bot/deploy/backend-staging.sh
./bot/deploy/frontend-main-staging.sh

# Production
./bot/deploy/backend-production.sh
./bot/deploy/frontend-main-production.sh
```

### Deployment Rules
- **ALWAYS use bot folder** - never individual submodule scripts
- Commit submodule first, then main repository
- For production: merge to main, then create release

### Server Access
- **Staging**: `ssh jdev@157.230.246.107`
- **Production**: `ssh jdev@178.128.49.38`

## Deployment Process

### Staging Deployment
1. Pull latest changes from main branch
2. Commit any submodule changes first
3. Commit main repository changes
4. Run staging deployment scripts from bot folder
5. Test thoroughly on staging environment

### Production Deployment
1. Ensure all changes tested on staging
2. Merge to main branch
3. Create release tag
4. Run production deployment scripts from bot folder
5. Monitor logs for any issues

## Critical Deployment Rules
- **NEVER force push** to any branch
- **ALWAYS test on staging** before production deployment
- **ALWAYS use bot folder** for deployments
- **ALWAYS run migrations** in non-interactive environments with docker exec

## Related Documentation
- **Complete Deployment Guide**: `/bot/CLAUDE.md`
- **Migration Deployment Guide**: `/documentation/deployment/migration-deployment-guide.md`
- **Development Commands**: `/documentation/infrastructure/development-commands-guide.md`