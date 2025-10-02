---
description: Testing rules and patterns for backend
globs: backend/**/*.spec.ts
alwaysApply: false
---

# Backend Testing Rules

## Test File Organization

- Place test files next to the source files
- Use `.spec.ts` suffix for test files
- Follow the same folder structure as source code

```
employee/
├── employee.controller.ts
├── employee.controller.spec.ts
├── employee.service.ts
├── employee.service.spec.ts
└── employee.module.ts
```

## Service Testing

### Basic Service Test Structure

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeService } from './employee.service';
import { PrismaService } from '@common/services/prisma.service';
import { UtilityService } from '@common/services/utility.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('EmployeeService', () => {
  let service: EmployeeService;
  let prismaService: PrismaService;
  let utilityService: UtilityService;

  const mockPrismaService = {
    employee: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockUtilityService = {
    companyId: 1,
    accountInformation: { id: 1, email: 'test@test.com' },
    dateFormat: jest.fn((date) => date.toISOString()),
    currencyFormat: jest.fn((amount) => `$${amount}`),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: UtilityService,
          useValue: mockUtilityService,
        },
      ],
    }).compile();

    service = module.get<EmployeeService>(EmployeeService);
    prismaService = module.get<PrismaService>(PrismaService);
    utilityService = module.get<UtilityService>(UtilityService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Test cases...
});
```

### Testing Create Methods

```typescript
describe('create', () => {
  const createDto = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    departmentId: 1,
  };

  it('should create an employee successfully', async () => {
    const mockEmployee = {
      id: 1,
      ...createDto,
      companyId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockPrismaService.employee.create.mockResolvedValue(mockEmployee);

    const result = await service.create(createDto);

    expect(mockPrismaService.employee.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        ...createDto,
        companyId: 1,
        createdBy: 1,
      }),
      include: { department: true },
    });

    expect(result).toEqual(expect.objectContaining({
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
    }));
  });

  it('should throw BadRequestException for duplicate email', async () => {
    mockPrismaService.employee.findFirst.mockResolvedValue({ id: 2 });

    await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
  });
});
```

### Testing Find Methods

```typescript
describe('findOne', () => {
  it('should return an employee', async () => {
    const mockEmployee = {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      department: { id: 1, name: 'IT' },
    };

    mockPrismaService.employee.findFirst.mockResolvedValue(mockEmployee);

    const result = await service.findOne(1);

    expect(mockPrismaService.employee.findFirst).toHaveBeenCalledWith({
      where: { id: 1, companyId: 1 },
      include: { department: true, manager: true },
    });

    expect(result).toEqual(expect.objectContaining({
      id: 1,
      firstName: 'John',
    }));
  });

  it('should throw NotFoundException when employee not found', async () => {
    mockPrismaService.employee.findFirst.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });
});
```

### Testing Update Methods

```typescript
describe('update', () => {
  const updateDto = { firstName: 'Jane' };

  it('should update an employee', async () => {
    const existingEmployee = { id: 1, firstName: 'John' };
    const updatedEmployee = { id: 1, firstName: 'Jane' };

    mockPrismaService.employee.findFirst.mockResolvedValue(existingEmployee);
    mockPrismaService.employee.update.mockResolvedValue(updatedEmployee);

    const result = await service.update(1, updateDto);

    expect(mockPrismaService.employee.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: expect.objectContaining({
        firstName: 'Jane',
        updatedBy: 1,
      }),
      include: { department: true },
    });

    expect(result.firstName).toBe('Jane');
  });
});
```

## Controller Testing

### Basic Controller Test Structure

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { UtilityService } from '@common/services/utility.service';
import { Response } from 'express';

describe('EmployeeController', () => {
  let controller: EmployeeController;
  let service: EmployeeService;
  let utilityService: UtilityService;

  const mockEmployeeService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockUtilityService = {
    responseHandler: jest.fn((promise, res) => {
      return promise.then((data) => {
        res.json({ success: true, data });
      });
    }),
  };

  const mockResponse = () => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeeController],
      providers: [
        {
          provide: EmployeeService,
          useValue: mockEmployeeService,
        },
        {
          provide: UtilityService,
          useValue: mockUtilityService,
        },
      ],
    }).compile();

    controller = module.get<EmployeeController>(EmployeeController);
    service = module.get<EmployeeService>(EmployeeService);
    utilityService = module.get<UtilityService>(UtilityService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Test cases...
});
```

### Testing Controller Endpoints

```typescript
describe('create', () => {
  it('should create an employee', async () => {
    const createDto = { firstName: 'John', lastName: 'Doe' };
    const mockResult = { id: 1, ...createDto };
    const res = mockResponse();

    mockEmployeeService.create.mockResolvedValue(mockResult);

    await controller.create(res, createDto);

    expect(mockEmployeeService.create).toHaveBeenCalledWith(createDto);
    expect(mockUtilityService.responseHandler).toHaveBeenCalled();
  });
});

describe('findOne', () => {
  it('should return an employee', async () => {
    const mockResult = { id: 1, firstName: 'John' };
    const res = mockResponse();

    mockEmployeeService.findOne.mockResolvedValue(mockResult);

    await controller.findOne(res, 1);

    expect(mockEmployeeService.findOne).toHaveBeenCalledWith(1);
    expect(mockUtilityService.responseHandler).toHaveBeenCalled();
  });
});
```

## Integration Testing

### Database Integration Tests

```typescript
import { Test } from '@nestjs/testing';
import { PrismaService } from '@common/services/prisma.service';
import { EmployeeService } from './employee.service';

describe('EmployeeService (Integration)', () => {
  let service: EmployeeService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [EmployeeService, PrismaService, UtilityService],
    }).compile();

    service = module.get<EmployeeService>(EmployeeService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    // Clean database
    await prisma.employee.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create and retrieve an employee', async () => {
    const createDto = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    };

    const created = await service.create(createDto);
    const found = await service.findOne(created.id);

    expect(found).toEqual(expect.objectContaining({
      id: created.id,
      firstName: 'John',
      lastName: 'Doe',
    }));
  });
});
```

## Testing Best Practices

1. **Test Organization**
   - Group related tests using `describe` blocks
   - Use clear, descriptive test names
   - Follow AAA pattern: Arrange, Act, Assert

2. **Mocking**
   - Mock external dependencies
   - Use `jest.fn()` for function mocks
   - Clear mocks between tests

3. **Assertions**
   - Test both success and error cases
   - Verify function calls with correct parameters
   - Use `expect.objectContaining` for partial matches

4. **Test Data**
   - Use factories or builders for complex test data
   - Keep test data minimal but realistic
   - Avoid hardcoding IDs when possible

5. **Error Testing**
   ```typescript
   it('should handle errors', async () => {
     mockService.method.mockRejectedValue(new Error('Test error'));
     
     await expect(service.method()).rejects.toThrow('Test error');
   });
   ```

6. **Async Testing**
   ```typescript
   it('should handle async operations', async () => {
     const promise = service.asyncMethod();
     
     await expect(promise).resolves.toBeDefined();
     // or
     await expect(promise).rejects.toThrow();
   });
   ```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run specific test file
npm test employee.service.spec.ts

# Run tests matching pattern
npm test -- --testNamePattern="should create"
```

## Test Coverage Goals

- Aim for at least 80% code coverage
- Focus on testing business logic
- Test edge cases and error scenarios
- Don't test framework code or simple getters/setters