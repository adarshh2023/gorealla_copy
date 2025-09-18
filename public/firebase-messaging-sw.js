/* eslint-env serviceworker */
/* global importScripts, firebase */

// public/firebase-messaging-sw.js
// Import Firebase scripts using importScripts for service worker compatibility
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js')

// Firebase configuration - same as in boot/firebase.js
const firebaseConfig = {
  apiKey: "AIzaSyCyCrHHfM3kiTfnrKMQHj0p3Jy5sjrzPhQ",
  authDomain: "gorealla-41b32.firebaseapp.com",
  projectId: "gorealla-41b32",
  storageBucket: "gorealla-41b32.firebasestorage.app",
  messagingSenderId: "564055391492",
  appId: "1:564055391492:web:4442eee2d16f67438d6451",
  measurementId: "G-MD657JCWSD"
}

// Initialize Firebase in service worker using compat API
firebase.initializeApp(firebaseConfig)
const messaging = firebase.messaging()

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload)

  const notificationTitle = payload.notification?.title || 'Gorealla Notification'
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/favicon.ico', // Using favicon as fallback - update to your icon path
    tag: payload.data?.notificationId || 'default',
    data: payload.data || {},
    requireInteraction: false,
    silent: false
  }

  // Add customer context to notification options
  if (payload.data?.customerId) {
    notificationOptions.data.customerId = payload.data.customerId
  }

  if (payload.data?.customerName) {
    notificationOptions.data.customerName = payload.data.customerName
  }

  // Add priority-based settings
  if (payload.data?.priority === 'Urgent' || payload.data?.priority === 'High') {
    notificationOptions.requireInteraction = true
    notificationOptions.silent = false
    if ('vibrate' in navigator) {
      notificationOptions.vibrate = [200, 100, 200]
    }
  }

  // Add action buttons based on notification type
  const actions = []

  if (payload.data?.click_action === 'NODE_DETAIL' && payload.data?.nodeId) {
    actions.push({
      action: 'view_node',
      title: 'View Details'
    })
  }

  if (payload.data?.notificationId) {
    actions.push({
      action: 'mark_read',
      title: 'Mark Read'
    })
  }

  actions.push({
    action: 'view_all',
    title: 'View All'
  })

  notificationOptions.actions = actions

  // Show notification
  return self.registration.showNotification(notificationTitle, notificationOptions)
})

// Handle notification click events
self.addEventListener('notificationclick', function(event) {
  console.log('Notification click event:', event)

  const notification = event.notification
  const data = notification.data || {}

  notification.close()

  // Handle different actions
  if (event.action === 'view_node' && data.nodeId) {
    // Open node detail page
    event.waitUntil(
      openOrFocusWindow(`/menu/projects/nodes/${data.nodeId}`)
    )
  } else if (event.action === 'mark_read' && data.notificationId) {
    // Mark notification as read and open notifications page
    event.waitUntil(
      Promise.all([
        markNotificationAsRead(data.notificationId),
        openOrFocusWindow('/menu/notifications')
      ])
    )
  } else if (event.action === 'view_all') {
    // Open notifications page
    event.waitUntil(
      openOrFocusWindow('/menu/notifications')
    )
  } else {
    // Default action - determine URL based on notification data
    let targetUrl = '/menu/notifications'

    if (data.click_action === 'NODE_DETAIL' && data.nodeId) {
      targetUrl = `/menu/projects/nodes/${data.nodeId}`
    } else if (data.target_screen) {
      targetUrl = `/menu/${data.target_screen}`
    }

    event.waitUntil(
      openOrFocusWindow(targetUrl)
    )
  }
})

/**
 * Open window or focus existing window
 */
async function openOrFocusWindow(url) {
  try {
    const clients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })

    // Check if app is already open
    for (const client of clients) {
      if (client.url.includes(self.location.origin) && 'focus' in client) {
        await client.focus()
        // Navigate to the target URL
        if (client.navigate) {
          return client.navigate(url)
        }
        return client
      }
    }

    // Open new window/tab if app not open
    if (self.clients.openWindow) {
      return self.clients.openWindow(url)
    }
  } catch (error) {
    console.error('Error opening/focusing window:', error)
    // Fallback - try to open window
    if (self.clients.openWindow) {
      return self.clients.openWindow(url)
    }
  }
}

/**
 * Mark notification as read via API
 * Note: This is a simplified approach - authentication in service workers is complex
 */
async function markNotificationAsRead(notificationId) {
  try {
    // Since service workers don't have access to the main app's auth state,
    // we'll store a flag and let the main app handle the API call when it opens

    // Store the action to be performed when app opens
    const readActions = await getStoredReadActions()
    readActions.push({
      notificationId: notificationId,
      timestamp: Date.now(),
      action: 'mark_read'
    })

    // Store in IndexedDB or Cache API (simplified using a promise)
    await storeReadActions(readActions)

    console.log('Queued notification mark-read action:', notificationId)

    // Optionally, try a direct API call without auth (will likely fail but worth trying)
    try {
      const response = await fetch(`${self.location.origin}/api/v1/notifications/queue/${notificationId}/mark-read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        console.log('Notification marked as read successfully via direct API call')
        // Remove from queued actions since it succeeded
        const updatedActions = readActions.filter(action => action.notificationId !== notificationId)
        await storeReadActions(updatedActions)
      }
    } catch (directApiError) {
      console.log('Direct API call failed (expected if auth required):', directApiError.message)
      // Keep in queue for main app to process
    }

  } catch (error) {
    console.error('Error handling mark as read:', error)
  }
}

/**
 * Get stored read actions from cache
 */
async function getStoredReadActions() {
  try {
    const cache = await caches.open('notification-actions-v1')
    const response = await cache.match('/notification-read-actions')

    if (response) {
      const data = await response.json()
      return data.actions || []
    }
  } catch (error) {
    console.error('Error getting stored read actions:', error)
  }

  return []
}

/**
 * Store read actions in cache
 */
async function storeReadActions(actions) {
  try {
    const cache = await caches.open('notification-actions-v1')
    const response = new Response(JSON.stringify({ actions }), {
      headers: { 'Content-Type': 'application/json' }
    })

    await cache.put('/notification-read-actions', response)
  } catch (error) {
    console.error('Error storing read actions:', error)
  }
}

// Handle notification close events
self.addEventListener('notificationclose', function(event) {
  console.log('Notification closed:', event.notification.data)

  // Optional: Track notification dismissal
  // You could store dismissal data similar to read actions
})

// Service worker installation
// eslint-disable-next-line no-unused-vars
self.addEventListener('install', function(event) {
  console.log('Firebase messaging service worker installed')
  // Skip waiting to activate immediately
  self.skipWaiting()
})

// Service worker activation
self.addEventListener('activate', function(event) {
  console.log('Firebase messaging service worker activated')
  // Claim all clients immediately
  event.waitUntil(self.clients.claim())
})

// Handle service worker updates
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  // Handle messages from main app (e.g., auth token updates)
  if (event.data && event.data.type === 'PROCESS_QUEUED_ACTIONS') {
    // Main app can send this message to process queued notification actions
    // with proper authentication
    console.log('Processing queued notification actions...')
  }
})
