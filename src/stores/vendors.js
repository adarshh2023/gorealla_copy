// src/stores/vendors.js
import { defineStore } from 'pinia'
import vendorsService from 'src/services/api/vendors.service'
import { showSuccess, showError } from 'src/utils/notification'

export const useVendorsStore = defineStore('vendors', {
  state: () => ({
    // Vendors list
    vendors: [],
    totalVendors: 0,
    currentPage: 0,
    pageSize: 20,

    // Current vendor
    currentVendor: null,

    // Categorized vendors
    preferredVendors: [],
    pendingApprovalVendors: [],
    topPerformingVendors: [],
    vendorsRequiringAttention: [],

    // Performance data
    performanceHistory: new Map(),
    performanceRanking: [],

    // Portal activity data
    portalActivity: new Map(),

    // Loading states
    isLoading: false,
    isLoadingPerformance: false,
    isLoadingApproval: false,

    // Filters
    filters: {
      search: '',
      vendorType: null,
      vendorCategory: null,
      vendorStatus: null,
      approvalStatus: null,
      city: null,
      state: null,
      minRating: null
    },

    // Sort
    sortBy: 'companyName',
    sortDirection: 'ASC',

    // Cache
    vendorsCache: new Map(),
    statisticsCache: new Map(),

    // Cache TTL (10 minutes for vendors as they change less frequently)
    CACHE_TTL: 10 * 60 * 1000,
    cacheTimestamps: new Map()
  }),

  getters: {
    /**
     * Get filtered vendors
     */
    filteredVendors: (state) => {
      let filtered = [...state.vendors]

      // Apply search filter
      if (state.filters.search) {
        const search = state.filters.search.toLowerCase()
        filtered = filtered.filter(vendor =>
          vendor.companyName.toLowerCase().includes(search) ||
          vendor.vendorCode?.toLowerCase().includes(search) ||
          vendor.contactPersonName?.toLowerCase().includes(search) ||
          vendor.email?.toLowerCase().includes(search)
        )
      }

      // Apply type filter
      if (state.filters.vendorType) {
        filtered = filtered.filter(vendor =>
          vendor.vendorType === state.filters.vendorType
        )
      }

      // Apply category filter
      if (state.filters.vendorCategory) {
        filtered = filtered.filter(vendor =>
          vendor.vendorCategory === state.filters.vendorCategory
        )
      }

      // Apply status filter
      if (state.filters.vendorStatus) {
        filtered = filtered.filter(vendor =>
          vendor.vendorStatus === state.filters.vendorStatus
        )
      }

      // Apply approval status filter
      if (state.filters.approvalStatus) {
        filtered = filtered.filter(vendor =>
          vendor.approvalStatus === state.filters.approvalStatus
        )
      }

      // Apply location filters
      if (state.filters.city) {
        filtered = filtered.filter(vendor =>
          vendor.city?.toLowerCase().includes(state.filters.city.toLowerCase())
        )
      }

      if (state.filters.state) {
        filtered = filtered.filter(vendor =>
          vendor.state?.toLowerCase().includes(state.filters.state.toLowerCase())
        )
      }

      // Apply rating filter
      if (state.filters.minRating) {
        filtered = filtered.filter(vendor =>
          vendor.overallRating && vendor.overallRating >= state.filters.minRating
        )
      }

      return filtered
    },

    /**
     * Get vendors grouped by status
     */
    vendorsByStatus: (state) => {
      const groups = {}
      state.vendors.forEach(vendor => {
        const status = vendor.vendorStatus || 'Unknown'
        if (!groups[status]) {
          groups[status] = []
        }
        groups[status].push(vendor)
      })
      return groups
    },

    /**
     * Get vendors grouped by type
     */
    vendorsByType: (state) => {
      const groups = {}
      state.vendors.forEach(vendor => {
        const type = vendor.vendorType || 'Other'
        if (!groups[type]) {
          groups[type] = []
        }
        groups[type].push(vendor)
      })
      return groups
    },

    /**
     * Get vendor statistics
     */
    vendorStatistics: (state) => {
      const stats = {
        total: state.vendors.length,
        byStatus: {},
        byType: {},
        byCategory: {},
        averageRating: 0,
        verified: 0,
        preferred: 0
      }

      let totalRating = 0
      let ratedVendors = 0

      state.vendors.forEach(vendor => {
        // Count by status
        const status = vendor.vendorStatus || 'Unknown'
        stats.byStatus[status] = (stats.byStatus[status] || 0) + 1

        // Count by type
        const type = vendor.vendorType || 'Other'
        stats.byType[type] = (stats.byType[type] || 0) + 1

        // Count by category
        const category = vendor.vendorCategory || 'Other'
        stats.byCategory[category] = (stats.byCategory[category] || 0) + 1

        // Calculate rating average
        if (vendor.overallRating) {
          totalRating += parseFloat(vendor.overallRating)
          ratedVendors++
        }

        // Count verified vendors
        if (vendor.isGSTVerified && vendor.isPANVerified) {
          stats.verified++
        }

        // Count preferred vendors
        if (vendor.isPreferredVendor) {
          stats.preferred++
        }
      })

      stats.averageRating = ratedVendors > 0
        ? Math.round((totalRating / ratedVendors) * 100) / 100
        : 0

      return stats
    },

    /**
     * Check if vendor is loaded
     */
    isVendorLoaded: (state) => (vendorId) => {
      return state.currentVendor?.recCode === vendorId ||
             state.vendorsCache.has(vendorId)
    },

    /**
     * Get cached vendor
     */
    getCachedVendor: (state) => (vendorId) => {
      return state.vendorsCache.get(vendorId)
    },

    /**
     * Get vendors for dropdown/selection
     */
    vendorsForSelection: (state) => {
      return state.vendors.map(vendor => ({
        label: vendorsService.formatVendorDisplayName(vendor),
        value: vendor.recCode,
        ...vendor
      }))
    },

    /**
     * Get active vendors for selection
     */
    activeVendorsForSelection: (state) => {
      return state.vendors
        .filter(vendor => vendor.vendorStatus === 'Active')
        .map(vendor => ({
          label: vendorsService.formatVendorDisplayName(vendor),
          value: vendor.recCode,
          ...vendor
        }))
    }
  },

  actions: {
    /**
     * Fetch all vendors
     */
    async fetchVendors(vendorStatus = null, approvalStatus = null, params = {}) {
      this.isLoading = true

      try {
        const queryParams = {
          page: params.page ?? this.currentPage,
          size: params.size ?? this.pageSize,
          sort: this.sortBy,
          direction: this.sortDirection,
          ...params
        }

        const response = await vendorsService.getAllVendors(vendorStatus, approvalStatus, queryParams)

        if (response.success) {
          this.vendors = response.data.content || response.data
          this.totalVendors = response.data.totalElements || this.vendors.length
          this.currentPage = response.data.number || 0
          this.pageSize = response.data.size || this.pageSize

          // Cache vendors
          this.vendors.forEach(vendor => {
            this.vendorsCache.set(vendor.recCode, vendor)
            this.cacheTimestamps.set(vendor.recCode, Date.now())
          })
        }

        return response
      } catch (error) {
        showError('Failed to fetch vendors')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Fetch single vendor
     */
    async fetchVendor(vendorId) {
      // Check cache first
      if (this.isValidCache(vendorId)) {
        this.currentVendor = this.vendorsCache.get(vendorId)
        return this.currentVendor
      }

      this.isLoading = true

      try {
        const response = await vendorsService.getVendorById(vendorId)

        if (response.success) {
          this.currentVendor = response.data
          this.vendorsCache.set(vendorId, response.data)
          this.cacheTimestamps.set(vendorId, Date.now())
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch vendor')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Create vendor
     */
    async createVendor(vendorData) {
      this.isLoading = true

      try {
        const response = await vendorsService.createVendor(vendorData)

        if (response.success) {
          this.vendors.unshift(response.data)
          this.totalVendors++
          this.vendorsCache.set(response.data.recCode, response.data)
          this.cacheTimestamps.set(response.data.recCode, Date.now())

          showSuccess('Vendor created successfully')
        }

        return response
      } catch (error) {
        showError('Failed to create vendor')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Update vendor
     */
    async updateVendor(vendorId, updateData) {
      this.isLoading = true

      try {
        const response = await vendorsService.updateVendor(vendorId, updateData)

        if (response.success) {
          // Update in list
          const index = this.vendors.findIndex(v => v.recCode === vendorId)
          if (index !== -1) {
            this.vendors[index] = { ...this.vendors[index], ...response.data }
          }

          // Update current vendor
          if (this.currentVendor?.recCode === vendorId) {
            this.currentVendor = { ...this.currentVendor, ...response.data }
          }

          // Update cache
          this.vendorsCache.set(vendorId, response.data)
          this.cacheTimestamps.set(vendorId, Date.now())

          showSuccess('Vendor updated successfully')
        }

        return response
      } catch (error) {
        showError('Failed to update vendor')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Delete vendor
     */
    async deleteVendor(vendorId) {
      // Check if can delete
      const canDelete = await vendorsService.canDeleteVendor(vendorId)
      if (!canDelete) {
        showError('Cannot delete this vendor as it is being used')
        return false
      }

      this.isLoading = true

      try {
        await vendorsService.deleteVendor(vendorId)

        // Remove from list
        this.vendors = this.vendors.filter(v => v.recCode !== vendorId)
        this.totalVendors--

        // Clear current if deleted
        if (this.currentVendor?.recCode === vendorId) {
          this.currentVendor = null
        }

        // Clear cache
        this.vendorsCache.delete(vendorId)
        this.cacheTimestamps.delete(vendorId)

        showSuccess('Vendor deleted successfully')
        return true
      } catch (error) {
        showError('Failed to delete vendor')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Search vendors
     */
    async searchVendors(searchTerm, vendorType, vendorCategory, vendorStatus, approvalStatus, city, state, params = {}) {
      this.isLoading = true

      try {
        const response = await vendorsService.searchVendors(
          searchTerm, vendorType, vendorCategory, vendorStatus,
          approvalStatus, city, state, params
        )

        if (response.success) {
          this.vendors = response.data.content || response.data
          this.totalVendors = response.data.totalElements || this.vendors.length
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
     * Fetch vendors by type and category
     */
    async fetchVendorsByTypeAndCategory(vendorType, vendorCategory, params = {}) {
      try {
        const response = await vendorsService.getVendorsByTypeAndCategory(vendorType, vendorCategory, params)
        return response.data
      } catch (error) {
        showError('Failed to fetch vendors by type and category')
        throw error
      }
    },

    /**
     * Fetch preferred vendors
     */
    async fetchPreferredVendors(minRating = 3.0, force = false) {
      if (!force && this.preferredVendors.length > 0) {
        return this.preferredVendors
      }

      try {
        const response = await vendorsService.getPreferredVendors(minRating)

        if (response.success) {
          this.preferredVendors = response.data
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch preferred vendors')
        throw error
      }
    },

    /**
     * Fetch vendors by location
     */
    async fetchVendorsByLocation(city = null, state = null) {
      try {
        const response = await vendorsService.getVendorsByLocation(city, state)
        return response.data
      } catch (error) {
        showError('Failed to fetch vendors by location')
        throw error
      }
    },

    // === Approval Operations ===

    /**
     * Submit vendor for approval
     */
    async submitForApproval(vendorId, submissionRemarks = null) {
      this.isLoadingApproval = true

      try {
        await vendorsService.submitForApproval(vendorId, submissionRemarks)

        // Update vendor status in local state
        const vendor = this.vendors.find(v => v.recCode === vendorId)
        if (vendor) {
          vendor.approvalStatus = 'Pending'
        }

        if (this.currentVendor?.recCode === vendorId) {
          this.currentVendor.approvalStatus = 'Pending'
        }

        showSuccess('Vendor submitted for approval successfully')
        return true
      } catch (error) {
        showError('Failed to submit vendor for approval')
        throw error
      } finally {
        this.isLoadingApproval = false
      }
    },

    /**
     * Process vendor approval
     */
    async processApproval(vendorId, decision, remarks = null) {
      this.isLoadingApproval = true

      try {
        await vendorsService.processApproval(vendorId, decision, remarks)

        // Update vendor status in local state
        const vendor = this.vendors.find(v => v.recCode === vendorId)
        if (vendor) {
          vendor.approvalStatus = decision === 'approve' ? 'Approved' : 'Rejected'
          if (decision === 'approve') {
            vendor.vendorStatus = 'Active'
          }
        }

        if (this.currentVendor?.recCode === vendorId) {
          this.currentVendor.approvalStatus = decision === 'approve' ? 'Approved' : 'Rejected'
          if (decision === 'approve') {
            this.currentVendor.vendorStatus = 'Active'
          }
        }

        showSuccess(`Vendor ${decision === 'approve' ? 'approved' : 'rejected'} successfully`)
        return true
      } catch (error) {
        showError('Failed to process vendor approval')
        throw error
      } finally {
        this.isLoadingApproval = false
      }
    },

    /**
     * Fetch vendors pending approval
     */
    async fetchVendorsPendingApproval(params = {}, force = false) {
      if (!force && this.pendingApprovalVendors.length > 0) {
        return this.pendingApprovalVendors
      }

      try {
        const response = await vendorsService.getVendorsPendingApproval(params)

        if (response.success) {
          this.pendingApprovalVendors = response.data.content || response.data
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch pending approval vendors')
        throw error
      }
    },

    // === Performance Management ===

    /**
     * Update vendor performance
     */
    async updatePerformance(vendorId, performanceData) {
      this.isLoadingPerformance = true

      try {
        await vendorsService.updatePerformance(vendorId, performanceData)

        // Update local state
        const vendor = this.vendors.find(v => v.recCode === vendorId)
        if (vendor) {
          Object.assign(vendor, performanceData)
        }

        if (this.currentVendor?.recCode === vendorId) {
          Object.assign(this.currentVendor, performanceData)
        }

        showSuccess('Vendor performance updated successfully')
        return true
      } catch (error) {
        showError('Failed to update vendor performance')
        throw error
      } finally {
        this.isLoadingPerformance = false
      }
    },

    /**
     * Fetch vendor performance history
     */
    async fetchPerformanceHistory(vendorId, force = false) {
      if (!force && this.performanceHistory.has(vendorId)) {
        return this.performanceHistory.get(vendorId)
      }

      try {
        const response = await vendorsService.getPerformanceHistory(vendorId)

        if (response.success) {
          this.performanceHistory.set(vendorId, response.data)
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch performance history')
        throw error
      }
    },

    /**
     * Fetch performance ranking
     */
    async fetchPerformanceRanking(category = null, minTransactions = 5, force = false) {
      if (!force && this.performanceRanking.length > 0) {
        return this.performanceRanking
      }

      try {
        const response = await vendorsService.getPerformanceRanking(category, minTransactions)

        if (response.success) {
          this.performanceRanking = response.data
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch performance ranking')
        throw error
      }
    },

    /**
     * Fetch top performing vendors
     */
    async fetchTopPerformingVendors(category = null, limit = 10, force = false) {
      if (!force && this.topPerformingVendors.length > 0) {
        return this.topPerformingVendors
      }

      try {
        const response = await vendorsService.getTopPerformingVendors(category, limit)

        if (response.success) {
          this.topPerformingVendors = response.data
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch top performing vendors')
        throw error
      }
    },

    // === Portal Management ===

    /**
     * Enable portal access for vendor
     */
    async enablePortalAccess(vendorId, portalUsername, accessLevel) {
      try {
        const response = await vendorsService.enablePortalAccess(vendorId, portalUsername, accessLevel)

        if (response.success) {
          // Update local state
          const vendor = this.vendors.find(v => v.recCode === vendorId)
          if (vendor) {
            vendor.hasPortalAccess = true
            vendor.portalUsername = portalUsername
            vendor.portalAccessLevel = accessLevel
          }

          if (this.currentVendor?.recCode === vendorId) {
            this.currentVendor.hasPortalAccess = true
            this.currentVendor.portalUsername = portalUsername
            this.currentVendor.portalAccessLevel = accessLevel
          }

          showSuccess('Portal access enabled successfully')
        }

        return response
      } catch (error) {
        showError('Failed to enable portal access')
        throw error
      }
    },

    /**
     * Send notification to vendor
     */
    async sendVendorNotification(vendorId, subject, message, notificationType = 'EMAIL') {
      try {
        await vendorsService.sendVendorNotification(vendorId, subject, message, notificationType)
        showSuccess('Notification sent successfully')
        return true
      } catch (error) {
        showError('Failed to send notification')
        throw error
      }
    },

    /**
     * Fetch vendor portal activity
     */
    async fetchPortalActivity(vendorId, force = false) {
      if (!force && this.portalActivity.has(vendorId)) {
        return this.portalActivity.get(vendorId)
      }

      try {
        const response = await vendorsService.getPortalActivity(vendorId)

        if (response.success) {
          this.portalActivity.set(vendorId, response.data)
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch portal activity')
        throw error
      }
    },

    // === Bulk Operations ===

    /**
     * Bulk create vendors
     */
    async bulkCreateVendors(vendors) {
      this.isLoading = true

      try {
        // Ensure vendors is always an array
        let vendorsArray = vendors

        // If vendors is an object with numeric keys, convert to array
        if (vendors && typeof vendors === 'object' && !Array.isArray(vendors)) {
          // Check if it's an object with numeric keys like {"0": {...}, "1": {...}}
          const keys = Object.keys(vendors)
          const isNumericKeys = keys.every(key => !isNaN(key) && !['deviceId', 'ipAddress'].includes(key))

          if (isNumericKeys) {
            vendorsArray = keys
              .filter(key => !['deviceId', 'ipAddress'].includes(key))
              .map(key => vendors[key])
          }
        }

        const response = await vendorsService.bulkCreateVendors(vendorsArray)

        if (response.success) {
          // Refresh vendors list
          await this.fetchVendors()
          showSuccess(`${response.data.successfulOperations || vendorsArray.length} vendors created successfully`)
        }

        return response
      } catch (error) {
        showError('Bulk create failed')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Bulk update vendor status
     */
    async bulkUpdateVendorStatus(vendorIds, newStatus, remarks = null) {
      this.isLoading = true

      try {
        const response = await vendorsService.bulkUpdateVendorStatus(vendorIds, newStatus, remarks)

        if (response.success) {
          // Update local state
          vendorIds.forEach(vendorId => {
            const vendor = this.vendors.find(v => v.recCode === vendorId)
            if (vendor) {
              vendor.vendorStatus = newStatus
            }
          })

          showSuccess(`${response.data.successfulOperations || vendorIds.length} vendor statuses updated successfully`)
        }

        return response
      } catch (error) {
        showError('Bulk status update failed')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Bulk process approvals
     */
    async bulkProcessApprovals(vendorIds, decision, remarks = null) {
      this.isLoadingApproval = true

      try {
        const response = await vendorsService.bulkProcessApprovals(vendorIds, decision, remarks)

        if (response.success) {
          // Update local state
          const approvalStatus = decision === 'approve' ? 'Approved' : 'Rejected'
          vendorIds.forEach(vendorId => {
            const vendor = this.vendors.find(v => v.recCode === vendorId)
            if (vendor) {
              vendor.approvalStatus = approvalStatus
              if (decision === 'approve') {
                vendor.vendorStatus = 'Active'
              }
            }
          })

          showSuccess(`${response.data.successfulOperations || vendorIds.length} approvals processed successfully`)
        }

        return response
      } catch (error) {
        showError('Bulk approval processing failed')
        throw error
      } finally {
        this.isLoadingApproval = false
      }
    },

    // === Analytics and Statistics ===

    /**
     * Fetch vendor statistics
     */
    async fetchVendorStatistics(force = false) {
      const cacheKey = 'vendor_statistics'

      if (!force && this.statisticsCache.has(cacheKey)) {
        return this.statisticsCache.get(cacheKey)
      }

      try {
        const response = await vendorsService.getVendorStatistics()

        if (response.success) {
          this.statisticsCache.set(cacheKey, response.data)
          this.cacheTimestamps.set(cacheKey, Date.now())
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch vendor statistics')
        throw error
      }
    },

    /**
     * Fetch vendors requiring attention
     */
    async fetchVendorsRequiringAttention(force = false) {
      if (!force && this.vendorsRequiringAttention.length > 0) {
        return this.vendorsRequiringAttention
      }

      try {
        const response = await vendorsService.getVendorsRequiringAttention()

        if (response.success) {
          this.vendorsRequiringAttention = response.data
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch vendors requiring attention')
        throw error
      }
    },

    // === Validation Methods ===

    /**
     * Validate vendor code uniqueness
     */
    async validateVendorCode(vendorCode, excludeId = null) {
      try {
        return await vendorsService.isVendorCodeUnique(vendorCode, excludeId)
      } catch (error) {
        console.error('Validation failed:', error)
        return false
      }
    },

    /**
     * Validate GST number uniqueness
     */
    async validateGSTNumber(gstNumber, excludeId = null) {
      try {
        return await vendorsService.isGSTNumberUnique(gstNumber, excludeId)
      } catch (error) {
        console.error('Validation failed:', error)
        return false
      }
    },

    // === Utility Actions ===

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
        vendorType: null,
        vendorCategory: null,
        vendorStatus: null,
        approvalStatus: null,
        city: null,
        state: null,
        minRating: null
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
      this.fetchVendors()
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
      this.vendorsCache.clear()
      this.statisticsCache.clear()
      this.performanceHistory.clear()
      this.portalActivity.clear()
      this.cacheTimestamps.clear()
    },

    clearExpiredCache() {
      const now = Date.now()
      for (const [key, timestamp] of this.cacheTimestamps.entries()) {
        if (now - timestamp >= this.CACHE_TTL) {
          this.vendorsCache.delete(key)
          this.statisticsCache.delete(key)
          this.performanceHistory.delete(key)
          this.portalActivity.delete(key)
          this.cacheTimestamps.delete(key)
        }
      }
    },

    /**
     * Utility methods
     */
    getVendorStatusIcon(status) {
      return vendorsService.getVendorStatusIcon(status)
    },

    getVendorStatusColor(status) {
      return vendorsService.getVendorStatusColor(status)
    },

    getApprovalStatusColor(status) {
      return vendorsService.getApprovalStatusColor(status)
    },

    formatVendorDisplayName(vendor) {
      return vendorsService.formatVendorDisplayName(vendor)
    },

    getRatingDisplay(rating, maxRating = 5) {
      return vendorsService.getRatingDisplay(rating, maxRating)
    },

    getPerformanceMetrics(vendor) {
      return vendorsService.getPerformanceMetrics(vendor)
    },

    getVerificationStatus(vendor) {
      return vendorsService.getVerificationStatus(vendor)
    },

    formatBusinessValue(value, currency = '₹') {
      return vendorsService.formatBusinessValue(value, currency)
    },

    getVendorTypeIcon(vendorType) {
      return vendorsService.getVendorTypeIcon(vendorType)
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
