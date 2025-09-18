// src/stores/item-categories.js
import { defineStore } from 'pinia'
import itemCategoriesService from 'src/services/api/item-categories.service'
import { showSuccess, showError } from 'src/utils/notification'

export const useItemCategoriesStore = defineStore('itemCategories', {
  state: () => ({
    // Categories list
    categories: [],
    totalCategories: 0,
    currentPage: 0,
    pageSize: 20,

    // Current category
    currentCategory: null,

    // Tree structure
    categoryTree: [],
    rootCategories: [],
    leafCategories: [],

    // Special categories
    testingRequiredCategories: [],
    sampleRequiredCategories: [],
    qrTrackingRequiredCategories: [],

    // Loading states
    isLoading: false,
    isLoadingTree: false,

    // Filters
    filters: {
      search: '',
      parentCategoryId: null,
      categoryLevel: null,
      isTestingRequired: null,
      isSampleRequired: null,
      isQRTrackingRequired: null,
      defaultUnit: null
    },

    // Sort
    sortBy: 'displayOrder',
    sortDirection: 'ASC',

    // Cache
    categoriesCache: new Map(),
    childrenCache: new Map(),
    hierarchyCache: new Map(),

    // Cache TTL (10 minutes for categories as they change less frequently)
    CACHE_TTL: 10 * 60 * 1000,
    cacheTimestamps: new Map()
  }),

  getters: {
    /**
     * Get filtered categories
     */
    filteredCategories: (state) => {
      let filtered = [...state.categories]

      // Apply search filter
      if (state.filters.search) {
        const search = state.filters.search.toLowerCase()
        filtered = filtered.filter(category =>
          category.categoryName.toLowerCase().includes(search) ||
          category.categoryCode?.toLowerCase().includes(search) ||
          category.categoryDescription?.toLowerCase().includes(search)
        )
      }

      // Apply parent filter
      if (state.filters.parentCategoryId) {
        filtered = filtered.filter(category =>
          category.parentCategoryId === state.filters.parentCategoryId
        )
      }

      // Apply level filter
      if (state.filters.categoryLevel) {
        filtered = filtered.filter(category =>
          category.categoryLevel === state.filters.categoryLevel
        )
      }

      // Apply requirements filters
      if (state.filters.isTestingRequired !== null) {
        filtered = filtered.filter(category =>
          category.isTestingRequired === state.filters.isTestingRequired
        )
      }

      if (state.filters.isSampleRequired !== null) {
        filtered = filtered.filter(category =>
          category.isSampleRequired === state.filters.isSampleRequired
        )
      }

      if (state.filters.isQRTrackingRequired !== null) {
        filtered = filtered.filter(category =>
          category.isQRTrackingRequired === state.filters.isQRTrackingRequired
        )
      }

      // Apply default unit filter
      if (state.filters.defaultUnit) {
        filtered = filtered.filter(category =>
          category.defaultUnit === state.filters.defaultUnit
        )
      }

      return filtered
    },

    /**
     * Get categories grouped by level
     */
    categoriesByLevel: (state) => {
      const groups = {}
      state.categories.forEach(category => {
        const level = category.categoryLevel || 1
        if (!groups[level]) {
          groups[level] = []
        }
        groups[level].push(category)
      })
      return groups
    },

    /**
     * Get categories statistics
     */
    categoriesStatistics: (state) => {
      const stats = {
        total: state.categories.length,
        byLevel: {},
        testingRequired: 0,
        sampleRequired: 0,
        qrTrackingRequired: 0,
        leafCategories: 0,
        rootCategories: 0
      }

      const childrenMap = new Map()

      state.categories.forEach(category => {
        // Count by level
        const level = category.categoryLevel || 1
        stats.byLevel[level] = (stats.byLevel[level] || 0) + 1

        // Count requirements
        if (category.isTestingRequired) stats.testingRequired++
        if (category.isSampleRequired) stats.sampleRequired++
        if (category.isQRTrackingRequired) stats.qrTrackingRequired++

        // Build children map for leaf/root calculation
        if (category.parentCategoryId) {
          if (!childrenMap.has(category.parentCategoryId)) {
            childrenMap.set(category.parentCategoryId, [])
          }
          childrenMap.get(category.parentCategoryId).push(category.recCode)
        } else {
          stats.rootCategories++
        }
      })

      // Count leaf categories
      state.categories.forEach(category => {
        if (!childrenMap.has(category.recCode)) {
          stats.leafCategories++
        }
      })

      return stats
    },

    /**
     * Check if category is loaded
     */
    isCategoryLoaded: (state) => (categoryId) => {
      return state.currentCategory?.recCode === categoryId ||
             state.categoriesCache.has(categoryId)
    },

    /**
     * Get cached category
     */
    getCachedCategory: (state) => (categoryId) => {
      return state.categoriesCache.get(categoryId)
    },

    /**
     * Get categories for dropdown/selection
     */
    categoriesForSelection: (state) => {
      return state.categories.map(category => ({
        label: itemCategoriesService.formatCategoryDisplayName(category),
        value: category.recCode,
        level: category.categoryLevel,
        ...category
      }))
    },

    /**
     * Get category hierarchy as tree options
     */
    categoryTreeOptions: (state) => {
      const buildTreeOptions = (categories, parentId = null, level = 0) => {
        return categories
          .filter(cat => cat.parentCategoryId === parentId)
          .map(category => ({
            label: category.categoryName,
            value: category.recCode,
            icon: itemCategoriesService.getCategoryIcon(category),
            level: level,
            children: buildTreeOptions(categories, category.recCode, level + 1),
            ...category
          }))
      }

      return buildTreeOptions(state.categories)
    }
  },

  actions: {
    /**
     * Fetch all categories
     */
    async fetchCategories(params = {}) {
      this.isLoading = true

      try {
        const queryParams = {
          page: params.page ?? this.currentPage,
          size: params.size ?? this.pageSize,
          sort: this.sortBy,
          direction: this.sortDirection,
          ...params
        }

        const response = await itemCategoriesService.getAllCategories(queryParams)

        if (response.success) {
          this.categories = response.data.content || response.data
          this.totalCategories = response.data.totalElements || this.categories.length
          this.currentPage = response.data.number || 0
          this.pageSize = response.data.size || this.pageSize

          // Cache categories
          this.categories.forEach(category => {
            this.categoriesCache.set(category.recCode, category)
            this.cacheTimestamps.set(category.recCode, Date.now())
          })

          // Build tree structure
          this.buildCategoryTree()
        }

        return response
      } catch (error) {
        showError('Failed to fetch categories')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Fetch single category
     */
    async fetchCategory(categoryId) {
      // Check cache first
      if (this.isValidCache(categoryId)) {
        this.currentCategory = this.categoriesCache.get(categoryId)
        return this.currentCategory
      }

      this.isLoading = true

      try {
        const response = await itemCategoriesService.getCategoryById(categoryId)

        if (response.success) {
          this.currentCategory = response.data
          this.categoriesCache.set(categoryId, response.data)
          this.cacheTimestamps.set(categoryId, Date.now())
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch category')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Create category
     */
    async createCategory(categoryData) {
      this.isLoading = true

      try {
        const response = await itemCategoriesService.createCategory(categoryData)

        if (response.success) {
          this.categories.unshift(response.data)
          this.totalCategories++
          this.categoriesCache.set(response.data.recCode, response.data)
          this.cacheTimestamps.set(response.data.recCode, Date.now())

          // Rebuild tree structure
          this.buildCategoryTree()

          showSuccess('Category created successfully')
        }

        return response
      } catch (error) {
        showError('Failed to create category')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Update category
     */
    async updateCategory(categoryId, updateData) {
      this.isLoading = true

      try {
        const response = await itemCategoriesService.updateCategory(categoryId, updateData)

        if (response.success) {
          // Update in list
          const index = this.categories.findIndex(c => c.recCode === categoryId)
          if (index !== -1) {
            this.categories[index] = { ...this.categories[index], ...response.data }
          }

          // Update current category
          if (this.currentCategory?.recCode === categoryId) {
            this.currentCategory = { ...this.currentCategory, ...response.data }
          }

          // Update cache
          this.categoriesCache.set(categoryId, response.data)
          this.cacheTimestamps.set(categoryId, Date.now())

          // Rebuild tree structure
          this.buildCategoryTree()

          showSuccess('Category updated successfully')
        }

        return response
      } catch (error) {
        showError('Failed to update category')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Delete category
     */
    async deleteCategory(categoryId) {
      // Check if can delete
      const canDelete = await itemCategoriesService.canDeleteCategory(categoryId)
      if (!canDelete) {
        showError('Cannot delete this category as it has items or subcategories')
        return false
      }

      this.isLoading = true

      try {
        await itemCategoriesService.deleteCategory(categoryId)

        // Remove from list
        this.categories = this.categories.filter(c => c.recCode !== categoryId)
        this.totalCategories--

        // Clear current if deleted
        if (this.currentCategory?.recCode === categoryId) {
          this.currentCategory = null
        }

        // Clear cache
        this.categoriesCache.delete(categoryId)
        this.cacheTimestamps.delete(categoryId)
        this.childrenCache.delete(categoryId)

        // Rebuild tree structure
        this.buildCategoryTree()

        showSuccess('Category deleted successfully')
        return true
      } catch (error) {
        showError('Failed to delete category')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Search categories
     */
    async searchCategories(searchTerm, filters = {}, params = {}) {
      this.isLoading = true

      try {
        const response = await itemCategoriesService.searchCategories(searchTerm, filters, params)

        if (response.success) {
          this.categories = response.data.content || response.data
          this.totalCategories = response.data.totalElements || this.categories.length
          this.buildCategoryTree()
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
     * Fetch root categories
     */
    async fetchRootCategories(force = false) {
      if (!force && this.rootCategories.length > 0) {
        return this.rootCategories
      }

      try {
        const response = await itemCategoriesService.getRootCategories()

        if (response.success) {
          this.rootCategories = response.data
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch root categories')
        throw error
      }
    },

    /**
     * Fetch subcategories
     */
    async fetchSubCategories(categoryId, force = false) {
      const cacheKey = `children_${categoryId}`

      if (!force && this.childrenCache.has(cacheKey)) {
        return this.childrenCache.get(cacheKey)
      }

      try {
        const response = await itemCategoriesService.getSubCategories(categoryId)

        if (response.success) {
          this.childrenCache.set(cacheKey, response.data)
          this.cacheTimestamps.set(cacheKey, Date.now())
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch subcategories')
        throw error
      }
    },

    /**
     * Fetch leaf categories
     */
    async fetchLeafCategories(force = false) {
      if (!force && this.leafCategories.length > 0) {
        return this.leafCategories
      }

      try {
        const response = await itemCategoriesService.getLeafCategories()

        if (response.success) {
          this.leafCategories = response.data
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch leaf categories')
        throw error
      }
    },

    /**
     * Fetch categories by requirements
     */
    async fetchCategoriesByRequirements(isTestingRequired, isSampleRequired, isQRTrackingRequired) {
      try {
        const response = await itemCategoriesService.getCategoriesByRequirements(
          isTestingRequired, isSampleRequired, isQRTrackingRequired
        )
        return response.data
      } catch (error) {
        showError('Failed to fetch categories by requirements')
        throw error
      }
    },

    /**
     * Fetch categories requiring testing
     */
    async fetchTestingRequiredCategories(force = false) {
      if (!force && this.testingRequiredCategories.length > 0) {
        return this.testingRequiredCategories
      }

      try {
        const response = await itemCategoriesService.getCategoriesRequiringTesting()

        if (response.success) {
          this.testingRequiredCategories = response.data
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch testing required categories')
        throw error
      }
    },

    /**
     * Update display order
     */
    async updateDisplayOrder(categoryId, displayOrder) {
      try {
        await itemCategoriesService.updateDisplayOrder(categoryId, displayOrder)

        // Update in local state
        const category = this.categories.find(c => c.recCode === categoryId)
        if (category) {
          category.displayOrder = displayOrder
        }

        if (this.currentCategory?.recCode === categoryId) {
          this.currentCategory.displayOrder = displayOrder
        }

        showSuccess('Display order updated')
        return true
      } catch (error) {
        showError('Failed to update display order')
        throw error
      }
    },

    /**
     * Batch delete categories
     */
    async batchDeleteCategories(categoryIds) {
      this.isLoading = true

      try {
        await itemCategoriesService.batchDeleteCategories(categoryIds)

        // Remove from local state
        this.categories = this.categories.filter(c => !categoryIds.includes(c.recCode))
        this.totalCategories -= categoryIds.length

        // Clear cache
        categoryIds.forEach(id => {
          this.categoriesCache.delete(id)
          this.cacheTimestamps.delete(id)
          this.childrenCache.delete(`children_${id}`)
        })

        // Rebuild tree structure
        this.buildCategoryTree()

        showSuccess(`${categoryIds.length} categories deleted successfully`)
        return true
      } catch (error) {
        showError('Failed to delete categories')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Build category tree structure
     */
    buildCategoryTree() {
      this.categoryTree = itemCategoriesService.buildCategoryTree(this.categories)
    },

    /**
     * Get category path (breadcrumb)
     */
    getCategoryPath(categoryId) {
      return itemCategoriesService.getCategoryPath(categoryId, this.categories)
    },

    /**
     * Check if category has children
     */
    async hasChildren(categoryId) {
      try {
        return await itemCategoriesService.hasChildren(categoryId)
      } catch (error) {
        console.error('Failed to check category children:', error)
        return false
      }
    },

    /**
     * Validation methods
     */
    async validateCategoryCode(categoryCode, excludeId = null) {
      try {
        return await itemCategoriesService.isCategoryCodeUnique(categoryCode, excludeId)
      } catch (error) {
        console.error('Validation failed:', error)
        return false
      }
    },

    async validateCategoryName(categoryName, parentCategoryId = null, excludeId = null) {
      try {
        return await itemCategoriesService.isCategoryNameUniqueUnderParent(categoryName, parentCategoryId, excludeId)
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
        parentCategoryId: null,
        categoryLevel: null,
        isTestingRequired: null,
        isSampleRequired: null,
        isQRTrackingRequired: null,
        defaultUnit: null
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
      this.fetchCategories()
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
      this.categoriesCache.clear()
      this.childrenCache.clear()
      this.hierarchyCache.clear()
      this.cacheTimestamps.clear()
    },

    clearExpiredCache() {
      const now = Date.now()
      for (const [key, timestamp] of this.cacheTimestamps.entries()) {
        if (now - timestamp >= this.CACHE_TTL) {
          this.categoriesCache.delete(key)
          this.childrenCache.delete(key)
          this.hierarchyCache.delete(key)
          this.cacheTimestamps.delete(key)
        }
      }
    },

    /**
     * Utility methods
     */
    getCategoryIcon(category) {
      return itemCategoriesService.getCategoryIcon(category)
    },

    formatCategoryDisplayName(category) {
      return itemCategoriesService.formatCategoryDisplayName(category)
    },

    getCategoryRequirements(category) {
      return itemCategoriesService.getCategoryRequirements(category)
    },

    getCategoryLevelColor(level) {
      return itemCategoriesService.getCategoryLevelColor(level)
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
