// src/boot/notification.js
import { boot } from 'quasar/wrappers'
import { Notify, Dialog, Loading } from 'quasar'
import { useAuthStore } from 'stores/auth'
import {
  permissionManager,
  browserNotification,
  notificationQueue,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_PRIORITIES
} from 'src/utils/notification'
import { api } from './axios'

// WebSocket connection for real-time notifications
let ws = null
let reconnectTimer = null
let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 5
const RECONNECT_DELAY = 5000

/**
 * Initialize WebSocket connection
 * @param {Object} authStore - Auth store instance
 */
const initializeWebSocket = (authStore) => {
  if (!authStore.isAuthenticated || ws?.readyState === WebSocket.OPEN) {
    return
  }

  const wsUrl = process.env.WS_URL || 'ws://localhost:8090/ws/notifications'
  const token = authStore.token

  try {
    ws = new WebSocket(`${wsUrl}?token=${token}`)

    ws.onopen = () => {
      console.log('WebSocket connected')
      reconnectAttempts = 0

      // Subscribe to user channels
      ws.send(JSON.stringify({
        type: 'subscribe',
        channels: [
          `user:${authStore.user.recCode}`,
          `role:${authStore.userRole}`,
          'broadcast'
        ]
      }))
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        handleWebSocketMessage(message)
      } catch (error) {
        console.error('WebSocket message parse error:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    ws.onclose = () => {
      console.log('WebSocket disconnected')
      ws = null

      // Attempt reconnection if authenticated
      if (authStore.isAuthenticated && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++
        reconnectTimer = setTimeout(() => {
          initializeWebSocket(authStore)
        }, RECONNECT_DELAY * reconnectAttempts)
      }
    }
  } catch (error) {
    console.error('WebSocket initialization error:', error)
  }
}

/**
 * Handle WebSocket message
 * @param {Object} message - WebSocket message
 */
const handleWebSocketMessage = (message) => {
  const { type, payload } = message

  switch (type) {
    case 'notification':
      handleNotification(payload)
      break

    case 'chat_message':
      handleChatMessage(payload)
      break

    case 'task_update':
      handleTaskUpdate(payload)
      break

    case 'project_update':
      handleProjectUpdate(payload)
      break

    case 'system_alert':
      handleSystemAlert(payload)
      break

    default:
      console.log('Unknown WebSocket message type:', type)
  }
}

/**
 * Handle notification message
 * @param {Object} notification - Notification data
 */
const handleNotification = (notification) => {
  const {
    id,
    title,
    message,
    priority = NOTIFICATION_PRIORITIES.NORMAL,
    actions = [],
    data = {},
    persistent = false
  } = notification

  // Show in-app notification
  const notifyConfig = {
    message: message || title,
    type: priority === NOTIFICATION_PRIORITIES.URGENT ? 'negative' : 'info',
    position: 'top-right',
    timeout: persistent ? 0 : 5000,
    multiLine: true,
    actions: actions.map(action => ({
      label: action.label,
      color: 'white',
      handler: () => handleNotificationAction(action, notification)
    }))
  }

  if (!actions.length) {
    notifyConfig.actions = [{
      label: 'Dismiss',
      color: 'white'
    }]
  }

  Notify.create(notifyConfig)

  // Show browser notification if enabled
  if (permissionManager.isEnabled() && document.hidden) {
    browserNotification.show({
      title,
      body: message,
      tag: `notification-${id}`,
      requireInteraction: priority === NOTIFICATION_PRIORITIES.URGENT,
      data,
      onClick: () => {
        window.focus()
        handleNotificationClick(notification)
      }
    })
  }

  // Update notification badge
  updateNotificationBadge(1)

  // Emit event for other components
  window.dispatchEvent(new CustomEvent('notification:received', {
    detail: notification
  }))
}

/**
 * Handle notification action
 * @param {Object} action - Action configuration
 * @param {Object} notification - Notification data
 */
const handleNotificationAction = async (action, notification) => {
  const { type, url, callback } = action

  switch (type) {
    case 'navigate':
      if (url) {
        window.location.href = url
      }
      break

    case 'api':
      if (action.endpoint) {
        try {
          await api[action.method || 'post'](action.endpoint, action.data)
        } catch (error) {
          console.error('Notification action API error:', error)
        }
      }
      break

    case 'callback':
      if (callback && typeof window[callback] === 'function') {
        window[callback](notification)
      }
      break
  }

  // Mark notification as read
  markNotificationAsRead(notification.id)
}

/**
 * Handle notification click
 * @param {Object} notification - Notification data
 */
const handleNotificationClick = (notification) => {
  // Navigate to relevant page based on notification type
  const { data } = notification

  if (data.projectId) {
    window.location.href = `/projects/${data.projectId}`
  } else if (data.taskId) {
    window.location.href = `/tasks/${data.taskId}`
  } else if (data.chatId) {
    window.location.href = `/chats/${data.chatId}`
  }

  // Mark as read
  markNotificationAsRead(notification.id)
}

/**
 * Handle chat message
 * @param {Object} message - Chat message data
 */
const handleChatMessage = (message) => {
  const { chatId, senderName, content, messageType } = message

  // Show notification if chat is not active
  const activeChatId = window.$activeChatId // Set by chat component

  if (chatId !== activeChatId) {
    Notify.create({
      message: `${senderName}: ${content}`,
      type: 'info',
      position: 'bottom-right',
      timeout: 4000,
      actions: [{
        label: 'View',
        color: 'white',
        handler: () => {
          window.location.href = `/chats/${chatId}`
        }
      }]
    })
  }

  // Emit event
  window.dispatchEvent(new CustomEvent('chat:message', {
    detail: message
  }))
}

/**
 * Handle task update
 * @param {Object} update - Task update data
 */
const handleTaskUpdate = (update) => {
  const { taskId, taskName, updateType, updatedBy } = update

  const messages = {
    'status_changed': `Task "${taskName}" status updated by ${updatedBy}`,
    'assigned': `You have been assigned to task "${taskName}"`,
    'completed': `Task "${taskName}" has been completed`,
    'overdue': `Task "${taskName}" is now overdue`
  }

  const message = messages[updateType] || `Task "${taskName}" was updated`

  Notify.create({
    message,
    type: updateType === 'overdue' ? 'warning' : 'info',
    position: 'top-right',
    timeout: 5000,
    actions: [{
      label: 'View Task',
      color: 'white',
      handler: () => {
        window.location.href = `/tasks/${taskId}`
      }
    }]
  })

  // Emit event
  window.dispatchEvent(new CustomEvent('task:update', {
    detail: update
  }))
}

/**
 * Handle project update
 * @param {Object} update - Project update data
 */
const handleProjectUpdate = (update) => {
  const { projectId, projectName, updateType } = update

  const messages = {
    'milestone_reached': `Milestone reached in project "${projectName}"`,
    'deadline_approaching': `Project "${projectName}" deadline is approaching`,
    'budget_exceeded': `Project "${projectName}" has exceeded budget`
  }

  const message = messages[updateType] || `Project "${projectName}" was updated`

  Notify.create({
    message,
    type: updateType === 'budget_exceeded' ? 'warning' : 'positive',
    position: 'top-right',
    timeout: 5000,
    actions: [{
      label: 'View Project',
      color: 'white',
      handler: () => {
        window.location.href = `/projects/${projectId}`
      }
    }]
  })

  // Emit event
  window.dispatchEvent(new CustomEvent('project:update', {
    detail: update
  }))
}

/**
 * Handle system alert
 * @param {Object} alert - System alert data
 */
const handleSystemAlert = (alert) => {
  const { level, title, message, persistent } = alert

  const typeMap = {
    'info': 'info',
    'warning': 'warning',
    'error': 'negative',
    'success': 'positive'
  }

  Dialog.create({
    title: title || 'System Alert',
    message,
    persistent,
    ok: {
      label: 'OK',
      color: level === 'error' ? 'negative' : 'primary'
    }
  })
}

/**
 * Update notification badge
 * @param {number} increment - Badge increment
 */
const updateNotificationBadge = (increment = 0) => {
  const currentCount = parseInt(window.$notificationCount || 0)
  const newCount = Math.max(0, currentCount + increment)

  window.$notificationCount = newCount

  // Update UI badge
  window.dispatchEvent(new CustomEvent('notification:badge', {
    detail: { count: newCount }
  }))

  // Update PWA badge if supported
  if ('setAppBadge' in navigator) {
    navigator.setAppBadge(newCount)
  }
}

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 */
const markNotificationAsRead = async (notificationId) => {
  try {
    await api.post(`/notifications/${notificationId}/read`)
    updateNotificationBadge(-1)
  } catch (error) {
    console.error('Error marking notification as read:', error)
  }
}

/**
 * Initialize Firebase Cloud Messaging
 */
const initializeFirebase = async () => {
  if (!('serviceWorker' in navigator)) return

  try {
    // Import Firebase dynamically
    const { initializeApp } = await import('firebase/app')
    const { getMessaging, getToken, onMessage } = await import('firebase/messaging')

    // Firebase configuration
    const firebaseConfig = {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID
    }

    // Initialize Firebase
    const app = initializeApp(firebaseConfig)
    const messaging = getMessaging(app)

    // Get FCM token
    const currentToken = await getToken(messaging, {
      vapidKey: process.env.FIREBASE_VAPID_KEY
    })

    if (currentToken) {
      // Send token to backend
      await api.post('/notifications/fcm-token', { token: currentToken })
    }

    // Handle foreground messages
    onMessage(messaging, (payload) => {
      console.log('FCM message received:', payload)
      handleNotification({
        id: payload.messageId,
        title: payload.notification.title,
        message: payload.notification.body,
        data: payload.data
      })
    })
  } catch (error) {
    console.error('Firebase initialization error:', error)
  }
}

/**
 * Setup notification preferences
 */
const setupNotificationPreferences = () => {
  // Default preferences
  const defaultPreferences = {
    enabled: true,
    channels: {
      [NOTIFICATION_CHANNELS.IN_APP]: true,
      [NOTIFICATION_CHANNELS.EMAIL]: true,
      [NOTIFICATION_CHANNELS.SMS]: false,
      [NOTIFICATION_CHANNELS.PUSH]: true
    },
    quiet_hours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    },
    categories: {
      task_updates: true,
      project_updates: true,
      chat_messages: true,
      system_alerts: true,
      reminders: true
    }
  }

  // Load user preferences
  const savedPreferences = localStorage.getItem('notificationPreferences')
  const preferences = savedPreferences
    ? JSON.parse(savedPreferences)
    : defaultPreferences

  window.$notificationPreferences = preferences

  return preferences
}

// Main boot function
export default boot(async ({ app, router, store }) => {
  const authStore = useAuthStore(store)

  try {
    // Configure Quasar Notify defaults
    Notify.setDefaults({
      position: 'top-right',
      timeout: 5000,
      textColor: 'white',
      actions: [{
        icon: 'close',
        color: 'white',
        round: true,
        size: 'sm'
      }]
    })

    // Configure Dialog defaults
    Dialog.setDefaults({
      ok: {
        push: true,
        color: 'primary'
      },
      cancel: {
        flat: true,
        color: 'grey'
      }
    })

    // Configure Loading defaults
    Loading.setDefaults({
      spinner: 'tail',
      spinnerColor: 'primary',
      spinnerSize: 80,
      message: 'Loading...',
      messageColor: 'white',
      backgroundColor: 'grey-2'
    })

    // Setup notification preferences
    const preferences = setupNotificationPreferences()

    // Request notification permission if enabled
    if (preferences.channels[NOTIFICATION_CHANNELS.PUSH]) {
      permissionManager.request().catch(console.error)
    }

    // Initialize Firebase for push notifications
    if (preferences.channels[NOTIFICATION_CHANNELS.PUSH]) {
      initializeFirebase()
    }

    // Initialize WebSocket if authenticated
    if (authStore.isAuthenticated) {
      initializeWebSocket(authStore)
    }

    // Listen for auth changes
    authStore.$subscribe((mutation, state) => {
      if (state.isAuthenticated && !ws) {
        initializeWebSocket(authStore)
      } else if (!state.isAuthenticated && ws) {
        ws.close()
        ws = null
      }
    })

    // Listen for WebSocket send events
    window.addEventListener('websocket:send', (event) => {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(event.detail))
      }
    })

    // Listen for notification preference changes
    window.addEventListener('notification:preferences', (event) => {
      const { preferences } = event.detail
      window.$notificationPreferences = preferences
      localStorage.setItem('notificationPreferences', JSON.stringify(preferences))
    })

    // Fetch unread notification count
    if (authStore.isAuthenticated) {
      try {
        const response = await api.get('/notifications/unread-count')
        updateNotificationBadge(response.data.count)
      } catch (error) {
        console.error('Error fetching notification count:', error)
      }
    }

    // Setup global notification methods
    app.config.globalProperties.$notify = {
      success: (message, options) => {
        Notify.create({
          message,
          type: 'positive',
          ...options
        })
      },
      error: (message, options) => {
        Notify.create({
          message,
          type: 'negative',
          ...options
        })
      },
      warning: (message, options) => {
        Notify.create({
          message,
          type: 'warning',
          ...options
        })
      },
      info: (message, options) => {
        Notify.create({
          message,
          type: 'info',
          ...options
        })
      }
    }

    // Cleanup on app unmount
    app.config.globalProperties.$onBeforeUnmount = () => {
      if (ws) {
        ws.close()
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
      }
    }

  } catch (error) {
    console.error('Notification system initialization error:', error)
  }
})

// Export notification utilities
export const notificationUtils = {
  /**
   * Send notification
   * @param {Object} options - Notification options
   */
  async send(options) {
    return notificationQueue.add(options)
  },

  /**
   * Get notification preferences
   * @returns {Object} Preferences
   */
  getPreferences() {
    return window.$notificationPreferences || setupNotificationPreferences()
  },

  /**
   * Update notification preferences
   * @param {Object} preferences - New preferences
   */
  updatePreferences(preferences) {
    window.dispatchEvent(new CustomEvent('notification:preferences', {
      detail: { preferences }
    }))
  },

  /**
   * Get unread count
   * @returns {number} Unread count
   */
  getUnreadCount() {
    return window.$notificationCount || 0
  },

  /**
   * Clear all notifications
   */
  async clearAll() {
    try {
      await api.post('/notifications/read-all')
      updateNotificationBadge(-window.$notificationCount)
    } catch (error) {
      console.error('Error clearing notifications:', error)
    }
  }
}
