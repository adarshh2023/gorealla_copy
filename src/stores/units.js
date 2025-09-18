// src/stores/units.js
import { defineStore } from 'pinia'
import unitsService from 'src/services/api/units.service'
import { showSuccess, showError } from 'src/utils/notification'

export const useUnitsStore = defineStore('units', {
  state: () => ({
    // Units list
    units: [],
    totalUnits: 0,
    currentPage: 0,
    pageSize: 20,

    // Current unit
    currentUnit: null,

    // Unit types and categories
    unitTypes: [],
    unitCategories: [],
    unitSymbols: [],

    // Grouped units
    unitsByType: {},
    baseUnits: [],
    systemUnits: [],
    userDefinedUnits: [],

    // Loading states
    isLoading: false,
    isLoadingTypes: false,
    isLoadingConversion: false,

    // Conversion
    conversionHistory: [],
    favoriteConversions: [],

    // Filters
    filters: {
      search: '',
      unitType: null,
      unitCategory: null,
      isSystemUnit: null,
      isBaseUnit: null
    },

    // Sort
    sortBy: 'displayOrder',
    sortDirection: 'ASC',

    // Cache
    unitsCache: new Map(),
    conversionCache: new Map(),
    hierarchyCache: new Map(),

    // Cache TTL (5 minutes)
    CACHE_TTL: 5 * 60 * 1000,
    cacheTimestamps: new Map()
  }),

  getters: {
    /**
     * Get filtered units
     */
    filteredUnits: (state) => {
      let filtered = [...state.units]

      // Apply search filter
      if (state.filters.search) {
        const search = state.filters.search.toLowerCase()
        filtered = filtered.filter(unit =>
          unit.unitName.toLowerCase().includes(search) ||
          unit.unitCode?.toLowerCase().includes(search) ||
          unit.unitSymbol?.toLowerCase().includes(search)
        )
      }

      // Apply type filter
      if (state.filters.unitType) {
        filtered = filtered.filter(unit =>
          unit.unitType === state.filters.unitType
        )
      }

      // Apply category filter
      if (state.filters.unitCategory) {
        filtered = filtered.filter(unit =>
          unit.unitCategory === state.filters.unitCategory
        )
      }

      // Apply system unit filter
      if (state.filters.isSystemUnit !== null) {
        filtered = filtered.filter(unit =>
          unit.isSystemUnit === state.filters.isSystemUnit
        )
      }

      // Apply base unit filter
      if (state.filters.isBaseUnit !== null) {
        filtered = filtered.filter(unit =>
          unit.isBaseUnit === state.filters.isBaseUnit
        )
      }

      return filtered
    },

    /**
     * Get units grouped by type
     */
    unitsGroupedByType: (state) => {
      const groups = {}
      state.units.forEach(unit => {
        const type = unit.unitType || 'Other'
        if (!groups[type]) {
          groups[type] = []
        }
        groups[type].push(unit)
      })
      return groups
    },

    /**
     * Get units statistics
     */
    unitsStatistics: (state) => {
      const stats = {
        total: state.units.length,
        byType: {},
        byCategory: {},
        systemUnits: 0,
        userDefinedUnits: 0,
        baseUnits: 0
      }

      state.units.forEach(unit => {
        // Count by type
        const type = unit.unitType || 'Other'
        stats.byType[type] = (stats.byType[type] || 0) + 1

        // Count by category
        const category = unit.unitCategory || 'Other'
        stats.byCategory[category] = (stats.byCategory[category] || 0) + 1

        // Count system/user units
        if (unit.isSystemUnit) {
          stats.systemUnits++
        } else {
          stats.userDefinedUnits++
        }

        // Count base units
        if (unit.isBaseUnit) {
          stats.baseUnits++
        }
      })

      return stats
    },

    /**
     * Check if unit is loaded
     */
    isUnitLoaded: (state) => (unitId) => {
      return state.currentUnit?.recCode === unitId ||
             state.unitsCache.has(unitId)
    },

    /**
     * Get cached unit
     */
    getCachedUnit: (state) => (unitId) => {
      return state.unitsCache.get(unitId)
    },

    /**
     * Get units for dropdown/selection
     */
    unitsForSelection: (state) => {
      return state.units.map(unit => ({
        label: unitsService.formatUnitDisplayName(unit),
        value: unit.recCode,
        ...unit
      }))
    },

    /**
     * Get conversion factor display
     */
    getConversionDisplay: () => (factor) => {
      return unitsService.getConversionFactorDisplay(factor)
    }
  },

  actions: {
    /**
     * Fetch all units
     */
    async fetchUnits(params = {}) {
      this.isLoading = true

      try {
        const queryParams = {
          page: params.page ?? this.currentPage,
          size: params.size ?? this.pageSize,
          sort: this.sortBy,
          direction: this.sortDirection,
          ...params
        }

        const response = await unitsService.getAllUnits(queryParams)

        if (response.success) {
          this.units = response.data.content || response.data
          this.totalUnits = response.data.totalElements || this.units.length
          this.currentPage = response.data.number || 0
          this.pageSize = response.data.size || this.pageSize

          // Cache units
          this.units.forEach(unit => {
            this.unitsCache.set(unit.recCode, unit)
            this.cacheTimestamps.set(unit.recCode, Date.now())
          })
        }

        return response
      } catch (error) {
        showError('Failed to fetch units')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Fetch single unit
     */
    async fetchUnit(unitId) {
      // Check cache first
      if (this.isValidCache(unitId)) {
        this.currentUnit = this.unitsCache.get(unitId)
        return this.currentUnit
      }

      this.isLoading = true

      try {
        const response = await unitsService.getUnitById(unitId)

        if (response.success) {
          this.currentUnit = response.data
          this.unitsCache.set(unitId, response.data)
          this.cacheTimestamps.set(unitId, Date.now())
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch unit')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Create unit
     */
    async createUnit(unitData) {
      this.isLoading = true

      try {
        const response = await unitsService.createUnit(unitData)

        if (response.success) {
          this.units.unshift(response.data)
          this.totalUnits++
          this.unitsCache.set(response.data.recCode, response.data)
          this.cacheTimestamps.set(response.data.recCode, Date.now())

          showSuccess('Unit created successfully')
        }

        return response
      } catch (error) {
        showError('Failed to create unit')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Update unit
     */
    async updateUnit(unitId, updateData) {
      this.isLoading = true

      try {
        const response = await unitsService.updateUnit(unitId, updateData)

        if (response.success) {
          // Update in list
          const index = this.units.findIndex(u => u.recCode === unitId)
          if (index !== -1) {
            this.units[index] = { ...this.units[index], ...response.data }
          }

          // Update current unit
          if (this.currentUnit?.recCode === unitId) {
            this.currentUnit = { ...this.currentUnit, ...response.data }
          }

          // Update cache
          this.unitsCache.set(unitId, response.data)
          this.cacheTimestamps.set(unitId, Date.now())

          showSuccess('Unit updated successfully')
        }

        return response
      } catch (error) {
        showError('Failed to update unit')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Delete unit
     */
    async deleteUnit(unitId) {
      // Check if can delete
      const canDelete = await unitsService.canDeleteUnit(unitId)
      if (!canDelete) {
        showError('Cannot delete this unit as it is being used')
        return false
      }

      this.isLoading = true

      try {
        await unitsService.deleteUnit(unitId)

        // Remove from list
        this.units = this.units.filter(u => u.recCode !== unitId)
        this.totalUnits--

        // Clear current if deleted
        if (this.currentUnit?.recCode === unitId) {
          this.currentUnit = null
        }

        // Clear cache
        this.unitsCache.delete(unitId)
        this.cacheTimestamps.delete(unitId)

        showSuccess('Unit deleted successfully')
        return true
      } catch (error) {
        showError('Failed to delete unit')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Search units
     */
    async searchUnits(searchTerm, filters = {}, params = {}) {
      this.isLoading = true

      try {
        const response = await unitsService.searchUnits(searchTerm, filters, params)

        if (response.success) {
          this.units = response.data.content || response.data
          this.totalUnits = response.data.totalElements || this.units.length
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
     * Fetch units by type
     */
    async fetchUnitsByType(unitType, force = false) {
      const cacheKey = `type_${unitType}`

      if (!force && this.isValidCache(cacheKey)) {
        return this.unitsCache.get(cacheKey)
      }

      try {
        const response = await unitsService.getUnitsByType(unitType)

        if (response.success) {
          this.unitsCache.set(cacheKey, response.data)
          this.cacheTimestamps.set(cacheKey, Date.now())
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch units by type')
        throw error
      }
    },

    /**
     * Fetch base units
     */
    async fetchBaseUnits(force = false) {
      if (!force && this.baseUnits.length > 0) {
        return this.baseUnits
      }

      try {
        const response = await unitsService.getBaseUnits()

        if (response.success) {
          this.baseUnits = response.data
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch base units')
        throw error
      }
    },

    /**
     * Fetch derived units for base unit
     */
    async fetchDerivedUnits(baseUnitId) {
      try {
        const response = await unitsService.getDerivedUnitsByBaseUnit(baseUnitId)
        return response.data
      } catch (error) {
        showError('Failed to fetch derived units')
        throw error
      }
    },

    /**
     * Fetch convertible units
     */
    async fetchConvertibleUnits(unitType, excludeUnitId = null) {
      try {
        const response = await unitsService.getConvertibleUnits(unitType, excludeUnitId)
        return response.data
      } catch (error) {
        showError('Failed to fetch convertible units')
        throw error
      }
    },

    /**
     * Convert value between units
     */
    async convertValue(conversionData) {
      this.isLoadingConversion = true

      try {
        const response = await unitsService.convertValue(conversionData)

        if (response.success) {
          // Add to conversion history
          this.conversionHistory.unshift({
            ...conversionData,
            result: response.data.convertedValue,
            timestamp: Date.now()
          })

          // Keep only last 20 conversions
          if (this.conversionHistory.length > 20) {
            this.conversionHistory = this.conversionHistory.slice(0, 20)
          }
        }

        return response
      } catch (error) {
        showError('Conversion failed')
        throw error
      } finally {
        this.isLoadingConversion = false
      }
    },

    /**
     * Get conversion factor
     */
    async getConversionFactor(fromUnitId, toUnitId) {
      const cacheKey = `${fromUnitId}_to_${toUnitId}`

      if (this.conversionCache.has(cacheKey)) {
        return this.conversionCache.get(cacheKey)
      }

      try {
        const response = await unitsService.getConversionFactor(fromUnitId, toUnitId)

        if (response.success) {
          this.conversionCache.set(cacheKey, response.data.conversionFactor)
        }

        return response.data.conversionFactor
      } catch (error) {
        showError('Failed to get conversion factor')
        throw error
      }
    },

    /**
     * Check if units are convertible
     */
    async areUnitsConvertible(fromUnitId, toUnitId) {
      try {
        const response = await unitsService.areUnitsConvertible(fromUnitId, toUnitId)
        return response.data.areConvertible
      } catch (error) {
        console.error('Failed to check convertibility:', error)
        return false
      }
    },

    /**
     * Fetch unit types
     */
    async fetchUnitTypes(force = false) {
      if (!force && this.unitTypes.length > 0) {
        return this.unitTypes
      }

      this.isLoadingTypes = true

      try {
        const response = await unitsService.getAllUnitTypes()

        if (response.success) {
          this.unitTypes = response.data
        }

        return response.data
      } catch (error) {
        console.error('Failed to fetch unit types:', error)
        return []
      } finally {
        this.isLoadingTypes = false
      }
    },

    /**
     * Fetch unit categories
     */
    async fetchUnitCategories(force = false) {
      if (!force && this.unitCategories.length > 0) {
        return this.unitCategories
      }

      try {
        const response = await unitsService.getAllUnitCategories()

        if (response.success) {
          this.unitCategories = response.data
        }

        return response.data
      } catch (error) {
        console.error('Failed to fetch unit categories:', error)
        return []
      }
    },

    /**
     * Update display order
     */
    async updateDisplayOrder(unitId, displayOrder) {
      try {
        await unitsService.updateDisplayOrder(unitId, displayOrder)

        // Update in local state
        const unit = this.units.find(u => u.recCode === unitId)
        if (unit) {
          unit.displayOrder = displayOrder
        }

        if (this.currentUnit?.recCode === unitId) {
          this.currentUnit.displayOrder = displayOrder
        }

        showSuccess('Display order updated')
        return true
      } catch (error) {
        showError('Failed to update display order')
        throw error
      }
    },

    /**
     * Bulk operations
     */
    async bulkCreateUnits(bulkData) {
      this.isLoading = true

      try {
        const response = await unitsService.bulkCreateUnits(bulkData)

        if (response.success) {
          // Refresh units list
          await this.fetchUnits()
          showSuccess(`${response.data.successfulOperations} units created successfully`)
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
     * Bulk delete units
     */
    async bulkDeleteUnits(bulkData) {
      this.isLoading = true

      try {
        const response = await unitsService.bulkDeleteUnits(bulkData)

        if (response.success) {
          // Remove from local state
          this.units = this.units.filter(u => !bulkData.unitIds.includes(u.recCode))
          this.totalUnits -= response.data.successfulOperations

          // Clear cache
          bulkData.unitIds.forEach(id => {
            this.unitsCache.delete(id)
            this.cacheTimestamps.delete(id)
          })

          showSuccess(`${response.data.successfulOperations} units deleted successfully`)
        }

        return response
      } catch (error) {
        showError('Bulk delete failed')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Add to favorite conversions
     */
    async addToFavorites(fromUnitId, toUnitId) {
      try {
        await unitsService.addToFavoriteConversions(fromUnitId, toUnitId)

        // Add to local favorites
        this.favoriteConversions.unshift({
          fromUnitId,
          toUnitId,
          timestamp: Date.now()
        })

        showSuccess('Added to favorite conversions')
      } catch (error) {
        showError('Failed to add to favorites')
        throw error
      }
    },

    /**
     * Fetch favorite conversions
     */
    async fetchFavoriteConversions() {
      try {
        const response = await unitsService.getFavoriteConversions()

        if (response.success) {
          this.favoriteConversions = response.data
        }

        return response.data
      } catch (error) {
        console.error('Failed to fetch favorite conversions:', error)
        return []
      }
    },

    /**
     * Validation methods
     */
    async validateUnitCode(unitCode, excludeId = null) {
      try {
        return await unitsService.isUnitCodeUnique(unitCode, excludeId)
      } catch (error) {
        console.error('Validation failed:', error)
        return false
      }
    },

    async validateUnitName(unitName, excludeId = null) {
      try {
        return await unitsService.isUnitNameUnique(unitName, excludeId)
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
        unitType: null,
        unitCategory: null,
        isSystemUnit: null,
        isBaseUnit: null
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
      this.fetchUnits()
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
      this.unitsCache.clear()
      this.conversionCache.clear()
      this.hierarchyCache.clear()
      this.cacheTimestamps.clear()
    },

    clearExpiredCache() {
      const now = Date.now()
      for (const [key, timestamp] of this.cacheTimestamps.entries()) {
        if (now - timestamp >= this.CACHE_TTL) {
          this.unitsCache.delete(key)
          this.conversionCache.delete(key)
          this.hierarchyCache.delete(key)
          this.cacheTimestamps.delete(key)
        }
      }
    },

    /**
     * Utility methods
     */
    getUnitTypeIcon(unitType) {
      return unitsService.getUnitTypeIcon(unitType)
    },

    formatUnitDisplayName(unit) {
      return unitsService.formatUnitDisplayName(unit)
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
