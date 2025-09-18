// src/services/index.js
// Central export file for all services

// API Services
export { default as authService } from './api/auth.service'
export { default as userService } from './api/user.service'
export { default as projectService } from './api/project.service'
export { default as taskService } from './api/task.service'
export { default as chatService } from './api/chat.service'
export { default as tagService } from './api/tag.service'
export { default as noteService } from './api/note.service'
export { default as propertyService } from './api/property.service'
export { default as dependencyService } from './api/dependency.service'
export { default as stakeholderService } from './api/stakeholder.service'
export { default as dashboardService } from './api/dashboard.service'

// Notification Services - CORRECTED PATHS TO MATCH ACTUAL FILENAMES
export { default as notificationQueueService } from './api/notificationQueue.service'
export { default as deviceTokensService } from './api/deviceTokens.service'
export { default as notificationSettingsService } from './api/notificationSettings.service'

// Service Groups for easier imports
export const services = {
  auth: () => import('./api/auth.service').then(m => m.default),
  user: () => import('./api/user.service').then(m => m.default),
  project: () => import('./api/project.service').then(m => m.default),
  task: () => import('./api/task.service').then(m => m.default),
  chat: () => import('./api/chat.service').then(m => m.default),
  tag: () => import('./api/tag.service').then(m => m.default),
  note: () => import('./api/note.service').then(m => m.default),
  property: () => import('./api/property.service').then(m => m.default),
  dependency: () => import('./api/dependency.service').then(m => m.default),
  stakeholder: () => import('./api/stakeholder.service').then(m => m.default),
  dashboard: () => import('./api/dashboard.service').then(m => m.default),

  // Notification Services - CORRECTED PATHS TO MATCH ACTUAL FILENAMES
  notificationQueue: () => import('./api/notificationQueue.service').then(m => m.default),
  deviceTokens: () => import('./api/deviceTokens.service').then(m => m.default),
  notificationSettings: () => import('./api/notificationSettings.service').then(m => m.default)
}

// Service factory for dynamic service loading
export const getService = async (serviceName) => {
  if (services[serviceName]) {
    return await services[serviceName]()
  }
  throw new Error(`Service ${serviceName} not found`)
}

// Export all services as a namespace
export * as Services from './index'
