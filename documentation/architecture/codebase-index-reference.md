# GEER-ANTE ERP System - Codebase Index

This document provides a comprehensive map of the GEER-ANTE ERP system codebase structure. Use this as a reference when navigating the project.

## Project Overview

GEER-ANTE is a comprehensive ERP (Enterprise Resource Planning) system built with:
- **Backend**: NestJS (Node.js framework)
- **Frontend**: Vue.js 3 with Quasar Framework
- **Database**: PostgreSQL (primary) + MongoDB (queuing)
- **ORM**: Prisma
- **Architecture**: Modular monorepo structure

## Directory Structure

### 🏗️ Root Level (`/`)
```
├── CLAUDE.md                    # Mandatory task workflows for development
├── DEVELOPMENT_GUIDELINES.md    # Optional reference & troubleshooting guide
├── CODEBASE_INDEX.md           # This file - project structure documentation
├── ANTE_SITEMAP.md             # Frontend application structure map
├── ante.code-workspace         # VS Code workspace settings
├── docker/docker-compose.yaml         # Docker orchestration configuration
├── Dockerfile.backend          # Backend container configuration
├── Dockerfile.frontend         # Frontend container configuration
├── ecosystem.config.js         # PM2 configuration for dev servers
├── playwright.config.ts        # Playwright testing configuration
├── yarn-dev.sh                # Development startup script
├── run-ai.sh                  # AI utilities script
└── tests/                      # Playwright E2E tests directory
    ├── e2e/                    # End-to-end test files
    │   ├── helpers/            # Test utilities and auth helpers
    │   ├── modules/            # Module-specific tests (organized by feature)
    │   └── explorer/           # Site exploration tools
    └── screenshots/            # Test screenshots (git-ignored)
```

### 📦 Backend (`/backend/`)

#### Configuration Files
```
backend/
├── package.json               # Dependencies and scripts
├── nest-cli.json             # NestJS CLI configuration
├── tsconfig.json             # TypeScript configuration
├── tsconfig.build.json       # Build-specific TypeScript config
├── docker/docker-compose.yml        # Backend-specific Docker setup
└── .env                      # Environment variables (not in git)
```

#### Database (`/backend/prisma/`)
```
prisma/
├── schema.prisma             # Complete database schema definition
├── migrations/              # Database migration history
│   └── [200+ migrations]    # Incremental database changes
└── seed/                    # Database seeding scripts
```

#### Source Code (`/backend/src/`)

##### Core Application
```
src/
├── app.module.ts            # Root module - imports all feature modules
├── main.ts                  # Application bootstrap & configuration
└── app.controller.ts        # Health check endpoint
```

##### Common Services & Utilities (`/backend/src/common/`)
```
common/
├── encryption.service.ts    # Data encryption/decryption
├── logging.service.ts       # Centralized logging
├── prisma.service.ts        # Prisma database service
├── pagination.service.ts    # Pagination utilities
└── validation.service.ts    # Custom validation logic
```

##### Shared Resources
```
src/
├── decorators/             # Custom decorators
│   ├── user.decorator.ts   # Current user extraction
│   └── roles.decorator.ts  # Role-based access
├── dto/                    # Data Transfer Objects
│   ├── pagination.dto.ts   # Pagination parameters
│   └── common.dto.ts       # Shared DTOs
├── filters/                # Exception filters
│   └── http-exception.filter.ts
├── guards/                 # Security guards
│   ├── auth.guard.ts       # JWT authentication
│   └── roles.guard.ts      # Role authorization
├── interceptors/           # Request/response interceptors
│   └── transform.interceptor.ts
├── interfaces/             # TypeScript interfaces
│   └── pagination.interface.ts
├── middleware/             # Express middleware
│   └── logger.middleware.ts
├── pipes/                  # Validation pipes
│   └── validation.pipe.ts
└── reference/              # Constants and enums
    └── status.enum.ts
```

##### Infrastructure Services
```
src/
├── excel/                  # Excel generation
│   └── excel.service.ts    # Excel export functionality
├── file-upload/            # File management
│   ├── file-upload.service.ts
│   └── file-upload.controller.ts
├── mongodb/                # MongoDB integration
│   └── mongodb.service.ts  # MongoDB connection
└── queue/                  # Job queue processing
    ├── queue.service.ts    # Bull queue management
    └── processors/         # Queue processors
```

##### External Integrations
```
src/
├── ai-chat/                # AI integration
│   ├── ai-chat.module.ts
│   ├── ai-chat.service.ts  # Gemini & OpenAI
│   └── ai-chat.controller.ts
└── external-fetch/         # External APIs
    └── external-fetch.service.ts
```

##### Business Modules (`/backend/src/modules/`)

###### Account Module
```
modules/account/
├── account.module.ts
├── account.service.ts      # User profile management
├── account.controller.ts
└── dto/
    ├── create-account.dto.ts
    └── update-account.dto.ts
```

###### Authentication Module
```
modules/auth/
├── auth.module.ts
├── auth.service.ts         # JWT authentication
├── auth.controller.ts      # Login/logout endpoints
├── strategies/
│   └── jwt.strategy.ts     # JWT validation
└── dto/
    └── login.dto.ts
```

###### Communication Module
```
modules/communication/
├── discussion/             # Discussion threads
│   ├── discussion.service.ts
│   └── discussion.controller.ts
├── email/                  # Email sending functionality
│   ├── email.service.ts
│   ├── email.controller.ts
│   ├── email.module.ts
│   └── email-send.dto.ts
├── email-config/           # Email configuration management
│   ├── email-config.service.ts
│   ├── email-config.controller.ts
│   ├── email-config.module.ts
│   └── email-config.validator.dto.ts
├── notification/           # System notifications
│   ├── notification.service.ts
│   └── notification.controller.ts
├── otp/                    # One-time password
│   ├── otp.service.ts
│   └── otp.controller.ts
├── socket/                 # WebSocket real-time
│   ├── socket.gateway.ts
│   └── socket.service.ts
├── telegram/               # Telegram integration
│   ├── telegram.service.ts
│   └── telegram.bot.ts
└── topic/                  # Discussion topics
    └── topic.service.ts
```

###### Company Module
```
modules/company/
├── company/                # Company management
│   ├── company.service.ts
│   └── company.controller.ts
└── branch/                 # Branch management
    ├── branch.service.ts
    └── branch.controller.ts
```

###### CRM Module
```
modules/crm/
├── client/                 # Client management
│   ├── client.service.ts
│   └── client.controller.ts
└── lead/                   # Lead management
    ├── lead.service.ts
    ├── lead.controller.ts
    └── lead-conversion.service.ts
```

###### Finance Module
```
modules/finance/
├── collection/             # Payment collections
│   ├── collection.service.ts
│   └── collection.controller.ts
├── fund-account/           # Fund management
│   ├── fund-account.service.ts
│   └── fund-account.controller.ts
├── petty-cash/            # Petty cash management
│   ├── petty-cash.service.ts
│   └── petty-cash.controller.ts
├── purchase-order/         # Purchase orders
│   ├── purchase-order.service.ts
│   └── purchase-order.controller.ts
└── request-for-payment/    # Payment requests
    ├── rfp.service.ts
    └── rfp.controller.ts
```

###### HR Module
```
modules/hr/
├── configuration/          # HR settings
│   ├── benefits/           # Benefits setup
│   ├── deductions/         # Deductions setup
│   └── positions/          # Position management
├── employee/               # Employee management
│   ├── employee.service.ts
│   └── employee.controller.ts
├── payroll/                # Payroll processing
│   ├── payroll.service.ts
│   ├── payroll.controller.ts
│   └── payroll-calculation.service.ts
└── timekeeping/            # Attendance tracking
    ├── timekeeping.service.ts
    ├── timekeeping.controller.ts
    └── biometric/          # Biometric integration
```

###### Inventory Module
```
modules/inventory/
├── delivery/               # Delivery tracking
│   ├── delivery.service.ts
│   └── delivery.controller.ts
├── item/                   # Item management
│   ├── item.service.ts
│   └── item.controller.ts
├── supplier/               # Supplier management
│   ├── supplier.service.ts
│   └── supplier.controller.ts
└── warehouse/              # Warehouse management
    ├── warehouse.service.ts
    └── warehouse.controller.ts
```

###### Project Module
```
modules/project/
├── project/                # Project management
│   ├── project.service.ts
│   └── project.controller.ts
├── task/                   # Task management
│   ├── task.service.ts
│   └── task.controller.ts
├── board/                  # Kanban boards
│   ├── board.service.ts
│   └── board.controller.ts
├── boq/                    # Bill of Quantities
│   ├── boq.service.ts
│   └── boq.controller.ts
└── accomplishment/         # Project accomplishments
    ├── accomplishment.service.ts
    └── accomplishment.controller.ts
```

###### Role & Permission Module
```
modules/role/
├── role/                   # Role management
│   ├── role.service.ts
│   └── role.controller.ts
└── permission/             # Permission management
    ├── permission.service.ts
    └── permission.controller.ts
```

###### User Module
```
modules/user/
├── user-level/             # User hierarchy
│   ├── user-level.service.ts
│   └── user-level.controller.ts
└── user-organization/      # Organization structure
    ├── user-org.service.ts
    └── user-org.controller.ts
```

###### Utility Module
```
modules/utility/
├── developer/              # Developer tools
│   ├── developer.service.ts
│   └── developer.controller.ts
└── select-options/         # Dropdown options
    ├── select-options.service.ts
    └── select-options.controller.ts
```

### 🎨 Frontend (`/frontends/frontend-main/`)

#### Configuration Files
```
frontend/
├── package.json            # Dependencies and scripts
├── quasar.config.js       # Quasar framework config
├── tsconfig.json          # TypeScript configuration
├── postcss.config.cjs     # PostCSS configuration
├── docker/docker-compose.yml     # Frontend Docker setup
├── nginx.conf             # Production server config
└── .env                   # Environment variables
```

#### Source Code (`/frontends/frontend-main/src/`)

##### Core Setup
```
src/
├── App.vue                # Root component
├── index.template.html    # HTML template
├── boot/                  # Quasar boot files
│   ├── axios.ts          # API client setup
│   ├── mixins.ts         # Global mixins
│   └── socket.ts         # WebSocket setup
├── css/                   # Global styles
│   ├── app.scss          # Main styles
│   └── quasar.variables.scss
└── assets/               # Static assets
    └── logo.png
```

##### Routing (`/frontends/frontend-main/src/router/`)
```
router/
├── routes.ts             # Main route definitions
├── settings.routes.ts    # Settings module routes
└── guards/               # Route guards
    └── auth.guard.ts
```

##### State Management (`/frontends/frontend-main/src/stores/`)
```
stores/
├── auth.store.ts         # Authentication state
├── navigation.store.ts   # Navigation state
├── notification.store.ts # Notifications
├── project.store.ts      # Project data
└── user.store.ts         # User data
```

##### Shared Resources
```
src/
├── composables/          # Vue Composition API
│   ├── useApi.ts        # API calls
│   ├── useAuth.ts       # Authentication
│   └── useNotification.ts
├── mixins/              # Vue mixins
│   ├── table.mixin.ts   # Table functionality
│   └── form.mixin.ts    # Form handling
├── utility/             # Helper functions
│   ├── date.ts          # Date formatting
│   ├── validation.ts    # Form validation
│   └── format.ts        # Data formatting
└── references/          # Constants
    └── table-configs/   # Table configurations
```

##### Components (`/frontends/frontend-main/src/components/`)

###### Shared Components
```
components/shared/
├── GTable.vue           # Generic data table
├── GSelect.vue          # Enhanced select
├── GDatePicker.vue      # Date picker
├── GFileUpload.vue      # File uploader
├── GDialog.vue          # Modal dialog
├── GForm.vue            # Form wrapper
└── GChart.vue           # Chart component
```

###### Dialog Components
```
components/dialog/
├── ConfirmDialog.vue    # Confirmation modal
├── FormDialog.vue       # Form modal
└── InfoDialog.vue       # Information modal
```

###### Table Components
```
components/tables/
├── DataTable.vue        # Data table wrapper
├── TableFilters.vue     # Table filtering
└── TablePagination.vue  # Pagination controls
```

##### Layouts (`/frontends/frontend-main/src/layouts/`)
```
layouts/
├── MainLayout.vue       # Authenticated layout
├── FrontLayout.vue      # Public/auth layout
└── BlankLayout.vue      # Minimal layout
```

##### Pages (`/frontends/frontend-main/src/pages/`)

###### Public Pages
```
pages/Front/
├── SignIn.vue           # Login page
├── SignUp.vue           # Registration page
└── ForgotPassword.vue   # Password recovery
```

###### Member Pages
```
pages/Member/
├── Dashboard/
│   ├── DashboardIndex.vue
│   └── widgets/         # Dashboard widgets
├── Asset/
│   ├── AssetList.vue
│   └── AssetDetail.vue
├── Calendar/
│   └── CalendarIndex.vue
├── Leads/
│   ├── LeadList.vue
│   ├── LeadDetail.vue
│   └── LeadConversion.vue
├── Project/
│   ├── ProjectList.vue
│   ├── ProjectDetail.vue
│   ├── TaskBoard.vue
│   └── BOQ.vue
├── Settings/
│   ├── UserManagement.vue
│   ├── RolePermission.vue
│   ├── CompanySettings.vue
│   └── SystemSettings.vue
└── Treasury/
    ├── Collections.vue
    ├── PurchaseOrders.vue
    └── PettyCash.vue
```

### 📚 Documentation (`/docs/`)

#### Structure
```
docs/
├── package.json         # Documentation dependencies
├── vite.config.js      # Vite configuration
├── index.md            # Documentation home
├── overview.md         # Project overview
├── api/                # API documentation
├── architecture/       # System architecture
├── database/          # Database documentation
├── deployment/        # Deployment guides
├── standards/         # Coding standards
├── code-documentation/
│   ├── components/    # Component docs
│   ├── services/      # Service docs
│   └── modules/       # Module docs
└── features/          # Feature documentation
    ├── asset-management/
    ├── calendar/
    ├── leads/
    ├── projects/
    ├── settings/
    └── treasury/
```

### 📦 Shared Packages (`/packages/`)
```
packages/shared/
├── package.json
└── src/
    ├── enums/          # Shared enumerations
    ├── interfaces/     # Shared interfaces
    └── types/          # Shared type definitions
```

### 🚀 Scripts & Tools

#### Backend Scripts
```
backend/scripts/
├── backup-staging.sh   # Database backup from staging
├── generate-module.js  # Module scaffolding
├── dev_run.sh         # Development runner
└── dev_watch.sh       # Development watcher
```

#### Frontend Scripts
- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn test` - Run tests
- `yarn lint` - Lint code

## Key Technologies

### Backend Stack
- **Framework**: NestJS (Enterprise Node.js)
- **Language**: TypeScript
- **Database**: PostgreSQL (primary), MongoDB (queuing)
- **ORM**: Prisma
- **Authentication**: JWT with Passport
- **Real-time**: Socket.io
- **Queue**: Bull (Redis-based)
- **API Docs**: Swagger/OpenAPI

### Frontend Stack
- **Framework**: Vue.js 3
- **UI Framework**: Quasar
- **Language**: TypeScript
- **State Management**: Pinia
- **HTTP Client**: Axios
- **Build Tool**: Vite
- **CSS**: SCSS

### DevOps & Tools
- **Containerization**: Docker & Docker Compose
- **Version Control**: Git
- **Package Manager**: Yarn
- **Code Quality**: ESLint, Prettier
- **Testing**: Jest (backend), Vitest (frontend)

## Module Responsibilities

### Backend Modules
1. **Account**: User profiles, avatars, preferences
2. **Auth**: Login, logout, JWT tokens, password reset
3. **Communication**: Discussions, notifications, real-time updates, Telegram
4. **Company**: Company info, branches, departments
5. **CRM**: Client management, lead tracking, conversion
6. **Finance**: Collections, purchase orders, petty cash, payment requests
7. **HR**: Employees, payroll, benefits, deductions, timekeeping
8. **Inventory**: Items, suppliers, warehouses, deliveries, stock
9. **Location**: Branches, geographic data
10. **Project**: Projects, tasks, boards, BOQ, accomplishments
11. **Role**: RBAC, permissions, role hierarchy
12. **User**: User levels, organizational structure
13. **Utility**: Developer tools, dropdown options, helpers

### Frontend Features
1. **Dashboard**: Analytics, widgets, overview
2. **Asset Management**: Equipment tracking
3. **Calendar**: Scheduling, events
4. **Lead Management**: CRM functionality
5. **HR**: Employee management interface
6. **Project Management**: Project tracking UI
7. **Settings**: System configuration
8. **Treasury**: Financial management UI

## Development Guidelines

1. **Module Structure**: Each module is self-contained with its own controller, service, DTOs, and tests
2. **Database**: All database operations go through Prisma service
3. **Authentication**: All protected routes use JWT guard
4. **Validation**: DTOs with class-validator for input validation
5. **Error Handling**: Centralized exception filters
6. **Logging**: Structured logging with correlation IDs
7. **Real-time**: Socket.io for live updates
8. **File Storage**: Digital Ocean Spaces for file uploads
9. **Background Jobs**: Bull queues for async processing
10. **API Response**: Consistent response format with interceptors

## Development Tools & Database Access

### PostgreSQL Database Access
The application uses PostgreSQL as the primary database. You can query it directly using:
```sql
mcp__postgresql__query
```

Common queries for development:
```sql
-- Get active authentication tokens
SELECT 
  at."accountId",
  at."token",
  at."status",
  at."createdAt",
  a."email",
  a."username"
FROM "AccountToken" at
JOIN "Account" a ON at."accountId" = a."id"
WHERE at."status" = 'active'
ORDER BY at."createdAt" DESC;

-- Get Guillermo Tabligan's latest token
SELECT token FROM "AccountToken" 
WHERE "accountId" = (SELECT id FROM "Account" WHERE email = 'guillermotabligan00@gmail.com')
AND status = 'active'
ORDER BY "createdAt" DESC LIMIT 1;

-- Check email configurations
SELECT * FROM "EmailConfiguration" WHERE "isActive" = true;
```

### MongoDB Database Access
MongoDB is used for queue management. Access it using:
```
mcp__mongodb__query
```

Example queries:
```javascript
// Get recent queue jobs
{
  "collection": "Queue",
  "filter": {},
  "limit": 10,
  "projection": {"name": 1, "status": 1, "createdAt": 1}
}
```

## API Authentication & Testing

### Authentication Method
The API uses a custom token-based authentication:
- **Header Name**: `token` (NOT `Authorization: Bearer`)
- **Token Location**: Stored in `AccountToken` table
- **Token Format**: 40-character hex string

### Required Headers
```bash
token: [TOKEN_VALUE]
Content-Type: application/json
ngrok-skip-browser-warning: true
```

### API Testing Examples
```bash
# Get user profile
curl -X GET "http://localhost:3000/account/my_account" \
  -H "token: e379d6522262fb3da5aff0202b0e976e64ece8cb" \
  -H "Content-Type: application/json" \
  -H "ngrok-skip-browser-warning: true"

# Get email list
curl -X GET "http://localhost:3000/email/list?folder=INBOX&page=1&limit=10" \
  -H "token: e379d6522262fb3da5aff0202b0e976e64ece8cb" \
  -H "Content-Type: application/json" \
  -H "ngrok-skip-browser-warning: true"

# Check email configuration
curl -X GET "http://localhost:3000/email-config" \
  -H "token: e379d6522262fb3da5aff0202b0e976e64ece8cb" \
  -H "Content-Type: application/json" \
  -H "ngrok-skip-browser-warning: true"
```

### Common API Endpoints
- `/auth/login` - User login (POST)
- `/auth/signup` - User registration (POST)
- `/account/my_account` - Get current user info (GET)
- `/account/profile` - Update user profile (PATCH)
- `/email/list` - Get emails (GET)
- `/email/send` - Send email (POST)
- `/email-config` - Get/update email configuration

## Available MCP Tools

### Database Tools
- `mcp__postgresql__query` - Query PostgreSQL database
- `mcp__mongodb__query` - Query MongoDB collections
- `mcp__mongodb__aggregate` - Run aggregation pipelines
- `mcp__mongodb__update` - Update MongoDB documents
- `mcp__mongodb__insert` - Insert MongoDB documents

### Remote Control Tools
- `mcp__remote-macos-use__remote_macos_get_screen` - Get screenshot
- `mcp__remote-macos-use__remote_macos_mouse_click` - Click at coordinates
- `mcp__remote-macos-use__remote_macos_send_keys` - Send keyboard input
- `mcp__remote-macos-use__remote_macos_open_application` - Open Mac applications

### Other Tools
- `mcp__sequential-thinking__sequentialthinking` - Problem-solving assistant
- `ListMcpResourcesTool` - List available MCP resources
- `ReadMcpResourceTool` - Read MCP resources

## Quick Navigation

- Backend entry: `/backend/src/main.ts`
- Frontend entry: `/frontend/src/App.vue`
- Database schema: `/backend/prisma/schema.prisma`
- API routes: Check `*.controller.ts` files
- Frontend routes: `/frontend/src/router/routes.ts`
- Environment config: `.env` files (backend & frontend)
- Docker setup: Root `docker/docker-compose.yaml`

---

*Last updated: June 2025*
*This index should be updated when major structural changes occur.*