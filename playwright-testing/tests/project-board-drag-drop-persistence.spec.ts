import { test, expect } from '@playwright/test';

/**
 * Test Suite: Project Board Drag-Drop Persistence
 *
 * Purpose: Verify that drag-and-drop operations on the project board
 * persist correctly after page refresh
 *
 * User Story: When I drag a project card to a different column on the board,
 * the project should remain in that column after I refresh the page
 */

test.describe('Project Board Drag-Drop Persistence', () => {
  // Store console errors and warnings
  const consoleErrors: string[] = [];
  const consoleWarnings: string[] = [];
  const apiErrors: string[] = [];

  // Increase test timeout to 60 seconds
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    // Reset arrays
    consoleErrors.length = 0;
    consoleWarnings.length = 0;
    apiErrors.length = 0;

    // Monitor console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });

    // Monitor network errors
    page.on('response', (response) => {
      if (!response.ok() && response.status() !== 304) {
        apiErrors.push(`${response.status()} ${response.url()}`);
      }
    });

    // Login with increased timeout
    await page.goto('http://localhost:9000', { timeout: 30000 });

    // Wait for auth check to complete (spinner disappears)
    await page.waitForLoadState('networkidle');

    // Click "Sign in manually" button to show the username/password form
    await page.waitForSelector('[data-testid="manual-login-button"]', { timeout: 20000 });
    await page.click('[data-testid="manual-login-button"]');

    // Fill in credentials
    await page.waitForSelector('[data-testid="login-username-input"]', { timeout: 10000 });
    await page.fill('[data-testid="login-username-input"]', 'guillermotabligan');
    await page.fill('[data-testid="login-password-input"]', 'water123');

    // Submit login form
    await page.click('[data-testid="login-submit-button"]');

    // Wait for navigation to complete
    await page.waitForURL('http://localhost:9000/#/member/dashboard', { timeout: 20000 });
  });

  test('should persist project when dragged to Construction column and page is refreshed', async ({ page }) => {
    // Navigate to Project Board
    await page.goto('http://localhost:9000/#/member/project/board');
    await page.waitForLoadState('networkidle');

    // Wait for loading spinner to disappear
    await page.waitForSelector('.q-spinner-dots', { state: 'hidden', timeout: 15000 }).catch(() => {});

    // Wait for board columns to load
    await page.waitForSelector('.board-column', { timeout: 15000 });

    // Find a project in Planning column
    const planningColumn = page.locator('.board-column').filter({ hasText: 'Planning' }).first();
    const projectCard = planningColumn.locator('.project-card').first();

    // Verify project exists in Planning
    await expect(projectCard).toBeVisible({ timeout: 5000 });
    const projectName = await projectCard.locator('.project-name, [class*="name"]').first().textContent();
    console.log(`Found project: ${projectName}`);

    // Get the Construction column
    const constructionColumn = page.locator('.board-column').filter({ hasText: 'Construction' }).first();
    await expect(constructionColumn).toBeVisible();

    // Listen for the PATCH API call
    const updateBoardPromise = page.waitForResponse(
      response => response.url().includes('/project/board-stage') && response.request().method() === 'PATCH',
      { timeout: 10000 }
    );

    // Perform drag and drop
    await projectCard.dragTo(constructionColumn, {
      force: true,
      targetPosition: { x: 10, y: 10 }
    });

    // Wait for API call to complete
    const updateResponse = await updateBoardPromise;
    expect(updateResponse.ok()).toBeTruthy();
    console.log('✓ Board stage update API call succeeded');

    // Get response data
    const responseData = await updateResponse.json();
    expect(responseData.projectBoardStage).toBe('construction');
    console.log(`✓ API confirmed board stage: ${responseData.projectBoardStage}`);

    // Wait a moment for UI to update
    await page.waitForTimeout(1000);

    // Verify project appears in Construction column (optimistic update)
    const constructionProjectCard = constructionColumn.locator('.project-card').filter({ hasText: projectName || '' }).first();
    await expect(constructionProjectCard).toBeVisible({ timeout: 5000 });
    console.log('✓ Project visible in Construction column before refresh');

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Wait for board to reload
    await page.waitForSelector('.board-column', { timeout: 10000 });

    // Verify project is still in Construction column after refresh
    const constructionColumnAfterRefresh = page.locator('.board-column').filter({ hasText: 'Construction' }).first();
    const projectAfterRefresh = constructionColumnAfterRefresh.locator('.project-card').filter({ hasText: projectName || '' }).first();

    await expect(projectAfterRefresh).toBeVisible({ timeout: 5000 });
    console.log('✓ Project persisted in Construction column after refresh');

    // Report console errors
    if (consoleErrors.length > 0) {
      console.error('Console Errors:', consoleErrors);
    }
    if (apiErrors.length > 0) {
      console.error('API Errors:', apiErrors);
    }

    // Verify no critical errors
    expect(consoleErrors.filter(e => !e.includes('Unrecognized feature')).length).toBe(0);
    expect(apiErrors.filter(e => !e.includes('304')).length).toBe(0);
  });

  test('should persist project when dragged to Done column and page is refreshed', async ({ page }) => {
    // Navigate to Project Board
    await page.goto('http://localhost:9000/#/member/project/board');
    await page.waitForLoadState('networkidle');

    // Wait for loading spinner to disappear
    await page.waitForSelector('.q-spinner-dots', { state: 'hidden', timeout: 15000 }).catch(() => {});

    // Wait for board columns to load
    await page.waitForSelector('.board-column', { timeout: 15000 });

    // Find a project in Planning column
    const planningColumn = page.locator('.board-column').filter({ hasText: 'Planning' }).first();
    const projectCard = planningColumn.locator('.project-card').first();

    // Verify project exists
    await expect(projectCard).toBeVisible({ timeout: 5000 });
    const projectName = await projectCard.locator('.project-name, [class*="name"]').first().textContent();
    console.log(`Found project: ${projectName}`);

    // Get the Done column
    const doneColumn = page.locator('.board-column').filter({ hasText: 'Done' }).first();
    await expect(doneColumn).toBeVisible();

    // Listen for the PATCH API call
    const updateBoardPromise = page.waitForResponse(
      response => response.url().includes('/project/board-stage') && response.request().method() === 'PATCH',
      { timeout: 10000 }
    );

    // Perform drag and drop
    await projectCard.dragTo(doneColumn, {
      force: true,
      targetPosition: { x: 10, y: 10 }
    });

    // Wait for API call to complete
    const updateResponse = await updateBoardPromise;
    expect(updateResponse.ok()).toBeTruthy();
    console.log('✓ Board stage update API call succeeded');

    // Get response data
    const responseData = await updateResponse.json();
    expect(responseData.projectBoardStage).toBe('done');
    console.log(`✓ API confirmed board stage: ${responseData.projectBoardStage}`);

    // Wait a moment for UI to update
    await page.waitForTimeout(1000);

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Wait for board to reload
    await page.waitForSelector('.board-column', { timeout: 10000 });

    // Verify project is still in Done column after refresh
    const doneColumnAfterRefresh = page.locator('.board-column').filter({ hasText: 'Done' }).first();
    const projectAfterRefresh = doneColumnAfterRefresh.locator('.project-card').filter({ hasText: projectName || '' }).first();

    await expect(projectAfterRefresh).toBeVisible({ timeout: 5000 });
    console.log('✓ Project persisted in Done column after refresh');

    // Report console errors
    if (consoleErrors.length > 0) {
      console.error('Console Errors:', consoleErrors);
    }
    if (apiErrors.length > 0) {
      console.error('API Errors:', apiErrors);
    }

    // Verify no critical errors
    expect(consoleErrors.filter(e => !e.includes('Unrecognized feature')).length).toBe(0);
    expect(apiErrors.filter(e => !e.includes('304')).length).toBe(0);
  });

  test('should handle multiple drag operations and persist all changes', async ({ page }) => {
    // Navigate to Project Board
    await page.goto('http://localhost:9000/#/member/project/board');
    await page.waitForLoadState('networkidle');

    // Wait for loading spinner to disappear
    await page.waitForSelector('.q-spinner-dots', { state: 'hidden', timeout: 15000 }).catch(() => {});

    // Wait for board columns to load
    await page.waitForSelector('.board-column', { timeout: 15000 });

    // Get all columns
    const planningColumn = page.locator('.board-column').filter({ hasText: 'Planning' }).first();
    const mobilizationColumn = page.locator('.board-column').filter({ hasText: 'Mobilization' }).first();
    const constructionColumn = page.locator('.board-column').filter({ hasText: 'Construction' }).first();

    // Get first two projects from Planning
    const project1 = planningColumn.locator('.project-card').nth(0);
    const project2 = planningColumn.locator('.project-card').nth(1);

    // Check if projects exist
    const project1Visible = await project1.isVisible({ timeout: 2000 }).catch(() => false);
    const project2Visible = await project2.isVisible({ timeout: 2000 }).catch(() => false);

    if (!project1Visible) {
      console.log('⚠ Not enough projects in Planning column to test multiple drags');
      test.skip();
      return;
    }

    const project1Name = await project1.locator('.project-name, [class*="name"]').first().textContent();
    console.log(`Found project 1: ${project1Name}`);

    // Move first project to Mobilization
    let updatePromise = page.waitForResponse(
      response => response.url().includes('/project/board-stage') && response.request().method() === 'PATCH'
    );
    await project1.dragTo(mobilizationColumn, { force: true, targetPosition: { x: 10, y: 10 } });
    await updatePromise;
    console.log('✓ Project 1 moved to Mobilization');
    await page.waitForTimeout(1000);

    // If second project exists, move it too
    if (project2Visible) {
      const project2Name = await project2.locator('.project-name, [class*="name"]').first().textContent();
      console.log(`Found project 2: ${project2Name}`);

      updatePromise = page.waitForResponse(
        response => response.url().includes('/project/board-stage') && response.request().method() === 'PATCH'
      );
      await project2.dragTo(constructionColumn, { force: true, targetPosition: { x: 10, y: 10 } });
      await updatePromise;
      console.log('✓ Project 2 moved to Construction');
      await page.waitForTimeout(1000);
    }

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.board-column', { timeout: 10000 });

    // Verify first project persisted in Mobilization
    const mobilizationAfter = page.locator('.board-column').filter({ hasText: 'Mobilization' }).first();
    const project1After = mobilizationAfter.locator('.project-card').filter({ hasText: project1Name || '' }).first();
    await expect(project1After).toBeVisible({ timeout: 5000 });
    console.log('✓ Project 1 persisted in Mobilization');

    // Verify second project persisted in Construction (if it was moved)
    if (project2Visible) {
      const project2Name = await project2.locator('.project-name, [class*="name"]').first().textContent();
      const constructionAfter = page.locator('.board-column').filter({ hasText: 'Construction' }).first();
      const project2After = constructionAfter.locator('.project-card').filter({ hasText: project2Name || '' }).first();
      await expect(project2After).toBeVisible({ timeout: 5000 });
      console.log('✓ Project 2 persisted in Construction');
    }

    // Report console errors
    if (consoleErrors.length > 0) {
      console.error('Console Errors:', consoleErrors);
    }
    if (apiErrors.length > 0) {
      console.error('API Errors:', apiErrors);
    }

    // Verify no critical errors
    expect(consoleErrors.filter(e => !e.includes('Unrecognized feature')).length).toBe(0);
    expect(apiErrors.filter(e => !e.includes('304')).length).toBe(0);
  });
});
