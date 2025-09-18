// src/stores/project.js
import { defineStore } from 'pinia'
import projectService from 'src/services/api/project.service'
import stakeholderService from 'src/services/api/stakeholder.service'
import { showSuccess, showError } from 'src/utils/notification'

export const useProjectStore = defineStore('project', {
  state: () => ({
    // Projects list
    projects: [],
    totalProjects: 0,
    currentPage: 0,
    pageSize: 20,

    // Current project
    currentProject: null,
    currentNode: null,

    // Project tree
    projectTree: null,
    treeCache: new Map(),

    // Categories and node types
    categories: [],
    nodeTypes: [],

    // Loading states
    isLoading: false,
    isLoadingTree: false,
    isLoadingNode: false,

    // Assignment caching
    assignmentCache: new Map(),
    assignmentLastUpdated: new Map(),
    ASSIGNMENT_CACHE_TTL: 5 * 60 * 1000, // 5 minutes

    // Filters
    filters: {
      search: '',
      categoryId: null,
      status: null,
      managerId: null,
      dateRange: null
    },

    // Sort
    sortBy: 'insertDate',
    sortDirection: 'DESC',

    // Node path (breadcrumb)
    nodePath: [],

    // Recently viewed
    recentlyViewed: [],
    maxRecentItems: 10,

    // Node children cache
    nodeChildrenCache: new Map(),

    // Progress tracking
    progressUpdates: new Map()
  }),

  getters: {
    /**
     * Get filtered projects
     */
    filteredProjects: (state) => {
      let filtered = [...state.projects]

      // Apply search filter
      if (state.filters.search) {
        const search = state.filters.search.toLowerCase()
        filtered = filtered.filter(project =>
          project.nodeName.toLowerCase().includes(search) ||
          project.nodeDescription?.toLowerCase().includes(search)
        )
      }

      // Apply category filter
      if (state.filters.categoryId) {
        filtered = filtered.filter(project =>
          project.treeCategoryId === state.filters.categoryId
        )
      }

      // Apply status filter
      if (state.filters.status) {
        filtered = filtered.filter(project =>
          project.status === state.filters.status
        )
      }

      // Apply manager filter
      if (state.filters.managerId) {
        filtered = filtered.filter(project =>
          project.projectManagerId === state.filters.managerId
        )
      }

      return filtered
    },

    /**
     * Get projects grouped by status
     */
    projectsByStatus: (state) => {
      const groups = {}

      state.projects.forEach(project => {
        const status = project.status || 'Unknown'
        if (!groups[status]) {
          groups[status] = []
        }
        groups[status].push(project)
      })

      return groups
    },

    /**
     * Get project statistics
     */
    projectStatistics: (state) => {
      const stats = {
        total: state.projects.length,
        byStatus: {},
        byCategory: {},
        averageProgress: 0
      }

      let totalProgress = 0

      state.projects.forEach(project => {
        // Count by status
        const status = project.status || 'Unknown'
        stats.byStatus[status] = (stats.byStatus[status] || 0) + 1

        // Count by category
        const category = project.treeCategoryName || 'Uncategorized'
        stats.byCategory[category] = (stats.byCategory[category] || 0) + 1

        // Sum progress
        totalProgress += project.completionPercentage || 0
      })

      stats.averageProgress = stats.total > 0
        ? Math.round(totalProgress / stats.total)
        : 0

      return stats
    },

    /**
     * Check if project is loaded
     */
    isProjectLoaded: (state) => (projectId) => {
      return state.currentProject?.recCode === projectId
    },

    /**
     * Check if node is loaded
     */
    isNodeLoaded: (state) => (nodeId) => {
      return state.currentNode?.recCode === nodeId
    },

    /**
     * Get cached tree for project
     */
    getCachedTree: (state) => (projectId) => {
      return state.treeCache.get(projectId)
    },

    /**
     * Get cached children for node
     */
    getCachedChildren: (state) => (nodeId) => {
      return state.nodeChildrenCache.get(nodeId)
    },

    /**
     * Get node by ID from tree
     */
    getNodeFromTree: (state) => (nodeId) => {
      if (!state.projectTree) return null

      const findNode = (nodes) => {
        for (const node of nodes) {
          if (node.recCode === nodeId) return node
          if (node.children) {
            const found = findNode(node.children)
            if (found) return found
          }
        }
        return null
      }

      return findNode(state.projectTree)
    },

    /**
     * Get breadcrumb items
     */
    breadcrumbItems: (state) => {
      return state.nodePath.map((node, index) => ({
        label: node.nodeName,
        to: index === state.nodePath.length - 1
          ? null
          : `/projects/node/${node.recCode}`,
        icon: projectService.getNodeTypeIcon(node.nodeType)
      }))
    },

    /**
     * Check if can create child node
     */
    canCreateChild: (state) => {
      if (!state.currentNode) return false

      // Check node type restrictions
      const nodeTypeRestrictions = {
        'Unit': false, // Units cannot have children
        'Room': false  // Rooms cannot have children
      }

      return !nodeTypeRestrictions[state.currentNode.nodeType]
    }
  },

  actions: {
    /**
     * Fetch all projects
     */
    async fetchProjects(params = {}) {
      this.isLoading = true

      try {
        const queryParams = {
          page: params.page ?? this.currentPage,
          size: params.size ?? this.pageSize,
          sort: this.sortBy,
          direction: this.sortDirection
        }

        const response = await projectService.getAllProjects(queryParams)

        if (response.success) {
          this.projects = response.data.content
          this.totalProjects = response.data.totalElements
          this.currentPage = response.data.number
          this.pageSize = response.data.size
        }

        return response
      } catch (error) {
        showError('Failed to fetch projects')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Fetch single project
     */
    async fetchProject(projectId) {
      // Check if already loaded
      if (this.currentProject?.recCode === projectId) {
        return this.currentProject
      }

      this.isLoading = true

      try {
        const response = await projectService.getNodeById(projectId)

        if (response.success) {
          this.currentProject = response.data
          this.addToRecentlyViewed(response.data)
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch project')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Create new project
     */
    async createProject(projectData) {
      this.isLoading = true

      try {
        const response = await projectService.createProject(projectData)

        if (response.success) {
          this.projects.unshift(response.data)
          this.totalProjects++
          showSuccess('Project created successfully')
        }

        return response
      } catch (error) {
        showError('Failed to create project')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Update project
     */
    async updateProject(projectId, updateData) {
      this.isLoading = true

      try {
        const response = await projectService.updateNode(projectId, updateData)

        if (response.success) {
          // Update in list
          const index = this.projects.findIndex(p => p.recCode === projectId)
          if (index !== -1) {
            this.projects[index] = { ...this.projects[index], ...response.data }
          }

          // Update current project
          if (this.currentProject?.recCode === projectId) {
            this.currentProject = { ...this.currentProject, ...response.data }
          }

          showSuccess('Project updated successfully')
        }

        return response
      } catch (error) {
        showError('Failed to update project')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Delete project
     */
    async deleteProject(projectId) {
      // Check if can delete
      const canDeleteResponse = await projectService.canDeleteNode(projectId)

      if (!canDeleteResponse.data.canDelete) {
        showError(canDeleteResponse.data.reason || 'Cannot delete this project')
        return false
      }

      this.isLoading = true

      try {
        await projectService.deleteNode(projectId)

        // Remove from list
        this.projects = this.projects.filter(p => p.recCode !== projectId)
        this.totalProjects--

        // Clear current if deleted
        if (this.currentProject?.recCode === projectId) {
          this.currentProject = null
        }

        // Clear caches
        this.treeCache.delete(projectId)

        showSuccess('Project deleted successfully')
        return true
      } catch (error) {
        showError('Failed to delete project')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Fetch project tree
     */
    async fetchProjectTree(projectId, force = false) {
      // Check cache
      if (!force && this.treeCache.has(projectId)) {
        this.projectTree = this.treeCache.get(projectId)
        return this.projectTree
      }

      this.isLoadingTree = true

      try {
        const response = await projectService.getProjectTree(projectId)

        if (response.success) {
          this.projectTree = response.data
          this.treeCache.set(projectId, response.data)
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch project tree')
        throw error
      } finally {
        this.isLoadingTree = false
      }
    },

    /**
     * Fetch node by ID
     */
    async fetchNode(nodeId) {
      if (this.currentNode?.recCode === nodeId) {
        return this.currentNode
      }

      this.isLoadingNode = true

      try {
        const response = await projectService.getNodeById(nodeId)

        if (response.success) {
          this.currentNode = response.data
          this.addToRecentlyViewed(response.data)

          // Fetch ancestors for breadcrumb
          await this.fetchNodePath(nodeId)
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch node')
        throw error
      } finally {
        this.isLoadingNode = false
      }
    },

    /**
     * Create node
     */
    async createNode(nodeData) {
      this.isLoading = true

      try {
        const response = await projectService.createNode(nodeData)

        if (response.success) {
          // Invalidate parent's children cache
          this.nodeChildrenCache.delete(nodeData.parentRecCode)

          // Invalidate tree cache
          // const projectId = this.currentProject?.recCode || nodeData.projectId
          const projectId = this.currentProject?.recCode || nodeData.parentNodeId || this.getProjectIdFromNode(nodeData.parentNodeId)
          this.treeCache.delete(projectId)

          // If the parent is currently loaded, add the new node to its children
          if (nodeData.parentNodeId && this.nodeChildrenCache.has(nodeData.parentNodeId)) {
            const parentChildren = this.nodeChildrenCache.get(nodeData.parentNodeId)
            parentChildren.push(response.data)
            this.nodeChildrenCache.set(nodeData.parentNodeId, parentChildren)
          }

          showSuccess('Node created successfully')
        }

        return response
      } catch (error) {
        showError('Failed to create node')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async getProjectIdFromNode(nodeId) {
      try {
        const ancestors = await projectService.getNodeAncestors(nodeId)
        if (ancestors.success && ancestors.data.length > 0) {
          // Root node is the project
          return ancestors.data[0].recCode
        }
      } catch (error) {
        console.error('Failed to get project ID from node:', error)
      }
      return null
    },

    /**
     * Update node
     */
    async updateNode(nodeId, updateData) {
      this.isLoading = true

      try {
        const response = await projectService.updateNode(nodeId, updateData)

        if (response.success) {
          // Update current node
          if (this.currentNode?.recCode === nodeId) {
            this.currentNode = { ...this.currentNode, ...response.data }
          }

          // Invalidate caches
          const projectId = this.currentProject?.recCode
          if (projectId) {
            this.treeCache.delete(projectId)
          }

          showSuccess('Node updated successfully')
        }

        return response
      } catch (error) {
        showError('Failed to update node')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Delete node
     */
    async deleteNode(nodeId) {
      // Check if can delete
      const canDeleteResponse = await projectService.canDeleteNode(nodeId)

      if (!canDeleteResponse.data.canDelete) {
        showError(canDeleteResponse.data.reason || 'Cannot delete this node')
        return false
      }

      this.isLoading = true

      try {
        await projectService.deleteNode(nodeId)

        // Clear current if deleted
        if (this.currentNode?.recCode === nodeId) {
          this.currentNode = null
        }

        // Invalidate caches
        const projectId = this.currentProject?.recCode
        if (projectId) {
          this.treeCache.delete(projectId)
        }

        showSuccess('Node deleted successfully')
        return true
      } catch (error) {
        showError('Failed to delete node')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Fetch node children
     */
    async fetchNodeChildren(nodeId, force = false) {
      // Check cache
      if (!force && this.nodeChildrenCache.has(nodeId)) {
        return this.nodeChildrenCache.get(nodeId)
      }

      try {
        const response = await projectService.getNodeChildren(nodeId)

        if (response.success) {
          this.nodeChildrenCache.set(nodeId, response.data)
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch node children')
        throw error
      }
    },

    /**
     * Fetch node path (ancestors)
     */
    async fetchNodePath(nodeId) {
      try {
        const response = await projectService.getNodeAncestors(nodeId)

        if (response.success) {
          // Build path from root to current
          this.nodePath = [...response.data]

          // Add current node
          if (this.currentNode) {
            this.nodePath.push(this.currentNode)
          }
        }

        return this.nodePath
      } catch (error) {
        console.error('Failed to fetch node path:', error)
        this.nodePath = []
      }
    },

    /**
     * Update node progress
     */
    async updateNodeProgress(nodeId, progress) {
      try {
        await projectService.updateNodeProgress(nodeId, progress)

        // Update local state
        if (this.currentNode?.recCode === nodeId) {
          this.currentNode.completionPercentage = progress
        }

        // Track progress update
        this.progressUpdates.set(nodeId, {
          progress,
          timestamp: new Date()
        })

        showSuccess('Progress updated')
        return true
      } catch (error) {
        showError('Failed to update progress')
        throw error
      }
    },

    /**
     * Update node status
     */
    async updateNodeStatus(nodeId, status) {
      try {
        await projectService.updateNodeStatus(nodeId, status)

        // Update local state
        if (this.currentNode?.recCode === nodeId) {
          this.currentNode.status = status
        }

        // Update in projects list if it's a project
        const projectIndex = this.projects.findIndex(p => p.recCode === nodeId)
        if (projectIndex !== -1) {
          this.projects[projectIndex].status = status
        }

        showSuccess('Status updated')
        return true
      } catch (error) {
        showError('Failed to update status')
        throw error
      }
    },

    /**
     * Search nodes
     */
    async searchNodes(query, options = {}) {
      try {
        const response = await projectService.searchNodes(query, options)
        return response.data
      } catch (error) {
        showError('Search failed')
        throw error
      }
    },

    /**
     * Fetch categories
     */
    async fetchCategories() {
      if (this.categories.length > 0) {
        return this.categories
      }

      try {
        const response = await projectService.getAllTreeCategories()

        if (response.success) {
          this.categories = response.data
        }

        return response.data
      } catch (error) {
        console.error('Failed to fetch categories:', error)
        return []
      }
    },

    /**
     * Fetch node types
     */
    async fetchNodeTypes() {
      if (this.nodeTypes.length > 0) {
        return this.nodeTypes
      }

      try {
        const response = await projectService.getAllNodeTypes()

        if (response.success) {
          this.nodeTypes = response.data
        }

        return response.data
      } catch (error) {
        console.error('Failed to fetch node types:', error)
        return []
      }
    },

    /**
     * Set filters
     */
    setFilters(filters) {
      this.filters = { ...this.filters, ...filters }
    },

    /**
     * Clear filters
     */
    clearFilters() {
      this.filters = {
        search: '',
        categoryId: null,
        status: null,
        managerId: null,
        dateRange: null
      }
    },

    /**
     * Set sort
     */
    setSort(sortBy, direction = null) {
      this.sortBy = sortBy

      if (direction) {
        this.sortDirection = direction
      } else {
        // Toggle direction if same field
        if (this.sortBy === sortBy) {
          this.sortDirection = this.sortDirection === 'ASC' ? 'DESC' : 'ASC'
        } else {
          this.sortDirection = 'ASC'
        }
      }

      // Re-fetch with new sort
      this.fetchProjects()
    },

    /**
     * Add to recently viewed
     */
    addToRecentlyViewed(node) {
      // Remove if already exists
      this.recentlyViewed = this.recentlyViewed.filter(
        item => item.recCode !== node.recCode
      )

      // Add to beginning
      this.recentlyViewed.unshift({
        recCode: node.recCode,
        nodeName: node.nodeName,
        nodeType: node.nodeType,
        projectId: node.projectId || node.recCode,
        viewedAt: new Date()
      })

      // Limit size
      if (this.recentlyViewed.length > this.maxRecentItems) {
        this.recentlyViewed = this.recentlyViewed.slice(0, this.maxRecentItems)
      }

      // Persist to localStorage
      localStorage.setItem('recentlyViewedNodes', JSON.stringify(this.recentlyViewed))
    },

    /**
     * Load recently viewed from storage
     */
    loadRecentlyViewed() {
      const stored = localStorage.getItem('recentlyViewedNodes')
      if (stored) {
        try {
          this.recentlyViewed = JSON.parse(stored)
        } catch (error) {
          console.error('Error loading recently viewed:', error)
        }
      }
    },

    /**
     * Clear cache
     */
    clearCache() {
      this.treeCache.clear()
      this.nodeChildrenCache.clear()
      this.progressUpdates.clear()
    },

    /**
     * Clear cache for specific project
     */
    clearProjectCache(projectId) {
      this.treeCache.delete(projectId)

      // Clear all node children cache entries for this project
      // Note: This is a simple approach - you might want to be more selective
      const keysToDelete = []
      for (const [nodeId] of this.nodeChildrenCache.entries()) {
        // You could implement logic to check if nodeId belongs to projectId
        // For now, we'll clear all to be safe
        keysToDelete.push(nodeId)
      }
      keysToDelete.forEach(key => this.nodeChildrenCache.delete(key))
    },

    /**
     * Fetch assignments for node with caching
     */
    async fetchNodeAssignments(nodeId, force = false) {
      const cacheKey = `assignments_${nodeId}`
      const lastUpdated = this.assignmentLastUpdated.get(cacheKey)
      const now = Date.now()

      // Check cache validity
      if (!force && this.assignmentCache.has(cacheKey) && lastUpdated) {
        if (now - lastUpdated < this.ASSIGNMENT_CACHE_TTL) {
          return this.assignmentCache.get(cacheKey)
        }
      }

      try {
        const response = await stakeholderService.getUnifiedAssignmentsForNode(nodeId)

        if (response.success) {
          this.assignmentCache.set(cacheKey, response.data)
          this.assignmentLastUpdated.set(cacheKey, now)
        }

        return response.data
      } catch (error) {
        console.error('Failed to fetch node assignments:', error)
        throw error
      }
    },

    /**
     * Create assignment and update cache
     */
    async createAssignment(assignmentData) {
      try {
        const response = await stakeholderService.createUnifiedAssignment(assignmentData)

        if (response.success) {
          // Invalidate cache for the node
          this.invalidateAssignmentCache(assignmentData.nodeId)

          showSuccess('Assignment created successfully')
        }

        return response
      } catch (error) {
        showError('Failed to create assignment')
        throw error
      }
    },

    /**
     * Update assignment and refresh cache
     */
    async updateAssignment(assignmentId, assignmentData) {
      try {
        const response = await stakeholderService.updateUnifiedAssignment(assignmentId, assignmentData)

        if (response.success) {
          // Invalidate cache for the node
          this.invalidateAssignmentCache(assignmentData.nodeId)

          showSuccess('Assignment updated successfully')
        }

        return response
      } catch (error) {
        showError('Failed to update assignment')
        throw error
      }
    },

    /**
     * Delete assignment and update cache
     */
    async deleteAssignment(assignmentId, nodeId) {
      try {
        await stakeholderService.deleteUnifiedAssignment(assignmentId)

        // Invalidate cache for the node
        this.invalidateAssignmentCache(nodeId)

        showSuccess('Assignment deleted successfully')
        return true
      } catch (error) {
        showError('Failed to delete assignment')
        throw error
      }
    },

    /**
     * Invalidate assignment cache for specific node
     */
    invalidateAssignmentCache(nodeId) {
      const cacheKey = `assignments_${nodeId}`
      this.assignmentCache.delete(cacheKey)
      this.assignmentLastUpdated.delete(cacheKey)
    },

    /**
     * Clear all assignment cache
     */
    clearAssignmentCache() {
      this.assignmentCache.clear()
      this.assignmentLastUpdated.clear()
    },

    /**
     * Reset store
     */
    resetStore() {
      this.$reset()
      this.clearCache()
    }
  }
})
