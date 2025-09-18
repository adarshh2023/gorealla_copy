// src/stores/notification-quasar.js
import { defineStore } from 'pinia'
import { api } from 'boot/axios'
import {
  showSuccess,
  showError,
  showInfo,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_PRIORITIES
} from 'src/utils/notification'
import { useAuthStore } from './auth'

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    // Notifications list
    notifications: [],
    totalNotifications: 0,
    unreadCount: 0,

    // Loading states
    isLoading: false,
    isLoadingMore: false,

    // Pagination
    currentPage: 0,
    pageSize: 20,
    hasMore: true,

    // Filters
    filters: {
      unreadOnly: false,
      category: null,
      priority: null,
      dateRange: null
    },

    // Notification preferences
    preferences: {
      enabled: true,
      channels: {
        [NOTIFICATION_CHANNELS.IN_APP]: true,
        [NOTIFICATION_CHANNELS.EMAIL]: true,
        [NOTIFICATION_CHANNELS.SMS]: false,
        [NOTIFICATION_CHANNELS.PUSH]: true,
        [NOTIFICATION_CHANNELS.WEBSOCKET]: true
      },
      categories: {
        task_updates: true,
        project_updates: true,
        chat_messages: true,
        system_alerts: true,
        reminders: true,
        mentions: true,
        assignments: true,
        deadlines: true
      },
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
        timezone: 'Asia/Kolkata'
      },
      priorities: {
        [NOTIFICATION_PRIORITIES.LOW]: true,
        [NOTIFICATION_PRIORITIES.NORMAL]: true,
        [NOTIFICATION_PRIORITIES.HIGH]: true,
        [NOTIFICATION_PRIORITIES.URGENT]: true
      }
    },

    // Real-time updates
    realtimeEnabled: true,
    lastFetchTime: null,

    // Notification groups
    groupedNotifications: new Map(),

    // Action handlers
    actionHandlers: new Map(),

    // Sound settings
    soundEnabled: true,
    soundVolume: 0.5,
    sounds: {
      default: '/sounds/notification.mp3',
      message: '/sounds/message.mp3',
      alert: '/sounds/alert.mp3',
      success: '/sounds/success.mp3'
    },

    // Badge
    showBadge: true,
    badgeCount: 0,

    // Recent notifications (for quick access)
    recentNotifications: [],
    maxRecentNotifications: 5,

    // Notification templates
    templates: new Map(),

    // Do not disturb
    doNotDisturb: false,
    doNotDisturbUntil: null
  }),

  getters: {
    /**
     * Get filtered notifications
     */
    filteredNotifications: (state) => {
      let filtered = [...state.notifications]

      // Apply unread filter
      if (state.filters.unreadOnly) {
        filtered = filtered.filter(n => !n.isRead)
      }

      // Apply category filter
      if (state.filters.category) {
        filtered = filtered.filter(n => n.category === state.filters.category)
      }

      // Apply priority filter
      if (state.filters.priority) {
        filtered = filtered.filter(n => n.priority === state.filters.priority)
      }

      return filtered
    },

    /**
     * Get notifications by category
     */
    notificationsByCategory: (state) => {
      const groups = {}

      state.notifications.forEach(notification => {
        const category = notification.category || 'Other'
        if (!groups[category]) {
          groups[category] = []
        }
        groups[category].push(notification)
      })

      return groups
    },

    /**
     * Get unread notifications
     */
    unreadNotifications: (state) => {
      return state.notifications.filter(n => !n.isRead)
    },

    /**
     * Get high priority notifications
     */
    highPriorityNotifications: (state) => {
      return state.notifications.filter(n =>
        n.priority === NOTIFICATION_PRIORITIES.HIGH ||
        n.priority === NOTIFICATION_PRIORITIES.URGENT
      )
    },

    /**
     * Check if category is enabled
     */
    isCategoryEnabled: (state) => (category) => {
      return state.preferences.categories[category] !== false
    },

    /**
     * Check if channel is enabled
     */
    isChannelEnabled: (state) => (channel) => {
      return state.preferences.channels[channel] === true
    },

    /**
     * Check if in quiet hours
     */
    isInQuietHours: (state) => {
      if (!state.preferences.quietHours.enabled) return false

      const now = new Date()
      const currentTime = now.getHours() * 60 + now.getMinutes()

      const [startHour, startMinute] = state.preferences.quietHours.start.split(':').map(Number)
      const [endHour, endMinute] = state.preferences.quietHours.end.split(':').map(Number)

      const startTime = startHour * 60 + startMinute
      const endTime = endHour * 60 + endMinute

      if (startTime < endTime) {
        return currentTime >= startTime && currentTime < endTime
      } else {
        // Spans midnight
        return currentTime >= startTime || currentTime < endTime
      }
    },

    /**
     * Check if should show notification
     */
    shouldShowNotification: (state) => (notification) => {
      // Check if notifications are enabled
      if (!state.preferences.enabled) return false

      // Check do not disturb
      if (state.doNotDisturb) {
        if (!state.doNotDisturbUntil || new Date() < new Date(state.doNotDisturbUntil)) {
          return false
        } else {
          // DND expired
          state.doNotDisturb = false
          state.doNotDisturbUntil = null
        }
      }

      // Check quiet hours (except for urgent)
      if (state.isInQuietHours && notification.priority !== NOTIFICATION_PRIORITIES.URGENT) {
        return false
      }

      // Check category
      if (!state.isCategoryEnabled(notification.category)) return false

      // Check priority
      if (!state.preferences.priorities[notification.priority]) return false

      return true
    }
  },

  actions: {
    /**
     * Initialize notification store
     */
    async initialize() {
      // Load preferences
      this.loadPreferences()

      // Register action handlers
      this.registerDefaultHandlers()

      // Fetch initial notifications
      if (useAuthStore().isAuthenticated) {
        await this.fetchNotifications()
        await this.fetchUnreadCount()
      }

      // Setup WebSocket listeners
      this.setupWebSocketListeners()

      // Setup badge update
      this.setupBadgeUpdate()
    },

    /**
     * Fetch notifications
     */
    async fetchNotifications(options = {}) {
      const { append = false } = options

      if (append) {
        this.isLoadingMore = true
      } else {
        this.isLoading = true
        this.currentPage = 0
      }

      try {
        const response = await api.get('/notifications', {
          params: {
            page: this.currentPage,
            size: this.pageSize,
            unreadOnly: this.filters.unreadOnly,
            category: this.filters.category,
            priority: this.filters.priority
          }
        })

        if (response.success) {
          if (append) {
            this.notifications.push(...response.data.content)
          } else {
            this.notifications = response.data.content
          }

          this.totalNotifications = response.data.totalElements
          this.hasMore = !response.data.last
          this.lastFetchTime = new Date()

          // Update recent notifications
          this.updateRecentNotifications()
        }

        return response
      } catch (error) {
        showError('Failed to fetch notifications')
        throw error
      } finally {
        this.isLoading = false
        this.isLoadingMore = false
      }
    },

    /**
     * Fetch more notifications
     */
    async fetchMore() {
      if (!this.hasMore || this.isLoadingMore) return

      this.currentPage++
      return await this.fetchNotifications({ append: true })
    },

    /**
     * Fetch unread count
     */
    async fetchUnreadCount() {
      try {
        const response = await api.get('/notifications/unread-count')

        if (response.success) {
          this.unreadCount = response.data.count
          this.updateBadge(response.data.count)
        }
      } catch (error) {
        console.error('Failed to fetch unread count:', error)
      }
    },

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId) {
      try {
        await api.post(`/notifications/${notificationId}/read`)

        // Update local state
        const notification = this.notifications.find(n => n.recCode === notificationId)
        if (notification && !notification.isRead) {
          notification.isRead = true
          notification.readDate = new Date().toISOString()
          this.unreadCount = Math.max(0, this.unreadCount - 1)
          this.updateBadge(this.unreadCount)
        }

        return true
      } catch (error) {
        console.error('Failed to mark notification as read:', error)
        return false
      }
    },

    /**
     * Mark all as read
     */
    async markAllAsRead() {
      this.isLoading = true

      try {
        await api.post('/notifications/read-all')

        // Update local state
        this.notifications.forEach(notification => {
          if (!notification.isRead) {
            notification.isRead = true
            notification.readDate = new Date().toISOString()
          }
        })

        this.unreadCount = 0
        this.updateBadge(0)

        showSuccess('All notifications marked as read')
        return true
      } catch (error) {
        showError('Failed to mark all as read')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Delete notification
     */
    async deleteNotification(notificationId) {
      try {
        await api.delete(`/notifications/${notificationId}`)

        // Remove from local state
        const index = this.notifications.findIndex(n => n.recCode === notificationId)
        if (index !== -1) {
          const notification = this.notifications[index]
          if (!notification.isRead) {
            this.unreadCount = Math.max(0, this.unreadCount - 1)
            this.updateBadge(this.unreadCount)
          }

          this.notifications.splice(index, 1)
          this.totalNotifications--
        }

        return true
      } catch (error) {
        showError('Failed to delete notification')
        throw error
      }
    },

    /**
     * Clear all notifications
     */
    async clearAll() {
      this.isLoading = true

      try {
        await api.delete('/notifications/all')

        this.notifications = []
        this.totalNotifications = 0
        this.unreadCount = 0
        this.updateBadge(0)

        showSuccess('All notifications cleared')
        return true
      } catch (error) {
        showError('Failed to clear notifications')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Handle notification action
     */
    async handleNotificationAction(notificationId, action) {
      const notification = this.notifications.find(n => n.recCode === notificationId)
      if (!notification) return

      // Mark as read
      if (!notification.isRead) {
        await this.markAsRead(notificationId)
      }

      // Get action handler
      const handler = this.actionHandlers.get(action.type) || this.defaultActionHandler

      try {
        await handler(notification, action)
      } catch (error) {
        console.error('Notification action error:', error)
        showError('Failed to perform action')
      }
    },

    /**
     * Default action handler
     */
    async defaultActionHandler(notification, action) {
      switch (action.type) {
        case 'navigate':
          if (action.url) {
            window.location.href = action.url
          }
          break

        case 'open':
          if (action.target) {
            window.open(action.target, '_blank')
          }
          break

        case 'dismiss':
          // Already marked as read
          break

        default:
          console.warn('Unknown action type:', action.type)
      }
    },

    /**
     * Register action handler
     */
    registerActionHandler(actionType, handler) {
      this.actionHandlers.set(actionType, handler)
    },

    /**
     * Register default handlers
     */
    registerDefaultHandlers() {
      // Task action handler
      this.registerActionHandler('task', async (notification, action) => {
        if (action.taskId) {
          window.location.href = `/tasks/${action.taskId}`
        }
      })

      // Project action handler
      this.registerActionHandler('project', async (notification, action) => {
        if (action.projectId) {
          window.location.href = `/projects/${action.projectId}`
        }
      })

      // Chat action handler
      this.registerActionHandler('chat', async (notification, action) => {
        if (action.chatId) {
          window.location.href = `/chats/${action.chatId}`
        }
      })
    },

    /**
     * Update preferences
     */
    async updatePreferences(preferences) {
      this.preferences = { ...this.preferences, ...preferences }

      try {
        await api.put('/notifications/preferences', this.preferences)
        this.savePreferences()
        showSuccess('Notification preferences updated')
      } catch (error) {
        showError('Failed to update preferences')
        throw error
      }
    },

    /**
     * Toggle category
     */
    toggleCategory(category) {
      this.preferences.categories[category] = !this.preferences.categories[category]
      this.updatePreferences({ categories: this.preferences.categories })
    },

    /**
     * Toggle channel
     */
    toggleChannel(channel) {
      this.preferences.channels[channel] = !this.preferences.channels[channel]
      this.updatePreferences({ channels: this.preferences.channels })
    },

    /**
     * Set do not disturb
     */
    setDoNotDisturb(enabled, until = null) {
      this.doNotDisturb = enabled
      this.doNotDisturbUntil = until

      if (enabled) {
        showInfo(until
          ? `Do not disturb enabled until ${new Date(until).toLocaleString()}`
          : 'Do not disturb enabled'
        )
      } else {
        showInfo('Do not disturb disabled')
      }
    },

    /**
     * Play notification sound
     */
    playSound(type = 'default') {
      if (!this.soundEnabled || this.isInQuietHours || this.doNotDisturb) return

      try {
        const soundUrl = this.sounds[type] || this.sounds.default
        const audio = new Audio(soundUrl)
        audio.volume = this.soundVolume
        audio.play()
      } catch (error) {
        console.error('Error playing notification sound:', error)
      }
    },

    /**
     * Handle incoming notification (WebSocket)
     */
    handleIncomingNotification(notification) {
      // Check if should show
      if (!this.shouldShowNotification(notification)) return

      // Add to notifications
      this.notifications.unshift(notification)
      this.totalNotifications++
      this.unreadCount++

      // Update recent
      this.updateRecentNotifications()

      // Update badge
      this.updateBadge(this.unreadCount)

      // Play sound
      this.playSound(notification.soundType || 'default')

      // Show notification
      this.showNotification(notification)
    },

    /**
     * Show notification
     */
    showNotification(notification) {
      // Check channels
      const channels = []

      if (this.isChannelEnabled(NOTIFICATION_CHANNELS.IN_APP)) {
        channels.push(NOTIFICATION_CHANNELS.IN_APP)
      }

      if (this.isChannelEnabled(NOTIFICATION_CHANNELS.PUSH)) {
        channels.push(NOTIFICATION_CHANNELS.PUSH)
      }

      // Show notification
      if (channels.length > 0) {
        window.dispatchEvent(new CustomEvent('notification:show', {
          detail: {
            notification,
            channels
          }
        }))
      }
    },

    /**
     * Update recent notifications
     */
    updateRecentNotifications() {
      this.recentNotifications = this.notifications
        .slice(0, this.maxRecentNotifications)
        .map(n => ({
          recCode: n.recCode,
          title: n.title,
          message: n.message,
          category: n.category,
          isRead: n.isRead,
          insertDate: n.insertDate
        }))
    },

    /**
     * Update badge
     */
    updateBadge(count) {
      this.badgeCount = count

      if (this.showBadge) {
        // Update PWA badge
        if ('setAppBadge' in navigator) {
          if (count > 0) {
            navigator.setAppBadge(count)
          } else {
            navigator.clearAppBadge()
          }
        }

        // Update favicon badge
        this.updateFaviconBadge(count)
      }
    },

    /**
     * Update favicon badge
     */
    // eslint-disable-next-line no-unused-vars
    updateFaviconBadge(count) {
      // This would update the favicon with a badge
      // Implementation depends on the favicon library used
    },

    /**
     * Load preferences from storage
     */
    loadPreferences() {
      try {
        const stored = localStorage.getItem('notificationPreferences')
        if (stored) {
          this.preferences = { ...this.preferences, ...JSON.parse(stored) }
        }
      } catch (error) {
        console.error('Error loading notification preferences:', error)
      }
    },

    /**
     * Save preferences to storage
     */
    savePreferences() {
      try {
        localStorage.setItem('notificationPreferences', JSON.stringify(this.preferences))
      } catch (error) {
        console.error('Error saving notification preferences:', error)
      }
    },

    /**
     * Setup WebSocket listeners
     */
    setupWebSocketListeners() {
      // Listen for new notifications
      window.addEventListener('notification:received', (event) => {
        if (this.realtimeEnabled) {
          this.handleIncomingNotification(event.detail)
        }
      })

      // Listen for notification updates
      window.addEventListener('notification:updated', (event) => {
        const { notificationId, updates } = event.detail
        const notification = this.notifications.find(n => n.recCode === notificationId)
        if (notification) {
          Object.assign(notification, updates)
        }
      })
    },

    /**
     * Setup badge update
     */
    setupBadgeUpdate() {
      // Update badge when window gains focus
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && useAuthStore().isAuthenticated) {
          this.fetchUnreadCount()
        }
      })
    },

    /**
     * Set filters
     */
    setFilters(filters) {
      this.filters = { ...this.filters, ...filters }
      this.fetchNotifications()
    },

    /**
     * Clear filters
     */
    clearFilters() {
      this.filters = {
        unreadOnly: false,
        category: null,
        priority: null,
        dateRange: null
      }
      this.fetchNotifications()
    },

    /**
     * Reset store
     */
    resetStore() {
      this.$reset()
      this.groupedNotifications.clear()
      this.actionHandlers.clear()
      this.templates.clear()
    }
  }
})
