// src/services/navigation.service.js
import projectService from './api/project.service.js'
import { showError, showSuccess } from 'src/utils/notification'

class NavigationService {
  /**
   * Navigate to a specific node from notification click
   * @param {Object} notification - The notification object
   * @param {Object} router - Vue router instance
   * @returns {Promise<Object>} Navigation result
   */
  async navigateToNotification(notification, router) {
    try {
      console.log('Navigating to notification:', notification)

      // Parse notification data
      const notificationData = JSON.parse(notification.notificationData || '{}')
      const nodeId = notificationData.nodeId

      if (!nodeId) {
        throw new Error('Node ID not found in notification data')
      }

      // Get node details and tree path
      // const [nodeResponse, pathResponse] = await Promise.all([
      //  projectService.getNodeById(nodeId),
      //  projectService.getNodeTreePath(nodeId)
      // ])

      const [nodeResponse] = await Promise.all([
        projectService.getNodeById(nodeId)
      ])

      if (!nodeResponse.success) {
        throw new Error('Failed to fetch node details')
      }

      // if (!pathResponse.success) { // || !pathResponse.data.length) {
      //  throw new Error('Failed to get node path')
      // }

      // Find project ID (first node with null parentNodeId)
      // const projectNode = pathResponse.data.find(node => node.parentNodeId === null)

      const projectNode = JSON.parse(nodeResponse.data.treePath).find(node => node.parentNodeId === null)
      if (!projectNode) {
        throw new Error('Project not found in node path')
      }

      const projectId = projectNode.recCode

      // Determine tab based on notification type
      const tab = this.determineTabFromNotification(notification)

      console.log('Navigation params:', { projectId, nodeId, tab })

      // Check if we're already on the target page
      const currentRoute = router.currentRoute.value
      const isOnColumnView = currentRoute.path === '/projects/column-view' ||
                            currentRoute.path === '/menu/projects/column-view'

      if (isOnColumnView) {
        console.log('Already on column view page, updating query params without navigation')

        // Just update the query parameters without full page navigation
        await router.replace({
          path: currentRoute.path,
          query: {
            ...currentRoute.query, // Keep existing query params
            project: projectId,
            node: nodeId,
            tab: tab
          }
        })

        showSuccess(`Navigated to ${nodeResponse.data.nodeName}`)
        return { success: true, projectId, nodeId, tab, alreadyOnPage: true }
      } else {
        // Navigate to the page with query parameters
        await router.push({
          path: '/menu/projects/column-view', // Use your menu path
          query: {
            project: projectId,
            node: nodeId,
            tab: tab
          }
        })

        showSuccess(`Navigated to ${nodeResponse.data.nodeName}`)
        return { success: true, projectId, nodeId, tab, alreadyOnPage: false }
      }

    } catch (error) {
      console.error('Navigation failed:', error)
      showError(`Navigation failed: ${error.message}`)
      return { success: false, error: error.message }
    }
  }

  /**
   * Determine which tab to open based on notification type
   * @param {Object} notification - The notification object
   * @returns {string} Tab name
   */
  determineTabFromNotification(notification) {
    try {
      const notificationData = JSON.parse(notification.notificationData || '{}')

      // Map notification update categories to tabs
      const typeTabMap = {
        'NoteCreated': 'notes',
        'NoteUpdated': 'notes',
        'NoteDeleted': 'notes',
        'TaskCreated': 'tasks',
        'TaskUpdated': 'tasks',
        'TaskAssigned': 'tasks',
        'TaskCompleted': 'tasks',
        'ChatMessage': 'chat',
        'ChatMention': 'chat',
        'StakeholderAssigned': 'stakeholders',
        'StakeholderRemoved': 'stakeholders',
        'MediaUploaded': 'gallery',
        'MediaDeleted': 'gallery',
        'NodeUpdated': 'basic',
        'NodeStatusChanged': 'basic',
        'NodeProgressUpdated': 'basic'
      }

      const updateCategory = notificationData.updateCategory || 'NodeUpdated'
      return typeTabMap[updateCategory] || 'basic'

    } catch (error) {
      console.error('Error determining tab:', error)
      return 'basic'
    }
  }

  /**
   * Check if current route matches navigation target
   * @param {Object} route - Current route object
   * @param {string} projectId - Target project ID
   * @param {string} nodeId - Target node ID
   * @returns {boolean} True if already on target route
   */
  isAlreadyOnTarget(route, projectId, nodeId) {
    return route.path === '/projects/column-view' &&
           route.query.project === projectId &&
           route.query.node === nodeId
  }
}

export default new NavigationService()
