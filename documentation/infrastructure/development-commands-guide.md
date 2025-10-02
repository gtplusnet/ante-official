# Development Commands Guide

## 🚀 Quick Development Commands

### Essential Commands
```bash
# Start development
yarn dev       # Minimal: backend + frontend-main + hosted Supabase + local Redis/MongoDB
yarn dev:full  # All: backend + all frontends + hosted Supabase + local Redis/MongoDB

# Service management
yarn stop      # Stop all services
yarn status    # Check PM2 process status
yarn logs      # View all logs

# Critical restart commands (ALWAYS use these)
yarn restart:backend   # Kill ports 3000,4000 + restart backend
yarn restart:frontend  # Kill port 9000 + restart frontend-main
yarn restart:both      # Kill all ports + restart both services
```

## 📊 Real-time Log Monitoring with PM2
**Best Practice**: Use background bash sessions for continuous log monitoring while working.

```bash
# Start monitoring logs in background (recommended approach)
pm2 logs ante-backend -f --lines 0  # Monitor backend logs from current point forward
pm2 logs ante-frontend-main -f --lines 0  # Monitor frontend logs

# Specific monitoring commands
pm2 logs ante-backend --lines 50  # Show last 50 lines and exit
pm2 logs ante-backend -f  # Follow logs continuously (includes history)
pm2 logs --nostream  # Show logs and exit immediately

# Filter logs for specific content
pm2 logs ante-backend | grep "Task"  # Filter for task-related logs
pm2 logs ante-backend | grep -E "ERROR|WARN"  # Monitor errors and warnings
```

**When using Claude Code**:
- Run PM2 logs in background bash: `pm2 logs ante-backend -f --lines 0`
- Use `--lines 0` to avoid flooding with historical logs
- Access background bash output using BashOutput tool
- Filter output with regex when checking specific events
- This allows real-time monitoring while executing other commands

## Environment Switching (Local Development)
```bash
# Switch between staging and production databases locally
ante-staging      # Switch to staging database (Supabase)
ante-production   # Switch to production database (requires confirmation)
ante-env          # Show current environment status
ante-status       # Alias for ante-env

# Or use the script directly
./scripts/switch-env.sh staging     # Switch to staging
./scripts/switch-env.sh production  # Switch to production
./scripts/switch-env.sh status      # Check current environment
```

**Environment Switcher Details:**
- **Purpose**: Switch between staging/production databases while keeping API connections local
- **Source**: Reads configurations from `/bot/environments/[staging|production]/`
- **Local Overrides**: Automatically applies localhost for Redis, MongoDB, and API URLs
- **Auto-Restart**: Automatically runs `yarn dev` to restart all services after switching
- **No Backups**: Switches directly without creating backup files

## Service Ports
- **Frontend Main**: http://localhost:9000
- **Backend API**: http://localhost:3000
- **WebSocket**: ws://localhost:4000
- **Supabase (Hosted)**: https://ofnmfmwywkhosrmycltb.supabase.co (Shared with Staging)
- **Redis**: localhost:6379
- **MongoDB**: localhost:27017

## Related Documentation
- **Docker Services Setup**: `/documentation/infrastructure/docker-services-guide.md`
- **Database Security**: `/documentation/infrastructure/database-security-guide.md`
- **Deployment Guide**: `/documentation/deployment/deployment-commands-guide.md`