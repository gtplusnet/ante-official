# Frontend Applications Overview

The ANTE ERP system consists of four distinct frontend applications, each serving a specific purpose and user base.

## Application Matrix

| Application | Port | Technology | Purpose | Container Name |
|------------|------|------------|---------|----------------|
| Frontend Main | 9000 | Vue 3 + Quasar | Main ERP System | `ante-frontend-main` |
| User Manual | 9001 | VitePress | Documentation | `ante-user-manual` |
| Gate App | 9002 | Next.js 14 | School Gate Management | `ante-frontend-gate-app` |
| Guardian App | 9003 | Next.js 14 | Parent Portal | `ante-frontend-guardian-app` |

## 1. Frontend Main (Main ERP System)

### Overview
The primary interface for the ANTE ERP system, providing comprehensive business management capabilities.

### Technology Stack
- **Framework**: Vue 3 with Composition API
- **UI Library**: Quasar Framework
- **Build Tool**: Vite
- **State Management**: Pinia
- **Routing**: Vue Router
- **HTTP Client**: Axios

### Key Features
- **Project Management**
  - Task tracking
  - Resource allocation
  - Timeline management
  - Budget monitoring

- **Human Resources**
  - Employee management
  - Payroll processing
  - Attendance tracking
  - Leave management

- **Asset Management**
  - Inventory tracking
  - Equipment management
  - Maintenance scheduling

- **Treasury & Finance**
  - Fund management
  - Purchase orders
  - Petty cash handling
  - Financial reporting

### Access Points
- **Development**: http://localhost:9000
- **Docker Container**: `ante-frontend-main`
- **Source Code**: `/frontends/frontend-main/`

### Development Commands
```bash
# Start via Docker
yarn dev:frontend

# View logs
yarn logs:frontend

# Access shell
yarn shell:frontend
```

## 2. User Manual (Documentation Portal)

### Overview
Interactive documentation system built with VitePress, providing guides and references for all system modules.

### Technology Stack
- **Framework**: VitePress
- **Language**: Markdown + Vue components
- **Search**: Built-in full-text search
- **Theme**: Custom theme based on VitePress default

### Content Structure
```
/getting-started   - Quick start guides
/modules          - Module-specific documentation
  /manpower       - HR & Payroll guides
  /projects       - Project management docs
/help            - Troubleshooting & FAQs
```

### Key Features
- Interactive code examples
- Module-specific guides
- API documentation
- Video tutorials (planned)
- Searchable content

### Access Points
- **Development**: http://localhost:9001
- **Docker Container**: `ante-user-manual`
- **Source Code**: `/frontends/user-manual/`
- **Internal Port**: 5173 (mapped to 9001)

### Development Commands
```bash
# Start documentation server
yarn dev:user-manual

# View logs
yarn logs:user-manual

# Build static docs
docker exec -it ante-user-manual yarn docs:build
```

## 3. Gate App (School Attendance System)

### Overview
Specialized Next.js application for managing school gate attendance with QR code scanning and offline capabilities.

### Technology Stack
- **Framework**: Next.js 14 (App Router)
- **UI Library**: Tailwind CSS
- **Database**: IndexedDB (local)
- **State Management**: React Context
- **PWA**: Service Worker enabled

### Key Features
- **QR Code Scanning**
  - Student check-in/check-out
  - Real-time validation
  - Bulk scanning support

- **Offline Mode**
  - Local data storage
  - Queue-based sync
  - Conflict resolution

- **TV Display Mode**
  - Large-screen optimized view
  - Real-time attendance grid
  - Auto-refresh capability

- **Multi-Device Sync**
  - Device pairing
  - Real-time sync between gates
  - Master-slave configuration

### Access Points
- **Development**: http://localhost:9002
- **Docker Container**: `ante-frontend-gate-app`
- **Source Code**: `/frontends/frontend-gate-app/`
- **Internal Port**: 3000 (mapped to 9002)

### Key Routes
- `/login` - Device authentication
- `/scan` - QR code scanner interface
- `/dashboard` - Attendance overview
- `/tv` - TV display mode
- `/settings` - Device configuration
- `/synced-data` - Sync status

### Development Commands
```bash
# Start gate app
yarn dev:gate-app

# View logs
yarn logs:gate-app

# Run tests
docker exec -it ante-frontend-gate-app yarn test
```

## 4. Guardian App (Parent Portal)

### Overview
Mobile-first Next.js application providing parents with access to student information and school communications.

### Technology Stack
- **Framework**: Next.js 14 (App Router)
- **UI Library**: Tailwind CSS
- **PWA**: Full PWA support with offline mode
- **Push Notifications**: Firebase Cloud Messaging
- **State Management**: React Context + Socket.io

### Key Features
- **Student Monitoring**
  - Real-time attendance status
  - Academic performance
  - Activity timeline

- **Notifications**
  - Push notifications
  - In-app notifications
  - Email alerts

- **Communication**
  - Direct messaging with teachers
  - Announcement viewing
  - Event calendar

- **Mobile Features**
  - PWA installable
  - Offline data access
  - Pull-to-refresh
  - Biometric authentication (planned)

### Access Points
- **Development**: http://localhost:9003
- **Docker Container**: `ante-frontend-guardian-app`
- **Source Code**: `/frontends/frontend-guardian-app/`
- **Internal Port**: 3000 (mapped to 9003)

### Key Routes
- `/login` - Parent authentication
- `/` - Dashboard with student cards
- `/account` - Parent account management
- `/tuition` - Payment and billing
- `/notifications` - Notification center

### Development Commands
```bash
# Start guardian app
yarn dev:guardian-app

# View logs
yarn logs:guardian-app

# Build for production
docker exec -it ante-frontend-guardian-app yarn build
```

## Shared Components & Libraries

### Authentication
All frontend apps use the same authentication system:
- Custom token-based auth (not JWT)
- Token stored in localStorage/IndexedDB
- Auto-refresh mechanism
- Single sign-on capability (planned)

### API Integration
- Base URL: `http://localhost:3000` (development)
- WebSocket: `ws://localhost:4000` (real-time)
- All apps use the same API endpoints
- Consistent error handling

### Design System
- **Main ERP**: Quasar components
- **Gate/Guardian Apps**: Custom Tailwind components
- **Documentation**: VitePress theme
- Shared color palette and branding

## Development Workflow

### Starting All Frontend Apps
```bash
# Start all at once
yarn dev:all-frontends

# Or start individually
yarn dev:frontend        # Port 9000
yarn dev:user-manual     # Port 9001
yarn dev:gate-app        # Port 9002
yarn dev:guardian-app    # Port 9003
```

### Monitoring All Apps
```bash
# View all logs
yarn logs

# Check status
yarn status

# Monitor specific app
yarn logs:[app-name]
```

### Common Tasks

#### Adding a New Route
1. **Vue/Quasar**: Edit `/frontends/frontend-main/src/router/routes.ts`
2. **Next.js Apps**: Create new folder in `/app/` directory
3. **Documentation**: Add `.md` file in appropriate folder

#### Updating API Endpoints
1. Update service files in each app
2. Ensure consistent error handling
3. Test with Docker backend

#### Building for Production
```bash
# Build all apps
docker compose build

# Build specific app
docker compose build [service-name]
```

## Environment Variables

### Frontend Main (Quasar)
```env
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=ws://localhost:4000
VITE_ENVIRONMENT=development
```

### Next.js Apps (Gate & Guardian)
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=ws://localhost:4000
NODE_ENV=development
```

### User Manual (VitePress)
```env
NODE_ENV=development
# No API connection needed
```

## Troubleshooting

### Port Conflicts
- Ensure no other services are using ports 9000-9003
- Use `lsof -i :PORT` to check port usage
- Stop conflicting containers with `docker stop`

### Build Issues
- Clear Docker cache: `docker system prune -a`
- Rebuild specific app: `docker compose build --no-cache [service]`
- Check Dockerfile syntax and base images

### Connection Issues
- Verify backend is running: `yarn status`
- Check network connectivity: `docker network ls`
- Ensure environment variables are set correctly

## Best Practices

1. **Code Organization**
   - Keep shared utilities in separate files
   - Use consistent naming conventions
   - Follow framework-specific patterns

2. **Performance**
   - Implement lazy loading where possible
   - Use proper caching strategies
   - Optimize bundle sizes

3. **Testing**
   - Write E2E tests for critical paths
   - Use Playwright for cross-app testing
   - Maintain test data consistency

4. **Documentation**
   - Update docs when adding features
   - Include code examples
   - Document API changes

## References

- [Docker Services Guide](/documentation/infrastructure/docker-services-guide.md)
- [Backend API Documentation](/documentation/backend/README.md)
- [Deployment Guide](/documentation/deployment/README.md)
- [Frontend Main README](/frontends/frontend-main/README.md)
- [Gate App README](/frontends/frontend-gate-app/README.md)
- [Guardian App README](/frontends/frontend-guardian-app/README.md)