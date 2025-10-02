---
description: Rules for DTOs and interfaces in backend
globs: 
  - backend/**/dto/*.dto.ts
  - backend/**/interfaces/*.interface.ts
alwaysApply: false
---

# DTO and Interface Rules

## Data Transfer Objects (DTOs)

### Location and Structure
```
module-name/
├── dto/
│   ├── create-feature.dto.ts
│   ├── update-feature.dto.ts
│   ├── query-feature.dto.ts
│   └── index.ts              # Barrel export
```

### Naming Conventions
- **Files**: Use kebab-case with `.dto.ts` suffix (e.g., `create-employee.dto.ts`)
- **Classes**: Use PascalCase with `Dto` suffix (e.g., `CreateEmployeeDto`)
- **Properties**: Use camelCase

### DTO Implementation

```typescript
// create-employee.dto.ts
import { IsString, IsNotEmpty, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { CreateEmployeeRequest } from '@shared/request';
import { EmployeeType } from '@shared/enums';

export class CreateEmployeeDto implements CreateEmployeeRequest {
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsEnum(EmployeeType)
  employeeType: EmployeeType;
}
```

### Update DTOs

```typescript
// update-employee.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateEmployeeDto } from './create-employee.dto';

export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {
  // All properties become optional
  // Add any update-specific properties here
}
```

### Query DTOs

```typescript
// query-employee.dto.ts
import { IsOptional, IsInt, Min, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { QueryEmployeeRequest } from '@shared/request';

export class QueryEmployeeDto implements QueryEmployeeRequest {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  page?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;
}
```

### Barrel Exports

```typescript
// dto/index.ts
export * from './create-employee.dto';
export * from './update-employee.dto';
export * from './query-employee.dto';
```

## Interfaces

### Location and Structure
```
module-name/
├── interfaces/
│   ├── employee.interface.ts
│   ├── employee-filter.interface.ts
│   └── index.ts              # Barrel export
```

### Interface Naming
- **Files**: Use kebab-case with `.interface.ts` suffix
- **Interfaces**: Use PascalCase with descriptive names (no `I` prefix)

### Interface Implementation

```typescript
// employee.interface.ts
export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  department?: string;
  employeeType: EmployeeType;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmployeeWithRelations extends Employee {
  department: Department;
  manager?: Employee;
  subordinates: Employee[];
}

export interface EmployeeFilter {
  departmentId?: number;
  employeeType?: EmployeeType;
  isActive?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}
```

## Best Practices

### DTOs
1. **Validation**: Always use class-validator decorators
2. **Type Safety**: Implement corresponding interfaces from `@shared/request`
3. **Transformation**: Use class-transformer for type conversion
4. **Composition**: Use `PartialType`, `PickType`, `OmitType` for DTO variations
5. **Documentation**: Add JSDoc comments for complex validations

### Interfaces
1. **Separation**: Keep domain interfaces separate from DTOs
2. **Composition**: Use interface extension for variations
3. **Shared Types**: Import enums and types from `@shared`
4. **No Logic**: Interfaces should only define structure, no methods

### Common Decorators

```typescript
// Validation decorators
@IsNotEmpty()       // Required field
@IsOptional()       // Optional field
@IsString()         // String type
@IsNumber()         // Number type
@IsBoolean()        // Boolean type
@IsEmail()          // Email format
@IsUrl()            // URL format
@IsDate()           // Date type
@IsEnum(EnumType)   // Enum validation
@IsArray()          // Array type
@ArrayMinSize(1)    // Array min size
@Min(0)             // Minimum value
@Max(100)           // Maximum value
@Length(2, 50)      // String length
@Matches(/regex/)   // Regex pattern

// Transformation decorators
@Type(() => Number) // Transform to number
@Type(() => Date)   // Transform to date
@Transform()        // Custom transformation
```

### Error Messages

```typescript
@IsNotEmpty({ message: 'First name is required' })
@Length(2, 50, { message: 'First name must be between 2 and 50 characters' })
firstName: string;
```