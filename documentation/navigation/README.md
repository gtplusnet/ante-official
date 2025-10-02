# GEER-ANTE ERP Navigation Documentation

This directory contains navigation guides for the GEER-ANTE ERP system UI.

## System Overview

The GEER-ANTE ERP is accessible at `http://localhost:9000` (development) with the following main sections:

### Main Navigation Structure
All authenticated pages follow the pattern: `/member/[section]/[subsection]`

1. **Dashboard** - `/member/dashboard`
2. **Projects** - `/member/project`  
3. **Asset Management** - `/member/asset/warehouse`
4. **Calendar** - `/member/calendar`
5. **Manpower** - `/member/manpower/payroll-time-keeping`
6. **Leads** - `/member/leads`
7. **Treasury** - `/member/asset/treasury`
8. **Settings** - `/member/settings/company`

## Test Credentials
- **Username:** guillermotabligan
- **Password:** water123
- **Email:** guillermotabligan00@gmail.com

## Navigation Testing with Playwright

**IMPORTANT:** All Playwright tests should be created in `/playwright-testing/tests/` directory, NOT in `/frontend/tests/` (which should not exist).

### Basic Navigation Test
```typescript
// Location: /playwright-testing/tests/e2e/navigation.spec.ts
import { test, expect } from '@playwright/test';

test('navigate to module', async ({ page }) => {
  // Login
  await page.goto('http://localhost:9000');
  await page.fill('input[name="username"]', 'guillermotabligan');
  await page.fill('input[name="password"]', 'water123');
  await page.click('button:has-text("Sign in")');
  
  // Wait for dashboard
  await page.waitForURL('**/member/dashboard');
  
  // Navigate to specific module
  await page.click('.q-drawer .q-item:has-text("Projects")');
  await page.waitForLoadState('networkidle');
});
```

## Module-Specific Navigation

### Projects Module
- Main: `/member/project`
- Board View: Click on project → Board tab
- Tasks: Click on specific task cards
- Settings: Project settings icon in toolbar

### Asset Management
- Warehouse: `/member/asset/warehouse`
- Inventory: Navigate through warehouse → inventory items
- Suppliers: Asset Management → Suppliers tab
- Equipment: Asset Management → Equipment tab

### Manpower (HR/Payroll)
- Timekeeping: `/member/manpower/payroll-time-keeping`
- Payroll Center: `/member/manpower/payroll-center`
- HRIS: `/member/manpower/hris`
- Configuration: `/member/manpower/configuration`

### Treasury
- Main: `/member/asset/treasury`
- Petty Cash: Treasury → Petty Cash tab
- Fund Transfer: Treasury → Fund Transfer
- Reports: Treasury → Reports section

## Common UI Patterns

### Tables (GTable Component)
Most data views use the GTable component with:
- Search box in top-right
- Pagination at bottom
- Row actions on hover (edit, delete icons)
- Column sorting by clicking headers

### Dialogs
- Add/Edit dialogs: Click "Add" button or edit icon
- Confirmation dialogs: Appear for delete actions
- Form validation: Red error text below fields

### Forms
- Required fields marked with asterisk (*)
- Validation on blur and submit
- Save/Cancel buttons at bottom

## Navigation Best Practices

1. **Always wait for network idle** after navigation:
   ```typescript
   await page.waitForLoadState('networkidle');
   ```

2. **Use specific selectors** for navigation items:
   ```typescript
   // Good
   await page.click('.q-drawer .q-item:has-text("Projects")');
   
   // Avoid
   await page.click('.q-item:nth-child(2)');
   ```

3. **Check URL after navigation**:
   ```typescript
   await expect(page).toHaveURL(/.*\/member\/project/);
   ```

## Troubleshooting Navigation Issues

### Common Problems
1. **Navigation item not found**: Sidebar may be collapsed
2. **Page doesn't load**: Check authentication status
3. **Wrong URL**: Verify base URL and port

### Debug Commands
```typescript
// Log current URL
console.log('Current URL:', page.url());

// Take screenshot for debugging
await page.screenshot({ path: 'navigation-debug.png' });

// Log visible navigation items
const items = await page.$$eval('.q-drawer .q-item', els => 
  els.map(el => el.textContent)
);
console.log('Navigation items:', items);
```

## Adding New Navigation Documentation

When documenting a new module or feature:

1. Create a new `.md` file in this directory
2. Include:
   - URL patterns
   - Navigation steps
   - UI element selectors
   - Common workflows
   - Playwright test examples
3. Update this README with a link to the new guide

## Related Documentation
- Architecture: `/documentation/architecture/ante-sitemap-reference.md`
- Frontend Testing: `/frontend/tests/e2e/README.md`
- UI Components: `/frontend/src/components/`

---

*Note: This documentation is actively being expanded. For specific module navigation not yet documented, refer to the Playwright test files or explore the UI directly.*