/* eslint-disable no-useless-catch */
// src/services/api/units.service.js
import { api } from 'boot/axios'
import { API_ENDPOINTS, PAGINATION } from 'src/constants/api.constants'

class UnitsService {

  /**
   * Create new unit
   * @param {Object} unitData - Unit creation data
   * @returns {Promise<Object>} Created unit
   */
  async createUnit(unitData) {
    try {
      const response = await api.post(API_ENDPOINTS.UNITS.BASE, unitData)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get unit by ID
   * @param {string} unitId - Unit ID
   * @returns {Promise<Object>} Unit data
   */
  async getUnitById(unitId) {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.BY_ID(unitId))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Update unit
   * @param {string} unitId - Unit ID
   * @param {Object} unitData - Updated unit data
   * @returns {Promise<Object>} Updated unit
   */
  async updateUnit(unitId, unitData) {
    try {
      const response = await api.put(API_ENDPOINTS.UNITS.BY_ID(unitId), unitData)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Delete unit
   * @param {string} unitId - Unit ID
   * @returns {Promise<void>}
   */
  async deleteUnit(unitId) {
    try {
      await api.delete(API_ENDPOINTS.UNITS.BY_ID(unitId))
    } catch (error) {
      throw error
    }
  }

  /**
   * Get all units with pagination
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Paginated units
   */
  async getAllUnits(params = {}) {
    try {
      const queryParams = {
        page: params.page || PAGINATION.DEFAULT_PAGE,
        size: params.size || PAGINATION.DEFAULT_SIZE,
        sort: `${params.sort || 'displayOrder'},${params.direction || 'ASC'}`,
        unitType: params.unitType,
        unitCategory: params.unitCategory
      }

      const response = await api.get(API_ENDPOINTS.UNITS.BASE, { params: queryParams })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Search units with filters
   * @param {string} searchTerm - Search term
   * @param {Object} filters - Search filters
   * @param {Object} params - Pagination parameters
   * @returns {Promise<Object>} Search results
   */
  async searchUnits(searchTerm, filters = {}, params = {}) {
    try {
      const queryParams = {
        searchTerm,
        page: params.page || PAGINATION.DEFAULT_PAGE,
        size: params.size || PAGINATION.DEFAULT_SIZE,
        sort: `${params.sort || 'displayOrder'},${params.direction || 'ASC'}`,
        ...filters
      }

      const response = await api.get(API_ENDPOINTS.UNITS.SEARCH, { params: queryParams })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get units by type
   * @param {string} unitType - Unit type
   * @returns {Promise<Array>} Units array
   */
  async getUnitsByType(unitType) {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.BY_TYPE(unitType))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get units by category
   * @param {string} unitCategory - Unit category
   * @returns {Promise<Array>} Units array
   */
  async getUnitsByCategory(unitCategory) {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.BY_CATEGORY(unitCategory))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get units by type and category
   * @param {string} unitType - Unit type
   * @param {string} unitCategory - Unit category
   * @returns {Promise<Array>} Units array
   */
  async getUnitsByTypeAndCategory(unitType, unitCategory) {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.BY_TYPE_AND_CATEGORY(unitType, unitCategory))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get base units
   * @returns {Promise<Array>} Base units array
   */
  async getBaseUnits() {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.BASE_UNITS)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get derived units by base unit
   * @param {string} baseUnitId - Base unit ID
   * @returns {Promise<Array>} Derived units array
   */
  async getDerivedUnitsByBaseUnit(baseUnitId) {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.DERIVED_BY_BASE(baseUnitId))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get convertible units
   * @param {string} unitType - Unit type
   * @param {string} excludeUnitId - Unit ID to exclude
   * @returns {Promise<Array>} Convertible units array
   */
  async getConvertibleUnits(unitType, excludeUnitId = null) {
    try {
      const params = excludeUnitId ? { excludeUnitId } : {}
      const response = await api.get(API_ENDPOINTS.UNITS.CONVERTIBLE(unitType), { params })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get system units
   * @returns {Promise<Array>} System units array
   */
  async getSystemUnits() {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.SYSTEM_UNITS)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get user-defined units
   * @returns {Promise<Array>} User-defined units array
   */
  async getUserDefinedUnits() {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.USER_DEFINED)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Mark unit as system unit
   * @param {string} unitId - Unit ID
   * @param {boolean} isSystemUnit - System unit flag
   * @returns {Promise<void>}
   */
  async markAsSystemUnit(unitId, isSystemUnit) {
    try {
      await api.put(API_ENDPOINTS.UNITS.MARK_SYSTEM(unitId), null, {
        params: { isSystemUnit }
      })
    } catch (error) {
      throw error
    }
  }

  /**
   * Convert value between units
   * @param {Object} conversionData - Conversion request data
   * @returns {Promise<Object>} Conversion result
   */
  async convertValue(conversionData) {
    try {
      const response = await api.post(API_ENDPOINTS.UNITS.CONVERT, conversionData)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get conversion factor between units
   * @param {string} fromUnitId - From unit ID
   * @param {string} toUnitId - To unit ID
   * @returns {Promise<Object>} Conversion factor
   */
  async getConversionFactor(fromUnitId, toUnitId) {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.CONVERSION_FACTOR, {
        params: { fromUnitId, toUnitId }
      })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Check if units are convertible
   * @param {string} fromUnitId - From unit ID
   * @param {string} toUnitId - To unit ID
   * @returns {Promise<Object>} Convertibility check result
   */
  async areUnitsConvertible(fromUnitId, toUnitId) {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.CONVERTIBLE_CHECK, {
        params: { fromUnitId, toUnitId }
      })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Update display order
   * @param {string} unitId - Unit ID
   * @param {number} displayOrder - Display order
   * @returns {Promise<void>}
   */
  async updateDisplayOrder(unitId, displayOrder) {
    try {
      await api.put(API_ENDPOINTS.UNITS.UPDATE_DISPLAY_ORDER(unitId), null, {
        params: { displayOrder }
      })
    } catch (error) {
      throw error
    }
  }

  /**
   * Reorder units in type
   * @param {string} unitType - Unit type
   * @param {Array} orderedUnitIds - Ordered unit IDs
   * @returns {Promise<void>}
   */
  async reorderUnitsInType(unitType, orderedUnitIds) {
    try {
      await api.put(API_ENDPOINTS.UNITS.REORDER_IN_TYPE(unitType), orderedUnitIds)
    } catch (error) {
      throw error
    }
  }

  /**
   * Get next display order for type
   * @param {string} unitType - Unit type
   * @returns {Promise<Object>} Next display order
   */
  async getNextDisplayOrder(unitType) {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.NEXT_DISPLAY_ORDER(unitType))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Optimize display orders for type
   * @param {string} unitType - Unit type
   * @returns {Promise<void>}
   */
  async optimizeDisplayOrders(unitType) {
    try {
      await api.post(API_ENDPOINTS.UNITS.OPTIMIZE_ORDER(unitType))
    } catch (error) {
      throw error
    }
  }

  /**
   * Bulk create units
   * @param {Object} bulkData - Bulk creation data
   * @returns {Promise<Object>} Bulk operation result
   */
  async bulkCreateUnits(bulkData) {
    try {
      const response = await api.post(API_ENDPOINTS.UNITS.BULK_CREATE, bulkData)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Bulk update display order
   * @param {Object} bulkData - Bulk update data
   * @returns {Promise<Object>} Bulk operation result
   */
  async bulkUpdateDisplayOrder(bulkData) {
    try {
      const response = await api.put(API_ENDPOINTS.UNITS.BULK_DISPLAY_ORDER, bulkData)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Bulk update conversion properties
   * @param {Object} bulkData - Bulk update data
   * @returns {Promise<Object>} Bulk operation result
   */
  async bulkUpdateConversionProperties(bulkData) {
    try {
      const response = await api.put(API_ENDPOINTS.UNITS.BULK_CONVERSION, bulkData)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Bulk delete units
   * @param {Object} bulkData - Bulk delete data
   * @returns {Promise<Object>} Bulk operation result
   */
  async bulkDeleteUnits(bulkData) {
    try {
      const response = await api.delete(API_ENDPOINTS.UNITS.BULK_DELETE, { data: bulkData })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get all unit types
   * @returns {Promise<Array>} Unit types array
   */
  async getAllUnitTypes() {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.TYPES)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get all unit categories
   * @returns {Promise<Array>} Unit categories array
   */
  async getAllUnitCategories() {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.CATEGORIES)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get all unit symbols
   * @returns {Promise<Array>} Unit symbols array
   */
  async getAllUnitSymbols() {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.SYMBOLS)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get units grouped by type
   * @returns {Promise<Object>} Grouped units
   */
  async getUnitsByTypeGrouped() {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.GROUPED_BY_TYPE)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get unit statistics
   * @returns {Promise<Object>} Unit statistics
   */
  async getUnitStatistics() {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.STATISTICS)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get unit statistics by type
   * @returns {Promise<Object>} Type statistics
   */
  async getUnitStatisticsByType() {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.ANALYTICS_TYPE)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get unit statistics by category
   * @returns {Promise<Object>} Category statistics
   */
  async getUnitStatisticsByCategory() {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.ANALYTICS_CATEGORY)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get conversion factor statistics
   * @returns {Promise<Object>} Conversion statistics
   */
  async getConversionFactorStatistics() {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.ANALYTICS_CONVERSION)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get units with missing information
   * @returns {Promise<Array>} Units with missing info
   */
  async getUnitsWithMissingInformation() {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.MISSING_INFO)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get units with complex conversions
   * @returns {Promise<Array>} Units with complex conversions
   */
  async getUnitsWithComplexConversions() {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.COMPLEX_CONVERSIONS)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get recently added units
   * @param {number} limit - Limit
   * @returns {Promise<Array>} Recent units
   */
  async getRecentlyAddedUnits(limit = 10) {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.RECENT, {
        params: { limit }
      })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get unit hierarchy for type
   * @param {string} unitType - Unit type
   * @returns {Promise<Object>} Unit hierarchy
   */
  async getUnitHierarchy(unitType) {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.HIERARCHY(unitType))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get unit path
   * @param {string} unitId - Unit ID
   * @returns {Promise<Array>} Unit path
   */
  async getUnitPath(unitId) {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.PATH(unitId))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Validate unit hierarchy
   * @param {string} unitType - Unit type
   * @returns {Promise<void>}
   */
  async validateUnitHierarchy(unitType) {
    try {
      await api.post(API_ENDPOINTS.UNITS.VALIDATE_HIERARCHY(unitType))
    } catch (error) {
      throw error
    }
  }

  /**
   * Check unit code uniqueness
   * @param {string} unitCode - Unit code
   * @param {string} excludeId - ID to exclude
   * @returns {Promise<Object>} Uniqueness check result
   */
  async isUnitCodeUnique(unitCode, excludeId = null) {
    try {
      const params = excludeId ? { excludeId } : {}
      const response = await api.get(API_ENDPOINTS.UNITS.VALIDATE_CODE(unitCode), { params })
      return response.data.isUnique
    } catch (error) {
      throw error
    }
  }

  /**
   * Check unit name uniqueness
   * @param {string} unitName - Unit name
   * @param {string} excludeId - ID to exclude
   * @returns {Promise<Object>} Uniqueness check result
   */
  async isUnitNameUnique(unitName, excludeId = null) {
    try {
      const params = excludeId ? { excludeId } : {}
      const response = await api.get(API_ENDPOINTS.UNITS.VALIDATE_NAME(unitName), { params })
      return response.data.isUnique
    } catch (error) {
      throw error
    }
  }

  /**
   * Check if unit can be deleted
   * @param {string} unitId - Unit ID
   * @returns {Promise<boolean>} Can delete flag
   */
  async canDeleteUnit(unitId) {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.CAN_DELETE(unitId))
      return response.data.canDelete
    } catch (error) {
      throw error
    }
  }

  /**
   * Check for circular dependency
   * @param {string} unitId - Unit ID
   * @param {string} baseUnitId - Base unit ID
   * @returns {Promise<Object>} Circular dependency check result
   */
  async hasCircularDependency(unitId, baseUnitId) {
    try {
      const params = { baseUnitId }
      if (unitId) params.unitId = unitId

      const response = await api.get(API_ENDPOINTS.UNITS.VALIDATE_CIRCULAR, { params })
      return response.data.hasCircularDependency
    } catch (error) {
      throw error
    }
  }

  /**
   * Validate unit data
   * @param {string} unitId - Unit ID
   * @returns {Promise<Object>} Validation result
   */
  async validateUnitData(unitId) {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.VALIDATE_DATA(unitId))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Export units
   * @param {Array} unitIds - Unit IDs to export
   * @param {string} exportFormat - Export format
   * @returns {Promise<Object>} Export result
   */
  async exportUnits(unitIds = null, exportFormat = 'EXCEL') {
    try {
      const response = await api.post(API_ENDPOINTS.UNITS.EXPORT, unitIds, {
        params: { exportFormat }
      })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get common conversions for a unit
   * @param {string} unitId - Unit ID
   * @returns {Promise<Object>} Common conversions
   */
  async getCommonConversions(unitId) {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.COMMON_CONVERSIONS(unitId))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get unit suggestions for type
   * @param {string} unitType - Unit type
   * @param {string} query - Search query
   * @returns {Promise<Array>} Unit suggestions
   */
  async suggestUnitsForType(unitType, query = '') {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.SUGGESTIONS(unitType), {
        params: { query }
      })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get conversion history
   * @param {number} limit - Limit
   * @returns {Promise<Array>} Conversion history
   */
  async getConversionHistory(limit = 10) {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.CONVERSION_HISTORY, {
        params: { limit }
      })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Add to favorite conversions
   * @param {string} fromUnitId - From unit ID
   * @param {string} toUnitId - To unit ID
   * @returns {Promise<void>}
   */
  async addToFavoriteConversions(fromUnitId, toUnitId) {
    try {
      await api.post(API_ENDPOINTS.UNITS.FAVORITE_CONVERSIONS, null, {
        params: { fromUnitId, toUnitId }
      })
    } catch (error) {
      throw error
    }
  }

  /**
   * Get favorite conversions
   * @returns {Promise<Array>} Favorite conversions
   */
  async getFavoriteConversions() {
    try {
      const response = await api.get(API_ENDPOINTS.UNITS.FAVORITE_CONVERSIONS)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Format unit display name
   * @param {Object} unit - Unit object
   * @returns {string} Formatted display name
   */
  formatUnitDisplayName(unit) {
    if (!unit) return ''
    return unit.unitSymbol ? `${unit.unitName} (${unit.unitSymbol})` : unit.unitName
  }

  /**
   * Get unit type icon
   * @param {string} unitType - Unit type
   * @returns {string} Icon name
   */
  getUnitTypeIcon(unitType) {
    const iconMap = {
      'Length': 'straighten',
      'Weight': 'fitness_center',
      'Volume': 'view_in_ar',
      'Area': 'crop_square',
      'Time': 'schedule',
      'Quantity': 'format_list_numbered',
      'Currency': 'attach_money'
    }
    return iconMap[unitType] || 'label'
  }

  /**
   * Get conversion factor display
   * @param {number} factor - Conversion factor
   * @returns {string} Formatted factor
   */
  getConversionFactorDisplay(factor) {
    if (!factor) return '1'
    if (factor === 1) return '1'
    if (factor < 0.001) return factor.toExponential(3)
    if (factor < 1) return factor.toFixed(6).replace(/\.?0+$/, '')
    return factor.toString()
  }
}

export default new UnitsService()
