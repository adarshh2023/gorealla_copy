// src/services/firebase/firebase.service.js
import { getFCMToken, isFirebaseReady } from 'boot/firebase'
import { api } from 'boot/axios'
import { API_ENDPOINTS } from 'src/constants/api.constants'
import deviceTokensService from 'src/services/api/deviceTokens.service'
import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { Notify } from 'quasar'

class FirebaseService {
  constructor() {
    this.fcmToken = null
    this.customerContext = null
    this.isInitialized = false
    this.deviceInfo = null
    this.subscribedTopics = []
    this.currentDeviceTokenId = null
  }

  // ===== INITIALIZATION =====

  /**
   * Initialize Firebase service with customer context
   */
  async initialize(customerContext = null) {
    try {
      console.log('Initializing Firebase service...')

      this.customerContext = customerContext
      this.deviceInfo = this.getDeviceInfo()

      if (Capacitor.isNativePlatform()) {
        await this.initializeCapacitorPush()
      } else {
        await this.initializeWebPush()
      }

      this.isInitialized = true
      console.log('Firebase service initialized successfully')

      return true
    } catch (error) {
      console.error('Firebase service initialization failed:', error)
      return false
    }
  }

  /**
   * Initialize web push notifications
   */
  async initializeWebPush() {
    try {
      if (!isFirebaseReady()) {
        throw new Error('Firebase not ready for web push')
      }

      // Check notification permission
      if (!('Notification' in window)) {
        throw new Error('This browser does not support notifications')
      }

      // Get FCM token
      this.fcmToken = await getFCMToken()

      if (this.fcmToken) {
        console.log('Web FCM token obtained:', this.fcmToken.substring(0, 20) + '...')

        // Register device token with backend using service
        await this.registerDeviceToken()

        return true
      } else {
        throw new Error('Failed to get FCM token')
      }
    } catch (error) {
      console.error('Web push initialization failed:', error)
      throw error
    }
  }

  /**
   * Initialize Capacitor push notifications
   */
  async initializeCapacitorPush() {
    try {
      console.log('Initializing Capacitor push notifications...')

      // Request permissions
      const permissionResult = await PushNotifications.requestPermissions()

      if (permissionResult.receive !== 'granted') {
        throw new Error('Push notification permission denied')
      }

      // Register with Apple/Google
      await PushNotifications.register()

      // Listen for registration
      PushNotifications.addListener('registration', (token) => {
        console.log('Capacitor push token:', token.value.substring(0, 20) + '...')
        this.fcmToken = token.value

        // Register device token with backend using service
        this.registerDeviceToken()
      })

      // Listen for registration errors
      PushNotifications.addListener('registrationError', (error) => {
        console.error('Capacitor push registration error:', error)
      })

      // Listen for push notifications
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Capacitor push notification received:', notification)
        this.handleCapacitorNotification(notification)
      })

      // Listen for notification actions
      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Capacitor push notification action:', notification)
        this.handleCapacitorNotificationAction(notification)
      })

      return true
    } catch (error) {
      console.error('Capacitor push initialization failed:', error)
      throw error
    }
  }

  // ===== DEVICE TOKEN MANAGEMENT =====

  /**
   * Register device token with backend using deviceTokensService
   */
  async registerDeviceToken() {
    try {
      if (!this.fcmToken) {
        throw new Error('No FCM token available')
      }

      // Import auth store to get current user info
      const { useAuthStore } = await import('stores/auth')
      const authStore = useAuthStore()

      // Check if user is authenticated
      if (!authStore.isAuthenticated || !authStore.user) {
        throw new Error('User not authenticated')
      }

      // Prepare device token data with required owner information
      const deviceTokenData = {
        deviceToken: this.fcmToken,
        ownerType: authStore.currentUserType, // USER or STAKEHOLDER from auth store
        ownerId: authStore.user.recCode || authStore.user.id, // User ID from JWT token
        deviceType: this.deviceInfo.deviceType,
        deviceName: this.deviceInfo.deviceName,
        appVersion: process.env.APP_VERSION || '1.0.0'
      }

      // Add optional fields
      if (this.deviceInfo.platform) {
        deviceTokenData.platform = this.deviceInfo.platform
      }

      if (this.deviceInfo.userAgent) {
        deviceTokenData.userAgent = this.deviceInfo.userAgent
      }

      // Add customer context if available
      if (authStore.customerContext) {
        deviceTokenData.customerId = authStore.customerContext.id
        deviceTokenData.customerName = authStore.customerContext.name
        deviceTokenData.deploymentUrl = authStore.customerContext.deploymentUrl
        deviceTokenData.environment = authStore.customerContext.environment
      }

      // Add metadata as JSON string
      const metadata = {
        language: this.deviceInfo.language,
        isNative: this.deviceInfo.isNative,
        isWeb: this.deviceInfo.isWeb,
        registrationSource: 'firebase-service'
      }
      deviceTokenData.metadata = JSON.stringify(metadata)

      console.log('Registering device token via deviceTokensService with owner info:', {
        ownerType: deviceTokenData.ownerType,
        ownerId: deviceTokenData.ownerId,
        deviceType: deviceTokenData.deviceType
      })

      const response = await deviceTokensService.registerMyDeviceToken(deviceTokenData)

      if (response.success) {
        console.log('Device token registered successfully')
        this.currentDeviceTokenId = response.data.recCode

        // Store customer context from response
        if (response.customerContext) {
          this.customerContext = response.customerContext
        }

        // Store subscribed topics
        if (response.subscribedTopics) {
          this.subscribedTopics = response.subscribedTopics
        }

        return response.data
      } else {
        throw new Error(response.message || 'Device registration failed')
      }
    } catch (error) {
      console.error('Device token registration failed:', error)
      throw error
    }
  }

  /**
   * Subscribe to customer-specific topics using deviceTokensService
   */
  async subscribeToCustomerTopics() {
    try {
      if (!this.fcmToken) {
        throw new Error('No FCM token available')
      }

      // Get device tokens using service
      const deviceTokensResponse = await deviceTokensService.getMyDeviceTokens()

      if (deviceTokensResponse.success && deviceTokensResponse.data.length > 0) {
        const currentDevice = deviceTokensResponse.data.find(token =>
          token.deviceToken === this.fcmToken
        )

        if (currentDevice) {
          this.currentDeviceTokenId = currentDevice.recCode

          // Call subscribe endpoint using API constants
          const response = await api.post(API_ENDPOINTS.NOTIFICATIONS.DEVICE_TOKENS.SUBSCRIBE(currentDevice.recCode))

          if (response.success) {
            this.subscribedTopics = response.subscribedTopics || []
            console.log('Subscribed to customer topics:', this.subscribedTopics)
            return this.subscribedTopics
          }
        }
      }

      throw new Error('Device not found or subscription failed')
    } catch (error) {
      console.error('Topic subscription failed:', error)
      throw error
    }
  }

  /**
   * Ping device token using deviceTokensService
   */
  async pingDeviceToken() {
    try {
      if (!this.fcmToken) return

      // If we know the current device token ID, use it directly
      if (this.currentDeviceTokenId) {
        await deviceTokensService.pingDeviceToken(this.currentDeviceTokenId)
        return
      }

      // Otherwise, find the device token first
      const deviceTokensResponse = await deviceTokensService.getMyDeviceTokens()

      if (deviceTokensResponse.success && deviceTokensResponse.data.length > 0) {
        const currentDevice = deviceTokensResponse.data.find(token =>
          token.deviceToken === this.fcmToken
        )

        if (currentDevice) {
          this.currentDeviceTokenId = currentDevice.recCode
          await deviceTokensService.pingDeviceToken(currentDevice.recCode)
        }
      }
    } catch (error) {
      console.error('Device ping failed:', error)
    }
  }

  /**
   * Check if current device token exists using deviceTokensService
   */
  async checkCurrentDeviceExists() {
    try {
      if (!this.fcmToken) return false

      const response = await deviceTokensService.checkMyDeviceTokenExists(this.fcmToken)
      return response.success && response.exists
    } catch (error) {
      console.error('Error checking device existence:', error)
      return false
    }
  }

  /**
   * Update current device token using deviceTokensService
   */
  async updateCurrentDevice(updateData) {
    try {
      if (!this.currentDeviceTokenId) {
        // Try to find the current device token ID
        await this.findCurrentDeviceTokenId()
      }

      if (!this.currentDeviceTokenId) {
        throw new Error('No current device token ID available')
      }

      const response = await deviceTokensService.updateMyDeviceToken(this.currentDeviceTokenId, updateData)

      if (response.success) {
        console.log('Device token updated successfully')
        return response.data
      } else {
        throw new Error(response.message || 'Device update failed')
      }
    } catch (error) {
      console.error('Device update failed:', error)
      throw error
    }
  }

  /**
   * Deactivate current device token using deviceTokensService
   */
  async deactivateCurrentDevice() {
    try {
      if (!this.currentDeviceTokenId) {
        // Try to find the current device token ID
        await this.findCurrentDeviceTokenId()
      }

      if (!this.currentDeviceTokenId) {
        throw new Error('No current device token ID available')
      }

      const response = await deviceTokensService.deactivateMyDeviceToken(this.currentDeviceTokenId)

      if (response.success) {
        console.log('Device token deactivated successfully')
        return true
      } else {
        throw new Error(response.message || 'Device deactivation failed')
      }
    } catch (error) {
      console.error('Device deactivation failed:', error)
      throw error
    }
  }

  // ===== CUSTOMER CONTEXT =====

  /**
   * Load customer context from backend
   * Note: This should also be moved to a dedicated service (e.g., configService)
   */
  async loadCustomerContext() {
    try {
      // Use API constants for customer context endpoints
      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.CONFIG.CUSTOMER_INFO)

      if (response.success) {
        this.customerContext = response.customer
        console.log('Customer context loaded:', this.customerContext)
        return this.customerContext
      } else {
        throw new Error(response.message || 'Failed to load customer context')
      }
    } catch (error) {
      console.error('Failed to load customer context:', error)
      throw error
    }
  }

  /**
   * Get current customer context
   */
  getCustomerContext() {
    return this.customerContext
  }

  /**
   * Initialize customer session
   * Note: This should also be moved to a dedicated service (e.g., configService)
   */
  async initializeCustomerSession(deviceInfo = null) {
    try {
      const sessionData = {
        deviceInfo: deviceInfo || this.deviceInfo
      }

      // Use API constants for initialize session endpoint
      const response = await api.post(API_ENDPOINTS.NOTIFICATIONS.CONFIG.INITIALIZE_SESSION, sessionData)

      if (response.success) {
        this.customerContext = response.session
        console.log('Customer session initialized:', response.session)
        return response
      } else {
        throw new Error(response.message || 'Session initialization failed')
      }
    } catch (error) {
      console.error('Customer session initialization failed:', error)
      throw error
    }
  }

  // ===== NOTIFICATION HANDLING =====

  /**
   * Handle Capacitor notification received
   */
  handleCapacitorNotification(notification) {
    try {
      console.log('Handling Capacitor notification:', notification)

      // Show notification using Quasar
      Notify.create({
        type: 'info',
        message: notification.title || 'New Notification',
        caption: notification.body || '',
        position: 'top-right',
        timeout: 5000,
        actions: [
          {
            label: 'View',
            color: 'white',
            handler: () => {
              this.handleNotificationAction(notification.data)
            }
          },
          { label: 'Dismiss', color: 'white' }
        ]
      })
    } catch (error) {
      console.error('Error handling Capacitor notification:', error)
    }
  }

  /**
   * Handle Capacitor notification action
   */
  handleCapacitorNotificationAction(notification) {
    try {
      console.log('Handling Capacitor notification action:', notification)
      this.handleNotificationAction(notification.notification.data)
    } catch (error) {
      console.error('Error handling Capacitor notification action:', error)
    }
  }

  /**
   * Handle notification click/action
   */
  handleNotificationAction(data) {
    try {
      // This will be implemented based on your routing needs
      console.log('Notification action data:', data)

      // Example routing logic
      if (data?.click_action === 'NODE_DETAIL' && data?.nodeId) {
        // Navigate to node detail
        window.location.href = `/menu/projects/nodes/${data.nodeId}`
      } else if (data?.click_action === 'NOTIFICATION_LIST') {
        // Navigate to notifications
        window.location.href = '/menu/notifications'
      } else {
        // Default action
        window.location.href = '/menu/notifications'
      }
    } catch (error) {
      console.error('Error handling notification action:', error)
    }
  }

  // ===== PERMISSION MANAGEMENT =====

  /**
   * Request notification permissions
   */
  async requestPermissions() {
    try {
      if (Capacitor.isNativePlatform()) {
        const result = await PushNotifications.requestPermissions()
        return result.receive === 'granted'
      } else {
        const permission = await Notification.requestPermission()
        return permission === 'granted'
      }
    } catch (error) {
      console.error('Permission request failed:', error)
      return false
    }
  }

  /**
   * Check current notification permissions
   */
  async checkPermissions() {
    try {
      if (Capacitor.isNativePlatform()) {
        const result = await PushNotifications.checkPermissions()
        return {
          granted: result.receive === 'granted',
          denied: result.receive === 'denied',
          prompt: result.receive === 'prompt'
        }
      } else {
        const permission = Notification.permission
        return {
          granted: permission === 'granted',
          denied: permission === 'denied',
          prompt: permission === 'default'
        }
      }
    } catch (error) {
      console.error('Permission check failed:', error)
      return { granted: false, denied: true, prompt: false }
    }
  }

  // ===== UTILITY METHODS =====

  /**
   * Get device information
   */
  getDeviceInfo() {
    const userAgent = navigator.userAgent
    let deviceType = 'Web'
    let deviceName = 'Unknown Device'
    let platform = 'Web'

    if (Capacitor.isNativePlatform()) {
      platform = Capacitor.getPlatform()
      deviceType = platform === 'ios' ? 'iOS' : 'Android'
      deviceName = `${platform.charAt(0).toUpperCase() + platform.slice(1)} Device`
    } else {
      // Web detection
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
    }

    return {
      deviceType,
      deviceName,
      platform,
      userAgent,
      language: navigator.language,
      isNative: Capacitor.isNativePlatform(),
      isWeb: !Capacitor.isNativePlatform()
    }
  }

  /**
   * Get current FCM token
   */
  getCurrentToken() {
    return this.fcmToken
  }

  /**
   * Get subscribed topics
   */
  getSubscribedTopics() {
    return this.subscribedTopics
  }

  /**
   * Check if service is ready
   */
  isReady() {
    return this.isInitialized && (this.fcmToken !== null)
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      hasToken: !!this.fcmToken,
      customerContext: !!this.customerContext,
      subscribedTopics: this.subscribedTopics.length,
      deviceInfo: this.deviceInfo,
      platform: Capacitor.isNativePlatform() ? 'native' : 'web',
      currentDeviceTokenId: this.currentDeviceTokenId
    }
  }

  /**
   * Refresh FCM token
   */
  async refreshToken() {
    try {
      if (Capacitor.isNativePlatform()) {
        // Re-register for Capacitor
        await PushNotifications.register()
      } else {
        // Get new web token
        this.fcmToken = await getFCMToken()

        if (this.fcmToken) {
          await this.registerDeviceToken()
        }
      }

      return this.fcmToken
    } catch (error) {
      console.error('Token refresh failed:', error)
      throw error
    }
  }

  /**
   * Ping current device token using deviceTokensService
   */
  async pingCurrentDevice() {
    try {
      if (!this.currentDeviceTokenId) {
        // Try to find the current device token ID
        await this.findCurrentDeviceTokenId()
      }

      if (this.currentDeviceTokenId) {
        await deviceTokensService.pingDeviceToken(this.currentDeviceTokenId)
        console.log('Device token pinged successfully')
      }
    } catch (error) {
      console.error('Device ping failed:', error)
    }
  }

  /**
   * Find current device token ID using deviceTokensService
   */
  async findCurrentDeviceTokenId() {
    try {
      if (!this.fcmToken) return null

      const deviceTokensResponse = await deviceTokensService.getMyDeviceTokens()

      if (deviceTokensResponse.success && deviceTokensResponse.data.length > 0) {
        const currentDevice = deviceTokensResponse.data.find(token =>
          token.deviceToken === this.fcmToken
        )

        if (currentDevice) {
          this.currentDeviceTokenId = currentDevice.recCode
          return currentDevice.recCode
        }
      }

      return null
    } catch (error) {
      console.error('Error finding current device token ID:', error)
      return null
    }
  }

  /**
   * Get current device token info using deviceTokensService
   */
  async getCurrentDeviceInfo() {
    try {
      if (!this.currentDeviceTokenId) {
        await this.findCurrentDeviceTokenId()
      }

      if (this.currentDeviceTokenId) {
        const response = await deviceTokensService.getMyDeviceTokenById(this.currentDeviceTokenId)
        if (response.success) {
          return response.data
        }
      }

      return null
    } catch (error) {
      console.error('Error getting current device info:', error)
      return null
    }
  }

  /**
   * Clean up service
   */
  cleanup() {
    this.fcmToken = null
    this.customerContext = null
    this.isInitialized = false
    this.subscribedTopics = []
    this.currentDeviceTokenId = null

    console.log('Firebase service cleaned up')
  }
}

export default new FirebaseService()
