# API Testing Suite

This directory contains automated API tests for the Ante backend using Jest and Supertest.

## 🚨 MANDATORY REQUIREMENT 🚨

**ALL new API endpoints MUST have corresponding tests.** This is not optional - it's a required part of API development.

### Why is this mandatory?
- Ensures API contracts are maintained
- Catches breaking changes early
- Documents expected behavior
- Prevents regression bugs
- Validates error handling

## Available Commands

Run all API tests:
```bash
npm run test:api
```

Run tests in watch mode (auto-rerun on file changes):
```bash
npm run test:api:watch
```

Run tests with detailed output:
```bash
npm run test:api:verbose
```

Run tests with coverage report:
```bash
npm run test:api:coverage
```

Run specific test file:
```bash
npm run test:api auth.api.spec.ts
```

## Test Structure

- `test-helpers.ts` - Utility functions and test helpers
- `*.api.spec.ts` - API test files for different modules
- `setup.ts` - Global test setup and configuration
- `jest.config.js` - Jest configuration for API tests

## Writing New Tests (REQUIRED for all new APIs)

When you create any new API endpoint, you MUST:

1. Create a new file with `.api.spec.ts` extension
2. Import the test helpers:
```typescript
import { ApiTestHelper, testDataFactory, assertSuccessResponse } from './test-helpers';
```

3. Follow the existing test patterns:
```typescript
describe('Module API Endpoints', () => {
  let testHelper: ApiTestHelper;

  beforeAll(async () => {
    testHelper = new ApiTestHelper();
    await testHelper.initialize();
  });

  afterAll(async () => {
    await testHelper.close();
  });

  // Your tests here
});
```

## Test Environment

Tests use a separate test database configured in `.env.test`. Make sure to:
1. Create a test database: `geer_ante_test`
2. Run migrations on test database before running tests
3. Keep test data isolated from development/production

## Common Assertions

- `assertSuccessResponse(response)` - Check for successful response
- `assertErrorResponse(response, statusCode)` - Check for error response
- `assertPaginatedResponse(response)` - Check for paginated response

## Tips

- Tests run with `--runInBand` to avoid database conflicts
- Use `--forceExit` to ensure proper cleanup
- Create unique test data (e.g., use timestamps in emails)
- Clean up test data in `afterAll` hooks when necessary