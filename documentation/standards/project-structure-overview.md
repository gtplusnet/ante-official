---
description: 
globs: 
alwaysApply: true
---
---
trigger: always_on
---

# Ante Project Codebase Rules

## Project Structure

### Overall Architecture
- The project follows a monorepo structure with separate `frontend` and `backend` directories
- Frontend is built with Vue 3 + Quasar Framework using TypeScript and Composition API
- Backend is built with NestJS framework using TypeScript
- The `shared` directory contains interfaces and types used by both frontend and backend

### Directory Organization
- **Active Code**: Production-ready code remains in the main directories
- **Templates**: Reusable template files are in `/templates` directories
- **Experimental**: In-development modules are in `/experimental` directories

### Shared Folder Structure
- The shared folder is located at `backend/src/shared`
- It contains two main subdirectories:
  - **request**: Contains interface definitions for API request payloads
  - **response**: Contains interface definitions for API response structures
- This shared folder is used by both frontend and backend to ensure type consistency
- In the backend, these shared interfaces are imported using the `@shared/*` path alias
- In the frontend, these shared interfaces are imported using the `@shared/*` path alias (pointing to `backend/src/shared`)
- Example imports:
  ```typescript
  // Backend
  import { ProjectDataResponse } from '@shared/response';
  import { ProjectCreateRequest } from '@shared/request';
  
  // Frontend
  import { ProjectDataResponse } from '@shared/response';
  import { ProjectCreateRequest } from '@shared/request';
  ```

### Additional Backend Structure
- **interfaces/**: Contains backend-specific interface definitions
- **reference/**: Contains reference data models and constants
- **dto/**: Contains Data Transfer Objects for validation
- **decorators/**: Contains custom decorators
- **filters/**: Contains exception filters
- **guards/**: Contains authentication and authorization guards
- **interceptors/**: Contains HTTP interceptors
- **middleware/**: Contains custom middleware
- **pipes/**: Contains custom validation pipes

## Backend (NestJS)

### Module Structure
- Each feature has its own module in `backend/src/`
- Modules should always import the `CommonModule` for shared functionality
- Follow the NestJS pattern of controllers, services, and DTOs

### Table API Rules
- Use **PUT** method for all table APIs
- Use `TableHandlerService` for table API implementation
- Always filter by `companyId` if available in the schema
- Use global `TableRequest` and `TableResponse` interfaces
- Extend the base `TableDto` class in DTOs for validation

### Component Structure
- Use TypeScript and Composition API for all new components
- Follow the existing pattern in similar components
- Place reusable components in the appropriate `/templates/components` directory

### API Integration
- The backend and frontend share interfaces via the `backend/shared` folder
- Access shared interfaces in frontend using `@shared/<path>`
- Common paths: `@shared/response` and `@shared/request`
- Use request interfaces when creating form submissions
- Apply response interfaces to variables holding API responses

### API Calls
- Use `import { api } from 'src/boot/axios'` for API calls
- The `api` object automatically includes headers and tokens
- Prefer `.then()`, `.catch()`, `.finally()` over `await`
- Use `handleAxiosError` from `src/utility/axios.error.handler` for error handling
- Prefer query parameters over path parameters (`/:id`)


### Socket.io Integration
- Real-time features (like BOQ) use socket.io for collaboration
- Components handle events for data updates, locking/unlocking, and version management
- Communication happens via both REST API and socket events

### Code Quality
- Follow `.editorconfig`, `.eslintrc`, and `.prettierrc` settings
- Use consistent naming conventions and code style
- Add comments where logic is not obvious
- Prefer readability over cleverness

### Testing
- Always check for errors by building the project after changes
- Continue checking until there are no more build errors

## Development and Build Instructions

### Backend Development
Located in `/backend` directory:

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run start:dev

# Build for production
npm run build

# Start production server
npm run start:prod

# Run tests
npm run test

# Run tests with coverage
npm run test:cov

# Run linting
npm run lint

# Format code
npm run format
```

### Frontend Development
Located in `/frontend` directory:

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Run linting
npm run lint

# Format code
npm run format
```

### Common Development Workflow
1. **Start both servers**: Run `npm run dev` in both `/frontend` and `/backend` directories
2. **Frontend**: Usually runs on `http://localhost:9000`
3. **Backend**: Usually runs on `http://localhost:3000`
4. **Hot Reload**: Both frontend and backend support hot reload for development
5. **Type Safety**: TypeScript compilation happens automatically during development
6. **Build Verification**: Always run `npm run build` after making changes to ensure no TypeScript errors

### Path Aliases Configuration
Ensure these path aliases are configured in `tsconfig.json`:

**Backend (`backend/tsconfig.json`)**:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["src/*"],
      "@core/*": ["src/core/*"],
      "@common/*": ["src/common/*"],
      "@modules/*": ["src/modules/*"],
      "@integrations/*": ["src/integrations/*"],
      "@infrastructure/*": ["src/infrastructure/*"],
      "@shared/*": ["src/shared/*"],
      "lib/*": ["src/lib/*"],
      "dto/*": ["src/dto/*"],
      "interfaces/*": ["src/interfaces/*"],
      "reference/*": ["src/reference/*"],
      "shared/*": ["src/shared/*"],
      "decorators/*": ["src/decorators/*"],
      "filters/*": ["src/filters/*"],
      "guards/*": ["src/guards/*"],
      "interceptors/*": ["src/interceptors/*"],
      "middleware/*": ["src/middleware/*"],
      "pipes/*": ["src/pipes/*"]
    }
  }
}
```

**Frontend (`frontend/tsconfig.json`)**:
```json
{
  "compilerOptions": {
    "paths": {
      "@shared/*": ["../backend/src/shared/*"]
    }
  }
}
```
