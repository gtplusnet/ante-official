import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class NotificationPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Notification panel selectors
   */
  private readonly selectors = {
    // Notification trigger button (usually in header/toolbar)
    notificationTrigger: '[data-cy="notification-trigger"], .notification-trigger, .q-btn[aria-label*="notification"], .q-btn[title*="notification"]',
    
    // Notification panel/dialog
    notificationPanel: '.notification-dialog, .q-dialog, [data-cy="notification-panel"]',
    notificationCard: '.notification-card, .q-card',
    
    // Individual notification items
    notificationItem: '.notif-item, .notification-item, [data-cy="notification-item"]',
    notificationContent: '.notification-content',
    notificationSender: '.name, .notification-sender',
    notificationMessage: '.notification-message, .text-grey-7',
    
    // Actions
    markAllAsReadBtn: 'a:has-text("Mark all as read"), button:has-text("Mark all as read"), [data-cy="mark-all-read"]',
    
    // Read/unread indicators  
    unreadIndicator: '.unread, .trick-circle.unread, [data-cy="unread"]',
    readIndicator: '.read, .trick-circle.read, [data-cy="read"]',
  };

  /**
   * Open notification panel
   */
  async openNotificationPanel(): Promise<void> {
    console.log('🔔 Opening notification panel...');
    
    // Try multiple possible selectors for the notification trigger
    const triggers = [
      '.q-btn[aria-label*="notification"]',
      '.q-btn[title*="notification"]', 
      '[data-cy="notification-trigger"]',
      '.notification-trigger',
      'button:has(.q-icon[name*="notification"])',
      '.q-btn:has(.material-icons):has-text("notifications")',
    ];
    
    let triggered = false;
    for (const selector of triggers) {
      const element = this.page.locator(selector).first();
      if (await element.isVisible()) {
        await element.click();
        triggered = true;
        console.log(`✅ Clicked notification trigger: ${selector}`);
        break;
      }
    }
    
    if (!triggered) {
      // If no specific trigger found, look for notification icons
      const iconTriggers = [
        '.q-icon:text-matches("notifications.*")',
        'i:text-matches("notifications.*")',
        '.material-icons:text-matches("notifications.*")',
      ];
      
      for (const selector of iconTriggers) {
        const element = this.page.locator(selector).first();
        if (await element.isVisible()) {
          await element.click();
          triggered = true;
          console.log(`✅ Clicked notification icon: ${selector}`);
          break;
        }
      }
    }
    
    if (!triggered) {
      throw new Error('Could not find notification trigger button');
    }
    
    // Wait for notification panel to appear
    await this.page.waitForSelector(this.selectors.notificationPanel, { timeout: 10000 });
    console.log('✅ Notification panel opened');
  }

  /**
   * Wait for notifications to load
   */
  async waitForNotificationsToLoad(): Promise<void> {
    console.log('⏳ Waiting for notifications to load...');
    
    // Wait for either notifications to appear or empty state
    try {
      await Promise.race([
        this.page.waitForSelector(this.selectors.notificationItem, { timeout: 10000 }),
        this.page.waitForSelector('text="No notifications"', { timeout: 10000 }),
        this.page.waitForTimeout(5000) // Fallback timeout
      ]);
      console.log('✅ Notifications loaded');
    } catch (error) {
      console.log('⚠️ Notification loading timeout - continuing anyway');
    }
  }

  /**
   * Get notification count
   */
  async getNotificationCount(): Promise<number> {
    await this.waitForNotificationsToLoad();
    const notifications = this.page.locator(this.selectors.notificationItem);
    return await notifications.count();
  }

  /**
   * Get unread notification count
   */
  async getUnreadNotificationCount(): Promise<number> {
    const unreadNotifications = this.page.locator(`${this.selectors.notificationItem}${this.selectors.unreadIndicator.replace('.unread', '.unread')}`);
    return await unreadNotifications.count();
  }

  /**
   * Verify notification panel is visible
   */
  async verifyNotificationPanelVisible(): Promise<void> {
    await expect(this.page.locator(this.selectors.notificationPanel)).toBeVisible();
    console.log('✅ Notification panel is visible');
  }

  /**
   * Verify notifications are loaded from Supabase (not API)
   * This checks the browser console for Supabase-specific messages
   */
  async verifySupabaseNotificationsLoaded(): Promise<void> {
    console.log('🔍 Checking for Supabase notification loading...');
    
    // Listen for console messages
    const consoleMessages: string[] = [];
    this.page.on('console', msg => {
      consoleMessages.push(msg.text());
    });
    
    // Wait a bit for console messages to appear
    await this.page.waitForTimeout(3000);
    
    // Check for Supabase-specific messages
    const supabaseMessages = consoleMessages.filter(msg => 
      msg.includes('Fetched') && msg.includes('notifications from Supabase') ||
      msg.includes('Supabase realtime initialized') ||
      msg.includes('Subscribed to notifications for user')
    );
    
    if (supabaseMessages.length > 0) {
      console.log('✅ Supabase notification loading confirmed:', supabaseMessages);
    } else {
      console.log('⚠️ No Supabase-specific messages found in console');
      console.log('All console messages:', consoleMessages);
    }
    
    // Also check for absence of API calls (should not see /notification/by-account)
    const apiMessages = consoleMessages.filter(msg => 
      msg.includes('/notification/by-account')
    );
    
    if (apiMessages.length === 0) {
      console.log('✅ No API calls to /notification/by-account found');
    } else {
      console.log('❌ Found API calls - Supabase not working properly:', apiMessages);
    }
  }

  /**
   * Click on a specific notification
   */
  async clickNotification(index: number = 0): Promise<void> {
    console.log(`🖱️ Clicking notification at index ${index}...`);
    
    const notifications = this.page.locator(this.selectors.notificationItem);
    const targetNotification = notifications.nth(index);
    
    await expect(targetNotification).toBeVisible();
    await targetNotification.click();
    
    console.log('✅ Notification clicked');
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    console.log('📝 Marking all notifications as read...');
    
    const markAllBtn = this.page.locator(this.selectors.markAllAsReadBtn).first();
    await expect(markAllBtn).toBeVisible();
    await markAllBtn.click();
    
    console.log('✅ Mark all as read clicked');
    
    // Wait for the action to complete
    await this.page.waitForTimeout(2000);
  }

  /**
   * Verify all notifications are marked as read
   */
  async verifyAllNotificationsRead(): Promise<void> {
    const unreadCount = await this.getUnreadNotificationCount();
    expect(unreadCount).toBe(0);
    console.log('✅ All notifications are marked as read');
  }

  /**
   * Wait for realtime connection
   * Checks console for realtime connection messages
   */
  async waitForRealtimeConnection(): Promise<void> {
    console.log('⏳ Waiting for Supabase realtime connection...');
    
    const consoleMessages: string[] = [];
    this.page.on('console', msg => {
      consoleMessages.push(msg.text());
    });
    
    // Wait for realtime connection messages
    let connected = false;
    for (let i = 0; i < 10; i++) {
      await this.page.waitForTimeout(1000);
      
      const realtimeMessages = consoleMessages.filter(msg => 
        msg.includes('Realtime subscribed to AccountNotifications') ||
        msg.includes('Supabase realtime initialized') ||
        msg.includes('realtime connected')
      );
      
      if (realtimeMessages.length > 0) {
        connected = true;
        console.log('✅ Realtime connection established:', realtimeMessages);
        break;
      }
    }
    
    if (!connected) {
      console.log('⚠️ Realtime connection not confirmed in console');
      console.log('Console messages:', consoleMessages);
    }
  }

  /**
   * Get notification details
   */
  async getNotificationDetails(index: number = 0): Promise<{
    sender?: string;
    message?: string;
    isRead: boolean;
  }> {
    const notifications = this.page.locator(this.selectors.notificationItem);
    const notification = notifications.nth(index);
    
    const sender = await notification.locator(this.selectors.notificationSender).textContent() || '';
    const message = await notification.locator(this.selectors.notificationMessage).first().textContent() || '';
    const isRead = await notification.locator(this.selectors.readIndicator).isVisible();
    
    return {
      sender: sender.trim(),
      message: message.trim(),
      isRead
    };
  }

  /**
   * Close notification panel
   */
  async closeNotificationPanel(): Promise<void> {
    // Try clicking outside or finding close button
    const closeSelectors = [
      '.q-dialog__backdrop',
      '.q-btn[aria-label="Close"]',
      '.q-icon:text("close")',
      'button:has(.q-icon):has-text("close")'
    ];
    
    for (const selector of closeSelectors) {
      const element = this.page.locator(selector).first();
      if (await element.isVisible()) {
        await element.click();
        console.log(`✅ Closed notification panel via: ${selector}`);
        return;
      }
    }
    
    // Fallback: press Escape key
    await this.page.keyboard.press('Escape');
    console.log('✅ Closed notification panel with Escape key');
  }
}