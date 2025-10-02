# API Testing Guide

## 🚨 IMPORTANT: Testing is MANDATORY 🚨

**Every new API endpoint MUST have tests. This is a required part of development, not optional.**

When creating new APIs, you must:
1. Write the API endpoint
2. Write comprehensive tests for it
3. Ensure `yarn test:api` passes
4. Only then is the task complete

## ✅ Current Status

All API tests are passing successfully:
- **Test Suites**: 2 passed, 2 total
- **Tests**: 22 passed, 22 total

## 📁 Test Files

### Working Tests
1. **`auth-login-registration.api.spec.ts`** - Complete auth tests (18 tests)
   - Registration endpoint tests
   - Login endpoint tests
   - Integration tests

2. **`example.api.spec.ts`** - Example/demo tests (4 tests)
   - Shows how to write API tests
   - Simple CRUD operations

### Deprecated Files
- `auth.api.spec.ts.old` - Old test file (needs real endpoints)
- `discussion.api.spec.ts.old` - Old test file (needs real endpoints)

## 🚀 Running Tests

```bash
# Run all API tests
yarn test:api

# Run specific test file
yarn test:api auth-login-registration.api.spec.ts

# Run with verbose output
yarn test:api:verbose

# Run in watch mode for development
yarn test:api:watch

# Run with coverage report
yarn test:api:coverage
```

## 🧪 Writing New Tests

To create new API tests, follow the pattern in `auth-login-registration.api.spec.ts`:

1. Create mock DTOs with proper validation
2. Create mock service with business logic
3. Create mock controller with endpoints
4. Create mock module to bundle everything
5. Write comprehensive test cases

### Example Structure
```typescript
// 1. DTOs with validation
class CreateItemDTO {
  @IsNotEmpty()
  @IsString()
  name: string;
}

// 2. Mock Service
@Injectable()
class MockItemService {
  create(dto: CreateItemDTO) {
    // Business logic
  }
}

// 3. Mock Controller
@Controller('items')
class MockItemController {
  constructor(private service: MockItemService) {}
  
  @Post()
  create(@Body() dto: CreateItemDTO) {
    // Handle request
  }
}

// 4. Mock Module
@Module({
  controllers: [MockItemController],
  providers: [MockItemService]
})
class MockItemModule {}

// 5. Tests
describe('Item API', () => {
  let testHelper: ApiTestHelper;
  
  beforeAll(async () => {
    testHelper = new ApiTestHelper();
    await testHelper.initialize([MockItemModule]);
  });
  
  // Test cases...
});
```

## 📝 Important Notes

1. **Use Mock Implementations**: Don't depend on real database or services
2. **Test Isolation**: Each test should be independent
3. **Validation Testing**: Test both success and error cases
4. **Use Test Helpers**: Leverage the utilities in `test-helpers.ts`

## 🔧 Troubleshooting

If tests fail:
1. Check if all dependencies are installed: `yarn install`
2. Ensure test environment file exists: `.env.test`
3. Run a specific test to isolate issues
4. Check console output for detailed error messages

## 🎯 Best Practices

1. **Clear Test Names**: Describe what the test does
2. **Arrange-Act-Assert**: Structure tests clearly
3. **Test Edge Cases**: Empty values, invalid data, etc.
4. **Mock External Dependencies**: Don't rely on external services
5. **Clean Up**: Reset state between tests