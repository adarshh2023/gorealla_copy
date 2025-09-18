// src/boot/firebase.js
import { boot } from 'quasar/wrappers'
import { initializeApp } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { Notify } from 'quasar'

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCyCrHHfM3kiTfnrKMQHj0p3Jy5sjrzPhQ",
  authDomain: "gorealla-41b32.firebaseapp.com",
  projectId: "gorealla-41b32",
  storageBucket: "gorealla-41b32.firebasestorage.app",
  messagingSenderId: "564055391492",
  appId: "1:564055391492:web:4442eee2d16f67438d6451",
  measurementId: "G-MD657JCWSD"
}

// VAPID key for web push notifications (you'll need to get this from Firebase Console)
const vapidKey = 'BHDZDdHzo5GvaRJDrYsVbYO-D2dYSdCboTMMNGrKxuYK2fwxbM9vznj1mfb43yh11srXTfnH5RjRksYhVeUTGgg' // Replace with your actual VAPID key

let app = null
let messaging = null
let isFirebaseInitialized = false

export default boot(({ router }) => {
  try {
    // Initialize Firebase
    app = initializeApp(firebaseConfig)

    // Initialize Firebase Cloud Messaging
    if ('serviceWorker' in navigator) {
      messaging = getMessaging(app)
      isFirebaseInitialized = true

      console.log('Firebase initialized successfully')

      // Register service worker
      navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration)
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error)
        })

      // Handle foreground messages
      onMessage(messaging, (payload) => {
        console.log('Foreground message received:', payload)

        // Show notification using Quasar
        Notify.create({
          type: 'info',
          message: payload.notification?.title || 'New Notification',
          caption: payload.notification?.body || '',
          position: 'top-right',
          timeout: 5000,
          actions: [
            {
              label: 'View',
              color: 'white',
              handler: () => {
                // Handle notification click
                if (payload.data?.click_action) {
                  handleNotificationClick(payload.data, router)
                }
              }
            },
            { label: 'Dismiss', color: 'white' }
          ]
        })
      })

    } else {
      console.warn('Service workers are not supported in this browser')
    }

  } catch (error) {
    console.error('Firebase initialization failed:', error)
    isFirebaseInitialized = false
  }
})

/**
 * Handle notification click actions
 */
function handleNotificationClick(data, router) {
  try {
    if (data.click_action === 'NODE_DETAIL' && data.nodeId) {
      router.push(`/menu/projects/nodes/${data.nodeId}`)
    } else if (data.click_action === 'NOTIFICATION_LIST') {
      router.push('/menu/notifications')
    } else if (data.target_screen) {
      router.push(`/menu/${data.target_screen}`)
    } else {
      router.push('/menu/notifications')
    }
  } catch (error) {
    console.error('Error handling notification click:', error)
  }
}

/**
 * Get Firebase messaging instance
 */
export function getFirebaseMessaging() {
  if (!isFirebaseInitialized || !messaging) {
    throw new Error('Firebase messaging not initialized')
  }
  return messaging
}

/**
 * Get Firebase app instance
 */
export function getFirebaseApp() {
  if (!isFirebaseInitialized || !app) {
    throw new Error('Firebase app not initialized')
  }
  return app
}

/**
 * Check if Firebase is initialized and ready
 */
export function isFirebaseReady() {
  return isFirebaseInitialized && messaging !== null
}

/**
 * Get FCM token for device registration
 */
export async function getFCMToken() {
  try {
    if (!isFirebaseReady()) {
      throw new Error('Firebase not ready')
    }

    const currentToken = await getToken(messaging, {
      vapidKey: vapidKey
    })

    if (currentToken) {
      console.log('FCM token obtained successfully')
      return currentToken
    } else {
      console.warn('No FCM token available. Requesting permission...')

      // Request notification permission
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        // Try again after permission granted
        return await getToken(messaging, { vapidKey: vapidKey })
      } else {
        throw new Error('Notification permission denied')
      }
    }
  } catch (error) {
    console.error('Error getting FCM token:', error)
    throw error
  }
}

export { firebaseConfig, vapidKey }
