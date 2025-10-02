# Testing Guidelines

## 🧪 Testing

### Frontend Testing
- **E2E Tests**: `/frontends/frontend-main/tests/e2e/`
- **Playwright**: NEVER use `--headed` or `--ui` flags (always run headless)
- **Test credentials**: guillermotabligan / water123
- **When testing using playwright use**: `@agent-ante-playwright-ai-tester`

### Playwright Login Flow (IMPORTANT)
The login page uses OAuth by default. To use manual login with username/password:
1. Navigate to `http://localhost:9001/#/login`
2. Click "Manual Login" button: `[data-testid="manual-login-button"]`
3. Fill username: `[data-testid="login-username-input"] input`
4. Fill password: `[data-testid="login-password-input"] input`
5. Click submit: `[data-testid="login-submit-button"]`
6. Wait for navigation to dashboard or member area

**Example Playwright login code:**
```typescript
// Click Manual Login to show form
await page.locator('[data-testid="manual-login-button"]').click();
// Fill credentials
await page.locator('[data-testid="login-username-input"] input').fill('guillermotabligan');
await page.locator('[data-testid="login-password-input"] input').fill('water123');
// Submit
await page.locator('[data-testid="login-submit-button"]').click();
// Wait for successful login
await page.waitForURL(url => url.hash.includes('dashboard'));
```

### Backend Testing
- **API Tests**: `/backend/test/api/`
- **Unit Tests**: `/backend/test/`

## Testing Plan Rules

When working on checklist of testing-plan remember these rules:

### The goal is not just to test but to make sure testing-plan/[testing-folder]/checklist.md is all checked and Pass.
1. **MANDATORY**: If there is a problem and the requirements is not met, fix or develop the feature needed to pass.
2. **MANDATORY**: Never go to the next checklist if it's not working properly yet.
3. Update the checklist here as you move forward with testing and fix.
4. Use all the guidelines in gate-device-workflow as you move forward.
5. **MANDATORY**: Do not stop until everything is done - the goal is for all test to pass. You need to fix every problem along the way.
6. **MANDATORY**: Send a telegram message for every test that passed with brief information. Update on telegram showing number of pending test and completed test (1 out of 100 something like this)

**Think step by step!**
- No need to build after every changes unless specified by users

## Related Documentation
- **Frontend Testing Details**: `/frontends/frontend-main/tests/e2e/README.md`
- **Backend Testing Details**: `/backend/test/README.md`
- **Backend Testing Patterns**: `/documentation/standards/backend-testing-patterns.md`