# GEER-ANTE ERP Documentation Index

This directory contains comprehensive documentation for the GEER-ANTE ERP system, consolidated from both the `/documentation/` and `.cursor/rules/` directories for easier access and version control.

## 📚 Documentation Structure

### Current Structure (Actual)
```
/documentation/
├── README.md                          # This file
├── DOCUMENTATION-REVIEW-REPORT.md     # Comprehensive review findings
├── architecture/                      # System architecture guides
├── standards/                         # Coding standards and patterns
├── authentication/                    # Authentication and security guides (NEW)
├── navigation/                        # UI navigation guides (NEW)
├── workflows/                         # Development workflows (NEW)
├── infrastructure/                    # Infrastructure and Docker guides (NEW)
└── frontend/                          # Frontend applications documentation (NEW)
```

### 🏗️ Architecture Guides (`/architecture/`)
Comprehensive guides about system architecture and structure.

| File | Description | Status |
|------|-------------|--------|
| [frontend-architecture-guide.md](architecture/frontend-architecture-guide.md) | Modular frontend architecture with domain-driven design | ✅ Active |
| [backend-structure-guide.md](architecture/backend-structure-guide.md) | Backend folder organization and naming conventions | ✅ Active |
| [codebase-index-reference.md](architecture/codebase-index-reference.md) | Complete codebase structure map and technology overview | ⚠️ Needs Update |
| [ante-sitemap-reference.md](architecture/ante-sitemap-reference.md) | Application navigation structure and frontend routes | ⚠️ Needs Verification |

### 📋 Standards & Guidelines (`/standards/`)
Core coding standards, patterns, and best practices.

| File | Description |
|------|-------------|
| [material-design-3-standards.md](standards/material-design-3-standards.md) | Material Design 3 (Flat) UI standards (⚠️ CRITICAL) |
| [api-response-patterns.md](standards/api-response-patterns.md) | API response formats and frontend consumption (⚠️ CRITICAL) |
| [general-coding-standards.md](standards/general-coding-standards.md) | Global coding standards and best practices |
| [project-structure-overview.md](standards/project-structure-overview.md) | Project structure and architecture overview |
| [import-aliases-guide.md](standards/import-aliases-guide.md) | Import patterns and alias usage (⚠️ Critical for builds) |
| [shared-interfaces-guide.md](standards/shared-interfaces-guide.md) | Shared interfaces between frontend/backend |
| [prisma-migration-notes.md](standards/prisma-migration-notes.md) | Database migration procedures (⚠️ Critical) |
| [frontend-coding-standards.md](standards/frontend-coding-standards.md) | Frontend coding standards and conventions |
| [backend-coding-standards.md](standards/backend-coding-standards.md) | Backend coding standards and conventions |
| [controller-patterns.md](standards/controller-patterns.md) | Controller patterns and best practices |
| [service-patterns.md](standards/service-patterns.md) | Service layer patterns and best practices |
| [module-patterns.md](standards/module-patterns.md) | Module structure and organization |
| [dto-interface-patterns.md](standards/dto-interface-patterns.md) | DTO and interface guidelines |
| [backend-testing-patterns.md](standards/backend-testing-patterns.md) | Backend testing requirements and patterns |
| [frontend-auth-patterns.md](standards/frontend-auth-patterns.md) | Authentication and user management patterns |
| [documentation-standards.md](standards/documentation-standards.md) | Documentation writing standards |

### 🧩 Component Guides
**Status:** ❌ Not yet created - Component documentation is planned but not yet available.

For component examples, refer to:
- Frontend components: `/frontends/frontend-main/src/components/`
- Component templates: `/frontends/frontend-main/templates/components/`

### 🔄 Workflow Guides (`/workflows/`)
Development workflows and best practices.

| File | Description | Status |
|------|-------------|--------|
| [README.md](workflows/README.md) | Overview of development workflows | ✅ Created |

### 🧭 Navigation Guides (`/navigation/`)
Step-by-step guides for navigating the system UI.

| File | Description | Status |
|------|-------------|--------|
| [README.md](navigation/README.md) | Navigation documentation overview | ✅ Created |
| Additional module guides | To be created as needed | 📝 Planned |

### 🔐 Authentication & Security (`/authentication/`)
Authentication flows, JWT tokens, and security configurations.

| File | Description | Status |
|------|-------------|--------|
| [supabase-jwt-authentication-guide.md](authentication/supabase-jwt-authentication-guide.md) | Hybrid JWT authentication with Supabase RLS | ✅ Created |
| [rls-policy-management-guide.md](authentication/rls-policy-management-guide.md) | Complete guide for creating and managing RLS policies | ✅ Created |
| [frontend-auth-patterns.md](standards/frontend-auth-patterns.md) | Authentication and user management patterns | ✅ Active |

### 🐳 Infrastructure & Database (`/infrastructure/`)
Infrastructure setup, Docker configuration, and database management guides.

| File | Description | Status |
|------|-------------|--------|
| [docker-services-guide.md](infrastructure/docker-services-guide.md) | Complete Docker services architecture + Supabase CLI | ✅ Updated |
| [supabase-migration-guide.md](infrastructure/supabase-migration-guide.md) | Supabase setup, CLI usage, and environment configuration | ✅ Updated |
| [DOCKER_SERVICES.md](/DOCKER_SERVICES.md) | Quick Docker commands reference | ✅ Created |

### 🎨 Frontend Applications (`/frontend/`)
Documentation for all frontend applications in the system.

| File | Description | Status |
|------|-------------|--------|
| [frontend-apps-overview.md](frontend/frontend-apps-overview.md) | Overview of all 4 frontend applications | ✅ Created |
| Frontend Main | Vue/Quasar ERP system (Port 9000) | ✅ Active |
| User Manual | VitePress documentation (Port 9001) | ✅ Active |
| Gate App | Next.js school gate system (Port 9002) | ✅ Active |
| Guardian App | Next.js parent portal (Port 9003) | ✅ Active |

### 🚀 Migration Guides
**Status:** ❌ Not yet created - Migration guides are planned for future documentation.

### 🎯 Feature Implementation Guides
**Status:** ❌ Not yet created - Feature-specific guides are planned for future documentation.

For implementation examples, refer to:
- Backend modules: `/backend/src/modules/`
- Frontend pages: `/frontends/frontend-main/src/pages/`

### 📡 API Documentation
**Status:** ❌ Not yet created

For API testing, refer to:
- Postman collections: `/backend/postman/`
- API test documentation: `/backend/test/api/README.md`

### 🚀 Deployment Documentation
**Status:** 📁 In root directory

Deployment guides are currently in the root directory:
- `DOCKER-DEPLOYMENT-GUIDE.md` - Current Docker deployment process
- `deploy-staging.sh` - Staging deployment script
- `deploy-production.sh` - Production deployment script

### 🔧 Troubleshooting
**Status:** ❌ Not yet created

For troubleshooting, refer to:
- Backend troubleshooting: `/backend/documentation/troubleshooting.md`
- Testing issues: `/backend/test/README.md#troubleshooting`

## 🔍 Quick Reference

### When to Use Which Documentation

#### Starting a New Feature
1. Check **standards guides** for coding standards
2. Review **architecture guides** for system structure
3. Follow **workflow guides** for development process

#### Debugging Issues
1. Check **development-guidelines-reference.md** for troubleshooting
2. Review relevant **feature guides** for specific implementations
3. Use **postman-cli-guide.md** for API testing and debugging
4. Check **migration guides** if working with legacy code

#### Component Development
1. Read **dialog-component-guide.md** for dialogs
2. Use **gtable-component-guide.md** for data tables
3. Follow **ginput-component-guide.md** for form inputs

#### System Changes
1. Consult **migration guides** for structural changes
2. Update **architecture guides** when adding modules
3. Document new features in **feature guides**

#### Critical Operations
1. **Database changes**: Always check `prisma-migration-notes.md` first
2. **Build issues**: Check `import-aliases-guide.md` for import problems
3. **API development**: Follow `controller-patterns.md` and `service-patterns.md`
4. **Frontend development**: Review `frontend-coding-standards.md`

## 📋 Related Documentation

### Critical Standards (Always Check First)
- `standards/general-coding-standards.md` - General coding standards
- `standards/project-structure-overview.md` - Project structure overview
- `standards/import-aliases-guide.md` - Import patterns (⚠️ Critical for builds)
- `standards/prisma-migration-notes.md` - Database migration procedures (⚠️ Critical)

### Development Standards (Frequently Used)
- `standards/frontend-coding-standards.md` - Frontend coding standards
- `standards/backend-coding-standards.md` - Backend coding standards  
- `standards/service-patterns.md` - Service layer patterns and best practices
- `standards/controller-patterns.md` - Controller patterns and best practices
- `standards/module-patterns.md` - Module structure and organization
- `standards/dto-interface-patterns.md` - DTO and interface guidelines

## 🛠️ Maintaining Documentation

### Adding New Documentation
1. Place in appropriate category directory
2. Use descriptive filenames with `.md` extension
3. Update this README.md index
4. Commit to git for version control

### Updating Existing Documentation
1. Edit the markdown file directly
2. Update the "Last Updated" date if present
3. Commit changes with descriptive message

### Search Documentation
```bash
# Search all documentation
grep -r "search term" /home/jdev/geer-ante/documentation/

# Search specific category
grep -r "search term" /home/jdev/geer-ante/documentation/components/

# Find files by name
find /home/jdev/geer-ante/documentation -name "*dialog*"
```

## 📝 Notes

- This documentation was consolidated from `.cursor/rules/` and `/documentation/` on January 27, 2025
- All files are now version-controlled in git
- No MCP tools required to access documentation
- Documentation can be viewed in any markdown editor or IDE
- Critical files are marked with ⚠️ symbols

---

For questions or updates to this documentation, please follow the project's contribution guidelines.