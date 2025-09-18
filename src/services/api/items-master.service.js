/* eslint-disable no-useless-catch */
// src/services/api/items-master.service.js
import { api } from 'boot/axios'
import { API_ENDPOINTS, PAGINATION } from 'src/constants/api.constants'

class ItemsMasterService {

  /**
   * Create new item
   * @param {Object} itemData - Item creation data
   * @returns {Promise<Object>} Created item
   */
  async createItem(itemData) {
    try {
      const response = await api.post(API_ENDPOINTS.ITEMS.BASE, itemData)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get item by ID
   * @param {string} itemId - Item ID
   * @returns {Promise<Object>} Item data
   */
  async getItemById(itemId) {
    try {
      const response = await api.get(API_ENDPOINTS.ITEMS.BY_ID(itemId))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Update item
   * @param {string} itemId - Item ID
   * @param {Object} itemData - Updated item data
   * @returns {Promise<Object>} Updated item
   */
  async updateItem(itemId, itemData) {
    try {
      const response = await api.put(API_ENDPOINTS.ITEMS.BY_ID(itemId), itemData)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Delete item
   * @param {string} itemId - Item ID
   * @returns {Promise<void>}
   */
  async deleteItem(itemId) {
    try {
      await api.delete(API_ENDPOINTS.ITEMS.BY_ID(itemId))
    } catch (error) {
      throw error
    }
  }

  /**
   * Get all items with pagination
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Paginated items
   */
  async getAllItems(params = {}) {
    try {
      const queryParams = {
        page: params.page || PAGINATION.DEFAULT_PAGE,
        size: params.size || PAGINATION.DEFAULT_SIZE,
        sort: `${params.sort || 'itemName'},${params.direction || 'ASC'}`,
        itemStatus: params.itemStatus
      }

      const response = await api.get(API_ENDPOINTS.ITEMS.BASE, { params: queryParams })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Search items with filters
   * @param {string} searchTerm - Search term
   * @param {Object} filters - Search filters
   * @param {Object} params - Pagination parameters
   * @returns {Promise<Object>} Search results
   */
  async searchItems(searchTerm, filters = {}, params = {}) {
    try {
      const queryParams = {
        searchTerm,
        page: params.page || PAGINATION.DEFAULT_PAGE,
        size: params.size || PAGINATION.DEFAULT_SIZE,
        sort: `${params.sort || 'itemName'},${params.direction || 'ASC'}`,
        ...filters
      }

      const response = await api.get(API_ENDPOINTS.ITEMS.SEARCH, { params: queryParams })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get items by category
   * @param {string} categoryId - Category ID
   * @returns {Promise<Array>} Items array
   */
  async getItemsByCategory(categoryId) {
    try {
      const response = await api.get(API_ENDPOINTS.ITEMS.BY_CATEGORY(categoryId))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get items by status
   * @param {string} status - Item status
   * @returns {Promise<Array>} Items array
   */
  async getItemsByStatus(status) {
    try {
      const response = await api.get(API_ENDPOINTS.ITEMS.BY_STATUS(status))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get items by material and grade
   * @param {string} material - Material name
   * @param {string} grade - Grade (optional)
   * @returns {Promise<Array>} Items array
   */
  async getItemsByMaterialAndGrade(material, grade = null) {
    try {
      const params = grade ? { grade } : {}
      const response = await api.get(API_ENDPOINTS.ITEMS.BY_MATERIAL(material), { params })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get items by HSN code
   * @param {string} hsnCode - HSN code
   * @returns {Promise<Array>} Items array
   */
  async getItemsByHsnCode(hsnCode) {
    try {
      const response = await api.get(API_ENDPOINTS.ITEMS.BY_HSN(hsnCode))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get items by preferred vendor
   * @param {string} vendorId - Vendor ID
   * @returns {Promise<Array>} Items array
   */
  async getItemsByPreferredVendor(vendorId) {
    try {
      const response = await api.get(API_ENDPOINTS.ITEMS.BY_VENDOR(vendorId))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get items requiring testing
   * @returns {Promise<Array>} Items array
   */
  async getItemsRequiringTesting() {
    try {
      const response = await api.get(API_ENDPOINTS.ITEMS.TESTING_REQUIRED)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get items requiring samples
   * @returns {Promise<Array>} Items array
   */
  async getItemsRequiringSamples() {
    try {
      const response = await api.get(API_ENDPOINTS.ITEMS.SAMPLES_REQUIRED)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get items requiring QR tracking
   * @returns {Promise<Array>} Items array
   */
  async getItemsRequiringQRTracking() {
    try {
      const response = await api.get(API_ENDPOINTS.ITEMS.QR_TRACKING_REQUIRED)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get items requiring serial numbers
   * @returns {Promise<Array>} Items array
   */
  async getItemsRequiringSerialNumbers() {
    try {
      const response = await api.get(API_ENDPOINTS.ITEMS.SERIAL_NUMBERS_REQUIRED)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get items requiring reorder
   * @returns {Promise<Array>} Items array
   */
  async getItemsRequiringReorder() {
    try {
      const response = await api.get(API_ENDPOINTS.ITEMS.REORDER_REQUIRED)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get items by cost range
   * @param {number} minCost - Minimum cost
   * @param {number} maxCost - Maximum cost
   * @returns {Promise<Array>} Items array
   */
  async getItemsByCostRange(minCost = null, maxCost = null) {
    try {
      const params = {}
      if (minCost !== null) params.minCost = minCost
      if (maxCost !== null) params.maxCost = maxCost

      const response = await api.get(API_ENDPOINTS.ITEMS.COST_RANGE, { params })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get items with missing information
   * @returns {Promise<Array>} Items array
   */
  async getItemsWithMissingInformation() {
    try {
      const response = await api.get(API_ENDPOINTS.ITEMS.MISSING_INFO)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get recently added items
   * @param {number} limit - Limit
   * @returns {Promise<Array>} Items array
   */
  async getRecentlyAddedItems(limit = 10) {
    try {
      const response = await api.get(API_ENDPOINTS.ITEMS.RECENT, {
        params: { limit }
      })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Bulk create items
   * @param {Object} bulkData - Bulk creation data
   * @returns {Promise<Object>} Bulk operation result
   */
  async bulkCreateItems(bulkData) {
    try {
      const response = await api.post(API_ENDPOINTS.ITEMS.BULK_CREATE, bulkData)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Bulk update item status
   * @param {Object} bulkData - Bulk update data
   * @returns {Promise<Object>} Bulk operation result
   */
  async bulkUpdateItemStatus(bulkData) {
    try {
      const response = await api.put(API_ENDPOINTS.ITEMS.BULK_STATUS, bulkData)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Bulk update item category
   * @param {Object} bulkData - Bulk update data
   * @returns {Promise<Object>} Bulk operation result
   */
  async bulkUpdateItemCategory(bulkData) {
    try {
      const response = await api.put(API_ENDPOINTS.ITEMS.BULK_CATEGORY, bulkData)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Bulk update testing requirements
   * @param {Object} bulkData - Bulk update data
   * @returns {Promise<Object>} Bulk operation result
   */
  async bulkUpdateTestingRequirements(bulkData) {
    try {
      const response = await api.put(API_ENDPOINTS.ITEMS.BULK_TESTING, bulkData)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Bulk update inventory properties
   * @param {Object} bulkData - Bulk update data
   * @returns {Promise<Object>} Bulk operation result
   */
  async bulkUpdateInventoryProperties(bulkData) {
    try {
      const response = await api.put(API_ENDPOINTS.ITEMS.BULK_INVENTORY, bulkData)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Bulk update preferred vendor
   * @param {Object} bulkData - Bulk update data
   * @returns {Promise<Object>} Bulk operation result
   */
  async bulkUpdatePreferredVendor(bulkData) {
    try {
      const response = await api.put(API_ENDPOINTS.ITEMS.BULK_VENDOR, bulkData)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Bulk delete items
   * @param {Object} bulkData - Bulk delete data
   * @returns {Promise<Object>} Bulk operation result
   */
  async bulkDeleteItems(bulkData) {
    try {
      const response = await api.delete(API_ENDPOINTS.ITEMS.BULK_DELETE, { data: bulkData })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Update item metadata
   * @param {string} itemId - Item ID
   * @param {Object} metadata - Metadata object
   * @returns {Promise<void>}
   */
  async updateItemMetadata(itemId, metadata) {
    try {
      await api.put(API_ENDPOINTS.ITEMS.UPDATE_METADATA(itemId), metadata)
    } catch (error) {
      throw error
    }
  }

  /**
   * Get item metadata
   * @param {string} itemId - Item ID
   * @returns {Promise<Object>} Metadata object
   */
  async getItemMetadata(itemId) {
    try {
      const response = await api.get(API_ENDPOINTS.ITEMS.GET_METADATA(itemId))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Update alternate units
   * @param {string} itemId - Item ID
   * @param {Array} alternateUnits - Alternate units array
   * @returns {Promise<void>}
   */
  async updateAlternateUnits(itemId, alternateUnits) {
    try {
      await api.put(API_ENDPOINTS.ITEMS.UPDATE_ALTERNATE_UNITS(itemId), alternateUnits)
    } catch (error) {
      throw error
    }
  }

  /**
   * Get alternate units
   * @param {string} itemId - Item ID
   * @returns {Promise<Array>} Alternate units array
   */
  async getAlternateUnits(itemId) {
    try {
      const response = await api.get(API_ENDPOINTS.ITEMS.GET_ALTERNATE_UNITS(itemId))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get item statistics
   * @returns {Promise<Object>} Item statistics
   */
  async getItemStatistics() {
    try {
      const response = await api.get(API_ENDPOINTS.ITEMS.STATISTICS)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get item statistics by category
   * @returns {Promise<Object>} Category statistics
   */
  async getItemStatisticsByCategory() {
    try {
      const response = await api.get(API_ENDPOINTS.ITEMS.ANALYTICS_CATEGORY)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get item statistics by material
   * @returns {Promise<Object>} Material statistics
   */
  async getItemStatisticsByMaterial() {
    try {
      const response = await api.get(API_ENDPOINTS.ITEMS.ANALYTICS_MATERIAL)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get testing requirement statistics
   * @returns {Promise<Object>} Testing statistics
   */
  async getTestingRequirementStatistics() {
    try {
      const response = await api.get(API_ENDPOINTS.ITEMS.ANALYTICS_TESTING)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get inventory analytics
   * @returns {Promise<Object>} Inventory analytics
   */
  async getInventoryAnalytics() {
    try {
      const response = await api.get(API_ENDPOINTS.ITEMS.ANALYTICS_INVENTORY)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get cost analytics
   * @returns {Promise<Object>} Cost analytics
   */
  async getCostAnalytics() {
    try {
      const response = await api.get(API_ENDPOINTS.ITEMS.ANALYTICS_COST)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Check item code uniqueness
   * @param {string} itemCode - Item code
   * @param {string} excludeId - ID to exclude
   * @returns {Promise<boolean>} Uniqueness check result
   */
  async isItemCodeUnique(itemCode, excludeId = null) {
    try {
      const params = excludeId ? { excludeId } : {}
      const response = await api.get(API_ENDPOINTS.ITEMS.VALIDATE_CODE(itemCode), { params })
      return response.data.isUnique
    } catch (error) {
      throw error
    }
  }

  /**
   * Check if item can be deleted
   * @param {string} itemId - Item ID
   * @returns {Promise<boolean>} Can delete flag
   */
  async canDeleteItem(itemId) {
    try {
      const response = await api.get(API_ENDPOINTS.ITEMS.CAN_DELETE(itemId))
      return response.data.canDelete
    } catch (error) {
      throw error
    }
  }

  /**
   * Generate item code
   * @returns {Promise<string>} Generated item code
   */
  async generateItemCode() {
    try {
      const response = await api.get(API_ENDPOINTS.ITEMS.GENERATE_CODE)
      return response.data.itemCode
    } catch (error) {
      throw error
    }
  }

  /**
   * Export items
   * @param {Array} itemIds - Item IDs to export
   * @param {string} exportFormat - Export format
   * @param {boolean} includeMetadata - Include metadata flag
   * @returns {Promise<Object>} Export result
   */
  async exportItems(itemIds = null, exportFormat = 'EXCEL', includeMetadata = true) {
    try {
      const response = await api.post(API_ENDPOINTS.ITEMS.EXPORT, itemIds, {
        params: { exportFormat, includeMetadata }
      })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get all materials
   * @returns {Promise<Array>} Materials array
   */
  async getAllMaterials() {
    try {
      const response = await api.get(API_ENDPOINTS.ITEMS.MATERIALS)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get all grades
   * @returns {Promise<Array>} Grades array
   */
  async getAllGrades() {
    try {
      const response = await api.get(API_ENDPOINTS.ITEMS.GRADES)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get all HSN codes
   * @returns {Promise<Array>} HSN codes array
   */
  async getAllHSNCodes() {
    try {
      const response = await api.get(API_ENDPOINTS.ITEMS.HSN_CODES)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Validate item data
   * @param {string} itemId - Item ID
   * @returns {Promise<Object>} Validation result
   */
  async validateItemData(itemId) {
    try {
      const response = await api.get(API_ENDPOINTS.ITEMS.VALIDATE_DATA(itemId))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get item status icon
   * @param {string} status - Item status
   * @returns {string} Icon name
   */
  getItemStatusIcon(status) {
    const iconMap = {
      'Active': 'check_circle',
      'Inactive': 'radio_button_unchecked',
      'Draft': 'edit',
      'Discontinued': 'cancel'
    }
    return iconMap[status] || 'help'
  }

  /**
   * Get item status color
   * @param {string} status - Item status
   * @returns {string} Color name
   */
  getItemStatusColor(status) {
    const colorMap = {
      'Active': 'positive',
      'Inactive': 'grey',
      'Draft': 'warning',
      'Discontinued': 'negative'
    }
    return colorMap[status] || 'grey'
  }

  /**
   * Format item display name
   * @param {Object} item - Item object
   * @returns {string} Formatted display name
   */
  formatItemDisplayName(item) {
    if (!item) return ''
    return item.itemCode ? `${item.itemName} (${item.itemCode})` : item.itemName
  }

  /**
   * Get requirement badges
   * @param {Object} item - Item object
   * @returns {Array} Requirements array
   */
  getItemRequirements(item) {
    const requirements = []

    if (item.isTestingRequired) {
      requirements.push({ label: 'Testing Required', color: 'orange', icon: 'science' })
    }
    if (item.isSampleRequired) {
      requirements.push({ label: 'Sample Required', color: 'blue', icon: 'assessment' })
    }
    if (item.isQRTrackingRequired) {
      requirements.push({ label: 'QR Tracking', color: 'purple', icon: 'qr_code' })
    }
    if (item.isSerialNumberRequired) {
      requirements.push({ label: 'Serial Number', color: 'teal', icon: 'tag' })
    }

    return requirements
  }

  /**
   * Check if item requires reorder
   * @param {Object} item - Item object
   * @returns {boolean} Requires reorder flag
   */
  requiresReorder(item) {
    if (!item.currentStock || !item.reorderLevel) return false
    return parseFloat(item.currentStock) <= parseFloat(item.reorderLevel)
  }

  /**
   * Calculate stock status
   * @param {Object} item - Item object
   * @returns {Object} Stock status
   */
  getStockStatus(item) {
    if (!item.currentStock || !item.reorderLevel) {
      return { status: 'unknown', color: 'grey', label: 'Unknown' }
    }

    const current = parseFloat(item.currentStock)
    const reorder = parseFloat(item.reorderLevel)
    const safety = parseFloat(item.safetyStock || 0)

    if (current <= safety) {
      return { status: 'critical', color: 'negative', label: 'Critical' }
    } else if (current <= reorder) {
      return { status: 'low', color: 'warning', label: 'Low Stock' }
    } else if (item.maxStockLevel && current >= parseFloat(item.maxStockLevel)) {
      return { status: 'overstock', color: 'info', label: 'Overstock' }
    } else {
      return { status: 'normal', color: 'positive', label: 'Normal' }
    }
  }

  /**
   * Format cost display
   * @param {number} cost - Cost value
   * @param {string} currency - Currency symbol
   * @returns {string} Formatted cost
   */
  formatCost(cost, currency = '₹') {
    if (!cost) return 'N/A'
    return `${currency}${parseFloat(cost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
  }
}

export default new ItemsMasterService()
