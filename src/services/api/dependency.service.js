// src/services/api/dependency.service.js
import { api } from 'boot/axios'
import { API_ENDPOINTS } from 'src/constants/api.constants'

class DependencyService {
  /**
   * Create dependency between nodes
   * @param {Object} dependencyData - Dependency creation data
   * @returns {Promise<Object>} Created dependency
   */
  async createDependency(dependencyData) {
    return await api.post(API_ENDPOINTS.DEPENDENCIES.BASE, dependencyData)
  }

  /**
   * Get dependency by ID
   * @param {string} dependencyId - Dependency ID
   * @returns {Promise<Object>} Dependency data
   */
  async getDependencyById(dependencyId) {
    return await api.get(API_ENDPOINTS.DEPENDENCIES.BY_ID(dependencyId))
  }

  /**
   * Update dependency
   * @param {string} dependencyId - Dependency ID
   * @param {Object} dependencyData - Updated dependency data
   * @returns {Promise<Object>} Updated dependency
   */
  async updateDependency(dependencyId, dependencyData) {
    return await api.put(API_ENDPOINTS.DEPENDENCIES.BY_ID(dependencyId), dependencyData)
  }

  /**
   * Delete dependency
   * @param {string} dependencyId - Dependency ID
   * @returns {Promise<void>}
   */
  async deleteDependency(dependencyId) {
    return await api.delete(API_ENDPOINTS.DEPENDENCIES.BY_ID(dependencyId))
  }

  /**
   * Deactivate dependency (soft delete)
   * @param {string} dependencyId - Dependency ID
   * @returns {Promise<void>}
   */
  async deactivateDependency(dependencyId) {
    return await api.post(API_ENDPOINTS.DEPENDENCIES.DEACTIVATE(dependencyId))
  }

  /**
   * Reactivate dependency
   * @param {string} dependencyId - Dependency ID
   * @returns {Promise<void>}
   */
  async reactivateDependency(dependencyId) {
    return await api.post(API_ENDPOINTS.DEPENDENCIES.REACTIVATE(dependencyId))
  }

  /**
   * Get dependencies for a node (where node is dependent)
   * @param {string} nodeId - Node ID
   * @returns {Promise<Array>} Node dependencies
   */
  async getNodeDependencies(nodeId) {
    return await api.get(API_ENDPOINTS.DEPENDENCIES.NODE_DEPENDENCIES(nodeId))
  }

  /**
   * Get prerequisites for a node (where node is prerequisite)
   * @param {string} nodeId - Node ID
   * @returns {Promise<Array>} Node prerequisites
   */
  async getNodePrerequisites(nodeId) {
    return await api.get(API_ENDPOINTS.DEPENDENCIES.NODE_PREREQUISITES(nodeId))
  }

  /**
   * Get active dependencies for a node
   * @param {string} nodeId - Node ID
   * @returns {Promise<Array>} Active dependencies
   */
  async getActiveDependencies(nodeId) {
    return await api.get(API_ENDPOINTS.DEPENDENCIES.NODE_ACTIVE(nodeId))
  }

  /**
   * Get dependencies by type
   * @param {string} dependencyType - Dependency type
   * @returns {Promise<Array>} Dependencies
   */
  async getDependenciesByType(dependencyType) {
    return await api.get(API_ENDPOINTS.DEPENDENCIES.BY_TYPE(dependencyType))
  }

  /**
   * Get overridable dependencies
   * @returns {Promise<Array>} Overridable dependencies
   */
  async getOverridableDependencies() {
    return await api.get(API_ENDPOINTS.DEPENDENCIES.OVERRIDABLE)
  }

  /**
   * Get overridden dependencies
   * @returns {Promise<Array>} Overridden dependencies
   */
  async getOverriddenDependencies() {
    return await api.get(API_ENDPOINTS.DEPENDENCIES.OVERRIDDEN)
  }

  /**
   * Search dependencies
   * @param {string} query - Search query
   * @param {Object} params - Pagination parameters
   * @returns {Promise<Object>} Search results
   */
  async searchDependencies(query, params = {}) {
    const queryParams = {
      query,
      page: params.page || 0,
      size: params.size || 20,
      sort: `${params.sort || 'insertDate'},${params.direction || 'DESC'}`
    }

    return await api.get(API_ENDPOINTS.DEPENDENCIES.SEARCH, { params: queryParams })
  }

  /**
   * Get dependency chain for a node
   * @param {string} nodeId - Node ID
   * @returns {Promise<Object>} Dependency chain
   */
  async getDependencyChain(nodeId) {
    return await api.get(API_ENDPOINTS.DEPENDENCIES.CHAIN(nodeId))
  }

  /**
   * Get upstream dependencies (all prerequisites recursively)
   * @param {string} nodeId - Node ID
   * @returns {Promise<Array>} Upstream dependencies
   */
  async getUpstreamDependencies(nodeId) {
    return await api.get(API_ENDPOINTS.DEPENDENCIES.UPSTREAM(nodeId))
  }

  /**
   * Get downstream dependencies (all dependents recursively)
   * @param {string} nodeId - Node ID
   * @returns {Promise<Array>} Downstream dependencies
   */
  async getDownstreamDependencies(nodeId) {
    return await api.get(API_ENDPOINTS.DEPENDENCIES.DOWNSTREAM(nodeId))
  }

  /**
   * Get critical path for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<Array>} Critical path
   */
  async getCriticalPath(projectId) {
    return await api.get(API_ENDPOINTS.DEPENDENCIES.CRITICAL_PATH(projectId))
  }

  /**
   * Get blocking dependencies for a node
   * @param {string} nodeId - Node ID
   * @returns {Promise<Array>} Blocking dependencies
   */
  async getBlockingDependencies(nodeId) {
    return await api.get(API_ENDPOINTS.DEPENDENCIES.BLOCKING(nodeId))
  }

  /**
   * Get dependency network for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} Dependency network
   */
  async getDependencyNetwork(projectId) {
    return await api.get(API_ENDPOINTS.DEPENDENCIES.NETWORK(projectId))
  }

  /**
   * Validate dependency before creation
   * @param {Object} dependencyData - Dependency data to validate
   * @returns {Promise<Object>} Validation result
   */
  async validateDependency(dependencyData) {
    return await api.post(API_ENDPOINTS.DEPENDENCIES.VALIDATE, dependencyData)
  }

  /**
   * Check for circular dependency
   * @param {string} dependentNodeId - Dependent node ID
   * @param {string} prerequisiteNodeId - Prerequisite node ID
   * @returns {Promise<Object>} Circular dependency check result
   */
  async checkCircularDependency(dependentNodeId, prerequisiteNodeId) {
    return await api.get(API_ENDPOINTS.DEPENDENCIES.CHECK_CIRCULAR, {
      params: { dependentNodeId, prerequisiteNodeId }
    })
  }

  /**
   * Check if dependency can be created
   * @param {string} dependentNodeId - Dependent node ID
   * @param {string} prerequisiteNodeId - Prerequisite node ID
   * @returns {Promise<Object>} Can create check result
   */
  async canCreateDependency(dependentNodeId, prerequisiteNodeId) {
    return await api.get(API_ENDPOINTS.DEPENDENCIES.CAN_CREATE, {
      params: { dependentNodeId, prerequisiteNodeId }
    })
  }

  /**
   * Find circular dependency path
   * @param {string} nodeId - Node ID
   * @returns {Promise<Array>} Circular path if exists
   */
  async findCircularDependencyPath(nodeId) {
    return await api.get(API_ENDPOINTS.DEPENDENCIES.CIRCULAR_PATH(nodeId))
  }

  /**
   * Validate dependency chain
   * @param {string} nodeId - Node ID
   * @returns {Promise<Array>} Validation issues
   */
  async validateDependencyChain(nodeId) {
    return await api.get(API_ENDPOINTS.DEPENDENCIES.VALIDATE_CHAIN(nodeId))
  }

  /**
   * Override dependency
   * @param {Object} overrideData - Override request data
   * @returns {Promise<Object>} Overridden dependency
   */
  async overrideDependency(overrideData) {
    return await api.post(API_ENDPOINTS.DEPENDENCIES.OVERRIDE, overrideData)
  }

  /**
   * Cancel dependency override
   * @param {string} dependencyId - Dependency ID
   * @returns {Promise<void>}
   */
  async cancelOverride(dependencyId) {
    return await api.post(API_ENDPOINTS.DEPENDENCIES.CANCEL_OVERRIDE(dependencyId))
  }

  /**
   * Get override history for a dependency
   * @param {string} dependencyId - Dependency ID
   * @returns {Promise<Array>} Override history
   */
  async getOverrideHistory(dependencyId) {
    return await api.get(API_ENDPOINTS.DEPENDENCIES.OVERRIDE_HISTORY(dependencyId))
  }

  /**
   * Get statistics for dependencies
   * @param {string} projectId - Project ID (optional)
   * @returns {Promise<Object>} Dependency statistics
   */
  async getDependencyStatistics(projectId = null) {
    const params = projectId ? { projectId } : {}
    return await api.get(API_ENDPOINTS.DEPENDENCIES.STATISTICS, { params })
  }

  /**
   * Get execution order for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<Array>} Execution order
   */
  async getExecutionOrder(projectId) {
    return await api.get(API_ENDPOINTS.DEPENDENCIES.EXECUTION_ORDER(projectId))
  }

  // ===== Utility Methods =====

  /**
   * Get dependency type icon
   * @param {string} dependencyType - Dependency type
   * @returns {string} Icon name
   */
  getDependencyTypeIcon(dependencyType) {
    const iconMap = {
      'Must Finish Before': 'trending_flat',
      'Can Start After': 'sync_alt',
      'Must Start Together': 'sync'
    }

    return iconMap[dependencyType] || 'link'
  }

  /**
   * Get dependency type color
   * @param {string} dependencyType - Dependency type
   * @returns {string} Color name
   */
  getDependencyTypeColor(dependencyType) {
    const colorMap = {
      'Must Finish Before': 'negative',
      'Can Start After': 'primary',
      'Must Start Together': 'warning'
    }

    return colorMap[dependencyType] || 'grey'
  }

  /**
   * Get dependency strength icon
   * @param {string} strength - Dependency strength
   * @returns {string} Icon name
   */
  getDependencyStrengthIcon(strength) {
    return strength === 'Hard' ? 'lock' : 'lock_open'
  }

  /**
   * Format dependency for display
   * @param {Object} dependency - Dependency object
   * @returns {Object} Formatted dependency
   */
  formatDependencyDisplay(dependency) {
    return {
      ...dependency,
      typeIcon: this.getDependencyTypeIcon(dependency.dependencyType),
      typeColor: this.getDependencyTypeColor(dependency.dependencyType),
      strengthIcon: this.getDependencyStrengthIcon(dependency.dependencyStrength),
      lagDaysText: dependency.lagDays > 0 ? `+${dependency.lagDays} days` : null,
      canEdit: dependency.isActive && !dependency.overriddenBy,
      isOverridden: !!dependency.overriddenBy
    }
  }

  /**
   * Build dependency graph data
   * @param {Array} dependencies - Dependencies array
   * @param {Array} nodes - Nodes array
   * @returns {Object} Graph data
   */
  buildDependencyGraph(dependencies, nodes) {
    const graphNodes = nodes.map(node => ({
      id: node.recCode,
      label: node.nodeName,
      group: node.nodeType,
      level: node.treeLevel,
      status: node.status,
      completion: node.completionPercentage
    }))

    const graphEdges = dependencies.map(dep => ({
      from: dep.prerequisiteNodeId,
      to: dep.dependentNodeId,
      label: dep.dependencyType,
      color: this.getDependencyTypeColor(dep.dependencyType),
      dashes: dep.dependencyStrength === 'Soft',
      arrows: 'to'
    }))

    return {
      nodes: graphNodes,
      edges: graphEdges
    }
  }

  /**
   * Calculate critical path statistics
   * @param {Array} criticalPath - Critical path nodes
   * @returns {Object} Statistics
   */
  calculateCriticalPathStats(criticalPath) {
    if (!criticalPath || criticalPath.length === 0) {
      return {
        totalNodes: 0,
        totalDuration: 0,
        completedNodes: 0,
        averageCompletion: 0
      }
    }

    const stats = {
      totalNodes: criticalPath.length,
      totalDuration: 0,
      completedNodes: 0,
      totalCompletion: 0
    }

    criticalPath.forEach(node => {
      if (node.startDate && node.endDate) {
        const duration = this.calculateDuration(node.startDate, node.endDate)
        stats.totalDuration += duration
      }

      if (node.status === 'Completed') {
        stats.completedNodes++
      }

      stats.totalCompletion += node.completionPercentage || 0
    })

    stats.averageCompletion = stats.totalCompletion / stats.totalNodes

    return stats
  }

  /**
   * Calculate duration between dates
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @returns {number} Duration in days
   */
  calculateDuration(startDate, endDate) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end - start)
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Check if node can start based on dependencies
   * @param {Object} node - Node object
   * @param {Array} dependencies - Dependencies array
   * @param {Array} allNodes - All nodes array
   * @returns {Object} Can start result
   */
  canNodeStart(node, dependencies, allNodes) {
    const nodeDependencies = dependencies.filter(dep =>
      dep.dependentNodeId === node.recCode && dep.isActive
    )

    if (nodeDependencies.length === 0) {
      return { canStart: true, blockedBy: [] }
    }

    const blockedBy = []

    nodeDependencies.forEach(dep => {
      const prerequisite = allNodes.find(n => n.recCode === dep.prerequisiteNodeId)

      if (!prerequisite) return

      if (dep.dependencyType === 'Must Finish Before' &&
          prerequisite.completionPercentage < 100) {
        blockedBy.push({
          node: prerequisite,
          reason: `${prerequisite.nodeName} must be completed first`,
          dependency: dep
        })
      } else if (dep.dependencyType === 'Can Start After' &&
                 prerequisite.status === 'Not Started') {
        blockedBy.push({
          node: prerequisite,
          reason: `${prerequisite.nodeName} must be started first`,
          dependency: dep
        })
      }
    })

    return {
      canStart: blockedBy.length === 0,
      blockedBy
    }
  }
}

export default new DependencyService()
