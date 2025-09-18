// src/stores/items-master.js
import { defineStore } from 'pinia'
import itemsMasterService from 'src/services/api/items-master.service'
import { showSuccess, showError } from 'src/utils/notification'

export const useItemsMasterStore = defineStore('itemsMaster', {
  state: () => ({
    // Items list
    items: [],
    totalItems: 0,
    currentPage: 0,
    pageSize: 20,

    // Current item
    currentItem: null,

    // Categories and related data
    categories: [],
    materials: [],
    grades: [],
    hsnCodes: [],
    vendors: [],

    // Special item lists
    testingRequiredItems: [],
    samplesRequiredItems: [],
    qrTrackingRequiredItems: [],
    serialNumberRequiredItems: [],
    reorderRequiredItems: [],
    recentItems: [],

    // Loading states
    isLoading: false,
    isLoadingAnalytics: false,
    isBulkOperationInProgress: false,

    // Filters
    filters: {
      search: '',
      itemCategoryId: null,
      material: null,
      grade: null,
      itemStatus: null,
      isiStandard: null,
      bisStandard: null,
      hsnCode: null,
      isTestingRequired: null,
      isSampleRequired: null,
      isQRTrackingRequired: null,
      isSerialNumberRequired: null,
      preferredVendorId: null,
      minCost: null,
      maxCost: null,
      minWeight: null,
      maxWeight: null,
      color: null,
      minReorderLevel: null,
      maxReorderLevel: null,
      isSystemItem: null,
      includeInactive: false
    },

    // Sort
    sortBy: 'itemName',
    sortDirection: 'ASC',

    // Cache
    itemsCache: new Map(),
    analyticsCache: new Map(),

    // Cache TTL (10 minutes)
    CACHE_TTL: 10 * 60 * 1000,
    cacheTimestamps: new Map(),

    // Bulk operation results
    lastBulkOperationResult: null,

    // Analytics data
    itemStatistics: null,
    categoryStatistics: null,
    materialStatistics: null,
    testingStatistics: null,
    inventoryAnalytics: null,
    costAnalytics: null
  }),

  getters: {
    /**
     * Get filtered items
     */
    filteredItems: (state) => {
      let filtered = [...state.items]

      // Apply search filter
      if (state.filters.search) {
        const search = state.filters.search.toLowerCase()
        filtered = filtered.filter(item =>
          item.itemName.toLowerCase().includes(search) ||
          item.itemCode?.toLowerCase().includes(search) ||
          item.itemDescription?.toLowerCase().includes(search) ||
          item.material?.toLowerCase().includes(search)
        )
      }

      // Apply category filter
      if (state.filters.itemCategoryId) {
        filtered = filtered.filter(item =>
          item.itemCategoryId === state.filters.itemCategoryId
        )
      }

      // Apply material filter
      if (state.filters.material) {
        filtered = filtered.filter(item =>
          item.material === state.filters.material
        )
      }

      // Apply grade filter
      if (state.filters.grade) {
        filtered = filtered.filter(item =>
          item.grade === state.filters.grade
        )
      }

      // Apply status filter
      if (state.filters.itemStatus) {
        filtered = filtered.filter(item =>
          item.itemStatus === state.filters.itemStatus
        )
      }

      // Apply requirement filters
      if (state.filters.isTestingRequired !== null) {
        filtered = filtered.filter(item =>
          item.isTestingRequired === state.filters.isTestingRequired
        )
      }

      if (state.filters.isSampleRequired !== null) {
        filtered = filtered.filter(item =>
          item.isSampleRequired === state.filters.isSampleRequired
        )
      }

      if (state.filters.isQRTrackingRequired !== null) {
        filtered = filtered.filter(item =>
          item.isQRTrackingRequired === state.filters.isQRTrackingRequired
        )
      }

      if (state.filters.isSerialNumberRequired !== null) {
        filtered = filtered.filter(item =>
          item.isSerialNumberRequired === state.filters.isSerialNumberRequired
        )
      }

      // Apply vendor filter
      if (state.filters.preferredVendorId) {
        filtered = filtered.filter(item =>
          item.preferredVendorId === state.filters.preferredVendorId
        )
      }

      // Apply cost range filter
      if (state.filters.minCost !== null) {
        filtered = filtered.filter(item =>
          item.estimatedCost >= state.filters.minCost
        )
      }

      if (state.filters.maxCost !== null) {
        filtered = filtered.filter(item =>
          item.estimatedCost <= state.filters.maxCost
        )
      }

      return filtered
    },

    /**
     * Get items grouped by category
     */
    itemsByCategory: (state) => {
      const groups = {}
      state.items.forEach(item => {
        const category = item.itemCategoryName || 'Uncategorized'
        if (!groups[category]) {
          groups[category] = []
        }
        groups[category].push(item)
      })
      return groups
    },

    /**
     * Get items grouped by material
     */
    itemsByMaterial: (state) => {
      const groups = {}
      state.items.forEach(item => {
        const material = item.material || 'Other'
        if (!groups[material]) {
          groups[material] = []
        }
        groups[material].push(item)
      })
      return groups
    },

    /**
     * Get items statistics
     */
    itemsStatistics: (state) => {
      const stats = {
        total: state.items.length,
        byStatus: {},
        byCategory: {},
        byMaterial: {},
        testingRequired: 0,
        sampleRequired: 0,
        qrTrackingRequired: 0,
        serialNumberRequired: 0,
        requiresReorder: 0,
        systemItems: 0
      }

      state.items.forEach(item => {
        // Count by status
        const status = item.itemStatus || 'Unknown'
        stats.byStatus[status] = (stats.byStatus[status] || 0) + 1

        // Count by category
        const category = item.itemCategoryName || 'Uncategorized'
        stats.byCategory[category] = (stats.byCategory[category] || 0) + 1

        // Count by material
        const material = item.material || 'Other'
        stats.byMaterial[material] = (stats.byMaterial[material] || 0) + 1

        // Count requirements
        if (item.isTestingRequired) stats.testingRequired++
        if (item.isSampleRequired) stats.sampleRequired++
        if (item.isQRTrackingRequired) stats.qrTrackingRequired++
        if (item.isSerialNumberRequired) stats.serialNumberRequired++
        if (item.requiresReorder) stats.requiresReorder++
        if (item.isSystemItem) stats.systemItems++
      })

      return stats
    },

    /**
     * Check if item is loaded
     */
    isItemLoaded: (state) => (itemId) => {
      return state.currentItem?.recCode === itemId ||
             state.itemsCache.has(itemId)
    },

    /**
     * Get cached item
     */
    getCachedItem: (state) => (itemId) => {
      return state.itemsCache.get(itemId)
    },

    /**
     * Get items for dropdown/selection
     */
    itemsForSelection: (state) => {
      return state.items.map(item => ({
        label: itemsMasterService.formatItemDisplayName(item),
        value: item.recCode,
        ...item
      }))
    },

    /**
     * Get active items for selection
     */
    activeItemsForSelection: (state) => {
      return state.items
        .filter(item => item.itemStatus === 'Active')
        .map(item => ({
          label: itemsMasterService.formatItemDisplayName(item),
          value: item.recCode,
          ...item
        }))
    }
  },

  actions: {
    /**
     * Fetch all items
     */
    async fetchItems(params = {}) {
      this.isLoading = true

      try {
        const queryParams = {
          page: params.page ?? this.currentPage,
          size: params.size ?? this.pageSize,
          sort: this.sortBy,
          direction: this.sortDirection,
          ...params
        }

        const response = await itemsMasterService.getAllItems(queryParams)

        if (response.success) {
          this.items = response.data.content || response.data
          this.totalItems = response.data.totalElements || this.items.length
          this.currentPage = response.data.number || 0
          this.pageSize = response.data.size || this.pageSize

          // Cache items
          this.items.forEach(item => {
            this.itemsCache.set(item.recCode, item)
            this.cacheTimestamps.set(item.recCode, Date.now())
          })
        }

        return response
      } catch (error) {
        showError('Failed to fetch items')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Fetch single item
     */
    async fetchItem(itemId) {
      // Check cache first
      if (this.isValidCache(itemId)) {
        this.currentItem = this.itemsCache.get(itemId)
        return this.currentItem
      }

      this.isLoading = true

      try {
        const response = await itemsMasterService.getItemById(itemId)

        if (response.success) {
          this.currentItem = response.data
          this.itemsCache.set(itemId, response.data)
          this.cacheTimestamps.set(itemId, Date.now())
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch item')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Create item
     */
    async createItem(itemData) {
      this.isLoading = true

      try {
        const response = await itemsMasterService.createItem(itemData)

        if (response.success) {
          this.items.unshift(response.data)
          this.totalItems++
          this.itemsCache.set(response.data.recCode, response.data)
          this.cacheTimestamps.set(response.data.recCode, Date.now())

          showSuccess('Item created successfully')
        }

        return response
      } catch (error) {
        showError('Failed to create item')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Update item
     */
    async updateItem(itemId, updateData) {
      this.isLoading = true

      try {
        const response = await itemsMasterService.updateItem(itemId, updateData)

        if (response.success) {
          // Update in list
          const index = this.items.findIndex(i => i.recCode === itemId)
          if (index !== -1) {
            this.items[index] = { ...this.items[index], ...response.data }
          }

          // Update current item
          if (this.currentItem?.recCode === itemId) {
            this.currentItem = { ...this.currentItem, ...response.data }
          }

          // Update cache
          this.itemsCache.set(itemId, response.data)
          this.cacheTimestamps.set(itemId, Date.now())

          showSuccess('Item updated successfully')
        }

        return response
      } catch (error) {
        showError('Failed to update item')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Delete item
     */
    async deleteItem(itemId) {
      // Check if can delete
      const canDelete = await itemsMasterService.canDeleteItem(itemId)
      if (!canDelete) {
        showError('Cannot delete this item as it is being used')
        return false
      }

      this.isLoading = true

      try {
        await itemsMasterService.deleteItem(itemId)

        // Remove from list
        this.items = this.items.filter(i => i.recCode !== itemId)
        this.totalItems--

        // Clear current if deleted
        if (this.currentItem?.recCode === itemId) {
          this.currentItem = null
        }

        // Clear cache
        this.itemsCache.delete(itemId)
        this.cacheTimestamps.delete(itemId)

        showSuccess('Item deleted successfully')
        return true
      } catch (error) {
        showError('Failed to delete item')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Search items
     */
    async searchItems(searchTerm, filters = {}, params = {}) {
      this.isLoading = true

      try {
        const response = await itemsMasterService.searchItems(searchTerm, filters, params)

        if (response.success) {
          this.items = response.data.content || response.data
          this.totalItems = response.data.totalElements || this.items.length
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
     * Fetch items by category
     */
    async fetchItemsByCategory(categoryId) {
      try {
        const response = await itemsMasterService.getItemsByCategory(categoryId)
        return response.data
      } catch (error) {
        showError('Failed to fetch items by category')
        throw error
      }
    },

    /**
     * Fetch items by status
     */
    async fetchItemsByStatus(status) {
      try {
        const response = await itemsMasterService.getItemsByStatus(status)
        return response.data
      } catch (error) {
        showError('Failed to fetch items by status')
        throw error
      }
    },

    /**
     * Fetch items requiring testing
     */
    async fetchTestingRequiredItems(force = false) {
      if (!force && this.testingRequiredItems.length > 0) {
        return this.testingRequiredItems
      }

      try {
        const response = await itemsMasterService.getItemsRequiringTesting()
        if (response.success) {
          this.testingRequiredItems = response.data
        }
        return response.data
      } catch (error) {
        showError('Failed to fetch testing required items')
        throw error
      }
    },

    /**
     * Fetch recently added items
     */
    async fetchRecentItems(limit = 10, force = false) {
      if (!force && this.recentItems.length > 0) {
        return this.recentItems
      }

      try {
        const response = await itemsMasterService.getRecentlyAddedItems(limit)
        if (response.success) {
          this.recentItems = response.data
        }
        return response.data
      } catch (error) {
        showError('Failed to fetch recent items')
        throw error
      }
    },

    /**
     * Bulk create items
     */
    async bulkCreateItems(bulkData) {
      this.isBulkOperationInProgress = true

      try {
        const response = await itemsMasterService.bulkCreateItems(bulkData)

        if (response.success) {
          this.lastBulkOperationResult = response.data
          // Refresh items list
          await this.fetchItems()
          showSuccess(`${response.data.successfulOperations} items created successfully`)
        }

        return response
      } catch (error) {
        showError('Bulk create failed')
        throw error
      } finally {
        this.isBulkOperationInProgress = false
      }
    },

    /**
     * Bulk update item status
     */
    async bulkUpdateItemStatus(bulkData) {
      this.isBulkOperationInProgress = true

      try {
        const response = await itemsMasterService.bulkUpdateItemStatus(bulkData)

        if (response.success) {
          this.lastBulkOperationResult = response.data

          // Update items in local state
          bulkData.itemIds.forEach(itemId => {
            const item = this.items.find(i => i.recCode === itemId)
            if (item) {
              item.itemStatus = bulkData.newStatus
            }
          })

          showSuccess(`${response.data.successfulOperations} items updated successfully`)
        }

        return response
      } catch (error) {
        showError('Bulk status update failed')
        throw error
      } finally {
        this.isBulkOperationInProgress = false
      }
    },

    /**
     * Bulk delete items
     */
    async bulkDeleteItems(bulkData) {
      this.isBulkOperationInProgress = true

      try {
        const response = await itemsMasterService.bulkDeleteItems(bulkData)

        if (response.success) {
          this.lastBulkOperationResult = response.data

          // Remove from local state
          this.items = this.items.filter(i => !bulkData.itemIds.includes(i.recCode))
          this.totalItems -= response.data.successfulOperations

          // Clear cache
          bulkData.itemIds.forEach(id => {
            this.itemsCache.delete(id)
            this.cacheTimestamps.delete(id)
          })

          showSuccess(`${response.data.successfulOperations} items deleted successfully`)
        }

        return response
      } catch (error) {
        showError('Bulk delete failed')
        throw error
      } finally {
        this.isBulkOperationInProgress = false
      }
    },

    /**
     * Update item metadata
     */
    async updateItemMetadata(itemId, metadata) {
      try {
        await itemsMasterService.updateItemMetadata(itemId, metadata)

        // Update in current item if loaded
        if (this.currentItem?.recCode === itemId) {
          this.currentItem.itemMetadata = { ...this.currentItem.itemMetadata, ...metadata }
        }

        showSuccess('Item metadata updated')
        return true
      } catch (error) {
        showError('Failed to update item metadata')
        throw error
      }
    },

    /**
     * Update alternate units
     */
    async updateAlternateUnits(itemId, alternateUnits) {
      try {
        await itemsMasterService.updateAlternateUnits(itemId, alternateUnits)

        // Update in current item if loaded
        if (this.currentItem?.recCode === itemId) {
          this.currentItem.alternateUnits = alternateUnits
        }

        showSuccess('Alternate units updated')
        return true
      } catch (error) {
        showError('Failed to update alternate units')
        throw error
      }
    },

    /**
     * Fetch analytics data
     */
    async fetchItemStatistics(force = false) {
      const cacheKey = 'itemStatistics'

      if (!force && this.isValidCache(cacheKey)) {
        return this.itemStatistics
      }

      this.isLoadingAnalytics = true

      try {
        const response = await itemsMasterService.getItemStatistics()
        if (response.success) {
          this.itemStatistics = response.data
          this.analyticsCache.set(cacheKey, response.data)
          this.cacheTimestamps.set(cacheKey, Date.now())
        }
        return response.data
      } catch (error) {
        showError('Failed to fetch item statistics')
        throw error
      } finally {
        this.isLoadingAnalytics = false
      }
    },

    /**
     * Fetch materials
     */
    async fetchMaterials(force = false) {
      if (!force && this.materials.length > 0) {
        return this.materials
      }

      try {
        const response = await itemsMasterService.getAllMaterials()
        if (response.success) {
          this.materials = response.data
        }
        return response.data
      } catch (error) {
        console.error('Failed to fetch materials:', error)
        return []
      }
    },

    /**
     * Fetch grades
     */
    async fetchGrades(force = false) {
      if (!force && this.grades.length > 0) {
        return this.grades
      }

      try {
        const response = await itemsMasterService.getAllGrades()
        if (response.success) {
          this.grades = response.data
        }
        return response.data
      } catch (error) {
        console.error('Failed to fetch grades:', error)
        return []
      }
    },

    /**
     * Fetch HSN codes
     */
    async fetchHSNCodes(force = false) {
      if (!force && this.hsnCodes.length > 0) {
        return this.hsnCodes
      }

      try {
        const response = await itemsMasterService.getAllHSNCodes()
        if (response.success) {
          this.hsnCodes = response.data
        }
        return response.data
      } catch (error) {
        console.error('Failed to fetch HSN codes:', error)
        return []
      }
    },

    /**
     * Generate item code
     */
    async generateItemCode() {
      try {
        return await itemsMasterService.generateItemCode()
      } catch (error) {
        showError('Failed to generate item code')
        throw error
      }
    },

    /**
     * Validation methods
     */
    async validateItemCode(itemCode, excludeId = null) {
      try {
        return await itemsMasterService.isItemCodeUnique(itemCode, excludeId)
      } catch (error) {
        console.error('Validation failed:', error)
        return false
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
        itemCategoryId: null,
        material: null,
        grade: null,
        itemStatus: null,
        isiStandard: null,
        bisStandard: null,
        hsnCode: null,
        isTestingRequired: null,
        isSampleRequired: null,
        isQRTrackingRequired: null,
        isSerialNumberRequired: null,
        preferredVendorId: null,
        minCost: null,
        maxCost: null,
        minWeight: null,
        maxWeight: null,
        color: null,
        minReorderLevel: null,
        maxReorderLevel: null,
        isSystemItem: null,
        includeInactive: false
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
      this.fetchItems()
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
      this.itemsCache.clear()
      this.analyticsCache.clear()
      this.cacheTimestamps.clear()
    },

    clearExpiredCache() {
      const now = Date.now()
      for (const [key, timestamp] of this.cacheTimestamps.entries()) {
        if (now - timestamp >= this.CACHE_TTL) {
          this.itemsCache.delete(key)
          this.analyticsCache.delete(key)
          this.cacheTimestamps.delete(key)
        }
      }
    },

    /**
     * Utility methods
     */
    getItemStatusIcon(status) {
      return itemsMasterService.getItemStatusIcon(status)
    },

    getItemStatusColor(status) {
      return itemsMasterService.getItemStatusColor(status)
    },

    formatItemDisplayName(item) {
      return itemsMasterService.formatItemDisplayName(item)
    },

    getItemRequirements(item) {
      return itemsMasterService.getItemRequirements(item)
    },

    getStockStatus(item) {
      return itemsMasterService.getStockStatus(item)
    },

    formatCost(cost, currency) {
      return itemsMasterService.formatCost(cost, currency)
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
