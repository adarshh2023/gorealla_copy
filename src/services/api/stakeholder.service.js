// src/services/api/stakeholder.service.js
import { api } from 'boot/axios'
import { API_ENDPOINTS, PAGINATION } from 'src/constants/api.constants'

class StakeholderService {

  // ===== UNIFIED ASSIGNMENT METHODS =====
  /**
   * Get unified assignments for a node (Users + Stakeholders)
   */
  async getUnifiedAssignmentsForNode(nodeId) {
    return await api.get(API_ENDPOINTS.ASSIGNMENTS.BY_NODE(nodeId))
  }

  /**
   * Create unified assignment (User or Stakeholder to Node)
   */
  async createUnifiedAssignment(assignmentData) {
    return await api.post(API_ENDPOINTS.ASSIGNMENTS.UNIFIED, assignmentData)
  }

  /**
   * Update unified assignment
   */
  async updateUnifiedAssignment(assignmentId, assignmentData) {
    return await api.put(API_ENDPOINTS.ASSIGNMENTS.BY_ID(assignmentId), assignmentData)
  }

  /**
   * Delete unified assignment
   */
  async deleteUnifiedAssignment(assignmentId) {
    return await api.delete(API_ENDPOINTS.ASSIGNMENTS.BY_ID(assignmentId))
  }

  /**
   * Get assignments by assignee (User or Stakeholder)
   */
  async getAssignmentsByAssignee(assigneeType, assigneeId) {
    return await api.get(API_ENDPOINTS.ASSIGNMENTS.BY_ASSIGNEE(assigneeType, assigneeId))
  }

  /**
   * Format assignment for display with proper names and colors
   */
  formatAssignmentDisplay(assignment) {
    return {
      ...assignment,
      displayName: assignment.assigneeName || assignment.assigneeDisplayName,
      typeColor: this.getAssignmentTypeColor(assignment.assignmentType),
      isUserAssignment: assignment.assigneeType === 'USER',
      isStakeholderAssignment: assignment.assigneeType === 'STAKEHOLDER',
      durationText: this.calculateAssignmentDuration(assignment.startDate, assignment.endDate).displayText,
      isActive: assignment.isActive && assignment.isCurrentlyActive
    }
  }

  /**
   * Group assignments by type for display
   */
  groupAssignmentsByType(assignments) {
    const groups = {}

    assignments.forEach(assignment => {
      const type = assignment.assignmentType || 'Other'
      if (!groups[type]) {
        groups[type] = []
      }
      groups[type].push(this.formatAssignmentDisplay(assignment))
    })

    return groups
  }

  // ===== Stakeholder Management =====

  /**
   * Create new stakeholder
   * @param {Object} stakeholderData - Stakeholder data
   * @returns {Promise<Object>} Created stakeholder
   */
  async createStakeholder(stakeholderData) {
    return await api.post(API_ENDPOINTS.STAKEHOLDERS.BASE, stakeholderData)
  }

  /**
   * Get stakeholder by ID
   * @param {string} stakeholderId - Stakeholder ID
   * @returns {Promise<Object>} Stakeholder data
   */
  async getStakeholderById(stakeholderId) {
    return await api.get(API_ENDPOINTS.STAKEHOLDERS.BY_ID(stakeholderId))
  }

  /**
   * Update stakeholder
   * @param {string} stakeholderId - Stakeholder ID
   * @param {Object} stakeholderData - Updated stakeholder data
   * @returns {Promise<Object>} Updated stakeholder
   */
  async updateStakeholder(stakeholderId, stakeholderData) {
    return await api.put(API_ENDPOINTS.STAKEHOLDERS.BY_ID(stakeholderId), stakeholderData)
  }

  /**
   * Delete stakeholder
   * @param {string} stakeholderId - Stakeholder ID
   * @returns {Promise<void>}
   */
  async deleteStakeholder(stakeholderId) {
    return await api.delete(API_ENDPOINTS.STAKEHOLDERS.BY_ID(stakeholderId))
  }

  /**
   * Get all stakeholders with pagination
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Paginated stakeholders
   */
  async getAllStakeholders(params = {}) {
    const queryParams = {
      page: params.page || PAGINATION.DEFAULT_PAGE,
      size: params.size || PAGINATION.DEFAULT_SIZE,
      sort: `${params.sort || 'companyName'},${params.direction || 'ASC'}`
    }

    return await api.get(API_ENDPOINTS.STAKEHOLDERS.BASE, { params: queryParams })
  }

  /**
   * Get stakeholders by type
   * @param {string} stakeholderType - Stakeholder type
   * @param {Object} params - Pagination parameters
   * @returns {Promise<Object>} Paginated stakeholders
   */
  async getStakeholdersByType(stakeholderType, params = {}) {
    const queryParams = {
      page: params.page || PAGINATION.DEFAULT_PAGE,
      size: params.size || PAGINATION.DEFAULT_SIZE,
      sort: `${params.sort || 'companyName'},${params.direction || 'ASC'}`
    }

    return await api.get(API_ENDPOINTS.STAKEHOLDERS.BY_TYPE(stakeholderType), { params: queryParams })
  }

  /**
   * Get stakeholders by specialization
   * @param {string} specialization - Specialization
   * @param {Object} params - Pagination parameters
   * @returns {Promise<Object>} Paginated stakeholders
   */
  async getStakeholdersBySpecialization(specialization, params = {}) {
    const queryParams = {
      page: params.page || PAGINATION.DEFAULT_PAGE,
      size: params.size || PAGINATION.DEFAULT_SIZE,
      sort: `${params.sort || 'rating'},${params.direction || 'DESC'}`
    }

    return await api.get(API_ENDPOINTS.STAKEHOLDERS.BY_SPECIALIZATION(specialization), { params: queryParams })
  }

  /**
   * Get stakeholders by type and specialization
   * @param {string} type - Stakeholder type
   * @param {string} specialization - Specialization
   * @param {Object} params - Pagination parameters
   * @returns {Promise<Object>} Paginated stakeholders
   */
  async getStakeholdersByTypeAndSpecialization(type, specialization, params = {}) {
    const queryParams = {
      type,
      specialization,
      page: params.page || PAGINATION.DEFAULT_PAGE,
      size: params.size || PAGINATION.DEFAULT_SIZE,
      sort: `${params.sort || 'rating'},${params.direction || 'DESC'}`
    }

    return await api.get(API_ENDPOINTS.STAKEHOLDERS.FILTER, { params: queryParams })
  }

  /**
   * Search stakeholders
   * @param {string} query - Search query
   * @param {Object} params - Pagination parameters
   * @returns {Promise<Object>} Search results
   */
  async searchStakeholders(query, params = {}) {
    const queryParams = {
      query,
      page: params.page || PAGINATION.DEFAULT_PAGE,
      size: params.size || PAGINATION.DEFAULT_SIZE,
      sort: `${params.sort || 'companyName'},${params.direction || 'ASC'}`
    }

    return await api.get(API_ENDPOINTS.STAKEHOLDERS.SEARCH, { params: queryParams })
  }

  /**
   * Get preferred stakeholders
   * @returns {Promise<Array>} Preferred stakeholders
   */
  async getPreferredStakeholders() {
    return await api.get(API_ENDPOINTS.STAKEHOLDERS.PREFERRED)
  }

  /**
   * Get stakeholders by rating range
   * @param {number} minRating - Minimum rating
   * @param {number} maxRating - Maximum rating
   * @returns {Promise<Array>} Stakeholders
   */
  async getStakeholdersByRatingRange(minRating, maxRating) {
    return await api.get(API_ENDPOINTS.STAKEHOLDERS.BY_RATING_RANGE, {
      params: { minRating, maxRating }
    })
  }

  /**
   * Get top rated stakeholders by type
   * @param {string} type - Stakeholder type
   * @param {number} limit - Number of stakeholders
   * @returns {Promise<Array>} Top rated stakeholders
   */
  async getTopRatedStakeholdersByType(type, limit = 10) {
    return await api.get(API_ENDPOINTS.STAKEHOLDERS.TOP_RATED(type), {
      params: { limit }
    })
  }

  // ===== Assignment Management =====

  /**
   * Create node assignment
   * @param {Object} assignmentData - Assignment data
   * @returns {Promise<Object>} Created assignment
   */
  async createAssignment(assignmentData) {
    return await api.post(API_ENDPOINTS.STAKEHOLDERS.ASSIGNMENTS, assignmentData)
  }

  /**
   * Get assignment by ID
   * @param {string} assignmentId - Assignment ID
   * @returns {Promise<Object>} Assignment data
   */
  async getAssignmentById(assignmentId) {
    return await api.get(API_ENDPOINTS.STAKEHOLDERS.ASSIGNMENT_BY_ID(assignmentId))
  }

  /**
   * Update assignment
   * @param {string} assignmentId - Assignment ID
   * @param {Object} assignmentData - Updated assignment data
   * @returns {Promise<Object>} Updated assignment
   */
  async updateAssignment(assignmentId, assignmentData) {
    return await api.put(API_ENDPOINTS.STAKEHOLDERS.ASSIGNMENT_BY_ID(assignmentId), assignmentData)
  }

  /**
   * Delete assignment
   * @param {string} assignmentId - Assignment ID
   * @returns {Promise<void>}
   */
  async deleteAssignment(assignmentId) {
    return await api.delete(API_ENDPOINTS.STAKEHOLDERS.ASSIGNMENT_BY_ID(assignmentId))
  }

  /**
   * End assignment
   * @param {string} assignmentId - Assignment ID
   * @param {string} endDate - End date (ISO format)
   * @returns {Promise<void>}
   */
  async endAssignment(assignmentId, endDate) {
    return await api.post(API_ENDPOINTS.STAKEHOLDERS.END_ASSIGNMENT(assignmentId), null, {
      params: { endDate }
    })
  }

  /**
   * Get node assignments
   * @param {string} nodeId - Node ID
   * @returns {Promise<Array>} Node assignments
   */
  async getNodeAssignments(nodeId) {
    return await api.get(API_ENDPOINTS.STAKEHOLDERS.NODE_ASSIGNMENTS(nodeId))
  }

  /**
   * Get stakeholder assignments
   * @param {string} stakeholderId - Stakeholder ID
   * @returns {Promise<Array>} Stakeholder assignments
   */
  async getStakeholderAssignments(stakeholderId) {
    return await api.get(API_ENDPOINTS.STAKEHOLDERS.STAKEHOLDER_ASSIGNMENTS(stakeholderId))
  }

  /**
   * Get active assignments for node
   * @param {string} nodeId - Node ID
   * @returns {Promise<Array>} Active assignments
   */
  async getActiveAssignmentsForNode(nodeId) {
    return await api.get(API_ENDPOINTS.STAKEHOLDERS.ACTIVE_NODE_ASSIGNMENTS(nodeId))
  }

  /**
   * Get active assignments for stakeholder
   * @param {string} stakeholderId - Stakeholder ID
   * @returns {Promise<Array>} Active assignments
   */
  async getActiveAssignmentsForStakeholder(stakeholderId) {
    return await api.get(API_ENDPOINTS.STAKEHOLDERS.ACTIVE_STAKEHOLDER_ASSIGNMENTS(stakeholderId))
  }

  /**
   * Get assignments by type
   * @param {string} assignmentType - Assignment type
   * @returns {Promise<Array>} Assignments
   */
  async getAssignmentsByType(assignmentType) {
    return await api.get(API_ENDPOINTS.STAKEHOLDERS.ASSIGNMENTS_BY_TYPE(assignmentType))
  }

  /**
   * Get assignments in date range
   * @param {string} startDate - Start date (ISO format)
   * @param {string} endDate - End date (ISO format)
   * @returns {Promise<Array>} Assignments
   */
  async getAssignmentsInDateRange(startDate, endDate) {
    return await api.get(API_ENDPOINTS.STAKEHOLDERS.ASSIGNMENTS_DATE_RANGE, {
      params: { startDate, endDate }
    })
  }

  /**
   * Get current assignments for node
   * @param {string} nodeId - Node ID
   * @returns {Promise<Array>} Current assignments
   */
  async getCurrentAssignmentsForNode(nodeId) {
    return await api.get(API_ENDPOINTS.STAKEHOLDERS.CURRENT_NODE_ASSIGNMENTS(nodeId))
  }

  /**
   * Get current assignments for stakeholder
   * @param {string} stakeholderId - Stakeholder ID
   * @returns {Promise<Array>} Current assignments
   */
  async getCurrentAssignmentsForStakeholder(stakeholderId) {
    return await api.get(API_ENDPOINTS.STAKEHOLDERS.CURRENT_STAKEHOLDER_ASSIGNMENTS(stakeholderId))
  }

  /**
   * Check if stakeholder is assigned to node
   * @param {string} nodeId - Node ID
   * @param {string} stakeholderId - Stakeholder ID
   * @returns {Promise<Object>} Assignment check result
   */
  async isStakeholderAssignedToNode(nodeId, stakeholderId) {
    return await api.get(API_ENDPOINTS.STAKEHOLDERS.CHECK_ASSIGNMENT, {
      params: { nodeId, stakeholderId }
    })
  }

  /**
   * Check if stakeholder can be assigned
   * @param {string} nodeId - Node ID
   * @param {string} stakeholderId - Stakeholder ID
   * @param {string} assignmentType - Assignment type
   * @returns {Promise<Object>} Assignment validation result
   */
  async canAssignStakeholder(nodeId, stakeholderId, assignmentType) {
    return await api.get(API_ENDPOINTS.STAKEHOLDERS.CAN_ASSIGN, {
      params: { nodeId, stakeholderId, assignmentType }
    })
  }

  /**
   * Get stakeholder statistics
   * @param {string} stakeholderId - Stakeholder ID
   * @returns {Promise<Object>} Statistics
   */
  async getStakeholderStatistics(stakeholderId) {
    return await api.get(API_ENDPOINTS.STAKEHOLDERS.STATISTICS(stakeholderId))
  }

  /**
   * Rate stakeholder performance
   * @param {string} stakeholderId - Stakeholder ID
   * @param {number} rating - Rating value (0-5)
   * @param {string} comments - Comments (optional)
   * @returns {Promise<void>}
   */
  async rateStakeholder(stakeholderId, rating, comments = null) {
    const params = { rating }
    if (comments) params.comments = comments

    return await api.post(API_ENDPOINTS.STAKEHOLDERS.RATE(stakeholderId), null, { params })
  }

  // ===== Utility Methods =====

  /**
   * Get stakeholder type icon
   * @param {string} stakeholderType - Stakeholder type
   * @returns {string} Icon name
   */
  getStakeholderTypeIcon(stakeholderType) {
    const iconMap = {
      'Contractor': 'engineering',
      'Supplier': 'local_shipping',
      'Consultant': 'psychology',
      'Architect': 'architecture',
      'Engineer': 'build',
      'Vendor': 'store'
    }

    return iconMap[stakeholderType] || 'person'
  }

  /**
   * Get specialization icon
   * @param {string} specialization - Specialization
   * @returns {string} Icon name
   */
  getSpecializationIcon(specialization) {
    const iconMap = {
      'Electrical': 'electrical_services',
      'Plumbing': 'plumbing',
      'Civil': 'foundation',
      'Carpentry': 'carpenter',
      'Painting': 'format_paint',
      'HVAC': 'hvac',
      'Flooring': 'layers',
      'Landscaping': 'park'
    }

    return iconMap[specialization] || 'handyman'
  }

  /**
   * Format stakeholder display
   * @param {Object} stakeholder - Stakeholder object
   * @returns {Object} Formatted stakeholder
   */
  formatStakeholderDisplay(stakeholder) {
    return {
      ...stakeholder,
      displayName: stakeholder.companyName || stakeholder.contactPersonName,
      typeIcon: this.getStakeholderTypeIcon(stakeholder.stakeholderType),
      specializationIcon: this.getSpecializationIcon(stakeholder.specialization),
      ratingStars: this.getRatingStars(stakeholder.rating),
      formattedPhone: this.formatPhone(stakeholder.phone),
      isHighRated: stakeholder.rating >= 4,
      hasLicense: !!stakeholder.licenseNumber
    }
  }

  /**
   * Get rating stars
   * @param {number} rating - Rating value
   * @returns {Array} Star array for display
   */
  getRatingStars(rating) {
    const fullStars = Math.floor(rating)
    const halfStar = rating % 1 >= 0.5 ? 1 : 0
    const emptyStars = 5 - fullStars - halfStar

    return {
      full: fullStars,
      half: halfStar,
      empty: emptyStars,
      value: rating,
      percentage: (rating / 5) * 100
    }
  }

  /**
   * Format phone number
   * @param {string} phone - Phone number
   * @returns {string} Formatted phone
   */
  formatPhone(phone) {
    if (!phone) return ''

    const cleaned = phone.replace(/\D/g, '')

    if (cleaned.startsWith('91') && cleaned.length === 12) {
      return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`
    } else if (cleaned.length === 10) {
      return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`
    }

    return phone
  }

  /**
   * Get assignment type color
   * @param {string} assignmentType - Assignment type
   * @returns {string} Color name
   */
  getAssignmentTypeColor(assignmentType) {
    const colorMap = {
      'Primary': 'primary',
      'Secondary': 'secondary',
      'Consultant': 'info'
    }

    return colorMap[assignmentType] || 'grey'
  }

  /**
   * Calculate assignment duration
   * @param {string} startDate - Start date
   * @param {string} endDate - End date (optional)
   * @returns {Object} Duration info
   */
  calculateAssignmentDuration(startDate, endDate = null) {
    const start = new Date(startDate)
    const end = endDate ? new Date(endDate) : new Date()

    const diffTime = Math.abs(end - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return {
      days: diffDays,
      weeks: Math.floor(diffDays / 7),
      months: Math.floor(diffDays / 30),
      isOngoing: !endDate,
      displayText: this.formatDuration(diffDays)
    }
  }

  /**
   * Format duration for display
   * @param {number} days - Number of days
   * @returns {string} Formatted duration
   */
  formatDuration(days) {
    if (days === 0) return 'Today'
    if (days === 1) return '1 day'
    if (days < 7) return `${days} days`
    if (days < 30) return `${Math.floor(days / 7)} weeks`
    if (days < 365) return `${Math.floor(days / 30)} months`
    return `${Math.floor(days / 365)} years`
  }

  /**
   * Group stakeholders by type
   * @param {Array} stakeholders - Stakeholders array
   * @returns {Object} Grouped stakeholders
   */
  groupStakeholdersByType(stakeholders) {
    const groups = {}

    stakeholders.forEach(stakeholder => {
      const type = stakeholder.stakeholderType || 'Other'
      if (!groups[type]) {
        groups[type] = []
      }
      groups[type].push(this.formatStakeholderDisplay(stakeholder))
    })

    return groups
  }

  /**
   * Filter stakeholders by criteria
   * @param {Array} stakeholders - Stakeholders array
   * @param {Object} criteria - Filter criteria
   * @returns {Array} Filtered stakeholders
   */
  filterStakeholders(stakeholders, criteria) {
    return stakeholders.filter(stakeholder => {
      if (criteria.type && stakeholder.stakeholderType !== criteria.type) {
        return false
      }

      if (criteria.specialization && stakeholder.specialization !== criteria.specialization) {
        return false
      }

      if (criteria.minRating && stakeholder.rating < criteria.minRating) {
        return false
      }

      if (criteria.isPreferred !== undefined && stakeholder.isPreferred !== criteria.isPreferred) {
        return false
      }

      if (criteria.hasLicense !== undefined && !!stakeholder.licenseNumber !== criteria.hasLicense) {
        return false
      }

      return true
    })
  }
}

export default new StakeholderService()
