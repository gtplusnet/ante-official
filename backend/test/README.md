# Backend Testing Documentation

This document outlines the comprehensive testing setup for the Ante backend application built with NestJS, Prisma, and Jest.

## Testing Philosophy

Our testing strategy follows the testing pyramid approach:
- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test component interactions
- **E2E Tests**: Test complete user workflows
- **API Tests**: Test HTTP endpoints and contracts

## Test Structure

```
test/
├── setup.ts                 # Global test configuration
├── test-utils.ts            # Testing utilities and helpers
├── jest.config.js           # Unit test configuration
├── jest-e2e.json           # E2E test configuration
├── api/                     # API testing setup
│   ├── jest.config.js
│   └── setup.ts
└── README.md               # This file

src/
├── **/*.spec.ts            # Unit tests alongside source code
├── common/
│   ├── *.service.spec.ts   # Common service tests
│   └── *.middleware.spec.ts # Middleware tests
└── modules/
    └── **/*.spec.ts        # Module-specific tests
```

## Available Test Commands

### Basic Testing
```bash
# Run all unit tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage report
yarn test:coverage

# Debug tests
yarn test:debug
```

### Targeted Testing
```bash
# Run only unit tests
yarn test:unit

# Run unit tests in watch mode
yarn test:unit:watch

# Run unit tests with coverage
yarn test:unit:coverage

# Run tests by category
yarn test:services      # All service tests
yarn test:controllers   # All controller tests
yarn test:middleware    # All middleware tests
yarn test:common       # All common module tests

# Run E2E tests
yarn test:e2e

# Run API tests
yarn test:api

# Run all test suites
yarn test:all
```

## Test Configuration

### Coverage Thresholds
We maintain the following minimum coverage requirements:
- **Functions**: 80%
- **Lines**: 80%
- **Branches**: 70%
- **Statements**: 80%

### Jest Configuration Highlights
- **Test Environment**: Node.js
- **Transform**: TypeScript files using ts-jest
- **Module Resolution**: Path mapping for clean imports
- **Setup**: Global test utilities and mocks
- **Timeout**: 30 seconds per test
- **Workers**: Single worker for database consistency

## Writing Tests

### Test File Naming
- Unit tests: `*.spec.ts` (alongside source files)
- Integration tests: `*.integration.spec.ts`
- E2E tests: `*.e2e-spec.ts`

### Test Structure Example

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { YourService } from './your.service';
import { createServiceTestingModule } from '../../test/test-utils';

describe('YourService', () => {
  let service: YourService;
  let module: TestingModule;

  beforeEach(async () => {
    const testModule = await createServiceTestingModule(YourService, {
      // Custom mocks if needed
    });
    
    module = testModule.module;
    service = testModule.service;
  });

  afterEach(async () => {
    await module.close();
  });

  describe('yourMethod', () => {
    it('should handle happy path', async () => {
      // Arrange
      const input = { test: 'data' };
      
      // Act
      const result = await service.yourMethod(input);
      
      // Assert
      expect(result).toBeDefined();
      expect(result).toHaveProperty('expectedProperty');
    });

    it('should handle error scenarios', async () => {
      // Test error conditions
      await expect(service.yourMethod(null))
        .rejects.toThrow('Expected error message');
    });
  });
});
```

## Test Utilities

### Mock Factories
Use our pre-built mock factories for consistent testing:

```typescript
import { 
  createMockPrismaService,
  createMockUtilityService,
  TestDataGenerator 
} from '../test/setup';

// Create consistent mocks
const mockPrisma = createMockPrismaService();
const mockUtility = createMockUtilityService();

// Generate test data
const testAccount = TestDataGenerator.createAccount();
const testEquipment = TestDataGenerator.createEquipment();
```

### Testing Utilities
Leverage our testing utilities for complex scenarios:

```typescript
import { 
  createTestingModule,
  expectThrowsAsync,
  DateUtils,
  AsyncTestUtils 
} from '../test/test-utils';

// Test async operations
await expectThrowsAsync(() => service.methodThatShouldFail());

// Test date operations
expect(DateUtils.isApproximatelyEqual(date1, date2)).toBe(true);

// Wait for conditions
await AsyncTestUtils.waitForCondition(() => someCondition);
```

## Testing Patterns

### Service Testing
- Mock all dependencies using our mock factories
- Test both success and failure scenarios
- Verify database interactions without actual DB calls
- Test business logic thoroughly

### Controller Testing
- Mock services and focus on HTTP handling
- Test request/response mapping
- Verify error handling and status codes
- Test authentication and authorization

### Middleware Testing
- Test request/response transformation
- Verify authentication logic
- Test error handling and next() calls
- Cover all conditional paths

### Database Testing
- Use mock Prisma service in unit tests
- Test queries and mutations separately
- Verify transaction handling
- Test edge cases like connection failures

## Best Practices

### Test Organization
1. **Group related tests** using `describe` blocks
2. **Use descriptive test names** that explain what's being tested
3. **Follow AAA pattern**: Arrange, Act, Assert
4. **Keep tests focused** on single functionality
5. **Use beforeEach/afterEach** for setup and cleanup

### Mocking Strategy
1. **Mock external dependencies** to isolate units under test
2. **Use type-safe mocks** with proper TypeScript typing
3. **Reset mocks** between tests to avoid interference
4. **Mock at the boundary** - don't mock what you're testing

### Data Management
1. **Use test data factories** for consistent test data
2. **Avoid hardcoded values** when possible
3. **Create realistic test scenarios** that mirror production
4. **Clean up test data** to prevent test pollution

### Error Testing
1. **Test all error conditions** your code handles
2. **Verify error messages** are appropriate
3. **Test error propagation** through layers
4. **Check error logging** and monitoring

## Troubleshooting

### Common Issues

#### Tests Timing Out
```bash
# Increase timeout or check for unresolved promises
jest.setTimeout(60000); // in test file
```

#### Database Connection Issues
```bash
# Ensure proper mock setup
const mockPrisma = createMockPrismaService();
// Always disconnect after tests
afterEach(async () => {
  await mockPrisma.$disconnect();
});
```

#### Import Resolution Problems
```bash
# Check tsconfig paths and jest moduleNameMapper
# Ensure consistent path aliases
```

#### Memory Leaks
```bash
# Run with --detectLeaks flag
yarn test --detectLeaks
```

### Debugging Tests
1. Use `test:debug` script for debugging
2. Add `console.log` statements temporarily
3. Use Jest's `--verbose` flag for detailed output
4. Check test setup and teardown processes

## Coverage Reports

Coverage reports are generated in the `coverage/` directory:
- **HTML Report**: `coverage/lcov-report/index.html`
- **Text Summary**: Console output
- **LCOV Format**: `coverage/lcov.info`

To view coverage:
```bash
yarn test:coverage
open coverage/lcov-report/index.html
```

## Continuous Integration

Tests are automatically run in CI/CD pipelines:
- Unit tests must pass before merging
- Coverage thresholds must be met
- E2E tests run on staging deployments

## Contributing

When adding new features:
1. **Write tests first** (TDD approach recommended)
2. **Ensure 80%+ coverage** for new code
3. **Update existing tests** when modifying behavior
4. **Add integration tests** for new endpoints
5. **Document complex test scenarios**

For questions or issues with testing, please refer to:
- NestJS Testing Documentation
- Jest Documentation
- Our internal testing guidelines