// src/utils/auth.js
import { useAuthStore } from 'stores/auth'
import { USER_ROLES } from 'src/constants/api.constants'

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  const authStore = useAuthStore()
  return authStore.isAuthenticated && !!authStore.token
}

/**
 * Check if user has specific role
 * @param {string} role - Role to check
 * @returns {boolean}
 */
export const hasRole = (role) => {
  const authStore = useAuthStore()
  return authStore.hasRole(role)
}

/**
 * Check if user has any of the specified roles
 * @param {Array<string>} roles - Roles to check
 * @returns {boolean}
 */
export const hasAnyRole = (roles) => {
  const authStore = useAuthStore()
  return authStore.hasAnyRole(roles)
}

/**
 * Check if user has all of the specified roles
 * @param {Array<string>} roles - Roles to check
 * @returns {boolean}
 */
export const hasAllRoles = (roles) => {
  const authStore = useAuthStore()
  return roles.every(role => authStore.hasRole(role))
}

/**
 * Get current user
 * @returns {Object|null}
 */
export const getCurrentUser = () => {
  const authStore = useAuthStore()
  return authStore.currentUser
}

/**
 * Get current user ID
 * @returns {string|null}
 */
export const getCurrentUserId = () => {
  const authStore = useAuthStore()
  return authStore.currentUser?.recCode || null
}

/**
 * Get current user role
 * @returns {string|null}
 */
export const getCurrentUserRole = () => {
  const authStore = useAuthStore()
  return authStore.userRole
}

/**
 * Check if user is admin
 * @returns {boolean}
 */
export const isAdmin = () => {
  return hasRole(USER_ROLES.ADMIN)
}

/**
 * Check if user is project manager
 * @returns {boolean}
 */
export const isProjectManager = () => {
  return hasRole(USER_ROLES.PROJECT_MANAGER)
}

/**
 * Check if user is engineer
 * @returns {boolean}
 */
export const isEngineer = () => {
  return hasRole(USER_ROLES.ENGINEER)
}

/**
 * Check if user can manage projects
 * @returns {boolean}
 */
export const canManageProjects = () => {
  return hasAnyRole([USER_ROLES.ADMIN, USER_ROLES.PROJECT_MANAGER])
}

/**
 * Check if user can edit content
 * @returns {boolean}
 */
export const canEditContent = () => {
  return hasAnyRole([USER_ROLES.ADMIN, USER_ROLES.PROJECT_MANAGER, USER_ROLES.ENGINEER])
}

/**
 * Check if user can view reports
 * @returns {boolean}
 */
export const canViewReports = () => {
  return hasAnyRole([USER_ROLES.ADMIN, USER_ROLES.PROJECT_MANAGER])
}

/**
 * Check if user has permission for specific action
 * @param {string} action - Action to check
 * @param {Object} resource - Resource object (optional)
 * @returns {boolean}
 */
export const hasPermission = (action, resource = null) => {
  const authStore = useAuthStore()
  const userRole = authStore.userRole
  const userId = authStore.currentUser?.recCode

  // Admin has all permissions
  if (userRole === USER_ROLES.ADMIN) return true

  // Define permission matrix
  const permissions = {
    // Project permissions
    'project.create': [USER_ROLES.PROJECT_MANAGER],
    'project.edit': [USER_ROLES.PROJECT_MANAGER],
    'project.delete': [USER_ROLES.PROJECT_MANAGER],
    'project.view': [USER_ROLES.PROJECT_MANAGER, USER_ROLES.ENGINEER, USER_ROLES.USER, USER_ROLES.VIEWER],

    // Task permissions
    'task.create': [USER_ROLES.PROJECT_MANAGER, USER_ROLES.ENGINEER],
    'task.edit': [USER_ROLES.PROJECT_MANAGER, USER_ROLES.ENGINEER],
    'task.delete': [USER_ROLES.PROJECT_MANAGER],
    'task.assign': [USER_ROLES.PROJECT_MANAGER, USER_ROLES.ENGINEER],
    'task.view': [USER_ROLES.PROJECT_MANAGER, USER_ROLES.ENGINEER, USER_ROLES.USER, USER_ROLES.VIEWER],

    // Note permissions
    'note.create': [USER_ROLES.PROJECT_MANAGER, USER_ROLES.ENGINEER, USER_ROLES.USER],
    'note.edit': [USER_ROLES.PROJECT_MANAGER, USER_ROLES.ENGINEER],
    'note.delete': [USER_ROLES.PROJECT_MANAGER],
    'note.view': [USER_ROLES.PROJECT_MANAGER, USER_ROLES.ENGINEER, USER_ROLES.USER, USER_ROLES.VIEWER],

    // User management permissions
    'user.create': [],
    'user.edit': [],
    'user.delete': [],
    'user.view': [USER_ROLES.PROJECT_MANAGER],

    // Report permissions
    'report.view': [USER_ROLES.PROJECT_MANAGER],
    'report.create': [USER_ROLES.PROJECT_MANAGER],
    'report.export': [USER_ROLES.PROJECT_MANAGER]
  }

  // Check basic role permission
  const allowedRoles = permissions[action] || []
  const hasRolePermission = allowedRoles.includes(userRole)

  // Check resource-specific permissions
  if (resource && hasRolePermission) {
    // Check if user owns the resource
    if (resource.insertUser === userId || resource.createdBy === userId) {
      // Owners can edit their own content (except delete in some cases)
      if (action.includes('.edit')) return true
    }

    // Check if user is assigned to the resource
    if (resource.assignedTo === userId || resource.assignees?.includes(userId)) {
      if (action.includes('.view') || action.includes('.edit')) return true
    }
  }

  return hasRolePermission
}

/**
 * Get permission error message
 * @param {string} action - Action attempted
 * @returns {string}
 */
export const getPermissionErrorMessage = (action) => {
  const messages = {
    'project.create': 'You do not have permission to create projects',
    'project.edit': 'You do not have permission to edit this project',
    'project.delete': 'You do not have permission to delete this project',
    'task.create': 'You do not have permission to create tasks',
    'task.edit': 'You do not have permission to edit this task',
    'task.delete': 'You do not have permission to delete this task',
    'task.assign': 'You do not have permission to assign tasks',
    'note.create': 'You do not have permission to create notes',
    'note.edit': 'You do not have permission to edit this note',
    'note.delete': 'You do not have permission to delete this note',
    'user.create': 'You do not have permission to create users',
    'user.edit': 'You do not have permission to edit this user',
    'user.delete': 'You do not have permission to delete this user',
    'report.view': 'You do not have permission to view reports',
    'report.create': 'You do not have permission to create reports',
    'report.export': 'You do not have permission to export reports'
  }

  return messages[action] || 'You do not have permission to perform this action'
}

/**
 * Check if session is valid
 * @returns {Promise<boolean>}
 */
export const isSessionValid = async () => {
  const authStore = useAuthStore()

  if (!authStore.isAuthenticated) return false

  try {
    const result = await authStore.validateToken()
    return result.success
  // eslint-disable-next-line no-unused-vars
  } catch (error) {
    return false
  }
}

/**
 * Refresh session if needed
 * @returns {Promise<boolean>}
 */
export const refreshSessionIfNeeded = async () => {
  const authStore = useAuthStore()

  if (!authStore.refreshToken) return false

  try {
    const result = await authStore.refreshAccessToken()
    return result.success
  // eslint-disable-next-line no-unused-vars
  } catch (error) {
    return false
  }
}

/**
 * Get auth headers
 * @returns {Object}
 */
export const getAuthHeaders = () => {
  const authStore = useAuthStore()

  if (!authStore.token) return {}

  return {
    'Authorization': `Bearer ${authStore.token}`
  }
}

/**
 * Handle unauthorized access
 * @param {Object} router - Vue router instance
 * @param {string} redirectTo - Path to redirect after login
 */
export const handleUnauthorized = (router, redirectTo = null) => {
  const authStore = useAuthStore()

  // Clear auth data
  authStore.clearAuth()

  // Redirect to login
  router.push({
    name: 'login',
    query: redirectTo ? { redirect: redirectTo } : {}
  })
}

/**
 * Check if user profile is complete
 * @returns {boolean}
 */
export const isProfileComplete = () => {
  const authStore = useAuthStore()
  const user = authStore.currentUser

  if (!user) return false

  // Check required fields
  const requiredFields = ['fullName', 'email', 'mobile']
  const hasAllFields = requiredFields.every(field => user[field])

  // Check verification status
  const isVerified = user.isEmailVerified || user.isMobileVerified

  return hasAllFields && isVerified
}

/**
 * Get incomplete profile fields
 * @returns {Array<string>}
 */
export const getIncompleteProfileFields = () => {
  const authStore = useAuthStore()
  const user = authStore.currentUser

  if (!user) return []

  const incomplete = []

  if (!user.fullName) incomplete.push('Full Name')
  if (!user.email) incomplete.push('Email')
  if (!user.mobile) incomplete.push('Mobile')
  if (!user.isEmailVerified && user.email) incomplete.push('Email Verification')
  if (!user.isMobileVerified && user.mobile) incomplete.push('Mobile Verification')

  return incomplete
}

// Export all functions as default
export default {
  isAuthenticated,
  hasRole,
  hasAnyRole,
  hasAllRoles,
  getCurrentUser,
  getCurrentUserId,
  getCurrentUserRole,
  isAdmin,
  isProjectManager,
  isEngineer,
  canManageProjects,
  canEditContent,
  canViewReports,
  hasPermission,
  getPermissionErrorMessage,
  isSessionValid,
  refreshSessionIfNeeded,
  getAuthHeaders,
  handleUnauthorized,
  isProfileComplete,
  getIncompleteProfileFields
}
