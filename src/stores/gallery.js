// src/stores/gallery.js
import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import galleryService from 'src/services/api/gallery.service'
import {
  GALLERY_MEDIA_TYPES,
  GALLERY_CATEGORIES,
  sortGalleryItems,
  filterGalleryItems
} from 'src/utils/file'
import { showError, showSuccess } from 'src/utils/notification'

export const useGalleryStore = defineStore('gallery', () => {
  // State
  const currentNodeId = ref(null)
  const galleryItems = ref([])
  const gallerySummary = ref(null)
  const selectedItems = ref([])
  const uploadQueue = ref([])
  const loading = ref(false)
  const uploading = ref(false)

  // Pagination state
  const pagination = ref({
    page: 0,
    size: 20,
    sort: 'sortOrder',
    direction: 'ASC',
    totalElements: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false
  })

  // Filter and search state
  const filters = ref({
    mediaType: null,
    mediaCategory: null,
    isPublic: null,
    searchTerm: '',
    dateRange: null,
    uploader: null
  })

  // Sort options
  const sortOptions = ref({
    field: 'sortOrder',
    direction: 'asc',
    groupByCategory: false
  })

  // View options
  const viewOptions = ref({
    layout: 'grid', // grid, list, masonry
    showThumbnails: true,
    showDetails: false,
    itemSize: 'medium' // small, medium, large
  })

  // Upload progress
  const uploadProgress = ref({
    total: 0,
    completed: 0,
    failed: 0,
    percentage: 0,
    currentFile: null
  })

  // Computed
  const filteredItems = computed(() => {
    let items = [...galleryItems.value]

    // Apply filters
    items = filterGalleryItems(items, filters.value)

    // Apply sorting
    items = sortGalleryItems(items, sortOptions.value)

    return items
  })

  const itemsByType = computed(() => {
    const grouped = {}
    Object.values(GALLERY_MEDIA_TYPES).forEach(type => {
      grouped[type] = filteredItems.value.filter(item => item.mediaType === type)
    })
    return grouped
  })

  const itemsByCategory = computed(() => {
    const grouped = {}
    Object.values(GALLERY_CATEGORIES).forEach(category => {
      grouped[category] = filteredItems.value.filter(item => item.mediaCategory === category)
    })
    // Add items without category
    grouped.Other = filteredItems.value.filter(item =>
      !item.mediaCategory || !Object.values(GALLERY_CATEGORIES).includes(item.mediaCategory)
    )
    return grouped
  })

  const selectedItemsCount = computed(() => selectedItems.value.length)

  const hasSelectedItems = computed(() => selectedItemsCount.value > 0)

  const isAllSelected = computed(() =>
    filteredItems.value.length > 0 && selectedItemsCount.value === filteredItems.value.length
  )

  const uploadQueueCount = computed(() => uploadQueue.value.length)

  const hasUploadsInProgress = computed(() =>
    uploadQueue.value.some(item => item.status === 'uploading')
  )

  const completedUploads = computed(() =>
    uploadQueue.value.filter(item => item.status === 'completed')
  )

  const failedUploads = computed(() =>
    uploadQueue.value.filter(item => item.status === 'error')
  )

  // Actions
  const setCurrentNode = (nodeId) => {
    if (currentNodeId.value !== nodeId) {
      currentNodeId.value = nodeId
      clearGallery()
    }
  }

  const clearGallery = () => {
    galleryItems.value = []
    gallerySummary.value = null
    selectedItems.value = []
    resetPagination()
    resetFilters()
  }

  const resetPagination = () => {
    pagination.value = {
      page: 0,
      size: 20,
      sort: 'sortOrder',
      direction: 'ASC',
      totalElements: 0,
      totalPages: 0,
      hasNext: false,
      hasPrevious: false
    }
  }

  const resetFilters = () => {
    filters.value = {
      mediaType: null,
      mediaCategory: null,
      isPublic: null,
      searchTerm: '',
      dateRange: null,
      uploader: null
    }
  }

  const setFilter = (key, value) => {
    filters.value[key] = value
    // Reset to first page when filter changes
    pagination.value.page = 0
  }

  const clearFilters = () => {
    resetFilters()
  }

  const setSortOptions = (options) => {
    sortOptions.value = { ...sortOptions.value, ...options }
  }

  const setViewOptions = (options) => {
    viewOptions.value = { ...viewOptions.value, ...options }
  }

  // Gallery data actions
  const loadGallery = async (nodeId = null, params = {}) => {
    if (nodeId) setCurrentNode(nodeId)
    if (!currentNodeId.value) return

    loading.value = true
    try {
      const queryParams = {
        ...pagination.value,
        ...params
      }
      const response = await galleryService.getNodeGallery(currentNodeId.value, queryParams)

      console.log('Full API response:', response)
      console.log('response.data:', response.data)
      console.log('response.data.content:', response.data.content)

      if (params.page === 0 || !params.page) {
        // Replace items for first page or initial load
        galleryItems.value = response.data.content || []
      } else {
        // Append items for subsequent pages
        galleryItems.value.push(...(response.data.content || []))
      }

      console.log('galleryItems.value after assignment:', galleryItems.value)

      // Update pagination
      pagination.value = {
        page: response.data.number || 0,
        size: response.data.size || 20,
        sort: queryParams.sort,
        direction: queryParams.direction,
        totalElements: response.data.totalElements || 0,
        totalPages: response.data.totalPages || 0,
        hasNext: !response.data.last,
        hasPrevious: !response.data.first
      }

    } catch (error) {
      console.error('Error loading gallery:', error)
      showError('Failed to load gallery')
    } finally {
      loading.value = false
    }
  }

  const loadGalleryByType = async (mediaType, params = {}) => {
    if (!currentNodeId.value) return

    loading.value = true
    try {
      const response = await galleryService.getNodeGalleryByType(
        currentNodeId.value,
        mediaType,
        { ...pagination.value, ...params }
      )

      galleryItems.value = response.data.content || []
      // Update pagination similar to loadGallery

    } catch (error) {
      console.error('Error loading gallery by type:', error)
      showError('Failed to load gallery')
    } finally {
      loading.value = false
    }
  }

  const loadGalleryByCategory = async (category, params = {}) => {
    if (!currentNodeId.value) return

    loading.value = true
    try {
      const response = await galleryService.getNodeGalleryByCategory(
        currentNodeId.value,
        category,
        { ...pagination.value, ...params }
      )

      galleryItems.value = response.data.content || []
      // Update pagination similar to loadGallery

    } catch (error) {
      console.error('Error loading gallery by category:', error)
      showError('Failed to load gallery')
    } finally {
      loading.value = false
    }
  }

  const loadGallerySummary = async (nodeId = null) => {
    if (nodeId) setCurrentNode(nodeId)
    if (!currentNodeId.value) return

    try {
      const response = await galleryService.getGallerySummary(currentNodeId.value)
      gallerySummary.value = response.data
    } catch (error) {
      console.error('Error loading gallery summary:', error)
    }
  }

  const searchGallery = async (searchTerm, params = {}) => {
    if (!currentNodeId.value) return

    loading.value = true
    try {
      const response = await galleryService.searchGallery(
        currentNodeId.value,
        searchTerm,
        { ...pagination.value, ...params }
      )

      galleryItems.value = response.data.content || []
      setFilter('searchTerm', searchTerm)

    } catch (error) {
      console.error('Error searching gallery:', error)
      showError('Failed to search gallery')
    } finally {
      loading.value = false
    }
  }

  const refreshGallery = async () => {
    await loadGallery(currentNodeId.value, { page: 0 })
    await loadGallerySummary(currentNodeId.value)
  }

  const loadNextPage = async () => {
    if (pagination.value.hasNext && !loading.value) {
      await loadGallery(currentNodeId.value, {
        page: pagination.value.page + 1
      })
    }
  }

  // Item management actions
  const addGalleryItem = (item) => {
    const existingIndex = galleryItems.value.findIndex(i => i.recCode === item.recCode)
    if (existingIndex >= 0) {
      galleryItems.value[existingIndex] = item
    } else {
      galleryItems.value.unshift(item)
    }
  }

  const updateGalleryItem = async (itemId, updateData) => {
    try {
      const response = await galleryService.updateMediaDetails(itemId, updateData)
      const updatedItem = response.data

      const index = galleryItems.value.findIndex(item => item.recCode === itemId)
      if (index >= 0) {
        galleryItems.value[index] = updatedItem
      }

      showSuccess('Media updated successfully')
      return updatedItem
    } catch (error) {
      console.error('Error updating gallery item:', error)
      showError('Failed to update media')
      throw error
    }
  }

  const removeGalleryItem = async (itemId) => {
    try {
      await galleryService.deleteMedia(itemId)

      galleryItems.value = galleryItems.value.filter(item => item.recCode !== itemId)
      selectedItems.value = selectedItems.value.filter(id => id !== itemId)

      showSuccess('Media deleted successfully')
      await loadGallerySummary() // Refresh summary
    } catch (error) {
      console.error('Error deleting gallery item:', error)
      showError('Failed to delete media')
      throw error
    }
  }

  // Selection actions
  const selectItem = (itemId) => {
    if (!selectedItems.value.includes(itemId)) {
      selectedItems.value.push(itemId)
    }
  }

  const unselectItem = (itemId) => {
    selectedItems.value = selectedItems.value.filter(id => id !== itemId)
  }

  const toggleItemSelection = (itemId) => {
    if (selectedItems.value.includes(itemId)) {
      unselectItem(itemId)
    } else {
      selectItem(itemId)
    }
  }

  const selectAllItems = () => {
    selectedItems.value = filteredItems.value.map(item => item.recCode)
  }

  const clearSelection = () => {
    selectedItems.value = []
  }

  const toggleSelectAll = () => {
    if (isAllSelected.value) {
      clearSelection()
    } else {
      selectAllItems()
    }
  }

  // Upload actions
  const addToUploadQueue = (files, uploadData) => {
    const newItems = galleryService.prepareFilesForUpload(files, uploadData)
    uploadQueue.value.push(...newItems)
    return newItems
  }

  const removeFromUploadQueue = (uploadId) => {
    uploadQueue.value = uploadQueue.value.filter(item => item.id !== uploadId)
  }

  const clearUploadQueue = () => {
    uploadQueue.value = []
    resetUploadProgress()
  }

  const resetUploadProgress = () => {
    uploadProgress.value = {
      total: 0,
      completed: 0,
      failed: 0,
      percentage: 0,
      currentFile: null
    }
  }

  // eslint-disable-next-line no-unused-vars
  const uploadFiles = async (files, uploadData, options = {}) => {
    if (!currentNodeId.value) {
      throw new Error('No current node selected')
    }

    uploading.value = true
    const uploadItems = addToUploadQueue(files, uploadData)

    // Initialize progress
    uploadProgress.value = {
      total: uploadItems.length,
      completed: 0,
      failed: 0,
      percentage: 0,
      currentFile: null
    }

    const results = []
    const errors = []

    try {
      for (const uploadItem of uploadItems) {
        uploadProgress.value.currentFile = uploadItem.name
        uploadItem.status = 'uploading'

        try {
          const result = await galleryService.uploadMedia(
            uploadItem.file,
            uploadItem.uploadData,
            {
              onProgress: (percent) => {
                uploadItem.progress = percent
              }
            }
          )

          uploadItem.status = 'completed'
          uploadItem.result = result.data
          results.push(result.data)

          // Add to gallery items
          addGalleryItem(result.data)

          uploadProgress.value.completed++
        } catch (error) {
          uploadItem.status = 'error'
          uploadItem.error = error.message
          errors.push({ file: uploadItem, error })

          uploadProgress.value.failed++
        }

        // Update overall progress
        uploadProgress.value.percentage = Math.round(
          ((uploadProgress.value.completed + uploadProgress.value.failed) / uploadProgress.value.total) * 100
        )
      }

      // Refresh gallery summary
      await loadGallerySummary()

      return { results, errors }
    } finally {
      uploading.value = false
      uploadProgress.value.currentFile = null
    }
  }

  const uploadSingleFile = async (file, uploadData, options = {}) => {
    return await uploadFiles([file], uploadData, options)
  }

  // Bulk actions
  const bulkUpdateCategory = async (itemIds, category) => {
    try {
      await galleryService.bulkUpdateMediaCategory(itemIds, category)

      // Update local items
      galleryItems.value.forEach(item => {
        if (itemIds.includes(item.recCode)) {
          item.mediaCategory = category
        }
      })

      showSuccess(`${itemIds.length} items updated successfully`)
      clearSelection()
    } catch (error) {
      console.error('Error bulk updating category:', error)
      showError('Failed to update category')
      throw error
    }
  }

  const bulkUpdateVisibility = async (itemIds, isPublic) => {
    try {
      await galleryService.bulkUpdateMediaVisibility(itemIds, isPublic)

      // Update local items
      galleryItems.value.forEach(item => {
        if (itemIds.includes(item.recCode)) {
          item.isPublic = isPublic
        }
      })

      const visibilityText = isPublic ? 'public' : 'private'
      showSuccess(`${itemIds.length} items made ${visibilityText}`)
      clearSelection()
    } catch (error) {
      console.error('Error bulk updating visibility:', error)
      showError('Failed to update visibility')
      throw error
    }
  }

  const bulkDelete = async (itemIds) => {
    try {
      // Delete items one by one (could be optimized with bulk API if available)
      for (const itemId of itemIds) {
        await galleryService.deleteMedia(itemId)
      }

      // Remove from local state
      galleryItems.value = galleryItems.value.filter(item =>
        !itemIds.includes(item.recCode)
      )

      showSuccess(`${itemIds.length} items deleted successfully`)
      clearSelection()
      await loadGallerySummary()
    } catch (error) {
      console.error('Error bulk deleting items:', error)
      showError('Failed to delete items')
      throw error
    }
  }

  // Utility actions
  const reorderItems = async (orderedItemIds) => {
    try {
      await galleryService.updateMediaOrder(currentNodeId.value, orderedItemIds)

      // Update local order
      const orderedItems = []
      orderedItemIds.forEach((id, index) => {
        const item = galleryItems.value.find(i => i.recCode === id)
        if (item) {
          item.sortOrder = index
          orderedItems.push(item)
        }
      })

      // Add any remaining items not in the ordered list
      galleryItems.value.forEach(item => {
        if (!orderedItemIds.includes(item.recCode)) {
          orderedItems.push(item)
        }
      })

      galleryItems.value = orderedItems
      showSuccess('Media order updated successfully')
    } catch (error) {
      console.error('Error reordering items:', error)
      showError('Failed to update order')
      throw error
    }
  }

  const downloadItem = async (item) => {
    try {
      await galleryService.downloadMedia(item.recCode, item.originalFileName || item.fileName)
    } catch (error) {
      console.error('Error downloading item:', error)
      showError('Failed to download file')
      throw error
    }
  }

  const getItemById = (itemId) => {
    return galleryItems.value.find(item => item.recCode === itemId)
  }

  const getSelectedItems = () => {
    return galleryItems.value.filter(item => selectedItems.value.includes(item.recCode))
  }

  // Camera-specific upload methods
  // eslint-disable-next-line no-unused-vars
  const uploadCameraPhoto = async (imageData, uploadData, options = {}) => {
    if (!currentNodeId.value) {
      throw new Error('No current node selected')
    }

    uploading.value = true

    try {
      // Convert data URL to File object
      const file = await dataUrlToFile(
        imageData.dataUrl,
        generatePhotoFilename(uploadData.metadata?.title || 'camera_photo'),
        `image/${imageData.format || 'jpeg'}`
      )

      // Prepare upload data with camera-specific metadata
      const cameraUploadData = {
        ...uploadData,
        metadata: {
          ...uploadData.metadata,
          captureSource: imageData.source,
          cameraDirection: imageData.direction,
          originalFormat: imageData.format,
          capturedAt: new Date().toISOString(),
          optimized: true,
          captureDevice: 'mobile_camera'
        }
      }

      // Initialize progress
      uploadProgress.value = {
        total: 1,
        completed: 0,
        failed: 0,
        percentage: 0,
        currentFile: file.name
      }

      // Upload the photo
      const result = await galleryService.uploadMedia(file, cameraUploadData, {
        onProgress: (percent) => {
          uploadProgress.value.percentage = percent
        }
      })

      // Update progress
      uploadProgress.value.completed = 1
      uploadProgress.value.percentage = 100

      // Add to gallery items
      addGalleryItem(result.data)

      // Refresh gallery summary
      await loadGallerySummary()

      return result
    } catch (error) {
      uploadProgress.value.failed = 1
      console.error('Camera photo upload error:', error)
      throw error
    } finally {
      uploading.value = false
      uploadProgress.value.currentFile = null
    }
  }

  // Helper method to convert data URL to File
  const dataUrlToFile = async (dataUrl, filename, mimeType) => {
    try {
      const response = await fetch(dataUrl)
      const blob = await response.blob()
      return new File([blob], filename, { type: mimeType })
    } catch (error) {
      console.error('Data URL to File conversion failed:', error)
      throw error
    }
  }

  // Helper method to generate photo filename
  const generatePhotoFilename = (title, extension = 'jpg') => {
    const timestamp = new Date().toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .split('.')[0]

    const cleanTitle = title
      .replace(/[^a-z0-9\s]/gi, '')
      .replace(/\s+/g, '_')
      .toLowerCase()
      .substring(0, 30) // Limit title length

    return `${cleanTitle}_${timestamp}.${extension}`
  }

  // Upload camera photo with metadata
  const uploadCameraPhotoWithMetadata = async (imageData, metadata) => {
    const uploadData = {
      nodeId: currentNodeId.value,
      mediaCategory: metadata.category || GALLERY_CATEGORIES.PROGRESS,
      isPublic: metadata.isPublic !== undefined ? metadata.isPublic : true,
      sortOrder: metadata.sortOrder || 0,
      caption: metadata.description || '',
      metadata: {
        title: metadata.title || '',
        tags: Array.isArray(metadata.tags) ? metadata.tags.join(',') : metadata.tags || '',
        ...metadata.customMetadata
      }
    }

    return await uploadCameraPhoto(imageData, uploadData)
  }

  // Get camera upload statistics
  const getCameraUploadStats = () => {
    const cameraUploads = galleryItems.value.filter(item =>
      item.metadata?.captureSource === 'camera' ||
      item.metadata?.captureDevice === 'mobile_camera'
    )

    return {
      total: cameraUploads.length,
      byDirection: {
        front: cameraUploads.filter(item => item.metadata?.cameraDirection === 'front').length,
        rear: cameraUploads.filter(item => item.metadata?.cameraDirection === 'rear').length
      },
      byCategory: Object.values(GALLERY_CATEGORIES).reduce((acc, category) => {
        acc[category] = cameraUploads.filter(item => item.mediaCategory === category).length
        return acc
      }, {}),
      recent: cameraUploads
        .filter(item => {
          const uploadDate = new Date(item.uploadedDate)
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
          return uploadDate > oneDayAgo
        })
        .length
    }
  }

  return {
    // State
    currentNodeId: readonly(currentNodeId),
    galleryItems: readonly(galleryItems),
    gallerySummary: readonly(gallerySummary),
    selectedItems: readonly(selectedItems),
    uploadQueue: readonly(uploadQueue),
    loading: readonly(loading),
    uploading: readonly(uploading),
    pagination: readonly(pagination),
    filters: readonly(filters),
    sortOptions: readonly(sortOptions),
    viewOptions: readonly(viewOptions),
    uploadProgress: readonly(uploadProgress),

    // Computed
    filteredItems,
    itemsByType,
    itemsByCategory,
    selectedItemsCount,
    hasSelectedItems,
    isAllSelected,
    uploadQueueCount,
    hasUploadsInProgress,
    completedUploads,
    failedUploads,

    // Actions
    setCurrentNode,
    clearGallery,
    resetPagination,
    resetFilters,
    setFilter,
    clearFilters,
    setSortOptions,
    setViewOptions,

    // Gallery data
    loadGallery,
    loadGalleryByType,
    loadGalleryByCategory,
    loadGallerySummary,
    searchGallery,
    refreshGallery,
    loadNextPage,

    // Item management
    addGalleryItem,
    updateGalleryItem,
    removeGalleryItem,

    // Selection
    selectItem,
    unselectItem,
    toggleItemSelection,
    selectAllItems,
    clearSelection,
    toggleSelectAll,

    // Upload
    addToUploadQueue,
    removeFromUploadQueue,
    clearUploadQueue,
    resetUploadProgress,
    uploadFiles,
    uploadSingleFile,

    // Bulk actions
    bulkUpdateCategory,
    bulkUpdateVisibility,
    bulkDelete,

    // Utilities
    reorderItems,
    downloadItem,
    getItemById,
    getSelectedItems,
    uploadCameraPhoto,
    uploadCameraPhotoWithMetadata,
    getCameraUploadStats,
    dataUrlToFile,
    generatePhotoFilename
  }
})
