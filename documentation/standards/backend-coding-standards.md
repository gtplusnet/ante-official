---
description: Backend development rules and best practices
globs: backend/**/*
alwaysApply: true
---
## Module System

### Folder Structure and Naming
- **IMPORTANT**: Refer to `backend-structure-rules.mdc` for detailed folder structure and naming conventions
- Follow the modular architecture with clear separation of concerns
- Use domain-driven grouping for related features

### Common Module Usage
- **Always import the CommonModule** in your feature modules
- The CommonModule provides essential services and utilities used throughout the application
- Location: `@common/common.module.ts`

#### Example Module Setup
```typescript
import { Module } from '@nestjs/common';
import { CommonModule } from '@common/common.module';
import { YourController } from './your.controller';
import { YourService } from './your.service';

@Module({
  imports: [
    CommonModule, // Always include CommonModule
    // other imports...
  ],
  controllers: [YourController],
  providers: [YourService],
  exports: [YourService],
})
export class YourModule {}
```

### What CommonModule Provides
- Database access via PrismaService
- Utility functions through UtilityService
- Table handling with TableHandlerService
- File upload capabilities
- Authentication and authorization services
- And other shared functionality

## API Development

### Controllers
- Place controllers in their respective feature module folders
- Follow the naming convention: `[feature].controller.ts`
- Always use DTO classes with `class-validator` decorators
- DTOs should implement corresponding interfaces from `@shared/request`
- Keep request/response interfaces in sync with frontend
- Refer to `controller-rules.mdc` for detailed controller patterns

### Request/Response Handling
- `@shared/request`: Plain interfaces for request payloads (no decorators, no classes)
- `@shared/response`: Interfaces for consistent API responses
- Do **not** wrap API responses in `{ success, data }` - return data objects directly
- Always use `this.utilityService.responseHandler` in controllers

### Data Formatting
Format API responses using these utility methods:
- `DateFormat` for date fields
- `CurrencyFormat` for money fields
- `PercentageFormat` for percentage fields

## DTOs and Service Layer

### Data Transfer Objects (DTOs)
- **Location**: Place DTOs in the `dto/` subfolder within each module
- **Naming**: Use PascalCase with `Dto` suffix (e.g., `CreateDeductionConfigurationDto`)
- **File naming**: Use kebab-case (e.g., `create-deduction-configuration.dto.ts`)
- **Implementation**:
  ```typescript
  export class CreateDeductionConfigurationDto
    implements CreateDeductionConfigurationRequest
  {
    @IsNotEmpty()
    @IsString()
    name: string;
    
    @IsEnum(DeductionCategory)
    deductionCategory: DeductionCategory;
  }
  ```

### Service Layer Implementation
1. **Import Shared Interfaces**
   ```typescript
   import {
     CreateDeductionConfigurationRequest,
     UpdateDeductionConfigurationRequest,
   } from 'shared/request';
   import {
     DeductionConfigurationDataResponse,
     DeductionCategoryDataResponse,
   } from 'shared/response';
   ```

2. **Method Signatures**
   ```typescript
   // For single item responses
   async getById(id: number): Promise<DeductionConfigurationDataResponse>
   
   // For collections
   async getCategories(): Promise<DeductionCategoryDataResponse[]>
   
   // For create/update operations
   async create(request: CreateDeductionConfigurationRequest): Promise<DeductionConfigurationDataResponse>
   ```

3. **Data Transformation**
   - Use public methods to transform database entities to response objects
   - Keep transformation logic in the service layer
   - Always use async for format response so we're ready for future developments
   - Example:
     ```typescript
     public async formatResponse(
       data: DeductionConfiguration
     ): Promise<DeductionConfigurationDataResponse> {
       // Transformation logic here
     }
     ```

### Best Practices
- **Validation**: Use class-validator decorators in DTOs
- **Type Safety**: Always type method parameters and return values
- **Separation**: Keep business logic in services, not in controllers
- **Error Handling**: Throw appropriate HTTP exceptions
- **Documentation**: Add JSDoc comments for complex methods

## Controller Patterns

### Response Handling
- **Always use `responseHandler`** from `UtilityService` for all API responses
- **Location**: Import `UtilityService` from `@common/services/utility.service`
- **Purpose**: Standardizes API responses and error handling

### Best Practices
1. **Consistent Parameter Naming**
   - Use `@Query('id')` for IDs in GET/DELETE
   - Use `@Body()` for request bodies in POST/PUT/PATCH
   - Always include `@Res() response: Response` as the last parameter

2. **Error Handling**
   - Let the `responseHandler` handle errors
   - Service methods should throw appropriate HTTP exceptions
   - Include meaningful error messages in exceptions

3. **Response Format**
   - The `responseHandler` will format responses as:
     ```typescript
     {
       success: boolean,
       data: T,      // Your service method return value
       message?: string
     }
     ```

4. **Async/Await**
   - Always make controller methods `async`
   - Let the `responseHandler` handle the Promise resolution

## Authentication & Authorization
- Use `this.utilityService.accountInformation` for current account
- Use `this.utilityService.companyId` for current company context
- Always validate permissions before performing sensitive operations

## Import Path Aliases

Use these path aliases for cleaner imports:
- `@core/*` - Core functionality (guards, filters, etc.)
- `@common/*` - Shared utilities and services
- `@modules/*` - Feature modules
- `@integrations/*` - External service integrations
- `@infrastructure/*` - Infrastructure concerns
- `@shared/*` - Shared types with frontend

## Best Practices

1. **Module Organization**
   - Follow the standard module structure defined in `backend-structure-rules.mdc`
   - Keep modules focused on a single domain
   - Use barrel exports (index.ts) for cleaner imports

2. **Dependency Injection**
   - Use constructor injection for dependencies
   - Keep constructors clean and focused
   - Prefer interfaces over concrete implementations

3. **Error Handling**
   - Use NestJS built-in exception filters
   - Create custom exceptions in `@core/filters` when needed
   - Log errors appropriately
   - Always handle errors at the appropriate layer

4. **Testing**
   - Write unit tests for services (`.service.spec.ts`)
   - Write integration tests for controllers (`.controller.spec.ts`)
   - Mock external dependencies in tests
   - Place test files next to source files

5. **Code Quality**
   - Run linting before committing: `npm run lint`
   - Run type checking: `npm run typecheck`
   - Follow the established coding patterns
   - Document complex business logic with JSDoc