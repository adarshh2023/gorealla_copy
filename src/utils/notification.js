// src/utils/notification.js
import { Notify, Dialog, Loading } from 'quasar'
import { api } from 'boot/axios'

/**
 * Notification types
 */
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  ONGOING: 'ongoing'
}

/**
 * Notification channels
 */
export const NOTIFICATION_CHANNELS = {
  IN_APP: 'in_app',
  EMAIL: 'email',
  SMS: 'sms',
  PUSH: 'push',
  WEBSOCKET: 'websocket'
}

/**
 * Notification priorities
 */
export const NOTIFICATION_PRIORITIES = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent'
}

/**
 * Show toast notification
 * @param {Object} options - Notification options
 * @param {string} options.message - Notification message
 * @param {string} options.type - Notification type
 * @param {string} options.position - Position on screen
 * @param {number} options.timeout - Timeout in milliseconds
 * @param {Array} options.actions - Action buttons
 * @param {Function} options.onDismiss - Dismiss callback
 * @returns {Function} Dismiss function
 */
export const showToast = (options = {}) => {
  const {
    message = '',
    type = NOTIFICATION_TYPES.INFO,
    position = 'bottom',
    timeout = 5000,
    actions = [],
    onDismiss = null,
    progress = false,
    multiLine = false,
    html = false,
    icon = null,
    avatar = null,
    spinner = false
  } = options

  const typeConfig = {
    [NOTIFICATION_TYPES.SUCCESS]: {
      color: 'positive',
      icon: icon || 'check_circle',
      textColor: 'white'
    },
    [NOTIFICATION_TYPES.ERROR]: {
      color: 'negative',
      icon: icon || 'error',
      textColor: 'white'
    },
    [NOTIFICATION_TYPES.WARNING]: {
      color: 'warning',
      icon: icon || 'warning',
      textColor: 'white'
    },
    [NOTIFICATION_TYPES.INFO]: {
      color: 'info',
      icon: icon || 'info',
      textColor: 'white'
    },
    [NOTIFICATION_TYPES.ONGOING]: {
      color: 'primary',
      icon: icon || 'sync',
      textColor: 'white'
    }
  }

  const config = typeConfig[type] || typeConfig[NOTIFICATION_TYPES.INFO]

  // Default dismiss action
  const defaultActions = actions.length === 0 ? [
    {
      label: 'Dismiss',
      color: 'white',
      handler: () => {}
    }
  ] : actions

  return Notify.create({
    message,
    color: config.color,
    textColor: config.textColor,
    icon: config.icon,
    position,
    timeout: type === NOTIFICATION_TYPES.ONGOING ? 0 : timeout,
    actions: defaultActions,
    onDismiss,
    progress,
    multiLine,
    html,
    avatar,
    spinner: spinner || type === NOTIFICATION_TYPES.ONGOING,
    group: false,
    classes: 'q-notification--' + type
  })
}

/**
 * Show success notification
 * @param {string} message - Success message
 * @param {Object} options - Additional options
 * @returns {Function} Dismiss function
 */
export const showSuccess = (message, options = {}) => {
  return showToast({
    message,
    type: NOTIFICATION_TYPES.SUCCESS,
    ...options
  })
}

/**
 * Show error notification
 * @param {string} message - Error message
 * @param {Object} options - Additional options
 * @returns {Function} Dismiss function
 */
export const showError = (message, options = {}) => {
  return showToast({
    message,
    type: NOTIFICATION_TYPES.ERROR,
    timeout: 10000, // Longer timeout for errors
    ...options
  })
}

/**
 * Show warning notification
 * @param {string} message - Warning message
 * @param {Object} options - Additional options
 * @returns {Function} Dismiss function
 */
export const showWarning = (message, options = {}) => {
  return showToast({
    message,
    type: NOTIFICATION_TYPES.WARNING,
    ...options
  })
}

/**
 * Show info notification
 * @param {string} message - Info message
 * @param {Object} options - Additional options
 * @returns {Function} Dismiss function
 */
export const showInfo = (message, options = {}) => {
  return showToast({
    message,
    type: NOTIFICATION_TYPES.INFO,
    ...options
  })
}

/**
 * Show ongoing/loading notification
 * @param {string} message - Loading message
 * @param {Object} options - Additional options
 * @returns {Function} Update function
 */
export const showOngoing = (message, options = {}) => {
  const dismiss = showToast({
    message,
    type: NOTIFICATION_TYPES.ONGOING,
    spinner: true,
    ...options
  })

  // Return update function
  return {
    dismiss,
    update: (newMessage, newOptions = {}) => {
      dismiss()
      return showToast({
        message: newMessage,
        type: NOTIFICATION_TYPES.ONGOING,
        spinner: true,
        ...options,
        ...newOptions
      })
    },
    success: (successMessage) => {
      dismiss()
      return showSuccess(successMessage)
    },
    error: (errorMessage) => {
      dismiss()
      return showError(errorMessage)
    }
  }
}

/**
 * Show confirmation dialog
 * @param {Object} options - Dialog options
 * @returns {Promise<boolean>} Confirmation result
 */
export const showConfirm = (options = {}) => {
  const {
    title = 'Confirm',
    message = 'Are you sure?',
    ok = {
      label: 'Yes',
      color: 'primary',
      push: true
    },
    cancel = {
      label: 'No',
      color: 'grey',
      flat: true
    },
    persistent = false,
    html = false
  } = options

  return new Promise((resolve) => {
    Dialog.create({
      title,
      message,
      ok,
      cancel,
      persistent,
      html
    })
    .onOk(() => resolve(true))
    .onCancel(() => resolve(false))
    .onDismiss(() => resolve(false))
  })
}

/**
 * Show prompt dialog
 * @param {Object} options - Dialog options
 * @returns {Promise<string|null>} User input or null
 */
export const showPrompt = (options = {}) => {
  const {
    title = 'Input',
    message = 'Please enter a value:',
    prompt = {
      model: '',
      type: 'text',
      label: '',
      filled: true,
      dense: true
    },
    ok = {
      label: 'OK',
      color: 'primary',
      push: true
    },
    cancel = {
      label: 'Cancel',
      color: 'grey',
      flat: true
    },
    persistent = false,
    rules = []
  } = options

  return new Promise((resolve) => {
    Dialog.create({
      title,
      message,
      prompt: {
        ...prompt,
        isValid: val => rules.every(rule => rule(val) === true)
      },
      ok,
      cancel,
      persistent
    })
    .onOk(data => resolve(data))
    .onCancel(() => resolve(null))
    .onDismiss(() => resolve(null))
  })
}

/**
 * Show loading overlay
 * @param {Object} options - Loading options
 * @returns {Function} Hide function
 */
export const showLoading = (options = {}) => {
  const {
    message = 'Loading...',
    spinner = 'tail',
    spinnerColor = 'primary',
    spinnerSize = 80,
    backgroundColor = 'grey-2',
    customClass = null,
    delay = 0
  } = options

  Loading.show({
    message,
    spinner,
    spinnerColor,
    spinnerSize,
    backgroundColor,
    customClass,
    delay
  })

  return () => Loading.hide()
}

/**
 * Show progress notification
 * @param {Object} options - Progress options
 * @returns {Object} Progress controller
 */
export const showProgress = (options = {}) => {
  const {
    message = 'Processing...',
    progress = 0,
    // eslint-disable-next-line no-unused-vars
    buffer = 10
  } = options

  let currentProgress = progress
  let dismiss = null

  const update = (newProgress, newMessage = null) => {
    currentProgress = newProgress

    if (dismiss) dismiss()

    dismiss = showToast({
      message: newMessage || message,
      type: NOTIFICATION_TYPES.ONGOING,
      progress: true,
      timeout: 0,
      html: true,
      multiLine: true,
      actions: []
    })

    // Update progress bar
    setTimeout(() => {
      const progressBar = document.querySelector('.q-notification--ongoing .q-linear-progress')
      if (progressBar) {
        progressBar.style.setProperty('--q-linear-progress-model', currentProgress / 100)
      }
    }, 100)

    if (currentProgress >= 100) {
      setTimeout(() => {
        if (dismiss) dismiss()
        showSuccess('Process completed!')
      }, 500)
    }
  }

  // Initial display
  update(currentProgress)

  return {
    update,
    increment: (amount = 10, newMessage = null) => {
      update(Math.min(currentProgress + amount, 100), newMessage)
    },
    complete: (successMessage = 'Process completed!') => {
      update(100)
      setTimeout(() => {
        if (dismiss) dismiss()
        showSuccess(successMessage)
      }, 500)
    },
    error: (errorMessage = 'Process failed!') => {
      if (dismiss) dismiss()
      showError(errorMessage)
    },
    dismiss: () => {
      if (dismiss) dismiss()
    }
  }
}

/**
 * Notification permission manager
 */
export const permissionManager = {
  /**
   * Check if browser notifications are supported
   * @returns {boolean}
   */
  isSupported() {
    return 'Notification' in window
  },

  /**
   * Get current permission status
   * @returns {string} Permission status
   */
  getStatus() {
    if (!this.isSupported()) return 'unsupported'
    return Notification.permission
  },

  /**
   * Request notification permission
   * @returns {Promise<string>} Permission result
   */
  async request() {
    if (!this.isSupported()) {
      throw new Error('Notifications not supported')
    }

    if (this.getStatus() === 'granted') {
      return 'granted'
    }

    try {
      const permission = await Notification.requestPermission()
      return permission
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      throw error
    }
  },

  /**
   * Check if notifications are enabled
   * @returns {boolean}
   */
  isEnabled() {
    return this.getStatus() === 'granted'
  }
}

/**
 * Browser notification manager
 */
export const browserNotification = {
  /**
   * Show browser notification
   * @param {Object} options - Notification options
   * @returns {Notification|null}
   */
  show(options = {}) {
    const {
      title = 'Notification',
      body = '',
      icon = '/icons/icon-128x128.png',
      badge = '/icons/icon-128x128.png',
      tag = null,
      requireInteraction = false,
      silent = false,
      data = null,
      actions = [],
      onClick = null
    } = options

    if (!permissionManager.isEnabled()) {
      console.warn('Browser notifications not enabled')
      return null
    }

    try {
      const notification = new Notification(title, {
        body,
        icon,
        badge,
        tag,
        requireInteraction,
        silent,
        data,
        actions
      })

      if (onClick) {
        notification.onclick = onClick
      }

      notification.onerror = (error) => {
        console.error('Notification error:', error)
      }

      return notification
    } catch (error) {
      console.error('Error showing browser notification:', error)
      return null
    }
  },

  /**
   * Close all notifications with tag
   * @param {string} tag - Notification tag
   */
  closeByTag(tag) {
    if (!tag) return

    // This is a workaround as there's no direct API to close by tag
    // New notifications with same tag will replace old ones
    this.show({
      title: '',
      body: '',
      tag,
      silent: true
    })?.close()
  }
}

/**
 * Multi-channel notification sender
 */
export const sendNotification = async (options = {}) => {
  const {
    channels = [NOTIFICATION_CHANNELS.IN_APP],
    title = '',
    message = '',
    priority = NOTIFICATION_PRIORITIES.NORMAL,
    data = {},
    userId = null,
    roleId = null,
    metadata = {}
  } = options

  const results = {
    sent: [],
    failed: []
  }

  // In-app notification
  if (channels.includes(NOTIFICATION_CHANNELS.IN_APP)) {
    try {
      showInfo(message, {
        multiLine: true,
        position: 'top-right',
        timeout: priority === NOTIFICATION_PRIORITIES.URGENT ? 0 : 5000
      })
      results.sent.push(NOTIFICATION_CHANNELS.IN_APP)
    } catch (error) {
      results.failed.push({ channel: NOTIFICATION_CHANNELS.IN_APP, error })
    }
  }

  // Push notification
  if (channels.includes(NOTIFICATION_CHANNELS.PUSH) && permissionManager.isEnabled()) {
    try {
      browserNotification.show({
        title,
        body: message,
        requireInteraction: priority === NOTIFICATION_PRIORITIES.URGENT,
        data: { ...data, priority }
      })
      results.sent.push(NOTIFICATION_CHANNELS.PUSH)
    } catch (error) {
      results.failed.push({ channel: NOTIFICATION_CHANNELS.PUSH, error })
    }
  }

  // Email notification (via API)
  if (channels.includes(NOTIFICATION_CHANNELS.EMAIL)) {
    try {
      await api.post('/notifications/email', {
        userId,
        roleId,
        subject: title,
        body: message,
        priority,
        metadata
      })
      results.sent.push(NOTIFICATION_CHANNELS.EMAIL)
    } catch (error) {
      results.failed.push({ channel: NOTIFICATION_CHANNELS.EMAIL, error })
    }
  }

  // SMS notification (via API)
  if (channels.includes(NOTIFICATION_CHANNELS.SMS)) {
    try {
      await api.post('/notifications/sms', {
        userId,
        roleId,
        message: `${title}: ${message}`,
        priority,
        metadata
      })
      results.sent.push(NOTIFICATION_CHANNELS.SMS)
    } catch (error) {
      results.failed.push({ channel: NOTIFICATION_CHANNELS.SMS, error })
    }
  }

  // WebSocket notification (handled by WebSocket service)
  if (channels.includes(NOTIFICATION_CHANNELS.WEBSOCKET)) {
    try {
      // This will be handled by WebSocket service
      window.dispatchEvent(new CustomEvent('websocket:send', {
        detail: {
          type: 'notification',
          payload: {
            title,
            message,
            priority,
            data,
            metadata
          }
        }
      }))
      results.sent.push(NOTIFICATION_CHANNELS.WEBSOCKET)
    } catch (error) {
      results.failed.push({ channel: NOTIFICATION_CHANNELS.WEBSOCKET, error })
    }
  }

  return results
}

/**
 * Notification queue for batch processing
 */
class NotificationQueue {
  constructor() {
    this.queue = []
    this.processing = false
    this.batchSize = 5
    this.delay = 100
  }

  /**
   * Add notification to queue
   * @param {Object} notification - Notification object
   */
  add(notification) {
    this.queue.push(notification)
    if (!this.processing) {
      this.process()
    }
  }

  /**
   * Process notification queue
   */
  async process() {
    if (this.queue.length === 0) {
      this.processing = false
      return
    }

    this.processing = true
    const batch = this.queue.splice(0, this.batchSize)

    for (const notification of batch) {
      try {
        await sendNotification(notification)
        await new Promise(resolve => setTimeout(resolve, this.delay))
      } catch (error) {
        console.error('Error processing notification:', error)
      }
    }

    // Continue processing
    setTimeout(() => this.process(), this.delay)
  }

  /**
   * Clear queue
   */
  clear() {
    this.queue = []
  }

  /**
   * Get queue size
   * @returns {number}
   */
  size() {
    return this.queue.length
  }
}

// Create global notification queue
export const notificationQueue = new NotificationQueue()

/**
 * Format notification message
 * @param {string} template - Message template
 * @param {Object} data - Template data
 * @returns {string} Formatted message
 */
export const formatMessage = (template, data = {}) => {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return data[key] || match
  })
}

/**
 * Notification templates
 */
export const templates = {
  task: {
    created: 'New task "{taskName}" has been created',
    assigned: 'Task "{taskName}" has been assigned to you',
    completed: 'Task "{taskName}" has been completed',
    overdue: 'Task "{taskName}" is overdue by {days} days',
    reminder: 'Reminder: Task "{taskName}" is due {when}'
  },
  project: {
    created: 'New project "{projectName}" has been created',
    updated: 'Project "{projectName}" has been updated',
    milestone: 'Milestone reached in project "{projectName}"',
    delayed: 'Project "{projectName}" is delayed by {days} days'
  },
  chat: {
    message: 'New message from {senderName}',
    mention: '{senderName} mentioned you in {chatName}',
    file: '{senderName} shared a file in {chatName}'
  },
  system: {
    maintenance: 'System maintenance scheduled for {date}',
    update: 'New system update available',
    backup: 'System backup completed successfully',
    error: 'System error: {error}'
  }
}

// Export all functions as default
export default {
  NOTIFICATION_TYPES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_PRIORITIES,
  showToast,
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showOngoing,
  showConfirm,
  showPrompt,
  showLoading,
  showProgress,
  permissionManager,
  browserNotification,
  sendNotification,
  notificationQueue,
  formatMessage,
  templates
}
