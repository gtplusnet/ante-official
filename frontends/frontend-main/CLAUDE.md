# GEER-ANTE ERP - Frontend Claude Instructions

## 🧪 Frontend Testing Guidelines
- Only create/fix tests when explicitly requested.
- E2E tests: Playwright, run with `yarn test:e2e` (headless only).
- Lint: `yarn lint` (uses `/frontend/.eslintrc.cjs`).
- Coverage: 80% minimum for new/modified code (when requested).

## 🎨 Design Standards - Material Design 3 (Flat)
**CRITICAL: All UI must follow Material Design 3 - Flat Design**
- **NO SHADOWS or ELEVATION** - Use borders and colors for depth
- **FLAT COMPONENTS** - No floating buttons, raised cards, or drop shadows  
- **DENSE LAYOUTS** - Use compact spacing with MD3 variables
- **DIALOG PATTERN** - Always use `md3-dialog-dense` with content wrapper
- **See**: `/documentation/standards/material-design-3-standards.md` for complete guide

## 🖼️ UI Development
**For all UI/frontend tasks:**
1. Follow Material Design 3 standards (flat design only)
2. Make your code changes
3. Test functionality locally
4. Run tests to verify changes: `npm run test`

## Code Standards
- Framework: Vue 3 + Quasar Framework.
- State: Pinia (`/frontend/src/stores/`).
- Routing: Vue Router (hash mode, `/frontend/src/routes/`).
- TypeScript aliases: `@components`, `@pages`, `@stores`, `@shared`, etc. (see `tsconfig.json` and `quasar.config.js`).
- Naming: camelCase (vars/fns), PascalCase (components), kebab-case (utils).
- Import order: External → Internal → Relative.
- See `/documentation/standards/frontend-coding-standards.md`.

## 🚀 Adding New Main Navigation with Submenu

**When adding a new main navigation item with submenu, you MUST update these files:**

### 1. **Navigation Store** (`src/stores/navigation.ts`)
- Add navigation item to `linksList` array
- Position it appropriately (e.g., after Dashboard)
- Set `canBeDisabled: true` if it can be toggled on/off

### 2. **Routes** (`src/router/routes.ts`)
- Add main route with nested children
- Use parent component for layout (e.g., `Tasks.vue`)
- Import components at top if needed to avoid dynamic import errors

### 3. **Submenu Component** (`src/components/sidebar/[Module]Menu/[Module]SubMenu.vue`)
- Create submenu component following existing patterns
- Most submenus DON'T need search boxes (only LeadsSubMenu has one)
- Use consistent class naming: `[module]-submenu`, `[module]-item`

### 4. **NavLeft Component** (`src/components/sidebar/NavLeft.vue`)
- Import the new submenu component
- Add submenu conditions in `showSubMenu` computed property
- Add submenu type in `subMenuType` computed property
- Add submenu title in `subMenuTitle` computed property
- Add mobile handling in `handleLinkClick` method
- Add submenu component in both desktop and mobile templates

### 5. **MainLayout** (`src/layouts/MainLayout.vue`) ⚠️ CRITICAL
- **MUST add path check to `isExpandedNav` computed property**
- Example: `|| path.includes('/task')`
- This determines if the page uses expanded navigation layout with submenu

### 6. **Main Page Component** (e.g., `Tasks.vue`)
- Use `expanded-nav-page` class for grid layout
- Include `hidden-navigation` div as spacer (250px width)
- Don't add extra padding/margins in child components
- Let the parent handle all spacing

### Common Issues:
- **Layout misalignment**: Check if path is added to `isExpandedNav` in MainLayout
- **Width issues**: Remove `justify-between` if no dropdown arrows needed
- **Double padding**: Child components shouldn't add their own padding

## API Calls
- Always use `$api` for API calls in Vue components (never axios directly).
- Access via `getCurrentInstance()` in setup or `this.$api` in options API.
- **For API integration details (authentication, endpoints, error handling, test credentials), see the root CLAUDE.md.**

## 🔄 Centralized Caching System

**The application uses a centralized, account-aware caching strategy with automatic invalidation.**

### Quick Usage
```typescript
import { useCache } from 'src/composables/useCache';
import { dashboardCache } from 'src/utils/cache/implementations';

const { data, isCached, isRefreshing, load, refresh } = useCache(
  dashboardCache,
  () => api.get('/endpoint'),
  {
    ttl: CacheTTL.DEFAULT, // 24 hours
    invalidateEvents: ['data-updated']
  }
);

// IMPORTANT: Use load() for initial load (checks cache first)
onMounted(() => load());

// Use refresh() only for manual refresh (bypasses cache)
const handleRefresh = () => refresh();
```

### Dynamic Cache Keys (for tabs, filters, etc.)
```typescript
const activeTab = ref('active');

const { data, load, refresh } = useCache(
  taskCache,
  fetchFunction,
  {
    cacheKey: () => ({ // Function for dynamic evaluation
      tab: activeTab.value,
      search: searchTerm.value
    }),
    ttl: CacheTTL.TASK_LIST
  }
);
```

**⚠️ Critical**:
- Always use `load()` for initial loads, `refresh()` for manual refresh only!
- Use a function for `cacheKey` when it depends on reactive values!

### Key Features
- **Account-Safe**: Automatically clears cache on account switch
- **24-Hour Default TTL**: Configurable per cache type (5 min to 7 days)
- **Background Refresh**: Shows cached data immediately, updates in background
- **Event Invalidation**: Clears cache on specific events
- **Visual Indicators**: CacheIndicator component shows cache status

### Cache Implementations
- **taskCache**: Task lists (5 min), counts (1 hour)
- **dashboardCache**: Dashboard counters (24 hours)

**📚 Full Documentation**: [`/documentation/standards/centralized-caching-strategy.md`](../../documentation/standards/centralized-caching-strategy.md)

## 🔄 Supabase Integration
**Frontend-main uses Supabase for direct database access with controlled permissions via RLS policies (SELECT, INSERT, UPDATE as defined per table).**

📚 **Complete Documentation**:
- **Main Guide**: [`/docs/SUPABASE_INTEGRATION.md`](./docs/SUPABASE_INTEGRATION.md)
- **Detailed Guides**: [`/docs/supabase/`](./docs/supabase/) - Comprehensive documentation with practical examples from TaskList.vue
  - [Getting Started](./docs/supabase/01-getting-started.md) - Setup and basics
  - [Table Composables](./docs/supabase/02-table-composables.md) - Data fetching patterns
  - [Realtime Integration](./docs/supabase/03-realtime-integration.md) - Live updates
  - [Component Patterns](./docs/supabase/04-component-patterns.md) - Vue integration
  - [CRUD Operations](./docs/supabase/05-crud-operations.md) - Read/write patterns
  - [Advanced Queries](./docs/supabase/06-advanced-queries.md) - Complex fetching
  - [Security](./docs/supabase/07-security-best-practices.md) - RLS and tokens
  - [Troubleshooting](./docs/supabase/08-troubleshooting-guide.md) - Common issues

### Quick Setup Checklist:
1. ✅ **Environment Variables** - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env`
2. ✅ **Boot Sequence** - Ensure `auth` boot runs after `axios` boot in `quasar.config.js`
3. ✅ **X-Source Header** - Set in `src/boot/axios.ts` for RLS policy identification
4. ✅ **Session Management** - Handled automatically in auth store

### Common Usage Patterns:

#### 1. Table Data with useSupabaseTable
```typescript
import { useSupabaseTable } from 'src/composables/supabase/useSupabaseTable';

const tableComposable = useSupabaseTable({
  table: 'EmployeeData',
  select: '*, account:Account!inner(firstName, lastName)',
  filters: [{ column: 'isActive', operator: 'eq', value: true }],
  orderBy: { column: 'createdAt', ascending: false },
  pageSize: 10
});

// Reactive data
const employees = tableComposable.data;
const loading = tableComposable.loading;
```

#### 2. SupabaseGTable Component
```vue
<supabase-g-table 
  tableKey="employeeListTable" 
  supabaseTab="active"
  ref="table">
  <!-- Custom slots for rendering -->
</supabase-g-table>
```

#### 3. Realtime Notifications
```typescript
import { useNotificationRealtime } from 'src/composables/realtime/useNotificationRealtime';

const { notifications, unreadCount, subscribe } = useNotificationRealtime();
await subscribe(); // Automatic realtime updates
```

### Architecture Overview:
- **Singleton Service** (`src/services/supabase.js`) - Single client instance
- **Table Composables** - Reusable data fetching with caching
- **Realtime Services** - WebSocket subscriptions for live updates  
- **RLS Security** - Frontend controlled access (SELECT/INSERT/UPDATE), backend full access
- **Session Persistence** - Automatic restoration on app restart

### Real-World Examples:
- **HRIS System** - Employee management with direct Supabase queries
- **Notification System** - Real-time notifications with WebSocket subscriptions
- **Table Components** - Paginated, searchable data tables

### Environment Configuration:
```env
# Required for frontend Supabase access
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_ENABLE_SUPABASE_REALTIME=true

# NEVER expose service key in frontend
# VITE_SUPABASE_SERVICE_KEY=xxx  # ❌ Security risk!
```

### Critical Requirements:
- **Session Persistence**: Supabase session restored on page refresh via auth boot
- **RLS Security**: X-Source header enables frontend controlled access per RLS policies
- **Boot Order**: Auth boot must run after axios boot for proper header setup
- **Error Handling**: Graceful fallback if Supabase session initialization fails

### Quick Troubleshooting:
- **"Supabase client not initialized"** → Check environment variables and service initialization
- **"Permission denied"** → Verify X-Source header and RLS policies
- **"Session not available for realtime"** → Check authentication and session restoration
- **"PostgREST failed to parse logic tree"** → Use client-side filtering for nested OR searches

## Deployment & Environment
- Use `deploy-staging.sh`/`deploy-live.sh` for frontend deployment.
- Environment: see `/frontend/.env.example` for required vars.
- PM2 process: `frontend` (see `/ecosystem.config.js`).
- Port: 9000 (Quasar dev server).

## Architecture & Components
- **Design System**: Material Design 3 (Flat) - NO shadows or elevation
- Dialogs: must end with `Dialog.vue` and use `md3-dialog-dense` pattern
- Use `AddEdit*`, `Create*`, `View*` prefixes for components.
- Shared components: `/components/shared/`.
- UI: Quasar components with MD3 flat styling, utility classes in `app.scss`.
- Build tool: Vite (via @quasar/app-vite).
- See `/documentation/architecture/frontend-architecture-guide.md`.
- See `/documentation/standards/material-design-3-standards.md` for design rules.

## PM2 Usage
- Monitor logs: `pm2 logs ante-frontend-main` or `yarn logs:frontend` (from root) or `yarn logs` (all logs).
- Check status: `yarn status` (from root).
- Start frontend only: `pm2 start ecosystem.config.js --only ante-frontend-main`
- Restart frontend: `pm2 restart ante-frontend-main`

## Error Prevention Checklist
- Always verify service methods before use.
- Use proper error handling (`handleAxiosError`).
- Check import patterns and alias usage.
- Run `yarn build` frequently, check logs after every change.
- See CLAUDE.md root for full checklist.

## API Response Patterns - CRITICAL

### 🚨 Two Different Response Formats in Backend

**Standard Pattern (95% of endpoints)**:
```typescript
// Most endpoints use responseHandler() - returns data directly
const response = await api.get('/hris/employee/details');
return response.data;  // ✅ Direct access (NOT response.data.data!)
```

**Wrapped Pattern (CMS and some create/update endpoints)**:
```typescript
// CMS uses handleResponse() - wraps data with message
const response = await api.get('/cms/content-types');
return response.data.data;  // ✅ Nested access for CMS only
```

**📚 See `/documentation/standards/api-response-patterns.md` for complete guide**

## CMS API Integration
**Working CMS Endpoints** (all require authentication):
- `GET /cms/content-types` - Get all content types with pagination
- `GET /cms/content-types?type={collection|single|component}` - Get by type  
- `POST /cms/content-types` - Create new content type
- `PUT /cms/content-types/:id` - Update content type
- `DELETE /cms/content-types/:id` - Delete content type
- `POST /cms/content-types/:id/fields` - Add field
- `PUT /cms/content-types/:id/fields/:fieldId` - Update field
- `DELETE /cms/content-types/:id/fields/:fieldId` - Delete field

**CMS API Response Format (WRAPPED):**
```typescript
{
  statusCode: 200|201|400|404|500,
  message: string,
  data: T | T[],  // Actual data wrapped inside
  meta?: { page, pageSize, total, pageCount }  // For paginated responses
}
```

**CMS Frontend Service Pattern:**
```typescript
// CMS ONLY - uses wrapped response pattern
const response = await api.get('/cms/content-types');
return response.data.data;  // CMS wraps data, so need nested access
```

**CMS Data Storage:**
- Uses MongoDB exclusively (not PostgreSQL)
- Collections: `cms_content_types`, `cms_content_entries`, `cms_media`, etc.
- Multi-tenancy via `companyId` field on all documents
- Redis caching for performance optimization

## Documentation
- Update `/documentation/` for new patterns, fixes, or components.
- Update `/documentation/standards/import-aliases-guide.md` for alias/build issues.
- See `/documentation/README.md` for full index.
- **Development Setup**: Frontend runs with PM2, databases run in Docker containers