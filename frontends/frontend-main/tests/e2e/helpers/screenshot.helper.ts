import { Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

export class ScreenshotHelper {
  private stepCounter: number = 1;
  private testName: string;
  private screenshotDir: string = 'screenshots';

  constructor(testName: string) {
    this.testName = testName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    this.ensureScreenshotDirectory();
  }

  private ensureScreenshotDirectory(): void {
    const testDir = path.join(this.screenshotDir, this.testName);
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  }

  async takeStepScreenshot(page: Page, stepDescription: string): Promise<string> {
    const stepName = stepDescription.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const filename = `${String(this.stepCounter).padStart(2, '0')}-${stepName}.png`;
    const filepath = path.join(this.screenshotDir, this.testName, filename);
    
    await page.screenshot({ 
      path: filepath,
      fullPage: true 
    });
    
    console.log(`📸 Screenshot ${this.stepCounter}: ${stepDescription} -> ${filepath}`);
    this.stepCounter++;
    
    return filepath;
  }

  async takeDebugScreenshot(page: Page, context: string): Promise<string> {
    const filename = `debug-${context.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`;
    const filepath = path.join(this.screenshotDir, this.testName, filename);
    
    await page.screenshot({ 
      path: filepath,
      fullPage: true 
    });
    
    console.log(`🔍 Debug screenshot: ${context} -> ${filepath}`);
    
    return filepath;
  }

  resetCounter(): void {
    this.stepCounter = 1;
  }
}

export function createScreenshotHelper(testName: string): ScreenshotHelper {
  return new ScreenshotHelper(testName);
}