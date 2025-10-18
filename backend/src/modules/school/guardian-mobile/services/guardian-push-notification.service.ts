import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { GuardianNotificationsService } from '../notifications/guardian-notifications.service';
import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';
import { Message } from 'firebase-admin/messaging';

@Injectable()
export class GuardianPushNotificationService implements OnModuleInit {
  private readonly logger = new Logger(GuardianPushNotificationService.name);
  private firebaseApp: admin.app.App;
  private initialized = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly guardianNotificationsService: GuardianNotificationsService,
  ) { }

  async onModuleInit() {
    try {
      await this.initializeFirebase();
    } catch (error) {
      this.logger.error('Failed to initialize Firebase:', error);
    }
  }

  private async initializeFirebase() {
    try {
      // Check if Firebase app already exists (prevents duplicate initialization)
      if (admin.apps.length > 0) {
        this.firebaseApp = admin.app();
        this.initialized = true;
        this.logger.log('Using existing Firebase Admin SDK instance');
        return;
      }

      // Check if Firebase service account is configured
      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

      if (!serviceAccountJson) {
        this.logger.warn(
          'Firebase service account not configured. Push notifications disabled.',
        );
        return;
      }

      let serviceAccount: ServiceAccount;

      try {
        // Parse the service account JSON from environment variable
        serviceAccount = JSON.parse(serviceAccountJson) as ServiceAccount;
      } catch (error) {
        this.logger.error(
          'Failed to parse Firebase service account JSON:',
          error,
        );
        return;
      }

      // Initialize Firebase Admin
      this.firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.projectId,
      });

      this.initialized = true;
      this.logger.log('Firebase Admin SDK initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin SDK:', error);
    }
  }

  /**
   * Send push notification to a specific guardian
   */
  async sendToGuardian(
    guardianId: string,
    notification: {
      title: string;
      body: string;
      data?: Record<string, string>;
    },
  ): Promise<boolean> {
    if (!this.initialized) {
      this.logger.warn(
        'Firebase not initialized. Cannot send push notification.',
      );
      return false;
    }

    try {
      // Get guardian's FCM tokens
      const tokens = await this.getGuardianFCMTokens(guardianId);

      if (tokens.length === 0) {
        this.logger.debug(`No FCM tokens found for guardian ${guardianId}`);
        return false;
      }

      // Send to all registered devices
      const results = await Promise.all(
        tokens.map((token) => this.sendNotification(token, notification)),
      );

      return results.some((result) => result);
    } catch (error) {
      this.logger.error(
        `Failed to send notification to guardian ${guardianId}:`,
        error,
      );
      return false;
    }
  }

  /**
   * Send push notification to multiple guardians
   */
  async sendToGuardians(
    guardianIds: string[],
    notification: {
      title: string;
      body: string;
      data?: Record<string, string>;
    },
  ): Promise<void> {
    if (!this.initialized) {
      this.logger.warn(
        'Firebase not initialized. Cannot send push notifications.',
      );
      return;
    }

    // Send notifications in parallel
    await Promise.all(
      guardianIds.map((guardianId) =>
        this.sendToGuardian(guardianId, notification).catch((error) =>
          this.logger.error(`Failed to send to guardian ${guardianId}:`, error),
        ),
      ),
    );
  }

  /**
   * Send attendance notification
   */
  async sendAttendanceNotification(
    guardianIds: string[],
    studentName: string,
    action: 'check_in' | 'check_out',
    time: Date,
  ): Promise<void> {
    // Helper function to capitalize first letter of each word (Title Case)
    const toTitleCase = (str: string): string => {
      return str
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    const formattedStudentName = toTitleCase(studentName);
    const timeStr = time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const actionText = action === 'check_in'
      ? `arrived at ${timeStr}.`
      : `left the campus at ${timeStr}.`;

    const notificationData = {
      type: 'attendance',
      action,
      studentName,
      timestamp: time.toISOString(),
    };

    const notification = {
      title: 'Attendance Update',
      body: `${formattedStudentName} ${actionText}`,
      data: notificationData,
    };

    // Send push notification
    await this.sendToGuardians(guardianIds, notification);

    // Create in-app notifications in database
    try {
      await this.guardianNotificationsService.createNotificationForGuardians(
        guardianIds,
        {
          type: 'attendance',
          title: 'Attendance Update',
          message: `${formattedStudentName} ${actionText}`,
          priority: 'normal',
          data: notificationData,
        },
      );
      this.logger.log(`Created in-app notifications for ${guardianIds.length} guardians`);
    } catch (error) {
      this.logger.error('Failed to create in-app notifications:', error);
      // Don't throw - we don't want notification creation failures to break push notifications
    }
  }

  /**
   * Send payment reminder notification
   */
  async sendPaymentReminder(
    guardianId: string,
    studentName: string,
    amount: number,
    dueDate: Date,
  ): Promise<void> {
    const notificationData = {
      type: 'payment',
      studentName,
      amount: amount.toString(),
      dueDate: dueDate.toISOString(),
    };

    const notification = {
      title: 'Payment Reminder',
      body: `Tuition payment of ₱${amount.toLocaleString()} for ${studentName} is due on ${dueDate.toLocaleDateString()}`,
      data: notificationData,
    };

    // Send push notification
    await this.sendToGuardian(guardianId, notification);

    // Create in-app notification in database
    try {
      await this.guardianNotificationsService.createNotification(guardianId, {
        type: 'payment_reminder',
        title: 'Payment Reminder',
        message: `Tuition payment of ₱${amount.toLocaleString()} for ${studentName} is due on ${dueDate.toLocaleDateString()}`,
        priority: 'high',
        data: notificationData,
      });
      this.logger.log(`Created in-app payment reminder notification for guardian ${guardianId}`);
    } catch (error) {
      this.logger.error('Failed to create in-app payment reminder notification:', error);
      // Don't throw - we don't want notification creation failures to break push notifications
    }
  }

  /**
   * Send announcement notification
   */
  async sendAnnouncement(
    guardianIds: string[],
    title: string,
    message: string,
  ): Promise<void> {
    const notificationData = {
      type: 'announcement',
      timestamp: new Date().toISOString(),
    };

    const notification = {
      title,
      body: message,
      data: notificationData,
    };

    // Send push notification
    await this.sendToGuardians(guardianIds, notification);

    // Create in-app notifications in database
    try {
      await this.guardianNotificationsService.createNotificationForGuardians(
        guardianIds,
        {
          type: 'announcement',
          title,
          message,
          priority: 'normal',
          data: notificationData,
        },
      );
      this.logger.log(`Created in-app announcement notifications for ${guardianIds.length} guardians`);
    } catch (error) {
      this.logger.error('Failed to create in-app announcement notifications:', error);
      // Don't throw - we don't want notification creation failures to break push notifications
    }
  }

  /**
   * Get FCM tokens for a guardian
   */
  private async getGuardianFCMTokens(guardianId: string): Promise<string[]> {
    try {
      const guardianTokens = await this.prisma.guardianToken.findMany({
        where: {
          guardianId,
          isRevoked: false,
        },
        orderBy: { createdAt: 'desc' },
      });

      const tokens: string[] = [];

      for (const guardianToken of guardianTokens) {
        const deviceInfo = guardianToken.deviceInfo as any;
        if (deviceInfo?.fcmToken) {
          tokens.push(deviceInfo.fcmToken);
        }
      }

      // Remove duplicates
      return [...new Set(tokens)];
    } catch (error) {
      this.logger.error(
        `Failed to get FCM tokens for guardian ${guardianId}:`,
        error,
      );
      return [];
    }
  }

  /**
   * Remove invalid FCM token from database
   * This is called when Firebase reports a token as invalid
   */
  private async removeInvalidFCMToken(fcmToken: string): Promise<void> {
    try {
      // Find all guardian tokens with this FCM token
      const guardianTokens = await this.prisma.guardianToken.findMany({
        where: {
          isRevoked: false,
        },
      });

      let cleanedCount = 0;
      const cleanedGuardians: string[] = [];

      for (const guardianToken of guardianTokens) {
        const deviceInfo = (guardianToken.deviceInfo as any) || {};

        // Check if this token has the invalid FCM token
        if (deviceInfo.fcmToken === fcmToken) {
          // Remove FCM token but keep the auth token and other device info
          delete deviceInfo.fcmToken;
          delete deviceInfo.fcmTokenUpdatedAt;

          await this.prisma.guardianToken.update({
            where: { id: guardianToken.id },
            data: { deviceInfo },
          });

          cleanedCount++;
          cleanedGuardians.push(guardianToken.guardianId);

          this.logger.log(
            `Cleaned up invalid FCM token for guardian ${guardianToken.guardianId}`,
          );
        }
      }

      if (cleanedCount > 0) {
        this.logger.warn(
          `Removed invalid FCM token from ${cleanedCount} device(s). ` +
          `Guardians affected: ${cleanedGuardians.join(', ')}. ` +
          `Mobile app will need to refresh FCM token.`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to remove invalid FCM token ${fcmToken}:`,
        error,
      );
    }
  }

  /**
   * Send notification to a specific FCM token
   */
  private async sendNotification(
    fcmToken: string,
    notification: {
      title: string;
      body: string;
      data?: Record<string, string>;
    },
  ): Promise<boolean> {
    try {
      const message: Message = {
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data,
        token: fcmToken,
        android: {
          notification: {
            icon: 'ic_notification',
            color: '#4F46E5',
            sound: 'default',
            priority: 'high',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          },
          priority: 'high',
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: notification.title,
                body: notification.body,
              },
              sound: 'default',
              badge: 1,
            },
          },
        },
        webpush: {
          notification: {
            title: notification.title,
            body: notification.body,
            icon: '/logo-192.png',
            badge: '/logo-192.png',
            requireInteraction: true,
          },
          fcmOptions: {
            link:
              notification.data?.link || 'https://guardian-app.geertest.com',
          },
        },
      };

      const response = await admin.messaging().send(message);
      this.logger.debug(`Successfully sent notification: ${response}`);
      return true;
    } catch (error) {
      // Handle invalid token errors
      if (
        error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered'
      ) {
        this.logger.warn(`Invalid FCM token detected: ${fcmToken.substring(0, 20)}...`);

        // Automatically clean up the invalid token from database
        await this.removeInvalidFCMToken(fcmToken);

        this.logger.log(
          `FCM token cleanup completed. Mobile app will need to refresh token for future notifications.`,
        );
      } else {
        this.logger.error(
          `Failed to send notification to token ${fcmToken.substring(0, 20)}...:`,
          error,
        );
      }
      return false;
    }
  }

  /**
   * Test push notification
   */
  async testPushNotification(guardianId: string): Promise<boolean> {
    const notification = {
      title: 'Test Notification',
      body: 'This is a test push notification from ANTE Guardian App',
      data: {
        type: 'test',
        timestamp: new Date().toISOString(),
      },
    };

    return await this.sendToGuardian(guardianId, notification);
  }
}
