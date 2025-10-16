import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { get, set, merge } from 'lodash';

/**
 * Default preferences structure
 * Each module can define its own default preferences here
 */
const DEFAULT_PREFERENCES = {
  calendar: {
    enabledSources: [], // Empty array = all unchecked by default
  },
  // Future modules can add their defaults here
  // dashboard: { ... },
  // tasks: { ... },
};

@Injectable()
export class UserPreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all user preferences
   * Creates default preferences if none exist
   */
  async getPreferences(accountId: string) {

    let userPrefs = await this.prisma.userPreferences.findUnique({
      where: { accountId },
    });

    // Create default preferences if they don't exist
    if (!userPrefs) {
      userPrefs = await this.prisma.userPreferences.create({
        data: {
          accountId,
          preferences: DEFAULT_PREFERENCES,
        },
      });
    }

    return userPrefs.preferences;
  }

  /**
   * Get a specific preference by key path (supports dot notation)
   * Example: getPreference(accountId, 'calendar.enabledSources', [])
   */
  async getPreference(accountId: string, key: string, defaultValue: any = null) {
    const preferences = await this.getPreferences(accountId);
    const value = get(preferences, key, defaultValue);
    return value !== undefined ? value : defaultValue;
  }

  /**
   * Update a specific preference by key path (supports dot notation)
   * Example: updatePreference(accountId, 'calendar.enabledSources', ['personal-tasks'])
   */
  async updatePreference(accountId: string, key: string, value: any) {

    // Get current preferences or create with defaults
    let userPrefs = await this.prisma.userPreferences.findUnique({
      where: { accountId },
    });

    if (!userPrefs) {
      userPrefs = await this.prisma.userPreferences.create({
        data: {
          accountId,
          preferences: DEFAULT_PREFERENCES,
        },
      });
    }

    // Update the specific preference using lodash set
    const updatedPreferences = { ...(userPrefs.preferences as object) };
    set(updatedPreferences, key, value);

    // Save to database
    const updated = await this.prisma.userPreferences.update({
      where: { accountId },
      data: {
        preferences: updatedPreferences,
      },
    });

    return updated.preferences;
  }

  /**
   * Bulk update multiple preferences
   * Deep merges with existing preferences
   */
  async bulkUpdatePreferences(accountId: string, preferences: Record<string, any>) {

    // Get current preferences or create with defaults
    let userPrefs = await this.prisma.userPreferences.findUnique({
      where: { accountId },
    });

    if (!userPrefs) {
      userPrefs = await this.prisma.userPreferences.create({
        data: {
          accountId,
          preferences: DEFAULT_PREFERENCES,
        },
      });
    }

    // Deep merge new preferences with existing ones
    const updatedPreferences = merge(
      {},
      userPrefs.preferences as object,
      preferences,
    );

    // Save to database
    const updated = await this.prisma.userPreferences.update({
      where: { accountId },
      data: {
        preferences: updatedPreferences,
      },
    });

    return updated.preferences;
  }

  /**
   * Reset preferences to defaults
   */
  async resetPreferences(accountId: string) {

    const updated = await this.prisma.userPreferences.upsert({
      where: { accountId },
      create: {
        accountId,
        preferences: DEFAULT_PREFERENCES,
      },
      update: {
        preferences: DEFAULT_PREFERENCES,
      },
    });

    return updated.preferences;
  }

  /**
   * Delete user preferences (used on account deletion)
   */
  async deletePreferences(accountId: string) {
    try {
      await this.prisma.userPreferences.delete({
        where: { accountId },
      });
      return { success: true };
    } catch (error) {
      // Preferences might not exist, which is fine
      return { success: true };
    }
  }
}
