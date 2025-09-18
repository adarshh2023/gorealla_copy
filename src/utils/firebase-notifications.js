// src/utils/firebase-notification.js
import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { Notify } from 'quasar'

/**
 * Firebase notification utility functions
 */
export class FirebaseNotificationUtils {

  /**
   * Check if push notifications are supported
   */
  static isSupported() {
    if (Capacitor.isNativePlatform()) {
      return true // Capacitor always supports push notifications
    } else {
      return 'Notification' in window && 'serviceWorker' in navigator
    }
  }

  /**
   * Get current notification permission status
   */
  static async getPermissionStatus() {
    try {
      if (Capacitor.isNativePlatform()) {
        const result = await PushNotifications.checkPermissions()
        return {
          status: result.receive,
          granted: result.receive === 'granted',
          denied: result.receive === 'denied',
          prompt: result.receive === 'prompt'
        }
      } else {
        const permission = Notification.permission
        return {
          status: permission,
          granted: permission === 'granted',
          denied: permission === 'denied',
          prompt: permission === 'default'
        }
      }
    } catch (error) {
      console.error('Error checking permissions:', error)
      return {
        status: 'denied',
        granted: false,
        denied: true,
        prompt: false
      }
    }
  }

  /**
   * Request notification permissions with user-friendly messaging
   */
  static async requestPermissions(showDialog = true) {
    try {
      const currentStatus = await this.getPermissionStatus()

      if (currentStatus.granted) {
        return { success: true, permission: 'granted' }
      }

      if (currentStatus.denied) {
        if (showDialog) {
          Notify.create({
            type: 'warning',
            message: 'Notifications are blocked. Please enable them in browser settings.',
            position: 'top',
            timeout: 5000,
            actions: [
              {
                label: 'Learn How',
                color: 'white',
                handler: () => {
                  this.showPermissionInstructions()
                }
              }
            ]
          })
        }
        return { success: false, permission: 'denied' }
      }

      // Request permission
      let permissionResult

      if (Capacitor.isNativePlatform()) {
        const result = await PushNotifications.requestPermissions()
        permissionResult = result.receive
      } else {
        permissionResult = await Notification.requestPermission()
      }

      const granted = permissionResult === 'granted'

      if (showDialog) {
        if (granted) {
          Notify.create({
            type: 'positive',
            message: 'Notifications enabled successfully!',
            position: 'top',
            timeout: 3000
          })
        } else {
          Notify.create({
            type: 'negative',
            message: 'Notifications were not enabled. You can enable them later in settings.',
            position: 'top',
            timeout: 5000
          })
        }
      }

      return { success: granted, permission: permissionResult }

    } catch (error) {
      console.error('Permission request failed:', error)

      if (showDialog) {
        Notify.create({
          type: 'negative',
          message: 'Failed to request notification permissions',
          position: 'top',
          timeout: 3000
        })
      }

      return { success: false, permission: 'denied', error: error.message }
    }
  }

  /**
   * Show instructions for enabling notifications manually
   */
  static showPermissionInstructions() {
    const instructions = this.getPermissionInstructions()

    Notify.create({
      type: 'info',
      message: instructions,
      position: 'center',
      timeout: 10000,
      html: true,
      actions: [{ label: 'Got it', color: 'white' }]
    })
  }

  /**
   * Get browser-specific permission instructions
   */
  static getPermissionInstructions() {
    const userAgent = navigator.userAgent

    if (/Chrome/i.test(userAgent)) {
      return `
        <strong>Enable notifications in Chrome:</strong><br>
        1. Click the lock/info icon in the address bar<br>
        2. Set "Notifications" to "Allow"<br>
        3. Refresh this page
      `
    } else if (/Firefox/i.test(userAgent)) {
      return `
        <strong>Enable notifications in Firefox:</strong><br>
        1. Click the shield icon in the address bar<br>
        2. Click "Allow" for notifications<br>
        3. Refresh this page
      `
    } else if (/Safari/i.test(userAgent)) {
      return `
        <strong>Enable notifications in Safari:</strong><br>
        1. Go to Safari > Preferences > Websites<br>
        2. Select "Notifications" on the left<br>
        3. Set this site to "Allow"
      `
    } else {
      return `
        <strong>Enable notifications:</strong><br>
        1. Look for a notification icon in your address bar<br>
        2. Click "Allow" when prompted<br>
        3. Or check browser settings for this site
      `
    }
  }

  /**
   * Handle notification click with customer context
   */
  static handleNotificationClick(notification, customerContext, router) {
    try {
      const data = notification.data || {}

      console.log('Handling notification click:', { notification: data, customerContext })

      // Build route based on notification data and customer context
      let targetRoute = '/menu/notifications' // Default

      if (data.click_action === 'NODE_DETAIL' && data.nodeId) {
        targetRoute = `/menu/projects/nodes/${data.nodeId}`
      } else if (data.click_action === 'TASK_DETAIL' && data.taskId) {
        targetRoute = `/menu/tasks/${data.taskId}`
      } else if (data.click_action === 'PROJECT_DETAIL' && data.projectId) {
        targetRoute = `/menu/projects/${data.projectId}`
      } else if (data.target_screen) {
        targetRoute = `/menu/${data.target_screen}`
      }

      // Add customer context as query params if needed
      const routeWithContext = {
        path: targetRoute,
        query: {
          from: 'notification',
          notificationId: data.notificationId,
          customerId: customerContext?.customerId
        }
      }

      if (router) {
        router.push(routeWithContext)
      } else {
        // Fallback to window location
        const url = new URL(targetRoute, window.location.origin)
        if (data.notificationId) {
          url.searchParams.set('notificationId', data.notificationId)
        }
        if (customerContext?.customerId) {
          url.searchParams.set('customerId', customerContext.customerId)
        }
        window.location.href = url.toString()
      }

    } catch (error) {
      console.error('Error handling notification click:', error)

      // Fallback to notifications page
      if (router) {
        router.push('/menu/notifications')
      } else {
        window.location.href = '/menu/notifications'
      }
    }
  }

  /**
   * Format notification for display
   */
  static formatNotification(payload, customerContext) {
    try {
      const formatted = {
        title: payload.notification?.title || 'New Notification',
        body: payload.notification?.body || '',
        data: payload.data || {},
        customerContext: customerContext
      }

      // Add customer branding if available
      if (customerContext?.customerName) {
        formatted.title = `[${customerContext.customerName}] ${formatted.title}`
      }

      // Add priority indicators
      if (payload.data?.priority === 'Urgent') {
        formatted.title = `🚨 ${formatted.title}`
      } else if (payload.data?.priority === 'High') {
        formatted.title = `⚠️ ${formatted.title}`
      }

      return formatted
    } catch (error) {
      console.error('Error formatting notification:', error)
      return {
        title: 'Notification',
        body: 'You have a new notification',
        data: payload.data || {},
        customerContext: customerContext
      }
    }
  }

  /**
   * Show notification using Quasar with customer context
   */
  static showQuasarNotification(payload, customerContext, actions = []) {
    try {
      const formatted = this.formatNotification(payload, customerContext)

      const defaultActions = [
        {
          label: 'View',
          color: 'white',
          handler: () => {
            this.handleNotificationClick({ data: formatted.data }, customerContext)
          }
        },
        { label: 'Dismiss', color: 'white' }
      ]

      Notify.create({
        type: this.getNotificationType(payload.data?.priority),
        message: formatted.title,
        caption: formatted.body,
        position: 'top-right',
        timeout: this.getNotificationTimeout(payload.data?.priority),
        actions: actions.length > 0 ? actions : defaultActions,
        attrs: {
          'data-customer-id': customerContext?.customerId,
          'data-notification-id': payload.data?.notificationId
        }
      })

    } catch (error) {
      console.error('Error showing Quasar notification:', error)
    }
  }

  /**
   * Get notification type based on priority
   */
  static getNotificationType(priority) {
    switch (priority) {
      case 'Urgent':
        return 'negative'
      case 'High':
        return 'warning'
      case 'Normal':
        return 'info'
      case 'Low':
        return 'info'
      default:
        return 'info'
    }
  }

  /**
   * Get notification timeout based on priority
   */
  static getNotificationTimeout(priority) {
    switch (priority) {
      case 'Urgent':
        return 10000 // 10 seconds
      case 'High':
        return 7000  // 7 seconds
      case 'Normal':
        return 5000  // 5 seconds
      case 'Low':
        return 3000  // 3 seconds
      default:
        return 5000
    }
  }

  /**
   * Validate notification payload
   */
  static validateNotificationPayload(payload) {
    try {
      if (!payload) {
        return { valid: false, error: 'Empty payload' }
      }

      if (!payload.notification && !payload.data) {
        return { valid: false, error: 'No notification or data content' }
      }

      // Check required fields
      const notification = payload.notification || {}
      const data = payload.data || {}

      if (!notification.title && !data.title) {
        return { valid: false, error: 'Missing notification title' }
      }

      return { valid: true }

    } catch (error) {
      return { valid: false, error: error.message }
    }
  }

  /**
   * Get customer-specific notification settings
   */
  static getCustomerNotificationSettings(customerContext) {
    try {
      // Default settings
      const defaultSettings = {
        showInApp: true,
        showPush: true,
        playSound: true,
        vibrate: true,
        badge: true
      }

      // Customer-specific overrides could be added here
      if (customerContext?.environment === 'development') {
        defaultSettings.playSound = false // Quieter in dev
      }

      return defaultSettings
    } catch (error) {
      console.error('Error getting customer notification settings:', error)
      return {
        showInApp: true,
        showPush: true,
        playSound: false,
        vibrate: false,
        badge: true
      }
    }
  }

  /**
   * Debug notification system
   */
  static debugNotificationSystem() {
    const debug = {
      support: this.isSupported(),
      platform: Capacitor.isNativePlatform() ? 'native' : 'web',
      capacitorPlatform: Capacitor.getPlatform(),
      userAgent: navigator.userAgent,
      serviceWorkerSupport: 'serviceWorker' in navigator,
      notificationAPI: 'Notification' in window,
      permission: Notification.permission || 'unknown'
    }

    console.log('Notification System Debug Info:', debug)
    return debug
  }
}

// Export utility functions
export const {
  isSupported,
  getPermissionStatus,
  requestPermissions,
  handleNotificationClick,
  formatNotification,
  showQuasarNotification,
  validateNotificationPayload,
  getCustomerNotificationSettings,
  debugNotificationSystem
} = FirebaseNotificationUtils

// Default export
export default FirebaseNotificationUtils
