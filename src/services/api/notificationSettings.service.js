import { api } from 'boot/axios'
import { API_ENDPOINTS } from 'src/constants/api.constants'

class NotificationSettingsService {

  // ===== USER SETTINGS OPERATIONS =====

  /**
   * Get current user's notification settings
   */
  async getMySettings(params = {}) {
    const { page = 0, size = 20 } = params

    try {
      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.SETTINGS.MY_SETTINGS, {
        params: { page, size }
      })
      return response
    } catch (error) {
      console.error('Error getting my notification settings:', error)
      throw error
    }
  }

  /**
   * Get or create settings for current user and notification type
   */
  async getOrCreateMySettings(notificationType) {
    try {
      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.SETTINGS.MY_SETTINGS_TYPE(notificationType))
      return response
    } catch (error) {
      console.error('Error getting/creating notification settings:', error)
      throw error
    }
  }

  /**
   * Update current user's notification settings
   */
  async updateMySettings(settingsId, settingsData) {
    try {
      // const response = await api.put(API_ENDPOINTS.NOTIFICATIONS.SETTINGS.MY_SETTINGS_TYPE(settingsId), settingsData)
      // HITS 2025.08.25
      const response = await api.put(API_ENDPOINTS.NOTIFICATIONS.SETTINGS.BY_ID(settingsId), settingsData)
      return response
    } catch (error) {
      console.error('Error updating notification settings:', error)
      throw error
    }
  }

  /**
   * Toggle email notifications for current user
   */
  async toggleMyEmailNotifications(enabled) {
    try {
      const response = await api.put(API_ENDPOINTS.NOTIFICATIONS.SETTINGS.TOGGLE_EMAIL, null, {
        params: { enabled }
      })
      return response
    } catch (error) {
      console.error('Error toggling email notifications:', error)
      throw error
    }
  }

  /**
   * Toggle SMS notifications for current user
   */
  async toggleMySmsNotifications(enabled) {
    try {
      const response = await api.put(API_ENDPOINTS.NOTIFICATIONS.SETTINGS.TOGGLE_SMS, null, {
        params: { enabled }
      })
      return response
    } catch (error) {
      console.error('Error toggling SMS notifications:', error)
      throw error
    }
  }

  /**
   * Toggle push notifications for current user
   */
  async toggleMyPushNotifications(enabled) {
    try {
      const response = await api.put(API_ENDPOINTS.NOTIFICATIONS.SETTINGS.TOGGLE_PUSH, null, {
        params: { enabled }
      })
      return response
    } catch (error) {
      console.error('Error toggling push notifications:', error)
      throw error
    }
  }

  /**
   * Create default settings for current user
   */
  async createMyDefaultSettings() {
    try {
      const response = await api.post(API_ENDPOINTS.NOTIFICATIONS.SETTINGS.CREATE_DEFAULTS)
      return response
    } catch (error) {
      console.error('Error creating default settings:', error)
      throw error
    }
  }

  // ===== BASIC CRUD OPERATIONS =====

  /**
   * Create notification settings
   */
  async createSettings(settingsData) {
    try {
      const response = await api.post(API_ENDPOINTS.NOTIFICATIONS.SETTINGS.BASE, settingsData)
      return response
    } catch (error) {
      console.error('Error creating notification settings:', error)
      throw error
    }
  }

  /**
   * Update notification settings
   */
  async updateSettings(settingsId, settingsData) {
    try {
      const response = await api.put(API_ENDPOINTS.NOTIFICATIONS.SETTINGS.BY_ID(settingsId), settingsData)
      return response
    } catch (error) {
      console.error('Error updating notification settings:', error)
      throw error
    }
  }

  /**
   * Get notification settings by ID
   */
  async getSettingsById(settingsId) {
    try {
      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.SETTINGS.BY_ID(settingsId))
      return response
    } catch (error) {
      console.error('Error getting settings by ID:', error)
      throw error
    }
  }

  /**
   * Delete notification settings
   */
  async deleteSettings(settingsId) {
    try {
      const response = await api.delete(API_ENDPOINTS.NOTIFICATIONS.SETTINGS.BY_ID(settingsId))
      return response
    } catch (error) {
      console.error('Error deleting notification settings:', error)
      throw error
    }
  }

  // ===== ADMIN OPERATIONS =====

  /**
   * Get all notification settings (Admin only)
   */
  async getAllSettings(params = {}) {
    const { page = 0, size = 20 } = params

    try {
      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.SETTINGS.BASE, {
        params: { page, size }
      })
      return response
    } catch (error) {
      console.error('Error getting all notification settings:', error)
      throw error
    }
  }

  /**
   * Get user settings by user ID (Admin only)
   */
  async getUserSettings(userId) {
    try {
      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.SETTINGS.USER_SETTINGS(userId))
      return response
    } catch (error) {
      console.error('Error getting user settings:', error)
      throw error
    }
  }

  /**
   * Search notification settings (Admin only)
   */
  async searchSettings(searchTerm, params = {}) {
    const { page = 0, size = 20 } = params

    try {
      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.SETTINGS.SEARCH, {
        params: { searchTerm, page, size }
      })
      return response
    } catch (error) {
      console.error('Error searching notification settings:', error)
      throw error
    }
  }

  /**
   * Get notification settings statistics (Admin only)
   */
  async getSettingsStatistics() {
    try {
      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.SETTINGS.STATS)
      return response
    } catch (error) {
      console.error('Error getting settings statistics:', error)
      throw error
    }
  }

  /**
   * Get available notification types
   */
  async getAvailableNotificationTypes() {
    try {
      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.SETTINGS.TYPES)
      return response
    } catch (error) {
      console.error('Error getting notification types:', error)
      throw error
    }
  }
}

export default new NotificationSettingsService()
