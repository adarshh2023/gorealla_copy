/* eslint-disable no-useless-catch */
// src/services/api/item-categories.service.js
import { api } from 'boot/axios'
import { API_ENDPOINTS, PAGINATION } from 'src/constants/api.constants'

class ItemCategoriesService {

  /**
   * Create new category
   * @param {Object} categoryData - Category creation data
   * @returns {Promise<Object>} Created category
   */
  async createCategory(categoryData) {
    try {
      const response = await api.post(API_ENDPOINTS.ITEM_CATEGORIES.BASE, categoryData)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get category by ID
   * @param {string} categoryId - Category ID
   * @returns {Promise<Object>} Category data
   */
  async getCategoryById(categoryId) {
    try {
      const response = await api.get(API_ENDPOINTS.ITEM_CATEGORIES.BY_ID(categoryId))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Update category
   * @param {string} categoryId - Category ID
   * @param {Object} categoryData - Updated category data
   * @returns {Promise<Object>} Updated category
   */
  async updateCategory(categoryId, categoryData) {
    try {
      const response = await api.put(API_ENDPOINTS.ITEM_CATEGORIES.BY_ID(categoryId), categoryData)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Delete category
   * @param {string} categoryId - Category ID
   * @returns {Promise<void>}
   */
  async deleteCategory(categoryId) {
    try {
      await api.delete(API_ENDPOINTS.ITEM_CATEGORIES.BY_ID(categoryId))
    } catch (error) {
      throw error
    }
  }

  /**
   * Get all categories with pagination
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Paginated categories
   */
  async getAllCategories(params = {}) {
    try {
      const queryParams = {
        page: params.page || PAGINATION.DEFAULT_PAGE,
        size: params.size || PAGINATION.DEFAULT_SIZE,
        sort: `${params.sort || 'displayOrder'},${params.direction || 'ASC'}`
      }

      const response = await api.get(API_ENDPOINTS.ITEM_CATEGORIES.BASE, { params: queryParams })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Search categories with filters
   * @param {string} searchTerm - Search term
   * @param {Object} filters - Search filters
   * @param {Object} params - Pagination parameters
   * @returns {Promise<Object>} Search results
   */
  async searchCategories(searchTerm, filters = {}, params = {}) {
    try {
      const queryParams = {
        searchTerm,
        page: params.page || PAGINATION.DEFAULT_PAGE,
        size: params.size || PAGINATION.DEFAULT_SIZE,
        sort: `${params.sort || 'displayOrder'},${params.direction || 'ASC'}`,
        ...filters
      }

      const response = await api.get(API_ENDPOINTS.ITEM_CATEGORIES.SEARCH, { params: queryParams })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get categories by requirements
   * @param {boolean} isTestingRequired - Testing required filter
   * @param {boolean} isSampleRequired - Sample required filter
   * @param {boolean} isQRTrackingRequired - QR tracking required filter
   * @returns {Promise<Array>} Categories array
   */
  async getCategoriesByRequirements(isTestingRequired, isSampleRequired, isQRTrackingRequired) {
    try {
      const params = {}
      if (isTestingRequired !== undefined) params.isTestingRequired = isTestingRequired
      if (isSampleRequired !== undefined) params.isSampleRequired = isSampleRequired
      if (isQRTrackingRequired !== undefined) params.isQRTrackingRequired = isQRTrackingRequired

      const response = await api.get(API_ENDPOINTS.ITEM_CATEGORIES.BY_REQUIREMENTS, { params })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get categories by level
   * @param {number} categoryLevel - Category level
   * @returns {Promise<Array>} Categories array
   */
  async getCategoriesByLevel(categoryLevel) {
    try {
      const response = await api.get(API_ENDPOINTS.ITEM_CATEGORIES.BY_LEVEL(categoryLevel))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get root categories
   * @returns {Promise<Array>} Root categories array
   */
  async getRootCategories() {
    try {
      const response = await api.get(API_ENDPOINTS.ITEM_CATEGORIES.ROOT)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get subcategories by parent
   * @param {string} categoryId - Parent category ID
   * @returns {Promise<Array>} Subcategories array
   */
  async getSubCategories(categoryId) {
    try {
      const response = await api.get(API_ENDPOINTS.ITEM_CATEGORIES.CHILDREN(categoryId))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get leaf categories (categories with no children)
   * @returns {Promise<Array>} Leaf categories array
   */
  async getLeafCategories() {
    try {
      const response = await api.get(API_ENDPOINTS.ITEM_CATEGORIES.LEAF)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get categories by compliance standard
   * @param {string} standard - Compliance standard
   * @returns {Promise<Array>} Categories array
   */
  async getCategoriesByComplianceStandard(standard) {
    try {
      const response = await api.get(API_ENDPOINTS.ITEM_CATEGORIES.BY_COMPLIANCE(standard))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get categories by default unit
   * @param {string} unit - Default unit
   * @returns {Promise<Array>} Categories array
   */
  async getCategoriesByDefaultUnit(unit) {
    try {
      const response = await api.get(API_ENDPOINTS.ITEM_CATEGORIES.BY_UNIT(unit))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get categories requiring testing
   * @returns {Promise<Array>} Categories array
   */
  async getCategoriesRequiringTesting() {
    try {
      const response = await api.get(API_ENDPOINTS.ITEM_CATEGORIES.TESTING_REQUIRED)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get categories requiring samples
   * @returns {Promise<Array>} Categories array
   */
  async getCategoriesRequiringSamples() {
    try {
      const response = await api.get(API_ENDPOINTS.ITEM_CATEGORIES.SAMPLE_REQUIRED)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get categories requiring QR tracking
   * @returns {Promise<Array>} Categories array
   */
  async getCategoriesRequiringQRTracking() {
    try {
      const response = await api.get(API_ENDPOINTS.ITEM_CATEGORIES.QR_TRACKING_REQUIRED)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get category statistics
   * @returns {Promise<Object>} Category statistics
   */
  async getCategoryStatistics() {
    try {
      const response = await api.get(API_ENDPOINTS.ITEM_CATEGORIES.STATISTICS)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Update display order
   * @param {string} categoryId - Category ID
   * @param {number} displayOrder - Display order
   * @returns {Promise<void>}
   */
  async updateDisplayOrder(categoryId, displayOrder) {
    try {
      await api.put(API_ENDPOINTS.ITEM_CATEGORIES.UPDATE_DISPLAY_ORDER(categoryId), null, {
        params: { displayOrder }
      })
    } catch (error) {
      throw error
    }
  }

  /**
   * Batch delete categories
   * @param {Array} categoryIds - Category IDs to delete
   * @returns {Promise<void>}
   */
  async batchDeleteCategories(categoryIds) {
    try {
      await api.delete(API_ENDPOINTS.ITEM_CATEGORIES.BATCH_DELETE, { data: categoryIds })
    } catch (error) {
      throw error
    }
  }

  /**
   * Check category code uniqueness
   * @param {string} categoryCode - Category code
   * @param {string} excludeId - ID to exclude
   * @returns {Promise<boolean>} Uniqueness check result
   */
  async isCategoryCodeUnique(categoryCode, excludeId = null) {
    try {
      const params = excludeId ? { excludeId } : {}
      const response = await api.get(API_ENDPOINTS.ITEM_CATEGORIES.VALIDATE_CODE(categoryCode), { params })
      return response.data.isUnique
    } catch (error) {
      throw error
    }
  }

  /**
   * Check category name uniqueness under parent
   * @param {string} categoryName - Category name
   * @param {string} parentCategoryId - Parent category ID
   * @param {string} excludeId - ID to exclude
   * @returns {Promise<boolean>} Uniqueness check result
   */
  async isCategoryNameUniqueUnderParent(categoryName, parentCategoryId = null, excludeId = null) {
    try {
      const params = { categoryName }
      if (parentCategoryId) params.parentCategoryId = parentCategoryId
      if (excludeId) params.excludeId = excludeId

      const response = await api.get(API_ENDPOINTS.ITEM_CATEGORIES.VALIDATE_NAME, { params })
      return response.data.isUnique
    } catch (error) {
      throw error
    }
  }

  /**
   * Check if category can be deleted
   * @param {string} categoryId - Category ID
   * @returns {Promise<boolean>} Can delete flag
   */
  async canDeleteCategory(categoryId) {
    try {
      const response = await api.get(API_ENDPOINTS.ITEM_CATEGORIES.CAN_DELETE(categoryId))
      return response.data.canDelete
    } catch (error) {
      throw error
    }
  }

  /**
   * Check if category has children
   * @param {string} categoryId - Category ID
   * @returns {Promise<boolean>} Has children flag
   */
  async hasChildren(categoryId) {
    try {
      const response = await api.get(API_ENDPOINTS.ITEM_CATEGORIES.HAS_CHILDREN(categoryId))
      return response.data.hasChildren
    } catch (error) {
      throw error
    }
  }

  /**
   * Get children count
   * @param {string} categoryId - Category ID
   * @returns {Promise<number>} Children count
   */
  async getChildrenCount(categoryId) {
    try {
      const response = await api.get(API_ENDPOINTS.ITEM_CATEGORIES.HAS_CHILDREN(categoryId))
      return response.data.childrenCount || 0
    } catch (error) {
      throw error
    }
  }

  /**
   * Build category hierarchy tree
   * @param {Array} categories - Categories array
   * @returns {Array} Tree structure
   */
  buildCategoryTree(categories) {
    const categoryMap = new Map()
    const rootCategories = []

    // Create map for quick lookup
    categories.forEach(category => {
      categoryMap.set(category.recCode, { ...category, children: [] })
    })

    // Build tree structure
    categories.forEach(category => {
      const categoryNode = categoryMap.get(category.recCode)

      if (category.parentCategoryId) {
        const parent = categoryMap.get(category.parentCategoryId)
        if (parent) {
          parent.children.push(categoryNode)
        }
      } else {
        rootCategories.push(categoryNode)
      }
    })

    return rootCategories
  }

  /**
   * Get category path (breadcrumb)
   * @param {string} categoryId - Category ID
   * @param {Array} allCategories - All categories for building path
   * @returns {Array} Category path
   */
  getCategoryPath(categoryId, allCategories) {
    const path = []
    let currentCategory = allCategories.find(cat => cat.recCode === categoryId)

    while (currentCategory) {
      path.unshift(currentCategory)
      currentCategory = currentCategory.parentCategoryId
        ? allCategories.find(cat => cat.recCode === currentCategory.parentCategoryId)
        : null
    }

    return path
  }

  /**
   * Format category display name with level indication
   * @param {Object} category - Category object
   * @returns {string} Formatted display name
   */
  formatCategoryDisplayName(category) {
    if (!category) return ''

    const levelPrefix = '—'.repeat((category.categoryLevel || 1) - 1)
    return levelPrefix + category.categoryName
  }

  /**
   * Get category type icon
   * @param {Object} category - Category object
   * @returns {string} Icon name
   */
  getCategoryIcon(category) {
    if (!category) return 'folder'

    if (category.isTestingRequired) return 'science'
    if (category.isSampleRequired) return 'assessment'
    if (category.isQRTrackingRequired) return 'qr_code'

    return category.categoryLevel === 1 ? 'category' : 'folder'
  }

  /**
   * Get category requirements summary
   * @param {Object} category - Category object
   * @returns {Array} Requirements array
   */
  getCategoryRequirements(category) {
    const requirements = []

    if (category.isTestingRequired) {
      requirements.push('Testing Required')
    }
    if (category.isSampleRequired) {
      requirements.push('Sample Required')
    }
    if (category.isQRTrackingRequired) {
      requirements.push('QR Tracking Required')
    }

    return requirements
  }

  /**
   * Check if category is a leaf node
   * @param {Object} category - Category object
   * @param {Array} allCategories - All categories
   * @returns {boolean} Is leaf flag
   */
  isCategoryLeaf(category, allCategories) {
    return !allCategories.some(cat => cat.parentCategoryId === category.recCode)
  }

  /**
   * Get category level color
   * @param {number} level - Category level
   * @returns {string} Color class
   */
  getCategoryLevelColor(level) {
    const colors = {
      1: 'primary',
      2: 'secondary',
      3: 'accent',
      4: 'info',
      5: 'warning'
    }
    return colors[level] || 'grey'
  }

  /**
   * Validate category hierarchy
   * @param {Object} categoryData - Category data to validate
   * @param {Array} existingCategories - Existing categories
   * @returns {Object} Validation result
   */
  validateCategoryHierarchy(categoryData, existingCategories) {
    const errors = []

    // Check if parent exists
    if (categoryData.parentCategoryId) {
      const parent = existingCategories.find(cat => cat.recCode === categoryData.parentCategoryId)
      if (!parent) {
        errors.push('Parent category does not exist')
      } else {
        // Check level consistency
        const expectedLevel = (parent.categoryLevel || 1) + 1
        if (categoryData.categoryLevel && categoryData.categoryLevel !== expectedLevel) {
          errors.push(`Category level should be ${expectedLevel} based on parent level`)
        }
      }
    } else {
      // Root category should be level 1
      if (categoryData.categoryLevel && categoryData.categoryLevel !== 1) {
        errors.push('Root category should be level 1')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

export default new ItemCategoriesService()
