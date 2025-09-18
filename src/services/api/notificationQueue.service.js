import { api } from 'boot/axios'
import { API_ENDPOINTS } from 'src/constants/api.constants'

class NotificationQueueService {

  // ===== USER NOTIFICATION OPERATIONS =====

  /**
 * Get current user's notifications with pagination and channel filtering
 */
  async getMyNotifications(params = {}) {
    const {
      page = 0,
      size = 20,
      sortBy = 'insertDate',
      sortDir = 'desc',
      channels = 'InApp' // DEFAULT TO InApp FOR WEB INTERFACE
    } = params

    try {
      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.QUEUE.MY_NOTIFICATIONS, {
        params: { page, size, sortBy, sortDir, channels }
      })
      return response
    } catch (error) {
      console.error('Error getting my notifications:', error)
      throw error
    }
  }

  /**
   * Get current user's unread notifications with channel filtering
   */
  async getMyUnreadNotifications(channels = 'InApp') {
    try {
      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.QUEUE.UNREAD, {
        params: { channels }
      })
      return response
    } catch (error) {
      console.error('Error getting unread notifications:', error)
      throw error
    }
  }

  /**
   * Get current user's unread notification count with channel filtering
   */
  async getMyUnreadCount(channels = 'InApp') {
    try {
      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.QUEUE.UNREAD_COUNT, {
        params: { channels }
      })
      return response
    } catch (error) {
      console.error('Error getting unread count:', error)
      throw error
    }
  }

  /**
   * Get current user's recent notifications with channel filtering
   */
  async getMyRecentNotifications(limit = 5, channels = 'InApp') {
    try {
      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.QUEUE.RECENT, {
        params: { limit, channels }
      })
      return response
    } catch (error) {
      console.error('Error getting recent notifications:', error)
      throw error
    }
  }

  /**
   * Get current user's notification summary (maintains backward compatibility)
   */
  async getMyNotificationSummary(channels = 'InApp') {
    try {
      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.QUEUE.SUMMARY, {
        params: { channels }
      })
      return response
    } catch (error) {
      console.error('Error getting notification summary:', error)
      throw error
    }
  }

  /**
   * Get notification by ID (no channel filtering needed)
   */
  async getMyNotificationById(notificationId) {
    try {
      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.QUEUE.BY_ID(notificationId))
      return response
    } catch (error) {
      console.error('Error getting notification by ID:', error)
      throw error
    }
  }

  /**
   * Mark notification as read (with support for related notifications across channels)
   */
  async markAsRead(notificationId, channels = null) {
    try {
      const params = channels ? { channels } : {}
      const response = await api.put(
        API_ENDPOINTS.NOTIFICATIONS.QUEUE.MARK_READ(notificationId),
        null,
        { params }
      )
      return response
    } catch (error) {
      console.error('Error marking notification as read:', error)
      throw error
    }
  }

  /**
   * Mark all notifications as read with channel filtering
   */
  async markAllAsRead(channels = 'InApp') {
    try {
      const response = await api.put(API_ENDPOINTS.NOTIFICATIONS.QUEUE.MARK_ALL_READ, null, {
        params: { channels }
      })
      return response
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      throw error
    }
  }

  /**
   * Mark notification as clicked (affects all related notifications)
   */
  async markAsClicked(notificationId) {
    try {
      const response = await api.put(API_ENDPOINTS.NOTIFICATIONS.QUEUE.MARK_CLICKED(notificationId))
      return response
    } catch (error) {
      console.error('Error marking notification as clicked:', error)
      throw error
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId) {
    try {
      const response = await api.delete(API_ENDPOINTS.NOTIFICATIONS.QUEUE.DELETE(notificationId))
      return response
    } catch (error) {
      console.error('Error deleting notification:', error)
      throw error
    }
  }

  // ===== ADMIN OPERATIONS =====

  /**
   * Get all notifications with channel filtering (Admin only)
   */
  async getAllNotifications(params = {}) {
    const {
      page = 0,
      size = 20,
      sortBy = 'insertDate',
      sortDir = 'desc',
      channels = null // Admin can see all channels by default
    } = params

    try {
      const requestParams = { page, size, sortBy, sortDir }
      if (channels) {
        requestParams.channels = channels
      }

      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.QUEUE.ALL, {
        params: requestParams
      })
      return response
    } catch (error) {
      console.error('Error getting all notifications:', error)
      throw error
    }
  }

  /**
   * Get notifications by status with channel filtering (Admin only)
   */
  async getNotificationsByStatus(status, params = {}) {
    const {
      page = 0,
      size = 20,
      channels = null
    } = params

    try {
      const requestParams = { page, size }
      if (channels) {
        requestParams.channels = channels
      }

      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.QUEUE.BY_STATUS(status), {
        params: requestParams
      })
      return response
    } catch (error) {
      console.error('Error getting notifications by status:', error)
      throw error
    }
  }

  /**
   * Get notifications by channel (Admin only) - Now supports multiple channels
   */
  async getNotificationsByChannel(channels, params = {}) {
    const { page = 0, size = 20 } = params

    try {
      // Use the generic getAllNotifications method with channel filtering
      return await this.getAllNotifications({
        page,
        size,
        channels: Array.isArray(channels) ? channels.join(',') : channels
      })
    } catch (error) {
      console.error('Error getting notifications by channel:', error)
      throw error
    }
  }

  /**
   * Get notifications for specific user with channel filtering (Admin only)
   */
  async getUserNotifications(userId, params = {}) {
    const {
      page = 0,
      size = 20,
      channels = null
    } = params

    try {
      const requestParams = { page, size }
      if (channels) {
        requestParams.channels = channels
      }

      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.QUEUE.USER_NOTIFICATIONS(userId), {
        params: requestParams
      })
      return response
    } catch (error) {
      console.error('Error getting user notifications:', error)
      throw error
    }
  }

  /**
   * Search notifications with channel filtering (Admin only)
   */
  async searchNotifications(searchTerm, params = {}) {
    const {
      page = 0,
      size = 20,
      channels = null
    } = params

    try {
      const requestParams = { searchTerm, page, size }
      if (channels) {
        requestParams.channels = channels
      }

      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.QUEUE.SEARCH, {
        params: requestParams
      })
      return response
    } catch (error) {
      console.error('Error searching notifications:', error)
      throw error
    }
  }

  /**
   * Get notifications by date range with channel filtering (Admin only)
   */
  async getNotificationsByDateRange(startDate, endDate, channels = null) {
    try {
      const requestParams = { startDate, endDate }
      if (channels) {
        requestParams.channels = channels
      }

      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.QUEUE.DATE_RANGE, {
        params: requestParams
      })
      return response
    } catch (error) {
      console.error('Error getting notifications by date range:', error)
      throw error
    }
  }

  /**
   * Get supported notification channels
   */
  getSupportedChannels() {
    return ['InApp', 'Push', 'Email', 'SMS']
  }

  /**
   * Validate channel parameter
   */
  validateChannels(channels) {
    if (!channels) return true

    const supportedChannels = this.getSupportedChannels()
    const channelArray = typeof channels === 'string' ? channels.split(',') : channels

    return channelArray.every(channel =>
      supportedChannels.includes(channel.trim())
    )
  }

  /**
   * Format channels for API request
   */
  formatChannelsForRequest(channels) {
    if (!channels) return null
    if (typeof channels === 'string') return channels
    if (Array.isArray(channels)) return channels.join(',')
    return String(channels)
  }

  /**
   * Get notification statistics (Admin only)
   */
  async getNotificationStatistics() {
    try {
      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.QUEUE.STATS)
      return response
    } catch (error) {
      console.error('Error getting notification statistics:', error)
      throw error
    }
  }

  /**
   * Get daily notification stats (Admin only)
   */
  async getDailyStats(days = 7) {
    try {
      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.QUEUE.DAILY_STATS, {
        params: { days }
      })
      return response
    } catch (error) {
      console.error('Error getting daily stats:', error)
      throw error
    }
  }

  /**
   * Create notification (Admin/System only)
   */
  async createNotification(notificationData) {
    try {
      const response = await api.post(API_ENDPOINTS.NOTIFICATIONS.QUEUE.CREATE, notificationData)
      return response
    } catch (error) {
      console.error('Error creating notification:', error)
      throw error
    }
  }

  /**
   * Update notification (Admin only)
   */
  async updateNotification(notificationId, notificationData) {
    try {
      const response = await api.put(API_ENDPOINTS.NOTIFICATIONS.QUEUE.UPDATE(notificationId), notificationData)
      return response
    } catch (error) {
      console.error('Error updating notification:', error)
      throw error
    }
  }
}

export default new NotificationQueueService()
