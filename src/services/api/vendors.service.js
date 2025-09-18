/* eslint-disable no-useless-catch */
// src/services/api/vendors.service.js
import { api } from 'boot/axios'
import { API_ENDPOINTS, PAGINATION } from 'src/constants/api.constants'

class VendorsService {

  /**
   * Create new vendor
   * @param {Object} vendorData - Vendor creation data
   * @returns {Promise<Object>} Created vendor
   */
  async createVendor(vendorData) {
    try {
      const response = await api.post(API_ENDPOINTS.VENDORS.BASE, vendorData)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get vendor by ID
   * @param {string} vendorId - Vendor ID
   * @returns {Promise<Object>} Vendor data
   */
  async getVendorById(vendorId) {
    try {
      const response = await api.get(API_ENDPOINTS.VENDORS.BY_ID(vendorId))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Update vendor
   * @param {string} vendorId - Vendor ID
   * @param {Object} vendorData - Updated vendor data
   * @returns {Promise<Object>} Updated vendor
   */
  async updateVendor(vendorId, vendorData) {
    try {
      const response = await api.put(API_ENDPOINTS.VENDORS.BY_ID(vendorId), vendorData)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Delete vendor
   * @param {string} vendorId - Vendor ID
   * @returns {Promise<void>}
   */
  async deleteVendor(vendorId) {
    try {
      await api.delete(API_ENDPOINTS.VENDORS.BY_ID(vendorId))
    } catch (error) {
      throw error
    }
  }

  /**
   * Get all vendors with pagination
   * @param {string} vendorStatus - Vendor status filter
   * @param {string} approvalStatus - Approval status filter
   * @param {Object} params - Pagination parameters
   * @returns {Promise<Object>} Paginated vendors
   */
  async getAllVendors(vendorStatus = null, approvalStatus = null, params = {}) {
    try {
      const queryParams = {
        page: params.page || PAGINATION.DEFAULT_PAGE,
        size: params.size || PAGINATION.DEFAULT_SIZE,
        sort: `${params.sort || 'companyName'},${params.direction || 'ASC'}`,
        vendorStatus,
        approvalStatus
      }

      const response = await api.get(API_ENDPOINTS.VENDORS.BASE, { params: queryParams })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Search vendors with filters
   * @param {string} searchTerm - Search term
   * @param {string} vendorType - Vendor type
   * @param {string} vendorCategory - Vendor category
   * @param {string} vendorStatus - Vendor status
   * @param {string} approvalStatus - Approval status
   * @param {string} city - City
   * @param {string} state - State
   * @param {Object} params - Pagination parameters
   * @returns {Promise<Object>} Search results
   */
  async searchVendors(searchTerm, vendorType, vendorCategory, vendorStatus, approvalStatus, city, state, params = {}) {
    try {
      const queryParams = {
        searchTerm,
        vendorType,
        vendorCategory,
        vendorStatus,
        approvalStatus,
        city,
        state,
        page: params.page || PAGINATION.DEFAULT_PAGE,
        size: params.size || PAGINATION.DEFAULT_SIZE,
        sort: `${params.sort || 'companyName'},${params.direction || 'ASC'}`
      }

      const response = await api.get(API_ENDPOINTS.VENDORS.SEARCH, { params: queryParams })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get vendors by type and category
   * @param {string} vendorType - Vendor type
   * @param {string} vendorCategory - Vendor category
   * @param {Object} params - Pagination parameters
   * @returns {Promise<Object>} Paginated vendors
   */
  async getVendorsByTypeAndCategory(vendorType, vendorCategory, params = {}) {
    try {
      const queryParams = {
        page: params.page || PAGINATION.DEFAULT_PAGE,
        size: params.size || PAGINATION.DEFAULT_SIZE,
        sort: `${params.sort || 'overallRating'},${params.direction || 'DESC'}`
      }

      const response = await api.get(API_ENDPOINTS.VENDORS.BY_TYPE_AND_CATEGORY(vendorType, vendorCategory), { params: queryParams })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get preferred vendors
   * @param {number} minRating - Minimum rating
   * @returns {Promise<Array>} Preferred vendors array
   */
  async getPreferredVendors(minRating = 3.0) {
    try {
      const response = await api.get(API_ENDPOINTS.VENDORS.PREFERRED, {
        params: { minRating }
      })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get vendors by location
   * @param {string} city - City
   * @param {string} state - State
   * @returns {Promise<Array>} Vendors array
   */
  async getVendorsByLocation(city = null, state = null) {
    try {
      const params = {}
      if (city) params.city = city
      if (state) params.state = state

      const response = await api.get(API_ENDPOINTS.VENDORS.BY_LOCATION, { params })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Submit vendor for approval
   * @param {string} vendorId - Vendor ID
   * @param {string} submissionRemarks - Submission remarks
   * @returns {Promise<void>}
   */
  async submitForApproval(vendorId, submissionRemarks = null) {
    try {
      const params = submissionRemarks ? { submissionRemarks } : {}
      await api.post(API_ENDPOINTS.VENDORS.SUBMIT_APPROVAL(vendorId), null, { params })
    } catch (error) {
      throw error
    }
  }

  /**
   * Process vendor approval
   * @param {string} vendorId - Vendor ID
   * @param {string} decision - Approval decision
   * @param {string} remarks - Approval remarks
   * @returns {Promise<void>}
   */
  async processApproval(vendorId, decision, remarks = null) {
    try {
      const params = { decision }
      if (remarks) params.remarks = remarks

      await api.put(API_ENDPOINTS.VENDORS.PROCESS_APPROVAL(vendorId), null, { params })
    } catch (error) {
      throw error
    }
  }

  /**
   * Get vendors pending approval
   * @param {Object} params - Pagination parameters
   * @returns {Promise<Object>} Paginated vendors
   */
  async getVendorsPendingApproval(params = {}) {
    try {
      const queryParams = {
        page: params.page || PAGINATION.DEFAULT_PAGE,
        size: params.size || PAGINATION.DEFAULT_SIZE,
        sort: `${params.sort || 'insertDate'},${params.direction || 'ASC'}`
      }

      const response = await api.get(API_ENDPOINTS.VENDORS.PENDING_APPROVAL, { params: queryParams })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Update vendor performance
   * @param {string} vendorId - Vendor ID
   * @param {Object} performanceData - Performance data
   * @returns {Promise<void>}
   */
  async updatePerformance(vendorId, performanceData) {
    try {
      await api.put(API_ENDPOINTS.VENDORS.UPDATE_PERFORMANCE(vendorId), performanceData)
    } catch (error) {
      throw error
    }
  }

  /**
   * Get vendor performance history
   * @param {string} vendorId - Vendor ID
   * @returns {Promise<Array>} Performance history array
   */
  async getPerformanceHistory(vendorId) {
    try {
      const response = await api.get(API_ENDPOINTS.VENDORS.PERFORMANCE_HISTORY(vendorId))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get performance ranking
   * @param {string} category - Category filter
   * @param {number} minTransactions - Minimum transactions
   * @returns {Promise<Array>} Performance ranking array
   */
  async getPerformanceRanking(category = null, minTransactions = 5) {
    try {
      const params = { minTransactions }
      if (category) params.category = category

      const response = await api.get(API_ENDPOINTS.VENDORS.PERFORMANCE_RANKING, { params })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get top performing vendors
   * @param {string} category - Category filter
   * @param {number} limit - Limit
   * @returns {Promise<Array>} Top vendors array
   */
  async getTopPerformingVendors(category = null, limit = 10) {
    try {
      const params = { limit }
      if (category) params.category = category

      const response = await api.get(API_ENDPOINTS.VENDORS.TOP_PERFORMERS, { params })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Enable portal access for vendor
   * @param {string} vendorId - Vendor ID
   * @param {string} portalUsername - Portal username
   * @param {string} accessLevel - Access level
   * @returns {Promise<Object>} Updated vendor
   */
  async enablePortalAccess(vendorId, portalUsername, accessLevel) {
    try {
      const response = await api.post(API_ENDPOINTS.VENDORS.ENABLE_PORTAL(vendorId), null, {
        params: { portalUsername, accessLevel }
      })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Send notification to vendor
   * @param {string} vendorId - Vendor ID
   * @param {string} subject - Notification subject
   * @param {string} message - Notification message
   * @param {string} notificationType - Notification type
   * @returns {Promise<void>}
   */
  async sendVendorNotification(vendorId, subject, message, notificationType = 'EMAIL') {
    try {
      await api.post(API_ENDPOINTS.VENDORS.NOTIFY(vendorId), null, {
        params: { subject, message, notificationType }
      })
    } catch (error) {
      throw error
    }
  }

  /**
   * Get vendor portal activity
   * @param {string} vendorId - Vendor ID
   * @returns {Promise<Object>} Portal activity data
   */
  async getPortalActivity(vendorId) {
    try {
      const response = await api.get(API_ENDPOINTS.VENDORS.PORTAL_ACTIVITY(vendorId))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Bulk create vendors
   * @param {Array} vendors - Vendors array
   * @returns {Promise<Object>} Bulk operation result
   */
  async bulkCreateVendors(vendors) {
    try {
      const response = await api.post(API_ENDPOINTS.VENDORS.BULK_CREATE, vendors)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Bulk update vendor status
   * @param {Array} vendorIds - Vendor IDs array
   * @param {string} newStatus - New status
   * @param {string} remarks - Remarks
   * @returns {Promise<Object>} Bulk operation result
   */
  async bulkUpdateVendorStatus(vendorIds, newStatus, remarks = null) {
    try {
      const params = { newStatus }
      if (remarks) params.remarks = remarks

      const response = await api.put(API_ENDPOINTS.VENDORS.BULK_STATUS, vendorIds, { params })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Bulk process approvals
   * @param {Array} vendorIds - Vendor IDs array
   * @param {string} decision - Approval decision
   * @param {string} remarks - Remarks
   * @returns {Promise<Object>} Bulk operation result
   */
  async bulkProcessApprovals(vendorIds, decision, remarks = null) {
    try {
      const params = { decision }
      if (remarks) params.remarks = remarks

      const response = await api.put(API_ENDPOINTS.VENDORS.BULK_APPROVALS, vendorIds, { params })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Check vendor code uniqueness
   * @param {string} vendorCode - Vendor code
   * @param {string} excludeId - ID to exclude
   * @returns {Promise<boolean>} Uniqueness check result
   */
  async isVendorCodeUnique(vendorCode, excludeId = null) {
    try {
      const params = excludeId ? { excludeId } : {}
      const response = await api.get(API_ENDPOINTS.VENDORS.VALIDATE_CODE(vendorCode), { params })
      return response.data.isUnique
    } catch (error) {
      throw error
    }
  }

  /**
   * Check GST number uniqueness
   * @param {string} gstNumber - GST number
   * @param {string} excludeId - ID to exclude
   * @returns {Promise<boolean>} Uniqueness check result
   */
  async isGSTNumberUnique(gstNumber, excludeId = null) {
    try {
      const params = excludeId ? { excludeId } : {}
      const response = await api.get(API_ENDPOINTS.VENDORS.VALIDATE_GST(gstNumber), { params })
      return response.data.isUnique
    } catch (error) {
      throw error
    }
  }

  /**
   * Check if vendor can be deleted
   * @param {string} vendorId - Vendor ID
   * @returns {Promise<boolean>} Can delete flag
   */
  async canDeleteVendor(vendorId) {
    try {
      const response = await api.get(API_ENDPOINTS.VENDORS.CAN_DELETE(vendorId))
      return response.data.canDelete
    } catch (error) {
      throw error
    }
  }

  /**
   * Get vendor statistics
   * @returns {Promise<Object>} Vendor statistics
   */
  async getVendorStatistics() {
    try {
      const response = await api.get(API_ENDPOINTS.VENDORS.STATISTICS)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get vendor distribution analysis
   * @returns {Promise<Object>} Distribution analysis
   */
  async getVendorDistributionAnalysis() {
    try {
      const response = await api.get(API_ENDPOINTS.VENDORS.ANALYTICS_DISTRIBUTION)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get vendor performance analytics
   * @param {string} category - Category filter
   * @returns {Promise<Object>} Performance analytics
   */
  async getVendorPerformanceAnalytics(category = null) {
    try {
      const params = category ? { category } : {}
      const response = await api.get(API_ENDPOINTS.VENDORS.ANALYTICS_PERFORMANCE, { params })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get vendor count by status
   * @returns {Promise<Object>} Status counts
   */
  async getVendorCountByStatus() {
    try {
      const response = await api.get(API_ENDPOINTS.VENDORS.STATUS_COUNTS)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get vendors requiring attention
   * @returns {Promise<Array>} Vendors requiring attention
   */
  async getVendorsRequiringAttention() {
    try {
      const response = await api.get(API_ENDPOINTS.VENDORS.REQUIRING_ATTENTION)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Export vendors data
   * @param {Array} vendorIds - Vendor IDs to export
   * @param {string} exportFormat - Export format
   * @param {boolean} includePerformanceData - Include performance data flag
   * @returns {Promise<Object>} Export result
   */
  async exportVendors(vendorIds = null, exportFormat = 'EXCEL', includePerformanceData = true) {
    try {
      const response = await api.post(API_ENDPOINTS.VENDORS.EXPORT, vendorIds, {
        params: { exportFormat, includePerformanceData }
      })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get vendor status icon
   * @param {string} status - Vendor status
   * @returns {string} Icon name
   */
  getVendorStatusIcon(status) {
    const iconMap = {
      'Active': 'check_circle',
      'Inactive': 'radio_button_unchecked',
      'Suspended': 'pause_circle',
      'Blacklisted': 'block'
    }
    return iconMap[status] || 'help'
  }

  /**
   * Get vendor status color
   * @param {string} status - Vendor status
   * @returns {string} Color name
   */
  getVendorStatusColor(status) {
    const colorMap = {
      'Active': 'positive',
      'Inactive': 'grey',
      'Suspended': 'warning',
      'Blacklisted': 'negative'
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
      'Approved': 'positive',
      'Rejected': 'negative',
      'Under Review': 'info'
    }
    return colorMap[status] || 'grey'
  }

  /**
   * Format vendor display name
   * @param {Object} vendor - Vendor object
   * @returns {string} Formatted display name
   */
  formatVendorDisplayName(vendor) {
    if (!vendor) return ''
    return vendor.vendorCode
      ? `${vendor.companyName} (${vendor.vendorCode})`
      : vendor.companyName
  }

  /**
   * Get rating display
   * @param {number} rating - Rating value
   * @param {number} maxRating - Maximum rating
   * @returns {Object} Rating display object
   */
  getRatingDisplay(rating, maxRating = 5) {
    if (!rating) return { stars: 0, color: 'grey', label: 'No Rating' }

    const normalizedRating = parseFloat(rating)
    const percentage = (normalizedRating / maxRating) * 100

    let color = 'grey'
    if (percentage >= 80) color = 'positive'
    else if (percentage >= 60) color = 'primary'
    else if (percentage >= 40) color = 'warning'
    else color = 'negative'

    return {
      stars: normalizedRating,
      color,
      label: `${normalizedRating.toFixed(1)}/5`,
      percentage
    }
  }

  /**
   * Get performance metrics
   * @param {Object} vendor - Vendor object
   * @returns {Object} Performance metrics
   */
  getPerformanceMetrics(vendor) {
    const metrics = {}

    // On-time delivery rate
    if (vendor.totalOrders && vendor.onTimeDeliveries) {
      metrics.onTimeRate = Math.round((vendor.onTimeDeliveries / vendor.totalOrders) * 100)
    }

    // Quality score (inverse of quality issues)
    if (vendor.totalOrders && vendor.qualityIssues !== undefined) {
      metrics.qualityScore = Math.round(((vendor.totalOrders - vendor.qualityIssues) / vendor.totalOrders) * 100)
    }

    // Average delivery time
    if (vendor.averageDeliveryTime) {
      metrics.avgDeliveryDays = parseFloat(vendor.averageDeliveryTime).toFixed(1)
    }

    return metrics
  }

  /**
   * Get verification status
   * @param {Object} vendor - Vendor object
   * @returns {Object} Verification status
   */
  getVerificationStatus(vendor) {
    const verifications = []

    if (vendor.isGSTVerified) {
      verifications.push({ label: 'GST Verified', icon: 'verified', color: 'positive' })
    }
    if (vendor.isPANVerified) {
      verifications.push({ label: 'PAN Verified', icon: 'verified', color: 'positive' })
    }
    if (vendor.isAddressVerified) {
      verifications.push({ label: 'Address Verified', icon: 'location_on', color: 'positive' })
    }
    if (vendor.isBankDetailsVerified) {
      verifications.push({ label: 'Bank Verified', icon: 'account_balance', color: 'positive' })
    }

    const totalVerifications = 4
    const completedVerifications = verifications.length
    const verificationPercentage = Math.round((completedVerifications / totalVerifications) * 100)

    return {
      verifications,
      completedCount: completedVerifications,
      totalCount: totalVerifications,
      percentage: verificationPercentage,
      isFullyVerified: completedVerifications === totalVerifications
    }
  }

  /**
   * Format business value
   * @param {number} value - Business value
   * @param {string} currency - Currency symbol
   * @returns {string} Formatted value
   */
  formatBusinessValue(value, currency = '₹') {
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
   * Get vendor type icon
   * @param {string} vendorType - Vendor type
   * @returns {string} Icon name
   */
  getVendorTypeIcon(vendorType) {
    const iconMap = {
      'Supplier': 'local_shipping',
      'Contractor': 'engineering',
      'Manufacturer': 'precision_manufacturing',
      'Trader': 'store'
    }
    return iconMap[vendorType] || 'business'
  }
}

export default new VendorsService()
