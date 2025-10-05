# Run E2E Testing for Current Feature

You are tasked with running comprehensive E2E tests for the current feature being developed. Follow these steps meticulously and don't stop until all features are working perfectly.

## Step 1: Identify Current Feature
- Check the current git branch name
- Review recent commits to understand what feature is being developed
- Identify which frontend app is affected (frontend-main, gate-app, guardian-app, etc.)

## Step 2: Locate Relevant Tests
- Search for E2E test files related to the current feature
- Check these locations:
  - `frontends/frontend-main/tests/e2e/`
  - `frontends/frontend-gate-app/tests/e2e/`
  - `frontends/frontend-guardian-app/tests/e2e/`
  - `playwright-testing/` (centralized tests)
- If no tests exist, identify what tests need to be created based on the feature

## Step 3: Verify Services are Running
Before running tests, ensure all required services are running:

```bash
# Check PM2 status
pm2 status

# Verify backend is running
curl -s http://localhost:3000/health || echo "Backend not running"

# Verify frontend is running (adjust port based on app)
curl -s http://localhost:9000 || echo "Frontend not running"

# Check if services need to be started
# yarn dev  # Only if services are not running
```

## Step 4: Run E2E Tests
Run tests in HEADLESS mode (NEVER use --headed or --ui):

```bash
# Navigate to the appropriate frontend directory
cd frontends/frontend-main  # or frontend-gate-app, frontend-guardian-app

# Run all E2E tests
yarn test:e2e

# Or run specific test file
npx playwright test tests/e2e/your-feature.spec.ts --project=chromium

# Or run tests matching a pattern
npx playwright test --grep "feature-name"
```

## Step 5: Analyze Test Results
- Review test output for failures
- Check generated screenshots in `test-results/` folder
- Review Playwright HTML report: `npx playwright show-report`
- Check for console errors logged during tests

## Step 6: Fix Issues
When tests fail, determine the root cause:

### If it's a CODE issue:
- Fix the implementation in the source files
- Re-run tests to verify the fix

### If it's a TEST issue:
- Update test assertions to match correct behavior
- Fix selectors if UI structure changed
- Update timeouts if operations are legitimately slower

### Common Issues to Check:
1. **Timing issues**: Add proper waits for elements/API calls
2. **Selector issues**: Verify elements exist with correct data-testid
3. **API issues**: Check backend responses and error handling
4. **State issues**: Verify component state updates correctly
5. **Animation issues**: Wait for animations to complete
6. **Cache issues**: Test both cached and fresh data scenarios

## Step 7: Verify All Features Work
Test the complete user flow:
- Login and authentication
- Navigation to feature
- All interactive elements (buttons, forms, drag-and-drop)
- Data loading and refresh
- Error handling
- Edge cases (empty states, loading states, error states)

## Step 8: Run Tests Multiple Times
Run tests at least 2-3 times to ensure consistency:

```bash
# Run tests multiple times to check for flakiness
for i in {1..3}; do
  echo "Test run $i"
  npx playwright test tests/e2e/your-feature.spec.ts
done
```

## Step 9: Clean Up and Document
- Remove any debug code or console.logs
- Update test documentation if needed
- Take note of any known issues or limitations

## Step 10: Final Verification
- Run the full E2E test suite to ensure no regressions
- Verify no console errors in test output
- Check that all screenshots look correct
- Confirm all acceptance criteria are met

## Success Criteria
 All E2E tests pass consistently
 No console errors during test execution
 All user interactions work as expected
 Loading states and animations work correctly
 Error handling works properly
 Tests are not flaky (pass multiple times)

## If Tests Keep Failing
1. Review the feature requirements and acceptance criteria
2. Compare with working similar features in the codebase
3. Check for breaking changes in dependencies
4. Verify environment configuration is correct
5. Ask user for clarification if behavior is ambiguous

## Important Reminders
-   NEVER use `--headed` or `--ui` flags (per CLAUDE.md)
-   Always run tests in headless mode
-   Check PM2 logs if backend issues: `pm2 logs ante-backend --lines 50 --nostream`
-   Tests should run on http://localhost:9000 for frontend-main
-   Use test credentials: guillermotabligan / water123

---

**Keep iterating through Steps 4-6 until all tests pass and the feature works perfectly. Do not stop until everything is working correctly.**
