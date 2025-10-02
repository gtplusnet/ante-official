# GEER-ANTE ERP - Claude Instructions

## 🎯 Project Overview
A modular monorepo ERP system with:
- **Backend**: NestJS API with PostgreSQL (Supabase)
- **Multiple Frontends**: Vue.js applications for different user types
- **Infrastructure**: Docker Compose with PM2 process management
- **Database**: Hosted Supabase (Local/Staging share same, Production separate)

## 🤖 AI Agent Instructions

### MANDATORY: Always use specialized agents for ANTE development
- **Development Tasks**: ALWAYS use `/home/jhay/projects/ante/.claude/agents/ante-full-stack-developer.md`
  - For any full-stack development, bug fixes, feature implementation, or code changes

- **Testing Tasks**: ALWAYS use `/home/jhay/projects/ante/.claude/agents/ante-playwright-ai-tester.md`
  - For creating, modifying, or running Playwright tests

## 📋 Module-Specific Instructions
- **Backend**: `/backend/CLAUDE.md`
- **Frontend Main**: `/frontends/frontend-main/CLAUDE.md`
- **User Manual**: `/frontends/user-manual/CLAUDE.md`
- **Gate App**: `/frontends/frontend-gate-app/README.md`
- **Guardian App**: `/frontends/frontend-guardian-app/README.md`

## 📚 Quick Reference Documentation

### Development & Operations
- **Development Commands**: `/documentation/infrastructure/development-commands-guide.md`
- **Docker Services**: `/documentation/infrastructure/docker-services-guide.md`
- **Docker Configurations**: `/docker/` - All docker-compose files centralized here
- **Deployment Commands**: `/documentation/deployment/deployment-commands-guide.md`

### Database & Security
- **Database Security & RLS**: `/documentation/infrastructure/database-security-guide.md`
- **Supabase Migration**: `/documentation/infrastructure/supabase-migration-guide.md`
- **Supabase Frontend Integration**: `/frontends/frontend-main/docs/SUPABASE_INTEGRATION.md`

### API & Integration
- **API Integration Guide**: `/documentation/standards/api-integration-guide.md`
- **API Response Patterns**: `/documentation/standards/api-response-patterns.md` ⚠️ CRITICAL

### Testing
- **Playwright Testing**: `/playwright-testing/readme.md` ⚠️ **ALL Playwright tests must be in this folder**
  - Complete testing structure, best practices, and reusable templates
  - Includes authentication setup and Page Object Model implementation
- **Testing Guidelines**: `/documentation/testing/testing-guidelines.md`
- **Frontend E2E Tests**: `/frontends/frontend-main/tests/e2e/README.md`
- **Backend Tests**: `/backend/test/README.md`

### Architecture & Standards
- **Codebase Index**: `/documentation/architecture/codebase-index-reference.md`
- **Material Design 3 Standards**: `/documentation/standards/material-design-3-standards.md` ⚠️ CRITICAL
- **Event Listeners & Realtime**: `/documentation/architecture/event-listeners-and-realtime-guide.md`

### Troubleshooting
- **Common Issues & Solutions**: `/documentation/troubleshooting/common-issues-and-solutions.md` 🔧 MUST UPDATE

## ⚠️ Critical Rules

1. **NEVER force push** to any branch
2. **NEVER edit database directly** - always use proper Prisma migrations
3. **NEVER use `prisma db pull`** - will overwrite schema.prisma
4. **NEVER use `prisma migrate reset`** - drops entire database
5. **ALWAYS use yarn** for package management
6. **ALWAYS use specialized AI agents** for development and testing
7. **ALWAYS test on staging** before production deployment
8. **ALWAYS follow Material Design 3** - NO shadows, flat design only

## 🎨 Design System Key Points
- **MANDATORY**: Material Design 3 - Flat Design
- **NO SHADOWS**: Never use box-shadow or elevation effects
- **FLAT SURFACES**: Use borders and color variations for depth

## 🚀 Essential Commands
```bash
yarn dev              # Start minimal development
yarn stop             # Stop all services
yarn restart:both     # Restart backend and frontend
ante-staging          # Switch to staging database
ante-production       # Switch to production database
```

## 🔑 Quick Access
- **Test Credentials**: `guillermotabligan` / `water123`
- **Staging SSH**: `ssh jdev@157.230.246.107`
- **Production SSH**: `ssh jdev@178.128.49.38`

## 📁 Project Structure Map

```
ante/
├── backend/                      # NestJS backend API
│   ├── src/                     # Source code
│   ├── prisma/                  # Database schema and migrations
│   ├── test/                    # Backend tests
│   └── Dockerfile               # Backend Docker configuration
│
├── frontends/                   # Vue.js frontend applications
│   ├── frontend-main/          # Main ANTE application
│   ├── user-manual/            # User manual application
│   ├── frontend-gate-app/      # Gate management app
│   └── frontend-guardian-app/   # Guardian monitoring app
│
├── docker/                      # Docker configuration files
│   ├── docker-compose.yml               # Base Docker Compose
│   ├── docker-compose.development.yml   # Development services
│   ├── docker-compose.staging.yml       # Staging configuration
│   ├── docker-compose.production.yml    # Production configuration
│   └── docker-compose-databases.yml     # Database services
│
├── documentation/               # Project documentation
│   ├── architecture/           # System architecture docs
│   ├── infrastructure/         # Infrastructure guides
│   ├── standards/              # Coding standards & patterns
│   ├── deployment/             # Deployment guides
│   └── troubleshooting/        # Common issues & solutions
│
├── playwright-testing/          # E2E testing with Playwright ⚠️ ALL tests here
│   ├── tests/                  # Test specifications
│   ├── pages/                  # Page Object Model classes
│   ├── fixtures/               # Test fixtures
│   └── readme.md              # Complete testing guide
│
├── scripts/                     # Utility scripts
│   ├── deployment/             # Deployment scripts
│   └── maintenance/            # Maintenance scripts
│
├── bot/                        # Bot services
├── nginx/                      # NGINX configurations
├── db-scripts/                 # Database scripts
├── types/                      # TypeScript type definitions
├── .claude/                    # Claude AI agent configurations
│   └── agents/                 # Specialized AI agents
│
├── package.json                # Root package configuration
├── ecosystem.config.js         # PM2 configuration
├── .env.example               # Environment variables template
├── CLAUDE.md                  # This file - AI instructions
└── README.md                  # Project overview
```

### Key Directories Explained

- **`/backend`**: NestJS API with Prisma ORM, handles all business logic
- **`/frontends`**: Multiple Vue.js apps for different user interfaces
- **`/docker`**: All Docker-related configurations centralized here
- **`/documentation`**: Comprehensive guides and standards
- **`/playwright-testing`**: Centralized E2E testing (MUST use for all Playwright tests)
- **`/scripts`**: Automation and utility scripts
- **`.claude/agents`**: AI agents for specialized development tasks

**If unsure where to look, start with the CLAUDE.md in the folder you are working in.**