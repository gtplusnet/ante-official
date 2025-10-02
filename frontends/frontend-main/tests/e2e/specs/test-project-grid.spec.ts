import { test, expect } from '@playwright/test';

test.describe('Project Grid View with Supabase', () => {
  test('should load project grid using Supabase', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser Error:', msg.text());
      }
    });

    // Step 1: Navigate to login page
    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:9000/#/login');
    await page.waitForLoadState('networkidle');

    // Step 2: Login
    console.log('2. Logging in...');
    const manualLoginBtn = page.locator('button:has-text("Manual Login")').first();
    if (await manualLoginBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await manualLoginBtn.click();
      await page.waitForTimeout(500);
    }

    const usernameInput = page.locator('input[placeholder*="username" i], input[placeholder*="email" i]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    await expect(usernameInput).toBeVisible({ timeout: 5000 });
    await usernameInput.fill('guillermotabligan');
    await passwordInput.fill('water123');

    const submitBtn = page.locator('button:has-text("Sign In"), button[type="submit"]').first();
    await submitBtn.click();

    // Wait for login to complete
    await page.waitForURL(url => !url.includes('login'), { timeout: 15000 });
    console.log('✓ Login successful');

    // Step 3: Navigate to Project List
    console.log('3. Navigating to Project List...');
    await page.goto('http://localhost:9000/#/member/project');
    await page.waitForLoadState('networkidle');

    // Step 4: Wait for projects to load
    console.log('4. Waiting for projects to load...');
    await page.waitForTimeout(2000); // Give time for Supabase to fetch data

    // Step 5: Check for project cards or no projects message
    console.log('5. Checking for project content...');
    const projectCards = page.locator('.grid-box');
    const noProjects = page.locator('.no-projects-text');

    const hasProjects = await projectCards.count() > 0;
    const hasNoProjectsMessage = await noProjects.isVisible({ timeout: 1000 }).catch(() => false);

    if (hasProjects) {
      console.log(`✓ Found ${await projectCards.count()} project(s)`);

      // Check first project card has expected content
      const firstCard = projectCards.first();
      await expect(firstCard).toBeVisible();

      const projectTitle = firstCard.locator('.grid-box-title');
      const titleText = await projectTitle.textContent();
      console.log(`  First project: ${titleText}`);
    } else if (hasNoProjectsMessage) {
      console.log('✓ No projects found (showing empty state)');
    } else {
      console.log('⚠ Page loaded but no content detected');
    }

    // Step 6: Check for errors
    const pageContent = await page.textContent('body');
    const hasErrors = pageContent.includes('error') || pageContent.includes('Error');

    if (hasErrors) {
      console.log('⚠ Possible errors detected on page');
    } else {
      console.log('✓ No errors detected');
    }

    // Take screenshot
    await page.screenshot({ path: 'screenshots/project-grid-supabase.png' });
    console.log('7. Screenshot saved to screenshots/project-grid-supabase.png');

    // Assert that either projects or no-projects message is visible
    expect(hasProjects || hasNoProjectsMessage).toBe(true);
  });
});