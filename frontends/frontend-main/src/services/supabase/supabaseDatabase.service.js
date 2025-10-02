import supabaseService from '../supabase';
// import { formatWord } from 'src/utility/formatter'; // Currently unused

/**
 * Supabase Database Service for Notifications
 * Direct database operations without backend API
 */
class SupabaseDatabaseService {
  /**
   * Get the Supabase client
   * @private
   */
  getClient() {
    const client = supabaseService.getClient();
    if (!client) {
      throw new Error('Supabase client not initialized');
    }
    console.log('🔗 SupabaseDatabaseService - Got client from supabaseService');
    return client;
  }

  /**
   * Transform raw database notification to application format
   * @private
   */
  transformNotification(rawNotification) {
    if (!rawNotification) return null;

    // Handle nested relations from Supabase query
    const notificationData = rawNotification.notificationData || rawNotification.Notifications || {};
    const notificationSender = rawNotification.notificationSender || rawNotification.Account || {};
    const project = rawNotification.project || rawNotification.Project || null;

    // Parse code if it's a string
    let code = notificationData.code;
    if (typeof code === 'string') {
      try {
        code = JSON.parse(code);
      } catch (e) {
        code = { key: '', message: code, showDialogModule: 'none' };
      }
    }

    // Format the notification response to match existing structure
    return {
      id: rawNotification.id?.toString(),
      hasRead: rawNotification.hasRead || false,
      notificationData: {
        id: notificationData.id?.toString() || rawNotification.notificationsId?.toString(),
        content: notificationData.content || '',
        code: code || { key: '', message: '', showDialogModule: 'none' },
        showDialogModule: notificationData.showDialogModule || code?.showDialogModule || 'none',
        showDialogId: notificationData.showDialogId || null,
        createdAt: {
          timeAgo: this.getTimeAgo(notificationData.createdAt || rawNotification.createdAt),
          date: notificationData.createdAt || rawNotification.createdAt
        },
        updatedAt: notificationData.updatedAt
      },
      notificationSender: {
        id: notificationSender.id || rawNotification.senderId,
        username: notificationSender.username || '',
        firstName: notificationSender.firstName || '',
        lastName: notificationSender.lastName || '',
        image: notificationSender.image || '/images/default-avatar.png'
      },
      project: project ? {
        id: project.id?.toString(),
        name: project.name
      } : undefined
    };
  }

  /**
   * Calculate time ago string
   * @private
   */
  getTimeAgo(date) {
    if (!date) return 'just now';
    
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now - past) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return past.toLocaleDateString();
  }

  /**
   * Fetch all notifications for a user
   * @param {String} userId - The user's ID
   * @param {Object} params - Optional parameters (isRead filter)
   * @returns {Promise<Array>} Array of notifications
   */
  async fetchNotifications(userId, params = {}) {
    try {
      console.error('🚨 SupabaseDatabaseService.fetchNotifications called for user:', userId);
      const client = this.getClient();
      console.error('🚨 SupabaseDatabaseService - Client obtained from supabaseService');
      
      // Build the query with all necessary joins
      let query = client
        .from('AccountNotifications')
        .select(`
          id,
          hasRead,
          createdAt,
          updatedAt,
          notificationsId,
          senderId,
          receiverId,
          projectId,
          notificationData:Notifications!notificationsId (
            id,
            content,
            code,
            showDialogId,
            showDialogModule,
            createdAt,
            updatedAt
          ),
          notificationSender:Account!senderId (
            id,
            username,
            firstName,
            lastName,
            image
          ),
          project:Project!projectId (
            id,
            name
          )
        `)
        .eq('receiverId', userId)
        .eq('isDeleted', false)
        .order('createdAt', { ascending: false });

      // Add optional filters
      if (params.isRead !== undefined) {
        query = query.eq('hasRead', params.isRead);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching notifications from Supabase:', error);
        throw error;
      }

      // Transform the raw data to match application format
      return (data || []).map(notification => this.transformNotification(notification));
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      throw error;
    }
  }

  /**
   * Fetch a single notification by ID
   * @param {String|Number} notificationId - The notification ID
   * @returns {Promise<Object|null>} The notification or null
   */
  async fetchNotificationById(notificationId) {
    try {
      const client = this.getClient();
      
      const { data, error } = await client
        .from('AccountNotifications')
        .select(`
          id,
          hasRead,
          createdAt,
          updatedAt,
          notificationsId,
          senderId,
          receiverId,
          projectId,
          notificationData:Notifications!notificationsId (
            id,
            content,
            code,
            showDialogId,
            showDialogModule,
            createdAt,
            updatedAt
          ),
          notificationSender:Account!senderId (
            id,
            username,
            firstName,
            lastName,
            image
          ),
          project:Project!projectId (
            id,
            name
          )
        `)
        .eq('id', notificationId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found
          return null;
        }
        console.error('Error fetching notification by ID:', error);
        throw error;
      }

      return this.transformNotification(data);
    } catch (error) {
      console.error('Failed to fetch notification by ID:', error);
      throw error;
    }
  }

  /**
   * Mark a notification as read
   * @param {String|Number} notificationId - The notification ID
   * @returns {Promise<Boolean>} Success status
   */
  async markAsRead(notificationId) {
    try {
      const client = this.getClient();
      
      const { error } = await client
        .from('AccountNotifications')
        .update({ 
          hasRead: true,
          updatedAt: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read for a user
   * @param {String} userId - The user's ID
   * @returns {Promise<Boolean>} Success status
   */
  async markAllAsRead(userId) {
    try {
      const client = this.getClient();
      
      const { error } = await client
        .from('AccountNotifications')
        .update({ 
          hasRead: true,
          updatedAt: new Date().toISOString()
        })
        .eq('receiverId', userId)
        .eq('hasRead', false)
        .eq('isDeleted', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      return false;
    }
  }

  /**
   * Delete a notification (soft delete)
   * @param {String|Number} notificationId - The notification ID
   * @returns {Promise<Boolean>} Success status
   */
  async deleteNotification(notificationId) {
    try {
      const client = this.getClient();
      
      const { error } = await client
        .from('AccountNotifications')
        .update({ 
          isDeleted: true,
          updatedAt: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) {
        console.error('Error deleting notification:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Failed to delete notification:', error);
      return false;
    }
  }

  /**
   * Get unread notification count for a user
   * @param {String} userId - The user's ID
   * @returns {Promise<Number>} Count of unread notifications
   */
  async getUnreadCount(userId) {
    try {
      const client = this.getClient();
      
      const { count, error } = await client
        .from('AccountNotifications')
        .select('id', { count: 'exact', head: true })
        .eq('receiverId', userId)
        .eq('hasRead', false)
        .eq('isDeleted', false);

      if (error) {
        console.error('Error getting unread count:', error);
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  }
}

// Create and export singleton instance
const supabaseDatabaseService = new SupabaseDatabaseService();
export default supabaseDatabaseService;