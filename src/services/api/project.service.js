// src/services/api/project.service.js
import { api } from 'boot/axios'
import { API_ENDPOINTS, PAGINATION } from 'src/constants/api.constants'

class ProjectService {

  /**
   * Move node to new parent
   * @param {string} nodeId - Node ID to move
   * @param {string} newParentNodeId - New parent node ID (null for root)
   * @returns {Promise<Object>} Move result
   */
  async moveNode(nodeId, newParentNodeId) {
    return await api.put(API_ENDPOINTS.PROJECTS.MOVE_NODE(nodeId), {
      newParentNodeId: newParentNodeId
    })
  }

  /**
   * Bulk create nodes
   * @param {Object} data - Bulk creation data
   * @param {Array} data.nodes - Array of node objects to create
   * @returns {Promise<Object>} Bulk creation result
   */
  async bulkCreateNodes(data) {
    return await api.post(API_ENDPOINTS.PROJECTS.BULK_CREATE_NODES, data)
  }

  /**
   * Bulk update nodes
   * @param {Object} data - Bulk update data
   * @param {Array} data.updates - Array of update objects
   * @returns {Promise<Object>} Bulk update result
   */
  async bulkUpdateNodes(data) {
    return await api.put(API_ENDPOINTS.PROJECTS.BULK_UPDATE_NODES, data)
  }

  /**
   * Bulk delete nodes
   * @param {Object} data - Bulk delete data
   * @param {Array} data.nodeIds - Array of node IDs to delete
   * @param {boolean} data.force - Whether to force delete nodes with children
   * @returns {Promise<Object>} Bulk delete result
   */
  async bulkDeleteNodes(data) {
    return await api.delete(API_ENDPOINTS.PROJECTS.BULK_DELETE_NODES, { data })
  }

  /**
   * Hierarchical search with multiple keywords
   * @param {Array} keywords - Array of search keywords
   * @param {Object} params - Search parameters
   * @returns {Promise<Object>} Search results with breadcrumb paths
   */
    async searchNodesWithPathsArray(keywords, params = {}) {
      const queryParams = {
        keywords: keywords.join(','), // Convert array to comma-separated string
        page: params.page || PAGINATION.DEFAULT_PAGE,
        size: params.size || PAGINATION.DEFAULT_SIZE,
        sort: `${params.sort || 'insertDate'},${params.direction || 'ASC'}`,
        includePaths: true,
        includeStakeholders: true
      }

      // Add additional filters
      if (params.projectId) {
        queryParams.projectId = params.projectId
      }
      if (params.status) {
        queryParams.status = params.status
      }
      if (params.nodeTypeId) {
        queryParams.nodeTypeId = params.nodeTypeId
      }

      return await api.get(API_ENDPOINTS.PROJECTS.NODE_SEARCH_ARRAY, { params: queryParams })
    }

  /**
   * Get nodes with breadcrumb paths (enhanced search)
   * @param {string} query - Search query
   * @param {Object} params - Search parameters
   * @returns {Promise<Object>} Search results with breadcrumb paths
   */
  async searchNodesWithPaths(query, params = {}) {
    const queryParams = {
      query,
      page: params.page || PAGINATION.DEFAULT_PAGE,
      size: params.size || PAGINATION.DEFAULT_SIZE,
      sort: `${params.sort || 'insertDate'},${params.direction || 'ASC'}`,
      includePaths: true, // Request breadcrumb paths
      includeStakeholders: true // Request stakeholder assignments
    }

    // Add additional filters
    if (params.projectId) {
      queryParams.projectId = params.projectId
    }
    if (params.status) {
      queryParams.status = params.status
    }
    if (params.nodeTypeId) {
      queryParams.nodeTypeId = params.nodeTypeId
    }

    return await api.get(API_ENDPOINTS.PROJECTS.NODE_SEARCH_ENHANCED, { params: queryParams })
  }

  /**
   * Check if nodes can be deleted in bulk
   * @param {Array} nodeIds - Array of node IDs to check
   * @returns {Promise<Object>} Delete validation result
   */
  async validateBulkDelete(nodeIds) {
    return await api.post(API_ENDPOINTS.PROJECTS.VALIDATE_BULK_DELETE, { nodeIds })
  }

  /**
   * Get nodes by project with full details
   * @param {string} projectId - Project ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Project nodes with details
   */
  async getProjectNodesWithDetails(projectId, params = {}) {
    const queryParams = {
      page: params.page || PAGINATION.DEFAULT_PAGE,
      size: params.size || PAGINATION.DEFAULT_SIZE,
      sort: `${params.sort || 'insertDate'},${params.direction || 'ASC'}`,
      includeStakeholders: true,
      includePaths: true,
      includeProperties: params.includeProperties || false
    }

    return await api.get(API_ENDPOINTS.PROJECTS.PROJECT_NODES_DETAILED(projectId), { params: queryParams })
  }
  /**
   * Create new project (root node)
   * @param {Object} projectData - Project creation data
   * @returns {Promise<Object>} Created project
   */
  async createProject(projectData) {
    return await api.post(API_ENDPOINTS.PROJECTS.BASE, projectData)
  }

  /**
   * Get all projects with pagination
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Paginated projects
   */
  async getAllProjects(params = {}) {
    const queryParams = {
      page: params.page || PAGINATION.DEFAULT_PAGE,
      size: params.size || PAGINATION.DEFAULT_SIZE,
      sort: `${params.sort || PAGINATION.DEFAULT_SORT},${params.direction || PAGINATION.DEFAULT_DIRECTION}`
    }
    return await api.get(API_ENDPOINTS.PROJECTS.BASE, { params: queryParams })
  }

  /**
   * Get projects by category
   * @param {string} categoryId - Category ID
   * @param {Object} params - Pagination parameters
   * @returns {Promise<Object>} Paginated projects
   */
  async getProjectsByCategory(categoryId, params = {}) {
    const queryParams = {
      page: params.page || PAGINATION.DEFAULT_PAGE,
      size: params.size || PAGINATION.DEFAULT_SIZE,
      sort: `${params.sort || 'nodeName'},${params.direction || 'ASC'}`
    }

    return await api.get(API_ENDPOINTS.PROJECTS.BY_CATEGORY(categoryId), { params: queryParams })
  }

  /**
   * Get projects by manager
   * @param {string} managerId - Manager ID
   * @param {Object} params - Pagination parameters
   * @returns {Promise<Object>} Paginated projects
   */
  async getProjectsByManager(managerId, params = {}) {
    const queryParams = {
      page: params.page || PAGINATION.DEFAULT_PAGE,
      size: params.size || PAGINATION.DEFAULT_SIZE,
      sort: `${params.sort || PAGINATION.DEFAULT_SORT},${params.direction || PAGINATION.DEFAULT_DIRECTION}`
    }

    return await api.get(API_ENDPOINTS.PROJECTS.BY_MANAGER(managerId), { params: queryParams })
  }

  /**
   * Get node by ID
   * @param {string} nodeId - Node ID
   * @returns {Promise<Object>} Node data
   */
  async getNodeById(nodeId) {
    return await api.get(API_ENDPOINTS.PROJECTS.NODE_BY_ID(nodeId))
  }

  /**
   * Create child node
   * @param {Object} nodeData - Node creation data
   * @returns {Promise<Object>} Created node
   */
  async createNode(nodeData) {
    return await api.post(API_ENDPOINTS.PROJECTS.NODES, nodeData)
  }

  /**
   * Update node
   * @param {string} nodeId - Node ID
   * @param {Object} nodeData - Updated node data
   * @returns {Promise<Object>} Updated node
   */
  async updateNode(nodeId, nodeData) {
    return await api.put(API_ENDPOINTS.PROJECTS.NODE_BY_ID(nodeId), nodeData)
  }

  /**
   * Delete node
   * @param {string} nodeId - Node ID
   * @returns {Promise<void>}
   */
  async deleteNode(nodeId) {
    return await api.delete(API_ENDPOINTS.PROJECTS.NODE_BY_ID(nodeId))
  }

  /**
   * Get project tree structure
   * @param {string} projectId - Project ID
   * @returns {Promise<Array>} Tree structure
   */
  async getProjectTree(projectId) {
    return await api.get(API_ENDPOINTS.PROJECTS.TREE(projectId))
  }

  /**
   * Get node children
   * @param {string} nodeId - Node ID
   * @returns {Promise<Array>} Child nodes
   */
  async getNodeChildren(nodeId) {
    return await api.get(API_ENDPOINTS.PROJECTS.NODE_CHILDREN(nodeId))
  }

  /**
   * Get node ancestors
   * @param {string} nodeId - Node ID
   * @returns {Promise<Array>} Ancestor nodes
   */
  async getNodeAncestors(nodeId) {
    return await api.get(API_ENDPOINTS.PROJECTS.NODE_ANCESTORS(nodeId))
  }

  /**
   * Get node tree path
   * @param {string} nodeId - Node ID
   * @returns {Promise<Object>} Tree path
   */
  async getNodeTreePath(nodeId) {
    return await api.get(API_ENDPOINTS.PROJECTS.NODE_PATH(nodeId))
  }

  /**
   * Search nodes
   * @param {string} query - Search query
   * @param {Object} params - Pagination parameters
   * @returns {Promise<Object>} Search results
   */
  async searchNodes(query, params = {}) {
    const queryParams = {
      query,
      page: params.page || PAGINATION.DEFAULT_PAGE,
      size: params.size || PAGINATION.DEFAULT_SIZE,
      sort: `${params.sort || 'nodeName'},${params.direction || 'ASC'}`
    }
    return await api.get(API_ENDPOINTS.PROJECTS.NODE_SEARCH, { params: queryParams })
  }

  /**
   * Get nodes by status within a project
   * @param {string} projectId - Project ID
   * @param {string} status - Node status
   * @returns {Promise<Array>} Nodes with specified status
   */
  async getNodesByStatus(projectId, status) {
    return await api.get(API_ENDPOINTS.PROJECTS.NODES_BY_STATUS(projectId, status))
  }

  /**
   * Get critical nodes
   * @param {string} projectId - Project ID
   * @param {number} threshold - Threshold value (default 0.9)
   * @returns {Promise<Array>} Critical nodes
   */
  async getCriticalNodes(projectId, threshold = 0.9) {
    return await api.get(API_ENDPOINTS.PROJECTS.CRITICAL_NODES(projectId), {
      params: { threshold }
    })
  }

  /**
   * Update node progress
   * @param {string} nodeId - Node ID
   * @param {number} completionPercentage - Completion percentage
   * @returns {Promise<void>}
   */
  async updateNodeProgress(nodeId, completionPercentage) {
    return await api.put(API_ENDPOINTS.PROJECTS.UPDATE_PROGRESS(nodeId), null, {
      params: { completionPercentage }
    })
  }

  /**
   * Update node status
   * @param {string} nodeId - Node ID
   * @param {string} status - New status
   * @returns {Promise<void>}
   */
  async updateNodeStatus(nodeId, status) {
    return await api.put(API_ENDPOINTS.PROJECTS.UPDATE_STATUS(nodeId), null, {
      params: { status }
    })
  }

  /**
   * Get progress summary for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} Progress summary
   */
  async getProgressSummary(projectId) {
    return await api.get(API_ENDPOINTS.PROJECTS.PROGRESS_SUMMARY(projectId))
  }

  /**
   * Update custom properties for a node
   * @param {string} nodeId - Node ID
   * @param {Object} properties - Custom properties
   * @returns {Promise<void>}
   */
  async updateCustomProperties(nodeId, properties) {
    return await api.put(API_ENDPOINTS.PROJECTS.CUSTOM_PROPERTIES(nodeId), properties)
  }

  /**
   * Get custom properties for a node
   * @param {string} nodeId - Node ID
   * @returns {Promise<Object>} Custom properties
   */
  async getCustomProperties(nodeId) {
    return await api.get(API_ENDPOINTS.PROJECTS.CUSTOM_PROPERTIES(nodeId))
  }

  /**
   * Get all tree categories
   * @returns {Promise<Array>} Tree categories
   */
  async getAllTreeCategories() {
    return await api.get(API_ENDPOINTS.PROJECTS.CATEGORIES)
  }

  /**
   * Get all node types
   * @returns {Promise<Array>} Node types
   */
  async getAllNodeTypes() {
    return await api.get(API_ENDPOINTS.PROJECTS.NODE_TYPES)
  }

  /**
   * Check if node can be deleted
   * @param {string} nodeId - Node ID
   * @returns {Promise<Object>} Delete check result
   */
  async canDeleteNode(nodeId) {
    return await api.get(API_ENDPOINTS.PROJECTS.CAN_DELETE(nodeId))
  }

  /**
   * Build breadcrumb path for a node
   * @param {string} nodeId - Node ID
   * @returns {Promise<Array>} Breadcrumb items
   */
  async buildBreadcrumb(nodeId) {
    try {
      const ancestors = await this.getNodeAncestors(nodeId)
      const currentNode = await this.getNodeById(nodeId)

      const breadcrumbs = ancestors.data.map(node => ({
        label: node.nodeName,
        to: `/projects/node/${node.recCode}`
      }))

      breadcrumbs.push({
        label: currentNode.data.nodeName,
        to: `/projects/node/${nodeId}`
      })

      return breadcrumbs
    } catch (error) {
      console.error('Error building breadcrumb:', error)
      return []
    }
  }

  /**
   * Calculate project completion percentage
   * @param {Object} project - Project object
   * @returns {number} Completion percentage
   */
  calculateProjectCompletion(project) {
    return project.completionPercentage || 0
  }

  /**
   * Get node type icon
   * @param {string} nodeType - Node type
   * @returns {string} Icon name
   */
  getNodeTypeIcon(nodeType) {
    const iconMap = {
      'Project': 'business',
      'Building': 'apartment',
      'Wing': 'domain',
      'Floor': 'layers',
      'Unit': 'home',
      'Room': 'meeting_room',
      'Work Item': 'construction'
    }

    return iconMap[nodeType] || 'folder'
  }

  /**
   * Get status color
   * @param {string} status - Node status
   * @returns {string} Color name
   */
  getStatusColor(status) {
    const colorMap = {
      'Not Started': 'grey',
      'In Progress': 'primary',
      'On Hold': 'warning',
      'Completed': 'positive',
      'Cancelled': 'negative'
    }

    return colorMap[status] || 'grey'
  }

  /**
   * Format tree node for display
   * @param {Object} node - Node object
   * @returns {Object} Formatted node
   */
  formatTreeNode(node) {
    return {
      ...node,
      label: node.nodeName,
      icon: this.getNodeTypeIcon(node.nodeType),
      selectable: true,
      expandable: node.hasChildren,
      lazy: node.hasChildren,
      header: node.nodeType,
      body: node.nodeDescription || '',
      id: node.recCode,
      handler: () => {}
    }
  }
}

export default new ProjectService()
