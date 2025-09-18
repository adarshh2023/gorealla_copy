// src/services/api/auth.service.js
import { api } from 'boot/axios'
import { API_ENDPOINTS, USER_TYPES } from 'src/constants/api.constants'
import { detectInputType } from 'src/utils/validation'

class AuthService {
  // ===== USER AUTHENTICATION =====

  /**
   * Login with mobile and password (Users)
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.mobile - User mobile number
   * @param {string} credentials.password - User password
   * @returns {Promise<Object>} Login response with tokens and user data
   */
  async login(credentials) {
    return await api.post(API_ENDPOINTS.AUTH.LOGIN, credentials)
  }

  /**
   * Login with OTP (Users)
   * @param {Object} otpData - OTP login data
   * @param {string} otpData.mobile - User mobile number
   * @param {string} otpData.otp - One-time password
   * @returns {Promise<Object>} Login response with tokens and user data
   */
  async loginWithOTP(otpData) {
    return await api.post(API_ENDPOINTS.AUTH.LOGIN_OTP, otpData)
  }

  /**
   * Register new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Created user data
   */
  async register(userData) {
    return await api.post(API_ENDPOINTS.AUTH.REGISTER, userData)
  }

  /**
   * Generate OTP for mobile number (Users)
   * @param {Object} otpRequest - OTP request data
   * @param {string} otpRequest.mobile - Mobile number to send OTP
   * @returns {Promise<Object>} OTP send response
   */
  async generateOTP(otpRequest) {
    return await api.post(API_ENDPOINTS.AUTH.GENERATE_OTP, otpRequest)
  }

  /**
   * Verify OTP (Users)
   * @param {Object} verifyData - OTP verification data
   * @param {string} verifyData.mobile - Mobile number
   * @param {string} verifyData.otp - OTP to verify
   * @returns {Promise<Object>} Verification result
   */
  async verifyOTP(verifyData) {
    return await api.post(API_ENDPOINTS.AUTH.VERIFY_OTP, verifyData)
  }

  // ===== STAKEHOLDER AUTHENTICATION =====

  /**
   * Stakeholder login with email/phone and password
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.emailOrPhone - Email or phone number
   * @param {string} credentials.password - Password
   * @param {string} credentials.deviceId - Device ID (optional)
   * @param {string} credentials.deviceInfo - Device info (optional)
   * @returns {Promise<Object>} Login response with tokens and user data
   */
  async stakeholderLogin(credentials) {
    const deviceInfo = await this.storeDeviceInfo()
    return await api.post(API_ENDPOINTS.AUTH.STAKEHOLDER_LOGIN, {
      ...credentials,
      ...deviceInfo
    })
  }

  /**
   * Send OTP to stakeholder
   * @param {string} emailOrPhone - Email or phone number
   * @returns {Promise<Object>} OTP send response
   */
  async sendStakeholderOTP(emailOrPhone) {
    return await api.post(API_ENDPOINTS.AUTH.STAKEHOLDER_SEND_OTP, null, {
      params: { emailOrPhone }
    })
  }

  /**
   * Stakeholder OTP login
   * @param {Object} otpData - OTP login data
   * @param {string} otpData.emailOrPhone - Email or phone number
   * @param {string} otpData.otp - OTP
   * @param {string} otpData.deviceId - Device ID (optional)
   * @param {string} otpData.deviceInfo - Device info (optional)
   * @returns {Promise<Object>} Login response with tokens and user data
   */
  async stakeholderOTPLogin(otpData) {
    const deviceInfo = await this.storeDeviceInfo()
    return await api.post(API_ENDPOINTS.AUTH.STAKEHOLDER_LOGIN_OTP, null, {
      params: {
        emailOrPhone: otpData.emailOrPhone,
        otp: otpData.otp,
        deviceId: deviceInfo.deviceId,
        deviceInfo: deviceInfo.deviceId // Using deviceId as deviceInfo for now
      }
    })
  }

  /**
   * Reset stakeholder password with OTP
   * @param {Object} resetData - Password reset data
   * @param {string} resetData.emailOrPhone - Email or phone number
   * @param {string} resetData.newPassword - New password
   * @param {string} resetData.otp - OTP
   * @returns {Promise<Object>} Success response
   */
  async stakeholderResetPassword(resetData) {
    return await api.post(API_ENDPOINTS.AUTH.STAKEHOLDER_RESET_PASSWORD, null, {
      params: {
        emailOrPhone: resetData.emailOrPhone,
        newPassword: resetData.newPassword,
        otp: resetData.otp
      }
    })
  }

  // ===== UNIFIED AUTHENTICATION =====

  /**
   * Unified login - automatically detects user type
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.userType - USER or STAKEHOLDER
   * @param {string} credentials.identifier - Mobile (for users) or email/phone (for stakeholders)
   * @param {string} credentials.password - Password
   * @returns {Promise<Object>} Login response
   */
  async unifiedLogin(credentials) {
    if (credentials.userType === USER_TYPES.USER) {
      return await this.login({
        mobile: credentials.identifier,
        password: credentials.password
      })
    } else {
      return await this.stakeholderLogin({
        emailOrPhone: credentials.identifier,
        password: credentials.password
      })
    }
  }

  /**
   * Unified OTP login
   * @param {Object} otpData - OTP login data
   * @param {string} otpData.userType - USER or STAKEHOLDER
   * @param {string} otpData.identifier - Mobile (for users) or email/phone (for stakeholders)
   * @param {string} otpData.otp - OTP
   * @returns {Promise<Object>} Login response
   */
  async unifiedOTPLogin(otpData) {
    if (otpData.userType === USER_TYPES.USER) {
      return await this.loginWithOTP({
        mobile: otpData.identifier,
        otp: otpData.otp
      })
    } else {
      return await this.stakeholderOTPLogin({
        emailOrPhone: otpData.identifier,
        otp: otpData.otp
      })
    }
  }

  /**
   * Unified OTP generation
   * @param {Object} otpRequest - OTP request
   * @param {string} otpRequest.userType - USER or STAKEHOLDER
   * @param {string} otpRequest.identifier - Mobile (for users) or email/phone (for stakeholders)
   * @returns {Promise<Object>} OTP send response
   */
  async unifiedGenerateOTP(otpRequest) {
    if (otpRequest.userType === USER_TYPES.USER) {
      return await this.generateOTP({
        mobile: otpRequest.identifier
      })
    } else {
      return await this.sendStakeholderOTP(otpRequest.identifier)
    }
  }

  /**
   * Unified password reset
   * @param {Object} resetData - Reset data
   * @param {string} resetData.userType - USER or STAKEHOLDER
   * @param {string} resetData.identifier - Mobile (for users) or email/phone (for stakeholders)
   * @param {string} resetData.newPassword - New password (for reset)
   * @param {string} resetData.otp - OTP (for reset)
   * @returns {Promise<Object>} Response
   */
  async unifiedPasswordReset(resetData) {
    if (resetData.userType === USER_TYPES.USER) {
      return await this.resetPassword({
        mobile: resetData.identifier,
        newPassword: resetData.newPassword,
        otp: resetData.otp
      })
    } else {
      return await this.stakeholderResetPassword({
        emailOrPhone: resetData.identifier,
        newPassword: resetData.newPassword,
        otp: resetData.otp
      })
    }
  }

  /**
   * Unified forgot password (send OTP)
   * @param {Object} forgotData - Forgot password data
   * @param {string} forgotData.userType - USER or STAKEHOLDER
   * @param {string} forgotData.identifier - Mobile (for users) or email/phone (for stakeholders)
   * @returns {Promise<Object>} OTP send response
   */
  async unifiedForgotPassword(forgotData) {
    if (forgotData.userType === USER_TYPES.USER) {
      return await this.forgotPassword(forgotData.identifier)
    } else {
      return await this.sendStakeholderOTP(forgotData.identifier)
    }
  }

  /**
   * Get unified auth user information
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User information
   */
  async getUnifiedAuthUser(userId) {
    return await api.get(API_ENDPOINTS.AUTH.GET_UNIFIED_USER(userId))
  }

  // ===== EXISTING METHODS (Updated) =====

  /**
   * Refresh access token
   * @param {Object} refreshData - Refresh token data
   * @param {string} refreshData.refreshToken - Refresh token
   * @returns {Promise<Object>} New tokens
   */
  async refreshToken(refreshData) {
    return await api.post(API_ENDPOINTS.AUTH.REFRESH_TOKEN, refreshData)
  }

  /**
   * Change password
   * @param {Object} passwordData - Password change data
   * @param {string} passwordData.oldPassword - Current password
   * @param {string} passwordData.newPassword - New password
   * @returns {Promise<Object>} Success response
   */
  async changePassword(passwordData) {
    return await api.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, passwordData)
  }

  /**
   * Request password reset (forgot password) - Users only
   * @param {string} mobile - Mobile number
   * @returns {Promise<Object>} OTP send response
   */
  async forgotPassword(mobile) {
    return await api.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, null, {
      params: { mobile }
    })
  }

  /**
   * Reset password with OTP - Users only
   * @param {Object} resetData - Password reset data
   * @param {string} resetData.mobile - Mobile number
   * @param {string} resetData.otp - OTP
   * @param {string} resetData.newPassword - New password
   * @returns {Promise<Object>} Success response
   */
  async resetPassword(resetData) {
    return await api.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, resetData)
  }

  /**
   * Logout user
   * @returns {Promise<Object>} Logout response
   */
  async logout() {
    return await api.post(API_ENDPOINTS.AUTH.LOGOUT)
  }

  /**
   * Validate current token
   * @returns {Promise<Object>} Token validation response
   */
  async validateToken() {
    return await api.get(API_ENDPOINTS.AUTH.VALIDATE_TOKEN)
  }

  /**
   * Check account status
   * @param {string} mobile - Mobile number
   * @returns {Promise<Object>} Account status
   */
  async checkAccountStatus(mobile) {
    return await api.get(API_ENDPOINTS.AUTH.ACCOUNT_STATUS, {
      params: { mobile }
    })
  }

  // ===== UTILITY METHODS =====

  /**
   * Detect user type based on input
   * @param {string} input - Input identifier
   * @returns {string} USER_TYPES.USER or USER_TYPES.STAKEHOLDER
   */
  detectUserType(input) {
    const inputType = detectInputType(input)

    // If it's a mobile number, assume it's a user
    if (inputType === 'mobile') {
      return USER_TYPES.USER
    }

    // If it's an email, assume it's a stakeholder
    if (inputType === 'email') {
      return USER_TYPES.STAKEHOLDER
    }

    // Default to user if cannot detect
    return USER_TYPES.USER
  }

  /**
   * Get appropriate OTP delivery method
   * @param {string} input - Input identifier
   * @returns {string} 'SMS' or 'EMAIL'
   */
  getOTPDeliveryMethod(input) {
    const inputType = detectInputType(input)
    return inputType === 'email' ? 'EMAIL' : 'SMS'
  }

  /**
   * Get device ID (generate if not exists)
   * @returns {string} Device ID
   */
  getDeviceId() {
    let deviceId = localStorage.getItem('deviceId')
    if (!deviceId) {
      // Generate a unique device ID
      deviceId = `web-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('deviceId', deviceId)
    }
    return deviceId
  }

  /**
   * Get client IP address (placeholder - actual implementation would use a service)
   * @returns {Promise<string>} IP address
   */
  async getIpAddress() {
    return '0.0.0.0' // Placeholder
  }

  /**
   * Store device and IP info
   * @returns {Promise<Object>} Device info
   */
  async storeDeviceInfo() {
    const deviceId = this.getDeviceId()
    const ipAddress = await this.getIpAddress()

    localStorage.setItem('deviceId', deviceId)
    localStorage.setItem('ipAddress', ipAddress)

    return { deviceId, ipAddress }
  }

  /**
   * Get/Set user type preference
   * @param {string} userType - User type to store
   * @returns {string} Current user type preference
   */
  getUserTypePreference(userType = null) {
    if (userType) {
      localStorage.setItem('userTypePreference', userType)
      return userType
    }
    return localStorage.getItem('userTypePreference') || USER_TYPES.USER
  }

  /**
   * Clear all stored auth data
   */
  clearAuthData() {
    const keysToRemove = [
      'authToken',
      'refreshToken',
      'user',
      'deviceId',
      'ipAddress',
      'userTypePreference'
    ]

    keysToRemove.forEach(key => {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
    })
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} Authentication status
   */
  isAuthenticated() {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
    return !!token
  }

  /**
   * Get current auth token
   * @returns {string|null} Auth token
   */
  getAuthToken() {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
  }

  /**
   * Get current refresh token
   * @returns {string|null} Refresh token
   */
  getRefreshToken() {
    return localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken')
  }

  /**
   * Get current user data
   * @returns {Object|null} User data
   */
  getCurrentUser() {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user')
    try {
      return userStr ? JSON.parse(userStr) : null
    } catch (error) {
      console.error('Error parsing user data:', error)
      return null
    }
  }

  /**
   * Get current user type
   * @returns {string} User type
   */
  getCurrentUserType() {
    const user = this.getCurrentUser()
    return user?.userType || this.getUserTypePreference()
  }

  /**
   * Validate input for user type
   * @param {string} input - Input to validate
   * @param {string} userType - User type
   * @returns {boolean} Is valid
   */
  validateInputForUserType(input, userType) {
    if (userType === USER_TYPES.USER) {
      const inputType = detectInputType(input)
      return inputType === 'mobile'
    } else {
      const inputType = detectInputType(input)
      return inputType === 'email' || inputType === 'mobile'
    }
  }

  /**
   * Get input placeholder for user type
   * @param {string} userType - User type
   * @returns {string} Placeholder text
   */
  getInputPlaceholder(userType) {
    if (userType === USER_TYPES.USER) {
      return 'Enter mobile number'
    } else {
      return 'Enter email address or mobile number'
    }
  }

  /**
   * Get input label for user type
   * @param {string} userType - User type
   * @returns {string} Label text
   */
  getInputLabel(userType) {
    if (userType === USER_TYPES.USER) {
      return 'Mobile Number'
    } else {
      return 'Email or Mobile'
    }
  }
}

export default new AuthService()
