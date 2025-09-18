/* eslint-disable no-unused-vars */
// src/router/guards.js
import { useAuthStore } from 'stores/auth'
import { showError, showWarning } from 'src/utils/notification'
import { LocalStorage } from 'quasar'

/**
 * Route meta configuration for access control
 *
 * Example route meta:
 * {
 *   requiresAuth: true,
 *   roles: ['Admin', 'ProjectManager'],
 *   permissions: ['project.view'],
 *   guestOnly: false,
 *   verified: true,
 *   profileComplete: true
 * }
 */

/**
 * Public routes that don't require authentication
 */
const PUBLIC_ROUTES = [
  'login',
  'register',
  'forgot-password',
  'reset-password',
  'verify-email',
  'verify-mobile',
  'maintenance',
  'terms',
  'privacy',
  'about'
]

/**
 * Routes that require guest access (not authenticated)
 */
const GUEST_ONLY_ROUTES = [
  'login',
  'register',
  'forgot-password',
  'reset-password'
]

/**
 * Routes that require specific verification
 */
const VERIFICATION_ROUTES = {
  emailVerified: ['profile-complete'],
  mobileVerified: ['profile-complete'],
  profileComplete: ['dashboard', 'projects']
}

/**
 * Check if route requires authentication
 * @param {Object} to - Target route
 * @returns {boolean}
 */
const requiresAuth = (to) => {
  // Check route meta
  if (to.meta?.requiresAuth !== undefined) {
    return to.meta.requiresAuth
  }

  // Check if route is in public routes
  return !PUBLIC_ROUTES.includes(to.name)
}

/**
 * Check if route is for guests only
 * @param {Object} to - Target route
 * @returns {boolean}
 */
const isGuestOnly = (to) => {
  if (to.meta?.guestOnly !== undefined) {
    return to.meta.guestOnly
  }

  return GUEST_ONLY_ROUTES.includes(to.name)
}

/**
 * Check if user has required roles
 * @param {Array<string>} requiredRoles - Required roles
 * @param {string} userRole - User's current role
 * @returns {boolean}
 */
const hasRequiredRoles = (requiredRoles, userRole) => {
  if (!requiredRoles || requiredRoles.length === 0) {
    return true
  }

  return requiredRoles.includes(userRole)
}

/**
 * Check if user has required permissions
 * @param {Array<string>} requiredPermissions - Required permissions
 * @param {Array<string>} userPermissions - User's permissions
 * @returns {boolean}
 */
const hasRequiredPermissions = (requiredPermissions, userPermissions) => {
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true
  }

  return requiredPermissions.every(permission =>
    userPermissions.includes(permission)
  )
}

/**
 * Check if user meets verification requirements
 * @param {Object} user - User object
 * @param {Object} requirements - Verification requirements
 * @returns {Object} Verification result
 */
const checkVerificationRequirements = (user, requirements = {}) => {
  const result = {
    passed: true,
    reason: null
  }

  if (requirements.emailVerified && !user.isEmailVerified) {
    result.passed = false
    result.reason = 'Email verification required'
  }

  if (requirements.mobileVerified && !user.isMobileVerified) {
    result.passed = false
    result.reason = 'Mobile verification required'
  }

  if (requirements.profileComplete) {
    const requiredFields = ['fullName', 'email', 'mobile']
    const hasAllFields = requiredFields.every(field => user[field])

    if (!hasAllFields) {
      result.passed = false
      result.reason = 'Please complete your profile'
    }
  }

  return result
}

/**
 * Global before each navigation guard
 * @param {Object} to - Target route
 * @param {Object} from - Source route
 * @param {Function} next - Navigation callback
 */
export const beforeEachGuard = async (to, from, next) => {
  const authStore = useAuthStore()

  try {
    // Initialize auth if not already done
    if (!authStore.isAuthenticated && LocalStorage.getItem('authToken')) {
      await authStore.initializeAuth()
    }

    // Check if route requires authentication
    if (requiresAuth(to)) {
      if (!authStore.isAuthenticated) {
        // Store intended route
        LocalStorage.set('redirectPath', to.fullPath)

        showWarning('Please login to continue')
        return next({
          name: 'login',
          query: { redirect: to.fullPath }
        })
      }

      // Check role requirements
      if (to.meta?.roles) {
        if (!hasRequiredRoles(to.meta.roles, authStore.userRole)) {
          showError('You do not have permission to access this page')
          return next({ name: 'unauthorized' })
        }
      }

      // Check permission requirements
      if (to.meta?.permissions) {
        if (!hasRequiredPermissions(to.meta.permissions, authStore.permissions)) {
          showError('You do not have the required permissions')
          return next({ name: 'unauthorized' })
        }
      }

      // Check verification requirements
      if (to.meta?.verified) {
        const verificationCheck = checkVerificationRequirements(authStore.user, {
          emailVerified: to.meta.emailVerified,
          mobileVerified: to.meta.mobileVerified,
          profileComplete: to.meta.profileComplete
        })

        if (!verificationCheck.passed) {
          showWarning(verificationCheck.reason)
          return next({ name: 'profile-verification' })
        }
      }
    }

    // Check if route is for guests only
    if (isGuestOnly(to) && authStore.isAuthenticated) {
      return next({ name: 'dashboard' })
    }

    // Check maintenance mode
    if (to.name !== 'maintenance' && checkMaintenanceMode()) {
      return next({ name: 'maintenance' })
    }

    // Proceed with navigation
    next()
  } catch (error) {
    console.error('Navigation guard error:', error)
    showError('Navigation error occurred')
    next(false)
  }
}

/**
 * Global after each navigation guard
 * @param {Object} to - Target route
 * @param {Object} from - Source route
 */
export const afterEachGuard = (to, from) => {
  // Update page title
  updatePageTitle(to)

  // Track navigation
  trackNavigation(to, from)

  // Clear any pending notifications
  clearPendingNotifications()

  // Scroll to top
  window.scrollTo(0, 0)
}

/**
 * Update page title based on route
 * @param {Object} route - Current route
 */
const updatePageTitle = (route) => {
  const baseTitle = 'Gorealla Developer'
  const pageTitle = route.meta?.title || route.name

  if (pageTitle) {
    document.title = `${pageTitle} - ${baseTitle}`
  } else {
    document.title = baseTitle
  }
}

/**
 * Track navigation for analytics
 * @param {Object} to - Target route
 * @param {Object} from - Source route
 */
const trackNavigation = (to, from) => {
  // Track page view
  if (window.gtag) {
    window.gtag('config', 'GA_MEASUREMENT_ID', {
      page_path: to.path
    })
  }

  // Custom analytics tracking
  const navigationData = {
    from: from.path,
    to: to.path,
    timestamp: new Date().toISOString(),
    userId: useAuthStore().user?.recCode
  }

  // Send to analytics service
  console.log('Navigation tracked:', navigationData)
}

/**
 * Clear pending notifications
 */
const clearPendingNotifications = () => {
  // Clear any toast notifications with specific tags
  const notificationTags = ['navigation', 'route-change']
  // Implementation depends on notification system
}

/**
 * Check if application is in maintenance mode
 * @returns {boolean}
 */
const checkMaintenanceMode = () => {
  // Check maintenance flag from API or config
  const maintenanceMode = LocalStorage.getItem('maintenanceMode')
  return maintenanceMode === true
}

/**
 * Route-specific guards
 */
export const routeGuards = {
  /**
   * Dashboard guard
   */
  dashboard: (to, from, next) => {
    const authStore = useAuthStore()

    // Check if user has any projects
    if (!authStore.user?.hasProjects) {
      showWarning('Create your first project to get started')
      return next({ name: 'project-create' })
    }

    next()
  },

  /**
   * Project guard
   */
  project: async (to, from, next) => {
    const authStore = useAuthStore()
    const projectId = to.params.projectId

    // Check project access
    try {
      const hasAccess = await checkProjectAccess(projectId, authStore.user.recCode)

      if (!hasAccess) {
        showError('You do not have access to this project')
        return next({ name: 'projects' })
      }

      next()
     
    } catch (error) {
      showError('Failed to verify project access')
      next({ name: 'projects' })
    }
  },

  /**
   * Admin guard
   */
  admin: (to, from, next) => {
    const authStore = useAuthStore()

    if (authStore.userRole !== 'Admin') {
      showError('Admin access required')
      return next({ name: 'unauthorized' })
    }

    next()
  },

  /**
   * Profile guard
   */
  profile: (to, from, next) => {
    const authStore = useAuthStore()
    const userId = to.params.userId

    // Check if viewing own profile or has permission
    if (userId && userId !== authStore.user.recCode) {
      if (!authStore.hasRole('Admin') && !authStore.hasRole('ProjectManager')) {
        showError('You can only view your own profile')
        return next({ name: 'profile', params: { userId: authStore.user.recCode } })
      }
    }

    next()
  }
}

/**
 * Check project access
 * @param {string} projectId - Project ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>}
 */
const checkProjectAccess = async (projectId, userId) => {
  // Call API to check access
  // This is a placeholder implementation
  return true
}

/**
 * Navigation guard factory for role-based routes
 * @param {Array<string>} roles - Required roles
 * @returns {Function} Navigation guard
 */
export const requireRoles = (roles) => {
  return (to, from, next) => {
    const authStore = useAuthStore()

    if (!authStore.isAuthenticated) {
      return next({ name: 'login', query: { redirect: to.fullPath } })
    }

    if (!hasRequiredRoles(roles, authStore.userRole)) {
      showError('You do not have the required role to access this page')
      return next({ name: 'unauthorized' })
    }

    next()
  }
}

/**
 * Navigation guard factory for permission-based routes
 * @param {Array<string>} permissions - Required permissions
 * @returns {Function} Navigation guard
 */
export const requirePermissions = (permissions) => {
  return (to, from, next) => {
    const authStore = useAuthStore()

    if (!authStore.isAuthenticated) {
      return next({ name: 'login', query: { redirect: to.fullPath } })
    }

    if (!hasRequiredPermissions(permissions, authStore.permissions)) {
      showError('You do not have the required permissions')
      return next({ name: 'unauthorized' })
    }

    next()
  }
}

/**
 * Navigation guard for verified users only
 * @param {Object} requirements - Verification requirements
 * @returns {Function} Navigation guard
 */
export const requireVerification = (requirements = {}) => {
  return (to, from, next) => {
    const authStore = useAuthStore()

    if (!authStore.isAuthenticated) {
      return next({ name: 'login', query: { redirect: to.fullPath } })
    }

    const verificationCheck = checkVerificationRequirements(authStore.user, requirements)

    if (!verificationCheck.passed) {
      showWarning(verificationCheck.reason)
      return next({ name: 'profile-verification' })
    }

    next()
  }
}

/**
 * Async route guard wrapper
 * @param {Function} guard - Async guard function
 * @returns {Function} Navigation guard
 */
export const asyncGuard = (guard) => {
  return async (to, from, next) => {
    try {
      await guard(to, from, next)
    } catch (error) {
      console.error('Async guard error:', error)
      showError('An error occurred during navigation')
      next(false)
    }
  }
}

/**
 * Combine multiple guards
 * @param {...Function} guards - Guard functions
 * @returns {Function} Combined navigation guard
 */
export const combineGuards = (...guards) => {
  return async (to, from, next) => {
    let guardIndex = 0

    const runNextGuard = (nextAction) => {
      if (nextAction === false || typeof nextAction === 'object') {
        // Guard rejected or redirected
        next(nextAction)
      } else if (guardIndex < guards.length - 1) {
        // Run next guard
        guardIndex++
        guards[guardIndex](to, from, runNextGuard)
      } else {
        // All guards passed
        next()
      }
    }

    // Start with first guard
    guards[0](to, from, runNextGuard)
  }
}

// Export all guards
export default {
  beforeEachGuard,
  afterEachGuard,
  routeGuards,
  requireRoles,
  requirePermissions,
  requireVerification,
  asyncGuard,
  combineGuards
}
