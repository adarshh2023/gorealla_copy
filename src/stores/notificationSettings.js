// src/stores/notificationSettings.js (Updated with Customer Context)
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import notificationSettingsService from 'src/services/api/notificationSettings.service'
import { useAuthStore } from 'stores/auth'
import { useDeviceTokenStore } from 'stores/deviceToken'
import { Notify } from 'quasar'

export const useNotificationSettingsStore = defineStore('notificationSettings', () => {
  // ===== STATE =====

  // Settings data
  const settings = ref([])
  const currentSettings = ref(null)
  const notificationTypes = ref([])

  // Loading states
  const loading = ref(false)
  const updating = ref(false)
  const toggling = ref(false)

  // Error states
  const error = ref(null)

  // Quick access to common settings
  const emailEnabled = ref(true)
  const smsEnabled = ref(true)
  const pushEnabled = ref(true)
  const inAppEnabled = ref(true)

  // Customer context integration
  const customerContext = ref(null)
  const customerSettingsLoaded = ref(false)

  // Channel configurations with customer context
  const channelConfigs = ref({})
  const availableChannels = ref([])

  // ===== GETTERS =====

  const hasSettings = computed(() => settings.value.length > 0)

  const settingsByType = computed(() => {
    const grouped = {}
    settings.value.forEach(setting => {
      grouped[setting.notificationType] = setting
    })
    return grouped
  })

  const enabledChannels = computed(() => {
    const channels = []
    if (emailEnabled.value) channels.push('Email')
    if (smsEnabled.value) channels.push('SMS')
    if (pushEnabled.value) channels.push('Push')
    if (inAppEnabled.value) channels.push('InApp')
    return channels
  })

  const disabledChannels = computed(() => {
    const channels = []
    if (!emailEnabled.value) channels.push('Email')
    if (!smsEnabled.value) channels.push('SMS')
    if (!pushEnabled.value) channels.push('Push')
    if (!inAppEnabled.value) channels.push('InApp')
    return channels
  })

  const customerName = computed(() => {
    return customerContext.value?.name || 'Unknown Customer'
  })

  const settingsWithCustomerContext = computed(() => {
    return settings.value.map(setting => ({
      ...setting,
      customerContext: customerContext.value,
      availableChannels: availableChannels.value
    }))
  })

  const isFirebaseEnabled = computed(() => {
    return channelConfigs.value.push?.enabled || false
  })

  const notificationCapabilities = computed(() => {
    return {
      channels: availableChannels.value.length,
      emailSupported: channelConfigs.value.email?.enabled || false,
      smsSupported: channelConfigs.value.sms?.enabled || false,
      pushSupported: channelConfigs.value.push?.enabled || false,
      inAppSupported: true, // Always supported
      firebaseTopics: channelConfigs.value.push?.topics?.length || 0,
      customerEnvironment: customerContext.value?.environment || 'unknown'
    }
  })

  // ===== ACTIONS =====

  /**
   * Initialize notification settings store with customer context
   */
  async function initialize() {
    try {
      console.log('Initializing notification settings store...')

      const authStore = useAuthStore()

      if (!authStore.isAuthenticated) {
        console.log('User not authenticated, skipping notification settings initialization')
        return
      }

      // Set customer context from auth store
      if (authStore.hasCustomerContext) {
        customerContext.value = authStore.currentCustomer
      }

      // Load customer-specific channel configurations
      await loadChannelConfigurations()

      // Load settings and types
      await Promise.all([
        loadMySettings(),
        loadNotificationTypes()
      ])

      customerSettingsLoaded.value = true
      console.log('Notification settings store initialized successfully')
    } catch (err) {
      console.error('Error initializing notification settings store:', err)
      error.value = err.message
    }
  }

  /**
   * Load customer-specific channel configurations
   */
  async function loadChannelConfigurations() {
    try {
      // This would typically call a customer-specific API
      // For now, we'll simulate based on the customer info API
      const authStore = useAuthStore()

      if (authStore.hasCustomerContext) {
        // Simulate loading channel configs from customer context
        // In reality, this would come from the CustomerInfoController
        const customerInfo = authStore.currentCustomer

        channelConfigs.value = {
          email: {
            enabled: true,
            templatesEnabled: true,
            htmlSupport: true
          },
          sms: {
            enabled: false, // Typically disabled by default
            maxLength: 160
          },
          push: {
            enabled: true,
            topics: ['customer_' + customerInfo.id],
            autoSubscribe: true
          },
          inApp: {
            enabled: true,
            realTime: true
          }
        }

        // Build available channels list
        availableChannels.value = Object.entries(channelConfigs.value)
          // eslint-disable-next-line no-unused-vars
          .filter(([_, config]) => config.enabled)
          .map(([type, config]) => ({
            type: type.charAt(0).toUpperCase() + type.slice(1),
            name: getChannelDisplayName(type),
            enabled: config.enabled,
            config: config
          }))

        console.log('Channel configurations loaded:', channelConfigs.value)
      }
    } catch (err) {
      console.error('Error loading channel configurations:', err)
    }
  }

  /**
   * Get display name for channel type
   */
  function getChannelDisplayName(type) {
    const names = {
      email: 'Email Notifications',
      sms: 'SMS Notifications',
      push: 'Push Notifications',
      inApp: 'In-App Notifications'
    }
    return names[type] || type
  }

  /**
   * Load my notification settings with customer context
   */
  async function loadMySettings() {
    try {
      loading.value = true
      error.value = null

      const response = await notificationSettingsService.getMySettings()

      if (response.success) {
        settings.value = (response.data || []).map(setting => ({
          ...setting,
          customerContext: customerContext.value
        }))

        // Update quick access flags
        updateQuickAccessFlags()
      } else {
        throw new Error(response.message || 'Failed to load settings')
      }
    } catch (err) {
      console.error('Error loading notification settings:', err)
      error.value = err.message || 'Failed to load settings'
    } finally {
      loading.value = false
    }
  }

  /**
   * Load available notification types with customer context
   */
  async function loadNotificationTypes() {
    try {
      const response = await notificationSettingsService.getAvailableNotificationTypes()

      if (response.success) {
        notificationTypes.value = response.data || []
      }
    } catch (err) {
      console.error('Error loading notification types:', err)
    }
  }

  /**
   * Get or create settings for a specific notification type
   */
  async function getOrCreateSettings(notificationType) {
    try {
      const response = await notificationSettingsService.getOrCreateMySettings(notificationType)

      if (response.success) {
        const settingWithContext = {
          ...response.data,
          customerContext: customerContext.value
        }

        currentSettings.value = settingWithContext

        // Update in settings array
        const index = settings.value.findIndex(s => s.notificationType === notificationType)
        if (index !== -1) {
          settings.value[index] = settingWithContext
        } else {
          settings.value.push(settingWithContext)
        }

        return settingWithContext
      }
      return null
    } catch (err) {
      console.error('Error getting/creating settings:', err)
      return null
    }
  }

  /**
   * Update notification settings with customer context
   */
  async function updateSettings(settingsId, settingsData) {
    try {
      updating.value = true

      // Add customer context to settings data
      const dataWithContext = {
        ...settingsData,
        customerId: customerContext.value?.id,
        customerName: customerContext.value?.name
      }

      const response = await notificationSettingsService.updateMySettings(settingsId, dataWithContext)

      if (response.success) {
        const updatedSetting = {
          ...response.data,
          customerContext: customerContext.value
        }

        // Update in settings array
        const index = settings.value.findIndex(s => s.recCode === settingsId)
        if (index !== -1) {
          settings.value[index] = { ...settings.value[index], ...updatedSetting }
        }

        // Update current settings if it matches
        if (currentSettings.value?.recCode === settingsId) {
          currentSettings.value = { ...currentSettings.value, ...updatedSetting }
        }

        // Update quick access flags
        updateQuickAccessFlags()

        Notify.create({
          type: 'positive',
          message: `Notification settings updated${customerContext.value?.name ? ' for ' + customerContext.value.name : ''}`,
          position: 'top'
        })

        return updatedSetting
      }
      return null
    } catch (err) {
      console.error('Error updating notification settings:', err)
      Notify.create({
        type: 'negative',
        message: 'Failed to update notification settings',
        position: 'top'
      })
      return null
    } finally {
      updating.value = false
    }
  }

  /**
   * Toggle email notifications
   */
  async function toggleEmailNotifications() {
    try {
      toggling.value = true
      const newState = !emailEnabled.value // Calculate the desired new state
      const response = await notificationSettingsService.toggleMyEmailNotifications(newState)

      if (response.success) {
        emailEnabled.value = newState

        // Reload settings to get updated state
        await loadMySettings()

        Notify.create({
          type: 'positive',
          message: `Email notifications ${newState ? 'enabled' : 'disabled'}${customerContext.value?.name ? ' for ' + customerContext.value.name : ''}`,
          position: 'top'
        })

        return true
      }
      return false
    } catch (err) {
      console.error('Error toggling email notifications:', err)
      Notify.create({
        type: 'negative',
        message: 'Failed to toggle email notifications',
        position: 'top'
      })
      return false
    } finally {
      toggling.value = false
    }
  }

  /**
   * Toggle SMS notifications
   */
  async function toggleSmsNotifications() {
    try {
      toggling.value = true
      const newState = !smsEnabled.value // Calculate the desired new state
      const response = await notificationSettingsService.toggleMySmsNotifications(newState)

      if (response.success) {
        smsEnabled.value = newState

        // Reload settings to get updated state
        await loadMySettings()

        Notify.create({
          type: 'positive',
          message: `SMS notifications ${newState ? 'enabled' : 'disabled'}${customerContext.value?.name ? ' for ' + customerContext.value.name : ''}`,
          position: 'top'
        })

        return true
      }
      return false
    } catch (err) {
      console.error('Error toggling SMS notifications:', err)
      Notify.create({
        type: 'negative',
        message: 'Failed to toggle SMS notifications',
        position: 'top'
      })
      return false
    } finally {
      toggling.value = false
    }
  }

  /**
   * Toggle push notifications with Firebase integration
   */
  async function togglePushNotifications() {
    try {
      toggling.value = true

      // Check Firebase availability first
      const deviceTokenStore = useDeviceTokenStore()

      if (!deviceTokenStore.firebaseReady) {
        Notify.create({
          type: 'warning',
          message: 'Push notifications are not available. Please check your device settings.',
          position: 'top'
        })
        return false
      }

      const newState = !pushEnabled.value // Calculate the desired new state
      const response = await notificationSettingsService.toggleMyPushNotifications(newState)

      if (response.success) {
        pushEnabled.value = newState

        // If enabling push notifications, ensure device is registered
        if (newState && !deviceTokenStore.isRegistered) {
          try {
            await deviceTokenStore.autoRegisterDevice()
          } catch (regError) {
            console.warn('Auto-registration failed:', regError)
          }
        }

        // Reload settings to get updated state
        await loadMySettings()

        Notify.create({
          type: 'positive',
          message: `Push notifications ${newState ? 'enabled' : 'disabled'}${customerContext.value?.name ? ' for ' + customerContext.value.name : ''}`,
          position: 'top'
        })

        return true
      }
      return false
    } catch (err) {
      console.error('Error toggling push notifications:', err)
      Notify.create({
        type: 'negative',
        message: 'Failed to toggle push notifications',
        position: 'top'
      })
      return false
    } finally {
      toggling.value = false
    }
  }

  /**
   * Create default settings with customer context
   */
  async function createDefaultSettings() {
    try {
      const response = await notificationSettingsService.createMyDefaultSettings()

      if (response.success) {
        // Reload settings
        await loadMySettings()

        Notify.create({
          type: 'positive',
          message: `Default notification settings created${customerContext.value?.name ? ' for ' + customerContext.value.name : ''}`,
          position: 'top'
        })

        return true
      }
      return false
    } catch (err) {
      console.error('Error creating default settings:', err)
      Notify.create({
        type: 'negative',
        message: 'Failed to create default settings',
        position: 'top'
      })
      return false
    }
  }

  /**
   * Update quick access flags based on current settings
   */
  function updateQuickAccessFlags() {
    // Reset to defaults
    emailEnabled.value = true
    smsEnabled.value = true
    pushEnabled.value = true
    inAppEnabled.value = true

    // Update based on settings
    settings.value.forEach(setting => {
      if (!setting.enabled) return

      if (!setting.emailEnabled) emailEnabled.value = false
      if (!setting.smsEnabled) smsEnabled.value = false
      if (!setting.pushEnabled) pushEnabled.value = false
      if (!setting.inAppEnabled) inAppEnabled.value = false
    })
  }

  /**
   * Get settings for specific notification type
   */
  function getSettingsForType(notificationType) {
    return settings.value.find(s => s.notificationType === notificationType)
  }

  /**
   * Check if notification type is enabled
   */
  function isNotificationTypeEnabled(notificationType) {
    const setting = getSettingsForType(notificationType)
    return setting ? setting.enabled : true
  }

  /**
   * Check if channel is enabled for notification type with customer context
   */
  function isChannelEnabledForType(notificationType, channel) {
    const setting = getSettingsForType(notificationType)
    if (!setting) return true

    // Check customer-level channel availability first
    const channelConfig = channelConfigs.value[channel.toLowerCase()]
    if (!channelConfig || !channelConfig.enabled) {
      return false
    }

    switch (channel.toLowerCase()) {
      case 'email':
        return setting.emailEnabled
      case 'sms':
        return setting.smsEnabled
      case 'push':
        return setting.pushEnabled
      case 'inapp':
        return setting.inAppEnabled
      default:
        return true
    }
  }

  /**
   * Get channel configuration for customer
   */
  function getChannelConfig(channelType) {
    return channelConfigs.value[channelType.toLowerCase()] || {}
  }

  /**
   * Check if Firebase push is properly configured
   */
  function isFirebasePushConfigured() {
    const pushConfig = channelConfigs.value.push
    const deviceTokenStore = useDeviceTokenStore()

    return pushConfig?.enabled &&
           deviceTokenStore.firebaseReady &&
           deviceTokenStore.isRegistered
  }

  /**
   * Get notification statistics with customer context
   */
  function getNotificationSettingsStats() {
    return {
      totalSettings: settings.value.length,
      enabledChannels: enabledChannels.value.length,
      disabledChannels: disabledChannels.value.length,
      customerName: customerName.value,
      customerEnvironment: customerContext.value?.environment,
      capabilities: notificationCapabilities.value,
      firebaseReady: isFirebasePushConfigured(),
      settingsLoaded: customerSettingsLoaded.value
    }
  }

  /**
   * Update customer context
   */
  function updateCustomerContext(newCustomerContext) {
    customerContext.value = newCustomerContext

    // Update all existing settings with new customer context
    settings.value.forEach(setting => {
      setting.customerContext = newCustomerContext
    })

    if (currentSettings.value) {
      currentSettings.value.customerContext = newCustomerContext
    }

    // Reload channel configurations for new customer
    loadChannelConfigurations()
  }

  /**
   * Bulk update notification settings
   */
  async function bulkUpdateSettings(updates) {
    try {
      updating.value = true
      const results = []

      for (const update of updates) {
        try {
          const result = await updateSettings(update.settingsId, update.data)
          results.push({ success: !!result, settingsId: update.settingsId, data: result })
        } catch (err) {
          results.push({ success: false, settingsId: update.settingsId, error: err.message })
        }
      }

      const successCount = results.filter(r => r.success).length
      const failureCount = results.length - successCount

      if (successCount > 0) {
        Notify.create({
          type: successCount === results.length ? 'positive' : 'warning',
          message: `Updated ${successCount} settings${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
          position: 'top'
        })
      } else {
        Notify.create({
          type: 'negative',
          message: 'Failed to update notification settings',
          position: 'top'
        })
      }

      return results
    } catch (err) {
      console.error('Error bulk updating settings:', err)
      Notify.create({
        type: 'negative',
        message: 'Failed to update notification settings',
        position: 'top'
      })
      return []
    } finally {
      updating.value = false
    }
  }

  /**
   * Reset store state
   */
  function resetState() {
    settings.value = []
    currentSettings.value = null
    notificationTypes.value = []
    loading.value = false
    updating.value = false
    toggling.value = false
    error.value = null
    emailEnabled.value = true
    smsEnabled.value = true
    pushEnabled.value = true
    inAppEnabled.value = true
    customerContext.value = null
    customerSettingsLoaded.value = false
    channelConfigs.value = {}
    availableChannels.value = []
  }

  return {
    // State
    settings,
    currentSettings,
    notificationTypes,
    loading,
    updating,
    toggling,
    error,
    emailEnabled,
    smsEnabled,
    pushEnabled,
    inAppEnabled,
    customerContext,
    customerSettingsLoaded,
    channelConfigs,
    availableChannels,

    // Getters
    hasSettings,
    settingsByType,
    enabledChannels,
    disabledChannels,
    customerName,
    settingsWithCustomerContext,
    isFirebaseEnabled,
    notificationCapabilities,

    // Actions
    initialize,
    loadChannelConfigurations,
    loadMySettings,
    loadNotificationTypes,
    getOrCreateSettings,
    updateSettings,
    toggleEmailNotifications,
    toggleSmsNotifications,
    togglePushNotifications,
    createDefaultSettings,
    updateQuickAccessFlags,
    getSettingsForType,
    isNotificationTypeEnabled,
    isChannelEnabledForType,
    getChannelConfig,
    isFirebasePushConfigured,
    getNotificationSettingsStats,
    updateCustomerContext,
    bulkUpdateSettings,
    resetState
  }
})
