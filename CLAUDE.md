# GEER-ANTE ERP - Project Instructions

## 🎯 Project Overview
Full-stack ERP monorepo: NestJS backend + Vue.js frontends + Flutter mobile app
- **Backend**: NestJS API with PostgreSQL (Supabase)
- **Frontend Main**: Vue 3 + Quasar (PM2)
- **Mobile Apps**: Flutter (facial recognition, gate, guardian)
- **Infrastructure**: PM2 for apps, Docker for databases

## 📦 Tech Stack
- **Backend**: NestJS 10, TypeScript 5, Prisma ORM
- **Frontend**: Vue 3, Quasar Framework, Pinia, TypeScript
- **Database**: PostgreSQL (Supabase), MongoDB, Redis
- **Mobile**: Flutter, BLoC pattern
- **Process**: PM2 (apps) + Docker (databases)

## 🚀 Essential Commands

### Development
```bash
yarn dev              # Start all services (PM2 + Docker)
yarn stop             # Stop all services
yarn restart:both     # Restart backend + frontend
yarn status           # Check PM2 status
yarn logs             # View all logs
yarn logs:backend     # Backend logs only
yarn logs:frontend    # Frontend logs only
```

### Database
```bash
cd backend
npx prisma migrate dev          # Create migration
npx prisma migrate deploy       # Apply migrations
npx prisma generate             # Generate client
npx prisma studio               # Open database GUI
yarn security:apply --force     # Apply RLS rules
yarn views:apply --force        # Apply database views
```

### Testing
```bash
yarn test             # Run tests
yarn test:e2e         # E2E tests (Playwright - headless only)
yarn lint             # Lint code
```

### API Performance Testing
```bash
# Get authentication token
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"guillermotabligan","password":"water123"}' | jq -r '.token')

# Test API endpoint with timing
time curl -s -w "\nHTTP: %{http_code}\nTime: %{time_total}s\nSize: %{size_download} bytes\n" \
  -H "token: $TOKEN" \
  http://localhost:3000/your/endpoint

# Performance comparison test (requires jq)
# Compare OLD vs NEW optimized endpoints
```

**Test Credentials** (see CLAUDE.local.md):
- Username: `guillermotabligan`
- Password: `water123`

**Example Performance Test Results**:
```
OLD API: /hris/timekeeping/cutoff-date-range
  ├─ Response: 28.853s (🐢 slow)
  └─ Size: 950KB

NEW API: /hris/timekeeping/cutoff-date-range-lite
  ├─ Response: 0.489s (⚡ 59x faster)
  └─ Size: 109KB (88% smaller)
```

### Build
```bash
yarn build            # Build for production
yarn build:all        # Build all submodules
```

### Bundle Analysis
```bash
cd frontends/frontend-main
ANALYZE=true yarn build  # Build with bundle analyzer
# Opens dist/spa/stats.html with interactive visualization
```

**Bundle Analyzer Features**:
- 🌳 **Treemap visualization**: See bundle composition at a glance
- 📊 **Size metrics**: Parsed, Gzipped, and Brotli sizes
- 🔍 **Module search**: Find specific dependencies
- 📈 **Track progress**: Compare before/after optimizations

**Use Cases**:
- Identify large dependencies before optimization
- Verify code splitting effectiveness
- Find optimization opportunities
- Track bundle size over time
- Prevent regressions

**Location**: `dist/spa/stats.html` (auto-generated, already gitignored)

## 📋 Code Style

### Naming Conventions
- **Variables/Functions**: camelCase
- **Classes/Interfaces**: PascalCase
- **Files/Utils**: kebab-case
- **Components**: PascalCase.vue
- **Dialogs**: Must end with `Dialog.vue`

### Import Order
1. External packages
2. Internal modules (`@modules`, `@common`, etc.)
3. Relative imports

### TypeScript Aliases
- **Backend**: `@modules`, `@common`, `@shared`, `@infrastructure`
- **Frontend**: `@components`, `@pages`, `@stores`, `@shared`

## ⚠️ Critical Rules

### NEVER DO
- ❌ Force push to any branch
- ❌ Edit database directly (use Prisma migrations)
- ❌ Use `prisma db pull` (overwrites schema)
- ❌ Use `prisma migrate reset` (drops entire database)
- ❌ Use `prisma migrate dev` with Supabase (no shadow DB)
- ❌ Commit `.env` files or secrets
- ❌ Use `--headed` or `--ui` flags with Playwright
- ❌ Use box-shadow or elevation (Material Design 3 - flat only)
- ❌ Create dialogs with synchronous imports (ALWAYS use lazy loading)

### ALWAYS DO
- ✅ Use yarn (not npm)
- ✅ Run `yarn build` frequently, check logs
- ✅ Use `prisma migrate deploy` for deployments
- ✅ Follow Material Design 3 (flat design, no shadows)
- ✅ Use specialized AI agents for development/testing
- ✅ Test before committing
- ✅ Update documentation when changing patterns
- ✅ **ALWAYS lazy load dialog components** using `defineAsyncComponent` (mandatory for bundle optimization)

## 🔑 Development Patterns

### PM2 Development
- Backend runs on PM2 (`ante-backend`), not Docker
- Use `localhost` for connections (not Docker service names)
- Databases run in Docker: Redis (6379), MongoDB (27017)
- PostgreSQL hosted on Supabase

### Dialog Lazy Loading Pattern (MANDATORY)
**CRITICAL**: ALL dialog components MUST be lazy-loaded to prevent bundle bloat.

**Composition API Pattern** (Preferred):
```typescript
import { defineAsyncComponent } from 'vue';

// ✅ CORRECT: Lazy-loaded dialog (TASK-008: Bundle optimization)
const MyDialog = defineAsyncComponent(() =>
  import('./dialogs/MyDialog.vue')
);
```

**Options API Pattern**:
```typescript
import { defineAsyncComponent } from 'vue';

export default {
  components: {
    // ✅ CORRECT: Lazy-loaded dialog (TASK-008: Bundle optimization)
    MyDialog: defineAsyncComponent(() =>
      import('./dialogs/MyDialog.vue')
    )
  }
}
```

**❌ NEVER DO THIS**:
```typescript
// ❌ WRONG: Synchronous import adds dialog to initial bundle
import MyDialog from './dialogs/MyDialog.vue';
```

**Why Mandatory**:
- Reduces initial bundle size by ~40KB per dialog on average
- TASK-008 achieved 363KB reduction by converting just 9 dialogs
- Dialogs load on-demand when users actually open them
- No performance impact (dialogs cache after first load)

### API Response Patterns
**Standard (95% of endpoints)** - `responseHandler()`:
```typescript
// Backend
return this.utility.responseHandler(data, response);
// Frontend
const result = response.data;  // Direct access
```

**Wrapped (CMS, some create/update)** - `handleResponse()`:
```typescript
// Backend
return this.utility.handleResponse(data, response, 'Success message');
// Frontend
const result = response.data.data;  // Nested access
```

### Database Migrations
```bash
# Create migration manually (Supabase has no shadow DB)
mkdir -p prisma/migrations/$(date +%Y%m%d%H%M%S)_migration_name

# Or use diff
npx prisma migrate diff \
  --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/$(date +%Y%m%d%H%M%S)_name/migration.sql

# Apply
npx prisma migrate deploy
npx prisma generate
```

### Frontend Cache Pattern
```typescript
import { useCache } from 'src/composables/useCache';

const { data, load, refresh } = useCache(
  taskCache,
  () => api.get('/endpoint'),
  { ttl: CacheTTL.DEFAULT }
);

onMounted(() => load());  // Use load() for initial, refresh() for manual
```

### Supabase Integration
```typescript
import { useSupabaseTable } from 'src/composables/supabase/useSupabaseTable';

const { data, loading } = useSupabaseTable({
  table: 'EmployeeData',
  select: '*, account:Account!inner(firstName, lastName)',
  filters: [{ column: 'isActive', operator: 'eq', value: true }]
});
```

## 🎨 Material Design 3 Standards
- **MANDATORY**: Flat design only
- **NO SHADOWS**: Never use `box-shadow` or elevation
- **FLAT SURFACES**: Use borders and color variations
- **DIALOGS**: Use `md3-dialog-dense` pattern
- **DENSE LAYOUTS**: Compact spacing with MD3 variables

## 🗂️ Project Structure
```
ante-official/
├── backend/              # NestJS API
├── frontends/
│   ├── frontend-main/    # Main Vue.js app
│   ├── user-manual/      # VitePress docs
│   ├── frontend-gate-app/      # School gate app
│   └── frontend-guardian-app/  # Parent portal
├── docker/               # Docker configurations
├── documentation/        # Technical documentation
├── playwright-testing/   # E2E tests (centralized)
├── scripts/              # Utility scripts
└── types/               # TypeScript definitions
```

## 📚 Documentation References

### Architecture & Standards
- **Codebase Index**: `/documentation/architecture/codebase-index-reference.md`
- **Backend Structure**: `/documentation/architecture/backend-structure-guide.md`
- **Frontend Architecture**: `/documentation/architecture/frontend-architecture-guide.md`
- **Material Design 3**: `/documentation/standards/material-design-3-standards.md` ⚠️ CRITICAL
- **Event Listeners**: `/documentation/architecture/event-listeners-and-realtime-guide.md`

### Development Guides
- **Development Commands**: `/documentation/infrastructure/development-commands-guide.md`
- **Docker Services**: `/documentation/infrastructure/docker-services-guide.md`
- **Database Security**: `/documentation/infrastructure/database-security-guide.md`
- **Supabase Migration**: `/documentation/infrastructure/supabase-migration-guide.md`
- **Supabase Frontend**: `/documentation/frontend/supabase-integration.md`

### API & Integration
- **API Integration**: `/documentation/standards/api-integration-guide.md`
- **API Response Patterns**: `/documentation/standards/api-response-patterns.md` ⚠️ CRITICAL
- **Controller Patterns**: `/documentation/standards/controller-patterns.md`
- **Import Aliases**: `/documentation/standards/import-aliases-guide.md`
- **Caching Strategy**: `/documentation/standards/centralized-caching-strategy.md`

### Testing
- **Playwright Testing**: `/playwright-testing/readme.md` ⚠️ ALL tests here
- **Testing Guidelines**: `/documentation/testing/testing-guidelines.md`
- **Frontend E2E**: `/frontends/frontend-main/tests/e2e/README.md`
- **Backend Tests**: `/backend/test/README.md`

### Troubleshooting
- **Common Issues**: `/documentation/troubleshooting/common-issues-and-solutions.md`
- **Prisma Migration**: `/documentation/standards/prisma-migration-notes.md`

### Backend & Frontend Specific
- **Backend Documentation**: `/documentation/backend/` (consolidated)
- **Frontend Documentation**: `/documentation/frontend/` (consolidated)
- **User Manual Writing**: `/frontends/user-manual/CLAUDE.md`
- **Facial Recognition**: `/frontends/ante-facial-recognition/CLAUDE.md`

## 🔧 Module Registry

### Backend Modules (`/backend/src/modules/`)
Authentication, HRIS, Projects, Tasks, CMS, Treasury, Assets, Inventory, Communication, Admin, School Management

### Frontend Pages
Dashboard, HRIS, Projects, Tasks, Treasury, Assets, CRM, Communication, Settings

### Mobile Apps
- **Facial Recognition**: Employee time tracking with face recognition
- **Gate App**: School attendance management
- **Guardian App**: Parent portal for student monitoring

---

## 🔄 Development Workflows

### Trello Task Workflow
**Quick Start**: Use `/trello-todo`, `/trello-start`, `/trello-pr` slash commands

**Process**:
1. **Start Task**: Pull latest main, create branch (feat/enhancement/bug)
2. **Update Trello**: Add branch name to card, move "To Do" → "In Progress"
3. **Develop**: Commit regularly, update card with progress
4. **Create PR**: Push branch, create PR, move card to "QA Review"
5. **Complete**: Merge PR, move card to "Done", delete branch

**Branch Naming**:
- `feat/{description}` - New features
- `enhancement/{description}` - Improvements
- `bug/{description}` - Bug fixes

**Board Lists**:
- **To Do**: Source of truth for pending work
- **In Progress**: Active development
- **QA Review**: Awaiting review/testing
- **Done**: Completed tasks

**Details**: See "Trello Development Workflow" in `CLAUDE.local.md`
**Commands**: See `.claude/commands/README.md`

### Schema Change Protocol
1. Edit `backend/prisma/schema.prisma`
2. STOP - notify user to run migration
3. Wait for confirmation
4. User runs: `npx prisma migrate dev --name description`
5. Commit migration files
6. Generate client: `npx prisma generate`

### Adding Navigation with Submenu
1. Update `navigation.ts` store
2. Add routes in `router/routes.ts`
3. Create submenu component
4. Update `NavLeft.vue` (import, computed, template)
5. **CRITICAL**: Update `isExpandedNav` in `MainLayout.vue`

### Deployment
- Build Docker images: `docker build --target production-alpine`
- Environment files in each module (`.env.example`)
- PM2 for process management
- Consult deployment docs for CI/CD setup

## 🎯 Testing Requirements
- **Playwright**: Headless only (never `--headed` or `--ui`)
- **Coverage**: 80% minimum for new/modified code
- **E2E Location**: Must be in `/playwright-testing/` folder
- **PM2 Logs**: `pm2 logs ante-backend --lines 20 --nostream`

## 🔐 Security Notes
- Test credentials in CLAUDE.local.md (not version controlled)
- Supabase configuration in CLAUDE.local.md
- Backend has FULL database access
- Frontend has controlled access via RLS policies
- Never expose service keys in frontend

## 📝 Documentation Updates
- Keep `/documentation/` updated for new patterns
- Update this file for critical project-wide rules only
- Detailed guides belong in `/documentation/`
- User-facing docs in `/frontends/user-manual/`

---

**Purpose**: This file provides critical context for Claude AI to work effectively on this project. Keep it concise. Move detailed documentation to `/documentation/` folder and reference it here.

**Last Updated**: 2025-01-03
