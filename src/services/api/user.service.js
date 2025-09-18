// src/services/api/user.service.js
import { api } from 'boot/axios'
import { API_ENDPOINTS, PAGINATION } from 'src/constants/api.constants'

class UserService {
  /**
   * Create new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async createUser(userData) {
    return await api.post(API_ENDPOINTS.USERS.BASE, userData)
  }

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User data
   */
  async getUserById(userId) {
    return await api.get(API_ENDPOINTS.USERS.BY_ID(userId))
  }

  /**
   * Update user
   * @param {string} userId - User ID
   * @param {Object} userData - Updated user data
   * @returns {Promise<Object>} Updated user
   */
  async updateUser(userId, userData) {
    return await api.put(API_ENDPOINTS.USERS.BY_ID(userId), userData)
  }

  /**
   * Delete user
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async deleteUser(userId) {
    return await api.delete(API_ENDPOINTS.USERS.BY_ID(userId))
  }

  /**
   * Get all users with pagination
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.size - Page size
   * @param {string} params.sort - Sort field
   * @param {string} params.direction - Sort direction
   * @returns {Promise<Object>} Paginated users
   */
  async getAllUsers(params = {}) {
    const queryParams = {
      page: params.page || PAGINATION.DEFAULT_PAGE,
      size: params.size || PAGINATION.DEFAULT_SIZE,
      sort: `${params.sort || PAGINATION.DEFAULT_SORT},${params.direction || PAGINATION.DEFAULT_DIRECTION}`
    }

    return await api.get(API_ENDPOINTS.USERS.BASE, { params: queryParams })
  }

  /**
   * Get users by role
   * @param {string} role - User role
   * @param {Object} params - Pagination parameters
   * @returns {Promise<Object>} Paginated users
   */
  async getUsersByRole(role, params = {}) {
    const queryParams = {
      page: params.page || PAGINATION.DEFAULT_PAGE,
      size: params.size || PAGINATION.DEFAULT_SIZE,
      sort: `${params.sort || PAGINATION.DEFAULT_SORT},${params.direction || PAGINATION.DEFAULT_DIRECTION}`
    }

    return await api.get(API_ENDPOINTS.USERS.BY_ROLE(role), { params: queryParams })
  }

  /**
   * Get users by status
   * @param {string} status - User status
   * @param {Object} params - Pagination parameters
   * @returns {Promise<Object>} Paginated users
   */
  async getUsersByStatus(status, params = {}) {
    const queryParams = {
      page: params.page || PAGINATION.DEFAULT_PAGE,
      size: params.size || PAGINATION.DEFAULT_SIZE,
      sort: `${params.sort || PAGINATION.DEFAULT_SORT},${params.direction || PAGINATION.DEFAULT_DIRECTION}`
    }

    return await api.get(API_ENDPOINTS.USERS.BY_STATUS(status), { params: queryParams })
  }

  /**
   * Search users
   * @param {string} query - Search query
   * @param {Object} params - Pagination parameters
   * @returns {Promise<Object>} Search results
   */
  async searchUsers(query, params = {}) {
    const queryParams = {
      query,
      page: params.page || PAGINATION.DEFAULT_PAGE,
      size: params.size || PAGINATION.DEFAULT_SIZE,
      sort: `${params.sort || 'shortName'},${params.direction || 'ASC'}`
    }

    return await api.get(API_ENDPOINTS.USERS.SEARCH, { params: queryParams })
  }

  /**
   * Get all project managers
   * @returns {Promise<Array>} List of project managers
   */
  async getProjectManagers() {
    return await api.get(API_ENDPOINTS.USERS.PROJECT_MANAGERS)
  }

  /**
   * Get current user profile
   * @returns {Promise<Object>} User profile
   */
  async getCurrentUserProfile() {
    return await api.get(API_ENDPOINTS.USERS.PROFILE)
  }

  /**
   * Update current user profile
   * @param {Object} profileData - Profile update data
   * @returns {Promise<Object>} Updated profile
   */
  async updateProfile(profileData) {
    return await api.put(API_ENDPOINTS.USERS.PROFILE, profileData)
  }

  /**
   * Update profile picture
   * @param {File} file - Image file
   * @returns {Promise<Object>} Updated user with new profile picture
   */
  async updateProfilePicture(file) {
    const formData = new FormData()
    formData.append('file', file)

    return await api.post(API_ENDPOINTS.USERS.PROFILE_PICTURE, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }

  /**
   * Change password
   * @param {Object} passwordData - Password change data
   * @param {string} passwordData.oldPassword - Current password
   * @param {string} passwordData.newPassword - New password
   * @returns {Promise<void>}
   */
  async changePassword(passwordData) {
    return await api.post(API_ENDPOINTS.USERS.PROFILE_PASSWORD, passwordData)
  }

  /**
   * Activate user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Activated user
   */
  async activateUser(userId) {
    return await api.post(API_ENDPOINTS.USERS.ACTIVATE(userId))
  }

  /**
   * Suspend user
   * @param {string} userId - User ID
   * @param {string} reason - Suspension reason
   * @returns {Promise<Object>} Suspended user
   */
  async suspendUser(userId, reason) {
    return await api.post(API_ENDPOINTS.USERS.SUSPEND(userId), null, {
      params: { reason }
    })
  }

  /**
   * Unlock user account
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Unlocked user
   */
  async unlockAccount(userId) {
    return await api.post(API_ENDPOINTS.USERS.UNLOCK(userId))
  }

  /**
   * Update user role
   * @param {string} userId - User ID
   * @param {string} role - New role
   * @returns {Promise<Object>} Updated user
   */
  async updateUserRole(userId, role) {
    return await api.put(API_ENDPOINTS.USERS.UPDATE_ROLE(userId), null, {
      params: { role }
    })
  }

  /**
   * Check email availability
   * @param {string} email - Email to check
   * @returns {Promise<Object>} Availability status
   */
  async checkEmailAvailability(email) {
    return await api.get(API_ENDPOINTS.USERS.CHECK_EMAIL, {
      params: { email }
    })
  }

  /**
   * Check mobile availability
   * @param {string} mobile - Mobile to check
   * @returns {Promise<Object>} Availability status
   */
  async checkMobileAvailability(mobile) {
    return await api.get(API_ENDPOINTS.USERS.CHECK_MOBILE, {
      params: { mobile }
    })
  }

  /**
   * Verify email with verification code
   * @param {string} verificationCode - Email verification code
   * @returns {Promise<void>}
   */
  async verifyEmail(verificationCode) {
    return await api.post(API_ENDPOINTS.USERS.VERIFY_EMAIL, null, {
      params: { verificationCode }
    })
  }

  /**
   * Verify mobile with OTP
   * @param {string} otp - OTP
   * @returns {Promise<void>}
   */
  async verifyMobile(otp) {
    return await api.post(API_ENDPOINTS.USERS.VERIFY_MOBILE, null, {
      params: { otp }
    })
  }

  /**
   * Format user display name
   * @param {Object} user - User object
   * @returns {string} Formatted display name
   */
  formatUserName(user) {
    if (!user) return ''
    return user.fullName || user.shortName || user.email || ''
  }

  /**
   * Get user initials
   * @param {Object} user - User object
   * @returns {string} User initials
   */
  getUserInitials(user) {
    if (!user) return ''

    const name = this.formatUserName(user)
    if (!name) return ''

    const parts = name.split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }

    return name.substring(0, 2).toUpperCase()
  }

  /**
   * Get user avatar color based on name
   * @param {Object} user - User object
   * @returns {string} Hex color code
   */
  getUserAvatarColor(user) {
    const colors = [
      '#F44336', '#E91E63', '#9C27B0', '#673AB7',
      '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4',
      '#009688', '#4CAF50', '#8BC34A', '#CDDC39',
      '#FFC107', '#FF9800', '#FF5722', '#795548'
    ]

    const name = this.formatUserName(user)
    if (!name) return colors[0]

    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }

    return colors[Math.abs(hash) % colors.length]
  }

  /**
   * Check if user has specific role
   * @param {Object} user - User object
   * @param {string} role - Role to check
   * @returns {boolean}
   */
  hasRole(user, role) {
    return user && user.userRole === role
  }

  /**
   * Check if user has any of the specified roles
   * @param {Object} user - User object
   * @param {Array<string>} roles - Roles to check
   * @returns {boolean}
   */
  hasAnyRole(user, roles) {
    return user && roles.includes(user.userRole)
  }
}

export default new UserService()
