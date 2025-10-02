# Ante Application Sitemap

**Generated:** June 15, 2025  
**Total Pages Discovered:** 8 main sections

## Test Credentials

**Username:** `guillermotabligan`  
**Password:** `water123`

> ⚠️ **Warning:** These credentials are for development and testing only. Do not use in production.

## Navigation Structure

The Ante ERP system is organized into the following main sections:

### 📊 Dashboard
- **URL:** `/member/dashboard`
- **Description:** Main dashboard with progress overview, request panels, and task statistics
- **Screenshot:** [View Dashboard](screenshots/docs/dashboard.png)

### 📁 Projects
- **URL:** `/member/project`
- **Description:** Project management interface
- **Screenshot:** [View Projects](screenshots/docs/projects.png)

### 📦 Asset Management
- **URL:** `/member/asset/warehouse`
- **Description:** Warehouse and inventory management
- **Screenshot:** [View Asset Management](screenshots/docs/asset-management.png)

### 📅 Calendar
- **URL:** `/member/calendar`
- **Description:** Calendar and scheduling interface
- **Screenshot:** [View Calendar](screenshots/docs/calendar.png)

### 📣 Leads
- **URL:** `/member/leads`
- **Description:** Lead management and CRM functionality
- **Screenshot:** [View Leads](screenshots/docs/leads.png)

### 💰 Treasury
- **URL:** `/member/asset/treasury`
- **Description:** Financial management and treasury operations
- **Screenshot:** [View Treasury](screenshots/docs/treasury.png)

### ⚙️ Settings
- **URL:** `/member/settings/company`
- **Description:** System settings and company configuration
- **Screenshot:** [View Settings](screenshots/docs/settings.png)

## Screenshot Repository

All screenshots are stored in the `screenshots/docs/` directory. Each screenshot captures the full page view of the respective section.

### Viewing Screenshots

To view any screenshot in Claude Code, use:
```bash
# Example: View the dashboard
Read /home/jdev/geer-ante/screenshots/docs/dashboard.png

# View any section
Read /home/jdev/geer-ante/screenshots/docs/[section-name].png
```

### Available Screenshots
- `dashboard.png` - Main dashboard view
- `projects.png` - Project management interface
- `asset-management.png` - Warehouse/inventory view
- `calendar.png` - Calendar interface
- `leads.png` - Lead management view
- `treasury.png` - Financial management
- `settings.png` - System settings

## Navigation Flow

1. **Login** → Redirects to `/member/dashboard`
2. **Sidebar Navigation** → Always visible on left side
3. **Main Sections** → Click sidebar items to navigate
4. **Sub-sections** → Some sections have additional tabs/sub-navigation

## URL Structure

All authenticated pages follow the pattern:
- Base: `http://localhost:9000/member/`
- Section: `[section-name]/`
- Sub-section: `[sub-section-name]` (if applicable)

## Testing Navigation

Use the following Playwright commands to navigate:
```typescript
// Login
await loginToAnte(page);

// Navigate to specific section
await page.click('.q-drawer .q-item--clickable:has-text("Projects")');

// Wait for page load
await page.waitForLoadState('networkidle');
```

## Updating This Sitemap

To regenerate screenshots and update navigation:
```bash
# Run focused site explorer
yarn playwright test tests/e2e/explorer/site-explorer-focused.spec.ts --project=chromium

# Or use the convenience script
yarn docs:screenshots
```

---

*This sitemap was generated using automated Playwright exploration of the Ante application.*