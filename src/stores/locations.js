// src/stores/locations.js
import { defineStore } from 'pinia'
import locationsService from 'src/services/api/locations.service'
import { showSuccess, showError } from 'src/utils/notification'

export const useLocationsStore = defineStore('locations', {
  state: () => ({
    // Locations list
    locations: [],
    totalLocations: 0,
    currentPage: 0,
    pageSize: 20,

    // Current location
    currentLocation: null,

    // Tree structure
    locationTree: [],
    rootLocations: [],

    // Special location lists
    inventoryLocations: [],
    receivingLocations: [],
    issuingLocations: [],

    // Loading states
    isLoading: false,
    isLoadingTree: false,

    // Filters
    filters: {
      search: '',
      locationType: null,
      locationStatus: null,
      parentLocationId: null,
      projectNodeId: null,
      city: null,
      state: null,
      pinCode: null,
      securityLevel: null,
      isInventoryLocation: null,
      isReceivingLocation: null,
      isIssuingLocation: null,
      includeInactive: false
    },

    // Sort
    sortBy: 'locationName',
    sortDirection: 'ASC',

    // Cache
    locationsCache: new Map(),
    childrenCache: new Map(),
    statisticsCache: new Map(),

    // Cache TTL (10 minutes for locations as they change less frequently)
    CACHE_TTL: 10 * 60 * 1000,
    cacheTimestamps: new Map(),

    // Statistics
    locationStatistics: null,
    typeStatistics: null,
    statusStatistics: null
  }),

  getters: {
    /**
     * Get filtered locations
     */
    filteredLocations: (state) => {
      let filtered = [...state.locations]

      // Apply search filter
      if (state.filters.search) {
        const search = state.filters.search.toLowerCase()
        filtered = filtered.filter(location =>
          location.locationName.toLowerCase().includes(search) ||
          location.locationCode?.toLowerCase().includes(search) ||
          location.address?.toLowerCase().includes(search) ||
          location.city?.toLowerCase().includes(search)
        )
      }

      // Apply type filter
      if (state.filters.locationType) {
        filtered = filtered.filter(location =>
          location.locationType === state.filters.locationType
        )
      }

      // Apply status filter
      if (state.filters.locationStatus) {
        filtered = filtered.filter(location =>
          location.locationStatus === state.filters.locationStatus
        )
      }

      // Apply parent filter
      if (state.filters.parentLocationId) {
        filtered = filtered.filter(location =>
          location.parentLocationId === state.filters.parentLocationId
        )
      }

      // Apply project filter
      if (state.filters.projectNodeId) {
        filtered = filtered.filter(location =>
          location.projectNodeId === state.filters.projectNodeId
        )
      }

      // Apply geographic filters
      if (state.filters.city) {
        filtered = filtered.filter(location =>
          location.city === state.filters.city
        )
      }

      if (state.filters.state) {
        filtered = filtered.filter(location =>
          location.state === state.filters.state
        )
      }

      if (state.filters.pinCode) {
        filtered = filtered.filter(location =>
          location.pinCode === state.filters.pinCode
        )
      }

      // Apply security level filter
      if (state.filters.securityLevel) {
        filtered = filtered.filter(location =>
          location.securityLevel === state.filters.securityLevel
        )
      }

      // Apply capability filters
      if (state.filters.isInventoryLocation !== null) {
        filtered = filtered.filter(location =>
          location.isInventoryLocation === state.filters.isInventoryLocation
        )
      }

      if (state.filters.isReceivingLocation !== null) {
        filtered = filtered.filter(location =>
          location.isReceivingLocation === state.filters.isReceivingLocation
        )
      }

      if (state.filters.isIssuingLocation !== null) {
        filtered = filtered.filter(location =>
          location.isIssuingLocation === state.filters.isIssuingLocation
        )
      }

      return filtered
    },

    /**
     * Get locations grouped by type
     */
    locationsByType: (state) => {
      const groups = {}
      state.locations.forEach(location => {
        const type = location.locationType || 'Other'
        if (!groups[type]) {
          groups[type] = []
        }
        groups[type].push(location)
      })
      return groups
    },

    /**
     * Get locations grouped by status
     */
    locationsByStatus: (state) => {
      const groups = {}
      state.locations.forEach(location => {
        const status = location.locationStatus || 'Unknown'
        if (!groups[status]) {
          groups[status] = []
        }
        groups[status].push(location)
      })
      return groups
    },

    /**
     * Get locations statistics
     */
    locationsStatistics: (state) => {
      const stats = {
        total: state.locations.length,
        byType: {},
        byStatus: {},
        bySecurityLevel: {},
        inventoryCapable: 0,
        receivingCapable: 0,
        issuingCapable: 0,
        withCoordinates: 0,
        rootLocations: 0
      }

      const childrenMap = new Map()

      state.locations.forEach(location => {
        // Count by type
        const type = location.locationType || 'Other'
        stats.byType[type] = (stats.byType[type] || 0) + 1

        // Count by status
        const status = location.locationStatus || 'Unknown'
        stats.byStatus[status] = (stats.byStatus[status] || 0) + 1

        // Count by security level
        const security = location.securityLevel || 'Unknown'
        stats.bySecurityLevel[security] = (stats.bySecurityLevel[security] || 0) + 1

        // Count capabilities
        if (location.isInventoryLocation) stats.inventoryCapable++
        if (location.isReceivingLocation) stats.receivingCapable++
        if (location.isIssuingLocation) stats.issuingCapable++

        // Count locations with coordinates
        if (location.latitude && location.longitude) stats.withCoordinates++

        // Build children map for root calculation
        if (location.parentLocationId) {
          if (!childrenMap.has(location.parentLocationId)) {
            childrenMap.set(location.parentLocationId, [])
          }
          childrenMap.get(location.parentLocationId).push(location.recCode)
        } else {
          stats.rootLocations++
        }
      })

      return stats
    },

    /**
     * Check if location is loaded
     */
    isLocationLoaded: (state) => (locationId) => {
      return state.currentLocation?.recCode === locationId ||
             state.locationsCache.has(locationId)
    },

    /**
     * Get cached location
     */
    getCachedLocation: (state) => (locationId) => {
      return state.locationsCache.get(locationId)
    },

    /**
     * Get locations for dropdown/selection
     */
    locationsForSelection: (state) => {
      return state.locations.map(location => ({
        label: locationsService.formatLocationDisplayName(location),
        value: location.recCode,
        ...location
      }))
    },

    /**
     * Get active locations for selection
     */
    activeLocationsForSelection: (state) => {
      return state.locations
        .filter(location => location.locationStatus === 'Active')
        .map(location => ({
          label: locationsService.formatLocationDisplayName(location),
          value: location.recCode,
          ...location
        }))
    },

    /**
     * Get location hierarchy as tree options
     */
    locationTreeOptions: (state) => {
      const buildTreeOptions = (locations, parentId = null, level = 0) => {
        return locations
          .filter(loc => loc.parentLocationId === parentId)
          .map(location => ({
            label: location.locationName,
            value: location.recCode,
            icon: locationsService.getLocationTypeIcon(location.locationType),
            level: level,
            children: buildTreeOptions(locations, location.recCode, level + 1),
            ...location
          }))
      }

      return buildTreeOptions(state.locations)
    }
  },

  actions: {
    /**
     * Fetch all locations
     */
    async fetchLocations(params = {}) {
      this.isLoading = true

      try {
        const queryParams = {
          page: params.page ?? this.currentPage,
          size: params.size ?? this.pageSize,
          sort: this.sortBy,
          direction: this.sortDirection,
          ...params
        }

        const response = await locationsService.getAllLocations(queryParams)

        if (response.success) {
          this.locations = response.data.content || response.data
          this.totalLocations = response.data.totalElements || this.locations.length
          this.currentPage = response.data.number || 0
          this.pageSize = response.data.size || this.pageSize

          // Cache locations
          this.locations.forEach(location => {
            this.locationsCache.set(location.recCode, location)
            this.cacheTimestamps.set(location.recCode, Date.now())
          })

          // Build tree structure
          this.buildLocationTree()
        }

        return response
      } catch (error) {
        showError('Failed to fetch locations')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Fetch single location
     */
    async fetchLocation(locationId) {
      // Check cache first
      if (this.isValidCache(locationId)) {
        this.currentLocation = this.locationsCache.get(locationId)
        return this.currentLocation
      }

      this.isLoading = true

      try {
        const response = await locationsService.getLocationById(locationId)

        if (response.success) {
          this.currentLocation = response.data
          this.locationsCache.set(locationId, response.data)
          this.cacheTimestamps.set(locationId, Date.now())
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch location')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Create location
     */
    async createLocation(locationData) {
      this.isLoading = true

      try {
        const response = await locationsService.createLocation(locationData)

        if (response.success) {
          this.locations.unshift(response.data)
          this.totalLocations++
          this.locationsCache.set(response.data.recCode, response.data)
          this.cacheTimestamps.set(response.data.recCode, Date.now())

          // Rebuild tree structure
          this.buildLocationTree()

          showSuccess('Location created successfully')
        }

        return response
      } catch (error) {
        showError('Failed to create location')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Update location
     */
    async updateLocation(locationId, updateData) {
      this.isLoading = true

      try {
        const response = await locationsService.updateLocation(locationId, updateData)

        if (response.success) {
          // Update in list
          const index = this.locations.findIndex(l => l.recCode === locationId)
          if (index !== -1) {
            this.locations[index] = { ...this.locations[index], ...response.data }
          }

          // Update current location
          if (this.currentLocation?.recCode === locationId) {
            this.currentLocation = { ...this.currentLocation, ...response.data }
          }

          // Update cache
          this.locationsCache.set(locationId, response.data)
          this.cacheTimestamps.set(locationId, Date.now())

          // Rebuild tree structure
          this.buildLocationTree()

          showSuccess('Location updated successfully')
        }

        return response
      } catch (error) {
        showError('Failed to update location')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Delete location
     */
    async deleteLocation(locationId) {
      this.isLoading = true

      try {
        await locationsService.deleteLocation(locationId)

        // Remove from list
        this.locations = this.locations.filter(l => l.recCode !== locationId)
        this.totalLocations--

        // Clear current if deleted
        if (this.currentLocation?.recCode === locationId) {
          this.currentLocation = null
        }

        // Clear cache
        this.locationsCache.delete(locationId)
        this.cacheTimestamps.delete(locationId)
        this.childrenCache.delete(locationId)

        // Rebuild tree structure
        this.buildLocationTree()

        showSuccess('Location deleted successfully')
        return true
      } catch (error) {
        showError('Failed to delete location')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Search locations
     */
    async searchLocations(searchTerm, filters = {}, params = {}) {
      this.isLoading = true

      try {
        const response = await locationsService.searchLocations(searchTerm, filters, params)

        if (response.success) {
          this.locations = response.data.content || response.data
          this.totalLocations = response.data.totalElements || this.locations.length
          this.buildLocationTree()
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
     * Fetch locations by type
     */
    async fetchLocationsByType(locationType) {
      try {
        const response = await locationsService.getLocationsByType(locationType)
        return response.data
      } catch (error) {
        showError('Failed to fetch locations by type')
        throw error
      }
    },

    /**
     * Fetch root locations
     */
    async fetchRootLocations(force = false) {
      if (!force && this.rootLocations.length > 0) {
        return this.rootLocations
      }

      try {
        const response = await locationsService.getRootLocations()

        if (response.success) {
          this.rootLocations = response.data
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch root locations')
        throw error
      }
    },

    /**
     * Fetch location children
     */
    async fetchLocationChildren(locationId, force = false) {
      const cacheKey = `children_${locationId}`

      if (!force && this.childrenCache.has(cacheKey)) {
        return this.childrenCache.get(cacheKey)
      }

      try {
        const response = await locationsService.getLocationChildren(locationId)

        if (response.success) {
          this.childrenCache.set(cacheKey, response.data)
          this.cacheTimestamps.set(cacheKey, Date.now())
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch location children')
        throw error
      }
    },

    /**
     * Fetch inventory locations
     */
    async fetchInventoryLocations(force = false) {
      if (!force && this.inventoryLocations.length > 0) {
        return this.inventoryLocations
      }

      try {
        const response = await locationsService.getInventoryLocations()

        if (response.success) {
          this.inventoryLocations = response.data
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch inventory locations')
        throw error
      }
    },

    /**
     * Fetch receiving locations
     */
    async fetchReceivingLocations(force = false) {
      if (!force && this.receivingLocations.length > 0) {
        return this.receivingLocations
      }

      try {
        const response = await locationsService.getReceivingLocations()

        if (response.success) {
          this.receivingLocations = response.data
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch receiving locations')
        throw error
      }
    },

    /**
     * Fetch issuing locations
     */
    async fetchIssuingLocations(force = false) {
      if (!force && this.issuingLocations.length > 0) {
        return this.issuingLocations
      }

      try {
        const response = await locationsService.getIssuingLocations()

        if (response.success) {
          this.issuingLocations = response.data
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch issuing locations')
        throw error
      }
    },

    /**
     * Fetch location statistics
     */
    async fetchLocationStatistics(force = false) {
      const cacheKey = 'locationStatistics'

      if (!force && this.isValidCache(cacheKey)) {
        return this.locationStatistics
      }

      try {
        const response = await locationsService.getLocationStatistics()

        if (response.success) {
          this.locationStatistics = response.data
          this.statisticsCache.set(cacheKey, response.data)
          this.cacheTimestamps.set(cacheKey, Date.now())
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch location statistics')
        throw error
      }
    },

    /**
     * Build location tree structure
     */
    buildLocationTree() {
      this.locationTree = locationsService.buildLocationTree(this.locations)
    },

    /**
     * Get location path (breadcrumb)
     */
    getLocationPath(locationId) {
      return locationsService.getLocationPath(locationId, this.locations)
    },

    /**
     * Calculate distance between locations
     */
    calculateDistance(location1Id, location2Id) {
      const location1 = this.locations.find(l => l.recCode === location1Id)
      const location2 = this.locations.find(l => l.recCode === location2Id)

      if (!location1 || !location2) return null

      return locationsService.calculateDistance(location1, location2)
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
        locationType: null,
        locationStatus: null,
        parentLocationId: null,
        projectNodeId: null,
        city: null,
        state: null,
        pinCode: null,
        securityLevel: null,
        isInventoryLocation: null,
        isReceivingLocation: null,
        isIssuingLocation: null,
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
      this.fetchLocations()
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
      this.locationsCache.clear()
      this.childrenCache.clear()
      this.statisticsCache.clear()
      this.cacheTimestamps.clear()
    },

    clearExpiredCache() {
      const now = Date.now()
      for (const [key, timestamp] of this.cacheTimestamps.entries()) {
        if (now - timestamp >= this.CACHE_TTL) {
          this.locationsCache.delete(key)
          this.childrenCache.delete(key)
          this.statisticsCache.delete(key)
          this.cacheTimestamps.delete(key)
        }
      }
    },

    /**
     * Utility methods
     */
    getLocationTypeIcon(locationType) {
      return locationsService.getLocationTypeIcon(locationType)
    },

    getLocationStatusColor(status) {
      return locationsService.getLocationStatusColor(status)
    },

    getSecurityLevelColor(securityLevel) {
      return locationsService.getSecurityLevelColor(securityLevel)
    },

    formatLocationDisplayName(location) {
      return locationsService.formatLocationDisplayName(location)
    },

    getLocationCapabilities(location) {
      return locationsService.getLocationCapabilities(location)
    },

    formatStorageCapacity(capacity, unit) {
      return locationsService.formatStorageCapacity(capacity, unit)
    },

    formatWorkingHours(workingHours) {
      return locationsService.formatWorkingHours(workingHours)
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
