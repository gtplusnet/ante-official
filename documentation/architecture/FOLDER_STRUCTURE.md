# Project Folder Structure

## Base Folder Contents
The base folder now only contains essential configuration files:
- `.cursorignore` - Cursor IDE ignore rules
- `.env` - Environment variables
- `.gitignore` - Git ignore rules
- `.mcp.json` - MCP server configuration
- `CLAUDE.md` - Claude AI instructions
- `ante.code-workspace` - VS Code workspace
- `ecosystem.config.js` - PM2 configuration (includes processes: backend, frontend, ante-distributor-mobile) - updated to use scripts from /scripts folder
- `package.json` - Project dependencies
- `playwright.config.ts` - Playwright test config
- `tsconfig.json` - TypeScript configuration
- `yarn.lock` - Yarn lock file
- `deploy-staging.sh` - Main deployment script (kept in root for backwards compatibility)

## Organized Directories

### `/scripts`
Contains all utility scripts (moved from root directory):

**Deployment Scripts:**
- `deploy-quick.sh` - Quick deployment using dev build
- `deploy-wrapper.sh` - NVM wrapper for deploy-staging.sh
- `deploy-zero-downtime.sh` - Zero-downtime deployment
- `rollback.sh` - Rollback to previous deployment

**Build Scripts:**
- `build-fix.sh` - Fix build issues and optimize
- `build-frontend.sh` - Frontend build script

**Development Scripts:**
- `start-backend.sh` - Backend startup script
- `start-frontend.sh` - Frontend startup script
- `start-distributor-mobile.sh` - Distributor mobile startup
- `yarn-dev.sh` - Development startup script

**Testing Scripts:**
- `test-deploy-setup.sh` - Test deployment setup
- `test-zero-downtime.sh` - Test zero-downtime deployment
- `run-all-api-tests.sh` - Run all API tests
- `run-api-tests.sh` - Run standard API tests
- `run-hr-config-tests.sh` - Run HR config tests

**Utility Scripts:**
- `run-super-ai.sh` - Super AI functionality
- `clean-main.sh` - Main branch cleanup
- `postman-updater.js` - Update Postman collections
- `import-uom-from-excel.js` - Import UOM from Excel

**Test Collections & Docs:**
- `geer-ante-api-tests.postman_collection.json` - API test collection
- `geer-ante-hr-config-tests.postman_collection.json` - HR config test collection
- `API_TESTS.md` - API test documentation
- `HR_CONFIG_API_TESTS.md` - HR config test documentation
- `README.md` - Scripts documentation

### `/test-artifacts`
Contains test screenshots and HTML files:
- Test screenshots (*.png)
- Test HTML files (*.html)
- Debug screenshots

### `/test-data`
Contains test data files:
- Excel import test files (*.xlsx)

### `/docker`
Contains Docker configuration:
- `Dockerfile.backend`
- `Dockerfile.frontend`
- `docker/docker-compose.yaml`

### `/config`
Contains configuration files:
- `ngrok.yml` - Ngrok tunnel configuration

### `/test-reports`
Auto-generated test reports (gitignored)

## Main Project Directories
- `/backend` - Backend NestJS application
- `/frontend` - Frontend Vue/Quasar application
- `/frontend-sub` - Sub-applications and additional frontends
  - `/distributor-mobile` - Distributor mobile React application
- `/packages` - Shared packages
- `/documentation` - Project documentation
- `/tests` - E2E tests
- `/logs` - Application logs (gitignored)
- `/node_modules` - Dependencies (gitignored)