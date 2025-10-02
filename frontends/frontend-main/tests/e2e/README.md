# End-to-End Testing with Playwright

This directory contains Playwright end-to-end tests for the ANTE ERP frontend application, with a focus on continuous testing flows like login to task creation.

## 🚀 Quick Start

### Prerequisites
1. Make sure the development server is running: `yarn dev`
2. Application should be accessible at `http://localhost:9000`

### Running Tests

#### Using npm scripts (Recommended):
```bash
# Run with visible browser (headed mode)
yarn test:login-task:headed

# Run in debug mode (interactive)
yarn test:login-task:debug

# Run with extra slow motion for visibility
yarn test:login-task:slow

# Run normally (headless)
yarn test:login-task
```

#### Using the test runner script:
```bash
# Run in headed mode (browser visible)
./tests/e2e/scripts/run-test.sh headed

# Run in debug mode
./tests/e2e/scripts/run-test.sh debug

# Run with slow motion
./tests/e2e/scripts/run-test.sh slow
```

#### Using Playwright directly:
```bash
# Run specific test with browser visible
npx playwright test login-to-task.spec.ts --headed

# Run with Playwright inspector (debug mode)
npx playwright test login-to-task.spec.ts --debug

# Run with custom timeout
npx playwright test login-to-task.spec.ts --timeout=120000
```

## 📋 Test Structure

### Test Flow: Login to Task Creation
The main test (`login-to-task.spec.ts`) performs the following steps:

1. **Login Process** 🔐
   - Navigate to login page
   - Fill username: `guillermotabligan`
   - Fill password: `water123`
   - Submit login form
   - Verify successful navigation to dashboard

2. **Dashboard Navigation** 🏠
   - Wait for dashboard to load completely
   - Verify dashboard elements are present
   - Identify available widgets

3. **Task Widget Interaction** 📋
   - Locate the Task Widget on dashboard
   - Click the "more" menu button
   - Click "Create Task" option

4. **Task Creation Form** ✏️
   - Wait for task creation dialog to open
   - Fill task details:
     - Assign mode: SELF
     - Title: Auto-generated unique title
     - Difficulty: EASY
     - Description: Test description
   - Submit the task

5. **Verification** 🎉
   - Verify task creation success
   - Confirm dialog closes
   - Take screenshots for evidence

## 📁 Project Structure

```
tests/e2e/
├── config/
│   ├── global-setup.ts         # Global test setup
│   ├── global-teardown.ts      # Global test cleanup
│   └── test.config.ts          # Test configuration and constants
├── fixtures/
│   └── test-data.ts            # Test data (users, tasks)
├── helpers/
│   ├── auth.helper.ts          # Authentication utilities
│   └── wait.helper.ts          # Wait and timing utilities
├── pages/
│   ├── BasePage.ts             # Base page with common methods
│   ├── LoginPage.ts            # Login page object
│   ├── DashboardPage.ts        # Dashboard page object
│   └── TaskWidgetPage.ts       # Task widget page object
├── scripts/
│   ├── run-test.sh            # Test runner script
│   └── setup-screenshots.sh   # Setup utility
├── specs/
│   └── login-to-task.spec.ts   # Main test specification
└── README.md                   # This file
```

## 🎯 Page Object Model

The tests use the Page Object Model (POM) pattern for maintainability:

- **BasePage**: Common functionality shared by all pages
- **LoginPage**: Login form interactions
- **DashboardPage**: Dashboard navigation and widget interaction
- **TaskWidgetPage**: Task creation dialog and form handling

## 🏷️ Data Test IDs

The following data-testid attributes have been added to components:

### Login Form
- `data-testid="manual-login-button"` - Manual login toggle
- `data-testid="login-username-input"` - Username input field
- `data-testid="login-password-input"` - Password input field
- `data-testid="login-submit-button"` - Submit button

### Task Widget
- `data-testid="task-widget-more-menu"` - More menu button
- `data-testid="task-create-button"` - Create task menu item

### Task Creation Dialog
- `data-testid="task-assign-mode-select"` - Assign mode dropdown
- `data-testid="task-title-input"` - Task title input
- `data-testid="task-difficulty-select"` - Difficulty dropdown
- `data-testid="task-description-editor"` - Description editor
- `data-testid="task-submit-button"` - Create task button

## 📸 Screenshots and Videos

Tests automatically capture:
- Screenshots at key steps
- Screenshots on failure
- Videos of test execution (in headless mode)
- Full page screenshots for debugging

Results are saved in `test-results/` directory:
```
test-results/
├── screenshots/
│   ├── 01-after-login.png
│   ├── 02-dashboard-loaded.png
│   ├── 03-task-menu-opened.png
│   ├── 04-task-dialog-opened.png
│   └── 05-task-created-success.png
├── videos/
└── test-results.html
```

## 🔧 Configuration

### Test Configuration (`playwright.config.ts`)
- **Headless**: Set to `false` for visual testing
- **Slow Motion**: 500ms between actions for visibility
- **Timeout**: 60 seconds per test
- **Browsers**: Chromium (can be extended to Firefox, Safari)
- **Base URL**: http://localhost:9000

### Test Environment
- **User Credentials**: guillermotabligan / water123
- **Target URL**: Local development server
- **Browser**: Chromium with slow motion

## 🐛 Debugging

### If Tests Fail:
1. **Check Screenshots**: Look in `screenshots/` folder
2. **Check Console**: Test logs show each step
3. **Use Debug Mode**: `yarn test:login-task:debug`
4. **Verify Server**: Ensure `yarn dev` is running

### Common Issues:
- **Server not running**: Start with `yarn dev`
- **Elements not found**: Check if data-testid attributes are present
- **Timing issues**: Use debug mode to step through
- **Network issues**: Check API responses in browser devtools

## 📊 Reports

After running tests:
```bash
# View HTML report
npx playwright show-report

# Or open directly
open test-results/index.html
```

## 🔄 Adding New Tests

To add new test flows:

1. **Create new spec file** in `specs/` directory
2. **Add page objects** if needed in `pages/` directory
3. **Update test data** in `fixtures/test-data.ts`
4. **Add npm scripts** in `package.json`
5. **Add data-testid attributes** to relevant components

### Example Test Structure:
```typescript
test('New test flow', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);
  
  await test.step('Login', async () => {
    await loginPage.login(getTestUser());
  });
  
  await test.step('Navigate to feature', async () => {
    // Test implementation
  });
});
```

## 📝 Best Practices

1. **Use Page Objects**: Keep test logic separate from page interactions
2. **Add data-testid**: Use semantic test identifiers
3. **Wait Properly**: Use smart waits instead of fixed timeouts
4. **Take Screenshots**: Document test progression
5. **Handle Loading States**: Wait for Quasar components to load
6. **Use Test Steps**: Organize test flow clearly
7. **Provide Fallbacks**: Have backup selectors for robustness

## 🎯 Test Credentials

**Default Test User:**
- Username: `guillermotabligan`
- Password: `water123`
- Email: `guillermotabligan00@gmail.com`

> **Note**: These are test credentials for the development environment only.