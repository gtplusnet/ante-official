# ANTE Services Architecture Guide

## Overview
The ANTE ERP system uses a hybrid architecture:
- **Development**: PM2 manages applications, hosted Supabase for database (via CLI), Docker for Redis/MongoDB
- **Production/Staging**: Docker manages all services with self-hosted Supabase

This guide covers both development and production service architectures.

## Development Architecture (PM2 + Docker)

### Quick Start
```bash
# Start all services (databases + applications)
yarn dev

# Check status
yarn status

# View logs
yarn logs                # All services
yarn logs:backend       # Backend only  
yarn logs:frontend      # Frontend Main only
```

### Process Management
- **Applications**: Managed by PM2 (ante-backend, ante-frontend-main, etc.)
- **Database**: Hosted Supabase managed via CLI (no local PostgreSQL container)
- **Cache/Storage**: Docker containers for Redis and MongoDB
- **Benefits**: Better debugging, easier local development, no database maintenance overhead

### Service Types

#### PM2-Managed Applications
- **Backend API**: PM2 process `ante-backend` → http://localhost:3000
- **WebSocket**: PM2 process `ante-backend` → ws://localhost:4000  
- **Frontend Main**: PM2 process `ante-frontend-main` → http://localhost:9000
- **User Manual**: PM2 process `ante-user-manual` → http://localhost:9001
- **Gate App**: PM2 process `ante-gate-app` → http://localhost:9002
- **Guardian App**: PM2 process `ante-guardian-app` → http://localhost:9003

#### Docker-Managed Services
- **Redis**: Docker container `ante-redis-dev` → localhost:6379
- **MongoDB**: Docker container `ante-mongodb-dev` → localhost:27017

#### Hosted Services
- **PostgreSQL**: Hosted Supabase at https://ofnmfmwywkhosrmycltb.supabase.co (Ante Staging - shared with staging environment)
- **Supabase Studio**: https://supabase.com/dashboard/project/ofnmfmwywkhosrmycltb
- **Supabase API**: https://ofnmfmwywkhosrmycltb.supabase.co (REST/Auth/Storage/Realtime)

⚠️ **WARNING**: Local development shares the same database with staging environment!

## Production Architecture (Docker Only)

In production and staging, all services run as Docker containers with orchestrated networking.

### Database Environment Configuration

#### Local Development & Staging (Shared Hosted Supabase)
- **Supabase Instance**: Hosted at https://ofnmfmwywkhosrmycltb.supabase.co (Ante Staging project)
- **Studio**: https://supabase.com/dashboard/project/ofnmfmwywkhosrmycltb (Database management UI)
- **API**: https://ofnmfmwywkhosrmycltb.supabase.co (REST/Auth/Storage/Realtime APIs)
- **Pooled Connection**: `postgresql://postgres.ofnmfmwywkhosrmycltb:[password]@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true`
- **Direct Connection**: `postgresql://postgres.ofnmfmwywkhosrmycltb:[password]@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres`
- **Management**: Via Supabase CLI (`supabase` commands)
- **⚠️ SHARED DATABASE**: Local and Staging use the same database instance!

#### Staging Environment (157.230.246.107)
**Status**: Uses same hosted Supabase as local development
- **Database**: Same as local - https://ofnmfmwywkhosrmycltb.supabase.co
- **Backend Container**: ante-backend-staging at https://ante-staging-backend.geertest.com
- **Server**: 157.230.246.107 (Docker deployment server)
- **⚠️ SHARED DATABASE**: Uses the same database as local development!

#### Production Environment (178.128.49.38)
**Status**: Separate hosted Supabase instance
- **Supabase Instance**: https://ccdlrujemqfwclogysjv.supabase.co (Ante Production project)
- **Studio**: https://supabase.com/dashboard/project/ccdlrujemqfwclogysjv
- **Backend**: https://api.ante.ph
- **Server**: 178.128.49.38 (Docker deployment server)
- **Pooled Connection**: `postgresql://postgres.ccdlrujemqfwclogysjv:[password]@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true`
- **Direct Connection**: `postgresql://postgres.ccdlrujemqfwclogysjv:[password]@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres`
- **✅ SEPARATE DATABASE**: Production has its own dedicated database

## Service Architecture

### Port Mapping Overview
```
Frontend Applications:
├── 9000 → frontend-main (Main ERP System - Quasar/Vue)
├── 9001 → user-manual (Documentation - VitePress)  
├── 9002 → frontend-gate-app (School Gate - Next.js)
└── 9003 → frontend-guardian-app (Parent Portal - Next.js)

Backend Services:
├── 3000 → backend (NestJS API)
├── 4000 → backend (WebSocket Server)
└── 

Database Services (Local Development):
├── [Hosted] → supabase-studio (https://supabase.com/dashboard/project/ofnmfmwywkhosrmycltb)
├── [Hosted] → supabase-db (aws-1-ap-southeast-1.pooler.supabase.com:6543/5432)
├── [Hosted] → supabase-api (https://ofnmfmwywkhosrmycltb.supabase.co)
├── 6379 → redis (Redis Cache - Docker container)
└── 27017 → mongodb (MongoDB Database - Docker container)

Database Services (Staging/Production):
├── 5433 → supabase-direct (Direct PostgreSQL connection for migrations)
├── 6543 → supabase-pooler (Pooled PostgreSQL connection for applications)
├── 6379 → redis (Redis Cache)
└── 27017 → mongodb (MongoDB Database)
```

## Frontend Applications

### 1. Frontend Main (Port 9000)
- **Technology**: Vue 3 + Quasar Framework
- **Purpose**: Main ERP system interface
- **Container**: `ante-frontend-main`
- **Access**: http://localhost:9000
- **Features**:
  - Project management
  - HR & Payroll
  - Asset management
  - Treasury & Finance
  - Settings & Configuration

### 2. User Manual (Port 9001)
- **Technology**: VitePress
- **Purpose**: System documentation and user guides
- **Container**: `ante-user-manual`
- **Access**: http://localhost:9001
- **Internal Port**: 5173 (mapped to 9001 externally)
- **Features**:
  - Interactive documentation
  - Module guides
  - API references
  - Getting started tutorials

### 3. Gate App (Port 9002)
- **Technology**: Next.js 14
- **Purpose**: School attendance and gate management
- **Container**: `ante-frontend-gate-app`
- **Access**: http://localhost:9002
- **Internal Port**: 3000 (mapped to 9002 externally)
- **Features**:
  - QR code scanning
  - Attendance tracking
  - Real-time monitoring
  - Offline capability
  - Multi-device sync

### 4. Guardian App (Port 9003)
- **Technology**: Next.js 14
- **Purpose**: Parent portal for school management
- **Container**: `ante-frontend-guardian-app`
- **Access**: http://localhost:9003
- **Internal Port**: 3000 (mapped to 9003 externally)
- **Features**:
  - Student monitoring
  - Attendance viewing
  - Notifications
  - PWA support
  - Mobile-optimized

## Backend Services

### API Server (Port 3000)
- **Technology**: NestJS
- **Container**: `ante-backend`
- **Features**:
  - RESTful API endpoints
  - Custom token authentication
  - Prisma ORM
  - Module-based architecture

### WebSocket Server (Port 4000)
- **Technology**: Socket.io
- **Container**: `ante-backend` (same container)
- **Purpose**: Real-time communication
- **Features**:
  - Live notifications
  - Real-time updates
  - Multi-client sync

### Databases

#### PostgreSQL (Hosted Supabase)
- **Local/Staging Instance**: https://ofnmfmwywkhosrmycltb.supabase.co (Shared)
- **Production Instance**: https://ccdlrujemqfwclogysjv.supabase.co (Separate)
- **Purpose**: Primary relational database
- **Management**: Via Supabase CLI and Dashboard
- **⚠️ WARNING**: Local and staging share the same database!
- **Schema Management**: Via Prisma migrations + Supabase CLI

#### Redis (Port 6379)
- **Container**: `ante-redis`
- **Purpose**: Caching and session storage

#### MongoDB (Port 27017)
- **Container**: `ante-mongodb`
- **Purpose**: Document storage
- **Credentials**:
  - User: jdev
  - Password: water123
  - Database: ante-test

## Development Commands

### Supabase CLI Commands (Local Development)
```bash
# Initial setup (one-time)
npm install -g supabase
supabase login
supabase link --project-ref ofnmfmwywkhosrmycltb  # For Local/Staging
# OR
supabase link --project-ref ccdlrujemqfwclogysjv  # For Production

# Daily development
supabase db pull              # Pull latest schema from hosted instance
supabase migration list       # View migration history
supabase migration new <name> # Create new migration
supabase db reset --linked    # Reset local schema to match hosted

# Type generation
supabase gen types typescript --linked > types/supabase.ts

# Project management
supabase projects list        # List all projects
supabase status --linked      # Check connection status
```

### Docker Commands

#### Starting Services
```bash
# Start all services
yarn dev

# Start with rebuild
yarn dev:build

# Start specific frontends
yarn dev:frontend        # Main ERP only
yarn dev:user-manual     # Documentation only
yarn dev:gate-app        # Gate app only
yarn dev:guardian-app    # Guardian app only

# Start all frontends
yarn dev:all-frontends
```

### Monitoring Services
```bash
# Check service status
yarn status

# View logs
yarn logs               # All services
yarn logs:backend       # Backend API
yarn logs:frontend      # Main frontend
yarn logs:user-manual   # Documentation
yarn logs:gate-app      # Gate app
yarn logs:guardian-app  # Guardian app
```

### Accessing Service Shells
```bash
yarn shell:backend
yarn shell:frontend
yarn shell:user-manual
yarn shell:gate-app
yarn shell:guardian-app
```

### Stopping Services
```bash
# Stop all services
yarn stop

# Stop and remove volumes (complete reset)
yarn clean
```

## Environment Configuration

### Frontend Environment Variables

#### Frontend Main (Quasar)
```env
VITE_API_URL=http://backend:3000
VITE_SOCKET_URL=ws://backend:4000
VITE_ENVIRONMENT=development
```

#### Gate & Guardian Apps (Next.js)
```env
NEXT_PUBLIC_API_URL=http://backend:3000
NEXT_PUBLIC_SOCKET_URL=ws://backend:4000
NODE_ENV=development
```

### Backend Environment Variables

#### Local Development & Staging (Shared Database)
```env
# Hosted Supabase configuration - Ante Staging project
DATABASE_URL=postgresql://postgres.ofnmfmwywkhosrmycltb:[password]@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&schema=public
DIRECT_URL=postgresql://postgres.ofnmfmwywkhosrmycltb:[password]@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?schema=public
SUPABASE_URL=https://ofnmfmwywkhosrmycltb.supabase.co
SUPABASE_ANON_KEY=[from_dashboard]
SUPABASE_SERVICE_KEY=[from_dashboard]

# Local Docker services
REDIS_HOST=localhost
REDIS_PORT=6379
MONGODB_URL=mongodb://jdev:water123@localhost:27017/ante-test

NODE_ENV=development
```

#### Production (Separate Database)
```env
# Hosted Supabase configuration - Ante Production project
DATABASE_URL=postgresql://postgres.ccdlrujemqfwclogysjv:[password]@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&schema=public
DIRECT_URL=postgresql://postgres.ccdlrujemqfwclogysjv:[password]@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?schema=public
SUPABASE_URL=https://ccdlrujemqfwclogysjv.supabase.co
REDIS_HOST=redis
REDIS_PORT=6379
NODE_ENV=production
```

## Network Architecture

All services communicate via the `ante-network` Docker network:
- Services can reference each other by container name
- Frontend apps connect to `backend:3000` internally
- No need for localhost references within containers

## Health Checks

Each service includes health checks:
- **Frontend apps**: HTTP check on respective ports
- **Backend**: `/health` endpoint check
- **Databases**: Connection readiness checks

## Troubleshooting

### Port Conflicts
If you encounter "port already in use" errors:
```bash
# Check what's using a port
lsof -i :9000

# Stop conflicting container
docker stop [container-name]
docker rm [container-name]
```

### Permission Issues
Frontend-main runs as root in development to avoid Quasar permission issues.
Gate and Guardian apps run as root for Next.js development compatibility.

### Build Issues
```bash
# Clean rebuild
yarn clean
yarn dev:rebuild

# Remove Docker build cache
docker system prune -a
```

### Container Not Starting
1. Check logs: `yarn logs:[service-name]`
2. Verify port availability
3. Check Docker daemon is running
4. Ensure sufficient disk space

## Development Workflow

### Adding New Frontend Apps
1. Create Dockerfile in `/frontends/[app-name]/`
2. Add service to `docker/docker-compose.yml`
3. Configure port mapping (use 900X range)
4. Add convenience scripts to root `package.json`
5. Update this documentation

### Database Migrations

#### Development (Hosted Supabase + PM2)
```bash
# ⚠️ WARNING: Migrations affect both local AND staging environments!

# Primary Method: Using Prisma (Recommended for all schema changes)
cd backend
npx prisma migrate dev --name [migration-name]  # Edit schema.prisma first, then create migration
npx prisma generate                             # Update Prisma client

# Alternative: Using Supabase CLI (Only for advanced SQL operations)
supabase migration new [migration-name]    # Create migration file for complex SQL
# Edit the migration file in supabase/migrations/ (triggers, functions, RLS policies)
supabase db reset --linked                 # Apply migrations to hosted instance (BE CAREFUL!)

# Sync after CLI changes
cd backend
npx prisma db pull                         # Update Prisma schema from database changes
npx prisma generate                        # Update Prisma client
```

#### Production/Staging (Self-hosted Supabase + Docker)
```bash
# Run migrations inside container
docker exec -it ante-backend npx prisma migrate deploy    # Deploy migrations
docker exec -it ante-backend npx prisma generate          # Generate Prisma client

# For direct database access
psql "postgresql://postgres.tenant1:[password]@host:5433/postgres" -f migration.sql
```

## Switching Between Development and Production

### From PM2 Development to Docker Production
```bash
# Stop PM2 development setup
yarn stop
yarn clean

# Start full Docker setup (if needed for testing)
docker compose up -d
```

### Environment Configuration
- **Development**: Applications use hosted Supabase URLs, localhost for Redis/MongoDB
- **Production**: Applications use self-hosted Supabase and Docker service names
- **Database Management**: Supabase CLI for development, direct SQL/Prisma for production
- **Environment files**: Different `.env` files for each setup

### Key Differences
| Aspect | Local Development | Staging | Production |
|--------|------------------|---------|------------|
| **Applications** | PM2 processes | Docker containers | Docker containers |
| **PostgreSQL** | Hosted Supabase (ofnmfmwywkhosrmycltb) | Same as Local | Hosted Supabase (ccdlrujemqfwclogysjv) |
| **Redis/MongoDB** | Docker containers | Docker containers | Docker containers |
| **Database Sharing** | Shared with Staging | Shared with Local | Separate |
| **Database Management** | Supabase CLI + Dashboard | Same as Local | Supabase Dashboard |
| **Debugging** | Direct access | Docker exec required | Docker exec required |
| **File changes** | Immediate reload | Rebuild required | Rebuild required |

## Security Considerations

- All services run in isolated containers
- Database credentials are environment-specific
- Frontend apps can only access backend through defined APIs
- Production builds use non-root users
- Sensitive data should use Docker secrets (not implemented in dev)

## Performance Optimization

- Docker layer caching optimized in Dockerfiles
- Node modules cached between rebuilds
- Separate development and production stages
- Health checks prevent cascading failures
- Volume mounts for live code reloading

## References

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Frontend Main Documentation](/documentation/frontend/README.md)
- [Backend API Documentation](/documentation/backend/README.md)
- [Deployment Guide](/documentation/deployment/README.md)