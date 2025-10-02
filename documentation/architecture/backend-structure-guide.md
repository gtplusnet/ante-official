---
description: Backend folder structure and naming conventions
globs: backend/**/*
alwaysApply: true
---

# Backend Structure and Naming Conventions

## Folder Structure

The backend follows a modular architecture with clear separation of concerns:

```
backend/src/
├── common/                     # Shared utilities & services
│   ├── dto/                   # Common DTOs
│   ├── services/              # Utility services
│   ├── guards/                # Authentication & authorization guards
│   ├── validators/            # Custom validators
│   └── common.module.ts       # Common module
├── decorators/                 # Custom decorators
├── dto/                       # Global DTOs
├── filters/                   # Exception filters
├── guards/                    # Global guards
├── interceptors/              # HTTP interceptors
├── interfaces/                # Backend-specific interfaces
├── middleware/                # Custom middleware
├── pipes/                     # Custom validation pipes
├── reference/                 # Reference data and constants
├── shared/                    # Shared with frontend
│   ├── request/               # API request interfaces
│   └── response/              # API response interfaces
├── modules/                    # Feature modules
│   ├── auth/                  # Authentication module
│   ├── account/               # Account management
│   ├── company/               # Company management
│   ├── hr/                    # HR domain modules
│   │   ├── configuration/     # HR configurations
│   │   ├── processing/        # Payroll processing
│   │   ├── filing/            # HR filing
│   │   ├── computation/       # Payroll computations
│   │   └── timekeeping/       # Time & attendance
│   ├── project/               # Project management
│   ├── inventory/             # Inventory management
│   ├── finance/               # Financial modules
│   │   ├── purchase-order/    # Purchase orders
│   │   ├── petty-cash/        # Petty cash management
│   │   └── fund-account/      # Fund accounting
│   └── communication/         # Communication services
│       ├── notification/      # Notifications
│       ├── socket/            # WebSocket services
│       └── telegram/          # Telegram integration
├── integrations/              # External service integrations
│   ├── openai/                # OpenAI integration
│   ├── gemini/                # Google Gemini integration
│   └── external-fetch/        # External API fetches
└── infrastructure/            # Infrastructure concerns
    ├── queue/                 # Job queues
    ├── excel/                 # Excel import/export
    └── file-upload/           # File upload handling
```

## Naming Conventions

### Folders
- Use **kebab-case** for all folder names
- Group related features under domain folders
- Examples: `employee-list`, `purchase-order`, `hr-configuration`

### Files
- **Controllers**: `[feature].controller.ts`
- **Services**: `[feature].service.ts`
- **Modules**: `[feature].module.ts`
- **DTOs**: `[action]-[feature].dto.ts`
  - Examples: `create-employee.dto.ts`, `update-employee.dto.ts`, `query-employee.dto.ts`
- **Interfaces**: `[feature].interface.ts`
- **Validators**: Use DTOs with class-validator decorators (no separate validator files)
- **Tests**: `[filename].spec.ts`

### Classes
- Use **PascalCase** for class names
- Suffix with type: `EmployeeController`, `EmployeeService`, `EmployeeModule`
- DTOs: `CreateEmployeeDto`, `UpdateEmployeeDto`, `QueryEmployeeDto`

## Standard Module Structure

Each feature module should follow this structure:

```
feature-name/
├── dto/                        # Data Transfer Objects
│   ├── create-feature.dto.ts  # Creation DTO
│   ├── update-feature.dto.ts  # Update DTO
│   ├── query-feature.dto.ts   # Query parameters DTO
│   └── index.ts               # Barrel export
├── interfaces/                 # TypeScript interfaces
│   ├── feature.interface.ts   # Main interfaces
│   └── index.ts               # Barrel export
├── feature.controller.ts       # HTTP endpoints
├── feature.service.ts          # Business logic
├── feature.module.ts           # Module definition
├── feature.controller.spec.ts  # Controller tests
└── feature.service.spec.ts     # Service tests
```

## Module Implementation Guidelines

### 1. Module File
```typescript
import { Module } from '@nestjs/common';
import { CommonModule } from '@common/common.module';
import { FeatureController } from './feature.controller';
import { FeatureService } from './feature.service';

@Module({
  imports: [CommonModule], // Always import CommonModule
  controllers: [FeatureController],
  providers: [FeatureService],
  exports: [FeatureService], // Export if needed by other modules
})
export class FeatureModule {}
```

### 2. DTO Organization
- Place all DTOs in the `dto/` subfolder
- Each DTO should implement the corresponding interface from `@shared/request`
- Use class-validator decorators for validation
- Create an `index.ts` for barrel exports

### 3. Interface Organization
- Place interfaces in the `interfaces/` subfolder
- Keep request/response interfaces in sync with `@shared` types
- Use barrel exports for cleaner imports

### 4. Service Layer
- Keep business logic in services
- Use dependency injection for all dependencies
- Transform entities to response DTOs in the service layer
- Use async methods for future compatibility

### 5. Controller Layer
- Keep controllers thin - delegate to services
- Always use `responseHandler` from UtilityService
- Use appropriate HTTP decorators and status codes
- Validate inputs using DTOs

## Import Path Aliases

Use these path aliases for cleaner imports:

```typescript
// tsconfig.json paths
{
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
```

Example imports:
```typescript
import { CommonModule } from '@common/common.module';
import { AuthGuard } from 'guards/auth.guard';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { EmployeeDataResponse } from '@shared/response';
import { CreateEmployeeRequest } from '@shared/request';
import { UtilityService } from '@common/utility.service';
```

## Best Practices

1. **Module Boundaries**
   - Keep modules focused on a single domain
   - Use barrel exports to control module API
   - Avoid circular dependencies

2. **Dependency Injection**
   - Use constructor injection
   - Prefer interfaces over concrete implementations
   - Use tokens for non-class dependencies

3. **Error Handling**
   - Use NestJS built-in exceptions
   - Create custom exceptions in `@core/filters`
   - Handle errors at the appropriate layer

4. **Testing**
   - Write unit tests for services
   - Write integration tests for controllers
   - Mock external dependencies
   - Place test files next to source files

5. **Documentation**
   - Use JSDoc for public APIs
   - Document complex business logic
   - Keep README files in feature folders for domain-specific docs