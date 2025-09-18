// src/stores/deviceToken.js (Updated with Firebase & Customer Context)
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import deviceTokensService from 'src/services/api/deviceTokens.service'
import firebaseService from 'src/services/api/firebase.service'
import { useAuthStore } from 'stores/auth'
import { Notify } from 'quasar'

export const useDeviceTokenStore = defineStore('deviceToken', () => {
  // ===== STATE =====

  // Device tokens data
  const deviceTokens = ref([])
  const activeDeviceTokens = ref([])
  const currentDeviceToken = ref(null)
  const registeredToken = ref(null)

  // Counts
  const deviceTokenCount = ref(0)

  // Device info
  const deviceInfo = ref(null)
  const deviceTypes = ref([])

  // Loading states
  const loading = ref(false)
  const registering = ref(false)
  const checking = ref(false)

  // Error states
  const error = ref(null)
  const registrationError = ref(null)

  // Registration status
  const isRegistered = ref(false)
  const registrationStatus = ref('unknown') // unknown, registered, failed, pending

  // FCM token (from Firebase service)
  const fcmToken = ref(null)
  const fcmTokenReceived = ref(false)

  // Customer context integration
  const customerContext = ref(null)
  const subscribedTopics = ref([])
  const topicsLoaded = ref(false)

  // Firebase integration
  const firebaseReady = ref(false)
  const firebaseInitialized = ref(false)

  // ===== GETTERS =====

  const hasDeviceTokens = computed(() => deviceTokens.value.length > 0)
  const hasActiveTokens = computed(() => activeDeviceTokens.value.length > 0)
  const isWebDevice = computed(() => deviceInfo.value?.deviceType === 'Web')
  const isMobileDevice = computed(() => {
    const type = deviceInfo.value?.deviceType
    return type === 'Android' || type === 'iOS'
  })

  const currentDeviceTokenData = computed(() => {
    if (!currentDeviceToken.value) return null
    return {
      ...currentDeviceToken.value,
      isCurrentDevice: true,
      customerContext: customerContext.value,
      subscribedTopics: subscribedTopics.value
    }
  })

  const isFirebaseAndDeviceReady = computed(() => {
    return firebaseReady.value && fcmToken.value && isRegistered.value
  })

  // ===== ACTIONS =====

  /**
   * Initialize device token store with Firebase integration
   */
  async function initialize() {
    try {
      console.log('Initializing device token store...')

      const authStore = useAuthStore()

      // Wait for auth and customer context
      if (!authStore.isAuthenticated) {
        console.log('User not authenticated, skipping device token initialization')
        return
      }

      // Initialize device info
      initializeDeviceInfo()

      // Set customer context from auth store
      if (authStore.hasCustomerContext) {
        customerContext.value = authStore.currentCustomer
      }

      // Initialize Firebase integration
      await initializeFirebaseIntegration()

      // Load device token data
      await Promise.all([
        loadDeviceTypes(),
        loadMyDeviceTokens(),
        loadActiveDeviceTokens()
      ])

      console.log('Device token store initialized successfully')
    } catch (err) {
      console.error('Error initializing device token store:', err)
      error.value = err.message
    }
  }

  /**
   * Initialize Firebase integration
   */
  async function initializeFirebaseIntegration() {
    try {
      console.log('Initializing Firebase integration in device token store...')

      // Check if Firebase service is ready
      firebaseReady.value = firebaseService.isReady()

      if (firebaseReady.value) {
        // Get FCM token from Firebase service
        fcmToken.value = firebaseService.getCurrentToken()
        fcmTokenReceived.value = !!fcmToken.value

        // Get customer context from Firebase service
        const fbCustomerContext = firebaseService.getCustomerContext()
        if (fbCustomerContext) {
          customerContext.value = fbCustomerContext
        }

        // Get subscribed topics
        subscribedTopics.value = firebaseService.getSubscribedTopics()
        topicsLoaded.value = true

        firebaseInitialized.value = true

        console.log('Firebase integration initialized in device token store')

        // Check if current device token exists
        if (fcmToken.value) {
          await checkCurrentDeviceRegistration()
        }
      } else {
        console.log('Firebase service not ready, device token features limited')
      }
    } catch (err) {
      console.error('Error initializing Firebase integration:', err)
      firebaseInitialized.value = false
    }
  }

  /**
   * Check if current device token is already registered
   */
  async function checkCurrentDeviceRegistration() {
    try {
      if (!fcmToken.value) return

      checking.value = true
      const exists = await checkDeviceTokenExists(fcmToken.value)

      if (exists) {
        isRegistered.value = true
        registrationStatus.value = 'registered'

        // Find the current device in the list
        const existing = deviceTokens.value.find(t => t.deviceToken === fcmToken.value)
        if (existing) {
          currentDeviceToken.value = existing
        }
      } else {
        isRegistered.value = false
        registrationStatus.value = 'unknown'
      }
    } catch (err) {
      console.error('Error checking device registration:', err)
    } finally {
      checking.value = false
    }
  }

  /**
   * Initialize device info
   */
  function initializeDeviceInfo() {
    try {
      // Get device info from Firebase service if available
      if (firebaseService.isReady()) {
        deviceInfo.value = firebaseService.getDeviceInfo()
      } else {
        // Fallback to service method
        deviceInfo.value = deviceTokensService.getDeviceInfo()
      }

      console.log('Device info initialized:', deviceInfo.value)
    } catch (err) {
      console.error('Error initializing device info:', err)
    }
  }

  /**
   * Load available device types
   */
  async function loadDeviceTypes() {
    try {
      const response = await deviceTokensService.getAvailableDeviceTypes()
      if (response.success) {
        deviceTypes.value = response.data || []
      }
    } catch (err) {
      console.error('Error loading device types:', err)
    }
  }

  /**
   * Register device token with customer context
   */
  async function registerDeviceToken(tokenData = {}) {
    try {
      registering.value = true
      registrationError.value = null

      // Use FCM token from Firebase service if available
      const deviceTokenValue = tokenData.deviceToken || fcmToken.value || deviceTokensService.generateWebDeviceToken()

      // Merge with device info and customer context
      const deviceTokenData = {
        ...deviceInfo.value,
        ...tokenData,
        deviceToken: deviceTokenValue,
        // Add customer context fields if available
        ...(customerContext.value && {
          customerId: customerContext.value.id,
          customerName: customerContext.value.name,
          environment: customerContext.value.environment,
          deploymentUrl: customerContext.value.deploymentUrl
        })
      }

      const response = await deviceTokensService.registerMyDeviceToken(deviceTokenData)

      if (response.success) {
        registeredToken.value = response.data
        currentDeviceToken.value = response.data
        isRegistered.value = true
        registrationStatus.value = 'registered'

        // Update customer context from response
        if (response.customerContext) {
          customerContext.value = response.customerContext
        }

        // Update subscribed topics from response
        if (response.subscribedTopics) {
          subscribedTopics.value = response.subscribedTopics
          topicsLoaded.value = true
        }

        // Add to device tokens array if not already there
        const existingIndex = deviceTokens.value.findIndex(
          t => t.deviceToken === response.data.deviceToken
        )
        if (existingIndex === -1) {
          deviceTokens.value.unshift(response.data)
          if (response.data.isActive) {
            activeDeviceTokens.value.unshift(response.data)
          }
          deviceTokenCount.value++
        }

        Notify.create({
          type: 'positive',
          message: `Device registered for notifications${customerContext.value?.name ? ' - ' + customerContext.value.name : ''}`,
          position: 'top'
        })

        return response.data
      } else {
        throw new Error(response.message || 'Registration failed')
      }
    } catch (err) {
      console.error('Error registering device token:', err)
      registrationError.value = err.message || 'Registration failed'
      registrationStatus.value = 'failed'

      Notify.create({
        type: 'negative',
        message: 'Failed to register device for notifications',
        position: 'top'
      })

      throw err
    } finally {
      registering.value = false
    }
  }

  /**
   * Load my device tokens with customer context
   */
  async function loadMyDeviceTokens() {
    try {
      loading.value = true
      error.value = null

      const response = await deviceTokensService.getMyDeviceTokens()

      if (response.success) {
        deviceTokens.value = response.data || []
        deviceTokenCount.value = response.count || 0

        // Update customer context from response
        if (response.customerContext) {
          customerContext.value = response.customerContext
        }

        // Update available topics from response
        if (response.availableTopics) {
          subscribedTopics.value = response.availableTopics
          topicsLoaded.value = true
        }

        // Check if current FCM token exists
        if (fcmToken.value) {
          const existing = deviceTokens.value.find(t => t.deviceToken === fcmToken.value)
          if (existing) {
            currentDeviceToken.value = existing
            isRegistered.value = true
            registrationStatus.value = 'registered'
          }
        }
      } else {
        throw new Error(response.message || 'Failed to load device tokens')
      }
    } catch (err) {
      console.error('Error loading device tokens:', err)
      error.value = err.message || 'Failed to load device tokens'
    } finally {
      loading.value = false
    }
  }

  /**
   * Load active device tokens
   */
  async function loadActiveDeviceTokens() {
    try {
      const response = await deviceTokensService.getMyActiveDeviceTokens()

      if (response.success) {
        activeDeviceTokens.value = response.data || []

        // Update customer context from response
        if (response.customerContext) {
          customerContext.value = response.customerContext
        }
      }
    } catch (err) {
      console.error('Error loading active device tokens:', err)
    }
  }

  /**
   * Load device token count
   */
  async function loadDeviceTokenCount() {
    try {
      const response = await deviceTokensService.getMyDeviceTokenCount()

      if (response.success) {
        deviceTokenCount.value = response.tokenCount || 0
      }
    } catch (err) {
      console.error('Error loading device token count:', err)
    }
  }

  /**
   * Check if device token exists
   */
  async function checkDeviceTokenExists(deviceToken) {
    try {
      checking.value = true
      const response = await deviceTokensService.checkMyDeviceTokenExists(deviceToken)

      if (response.success) {
        const exists = response.exists || false

        if (exists && deviceToken === fcmToken.value) {
          isRegistered.value = true
          registrationStatus.value = 'registered'
        }

        return exists
      }
      return false
    } catch (err) {
      console.error('Error checking device token existence:', err)
      return false
    } finally {
      checking.value = false
    }
  }

  /**
   * Update device token
   */
  async function updateDeviceToken(tokenId, updateData) {
    try {
      const response = await deviceTokensService.updateMyDeviceToken(tokenId, updateData)

      if (response.success) {
        // Update in device tokens array
        const index = deviceTokens.value.findIndex(t => t.recCode === tokenId)
        if (index !== -1) {
          deviceTokens.value[index] = { ...deviceTokens.value[index], ...response.data }
        }

        // Update current device token if it matches
        if (currentDeviceToken.value?.recCode === tokenId) {
          currentDeviceToken.value = { ...currentDeviceToken.value, ...response.data }
        }

        Notify.create({
          type: 'positive',
          message: 'Device token updated',
          position: 'top'
        })

        return response.data
      }
      return null
    } catch (err) {
      console.error('Error updating device token:', err)
      Notify.create({
        type: 'negative',
        message: 'Failed to update device token',
        position: 'top'
      })
      return null
    }
  }

  /**
   * Deactivate device token
   */
  async function deactivateDeviceToken(tokenId) {
    try {
      const response = await deviceTokensService.deactivateMyDeviceToken(tokenId)

      if (response.success) {
        // Update in device tokens array
        const token = deviceTokens.value.find(t => t.recCode === tokenId)
        if (token) {
          token.isActive = false
        }

        // Remove from active tokens
        const activeIndex = activeDeviceTokens.value.findIndex(t => t.recCode === tokenId)
        if (activeIndex !== -1) {
          activeDeviceTokens.value.splice(activeIndex, 1)
        }

        // Update current device token if it matches
        if (currentDeviceToken.value?.recCode === tokenId) {
          currentDeviceToken.value.isActive = false
        }

        Notify.create({
          type: 'info',
          message: 'Device token deactivated',
          position: 'top'
        })

        return true
      }
      return false
    } catch (err) {
      console.error('Error deactivating device token:', err)
      Notify.create({
        type: 'negative',
        message: 'Failed to deactivate device token',
        position: 'top'
      })
      return false
    }
  }

  /**
   * Activate device token
   */
  async function activateDeviceToken(tokenId) {
    try {
      const response = await deviceTokensService.activateMyDeviceToken(tokenId)

      if (response.success) {
        // Update in device tokens array
        const token = deviceTokens.value.find(t => t.recCode === tokenId)
        if (token) {
          token.isActive = true
          token.lastUsedDate = new Date().toISOString()
        }

        // Add to active tokens if not already there
        const existingActive = activeDeviceTokens.value.find(t => t.recCode === tokenId)
        if (!existingActive && token) {
          activeDeviceTokens.value.push(token)
        }

        // Update subscribed topics from response
        if (response.subscribedTopics) {
          subscribedTopics.value = response.subscribedTopics
        }

        // Update current device token if it matches
        if (currentDeviceToken.value?.recCode === tokenId) {
          currentDeviceToken.value.isActive = true
          currentDeviceToken.value.lastUsedDate = new Date().toISOString()
        }

        Notify.create({
          type: 'positive',
          message: 'Device token activated',
          position: 'top'
        })

        return true
      }
      return false
    } catch (err) {
      console.error('Error activating device token:', err)
      Notify.create({
        type: 'negative',
        message: 'Failed to activate device token',
        position: 'top'
      })
      return false
    }
  }

  /**
   * Delete device token
   */
  async function deleteDeviceToken(tokenId) {
    try {
      const response = await deviceTokensService.deleteMyDeviceToken(tokenId)

      if (response.success) {
        // Remove from device tokens array
        const index = deviceTokens.value.findIndex(t => t.recCode === tokenId)
        if (index !== -1) {
          deviceTokens.value.splice(index, 1)
          deviceTokenCount.value = Math.max(0, deviceTokenCount.value - 1)
        }

        // Remove from active tokens
        const activeIndex = activeDeviceTokens.value.findIndex(t => t.recCode === tokenId)
        if (activeIndex !== -1) {
          activeDeviceTokens.value.splice(activeIndex, 1)
        }

        // Clear current device token if it matches
        if (currentDeviceToken.value?.recCode === tokenId) {
          currentDeviceToken.value = null
          isRegistered.value = false
          registrationStatus.value = 'unknown'
        }

        Notify.create({
          type: 'positive',
          message: 'Device token deleted',
          position: 'top'
        })

        return true
      }
      return false
    } catch (err) {
      console.error('Error deleting device token:', err)
      Notify.create({
        type: 'negative',
        message: 'Failed to delete device token',
        position: 'top'
      })
      return false
    }
  }

  /**
   * Ping device token (update last used)
   */
  async function pingDeviceToken(tokenId) {
    try {
      const response = await deviceTokensService.pingDeviceToken(tokenId)

      if (response.success) {
        // Update last used date in state
        const token = deviceTokens.value.find(t => t.recCode === tokenId)
        if (token) {
          token.lastUsedDate = new Date().toISOString()
        }

        const activeToken = activeDeviceTokens.value.find(t => t.recCode === tokenId)
        if (activeToken) {
          activeToken.lastUsedDate = new Date().toISOString()
        }

        if (currentDeviceToken.value?.recCode === tokenId) {
          currentDeviceToken.value.lastUsedDate = new Date().toISOString()
        }

        return true
      }
      return false
    } catch (err) {
      console.error('Error pinging device token:', err)
      return false
    }
  }

  /**
   * Subscribe to customer topics
   */
  async function subscribeToCustomerTopics(tokenId) {
    try {
      const response = await deviceTokensService.subscribeToCustomerTopics(tokenId)

      if (response.success) {
        subscribedTopics.value = response.subscribedTopics || []
        topicsLoaded.value = true

        Notify.create({
          type: 'positive',
          message: 'Subscribed to customer topics',
          position: 'top'
        })

        return response.subscribedTopics
      }
      return []
    } catch (err) {
      console.error('Error subscribing to customer topics:', err)
      Notify.create({
        type: 'negative',
        message: 'Failed to subscribe to topics',
        position: 'top'
      })
      return []
    }
  }

  /**
   * Set FCM token from Firebase service
   */
  function setFCMToken(token) {
    fcmToken.value = token
    fcmTokenReceived.value = !!token

    if (token) {
      // Check if this token is already registered
      checkDeviceTokenExists(token)
    }
  }

  /**
   * Auto-register current device if FCM token is available
   */
  async function autoRegisterDevice() {
    if (fcmToken.value && !isRegistered.value && deviceInfo.value) {
      try {
        await registerDeviceToken({
          deviceToken: fcmToken.value,
          deviceType: deviceInfo.value.deviceType,
          deviceName: deviceInfo.value.deviceName,
          appVersion: process.env.APP_VERSION || '1.0.0'
        })
      } catch (err) {
        console.error('Auto-registration failed:', err)
      }
    }
  }

  /**
   * Update customer context
   */
  function updateCustomerContext(newCustomerContext) {
    customerContext.value = newCustomerContext

    // Update Firebase service customer context
    if (firebaseInitialized.value) {
      firebaseService.customerContext = newCustomerContext
    }
  }

  /**
   * Sync with Firebase service
   */
  async function syncWithFirebaseService() {
    try {
      if (!firebaseService.isReady()) return

      // Update local state from Firebase service
      fcmToken.value = firebaseService.getCurrentToken()
      fcmTokenReceived.value = !!fcmToken.value

      const fbCustomerContext = firebaseService.getCustomerContext()
      if (fbCustomerContext) {
        customerContext.value = fbCustomerContext
      }

      subscribedTopics.value = firebaseService.getSubscribedTopics()
      topicsLoaded.value = true
      firebaseReady.value = true

      console.log('Synced device token store with Firebase service')
    } catch (err) {
      console.error('Error syncing with Firebase service:', err)
    }
  }

  /**
   * Get customer context information
   */
  async function loadCustomerContext() {
    try {
      const response = await deviceTokensService.getCustomerContext()

      if (response.success) {
        customerContext.value = response.customerContext

        if (response.firebaseTopics) {
          subscribedTopics.value = response.firebaseTopics
          topicsLoaded.value = true
        }

        return response.customerContext
      }
      return null
    } catch (err) {
      console.error('Error loading customer context:', err)
      return null
    }
  }

  /**
   * Reset store state
   */
  function resetState() {
    deviceTokens.value = []
    activeDeviceTokens.value = []
    currentDeviceToken.value = null
    registeredToken.value = null
    deviceTokenCount.value = 0
    deviceInfo.value = null
    deviceTypes.value = []
    loading.value = false
    registering.value = false
    checking.value = false
    error.value = null
    registrationError.value = null
    isRegistered.value = false
    registrationStatus.value = 'unknown'
    fcmToken.value = null
    fcmTokenReceived.value = false
    customerContext.value = null
    subscribedTopics.value = []
    topicsLoaded.value = false
    firebaseReady.value = false
    firebaseInitialized.value = false
  }

  return {
    // State
    deviceTokens,
    activeDeviceTokens,
    currentDeviceToken,
    registeredToken,
    deviceTokenCount,
    deviceInfo,
    deviceTypes,
    loading,
    registering,
    checking,
    error,
    registrationError,
    isRegistered,
    registrationStatus,
    fcmToken,
    fcmTokenReceived,
    customerContext,
    subscribedTopics,
    topicsLoaded,
    firebaseReady,
    firebaseInitialized,

    // Getters
    hasDeviceTokens,
    hasActiveTokens,
    isWebDevice,
    isMobileDevice,
    currentDeviceTokenData,
    isFirebaseAndDeviceReady,

    // Actions
    initialize,
    initializeFirebaseIntegration,
    initializeDeviceInfo,
    loadDeviceTypes,
    registerDeviceToken,
    loadMyDeviceTokens,
    loadActiveDeviceTokens,
    loadDeviceTokenCount,
    checkDeviceTokenExists,
    updateDeviceToken,
    deactivateDeviceToken,
    activateDeviceToken,
    deleteDeviceToken,
    pingDeviceToken,
    subscribeToCustomerTopics,
    setFCMToken,
    autoRegisterDevice,
    updateCustomerContext,
    syncWithFirebaseService,
    loadCustomerContext,
    resetState
  }
})
