---
description: Rules for creating services following best practices
globs: backend/**/*.service.ts
alwaysApply: false
---

# Service Layer Rules

## Service Structure

Services contain business logic and interact with the database through Prisma. They should be focused, testable, and reusable.

### File Naming
- Use kebab-case: `[feature].service.ts`
- Test files: `[feature].service.spec.ts`

### Class Structure

```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@common/services/prisma.service';
import { UtilityService } from '@common/services/utility.service';
import { CreateEmployeeDto, UpdateEmployeeDto, QueryEmployeeDto } from './dto';
import { EmployeeDataResponse } from '@shared/response';

@Injectable()
export class EmployeeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly utilityService: UtilityService,
  ) {}

  // Service methods...
}
```

## Method Patterns

### 1. Create Method

```typescript
async create(dto: CreateEmployeeDto): Promise<EmployeeDataResponse> {
  // Validate business rules
  await this.validateEmployeeEmail(dto.email);

  // Create entity
  const employee = await this.prisma.employee.create({
    data: {
      ...dto,
      companyId: this.utilityService.companyId,
      createdBy: this.utilityService.accountInformation.id,
    },
    include: {
      department: true,
    },
  });

  // Transform and return
  return this.formatEmployeeResponse(employee);
}
```

### 2. Find Methods

```typescript
async findAll(query: QueryEmployeeDto): Promise<EmployeeDataResponse[]> {
  const { page = 0, limit = 10, search, sortOrder = 'asc' } = query;

  const employees = await this.prisma.employee.findMany({
    where: {
      companyId: this.utilityService.companyId,
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    },
    include: {
      department: true,
    },
    skip: page * limit,
    take: limit,
    orderBy: {
      createdAt: sortOrder,
    },
  });

  return Promise.all(
    employees.map((employee) => this.formatEmployeeResponse(employee))
  );
}

async findOne(id: number): Promise<EmployeeDataResponse> {
  const employee = await this.prisma.employee.findFirst({
    where: {
      id,
      companyId: this.utilityService.companyId,
    },
    include: {
      department: true,
      manager: true,
    },
  });

  if (!employee) {
    throw new NotFoundException(`Employee with ID ${id} not found`);
  }

  return this.formatEmployeeResponse(employee);
}
```

### 3. Update Method

```typescript
async update(id: number, dto: UpdateEmployeeDto): Promise<EmployeeDataResponse> {
  // Check existence
  await this.findOne(id);

  // Validate business rules if needed
  if (dto.email) {
    await this.validateEmployeeEmail(dto.email, id);
  }

  // Update entity
  const employee = await this.prisma.employee.update({
    where: { id },
    data: {
      ...dto,
      updatedBy: this.utilityService.accountInformation.id,
      updatedAt: new Date(),
    },
    include: {
      department: true,
    },
  });

  return this.formatEmployeeResponse(employee);
}
```

### 4. Delete Method

```typescript
async delete(id: number): Promise<{ success: boolean; message: string }> {
  // Check existence
  await this.findOne(id);

  // Soft delete pattern
  await this.prisma.employee.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedBy: this.utilityService.accountInformation.id,
      deletedAt: new Date(),
    },
  });

  return {
    success: true,
    message: 'Employee deleted successfully',
  };
}
```

### 5. Table/Pagination Method

```typescript
async table(query: TableQueryDto, body: TableBodyDto): Promise<TableResponse<EmployeeDataResponse>> {
  const { page, limit, sort, order } = query;
  const { filters, search } = body;

  const where = this.buildWhereClause(filters, search);

  const [data, total] = await Promise.all([
    this.prisma.employee.findMany({
      where,
      include: {
        department: true,
      },
      skip: page * limit,
      take: limit,
      orderBy: sort ? { [sort]: order } : { createdAt: 'desc' },
    }),
    this.prisma.employee.count({ where }),
  ]);

  const formattedData = await Promise.all(
    data.map((item) => this.formatEmployeeResponse(item))
  );

  return {
    data: formattedData,
    total,
    page,
    limit,
  };
}
```

## Response Formatting

Always format responses to match the expected interface:

```typescript
private async formatEmployeeResponse(employee: any): Promise<EmployeeDataResponse> {
  return {
    id: employee.id,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    department: employee.department ? {
      id: employee.department.id,
      name: employee.department.name,
    } : null,
    employeeType: employee.employeeType,
    status: employee.status,
    createdAt: this.utilityService.dateFormat(employee.createdAt),
    updatedAt: this.utilityService.dateFormat(employee.updatedAt),
  };
}
```

## Validation Methods

```typescript
private async validateEmployeeEmail(email: string, excludeId?: number): Promise<void> {
  const existing = await this.prisma.employee.findFirst({
    where: {
      email,
      companyId: this.utilityService.companyId,
      ...(excludeId && { id: { not: excludeId } }),
    },
  });

  if (existing) {
    throw new BadRequestException('Email already exists');
  }
}
```

## Error Handling

```typescript
async performOperation(): Promise<any> {
  try {
    // Operation logic
  } catch (error) {
    // Log error
    console.error('Operation failed:', error);
    
    // Throw appropriate HTTP exception
    if (error.code === 'P2002') {
      throw new BadRequestException('Duplicate entry');
    }
    
    if (error.code === 'P2025') {
      throw new NotFoundException('Record not found');
    }
    
    // Re-throw if already an HTTP exception
    if (error.status) {
      throw error;
    }
    
    // Generic error
    throw new BadRequestException('Operation failed');
  }
}
```

## Best Practices

1. **Single Responsibility**: Each service should handle one domain
2. **Dependency Injection**: Use constructor injection
3. **Business Logic**: Keep all business logic in services, not controllers
4. **Transactions**: Use Prisma transactions for multi-step operations
5. **Error Handling**: Throw appropriate HTTP exceptions
6. **Validation**: Validate business rules before database operations
7. **Security**: Always filter by companyId for multi-tenant data
8. **Formatting**: Use async formatters for consistency
9. **Testing**: Write unit tests for all public methods
10. **Documentation**: Add JSDoc comments for complex logic

## Common Patterns

### Multi-tenant Filtering
```typescript
where: {
  companyId: this.utilityService.companyId,
  // other conditions
}
```

### Soft Delete
```typescript
where: {
  isDeleted: false,
  // other conditions
}
```

### Audit Fields
```typescript
createdBy: this.utilityService.accountInformation.id,
updatedBy: this.utilityService.accountInformation.id,
```

### Prisma Transactions
```typescript
async transferFunds(fromId: number, toId: number, amount: number): Promise<void> {
  await this.prisma.$transaction(async (tx) => {
    // Multiple operations in transaction
    await tx.account.update({
      where: { id: fromId },
      data: { balance: { decrement: amount } },
    });
    
    await tx.account.update({
      where: { id: toId },
      data: { balance: { increment: amount } },
    });
    
    await tx.transaction.create({
      data: {
        fromAccountId: fromId,
        toAccountId: toId,
        amount,
        type: 'TRANSFER',
      },
    });
  });
}
```