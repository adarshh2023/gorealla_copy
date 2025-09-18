// src/stores/notification.js (Updated with Customer Context & Firebase)
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import notificationQueueService from 'src/services/api/notificationQueue.service'
import firebaseService from 'src/services/api/firebase.service'
import { useAuthStore } from 'stores/auth'
import { useDeviceTokenStore } from 'stores/deviceToken'
import FirebaseNotificationUtils from 'src/utils/firebase-notifications'
import { Notify } from 'quasar'

export const useNotificationStore = defineStore('notification', () => {
  // ===== STATE =====

  // Notifications data
  const notifications = ref([])
  const unreadNotifications = ref([])
  const recentNotifications = ref([])
  const currentNotification = ref(null)

  // Pagination
  const currentPage = ref(0)
  const pageSize = ref(20)
  const totalPages = ref(0)
  const totalElements = ref(0)
  const hasNext = ref(false)
  const hasPrevious = ref(false)

  // Counts
  const unreadCount = ref(0)
  const totalCount = ref(0)

  // Loading states
  const loading = ref(false)
  const loadingUnread = ref(false)
  const loadingCount = ref(false)
  const refreshing = ref(false)

  // Error states
  const error = ref(null)
  const lastError = ref(null)

  // Filters
  const sortBy = ref('insertDate')
  const sortDirection = ref('desc')

  // Auto-refresh settings
  const autoRefreshInterval = ref(null)
  const autoRefreshEnabled = ref(false)
  const refreshIntervalMs = ref(30000) // 30 seconds

  // Customer context integration
  const customerContext = ref(null)
  const notificationSummary = ref(null)

  // Firebase integration
  const firebaseListenerActive = ref(false)
  const realTimeEnabled = ref(false)

  // ===== GETTERS =====

  const hasNotifications = computed(() => notifications.value.length > 0)
  const hasUnreadNotifications = computed(() => unreadCount.value > 0)
  const isFirstPage = computed(() => currentPage.value === 0)
  const isLastPage = computed(() => !hasNext.value)
  const isEmpty = computed(() => !loading.value && !hasNotifications.value)

  const notificationById = computed(() => (id) => {
    return notifications.value.find(n => n.recCode === id)
  })

  const readNotifications = computed(() => {
    return notifications.value.filter(n => n.isRead)
  })

  const todayNotifications = computed(() => {
    const today = new Date().toDateString()
    return notifications.value.filter(n => {
      const notifDate = new Date(n.insertDate).toDateString()
      return notifDate === today
    })
  })

  const thisWeekNotifications = computed(() => {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    return notifications.value.filter(n => {
      const notifDate = new Date(n.insertDate)
      return notifDate >= oneWeekAgo
    })
  })

  const notificationsByPriority = computed(() => {
    const grouped = {
      Urgent: [],
      High: [],
      Normal: [],
      Low: []
    }

    notifications.value.forEach(notification => {
      const priority = notification.priority || 'Normal'
      if (grouped[priority]) {
        grouped[priority].push(notification)
      } else {
        grouped.Normal.push(notification)
      }
    })

    return grouped
  })

  const customerName = computed(() => {
    return customerContext.value?.name || 'Unknown Customer'
  })

  // ===== ACTIONS =====

  /**
   * Initialize notification store with Firebase integration
   */
  async function initialize() {
    try {
      console.log('Initializing notification store...')

      const authStore = useAuthStore()

      // Wait for authentication
      if (!authStore.isAuthenticated) {
        console.log('User not authenticated, skipping notification initialization')
        return
      }

      // Set customer context from auth store
      if (authStore.hasCustomerContext) {
        customerContext.value = authStore.currentCustomer
      }

      // Initialize Firebase listeners
      await initializeFirebaseListeners()

      // Load initial notification data
      await Promise.all([
        loadNotifications(),
        loadUnreadCount(),
        loadRecentNotifications(),
        loadNotificationSummary()
      ])

      // Start auto-refresh
      startAutoRefresh()

      console.log('Notification store initialized successfully')
    } catch (err) {
      console.error('Error initializing notification store:', err)
      error.value = err.message
    }
  }

  /**
   * Initialize Firebase real-time listeners
   */
  async function initializeFirebaseListeners() {
    try {
      if (!firebaseService.isReady()) {
        console.log('Firebase service not ready, skipping real-time listeners')
        return
      }

      console.log('Setting up Firebase notification listeners...')

      // Listen for foreground notifications
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        // Set up message listener for foreground notifications
        const messaging = firebaseService.getMessaging?.()
        if (messaging && messaging.onMessage) {
          messaging.onMessage((payload) => {
            console.log('Foreground notification received:', payload)
            handleFirebaseNotification(payload)
          })
        }
      }

      firebaseListenerActive.value = true
      realTimeEnabled.value = true

      console.log('Firebase notification listeners initialized')
    } catch (err) {
      console.error('Error initializing Firebase listeners:', err)
      firebaseListenerActive.value = false
      realTimeEnabled.value = false
    }
  }

  /**
   * Handle incoming Firebase notifications
   */
  function handleFirebaseNotification(payload) {
    try {
      console.log('Handling Firebase notification in store:', payload)

      // Validate notification payload
      const validation = FirebaseNotificationUtils.validateNotificationPayload(payload)
      if (!validation.valid) {
        console.warn('Invalid notification payload:', validation.error)
        return
      }

      // Show notification using Quasar with customer context
      const customerSettings = FirebaseNotificationUtils.getCustomerNotificationSettings(customerContext.value)

      if (customerSettings.showInApp) {
        FirebaseNotificationUtils.showQuasarNotification(
          payload,
          customerContext.value,
          [
            {
              label: 'View',
              color: 'white',
              handler: () => {
                handleNotificationAction(payload.data)
              }
            },
            {
              label: 'Mark Read',
              color: 'white',
              handler: () => {
                if (payload.data?.notificationId) {
                  markAsRead(payload.data.notificationId)
                }
              }
            }
          ]
        )
      }

      // Add to notification list if it's not already there
      if (payload.data?.notificationId) {
        addNotificationFromPayload(payload)
      }

      // Refresh unread count
      loadUnreadCount()

    } catch (err) {
      console.error('Error handling Firebase notification:', err)
    }
  }

  /**
   * Add notification from Firebase payload
   */
  function addNotificationFromPayload(payload) {
    try {
      const notificationData = {
        recCode: payload.data?.notificationId || Date.now().toString(),
        notificationTitle: payload.notification?.title || 'New Notification',
        notificationContent: payload.notification?.body || '',
        priority: payload.data?.priority || 'Normal',
        isRead: false,
        insertDate: new Date().toISOString(),
        sourceType: payload.data?.sourceType || 'Unknown',
        sourceId: payload.data?.sourceId || '',
        customerContext: customerContext.value,
        data: payload.data || {}
      }

      // Check if notification already exists
      const existingIndex = notifications.value.findIndex(
        n => n.recCode === notificationData.recCode
      )

      if (existingIndex === -1) {
        addNotification(notificationData)
      }
    } catch (err) {
      console.error('Error adding notification from payload:', err)
    }
  }

  /**
   * Handle notification action (click/tap)
   */
  function handleNotificationAction(data) {
    try {
      console.log('Handling notification action:', data)

      // Use Firebase notification utils for consistent routing
      FirebaseNotificationUtils.handleNotificationClick(
        { data },
        customerContext.value,
        // Note: Router instance would need to be passed or accessed here
        // For now, using direct navigation
      )

      // Mark as clicked if notification ID is available
      if (data?.notificationId) {
        markAsClicked(data.notificationId)
      }
    } catch (err) {
      console.error('Error handling notification action:', err)
    }
  }

  /**
   * Load notifications with channel filtering (defaults to InApp)
   */
  async function loadNotifications(params = {}) {
    try {
      loading.value = true
      error.value = null

      const requestParams = {
        page: params.page ?? currentPage.value,
        size: params.size ?? pageSize.value,
        sortBy: params.sortBy ?? sortBy.value,
        sortDir: params.sortDir ?? sortDirection.value,
        channels: params.channels ?? 'InApp' // DEFAULT TO InApp FOR WEB INTERFACE
      }

      const response = await notificationQueueService.getMyNotifications(requestParams)

      if (response.success) {
        notifications.value = response.data || []
        currentPage.value = response.currentPage ?? 0
        totalPages.value = response.totalPages ?? 0
        totalElements.value = response.totalElements ?? 0
        hasNext.value = response.hasNext ?? false
        hasPrevious.value = response.hasPrevious ?? false
        pageSize.value = response.size ?? pageSize.value

        // Add customer context to each notification
        notifications.value.forEach(notification => {
          notification.customerContext = customerContext.value
        })
      } else {
        throw new Error(response.message || 'Failed to load notifications')
      }
    } catch (err) {
      console.error('Error loading notifications:', err)
      error.value = err.message || 'Failed to load notifications'
      lastError.value = err

      Notify.create({
        type: 'negative',
        message: 'Failed to load notifications',
        position: 'top'
      })
    } finally {
      loading.value = false
    }
  }

  /**
   * Load more notifications (pagination) with channel filtering
   */
  async function loadMore() {
    if (loading.value || !hasNext.value) return

    try {
      const nextPage = currentPage.value + 1
      const response = await notificationQueueService.getMyNotifications({
        page: nextPage,
        size: pageSize.value,
        sortBy: sortBy.value,
        sortDir: sortDirection.value,
        channels: 'InApp' // WEB INTERFACE ONLY SHOWS InApp
      })

      if (response.success && response.data) {
        // Append new notifications to existing ones
        const newNotifications = response.data.map(notification => ({
          ...notification,
          customerContext: customerContext.value
        }))

        notifications.value.push(...newNotifications)
        currentPage.value = response.currentPage
        hasNext.value = response.hasNext ?? false
        hasPrevious.value = response.hasPrevious ?? false
      }
    } catch (err) {
      console.error('Error loading more notifications:', err)
      Notify.create({
        type: 'negative',
        message: 'Failed to load more notifications',
        position: 'top'
      })
    }
  }

  /**
   * Refresh notifications with InApp channel filtering
   */
  async function refreshNotifications() {
    try {
      refreshing.value = true
      await loadNotifications({ page: 0, channels: 'InApp' })
      await loadUnreadCount()

      Notify.create({
        type: 'positive',
        message: 'Notifications refreshed',
        position: 'top',
        timeout: 2000
      })
    } catch (err) {
      console.error('Error refreshing notifications:', err)
    } finally {
      refreshing.value = false
    }
  }

  /**
   * Load unread notifications with InApp channel filtering
   */
  async function loadUnreadNotifications() {
    try {
      loadingUnread.value = true
      const response = await notificationQueueService.getMyUnreadNotifications('InApp')

      if (response.success) {
        unreadNotifications.value = (response.data || []).map(notification => ({
          ...notification,
          customerContext: customerContext.value
        }))
      }
    } catch (err) {
      console.error('Error loading unread notifications:', err)
    } finally {
      loadingUnread.value = false
    }
  }

  /**
   * Load unread count with InApp channel filtering
   */
  async function loadUnreadCount() {
    try {
      loadingCount.value = true
      const response = await notificationQueueService.getMyUnreadCount('InApp')

      if (response.success) {
        unreadCount.value = response.unreadCount || 0
      }
    } catch (err) {
      console.error('Error loading unread count:', err)
      unreadCount.value = 0
    } finally {
      loadingCount.value = false
    }
  }

  /**
   * Load recent notifications with InApp channel filtering
   */
  async function loadRecentNotifications(limit = 5) {
    try {
      const response = await notificationQueueService.getMyRecentNotifications(limit, 'InApp')

      if (response.success) {
        recentNotifications.value = (response.data || []).map(notification => ({
          ...notification,
          customerContext: customerContext.value
        }))
      }
    } catch (err) {
      console.error('Error loading recent notifications:', err)
    }
  }

  /**
   * Load notification by ID
   */
  async function loadNotificationById(notificationId) {
    try {
      const response = await notificationQueueService.getMyNotificationById(notificationId)

      if (response.success) {
        const notification = {
          ...response.data,
          customerContext: customerContext.value
        }

        currentNotification.value = notification

        // Update in notifications list if it exists
        const index = notifications.value.findIndex(n => n.recCode === notificationId)
        if (index !== -1) {
          notifications.value[index] = notification
        }

        return notification
      }
      return null
    } catch (err) {
      console.error('Error loading notification by ID:', err)
      return null
    }
  }

  /**
   * Mark notification as read (affects all related notifications across channels)
   */
  async function markAsRead(notificationId) {
    try {
      // Pass null for channels to mark all related notifications across ALL channels
      const response = await notificationQueueService.markAsRead(notificationId, null)

      if (response.success) {
        // Update notification in state
        const notification = notifications.value.find(n => n.recCode === notificationId)
        if (notification && !notification.isRead) {
          notification.isRead = true
          notification.readTime = new Date().toISOString()

          // Decrease unread count
          if (unreadCount.value > 0) {
            unreadCount.value--
          }

          // Remove from unread notifications
          const unreadIndex = unreadNotifications.value.findIndex(n => n.recCode === notificationId)
          if (unreadIndex !== -1) {
            unreadNotifications.value.splice(unreadIndex, 1)
          }
        }

        // Update current notification if it matches
        if (currentNotification.value?.recCode === notificationId) {
          currentNotification.value.isRead = true
          currentNotification.value.readTime = new Date().toISOString()
        }

        return true
      }
      return false
    } catch (err) {
      console.error('Error marking notification as read:', err)
      Notify.create({
        type: 'negative',
        message: 'Failed to mark notification as read',
        position: 'top'
      })
      return false
    }
  }

  /**
   * Mark all notifications as read (InApp channel only for web interface)
   */
  async function markAllAsRead() {
    try {
      // Mark only InApp notifications as read for web interface
      const response = await notificationQueueService.markAllAsRead('InApp')

      if (response.success) {
        // Update all notifications in state
        notifications.value.forEach(notification => {
          if (!notification.isRead) {
            notification.isRead = true
            notification.readTime = new Date().toISOString()
          }
        })

        // Clear unread notifications and reset count
        unreadNotifications.value = []
        unreadCount.value = 0

        Notify.create({
          type: 'positive',
          message: `Marked ${response.markedCount || 0} notifications as read`,
          position: 'top'
        })

        return true
      }
      return false
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
      Notify.create({
        type: 'negative',
        message: 'Failed to mark all notifications as read',
        position: 'top'
      })
      return false
    }
  }

  /**
   * Mark notification as clicked (affects all related notifications across channels)
   */
  async function markAsClicked(notificationId) {
    try {
      const response = await notificationQueueService.markAsClicked(notificationId)

      if (response.success) {
        // Update notification in state
        const notification = notifications.value.find(n => n.recCode === notificationId)
        if (notification) {
          notification.clickedTime = new Date().toISOString()
          // Also mark as read if not already read
          if (!notification.isRead) {
            notification.isRead = true
            notification.readTime = new Date().toISOString()
            if (unreadCount.value > 0) {
              unreadCount.value--
            }
          }
        }

        // Update current notification if it matches
        if (currentNotification.value?.recCode === notificationId) {
          currentNotification.value.clickedTime = new Date().toISOString()
          if (!currentNotification.value.isRead) {
            currentNotification.value.isRead = true
            currentNotification.value.readTime = new Date().toISOString()
          }
        }

        return true
      }
      return false
    } catch (err) {
      console.error('Error marking notification as clicked:', err)
      return false
    }
  }

  /**
   * Delete notification
   */
  async function deleteNotification(notificationId) {
    try {
      const response = await notificationQueueService.deleteNotification(notificationId)

      if (response.success) {
        // Remove from notifications array
        const index = notifications.value.findIndex(n => n.recCode === notificationId)
        if (index !== -1) {
          const deletedNotification = notifications.value[index]
          notifications.value.splice(index, 1)

          // Decrease unread count if notification was unread
          if (!deletedNotification.isRead && unreadCount.value > 0) {
            unreadCount.value--
          }

          // Update total count
          if (totalElements.value > 0) {
            totalElements.value--
          }
        }

        // Remove from unread notifications
        const unreadIndex = unreadNotifications.value.findIndex(n => n.recCode === notificationId)
        if (unreadIndex !== -1) {
          unreadNotifications.value.splice(unreadIndex, 1)
        }

        // Clear current notification if it matches
        if (currentNotification.value?.recCode === notificationId) {
          currentNotification.value = null
        }

        Notify.create({
          type: 'positive',
          message: 'Notification deleted',
          position: 'top'
        })

        return true
      }
      return false
    } catch (err) {
      console.error('Error deleting notification:', err)
      Notify.create({
        type: 'negative',
        message: 'Failed to delete notification',
        position: 'top'
      })
      return false
    }
  }

  /**
   * Load notification summary with InApp channel filtering
   */
  async function loadNotificationSummary() {
    try {
      const response = await notificationQueueService.getMyNotificationSummary('InApp')

      if (response.success && response.data) {
        notificationSummary.value = {
          ...response.data,
          customerContext: customerContext.value
        }

        totalCount.value = response.data.total || 0
        unreadCount.value = response.data.unread || 0

        if (response.data.recent) {
          recentNotifications.value = response.data.recent.map(notification => ({
            ...notification,
            customerContext: customerContext.value
          }))
        }
      }
    } catch (err) {
      console.error('Error loading notification summary:', err)
    }
  }

  /**
   * Get notification statistics with channel context
   */
  function getNotificationStats() {
    return {
      total: totalElements.value,
      unread: unreadCount.value,
      read: totalElements.value - unreadCount.value,
      today: todayNotifications.value.length,
      thisWeek: thisWeekNotifications.value.length,
      byPriority: {
        urgent: notificationsByPriority.value.Urgent.length,
        high: notificationsByPriority.value.High.length,
        normal: notificationsByPriority.value.Normal.length,
        low: notificationsByPriority.value.Low.length
      },
      customer: customerName.value,
      realTimeEnabled: realTimeEnabled.value,
      channelFilter: 'InApp' // Indicate we're filtering to InApp only
    }
  }

  /**
   * Check if notification is InApp channel
   */
  function isInAppNotification(notification) {
    return notification.notificationChannel === 'InApp'
  }

  /**
   * Filter notifications by channel (utility method)
   */
  function filterNotificationsByChannel(notifications, channel) {
    return notifications.filter(n => n.notificationChannel === channel)
  }

  /**
   * Get channel display name
   */
  function getChannelDisplayName(channel) {
    const channelNames = {
      'InApp': 'In-App',
      'Push': 'Push Notification',
      'Email': 'Email',
      'SMS': 'SMS'
    }
    return channelNames[channel] || channel
  }

  /**
   * Update sort with channel awareness
   */
  function updateSort(newSortBy, newSortDirection = 'desc') {
    sortBy.value = newSortBy
    sortDirection.value = newSortDirection
    loadNotifications({ page: 0, channels: 'InApp' }) // Always filter to InApp for web
  }

  /**
   * Go to specific page
   */
  function goToPage(page) {
    if (page >= 0 && page < totalPages.value) {
      loadNotifications({ page })
    }
  }

  /**
   * Go to next page
   */
  function nextPage() {
    if (hasNext.value) {
      goToPage(currentPage.value + 1)
    }
  }

  /**
   * Go to previous page
   */
  function previousPage() {
    if (hasPrevious.value) {
      goToPage(currentPage.value - 1)
    }
  }

  /**
   * Enhanced auto-refresh with channel filtering
   */
  function startAutoRefresh() {
    if (autoRefreshInterval.value) {
      clearInterval(autoRefreshInterval.value)
    }

    autoRefreshEnabled.value = true
    autoRefreshInterval.value = setInterval(async () => {
      try {
        await loadUnreadCount() // This now uses InApp filtering
        // Only refresh notifications if user is on first page
        if (currentPage.value === 0) {
          await loadRecentNotifications() // This now uses InApp filtering
        }

        // Ping device token if registered
        const deviceTokenStore = useDeviceTokenStore()
        if (deviceTokenStore.isFirebaseAndDeviceReady) {
          await deviceTokenStore.pingDeviceToken(deviceTokenStore.currentDeviceToken?.recCode)
        }
      } catch (err) {
        console.error('Error in auto-refresh:', err)
      }
    }, refreshIntervalMs.value)
  }

  /**
   * Load notifications from all channels (for debugging/admin)
   */
  async function loadAllChannelNotifications(params = {}) {
    try {
      loading.value = true
      error.value = null

      const requestParams = {
        page: params.page ?? 0,
        size: params.size ?? pageSize.value,
        sortBy: params.sortBy ?? 'insertDate',
        sortDir: params.sortDir ?? 'desc'
        // No channels parameter = all channels
      }

      const response = await notificationQueueService.getMyNotifications(requestParams)

      if (response.success) {
        console.log('All channel notifications:', response.data)
        return response.data || []
      }
      return []
    } catch (err) {
      console.error('Error loading all channel notifications:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Get channel statistics for current user
   */
  async function getChannelStatistics() {
    try {
      const allNotifications = await loadAllChannelNotifications({ size: 1000 })

      const channelStats = {}
      allNotifications.forEach(notification => {
        const channel = notification.notificationChannel
        if (!channelStats[channel]) {
          channelStats[channel] = { total: 0, unread: 0 }
        }
        channelStats[channel].total++
        if (!notification.isRead) {
          channelStats[channel].unread++
        }
      })

      console.log('Channel statistics:', channelStats)
      return channelStats
    } catch (err) {
      console.error('Error getting channel statistics:', err)
      return {}
    }
  }

  /**
   * Stop auto-refresh
   */
  function stopAutoRefresh() {
    if (autoRefreshInterval.value) {
      clearInterval(autoRefreshInterval.value)
      autoRefreshInterval.value = null
    }
    autoRefreshEnabled.value = false
  }

  /**
   * Add new notification to state (for real-time updates)
   */
  function addNotification(notification) {
    // Ensure customer context is added
    const notificationWithContext = {
      ...notification,
      customerContext: customerContext.value
    }

    // Add to beginning of notifications array
    notifications.value.unshift(notificationWithContext)

    // Add to unread if not read
    if (!notification.isRead) {
      unreadNotifications.value.unshift(notificationWithContext)
      unreadCount.value++
    }

    // Update totals
    totalElements.value++

    // Limit array size to prevent memory issues
    if (notifications.value.length > pageSize.value * 5) {
      notifications.value = notifications.value.slice(0, pageSize.value * 3)
    }
  }

  /**
   * Update notification in state
   */
  function updateNotification(updatedNotification) {
    const notificationWithContext = {
      ...updatedNotification,
      customerContext: customerContext.value
    }

    const index = notifications.value.findIndex(n => n.recCode === updatedNotification.recCode)
    if (index !== -1) {
      notifications.value[index] = { ...notifications.value[index], ...notificationWithContext }
    }

    if (currentNotification.value?.recCode === updatedNotification.recCode) {
      currentNotification.value = { ...currentNotification.value, ...notificationWithContext }
    }
  }

  /**
   * Update customer context
   */
  function updateCustomerContext(newCustomerContext) {
    customerContext.value = newCustomerContext

    // Update all existing notifications with new customer context
    notifications.value.forEach(notification => {
      notification.customerContext = newCustomerContext
    })

    unreadNotifications.value.forEach(notification => {
      notification.customerContext = newCustomerContext
    })

    recentNotifications.value.forEach(notification => {
      notification.customerContext = newCustomerContext
    })

    if (currentNotification.value) {
      currentNotification.value.customerContext = newCustomerContext
    }
  }

  /**
   * Set up real-time notification handling
   */
  function setupRealTimeHandling(router) {
    // Store router reference for navigation
    notificationRouter = router

    // Initialize Firebase listeners if not already done
    if (!firebaseListenerActive.value) {
      initializeFirebaseListeners()
    }
  }

  /**
   * Reset store state
   */
  function resetState() {
    notifications.value = []
    unreadNotifications.value = []
    recentNotifications.value = []
    currentNotification.value = null
    currentPage.value = 0
    totalPages.value = 0
    totalElements.value = 0
    hasNext.value = false
    hasPrevious.value = false
    unreadCount.value = 0
    totalCount.value = 0
    loading.value = false
    loadingUnread.value = false
    loadingCount.value = false
    refreshing.value = false
    error.value = null
    lastError.value = null
    customerContext.value = null
    notificationSummary.value = null
    firebaseListenerActive.value = false
    realTimeEnabled.value = false
    stopAutoRefresh()
  }

  // Store router reference for notifications
  // eslint-disable-next-line no-unused-vars
  let notificationRouter = null

  return {
    // State
    notifications,
    unreadNotifications,
    recentNotifications,
    currentNotification,
    currentPage,
    pageSize,
    totalPages,
    totalElements,
    hasNext,
    hasPrevious,
    unreadCount,
    totalCount,
    loading,
    loadingUnread,
    loadingCount,
    refreshing,
    error,
    lastError,
    sortBy,
    sortDirection,
    autoRefreshEnabled,
    refreshIntervalMs,
    customerContext,
    notificationSummary,
    firebaseListenerActive,
    realTimeEnabled,

    // Getters
    hasNotifications,
    hasUnreadNotifications,
    isFirstPage,
    isLastPage,
    isEmpty,
    notificationById,
    readNotifications,
    todayNotifications,
    thisWeekNotifications,
    notificationsByPriority,
    customerName,

    // Actions
    initialize,
    initializeFirebaseListeners,
    handleFirebaseNotification,
    handleNotificationAction,
    loadNotifications,
    loadMore,
    refreshNotifications,
    loadUnreadNotifications,
    loadUnreadCount,
    loadRecentNotifications,
    loadNotificationById,
    markAsRead,
    markAllAsRead,
    markAsClicked,
    deleteNotification,
    loadNotificationSummary,
    updateSort,
    goToPage,
    nextPage,
    previousPage,
    startAutoRefresh,
    stopAutoRefresh,
    addNotification,
    updateNotification,
    updateCustomerContext,
    setupRealTimeHandling,
    getNotificationStats,
    isInAppNotification,
    filterNotificationsByChannel,
    getChannelDisplayName,
    getChannelStatistics,
    resetState
  }
})
