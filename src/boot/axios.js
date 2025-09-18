// src/boot/axios.js
import { boot } from 'quasar/wrappers'
import axios from 'axios'
import { useAuthStore } from 'stores/auth'
import { Notify, LoadingBar } from 'quasar'
import { API_BASE_URL } from 'src/constants/api.constants'

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Start loading bar
    LoadingBar.start()

    // Get auth store
    const authStore = useAuthStore()

    // Add auth token to requests
    if (authStore.token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }

    // Add device info if available
    if (config.data instanceof FormData) {
      // Don't modify FormData
    } else {
      // Add common parameters
      const deviceId = localStorage.getItem('deviceId') || 'web-app'
      const ipAddress = localStorage.getItem('ipAddress') || '0.0.0.0'

      if (config.method === 'post' || config.method === 'put' || config.method === 'patch') {
        config.data = {
          ...config.data,
          deviceId,
          ipAddress
        }
      }
    }

    return config
  },
  (error) => {
    LoadingBar.stop()
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    LoadingBar.stop()

    // Handle API response wrapper
    if (response.data && response.data.success !== undefined) {
      if (response.data.success) {
        return response.data
      } else {
        // API returned success: false
        throw new Error(response.data.message || 'Request failed')
      }
    }

    return response.data
  },
  async (error) => {
    LoadingBar.stop()

    const authStore = useAuthStore()
    const originalRequest = error.config

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      // Try to refresh token
      if (authStore.refreshToken) {
        try {
          await authStore.refreshAccessToken()
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${authStore.token}`
          return api(originalRequest)
        } catch (refreshError) {
          // Refresh failed, logout user
          authStore.logout()
          window.location.href = '/'
          return Promise.reject(refreshError)
        }
      } else {
        // No refresh token, logout user
        authStore.logout()
        window.location.href = '/'
      }
    }

    // Handle other errors
    let errorMessage = 'An error occurred'

    if (error.response) {
      // Server responded with error
      errorMessage = error.response.data?.message || error.response.data?.error || errorMessage

      // Show specific messages for common HTTP errors
      switch (error.response.status) {
        case 400:
          errorMessage = error.response.data?.message || 'Bad request'
          break
        case 403:
          errorMessage = 'You do not have permission to perform this action'
          break
        case 404:
          errorMessage = 'Requested resource not found'
          break
        case 409:
          errorMessage = error.response.data?.message || 'Resource already exists'
          break
        case 422:
          errorMessage = 'Validation failed. Please check your input'
          break
        case 500:
          errorMessage = 'Server error. Please try again later'
          break
      }
    } else if (error.request) {
      // Request made but no response
      errorMessage = 'Network error. Please check your connection'
    }

    // Show error notification
    Notify.create({
      type: 'negative',
      message: errorMessage,
      position: 'top',
      timeout: 3000,
      actions: [
        { label: 'Dismiss', color: 'white', handler: () => {} }
      ]
    })

    return Promise.reject(error)
  }
)

// Retry mechanism for failed requests
const retryRequest = async (config, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await api(config)
    } catch (error) {
      if (i === retries - 1) throw error

      // Don't retry on 4xx errors
      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        throw error
      }

      await new Promise(resolve => setTimeout(resolve, delay))
      delay *= 2 // Exponential backoff
    }
  }
}

// Add retry method to api instance
api.retry = (config, retries, delay) => retryRequest(config, retries, delay)

export default boot(({ app }) => {
  // Make axios available globally
  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
})

export { api }
