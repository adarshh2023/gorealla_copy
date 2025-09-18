// src/utils/storage.js
import { LocalStorage, SessionStorage } from 'quasar'

/**
 * Storage utility class
 */
class StorageUtil {
  constructor(storage) {
    this.storage = storage
  }

  /**
   * Set item in storage
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   * @returns {boolean}
   */
  set(key, value) {
    try {
      this.storage.set(key, value)
      return true
    } catch (error) {
      console.error(`Error setting ${key} in storage:`, error)
      return false
    }
  }

  /**
   * Get item from storage
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if not found
   * @returns {*}
   */
  get(key, defaultValue = null) {
    try {
      const value = this.storage.getItem(key)
      return value !== null ? value : defaultValue
    } catch (error) {
      console.error(`Error getting ${key} from storage:`, error)
      return defaultValue
    }
  }

  /**
   * Remove item from storage
   * @param {string} key - Storage key
   * @returns {boolean}
   */
  remove(key) {
    try {
      this.storage.remove(key)
      return true
    } catch (error) {
      console.error(`Error removing ${key} from storage:`, error)
      return false
    }
  }

  /**
   * Check if key exists in storage
   * @param {string} key - Storage key
   * @returns {boolean}
   */
  has(key) {
    try {
      return this.storage.has(key)
    } catch (error) {
      console.error(`Error checking ${key} in storage:`, error)
      return false
    }
  }

  /**
   * Clear all items from storage
   * @returns {boolean}
   */
  clear() {
    try {
      this.storage.clear()
      return true
    } catch (error) {
      console.error('Error clearing storage:', error)
      return false
    }
  }

  /**
   * Get all keys in storage
   * @returns {Array<string>}
   */
  getAllKeys() {
    try {
      return this.storage.getAllKeys()
    } catch (error) {
      console.error('Error getting all keys:', error)
      return []
    }
  }

  /**
   * Get storage size (approximate)
   * @returns {number} Size in bytes
   */
  getSize() {
    try {
      let size = 0
      const keys = this.getAllKeys()

      keys.forEach(key => {
        const value = this.get(key)
        size += JSON.stringify(value).length + key.length
      })

      return size
    } catch (error) {
      console.error('Error calculating storage size:', error)
      return 0
    }
  }

  /**
   * Set item with expiry
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   * @param {number} expiryMinutes - Expiry time in minutes
   * @returns {boolean}
   */
  setWithExpiry(key, value, expiryMinutes) {
    try {
      const now = new Date()
      const item = {
        value: value,
        expiry: now.getTime() + (expiryMinutes * 60 * 1000)
      }
      return this.set(key, item)
    } catch (error) {
      console.error(`Error setting ${key} with expiry:`, error)
      return false
    }
  }

  /**
   * Get item with expiry check
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if not found or expired
   * @returns {*}
   */
  getWithExpiry(key, defaultValue = null) {
    try {
      const item = this.get(key)

      if (!item) return defaultValue

      const now = new Date()
      if (now.getTime() > item.expiry) {
        this.remove(key)
        return defaultValue
      }

      return item.value
    } catch (error) {
      console.error(`Error getting ${key} with expiry:`, error)
      return defaultValue
    }
  }

  /**
   * Get multiple items
   * @param {Array<string>} keys - Array of keys
   * @returns {Object}
   */
  getMultiple(keys) {
    const result = {}
    keys.forEach(key => {
      result[key] = this.get(key)
    })
    return result
  }

  /**
   * Set multiple items
   * @param {Object} items - Object with key-value pairs
   * @returns {boolean}
   */
  setMultiple(items) {
    try {
      Object.entries(items).forEach(([key, value]) => {
        this.set(key, value)
      })
      return true
    } catch (error) {
      console.error('Error setting multiple items:', error)
      return false
    }
  }

  /**
   * Remove multiple items
   * @param {Array<string>} keys - Array of keys
   * @returns {boolean}
   */
  removeMultiple(keys) {
    try {
      keys.forEach(key => {
        this.remove(key)
      })
      return true
    } catch (error) {
      console.error('Error removing multiple items:', error)
      return false
    }
  }
}

// Create instances for local and session storage
export const local = new StorageUtil(LocalStorage)
export const session = new StorageUtil(SessionStorage)

// Storage keys constants
export const STORAGE_KEYS = {
  // Auth related
  AUTH_TOKEN: 'authToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
  DEVICE_ID: 'deviceId',
  IP_ADDRESS: 'ipAddress',

  // App settings
  THEME: 'theme',
  LANGUAGE: 'language',
  SIDEBAR_STATE: 'sidebarState',
  LAYOUT_CONFIG: 'layoutConfig',

  // User preferences
  USER_PREFERENCES: 'userPreferences',
  NOTIFICATION_SETTINGS: 'notificationSettings',
  DASHBOARD_LAYOUT: 'dashboardLayout',
  TABLE_SETTINGS: 'tableSettings',

  // Cache
  CACHE_PREFIX: 'cache_',
  LAST_SYNC: 'lastSync',

  // Form data
  FORM_DRAFT: 'formDraft',
  FORM_HISTORY: 'formHistory',

  // Navigation
  LAST_ROUTE: 'lastRoute',
  NAVIGATION_HISTORY: 'navigationHistory'
}

/**
 * Cache utility functions
 */
export const cache = {
  /**
   * Set cache item
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} expiryMinutes - Expiry time in minutes (default: 60)
   */
  set(key, value, expiryMinutes = 60) {
    const cacheKey = `${STORAGE_KEYS.CACHE_PREFIX}${key}`
    return local.setWithExpiry(cacheKey, value, expiryMinutes)
  },

  /**
   * Get cache item
   * @param {string} key - Cache key
   * @param {*} defaultValue - Default value if not found
   * @returns {*}
   */
  get(key, defaultValue = null) {
    const cacheKey = `${STORAGE_KEYS.CACHE_PREFIX}${key}`
    return local.getWithExpiry(cacheKey, defaultValue)
  },

  /**
   * Remove cache item
   * @param {string} key - Cache key
   */
  remove(key) {
    const cacheKey = `${STORAGE_KEYS.CACHE_PREFIX}${key}`
    return local.remove(cacheKey)
  },

  /**
   * Clear all cache
   */
  clear() {
    const keys = local.getAllKeys()
    const cacheKeys = keys.filter(key => key.startsWith(STORAGE_KEYS.CACHE_PREFIX))
    return local.removeMultiple(cacheKeys)
  }
}

/**
 * Form draft utility functions
 */
export const formDraft = {
  /**
   * Save form draft
   * @param {string} formId - Form identifier
   * @param {Object} data - Form data
   */
  save(formId, data) {
    const drafts = local.get(STORAGE_KEYS.FORM_DRAFT, {})
    drafts[formId] = {
      data,
      timestamp: new Date().toISOString()
    }
    return local.set(STORAGE_KEYS.FORM_DRAFT, drafts)
  },

  /**
   * Get form draft
   * @param {string} formId - Form identifier
   * @returns {Object|null}
   */
  get(formId) {
    const drafts = local.get(STORAGE_KEYS.FORM_DRAFT, {})
    return drafts[formId]?.data || null
  },

  /**
   * Remove form draft
   * @param {string} formId - Form identifier
   */
  remove(formId) {
    const drafts = local.get(STORAGE_KEYS.FORM_DRAFT, {})
    delete drafts[formId]
    return local.set(STORAGE_KEYS.FORM_DRAFT, drafts)
  },

  /**
   * Clear all form drafts
   */
  clear() {
    return local.remove(STORAGE_KEYS.FORM_DRAFT)
  },

  /**
   * Get all form drafts
   * @returns {Object}
   */
  getAll() {
    return local.get(STORAGE_KEYS.FORM_DRAFT, {})
  }
}

/**
 * Settings utility functions
 */
export const settings = {
  /**
   * Get app settings
   * @returns {Object}
   */
  get() {
    return {
      theme: local.get(STORAGE_KEYS.THEME, 'light'),
      language: local.get(STORAGE_KEYS.LANGUAGE, 'en'),
      sidebarState: local.get(STORAGE_KEYS.SIDEBAR_STATE, true),
      layoutConfig: local.get(STORAGE_KEYS.LAYOUT_CONFIG, {}),
      userPreferences: local.get(STORAGE_KEYS.USER_PREFERENCES, {}),
      notificationSettings: local.get(STORAGE_KEYS.NOTIFICATION_SETTINGS, {
        enabled: true,
        sound: true,
        desktop: true
      })
    }
  },

  /**
   * Update settings
   * @param {Object} updates - Settings updates
   */
  update(updates) {
    Object.entries(updates).forEach(([key, value]) => {
      const storageKey = STORAGE_KEYS[key.toUpperCase().replace(/([A-Z])/g, '_$1').slice(1)]
      if (storageKey) {
        local.set(storageKey, value)
      }
    })
  },

  /**
   * Reset settings to defaults
   */
  reset() {
    local.remove(STORAGE_KEYS.THEME)
    local.remove(STORAGE_KEYS.LANGUAGE)
    local.remove(STORAGE_KEYS.SIDEBAR_STATE)
    local.remove(STORAGE_KEYS.LAYOUT_CONFIG)
    local.remove(STORAGE_KEYS.USER_PREFERENCES)
    local.remove(STORAGE_KEYS.NOTIFICATION_SETTINGS)
  }
}

/**
 * Storage utility functions
 */
export const storage = {
  /**
   * Get storage info
   * @returns {Object}
   */
  getInfo() {
    return {
      localStorageSize: local.getSize(),
      sessionStorageSize: session.getSize(),
      localStorageKeys: local.getAllKeys().length,
      sessionStorageKeys: session.getAllKeys().length,
      isSupported: this.isSupported()
    }
  },

  /**
   * Check if storage is supported
   * @returns {boolean}
   */
  isSupported() {
    try {
      const test = '__storage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch (e) {
      return false
    }
  },

  /**
   * Clear all storage
   */
  clearAll() {
    local.clear()
    session.clear()
  },

  /**
   * Export storage data
   * @returns {Object}
   */
  export() {
    const data = {
      localStorage: {},
      sessionStorage: {}
    }

    local.getAllKeys().forEach(key => {
      data.localStorage[key] = local.get(key)
    })

    session.getAllKeys().forEach(key => {
      data.sessionStorage[key] = session.get(key)
    })

    return data
  },

  /**
   * Import storage data
   * @param {Object} data - Storage data
   */
  import(data) {
    if (data.localStorage) {
      Object.entries(data.localStorage).forEach(([key, value]) => {
        local.set(key, value)
      })
    }

    if (data.sessionStorage) {
      Object.entries(data.sessionStorage).forEach(([key, value]) => {
        session.set(key, value)
      })
    }
  }
}

// Export all utilities as default
export default {
  local,
  session,
  cache,
  formDraft,
  settings,
  storage,
  STORAGE_KEYS
}
