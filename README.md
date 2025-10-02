# Ante - Full Stack ERP System

A comprehensive Enterprise Resource Planning (ERP) system with separate frontend and backend repositories managed as git submodules.

## 🏗️ Architecture

This repository serves as the main orchestrator for the Ante ERP system, containing:
- **Frontend**: Vue.js/Quasar application (submodule)
- **Backend**: NestJS API server (submodule)
- **Deployment Scripts**: Automated deployment for staging and production
- **Hybrid Development**: PM2 for applications + Docker for databases

### Hybrid Architecture
The system uses a **hybrid approach** for optimal development experience:
- **Applications run with PM2**: Backend, frontend services use PM2 for process management
- **Databases run in Docker**: PostgreSQL, Redis, MongoDB run in Docker containers
- **Benefits**: Fast application reloads with PM2, consistent database environments with Docker

## 📁 Repository Structure

```
ante/
├── frontends/
│   ├── frontend-main/      # Main ERP frontend (Vue/Quasar)
│   ├── user-manual/        # Documentation site (VitePress)
│   ├── frontend-gate-app/  # School management app (Next.js)
│   └── frontend-guardian-app/ # Parent portal app (Next.js)
├── backend/               # Backend API (NestJS)
├── bot/                   # Deployment scripts and automation
├── ecosystem.config.js    # PM2 configuration
├── start-dev.sh          # Development startup script
├── docker-compose-databases.yml # Database services
└── documentation/        # Project documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Yarn
- Git
- Docker & Docker Compose (for databases)
- PM2 (for process management)

### Initial Setup

1. **Clone with submodules:**
```bash
git clone --recurse-submodules https://github.com/gtplusnet/ante.git
cd ante
```

2. **If already cloned, initialize submodules:**
```bash
git submodule update --init --recursive
```

3. **Install PM2 globally:**
```bash
npm install -g pm2
```

4. **Setup environment files:**

Backend:
```bash
cd backend
cp .env.example .env
# Edit .env with your database and configuration
```

Frontend Main:
```bash
cd frontends/frontend-main
cp .env.example .env
cp connections.example.json connections.json
# Edit both files with your API endpoints
```

## 🚀 PM2 Development (Recommended)

### Start all services:
```bash
yarn dev
```

### View logs:
```bash
yarn logs                    # All services
yarn logs:backend           # Backend only
yarn logs:frontend          # Frontend Main only
yarn logs:user-manual       # User Manual only
yarn logs:gate-app          # Gate App only
yarn logs:guardian-app      # Guardian App only
```

### Check service status:
```bash
yarn status
```

### Stop all services:
```bash
yarn stop
```

### Clean up (stop and remove):
```bash
yarn clean
```

## 🐳 Docker Development (Legacy)

> **Note**: PM2 development is now the recommended approach. Docker is still used for databases only.

### Start databases only:
```bash
docker compose -f docker-compose-databases.yml up -d
```

### Stop databases:
```bash
docker compose -f docker-compose-databases.yml down
```

## 📦 Deployment

### Deploy Everything:
```bash
./deploy.sh all
```

### Deploy Backend Only:
```bash
./deploy.sh backend
```

### Deploy Frontend Only:
```bash
./deploy.sh frontend
```

### Deploy to Staging:
```bash
./deploy-staging.sh
```

### Deploy to Production:
```bash
./deploy-production.sh
```

## 🔄 Updating Submodules

### Pull latest changes:
```bash
git submodule update --remote --merge
```

### Update specific submodule:
```bash
cd frontend
git pull origin main
cd ..
git add frontend
git commit -m "Update frontend submodule"
```

## 🌐 URLs

### Development
- Frontend Main (ERP): http://localhost:9000
- User Manual (Docs): http://localhost:9001
- Gate App (School): http://localhost:9002
- Guardian App (Parent): http://localhost:9003
- Backend API: http://localhost:3000
- WebSocket: ws://localhost:4000

### Staging
- Frontend: https://staging.ante.ph
- Backend API: https://api-staging.ante.ph

### Production
- Frontend: https://ante.ph
- Backend API: https://api.ante.ph

## 🛠️ Useful Commands

### Check submodule status:
```bash
git submodule status
```

### Update all submodules to latest:
```bash
git submodule foreach git pull origin main
```

### Reset submodules to committed version:
```bash
git submodule update --init
```

### Run tests:
```bash
# Backend tests
cd backend && yarn test

# Frontend tests
cd frontend && yarn test
```

## 📊 Services

The following services are available in development:

| Service | Port | Description | Process Manager |
|---------|------|-------------|----------------|
| PostgreSQL | 5432 | Main database | Docker |
| Redis | 6379 | Cache and sessions | Docker |
| MongoDB | 27017 | Document storage | Docker |
| Backend API | 3000 | REST API | PM2 |
| WebSocket | 4000 | Real-time updates | PM2 |
| Frontend Main | 9000 | Main ERP application | PM2 |
| User Manual | 9001 | Documentation site | PM2 |
| Gate App | 9002 | School management | PM2 |
| Guardian App | 9003 | Parent portal | PM2 |

## 🗄️ Database Architecture

### Multi-Environment Supabase Integration

The ANTE system uses **self-hosted Supabase** across all environments for enhanced database capabilities with **GMT+8 (Asia/Manila)** timezone configuration:

#### Local Development (Docker Supabase)
- **Database**: Local Supabase PostgreSQL in Docker containers
- **Studio Dashboard**: http://localhost:3001
- **REST API**: http://localhost:54321
- **Connection**: `postgresql://supabase_admin:supabase_local_password@localhost:5432/postgres`
- **Services**: Full Supabase stack + Redis + MongoDB
- **Command**: `yarn dev` (uses docker-compose-supabase.yml)

#### Staging Environment (Self-hosted Supabase)
- **Studio Dashboard**: https://supabase.geertest.com
- **REST API**: https://api.geertest.com/rest/v1/
- **Auth API**: https://api.geertest.com/auth/v1/
- **Storage API**: https://api.geertest.com/storage/v1/
- **Realtime**: https://api.geertest.com/realtime/v1/
- **Server**: 157.230.246.107
- **Pooled Connection**: `postgresql://postgres.tenant1:[password]@157.230.246.107:6543/postgres?pgbouncer=true`
- **Direct Connection**: `postgresql://postgres.tenant1:[password]@157.230.246.107:5433/postgres`

#### Production Environment (Self-hosted Supabase)
- **Studio Dashboard**: https://supabase.ante.ph
- **REST API**: https://api.ante.ph/rest/v1/
- **Auth API**: https://api.ante.ph/auth/v1/
- **Storage API**: https://api.ante.ph/storage/v1/
- **Realtime**: https://api.ante.ph/realtime/v1/
- **Server**: 178.128.49.38
- **Pooled Connection**: `postgresql://postgres.tenant1:[password]@178.128.49.38:6543/postgres?pgbouncer=true`
- **Direct Connection**: `postgresql://postgres.tenant1:[password]@178.128.49.38:5433/postgres`

#### Features Available Across All Environments:
- ✅ **Real-time subscriptions** for live data updates
- ✅ **Built-in authentication** system (optional, ANTE uses custom auth)
- ✅ **File storage** with automatic image transformations
- ✅ **REST API** for direct database access
- ✅ **Automatic API generation** from database schema
- ✅ **Row Level Security (RLS)** for fine-grained permissions
- ✅ **Connection pooling** via Supavisor for high concurrency
- ✅ **Database webhooks** and triggers
- ✅ **GMT+8 timezone** (Asia/Manila) configuration

#### Environment Switching:
Switch between environments by updating `DATABASE_URL` and `SUPABASE_URL` in backend/.env:
```bash
# Local Development
DATABASE_URL="postgresql://supabase_admin:supabase_local_password@localhost:5432/postgres"
SUPABASE_URL="http://localhost:54321"

# Staging
DATABASE_URL="postgresql://postgres.tenant1:[password]@157.230.246.107:6543/postgres?pgbouncer=true"
SUPABASE_URL="https://api.geertest.com"

# Production  
DATABASE_URL="postgresql://postgres.tenant1:[password]@178.128.49.38:6543/postgres?pgbouncer=true"
SUPABASE_URL="https://api.ante.ph"
```

## 🔐 Security

- Never commit `.env` files
- Use environment-specific configurations
- Keep production secrets in secure vault
- Regularly update dependencies
- Follow security guidelines in each submodule

## 📝 Contributing

1. Create feature branch in the appropriate submodule
2. Make changes and test
3. Submit PR to the submodule repository
4. After merge, update this main repository

## 🐛 Troubleshooting

### Submodule not initialized:
```bash
git submodule update --init --recursive
```

### Permission denied during deployment:
```bash
chmod +x deploy*.sh
```

### Port already in use:
```bash
# Check what's using the port
lsof -i :3000
# Kill the process or change the port in .env
```

### Database connection issues:
- Check PostgreSQL is running
- Verify DATABASE_URL in backend/.env
- Run migrations: `cd backend && npx prisma migrate dev`

## 📄 License

Proprietary - All rights reserved

## 👥 Team

- GT Plus Network
- Contact: support@ante.ph

---

For detailed documentation about each component:
- [Backend README](./backend/README.md)
- [Frontend Main README](./frontends/frontend-main/README.md)
- [User Manual README](./frontends/user-manual/README.md)
- [Gate App README](./frontends/frontend-gate-app/README.md)
- [Guardian App README](./frontends/frontend-guardian-app/README.md)
- [Bot Documentation](./bot/README.md)