// src/stores/auth.js (Updated with Customer Context)
import { defineStore } from 'pinia'
import { api } from 'boot/axios'
import { API_ENDPOINTS, USER_TYPES } from 'src/constants/api.constants'
import { LocalStorage, SessionStorage } from 'quasar'
import authService from 'src/services/api/auth.service'
import firebaseService from 'src/services/api/firebase.service'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: false,
    loginAttempts: 0,
    lastLoginTime: null,
    permissions: [],
    userRole: null,
    userType: USER_TYPES.USER, // USER or STAKEHOLDER
    lastUsedUserType: USER_TYPES.USER,

    // Customer Context
    customerContext: null,
    isCustomerContextLoaded: false,
    customerContextError: null,

    // Firebase Integration
    firebaseInitialized: false,
    deviceTokenRegistered: false,
    fcmToken: null
  }),

  getters: {
    currentUser: (state) => state.user,

    userFullName: (state) => state.user?.fullName || state.user?.shortName || state.user?.companyName || '',

    userEmail: (state) => state.user?.email || '',

    userMobile: (state) => state.user?.mobile || state.user?.phone || '',

    isAdmin: (state) => state.userRole === 'Admin',

    isProjectManager: (state) => state.userRole === 'ProjectManager',

    isEngineer: (state) => state.userRole === 'Engineer',

    isContractor: (state) => state.userRole === 'Contractor',

    hasRole: (state) => (role) => state.userRole === role,

    hasAnyRole: (state) => (roles) => roles.includes(state.userRole),

    isEmailVerified: (state) => state.user?.isEmailVerified || false,

    isMobileVerified: (state) => state.user?.isMobileVerified || false,

    profilePicture: (state) => state.user?.profilePicture || null,

    isUser: (state) => state.userType === USER_TYPES.USER,

    isStakeholder: (state) => state.userType === USER_TYPES.STAKEHOLDER,

    currentUserType: (state) => state.userType,

    displayName: (state) => {
      if (state.userType === USER_TYPES.USER) {
        return state.user?.fullName || state.user?.shortName || 'User'
      } else {
        return state.user?.companyName || state.user?.fullName || 'Stakeholder'
      }
    },

    // Customer Context Getters
    currentCustomer: (state) => state.customerContext,

    customerId: (state) => state.customerContext?.id,

    customerName: (state) => state.customerContext?.name,

    customerEnvironment: (state) => state.customerContext?.environment || 'production',

    deploymentUrl: (state) => state.customerContext?.deploymentUrl,

    hasCustomerContext: (state) => state.isCustomerContextLoaded && state.customerContext !== null,

    // Firebase Getters
    isFirebaseReady: (state) => state.firebaseInitialized && state.fcmToken !== null,

    isDeviceRegistered: (state) => state.deviceTokenRegistered && state.fcmToken !== null
  },

  actions: {
    // ===== INITIALIZATION =====

    // Initialize auth from storage
    async initializeAuth() {
      try {
        const token = LocalStorage.getItem('authToken')
        const refreshToken = LocalStorage.getItem('refreshToken')
        const user = LocalStorage.getItem('user')
        const userType = LocalStorage.getItem('userType')
        const customerContext = LocalStorage.getItem('customerContext')

        if (token && user) {
          this.token = token
          this.refreshToken = refreshToken
          this.user = user
          this.userRole = user.userRole || user.role
          this.userType = userType || USER_TYPES.USER
          this.isAuthenticated = true

          // Load customer context from storage
          if (customerContext) {
            this.customerContext = customerContext
            this.isCustomerContextLoaded = true
          }

          // Validate token with backend and load customer context
          await this.validateToken()

          // Initialize Firebase and device registration
          await this.initializeFirebaseAfterAuth()
        }

        // Load user type preference
        this.lastUsedUserType = authService.getUserTypePreference()
      } catch (error) {
        console.error('Error initializing auth:', error)
        this.clearAuth()
      }
    },

    // Initialize Firebase after authentication
    async initializeFirebaseAfterAuth() {
      try {
        if (!this.isAuthenticated) {
          console.log('User not authenticated, skipping Firebase initialization')
          return
        }

        console.log('Initializing Firebase after authentication...')

        // Initialize Firebase service with customer context
        const success = await firebaseService.initialize(this.customerContext)

        if (success) {
          this.firebaseInitialized = true
          this.fcmToken = firebaseService.getCurrentToken()

          console.log('Firebase initialized successfully after auth')

          // Auto-register device token
          await this.registerDeviceTokenAfterAuth()
        } else {
          console.warn('Firebase initialization failed after auth')
        }
      } catch (error) {
        console.error('Error initializing Firebase after auth:', error)
        this.firebaseInitialized = false
      }
    },

    // Register device token after authentication
    async registerDeviceTokenAfterAuth() {
      try {
        if (!this.firebaseInitialized || !this.fcmToken) {
          console.log('Firebase not ready for device registration')
          return
        }

        console.log('Auto-registering device token after auth...')

        const deviceToken = await firebaseService.registerDeviceToken()

        if (deviceToken) {
          this.deviceTokenRegistered = true
          console.log('Device token registered successfully after auth')

          // Subscribe to customer topics
          await firebaseService.subscribeToCustomerTopics()
        }
      } catch (error) {
        console.error('Error registering device token after auth:', error)
        this.deviceTokenRegistered = false
      }
    },

    // ===== CUSTOMER CONTEXT MANAGEMENT =====

    // Load customer context from backend
    async loadCustomerContext() {
      try {
        console.log('Loading customer context...')
        this.customerContextError = null

        const response = await api.get('/config/customer-info')

        if (response.success && response.customer) {
          this.customerContext = response.customer
          this.isCustomerContextLoaded = true

          // Store in localStorage for persistence
          LocalStorage.set('customerContext', this.customerContext)

          console.log('Customer context loaded:', this.customerContext)
          return this.customerContext
        } else {
          throw new Error(response.message || 'Failed to load customer context')
        }
      } catch (error) {
        console.error('Error loading customer context:', error)
        this.customerContextError = error.message
        this.isCustomerContextLoaded = false
        return null
      }
    },

    // Initialize customer session
    async initializeCustomerSession() {
      try {
        if (!this.isAuthenticated) {
          console.log('User not authenticated, skipping customer session initialization')
          return
        }

        console.log('Initializing customer session...')

        const deviceInfo = firebaseService.getDeviceInfo()

        const response = await api.post('/config/initialize-session', {
          deviceInfo
        })

        if (response.success) {
          // Update customer context from session
          if (response.session) {
            this.customerContext = {
              ...this.customerContext,
              ...response.session
            }
            LocalStorage.set('customerContext', this.customerContext)
          }

          console.log('Customer session initialized:', response.session)
          return response
        } else {
          throw new Error(response.message || 'Failed to initialize customer session')
        }
      } catch (error) {
        console.error('Error initializing customer session:', error)
        throw error
      }
    },

    // ===== USER AUTHENTICATION =====

    // Login with mobile and password (Users)
    async login({ mobile, password, rememberMe = false }) {
      this.isLoading = true
      try {
        const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, {
          mobile,
          password
        })
        if (response.success && response.data) {
          await this.setAuthData(response.data, rememberMe, USER_TYPES.USER)
          return { success: true }
        }

        return { success: false, message: response.message }
      } catch (error) {
        this.loginAttempts++
        return {
          success: false,
          message: error.response?.data?.message || 'Login failed'
        }
      } finally {
        this.isLoading = false
      }
    },

    // Login with OTP (Users)
    async loginWithOTP({ mobile, otp, rememberMe = false }) {
      this.isLoading = true
      try {
        const response = await api.post(API_ENDPOINTS.AUTH.LOGIN_OTP, {
          mobile,
          otp
        })

        if (response.success && response.data) {
          await this.setAuthData(response.data, rememberMe, USER_TYPES.USER)
          return { success: true }
        }

        return { success: false, message: response.message }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'OTP login failed'
        }
      } finally {
        this.isLoading = false
      }
    },

    // Generate OTP (Users)
    async generateOTP(mobile) {
      try {
        const response = await api.post(API_ENDPOINTS.AUTH.GENERATE_OTP, { mobile })

        if (response.success) {
          return { success: true, message: 'OTP sent successfully' }
        }

        return { success: false, message: response.message }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to send OTP'
        }
      }
    },

    // ===== STAKEHOLDER AUTHENTICATION =====

    // Stakeholder login with email/phone and password
    async stakeholderLogin({ emailOrPhone, password, rememberMe = false }) {
      this.isLoading = true
      try {
        const response = await authService.stakeholderLogin({
          emailOrPhone,
          password
        })

        if (response.success && response.data) {
          await this.setAuthData(response.data, rememberMe, USER_TYPES.STAKEHOLDER)
          return { success: true }
        }

        return { success: false, message: response.message }
      } catch (error) {
        this.loginAttempts++
        return {
          success: false,
          message: error.response?.data?.message || 'Stakeholder login failed'
        }
      } finally {
        this.isLoading = false
      }
    },

    // Stakeholder OTP login
    async stakeholderOTPLogin({ emailOrPhone, otp, rememberMe = false }) {
      this.isLoading = true
      try {
        const response = await authService.stakeholderOTPLogin({
          emailOrPhone,
          otp
        })

        if (response.success && response.data) {
          await this.setAuthData(response.data, rememberMe, USER_TYPES.STAKEHOLDER)
          return { success: true }
        }

        return { success: false, message: response.message }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Stakeholder OTP login failed'
        }
      } finally {
        this.isLoading = false
      }
    },

    // Send OTP to stakeholder
    async sendStakeholderOTP(emailOrPhone) {
      try {
        const response = await authService.sendStakeholderOTP(emailOrPhone)

        if (response.success) {
          return { success: true, message: 'OTP sent successfully' }
        }

        return { success: false, message: response.message }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to send OTP'
        }
      }
    },

    // Stakeholder forgot password
    async stakeholderForgotPassword(emailOrPhone) {
      try {
        const response = await authService.sendStakeholderOTP(emailOrPhone)

        if (response.success) {
          return { success: true, message: 'OTP sent to your registered email/mobile' }
        }

        return { success: false, message: response.message }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to process request'
        }
      }
    },

    // Stakeholder reset password
    async stakeholderResetPassword({ emailOrPhone, otp, newPassword }) {
      try {
        const response = await authService.stakeholderResetPassword({
          emailOrPhone,
          otp,
          newPassword
        })

        if (response.success) {
          return { success: true, message: 'Password reset successfully' }
        }

        return { success: false, message: response.message }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to reset password'
        }
      }
    },

    // ===== UNIFIED AUTHENTICATION =====

    // Unified login based on user type
    async unifiedLogin({ userType, identifier, password, rememberMe = false }) {
      this.isLoading = true

      // Store user type preference
      authService.getUserTypePreference(userType)
      this.lastUsedUserType = userType

      try {
        let response

        if (userType === USER_TYPES.USER) {
          response = await this.login({
            mobile: identifier,
            password,
            rememberMe
          })
        } else {
          response = await this.stakeholderLogin({
            emailOrPhone: identifier,
            password,
            rememberMe
          })
        }

        return response
      } finally {
        this.isLoading = false
      }
    },

    // Unified OTP login
    async unifiedOTPLogin({ userType, identifier, otp, rememberMe = false }) {
      this.isLoading = true

      // Store user type preference
      authService.getUserTypePreference(userType)
      this.lastUsedUserType = userType

      try {
        let response

        if (userType === USER_TYPES.USER) {
          response = await this.loginWithOTP({
            mobile: identifier,
            otp,
            rememberMe
          })
        } else {
          response = await this.stakeholderOTPLogin({
            emailOrPhone: identifier,
            otp,
            rememberMe
          })
        }

        return response
      } finally {
        this.isLoading = false
      }
    },

    // Unified OTP generation
    async unifiedGenerateOTP({ userType, identifier }) {
      // Store user type preference
      authService.getUserTypePreference(userType)
      this.lastUsedUserType = userType

      try {
        let response

        if (userType === USER_TYPES.USER) {
          response = await this.generateOTP(identifier)
        } else {
          response = await this.sendStakeholderOTP(identifier)
        }

        return response
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to send OTP'
        }
      }
    },

    // Unified forgot password
    async unifiedForgotPassword({ userType, identifier }) {
      // Store user type preference
      authService.getUserTypePreference(userType)
      this.lastUsedUserType = userType

      try {
        let response

        if (userType === USER_TYPES.USER) {
          response = await this.forgotPassword(identifier)
        } else {
          response = await this.stakeholderForgotPassword(identifier)
        }

        return response
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to process request'
        }
      }
    },

    // Unified password reset
    async unifiedResetPassword({ userType, identifier, otp, newPassword }) {
      try {
        let response

        if (userType === USER_TYPES.USER) {
          response = await this.resetPassword({
            mobile: identifier,
            otp,
            newPassword
          })
        } else {
          response = await this.stakeholderResetPassword({
            emailOrPhone: identifier,
            otp,
            newPassword
          })
        }

        return response
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to reset password'
        }
      }
    },

    // ===== EXISTING METHODS (Updated) =====

    // Register new user
    async register(userData) {
      this.isLoading = true
      try {
        const response = await api.post(API_ENDPOINTS.AUTH.REGISTER, userData)

        if (response.success) {
          return { success: true, data: response.data }
        }

        return { success: false, message: response.message }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Registration failed'
        }
      } finally {
        this.isLoading = false
      }
    },

    // Verify OTP (Users)
    async verifyOTP({ mobile, otp }) {
      try {
        const response = await api.post(API_ENDPOINTS.AUTH.VERIFY_OTP, { mobile, otp })

        if (response.success) {
          return { success: true, isValid: response.data }
        }

        return { success: false, message: response.message }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'OTP verification failed'
        }
      }
    },

    // Refresh access token
    async refreshAccessToken() {
      if (!this.refreshToken) {
        throw new Error('No refresh token available')
      }

      try {
        const response = await api.post(API_ENDPOINTS.AUTH.REFRESH_TOKEN, {
          refreshToken: this.refreshToken
        })

        if (response.success && response.data) {
          this.token = response.data.accessToken
          this.refreshToken = response.data.refreshToken

          LocalStorage.set('authToken', this.token)
          LocalStorage.set('refreshToken', this.refreshToken)

          return { success: true }
        }

        throw new Error('Token refresh failed')
      } catch (error) {
        this.clearAuth()
        throw error
      }
    },

    // Change password
    async changePassword({ oldPassword, newPassword }) {
      try {
        const response = await api.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
          oldPassword,
          newPassword
        })

        if (response.success) {
          return { success: true, message: 'Password changed successfully' }
        }

        return { success: false, message: response.message }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to change password'
        }
      }
    },

    // Forgot password (Users)
    async forgotPassword(mobile) {
      try {
        const response = await api.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, null, {
          params: { mobile }
        })

        if (response.success) {
          return { success: true, message: 'OTP sent to registered mobile number' }
        }

        return { success: false, message: response.message }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to process request'
        }
      }
    },

    // Reset password with OTP (Users)
    async resetPassword({ mobile, otp, newPassword }) {
      try {
        const response = await api.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
          mobile,
          otp,
          newPassword
        })

        if (response.success) {
          return { success: true, message: 'Password reset successfully' }
        }

        return { success: false, message: response.message }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to reset password'
        }
      }
    },

    // Validate token
    async validateToken() {
      try {
        const response = await api.get(API_ENDPOINTS.AUTH.VALIDATE_TOKEN)

        if (response.success && response.data) {
          this.userRole = response.data.role

          // Load customer context after token validation
          if (!this.isCustomerContextLoaded) {
            await this.loadCustomerContext()
          }

          return { success: true, data: response.data }
        }

        this.clearAuth()
        return { success: false }
      // eslint-disable-next-line no-unused-vars
      } catch (error) {
        this.clearAuth()
        return { success: false }
      }
    },

    // Check account status (Users)
    async checkAccountStatus(mobile) {
      try {
        const response = await api.get(API_ENDPOINTS.AUTH.ACCOUNT_STATUS, {
          params: { mobile }
        })

        if (response.success) {
          return { success: true, data: response.data }
        }

        return { success: false, message: response.message }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to check account status'
        }
      }
    },

    // ===== AUTH MANAGEMENT =====

    // Logout
    async logout() {
      try {
        await api.post(API_ENDPOINTS.AUTH.LOGOUT)
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        // Clean up Firebase service
        if (this.firebaseInitialized) {
          firebaseService.cleanup()
        }

        this.clearAuth()
      }
    },

    // Set auth data with customer context loading
    async setAuthData(authData, rememberMe = false, userType = USER_TYPES.USER) {
      this.token = authData.accessToken
      this.refreshToken = authData.refreshToken
      this.user = authData.user
      this.userRole = authData.user.userRole || authData.user.role
      this.userType = userType
      this.isAuthenticated = true
      this.loginAttempts = 0
      this.lastLoginTime = new Date().toISOString()

      // Store user type
      authService.getUserTypePreference(userType)

      // Store in localStorage or sessionStorage based on rememberMe
      const storage = rememberMe ? LocalStorage : SessionStorage

      storage.set('authToken', this.token)
      storage.set('refreshToken', this.refreshToken)
      storage.set('user', this.user)
      storage.set('userType', userType)

      // Always store in localStorage for persistence check
      if (!rememberMe) {
        LocalStorage.remove('authToken')
        LocalStorage.remove('refreshToken')
        LocalStorage.remove('user')
        LocalStorage.remove('userType')
      } else {
        LocalStorage.set('authToken', this.token)
        LocalStorage.set('refreshToken', this.refreshToken)
        LocalStorage.set('user', this.user)
        LocalStorage.set('userType', userType)
      }

      // Load customer context after successful authentication
      await this.loadCustomerContext()

      // Initialize customer session
      await this.initializeCustomerSession()

      // Initialize Firebase and register device
      await this.initializeFirebaseAfterAuth()
    },

    // Clear auth data
    clearAuth() {
      this.user = null
      this.token = null
      this.refreshToken = null
      this.isAuthenticated = false
      this.userRole = null
      this.userType = USER_TYPES.USER
      this.permissions = []

      // Clear customer context
      this.customerContext = null
      this.isCustomerContextLoaded = false
      this.customerContextError = null

      // Clear Firebase state
      this.firebaseInitialized = false
      this.deviceTokenRegistered = false
      this.fcmToken = null

      LocalStorage.remove('authToken')
      LocalStorage.remove('refreshToken')
      LocalStorage.remove('user')
      LocalStorage.remove('userType')
      LocalStorage.remove('customerContext')
      SessionStorage.remove('authToken')
      SessionStorage.remove('refreshToken')
      SessionStorage.remove('user')
      SessionStorage.remove('userType')
    },

    // Update user profile
    updateUserProfile(userData) {
      if (this.user) {
        this.user = { ...this.user, ...userData }
        LocalStorage.set('user', this.user)
      }
    },

    // Set user preferences
    setUserPreferences(preferences) {
      if (this.user) {
        this.user.userPreferences = preferences
        LocalStorage.set('user', this.user)
      }
    },

    // Set user type
    setUserType(userType) {
      this.userType = userType
      this.lastUsedUserType = userType
      authService.getUserTypePreference(userType)
    },

    // Get last used user type
    getLastUsedUserType() {
      return this.lastUsedUserType || authService.getUserTypePreference()
    },

    // ===== FIREBASE INTEGRATION METHODS =====

    // Get Firebase status
    getFirebaseStatus() {
      return {
        initialized: this.firebaseInitialized,
        deviceRegistered: this.deviceTokenRegistered,
        hasToken: !!this.fcmToken,
        serviceReady: firebaseService.isReady()
      }
    },

    // Request notification permissions
    async requestNotificationPermissions() {
      try {
        if (!this.firebaseInitialized) {
          console.log('Firebase not initialized, cannot request permissions')
          return false
        }

        const result = await firebaseService.requestPermissions()
        console.log('Notification permissions result:', result)
        return result
      } catch (error) {
        console.error('Error requesting notification permissions:', error)
        return false
      }
    },

    // Ping device token
    async pingDevice() {
      try {
        if (this.deviceTokenRegistered) {
          await firebaseService.pingDeviceToken()
        }
      } catch (error) {
        console.error('Error pinging device:', error)
      }
    }
  }
})
