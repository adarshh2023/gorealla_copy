// src/stores/indents.js
import { defineStore } from 'pinia'
import indentsService from 'src/services/api/indents.service'
import { showSuccess, showError } from 'src/utils/notification'

export const useIndentsStore = defineStore('indents', {
  state: () => ({
    // Indents list
    indents: [],
    totalIndents: 0,
    currentPage: 0,
    pageSize: 20,

    // Current indent
    currentIndent: null,

    // Categorized indents
    pendingIndents: [],
    urgentIndents: [],
    overdueIndents: [],
    recentIndents: [],

    // Current indent items
    currentIndentItems: [],

    // Loading states
    isLoading: false,
    isLoadingItems: false,
    isLoadingApproval: false,
    isSubmittingBulk: false,

    // Filters
    filters: {
      search: '',
      projectNodeId: null,
      indentStatus: null,
      approvalStatus: null,
      procurementStatus: null,
      priority: null,
      isUrgent: null,
      requestedById: null,
      locationId: null,
      budgetCode: null,
      dateRange: null
    },

    // Sort
    sortBy: 'insertDate',
    sortDirection: 'DESC',

    // Cache
    indentsCache: new Map(),
    itemsCache: new Map(),
    statisticsCache: new Map(),

    // Cache TTL (5 minutes for indents as they change frequently)
    CACHE_TTL: 5 * 60 * 1000,
    cacheTimestamps: new Map(),

    // Statistics
    dashboardMetrics: null,
    indentStatistics: null,
    approvalStatistics: null
  }),

  getters: {
    /**
     * Get filtered indents
     */
    filteredIndents: (state) => {
      let filtered = [...state.indents]

      // Apply search filter
      if (state.filters.search) {
        const search = state.filters.search.toLowerCase()
        filtered = filtered.filter(indent =>
          indent.indentTitle.toLowerCase().includes(search) ||
          indent.indentNumber?.toLowerCase().includes(search) ||
          indent.indentDescription?.toLowerCase().includes(search) ||
          indent.requestedByName?.toLowerCase().includes(search)
        )
      }

      // Apply project filter
      if (state.filters.projectNodeId) {
        filtered = filtered.filter(indent =>
          indent.projectNodeId === state.filters.projectNodeId
        )
      }

      // Apply status filters
      if (state.filters.indentStatus) {
        filtered = filtered.filter(indent =>
          indent.indentStatus === state.filters.indentStatus
        )
      }

      if (state.filters.approvalStatus) {
        filtered = filtered.filter(indent =>
          indent.approvalStatus === state.filters.approvalStatus
        )
      }

      if (state.filters.procurementStatus) {
        filtered = filtered.filter(indent =>
          indent.procurementStatus === state.filters.procurementStatus
        )
      }

      // Apply priority filter
      if (state.filters.priority) {
        filtered = filtered.filter(indent =>
          indent.priority === state.filters.priority
        )
      }

      // Apply urgent filter
      if (state.filters.isUrgent !== null) {
        filtered = filtered.filter(indent =>
          indent.isUrgent === state.filters.isUrgent
        )
      }

      // Apply requestor filter
      if (state.filters.requestedById) {
        filtered = filtered.filter(indent =>
          indent.requestedById === state.filters.requestedById
        )
      }

      // Apply location filter
      if (state.filters.locationId) {
        filtered = filtered.filter(indent =>
          indent.locationId === state.filters.locationId
        )
      }

      // Apply budget code filter
      if (state.filters.budgetCode) {
        filtered = filtered.filter(indent =>
          indent.budgetCode === state.filters.budgetCode
        )
      }

      // Apply date range filter
      if (state.filters.dateRange && state.filters.dateRange.from && state.filters.dateRange.to) {
        const fromDate = new Date(state.filters.dateRange.from)
        const toDate = new Date(state.filters.dateRange.to)

        filtered = filtered.filter(indent => {
          const requestedDate = new Date(indent.requestedDate)
          return requestedDate >= fromDate && requestedDate <= toDate
        })
      }

      return filtered
    },

    /**
     * Get indents grouped by status
     */
    indentsByStatus: (state) => {
      const groups = {}
      state.indents.forEach(indent => {
        const status = indent.indentStatus || 'Unknown'
        if (!groups[status]) {
          groups[status] = []
        }
        groups[status].push(indent)
      })
      return groups
    },

    /**
     * Get indents grouped by project
     */
    indentsByProject: (state) => {
      const groups = {}
      state.indents.forEach(indent => {
        const project = indent.projectNodeName || 'Unassigned'
        if (!groups[project]) {
          groups[project] = []
        }
        groups[project].push(indent)
      })
      return groups
    },

    /**
     * Get indents statistics
     */
    indentStatisticsComputed: (state) => {
      const stats = {
        total: state.indents.length,
        byStatus: {},
        byPriority: {},
        byApprovalStatus: {},
        totalEstimatedBudget: 0,
        averageItemsPerIndent: 0,
        urgentCount: 0,
        overdueCount: 0
      }

      let totalItems = 0
      const currentDate = new Date()

      state.indents.forEach(indent => {
        // Count by status
        const status = indent.indentStatus || 'Unknown'
        stats.byStatus[status] = (stats.byStatus[status] || 0) + 1

        // Count by priority
        const priority = indent.priority || 'Normal'
        stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1

        // Count by approval status
        const approvalStatus = indent.approvalStatus || 'Pending'
        stats.byApprovalStatus[approvalStatus] = (stats.byApprovalStatus[approvalStatus] || 0) + 1

        // Sum budget
        if (indent.estimatedBudget) {
          stats.totalEstimatedBudget += parseFloat(indent.estimatedBudget)
        }

        // Count items
        if (indent.totalItemsCount) {
          totalItems += indent.totalItemsCount
        }

        // Count urgent
        if (indent.isUrgent) {
          stats.urgentCount++
        }

        // Count overdue
        if (indentsService.isIndentOverdue(indent)) {
          stats.overdueCount++
        }
      })

      stats.averageItemsPerIndent = stats.total > 0
        ? Math.round((totalItems / stats.total) * 100) / 100
        : 0

      return stats
    },

    /**
     * Check if indent is loaded
     */
    isIndentLoaded: (state) => (indentId) => {
      return state.currentIndent?.recCode === indentId ||
             state.indentsCache.has(indentId)
    },

    /**
     * Get cached indent
     */
    getCachedIndent: (state) => (indentId) => {
      return state.indentsCache.get(indentId)
    },

    /**
     * Get indents for dropdown/selection
     */
    indentsForSelection: (state) => {
      return state.indents.map(indent => ({
        label: indentsService.formatIndentDisplayName(indent),
        value: indent.recCode,
        ...indent
      }))
    },

    /**
     * Get active indents for selection
     */
    activeIndentsForSelection: (state) => {
      return state.indents
        .filter(indent => !['Completed', 'Cancelled'].includes(indent.indentStatus))
        .map(indent => ({
          label: indentsService.formatIndentDisplayName(indent),
          value: indent.recCode,
          ...indent
        }))
    },

    /**
     * Get current indent completion percentage
     */
    currentIndentCompletionPercentage: (state) => {
      if (!state.currentIndent) return 0
      return indentsService.calculateCompletionPercentage(state.currentIndent)
    },

    /**
     * Check if current indent is overdue
     */
    isCurrentIndentOverdue: (state) => {
      if (!state.currentIndent) return false
      return indentsService.isIndentOverdue(state.currentIndent)
    }
  },

  actions: {
    /**
     * Fetch all indents
     */
    async fetchIndents(params = {}) {
      this.isLoading = true

      try {
        const queryParams = {
          page: params.page ?? this.currentPage,
          size: params.size ?? this.pageSize,
          sort: this.sortBy,
          direction: this.sortDirection,
          ...params
        }

        const response = await indentsService.getAllIndents(queryParams)

        if (response.success) {
          this.indents = response.data.content || response.data
          this.totalIndents = response.data.totalElements || this.indents.length
          this.currentPage = response.data.number || 0
          this.pageSize = response.data.size || this.pageSize

          // Cache indents
          this.indents.forEach(indent => {
            this.indentsCache.set(indent.recCode, indent)
            this.cacheTimestamps.set(indent.recCode, Date.now())
          })
        }

        return response
      } catch (error) {
        showError('Failed to fetch indents')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Fetch single indent
     */
    async fetchIndent(indentId) {
      // Check cache first
      if (this.isValidCache(indentId)) {
        this.currentIndent = this.indentsCache.get(indentId)
        return this.currentIndent
      }

      this.isLoading = true

      try {
        const response = await indentsService.getIndentById(indentId)

        if (response.success) {
          this.currentIndent = response.data
          this.indentsCache.set(indentId, response.data)
          this.cacheTimestamps.set(indentId, Date.now())

          // Also fetch items if included
          if (response.data.indentItems) {
            this.currentIndentItems = response.data.indentItems
          }
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch indent')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Fetch indent by number
     */
    async fetchIndentByNumber(indentNumber) {
      this.isLoading = true

      try {
        const response = await indentsService.getIndentByNumber(indentNumber)

        if (response.success) {
          this.currentIndent = response.data
          this.indentsCache.set(response.data.recCode, response.data)
          this.cacheTimestamps.set(response.data.recCode, Date.now())
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch indent by number')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Create indent
     */
    async createIndent(indentData) {
      this.isLoading = true

      try {
        const response = await indentsService.createIndent(indentData)

        if (response.success) {
          this.indents.unshift(response.data)
          this.totalIndents++
          this.indentsCache.set(response.data.recCode, response.data)
          this.cacheTimestamps.set(response.data.recCode, Date.now())

          showSuccess('Indent created successfully')
        }

        return response
      } catch (error) {
        showError('Failed to create indent')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Update indent
     */
    async updateIndent(indentId, updateData) {
      this.isLoading = true

      try {
        const response = await indentsService.updateIndent(indentId, updateData)

        if (response.success) {
          // Update in list
          const index = this.indents.findIndex(i => i.recCode === indentId)
          if (index !== -1) {
            this.indents[index] = { ...this.indents[index], ...response.data }
          }

          // Update current indent
          if (this.currentIndent?.recCode === indentId) {
            this.currentIndent = { ...this.currentIndent, ...response.data }
          }

          // Update cache
          this.indentsCache.set(indentId, response.data)
          this.cacheTimestamps.set(indentId, Date.now())

          showSuccess('Indent updated successfully')
        }

        return response
      } catch (error) {
        showError('Failed to update indent')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Delete indent
     */
    async deleteIndent(indentId) {
      this.isLoading = true

      try {
        await indentsService.deleteIndent(indentId)

        // Remove from list
        this.indents = this.indents.filter(i => i.recCode !== indentId)
        this.totalIndents--

        // Clear current if deleted
        if (this.currentIndent?.recCode === indentId) {
          this.currentIndent = null
          this.currentIndentItems = []
        }

        // Clear cache
        this.indentsCache.delete(indentId)
        this.cacheTimestamps.delete(indentId)
        this.itemsCache.delete(indentId)

        showSuccess('Indent deleted successfully')
        return true
      } catch (error) {
        showError('Failed to delete indent')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Search indents
     */
    async searchIndents(searchTerm, params = {}) {
      this.isLoading = true

      try {
        const response = await indentsService.searchIndents(searchTerm, params)

        if (response.success) {
          this.indents = response.data.content || response.data
          this.totalIndents = response.data.totalElements || this.indents.length
        }

        return response
      } catch (error) {
        showError('Search failed')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Advanced search with filters
     */
    async searchIndentsWithFilters(searchRequest, params = {}) {
      this.isLoading = true

      try {
        const response = await indentsService.searchIndentsWithFilters(searchRequest, params)

        if (response.success) {
          this.indents = response.data.content || response.data
          this.totalIndents = response.data.totalElements || this.indents.length
        }

        return response
      } catch (error) {
        showError('Advanced search failed')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Fetch indents by project
     */
    async fetchIndentsByProject(projectNodeId, params = {}) {
      try {
        const response = await indentsService.getIndentsByProject(projectNodeId, params)
        return response.data
      } catch (error) {
        showError('Failed to fetch project indents')
        throw error
      }
    },

    /**
     * Fetch indents by requestor
     */
    async fetchIndentsByRequestor(requestorId, params = {}) {
      try {
        const response = await indentsService.getIndentsByRequestor(requestorId, params)
        return response.data
      } catch (error) {
        showError('Failed to fetch requestor indents')
        throw error
      }
    },

    // === Status-based Operations ===

    /**
     * Fetch pending indents
     */
    async fetchPendingIndents(force = false) {
      if (!force && this.pendingIndents.length > 0) {
        return this.pendingIndents
      }

      try {
        const response = await indentsService.getPendingIndents()

        if (response.success) {
          this.pendingIndents = response.data
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch pending indents')
        throw error
      }
    },

    /**
     * Fetch urgent indents
     */
    async fetchUrgentIndents(force = false) {
      if (!force && this.urgentIndents.length > 0) {
        return this.urgentIndents
      }

      try {
        const response = await indentsService.getUrgentIndents()

        if (response.success) {
          this.urgentIndents = response.data
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch urgent indents')
        throw error
      }
    },

    /**
     * Fetch overdue indents
     */
    async fetchOverdueIndents(force = false) {
      if (!force && this.overdueIndents.length > 0) {
        return this.overdueIndents
      }

      try {
        const response = await indentsService.getOverdueIndents()

        if (response.success) {
          this.overdueIndents = response.data
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch overdue indents')
        throw error
      }
    },

    // === Approval Operations ===

    /**
     * Submit indent for approval
     */
    async submitForApproval(indentId) {
      this.isLoadingApproval = true

      try {
        const response = await indentsService.submitForApproval(indentId)

        if (response.success) {
          // Update local state
          this.updateIndentInState(indentId, {
            indentStatus: 'Submitted',
            approvalStatus: 'Pending'
          })

          showSuccess('Indent submitted for approval successfully')
        }

        return response
      } catch (error) {
        showError('Failed to submit indent for approval')
        throw error
      } finally {
        this.isLoadingApproval = false
      }
    },

    /**
     * Approve indent
     */
    async approveIndent(indentId, approvalNotes = null) {
      this.isLoadingApproval = true

      try {
        const response = await indentsService.approveIndent(indentId, approvalNotes)

        if (response.success) {
          // Update local state
          this.updateIndentInState(indentId, {
            approvalStatus: 'Approved',
            indentStatus: 'Processing'
          })

          showSuccess('Indent approved successfully')
        }

        return response
      } catch (error) {
        showError('Failed to approve indent')
        throw error
      } finally {
        this.isLoadingApproval = false
      }
    },

    /**
     * Reject indent
     */
    async rejectIndent(indentId, rejectionReason) {
      this.isLoadingApproval = true

      try {
        const response = await indentsService.rejectIndent(indentId, rejectionReason)

        if (response.success) {
          // Update local state
          this.updateIndentInState(indentId, {
            approvalStatus: 'Rejected',
            rejectionReason
          })

          showSuccess('Indent rejected successfully')
        }

        return response
      } catch (error) {
        showError('Failed to reject indent')
        throw error
      } finally {
        this.isLoadingApproval = false
      }
    },

    /**
     * Cancel indent
     */
    async cancelIndent(indentId, cancellationReason) {
      this.isLoadingApproval = true

      try {
        const response = await indentsService.cancelIndent(indentId, cancellationReason)

        if (response.success) {
          // Update local state
          this.updateIndentInState(indentId, {
            indentStatus: 'Cancelled',
            approvalStatus: 'Cancelled'
          })

          showSuccess('Indent cancelled successfully')
        }

        return response
      } catch (error) {
        showError('Failed to cancel indent')
        throw error
      } finally {
        this.isLoadingApproval = false
      }
    },

    // === Budget Operations ===

    /**
     * Approve budget
     */
    async approveBudget(indentId, budgetApprovalNotes = null) {
      try {
        const response = await indentsService.approveBudget(indentId, budgetApprovalNotes)

        if (response.success) {
          // Update local state
          this.updateIndentInState(indentId, {
            isBudgetApproved: true
          })

          showSuccess('Budget approved successfully')
        }

        return response
      } catch (error) {
        showError('Failed to approve budget')
        throw error
      }
    },

    /**
     * Update budget information
     */
    async updateBudgetInformation(indentId, estimatedBudget = null, budgetCode = null) {
      try {
        const response = await indentsService.updateBudgetInformation(indentId, estimatedBudget, budgetCode)

        if (response.success) {
          // Update local state
          const updateData = {}
          if (estimatedBudget !== null) updateData.estimatedBudget = estimatedBudget
          if (budgetCode !== null) updateData.budgetCode = budgetCode

          this.updateIndentInState(indentId, updateData)

          showSuccess('Budget information updated successfully')
        }

        return response
      } catch (error) {
        showError('Failed to update budget information')
        throw error
      }
    },

    // === Indent Items Operations ===

    /**
     * Fetch indent items
     */
    async fetchIndentItems(indentId, force = false) {
      if (!force && this.itemsCache.has(indentId)) {
        this.currentIndentItems = this.itemsCache.get(indentId)
        return this.currentIndentItems
      }

      this.isLoadingItems = true

      try {
        const response = await indentsService.getIndentItems(indentId)

        if (response.success) {
          this.currentIndentItems = response.data
          this.itemsCache.set(indentId, response.data)
          this.cacheTimestamps.set(`items_${indentId}`, Date.now())
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch indent items')
        throw error
      } finally {
        this.isLoadingItems = false
      }
    },

    /**
     * Add indent item
     */
    async addIndentItem(indentId, itemData) {
      this.isLoadingItems = true

      try {
        const response = await indentsService.addIndentItem(indentId, itemData)

        if (response.success) {
          // Add to current items if this indent is loaded
          if (this.currentIndent?.recCode === indentId) {
            this.currentIndentItems.push(response.data)
          }

          // Clear cache to force refresh
          this.itemsCache.delete(indentId)

          // Update indent totals
          this.updateIndentItemCounts(indentId, 1, 0)

          showSuccess('Item added successfully')
        }

        return response
      } catch (error) {
        showError('Failed to add item')
        throw error
      } finally {
        this.isLoadingItems = false
      }
    },

    /**
     * Update indent item
     */
    async updateIndentItem(indentId, itemId, itemData) {
      this.isLoadingItems = true

      try {
        const response = await indentsService.updateIndentItem(indentId, itemId, itemData)

        if (response.success) {
          // Update in current items if loaded
          const itemIndex = this.currentIndentItems.findIndex(item => item.recCode === itemId)
          if (itemIndex !== -1) {
            this.currentIndentItems[itemIndex] = { ...this.currentIndentItems[itemIndex], ...response.data }
          }

          showSuccess('Item updated successfully')
        }

        return response
      } catch (error) {
        showError('Failed to update item')
        throw error
      } finally {
        this.isLoadingItems = false
      }
    },

    /**
     * Remove indent item
     */
    async removeIndentItem(indentId, itemId) {
      this.isLoadingItems = true

      try {
        await indentsService.removeIndentItem(indentId, itemId)

        // Remove from current items if loaded
        this.currentIndentItems = this.currentIndentItems.filter(item => item.recCode !== itemId)

        // Update indent totals
        this.updateIndentItemCounts(indentId, -1, 0)

        showSuccess('Item removed successfully')
        return true
      } catch (error) {
        showError('Failed to remove item')
        throw error
      } finally {
        this.isLoadingItems = false
      }
    },

    /**
     * Approve indent item
     */
    async approveIndentItem(itemId, approvedQuantity = null, approvalNotes = null) {
      try {
        const response = await indentsService.approveIndentItem(itemId, approvedQuantity, approvalNotes)

        if (response.success) {
          // Update in current items if loaded
          const itemIndex = this.currentIndentItems.findIndex(item => item.recCode === itemId)
          if (itemIndex !== -1) {
            this.currentIndentItems[itemIndex].isApproved = true
            if (approvedQuantity !== null) {
              this.currentIndentItems[itemIndex].approvedQuantity = approvedQuantity
            }
          }

          showSuccess('Item approved successfully')
        }

        return response
      } catch (error) {
        showError('Failed to approve item')
        throw error
      }
    },

    /**
     * Update item processing status
     */
    async updateItemProcessingStatus(itemId, processingStatus) {
      try {
        const response = await indentsService.updateItemProcessingStatus(itemId, processingStatus)

        if (response.success) {
          // Update in current items if loaded
          const itemIndex = this.currentIndentItems.findIndex(item => item.recCode === itemId)
          if (itemIndex !== -1) {
            this.currentIndentItems[itemIndex].processingStatus = processingStatus
          }

          showSuccess('Item status updated successfully')
        }

        return response
      } catch (error) {
        showError('Failed to update item status')
        throw error
      }
    },

    // === Bulk Operations ===

    /**
     * Bulk approve items
     */
    async bulkApproveItems(indentId, itemIds, approvalNotes = null) {
      this.isSubmittingBulk = true

      try {
        await indentsService.bulkApproveItems(indentId, itemIds, approvalNotes)

        // Update local state
        itemIds.forEach(itemId => {
          const itemIndex = this.currentIndentItems.findIndex(item => item.recCode === itemId)
          if (itemIndex !== -1) {
            this.currentIndentItems[itemIndex].isApproved = true
          }
        })

        showSuccess(`${itemIds.length} items approved successfully`)
        return true
      } catch (error) {
        showError('Failed to bulk approve items')
        throw error
      } finally {
        this.isSubmittingBulk = false
      }
    },

    /**
     * Bulk update item status
     */
    async bulkUpdateItemStatus(indentId, itemIds, processingStatus) {
      this.isSubmittingBulk = true

      try {
        await indentsService.bulkUpdateItemStatus(indentId, itemIds, processingStatus)

        // Update local state
        itemIds.forEach(itemId => {
          const itemIndex = this.currentIndentItems.findIndex(item => item.recCode === itemId)
          if (itemIndex !== -1) {
            this.currentIndentItems[itemIndex].processingStatus = processingStatus
          }
        })

        showSuccess(`${itemIds.length} item statuses updated successfully`)
        return true
      } catch (error) {
        showError('Failed to bulk update item status')
        throw error
      } finally {
        this.isSubmittingBulk = false
      }
    },

    /**
     * Bulk assign vendor
     */
    async bulkAssignVendor(itemIds, vendorId) {
      this.isSubmittingBulk = true

      try {
        await indentsService.bulkAssignVendor(itemIds, vendorId)

        // Update local state
        itemIds.forEach(itemId => {
          const itemIndex = this.currentIndentItems.findIndex(item => item.recCode === itemId)
          if (itemIndex !== -1) {
            this.currentIndentItems[itemIndex].preferredVendorId = vendorId
          }
        })

        showSuccess(`Vendor assigned to ${itemIds.length} items successfully`)
        return true
      } catch (error) {
        showError('Failed to bulk assign vendor')
        throw error
      } finally {
        this.isSubmittingBulk = false
      }
    },

    // === Statistics and Analytics ===

    /**
     * Fetch dashboard metrics
     */
    async fetchDashboardMetrics(userId = null, force = false) {
      if (!force && this.dashboardMetrics) {
        return this.dashboardMetrics
      }

      try {
        const response = await indentsService.getDashboardMetrics(userId)

        if (response.success) {
          this.dashboardMetrics = response.data
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch dashboard metrics')
        throw error
      }
    },

    /**
     * Fetch indent statistics
     */
    async fetchIndentStatistics(projectNodeId = null, force = false) {
      const cacheKey = `indent_stats_${projectNodeId || 'all'}`

      if (!force && this.statisticsCache.has(cacheKey)) {
        return this.statisticsCache.get(cacheKey)
      }

      try {
        const response = await indentsService.getIndentStatistics(projectNodeId)

        if (response.success) {
          this.indentStatistics = response.data
          this.statisticsCache.set(cacheKey, response.data)
          this.cacheTimestamps.set(cacheKey, Date.now())
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch indent statistics')
        throw error
      }
    },

    /**
     * Fetch approval statistics
     */
    async fetchApprovalStatistics(force = false) {
      if (!force && this.approvalStatistics) {
        return this.approvalStatistics
      }

      try {
        const response = await indentsService.getApprovalStatistics()

        if (response.success) {
          this.approvalStatistics = response.data
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch approval statistics')
        throw error
      }
    },

    // === Utility Actions ===

    /**
     * Generate indent number
     */
    async generateIndentNumber() {
      try {
        const indentNumber = await indentsService.generateIndentNumber()
        return indentNumber
      } catch (error) {
        showError('Failed to generate indent number')
        throw error
      }
    },

    /**
     * Can edit indent
     */
    async canEditIndent(indentId) {
      try {
        const canEdit = await indentsService.canEditIndent(indentId)
        return canEdit
      } catch (error) {
        console.error('Failed to check edit permission:', error)
        return false
      }
    },

    /**
     * Can approve indent
     */
    async canApproveIndent(indentId) {
      try {
        const canApprove = await indentsService.canApproveIndent(indentId)
        return canApprove
      } catch (error) {
        console.error('Failed to check approval permission:', error)
        return false
      }
    },

    /**
     * Recalculate indent totals
     */
    async recalculateIndentTotals(indentId) {
      try {
        await indentsService.recalculateIndentTotals(indentId)

        // Refresh the indent data
        await this.fetchIndent(indentId)

        showSuccess('Indent totals recalculated successfully')
        return true
      } catch (error) {
        showError('Failed to recalculate indent totals')
        throw error
      }
    },

    /**
     * Fetch recent indents
     */
    async fetchRecentIndents(limit = 10, force = false) {
      if (!force && this.recentIndents.length > 0) {
        return this.recentIndents
      }

      try {
        const response = await indentsService.getRecentIndents(limit)

        if (response.success) {
          this.recentIndents = response.data
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch recent indents')
        throw error
      }
    },

    // === Helper Methods ===

    /**
     * Update indent in local state
     */
    updateIndentInState(indentId, updateData) {
      // Update in list
      const index = this.indents.findIndex(i => i.recCode === indentId)
      if (index !== -1) {
        this.indents[index] = { ...this.indents[index], ...updateData }
      }

      // Update current indent
      if (this.currentIndent?.recCode === indentId) {
        this.currentIndent = { ...this.currentIndent, ...updateData }
      }

      // Update cache
      if (this.indentsCache.has(indentId)) {
        const cached = this.indentsCache.get(indentId)
        this.indentsCache.set(indentId, { ...cached, ...updateData })
      }
    },

    /**
     * Update indent item counts
     */
    updateIndentItemCounts(indentId, totalChange, processedChange) {
      this.updateIndentInState(indentId, {
        totalItemsCount: (this.currentIndent?.totalItemsCount || 0) + totalChange,
        processedItemsCount: (this.currentIndent?.processedItemsCount || 0) + processedChange
      })
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
        projectNodeId: null,
        indentStatus: null,
        approvalStatus: null,
        procurementStatus: null,
        priority: null,
        isUrgent: null,
        requestedById: null,
        locationId: null,
        budgetCode: null,
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
          this.sortDirection = 'DESC'
        }
      }

      // Re-fetch with new sort
      this.fetchIndents()
    },

    /**
     * Cache management
     */
    isValidCache(key) {
      const timestamp = this.cacheTimestamps.get(key)
      if (!timestamp) return false
      return (Date.now() - timestamp) < this.CACHE_TTL
    },

    clearCache() {
      this.indentsCache.clear()
      this.itemsCache.clear()
      this.statisticsCache.clear()
      this.cacheTimestamps.clear()
    },

    clearExpiredCache() {
      const now = Date.now()
      for (const [key, timestamp] of this.cacheTimestamps.entries()) {
        if (now - timestamp >= this.CACHE_TTL) {
          this.indentsCache.delete(key)
          this.itemsCache.delete(key)
          this.statisticsCache.delete(key)
          this.cacheTimestamps.delete(key)
        }
      }
    },

    /**
     * Utility methods from service
     */
    getIndentStatusIcon(status) {
      return indentsService.getIndentStatusIcon(status)
    },

    getIndentStatusColor(status) {
      return indentsService.getIndentStatusColor(status)
    },

    getApprovalStatusColor(status) {
      return indentsService.getApprovalStatusColor(status)
    },

    getProcurementStatusColor(status) {
      return indentsService.getProcurementStatusColor(status)
    },

    getPriorityColor(priority) {
      return indentsService.getPriorityColor(priority)
    },

    getItemProcessingStatusColor(status) {
      return indentsService.getItemProcessingStatusColor(status)
    },

    formatIndentDisplayName(indent) {
      return indentsService.formatIndentDisplayName(indent)
    },

    calculateCompletionPercentage(indent) {
      return indentsService.calculateCompletionPercentage(indent)
    },

    isIndentOverdue(indent) {
      return indentsService.isIndentOverdue(indent)
    },

    getDaysUntilDue(indent) {
      return indentsService.getDaysUntilDue(indent)
    },

    formatCurrency(value, currency = '₹') {
      return indentsService.formatCurrency(value, currency)
    },

    getApprovalStepDisplay(indent) {
      return indentsService.getApprovalStepDisplay(indent)
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
