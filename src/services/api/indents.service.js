/* eslint-disable no-useless-catch */
// src/services/api/indents.service.js
import { api } from 'boot/axios'
import { API_ENDPOINTS, PAGINATION } from 'src/constants/api.constants'

class IndentsService {

  /**
   * Create new indent with items
   * @param {Object} indentData - Indent creation data
   * @returns {Promise<Object>} Created indent
   */
  async createIndent(indentData) {
    try {
      const response = await api.post(API_ENDPOINTS.INDENTS.BASE, indentData)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get indent by ID
   * @param {string} indentId - Indent ID
   * @returns {Promise<Object>} Indent data
   */
  async getIndentById(indentId) {
    try {
      const response = await api.get(API_ENDPOINTS.INDENTS.BY_ID(indentId))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get indent by number
   * @param {string} indentNumber - Indent number
   * @returns {Promise<Object>} Indent data
   */
  async getIndentByNumber(indentNumber) {
    try {
      const response = await api.get(API_ENDPOINTS.INDENTS.BY_NUMBER(indentNumber))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Update indent
   * @param {string} indentId - Indent ID
   * @param {Object} indentData - Updated indent data
   * @returns {Promise<Object>} Updated indent
   */
  async updateIndent(indentId, indentData) {
    try {
      const response = await api.put(API_ENDPOINTS.INDENTS.BY_ID(indentId), indentData)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Delete indent
   * @param {string} indentId - Indent ID
   * @returns {Promise<void>}
   */
  async deleteIndent(indentId) {
    try {
      await api.delete(API_ENDPOINTS.INDENTS.BY_ID(indentId))
    } catch (error) {
      throw error
    }
  }

  /**
   * Get all indents with pagination
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Paginated indents
   */
  async getAllIndents(params = {}) {
    try {
      const queryParams = {
        page: params.page || PAGINATION.DEFAULT_PAGE,
        size: params.size || PAGINATION.DEFAULT_SIZE,
        sort: `${params.sort || 'insertDate'},${params.direction || 'DESC'}`
      }

      const response = await api.get(API_ENDPOINTS.INDENTS.BASE, { params: queryParams })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Search indents
   * @param {string} searchTerm - Search term
   * @param {Object} params - Pagination parameters
   * @returns {Promise<Object>} Search results
   */
  async searchIndents(searchTerm, params = {}) {
    try {
      const queryParams = {
        searchTerm,
        page: params.page || PAGINATION.DEFAULT_PAGE,
        size: params.size || PAGINATION.DEFAULT_SIZE,
        sort: `${params.sort || 'insertDate'},${params.direction || 'DESC'}`
      }

      const response = await api.get(API_ENDPOINTS.INDENTS.SEARCH, { params: queryParams })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Advanced search with filters
   * @param {Object} searchRequest - Search request with filters
   * @param {Object} params - Pagination parameters
   * @returns {Promise<Object>} Search results
   */
  async searchIndentsWithFilters(searchRequest, params = {}) {
    try {
      const queryParams = {
        page: params.page || PAGINATION.DEFAULT_PAGE,
        size: params.size || PAGINATION.DEFAULT_SIZE,
        sort: `${params.sort || 'insertDate'},${params.direction || 'DESC'}`
      }

      const response = await api.post(API_ENDPOINTS.INDENTS.ADVANCED_SEARCH, searchRequest, { params: queryParams })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get indents by project
   * @param {string} projectNodeId - Project node ID
   * @param {Object} params - Pagination parameters
   * @returns {Promise<Object>} Paginated indents
   */
  async getIndentsByProject(projectNodeId, params = {}) {
    try {
      const queryParams = {
        page: params.page || PAGINATION.DEFAULT_PAGE,
        size: params.size || PAGINATION.DEFAULT_SIZE,
        sort: `${params.sort || 'requestedDate'},${params.direction || 'DESC'}`
      }

      const response = await api.get(API_ENDPOINTS.INDENTS.BY_PROJECT(projectNodeId), { params: queryParams })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get indents by requestor
   * @param {string} requestorId - Requestor ID
   * @param {Object} params - Pagination parameters
   * @returns {Promise<Object>} Paginated indents
   */
  async getIndentsByRequestor(requestorId, params = {}) {
    try {
      const queryParams = {
        page: params.page || PAGINATION.DEFAULT_PAGE,
        size: params.size || PAGINATION.DEFAULT_SIZE,
        sort: `${params.sort || 'requestedDate'},${params.direction || 'DESC'}`
      }

      const response = await api.get(API_ENDPOINTS.INDENTS.BY_REQUESTOR(requestorId), { params: queryParams })
      return response
    } catch (error) {
      throw error
    }
  }

  // === Status-based Operations ===

  /**
   * Get indents by status
   * @param {string} status - Indent status
   * @returns {Promise<Array>} Indents array
   */
  async getIndentsByStatus(status) {
    try {
      const response = await api.get(API_ENDPOINTS.INDENTS.BY_STATUS(status))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get pending indents
   * @returns {Promise<Array>} Pending indents array
   */
  async getPendingIndents() {
    try {
      const response = await api.get(API_ENDPOINTS.INDENTS.PENDING_APPROVAL)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get urgent indents
   * @returns {Promise<Array>} Urgent indents array
   */
  async getUrgentIndents() {
    try {
      const response = await api.get(API_ENDPOINTS.INDENTS.URGENT)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get overdue indents
   * @returns {Promise<Array>} Overdue indents array
   */
  async getOverdueIndents() {
    try {
      const response = await api.get(API_ENDPOINTS.INDENTS.OVERDUE)
      return response
    } catch (error) {
      throw error
    }
  }

  // === Approval Operations ===

  /**
   * Submit indent for approval
   * @param {string} indentId - Indent ID
   * @returns {Promise<Object>} Updated indent
   */
  async submitForApproval(indentId) {
    try {
      const response = await api.post(API_ENDPOINTS.INDENTS.SUBMIT(indentId))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Approve indent
   * @param {string} indentId - Indent ID
   * @param {string} approvalNotes - Approval notes
   * @returns {Promise<Object>} Updated indent
   */
  async approveIndent(indentId, approvalNotes = null) {
    try {
      const params = approvalNotes ? { approvalNotes } : {}
      const response = await api.post(API_ENDPOINTS.INDENTS.APPROVE(indentId), null, { params })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Reject indent
   * @param {string} indentId - Indent ID
   * @param {string} rejectionReason - Rejection reason
   * @returns {Promise<Object>} Updated indent
   */
  async rejectIndent(indentId, rejectionReason) {
    try {
      const response = await api.post(API_ENDPOINTS.INDENTS.REJECT(indentId), null, {
        params: { rejectionReason }
      })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Cancel indent
   * @param {string} indentId - Indent ID
   * @param {string} cancellationReason - Cancellation reason
   * @returns {Promise<Object>} Updated indent
   */
  async cancelIndent(indentId, cancellationReason) {
    try {
      const response = await api.post(API_ENDPOINTS.INDENTS.CANCEL(indentId), null, {
        params: { cancellationReason }
      })
      return response
    } catch (error) {
      throw error
    }
  }

  // === Budget Operations ===

  /**
   * Approve budget for indent
   * @param {string} indentId - Indent ID
   * @param {string} budgetApprovalNotes - Budget approval notes
   * @returns {Promise<Object>} Updated indent
   */
  async approveBudget(indentId, budgetApprovalNotes = null) {
    try {
      const params = budgetApprovalNotes ? { budgetApprovalNotes } : {}
      const response = await api.post(API_ENDPOINTS.INDENTS.APPROVE_BUDGET(indentId), null, { params })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Update budget information
   * @param {string} indentId - Indent ID
   * @param {number} estimatedBudget - Estimated budget
   * @param {string} budgetCode - Budget code
   * @returns {Promise<Object>} Updated indent
   */
  async updateBudgetInformation(indentId, estimatedBudget = null, budgetCode = null) {
    try {
      const params = {}
      if (estimatedBudget !== null) params.estimatedBudget = estimatedBudget
      if (budgetCode !== null) params.budgetCode = budgetCode

      const response = await api.put(API_ENDPOINTS.INDENTS.UPDATE_BUDGET(indentId), null, { params })
      return response
    } catch (error) {
      throw error
    }
  }

  // === Indent Items Operations ===

  /**
   * Get indent items
   * @param {string} indentId - Indent ID
   * @returns {Promise<Array>} Indent items array
   */
  async getIndentItems(indentId) {
    try {
      const response = await api.get(API_ENDPOINTS.INDENTS.ITEMS(indentId))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Add item to indent
   * @param {string} indentId - Indent ID
   * @param {Object} itemData - Item data
   * @returns {Promise<Object>} Created item
   */
  async addIndentItem(indentId, itemData) {
    try {
      const response = await api.post(API_ENDPOINTS.INDENTS.ADD_ITEM(indentId), itemData)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Update indent item
   * @param {string} indentId - Indent ID
   * @param {string} itemId - Item ID
   * @param {Object} itemData - Updated item data
   * @returns {Promise<Object>} Updated item
   */
  async updateIndentItem(indentId, itemId, itemData) {
    try {
      const response = await api.put(API_ENDPOINTS.INDENTS.UPDATE_ITEM(indentId, itemId), itemData)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Remove item from indent
   * @param {string} indentId - Indent ID
   * @param {string} itemId - Item ID
   * @returns {Promise<void>}
   */
  async removeIndentItem(indentId, itemId) {
    try {
      await api.delete(API_ENDPOINTS.INDENTS.REMOVE_ITEM(indentId, itemId))
    } catch (error) {
      throw error
    }
  }

  /**
   * Get individual indent item by ID
   * @param {string} itemId - Item ID
   * @returns {Promise<Object>} Indent item
   */
  async getIndentItemById(itemId) {
    try {
      const response = await api.get(API_ENDPOINTS.INDENTS.ITEM_BY_ID(itemId))
      return response
    } catch (error) {
      throw error
    }
  }

  // === Item-specific Operations ===

  /**
   * Approve specific indent item
   * @param {string} itemId - Item ID
   * @param {number} approvedQuantity - Approved quantity
   * @param {string} approvalNotes - Approval notes
   * @returns {Promise<Object>} Updated item
   */
  async approveIndentItem(itemId, approvedQuantity = null, approvalNotes = null) {
    try {
      const params = {}
      if (approvedQuantity !== null) params.approvedQuantity = approvedQuantity.toString()
      if (approvalNotes !== null) params.approvalNotes = approvalNotes

      const response = await api.post(API_ENDPOINTS.INDENTS.APPROVE_ITEM(itemId), null, { params })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Update item processing status
   * @param {string} itemId - Item ID
   * @param {string} processingStatus - Processing status
   * @returns {Promise<Object>} Updated item
   */
  async updateItemProcessingStatus(itemId, processingStatus) {
    try {
      const response = await api.put(API_ENDPOINTS.INDENTS.UPDATE_ITEM_STATUS(itemId), null, {
        params: { processingStatus }
      })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Update item quantities
   * @param {string} itemId - Item ID
   * @param {number} quantityOrdered - Quantity ordered
   * @param {number} quantityReceived - Quantity received
   * @param {number} quantityPending - Quantity pending
   * @returns {Promise<Object>} Updated item
   */
  async updateItemQuantities(itemId, quantityOrdered = null, quantityReceived = null, quantityPending = null) {
    try {
      const params = {}
      if (quantityOrdered !== null) params.quantityOrdered = quantityOrdered
      if (quantityReceived !== null) params.quantityReceived = quantityReceived
      if (quantityPending !== null) params.quantityPending = quantityPending

      const response = await api.put(API_ENDPOINTS.INDENTS.UPDATE_ITEM_QUANTITIES(itemId), null, { params })
      return response
    } catch (error) {
      throw error
    }
  }

  // === Bulk Operations ===

  /**
   * Bulk approve items
   * @param {string} indentId - Indent ID
   * @param {Array} itemIds - Item IDs array
   * @param {string} approvalNotes - Approval notes
   * @returns {Promise<void>}
   */
  async bulkApproveItems(indentId, itemIds, approvalNotes = null) {
    try {
      const params = approvalNotes ? { approvalNotes } : {}
      await api.post(API_ENDPOINTS.INDENTS.BULK_APPROVE_ITEMS(indentId), itemIds, { params })
    } catch (error) {
      throw error
    }
  }

  /**
   * Bulk update item status
   * @param {string} indentId - Indent ID
   * @param {Array} itemIds - Item IDs array
   * @param {string} processingStatus - Processing status
   * @returns {Promise<void>}
   */
  async bulkUpdateItemStatus(indentId, itemIds, processingStatus) {
    try {
      await api.put(API_ENDPOINTS.INDENTS.BULK_UPDATE_ITEM_STATUS(indentId), itemIds, {
        params: { processingStatus }
      })
    } catch (error) {
      throw error
    }
  }

  /**
   * Bulk assign vendor to items
   * @param {Array} itemIds - Item IDs array
   * @param {string} vendorId - Vendor ID
   * @returns {Promise<void>}
   */
  async bulkAssignVendor(itemIds, vendorId) {
    try {
      await api.put(API_ENDPOINTS.INDENTS.BULK_ASSIGN_VENDOR, itemIds, {
        params: { vendorId }
      })
    } catch (error) {
      throw error
    }
  }

  // === Utility Operations ===

  /**
   * Generate new indent number
   * @returns {Promise<string>} Generated indent number
   */
  async generateIndentNumber() {
    try {
      const response = await api.get(API_ENDPOINTS.INDENTS.GENERATE_NUMBER)
      return response.data
    } catch (error) {
      throw error
    }
  }

  /**
   * Check if indent can be edited
   * @param {string} indentId - Indent ID
   * @returns {Promise<boolean>} Can edit flag
   */
  async canEditIndent(indentId) {
    try {
      const response = await api.get(API_ENDPOINTS.INDENTS.CAN_EDIT(indentId))
      return response.data
    } catch (error) {
      throw error
    }
  }

  /**
   * Check if indent can be approved
   * @param {string} indentId - Indent ID
   * @returns {Promise<boolean>} Can approve flag
   */
  async canApproveIndent(indentId) {
    try {
      const response = await api.get(API_ENDPOINTS.INDENTS.CAN_APPROVE(indentId))
      return response.data
    } catch (error) {
      throw error
    }
  }

  /**
   * Recalculate indent totals
   * @param {string} indentId - Indent ID
   * @returns {Promise<void>}
   */
  async recalculateIndentTotals(indentId) {
    try {
      await api.post(API_ENDPOINTS.INDENTS.RECALCULATE(indentId))
    } catch (error) {
      throw error
    }
  }

  // === Statistics and Analytics ===

  /**
   * Get indent statistics
   * @param {string} projectNodeId - Project node ID
   * @returns {Promise<Object>} Indent statistics
   */
  async getIndentStatistics(projectNodeId = null) {
    try {
      const params = projectNodeId ? { projectNodeId } : {}
      const response = await api.get(API_ENDPOINTS.INDENTS.STATISTICS, { params })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get approval statistics
   * @returns {Promise<Object>} Approval statistics
   */
  async getApprovalStatistics() {
    try {
      const response = await api.get(API_ENDPOINTS.INDENTS.APPROVAL_STATISTICS)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get dashboard metrics
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Dashboard metrics
   */
  async getDashboardMetrics(userId = null) {
    try {
      const params = userId ? { userId } : {}
      const response = await api.get(API_ENDPOINTS.INDENTS.DASHBOARD, { params })
      return response
    } catch (error) {
      throw error
    }
  }

  // === Date-based Queries ===

  /**
   * Get indents by date range
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Promise<Array>} Indents array
   */
  async getIndentsByDateRange(startDate, endDate) {
    try {
      const response = await api.get(API_ENDPOINTS.INDENTS.DATE_RANGE, {
        params: { startDate, endDate }
      })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get recent indents
   * @param {number} limit - Limit
   * @returns {Promise<Array>} Recent indents array
   */
  async getRecentIndents(limit = 10) {
    try {
      const response = await api.get(API_ENDPOINTS.INDENTS.RECENT, {
        params: { limit }
      })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get indents by location
   * @param {string} locationId - Location ID
   * @returns {Promise<Array>} Indents array
   */
  async getIndentsByLocation(locationId) {
    try {
      const response = await api.get(API_ENDPOINTS.INDENTS.BY_LOCATION(locationId))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get indents by budget code
   * @param {string} budgetCode - Budget code
   * @returns {Promise<Array>} Indents array
   */
  async getIndentsByBudgetCode(budgetCode) {
    try {
      const response = await api.get(API_ENDPOINTS.INDENTS.BY_BUDGET(budgetCode))
      return response
    } catch (error) {
      throw error
    }
  }

  // === Utility Methods ===

  /**
   * Get indent status icon
   * @param {string} status - Indent status
   * @returns {string} Icon name
   */
  getIndentStatusIcon(status) {
    const iconMap = {
      'Draft': 'edit',
      'Submitted': 'send',
      'Processing': 'hourglass_empty',
      'Completed': 'check_circle',
      'Cancelled': 'cancel'
    }
    return iconMap[status] || 'help'
  }

  /**
   * Get indent status color
   * @param {string} status - Indent status
   * @returns {string} Color name
   */
  getIndentStatusColor(status) {
    const colorMap = {
      'Draft': 'grey',
      'Submitted': 'primary',
      'Processing': 'warning',
      'Completed': 'positive',
      'Cancelled': 'negative'
    }
    return colorMap[status] || 'grey'
  }

  /**
   * Get approval status color
   * @param {string} status - Approval status
   * @returns {string} Color name
   */
  getApprovalStatusColor(status) {
    const colorMap = {
      'Pending': 'warning',
      'InProgress': 'info',
      'Approved': 'positive',
      'Rejected': 'negative',
      'Cancelled': 'grey'
    }
    return colorMap[status] || 'grey'
  }

  /**
   * Get procurement status color
   * @param {string} status - Procurement status
   * @returns {string} Color name
   */
  getProcurementStatusColor(status) {
    const colorMap = {
      'Open': 'primary',
      'PartiallyProcessed': 'warning',
      'FullyProcessed': 'positive',
      'Cancelled': 'negative',
      'Closed': 'grey'
    }
    return colorMap[status] || 'grey'
  }

  /**
   * Get priority color
   * @param {string} priority - Priority level
   * @returns {string} Color name
   */
  getPriorityColor(priority) {
    const colorMap = {
      'Urgent': 'negative',
      'High': 'warning',
      'Normal': 'primary',
      'Low': 'grey'
    }
    return colorMap[priority] || 'grey'
  }

  /**
   * Get item processing status color
   * @param {string} status - Processing status
   * @returns {string} Color name
   */
  getItemProcessingStatusColor(status) {
    const colorMap = {
      'Pending': 'grey',
      'InRFQ': 'info',
      'Quoted': 'primary',
      'Ordered': 'warning',
      'Received': 'positive',
      'Closed': 'grey'
    }
    return colorMap[status] || 'grey'
  }

  /**
   * Format indent display name
   * @param {Object} indent - Indent object
   * @returns {string} Formatted display name
   */
  formatIndentDisplayName(indent) {
    if (!indent) return ''
    return indent.indentNumber
      ? `${indent.indentTitle} (${indent.indentNumber})`
      : indent.indentTitle
  }

  /**
   * Calculate completion percentage
   * @param {Object} indent - Indent object
   * @returns {number} Completion percentage
   */
  calculateCompletionPercentage(indent) {
    if (!indent || !indent.totalItemsCount || indent.totalItemsCount === 0) {
      return 0
    }

    const processedItems = indent.processedItemsCount || 0
    return Math.round((processedItems / indent.totalItemsCount) * 100)
  }

  /**
   * Check if indent is overdue
   * @param {Object} indent - Indent object
   * @returns {boolean} Is overdue flag
   */
  isIndentOverdue(indent) {
    if (!indent || !indent.requiredByDate) {
      return false
    }

    const requiredDate = new Date(indent.requiredByDate)
    const currentDate = new Date()

    return currentDate > requiredDate &&
           indent.indentStatus !== 'Completed' &&
           indent.indentStatus !== 'Cancelled'
  }

  /**
   * Get days until due
   * @param {Object} indent - Indent object
   * @returns {number} Days until due (negative if overdue)
   */
  getDaysUntilDue(indent) {
    if (!indent || !indent.requiredByDate) {
      return null
    }

    const requiredDate = new Date(indent.requiredByDate)
    const currentDate = new Date()
    const timeDiff = requiredDate.getTime() - currentDate.getTime()

    return Math.ceil(timeDiff / (1000 * 3600 * 24))
  }

  /**
   * Format currency value
   * @param {number} value - Currency value
   * @param {string} currency - Currency symbol
   * @returns {string} Formatted currency
   */
  formatCurrency(value, currency = '₹') {
    if (!value) return 'N/A'

    const numValue = parseFloat(value)
    if (numValue >= 10000000) { // 1 crore
      return `${currency}${(numValue / 10000000).toFixed(1)}Cr`
    } else if (numValue >= 100000) { // 1 lakh
      return `${currency}${(numValue / 100000).toFixed(1)}L`
    } else {
      return `${currency}${numValue.toLocaleString('en-IN')}`
    }
  }

  /**
   * Get approval workflow step display
   * @param {Object} indent - Indent object
   * @returns {string} Step display
   */
  getApprovalStepDisplay(indent) {
    if (!indent || !indent.requiresApproval) {
      return 'No Approval Required'
    }

    if (indent.approvalStatus === 'Approved') {
      return 'Approved'
    }

    if (indent.approvalStatus === 'Rejected') {
      return 'Rejected'
    }

    const currentStep = indent.currentApprovalStep || 0
    const workflowName = indent.approvalWorkflowName || 'Default Workflow'

    return `Step ${currentStep} - ${workflowName}`
  }

  /**
   * Check if user can edit indent
   * @param {Object} indent - Indent object
   * @param {Object} currentUser - Current user object
   * @returns {boolean} Can edit flag
   */
  canUserEditIndent(indent, currentUser) {
    if (!indent || !currentUser) return false

    // Admin can always edit
    if (currentUser.role === 'Admin') return true

    // Cannot edit if completed or cancelled
    if (['Completed', 'Cancelled'].includes(indent.indentStatus)) {
      return false
    }

    // Cannot edit if approved
    if (indent.approvalStatus === 'Approved') {
      return false
    }

    // Requestor can edit draft/submitted indents
    if (indent.requestedById === currentUser.id) {
      return ['Draft', 'Submitted'].includes(indent.indentStatus)
    }

    // Procurement team can edit processing indents
    if (['ProcurementManager', 'ProcurementOfficer'].includes(currentUser.role)) {
      return ['Processing'].includes(indent.indentStatus)
    }

    return false
  }
}

export default new IndentsService()
