import { api } from 'boot/axios'
import { API_ENDPOINTS } from 'src/constants/api.constants'

class DeviceTokensService {

  // ===== DEVICE TOKEN REGISTRATION =====

  /**
   * Register device token for current user
   */
  async registerMyDeviceToken(deviceTokenData) {
    try {
      const response = await api.post(API_ENDPOINTS.NOTIFICATIONS.DEVICE_TOKENS.REGISTER, deviceTokenData)
      return response
    } catch (error) {
      console.error('Error registering device token:', error)
      throw error
    }
  }

  /**
   * Get current user's device tokens
   */
  async getMyDeviceTokens() {
    try {
      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.DEVICE_TOKENS.MY_DEVICES)
      return response
    } catch (error) {
      console.error('Error getting my device tokens:', error)
      throw error
    }
  }

  /**
   * Get current user's active device tokens
   */
  async getMyActiveDeviceTokens() {
    try {
      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.DEVICE_TOKENS.MY_ACTIVE)
      return response
    } catch (error) {
      console.error('Error getting active device tokens:', error)
      throw error
    }
  }

  /**
   * Get current user's device token count
   */
  async getMyDeviceTokenCount() {
    try {
      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.DEVICE_TOKENS.MY_COUNT)
      return response
    } catch (error) {
      console.error('Error getting device token count:', error)
      throw error
    }
  }

  /**
   * Check if device token exists for current user
   */
  async checkMyDeviceTokenExists(deviceToken) {
    try {
      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.DEVICE_TOKENS.EXISTS, {
        params: { deviceToken }
      })
      return response
    } catch (error) {
      console.error('Error checking device token existence:', error)
      throw error
    }
  }

  /**
   * Get device token by ID
   */
  async getMyDeviceTokenById(tokenId) {
    try {
      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.DEVICE_TOKENS.BY_ID(tokenId))
      return response
    } catch (error) {
      console.error('Error getting device token by ID:', error)
      throw error
    }
  }

  /**
   * Update device token information
   */
  async updateMyDeviceToken(tokenId, deviceTokenData) {
    try {
      const response = await api.put(API_ENDPOINTS.NOTIFICATIONS.DEVICE_TOKENS.BY_ID(tokenId), deviceTokenData)
      return response
    } catch (error) {
      console.error('Error updating device token:', error)
      throw error
    }
  }

  /**
   * Deactivate device token
   */
  async deactivateMyDeviceToken(tokenId) {
    try {
      const response = await api.put(API_ENDPOINTS.NOTIFICATIONS.DEVICE_TOKENS.DEACTIVATE(tokenId))
      return response
    } catch (error) {
      console.error('Error deactivating device token:', error)
      throw error
    }
  }

  /**
   * Activate device token
   */
  async activateMyDeviceToken(tokenId) {
    try {
      const response = await api.put(API_ENDPOINTS.NOTIFICATIONS.DEVICE_TOKENS.ACTIVATE(tokenId))
      return response
    } catch (error) {
      console.error('Error activating device token:', error)
      throw error
    }
  }

  /**
   * Delete device token
   */
  async deleteMyDeviceToken(tokenId) {
    try {
      const response = await api.delete(API_ENDPOINTS.NOTIFICATIONS.DEVICE_TOKENS.DELETE(tokenId))
      return response
    } catch (error) {
      console.error('Error deleting device token:', error)
      throw error
    }
  }

  /**
   * Ping device token (update last used date)
   */
  async pingDeviceToken(tokenId) {
    try {
      const response = await api.put(API_ENDPOINTS.NOTIFICATIONS.DEVICE_TOKENS.PING(tokenId))
      return response
    } catch (error) {
      console.error('Error pinging device token:', error)
      throw error
    }
  }

  // ===== ADMIN OPERATIONS =====

  /**
   * Get all device tokens (Admin only)
   */
  async getAllDeviceTokens(params = {}) {
    const {
      page = 0,
      size = 20,
      sortBy = 'lastUsedDate',
      sortDir = 'desc'
    } = params

    try {
      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.DEVICE_TOKENS.ALL, {
        params: { page, size, sortBy, sortDir }
      })
      return response
    } catch (error) {
      console.error('Error getting all device tokens:', error)
      throw error
    }
  }

  /**
   * Get device tokens by device type (Admin only)
   */
  async getDeviceTokensByType(deviceType, params = {}) {
    const { page = 0, size = 20 } = params

    try {
      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.DEVICE_TOKENS.BY_TYPE(deviceType), {
        params: { page, size }
      })
      return response
    } catch (error) {
      console.error('Error getting device tokens by type:', error)
      throw error
    }
  }

  /**
   * Get device tokens for specific user (Admin only)
   */
  async getUserDeviceTokens(userId) {
    try {
      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.DEVICE_TOKENS.USER_TOKENS(userId))
      return response
    } catch (error) {
      console.error('Error getting user device tokens:', error)
      throw error
    }
  }

  /**
   * Get device tokens for specific stakeholder (Admin only)
   */
  async getStakeholderDeviceTokens(stakeholderId) {
    try {
      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.DEVICE_TOKENS.STAKEHOLDER_TOKENS(stakeholderId))
      return response
    } catch (error) {
      console.error('Error getting stakeholder device tokens:', error)
      throw error
    }
  }

  /**
   * Register device token for user (Admin only)
   */
  async registerUserDeviceToken(userId, deviceTokenData) {
    try {
      const response = await api.post(API_ENDPOINTS.NOTIFICATIONS.DEVICE_TOKENS.REGISTER_USER(userId), deviceTokenData)
      return response
    } catch (error) {
      console.error('Error registering user device token:', error)
      throw error
    }
  }

  /**
   * Register device token for stakeholder (Admin only)
   */
  async registerStakeholderDeviceToken(stakeholderId, deviceTokenData) {
    try {
      const response = await api.post(API_ENDPOINTS.NOTIFICATIONS.DEVICE_TOKENS.REGISTER_STAKEHOLDER(stakeholderId), deviceTokenData)
      return response
    } catch (error) {
      console.error('Error registering stakeholder device token:', error)
      throw error
    }
  }

  /**
   * Search device tokens (Admin only)
   */
  async searchDeviceTokens(searchTerm) {
    try {
      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.DEVICE_TOKENS.SEARCH, {
        params: { searchTerm }
      })
      return response
    } catch (error) {
      console.error('Error searching device tokens:', error)
      throw error
    }
  }

  /**
   * Get device tokens by date range (Admin only)
   */
  async getTokensByDateRange(startDate, endDate) {
    try {
      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.DEVICE_TOKENS.DATE_RANGE, {
        params: { startDate, endDate }
      })
      return response
    } catch (error) {
      console.error('Error getting tokens by date range:', error)
      throw error
    }
  }

  /**
   * Get device token statistics (Admin only)
   */
  async getDeviceTokenStatistics() {
    try {
      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.DEVICE_TOKENS.STATS)
      return response
    } catch (error) {
      console.error('Error getting device token statistics:', error)
      throw error
    }
  }

  /**
   * Get most active devices (Admin only)
   */
  async getMostActiveDevices(limit = 10) {
    try {
      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.DEVICE_TOKENS.MOST_ACTIVE, {
        params: { limit }
      })
      return response
    } catch (error) {
      console.error('Error getting most active devices:', error)
      throw error
    }
  }

  /**
   * Deactivate old tokens (Admin only)
   */
  async deactivateOldTokens(inactiveDays = 30) {
    try {
      const response = await api.post(API_ENDPOINTS.NOTIFICATIONS.DEVICE_TOKENS.DEACTIVATE_OLD, null, {
        params: { inactiveDays }
      })
      return response
    } catch (error) {
      console.error('Error deactivating old tokens:', error)
      throw error
    }
  }

  /**
   * Get tokens for cleanup (Admin only)
   */
  async getTokensForCleanup(inactiveDays = 30, oldDays = 90) {
    try {
      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.DEVICE_TOKENS.CLEANUP_CANDIDATES, {
        params: { inactiveDays, oldDays }
      })
      return response
    } catch (error) {
      console.error('Error getting tokens for cleanup:', error)
      throw error
    }
  }

  /**
   * Deactivate all tokens for owner (Admin only)
   */
  async deactivateTokensForOwner(ownerType, ownerId) {
    try {
      const response = await api.post(API_ENDPOINTS.NOTIFICATIONS.DEVICE_TOKENS.DEACTIVATE_OWNER, null, {
        params: { ownerType, ownerId }
      })
      return response
    } catch (error) {
      console.error('Error deactivating tokens for owner:', error)
      throw error
    }
  }

  /**
   * Get available device types
   */
  async getAvailableDeviceTypes() {
    try {
      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.DEVICE_TOKENS.DEVICE_TYPES)
      return response
    } catch (error) {
      console.error('Error getting device types:', error)
      throw error
    }
  }

  // ===== UTILITY METHODS =====

  /**
   * Get device information for registration
   */
  getDeviceInfo() {
    const userAgent = navigator.userAgent
    let deviceType = 'Web'
    let deviceName = 'Unknown Device'

    // Detect device type
    if (/Android/i.test(userAgent)) {
      deviceType = 'Android'
      const match = userAgent.match(/Android ([0-9.]+)/)
      deviceName = match ? `Android ${match[1]}` : 'Android Device'
    } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
      deviceType = 'iOS'
      const match = userAgent.match(/OS ([0-9_]+)/)
      deviceName = match ? `iOS ${match[1].replace(/_/g, '.')}` : 'iOS Device'
    } else if (/Windows/i.test(userAgent)) {
      deviceName = 'Windows Device'
    } else if (/Mac/i.test(userAgent)) {
      deviceName = 'Mac Device'
    }

    return {
      deviceType,
      deviceName,
      userAgent,
      platform: navigator.platform,
      language: navigator.language
    }
  }

  /**
   * Generate device token placeholder for web (FCM will replace this)
   */
  generateWebDeviceToken() {
    // This will be replaced by actual FCM token when Firebase is configured
    return `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

export default new DeviceTokensService()
