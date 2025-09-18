// src/services/api/gallery.service.js
import { api } from 'boot/axios'
import { API_ENDPOINTS, PAGINATION } from 'src/constants/api.constants'
import {
  validateGalleryFile,
  // eslint-disable-next-line no-unused-vars
  generateGalleryUploadData,
  validateGalleryUploadData,
  createGalleryFileObject,
  getMediaPreviewUrl,
  formatGalleryFileInfo,
  // eslint-disable-next-line no-unused-vars
  uploadFile
} from 'src/utils/file'
import { showError, showSuccess, showProgress } from 'src/utils/notification'

class GalleryService {
  /**
   * Upload single media file
   * @param {File} file - File to upload
   * @param {Object} uploadData - Upload data
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} Upload result
   */
  async uploadMedia(file, uploadData, options = {}) {
    const { onProgress = null } = options

    // Validate file
    const fileValidation = validateGalleryFile(file)
    if (!fileValidation.valid) {
      throw new Error(fileValidation.errors.join(', '))
    }

    // Validate upload data
    const dataValidation = validateGalleryUploadData(uploadData)
    if (!dataValidation.valid) {
      throw new Error(dataValidation.errors.join(', '))
    }

    // Create form data
    const formData = new FormData()
    formData.append('file', file)

    // Add upload data fields
    Object.entries(uploadData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value)
      }
    })

    // eslint-disable-next-line no-useless-catch
    try {
      const response = await api.post(API_ENDPOINTS.GALLERY.UPLOAD, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            onProgress(percentCompleted, progressEvent)
          }
        }
      })

      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Upload multiple media files
   * @param {FileList|Array<File>} files - Files to upload
   * @param {Object} uploadData - Upload data
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} Upload results
   */
  async uploadMultipleMedia(files, uploadData, options = {}) {
    const {
      // eslint-disable-next-line no-unused-vars
      onFileProgress = null,
      onTotalProgress = null,
      // eslint-disable-next-line no-unused-vars
      concurrent = 3
    } = options

    const fileArray = Array.from(files)
    // eslint-disable-next-line no-unused-vars
    const results = []
    // eslint-disable-next-line no-unused-vars
    const errors = []

    // Create progress tracker
    const progress = {
      total: fileArray.length,
      completed: 0,
      failed: 0,
      percentage: 0
    }

    // Create form data
    const formData = new FormData()
    // eslint-disable-next-line no-unused-vars
    fileArray.forEach((file, index) => {
      formData.append('files', file)
    })

    // Add upload data fields
    Object.entries(uploadData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value)
      }
    })

    // eslint-disable-next-line no-useless-catch
    try {
      const response = await api.post(API_ENDPOINTS.GALLERY.UPLOAD_MULTIPLE, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (onTotalProgress) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            progress.percentage = percentCompleted
            onTotalProgress(progress)
          }
        }
      })

      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get media by ID
   * @param {string} mediaId - Media ID
   * @returns {Promise<Object>} Media data
   */
  async getMediaById(mediaId) {
    const response = await api.get(API_ENDPOINTS.GALLERY.BY_ID(mediaId))
    return response
  }

  /**
   * Update media details
   * @param {string} mediaId - Media ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated media
   */
  async updateMediaDetails(mediaId, updateData) {
    const response = await api.put(API_ENDPOINTS.GALLERY.BY_ID(mediaId), updateData)
    return response
  }

  /**
   * Delete media
   * @param {string} mediaId - Media ID
   * @returns {Promise<void>}
   */
  async deleteMedia(mediaId) {
    await api.delete(API_ENDPOINTS.GALLERY.BY_ID(mediaId))
  }

  /**
   * Download media file
   * @param {string} mediaId - Media ID
   * @param {string} filename - Download filename
   * @returns {Promise<void>}
   */
  async downloadMedia(mediaId, filename) {
    const response = await api.get(API_ENDPOINTS.GALLERY.DOWNLOAD(mediaId), {
      responseType: 'blob'
    })

    // Create download link
    const blob = new Blob([response.data])
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename

    // Trigger download
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Clean up
    window.URL.revokeObjectURL(downloadUrl)
  }

  /**
   * Get node gallery with pagination
   * @param {string} nodeId - Node ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Paginated gallery
   */
  async getNodeGallery(nodeId, params = {}) {
    const queryParams = {
      page: params.page || PAGINATION.DEFAULT_PAGE,
      size: params.size || PAGINATION.DEFAULT_SIZE,
      sort: `${params.sort || 'sortOrder'},${params.direction || 'ASC'}`
    }

    const response = await api.get(API_ENDPOINTS.GALLERY.NODE_GALLERY(nodeId), {
      params: queryParams
    })
    return response
  }

  /**
   * Get node gallery by media type
   * @param {string} nodeId - Node ID
   * @param {string} mediaType - Media type
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Filtered gallery
   */
  async getNodeGalleryByType(nodeId, mediaType, params = {}) {
    const queryParams = {
      page: params.page || PAGINATION.DEFAULT_PAGE,
      size: params.size || PAGINATION.DEFAULT_SIZE,
      sort: `${params.sort || 'sortOrder'},${params.direction || 'ASC'}`
    }

    const response = await api.get(API_ENDPOINTS.GALLERY.NODE_BY_TYPE(nodeId, mediaType), {
      params: queryParams
    })
    return response
  }

  /**
   * Get node gallery by category
   * @param {string} nodeId - Node ID
   * @param {string} category - Media category
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Filtered gallery
   */
  async getNodeGalleryByCategory(nodeId, category, params = {}) {
    const queryParams = {
      page: params.page || PAGINATION.DEFAULT_PAGE,
      size: params.size || PAGINATION.DEFAULT_SIZE,
      sort: `${params.sort || 'sortOrder'},${params.direction || 'ASC'}`
    }

    const response = await api.get(API_ENDPOINTS.GALLERY.NODE_BY_CATEGORY(nodeId, category), {
      params: queryParams
    })
    return response
  }

  /**
   * Get public media for a node
   * @param {string} nodeId - Node ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Public gallery
   */
  async getPublicGallery(nodeId, params = {}) {
    const queryParams = {
      page: params.page || PAGINATION.DEFAULT_PAGE,
      size: params.size || PAGINATION.DEFAULT_SIZE,
      sort: `${params.sort || 'sortOrder'},${params.direction || 'ASC'}`
    }

    const response = await api.get(API_ENDPOINTS.GALLERY.NODE_PUBLIC(nodeId), {
      params: queryParams
    })
    return response
  }

  /**
   * Search gallery by caption
   * @param {string} nodeId - Node ID
   * @param {string} searchTerm - Search term
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Search results
   */
  async searchGallery(nodeId, searchTerm, params = {}) {
    const queryParams = {
      searchTerm,
      page: params.page || PAGINATION.DEFAULT_PAGE,
      size: params.size || PAGINATION.DEFAULT_SIZE,
      sort: `${params.sort || 'uploadedDate'},${params.direction || 'DESC'}`
    }

    const response = await api.get(API_ENDPOINTS.GALLERY.NODE_SEARCH(nodeId), {
      params: queryParams
    })
    return response
  }

  /**
   * Get gallery summary for a node
   * @param {string} nodeId - Node ID
   * @returns {Promise<Object>} Gallery summary
   */
  async getGallerySummary(nodeId) {
    const response = await api.get(API_ENDPOINTS.GALLERY.NODE_SUMMARY(nodeId))
    return response
  }

  /**
   * Get user uploads
   * @param {string} userId - User ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} User uploads
   */
  async getUserUploads(userId, params = {}) {
    const queryParams = {
      page: params.page || PAGINATION.DEFAULT_PAGE,
      size: params.size || PAGINATION.DEFAULT_SIZE,
      sort: `${params.sort || 'uploadedDate'},${params.direction || 'DESC'}`
    }

    const response = await api.get(API_ENDPOINTS.GALLERY.USER_UPLOADS(userId), {
      params: queryParams
    })
    return response
  }

  /**
   * Get recent uploads
   * @param {Array<string>} nodeIds - Node IDs
   * @param {number} limit - Limit
   * @returns {Promise<Array>} Recent uploads
   */
  async getRecentUploads(nodeIds, limit = 10) {
    const response = await api.get(API_ENDPOINTS.GALLERY.RECENT, {
      params: { nodeIds, limit }
    })
    return response
  }

  /**
   * Update media order
   * @param {string} nodeId - Node ID
   * @param {Array<string>} mediaIds - Ordered media IDs
   * @returns {Promise<void>}
   */
  async updateMediaOrder(nodeId, mediaIds) {
    await api.put(API_ENDPOINTS.GALLERY.REORDER(nodeId), mediaIds)
  }

  /**
   * Move media to category
   * @param {string} mediaId - Media ID
   * @param {string} newCategory - New category
   * @returns {Promise<void>}
   */
  async moveMediaToCategory(mediaId, newCategory) {
    await api.put(API_ENDPOINTS.GALLERY.MOVE_CATEGORY(mediaId), null, {
      params: { newCategory }
    })
  }

  /**
   * Bulk update media category
   * @param {Array<string>} mediaIds - Media IDs
   * @param {string} category - New category
   * @returns {Promise<void>}
   */
  async bulkUpdateMediaCategory(mediaIds, category) {
    await api.put(API_ENDPOINTS.GALLERY.BULK_CATEGORY, null, {
      params: { mediaIds, category }
    })
  }

  /**
   * Bulk update media visibility
   * @param {Array<string>} mediaIds - Media IDs
   * @param {boolean} isPublic - Visibility
   * @returns {Promise<void>}
   */
  async bulkUpdateMediaVisibility(mediaIds, isPublic) {
    await api.put(API_ENDPOINTS.GALLERY.BULK_VISIBILITY, null, {
      params: { mediaIds, isPublic }
    })
  }

  /**
   * Get upload statistics
   * @param {string} nodeId - Node ID
   * @param {number} days - Number of days
   * @returns {Promise<Object>} Statistics
   */
  async getUploadStatistics(nodeId, days = 30) {
    const response = await api.get(API_ENDPOINTS.GALLERY.NODE_STATISTICS(nodeId), {
      params: { days }
    })
    return response
  }

  /**
   * Get media metadata
   * @param {string} mediaId - Media ID
   * @returns {Promise<Object>} Metadata
   */
  async getMediaMetadata(mediaId) {
    const response = await api.get(API_ENDPOINTS.GALLERY.METADATA(mediaId))
    return response
  }

  /**
   * Update media metadata
   * @param {string} mediaId - Media ID
   * @param {Object} metadata - Metadata
   * @returns {Promise<void>}
   */
  async updateMediaMetadata(mediaId, metadata) {
    await api.put(API_ENDPOINTS.GALLERY.METADATA(mediaId), metadata)
  }

  /**
   * Check if user can delete media
   * @param {string} mediaId - Media ID
   * @returns {Promise<Object>} Permission check result
   */
  async canDeleteMedia(mediaId) {
    const response = await api.get(API_ENDPOINTS.GALLERY.CAN_DELETE(mediaId))
    return response
  }

  /**
   * Export node gallery
   * @param {string} nodeId - Node ID
   * @returns {Promise<Array>} Gallery export
   */
  async exportNodeGallery(nodeId) {
    const response = await api.get(API_ENDPOINTS.GALLERY.NODE_EXPORT(nodeId))
    return response
  }

  /**
   * Delete all gallery items for a node
   * @param {string} nodeId - Node ID
   * @returns {Promise<void>}
   */
  async deleteNodeGallery(nodeId) {
    await api.delete(API_ENDPOINTS.GALLERY.DELETE_NODE_GALLERY(nodeId))
  }

  /**
   * Get media stream URL (for videos)
   * @param {string} mediaId - Media ID
   * @returns {string} Stream URL
   */
  getMediaStreamUrl(mediaId) {
    return `${process.env.API_URL || 'http://localhost:8090'}${API_ENDPOINTS.GALLERY.STREAM(mediaId)}`
  }

  /**
   * Get media download URL
   * @param {string} mediaId - Media ID
   * @returns {string} Download URL
   */
  getMediaDownloadUrl(mediaId) {
    return `${process.env.API_URL || 'http://localhost:8090'}${API_ENDPOINTS.GALLERY.DOWNLOAD(mediaId)}`
  }

  /**
   * Get media file URL
   * @param {string} mediaId - Media ID
   * @returns {string} File URL
   */
  getMediaFileUrl(mediaId) {
    return `${process.env.API_URL || 'http://localhost:8090'}${API_ENDPOINTS.GALLERY.BY_ID(mediaId)}`
  }

  /**
   * Handle upload with progress tracking
   * @param {File} file - File to upload
   * @param {Object} uploadData - Upload data
   * @param {Object} options - Options
   * @returns {Promise<Object>} Upload result
   */
  async uploadWithProgress(file, uploadData, options = {}) {
    const {
      showNotifications = true,
      showProgressDialog = true
    } = options

    let progressTracker = null

    if (showProgressDialog) {
      progressTracker = showProgress({
        message: `Uploading ${file.name}...`,
        progress: 0
      })
    }

    try {
      const result = await this.uploadMedia(file, uploadData, {
        onProgress: (percent) => {
          if (progressTracker) {
            progressTracker.update(percent, `Uploading ${file.name}... ${percent}%`)
          }
        }
      })

      if (progressTracker) {
        progressTracker.complete(`${file.name} uploaded successfully!`)
      }

      if (showNotifications) {
        showSuccess(`${file.name} uploaded successfully`)
      }

      return result
    } catch (error) {
      if (progressTracker) {
        progressTracker.error(`Failed to upload ${file.name}`)
      }

      if (showNotifications) {
        showError(`Failed to upload ${file.name}: ${error.message}`)
      }

      throw error
    }
  }

  /**
   * Handle multiple uploads with progress tracking
   * @param {FileList|Array<File>} files - Files to upload
   * @param {Object} uploadData - Upload data
   * @param {Object} options - Options
   * @returns {Promise<Object>} Upload results
   */
  async uploadMultipleWithProgress(files, uploadData, options = {}) {
    const {
      showNotifications = true,
      showProgressDialog = true
    } = options

    let progressTracker = null

    if (showProgressDialog) {
      progressTracker = showProgress({
        message: `Uploading ${files.length} files...`,
        progress: 0
      })
    }

    try {
      const result = await this.uploadMultipleMedia(files, uploadData, {
        onTotalProgress: (progress) => {
          if (progressTracker) {
            const message = `Uploading ${files.length} files... ${progress.completed}/${progress.total} completed`
            progressTracker.update(progress.percentage, message)
          }
        }
      })

      if (progressTracker) {
        progressTracker.complete(`${files.length} files uploaded successfully!`)
      }

      if (showNotifications) {
        showSuccess(`${files.length} files uploaded successfully`)
      }

      return result
    } catch (error) {
      if (progressTracker) {
        progressTracker.error(`Failed to upload files`)
      }

      if (showNotifications) {
        showError(`Failed to upload files: ${error.message}`)
      }

      throw error
    }
  }

  /**
   * Format gallery item for display
   * @param {Object} item - Gallery item
   * @returns {Object} Formatted item
   */
  formatGalleryItem(item) {
    return {
      ...item,
      ...formatGalleryFileInfo(item),
      previewUrl: getMediaPreviewUrl(item),
      downloadUrl: this.getMediaDownloadUrl(item.recCode),
      streamUrl: this.getMediaStreamUrl(item.recCode)
    }
  }

  /**
   * Prepare files for upload
   * @param {FileList|Array<File>} files - Files to prepare
   * @param {Object} uploadData - Upload data
   * @returns {Array<Object>} Prepared file objects
   */
  prepareFilesForUpload(files, uploadData) {
    return Array.from(files).map(file =>
      createGalleryFileObject(file, uploadData)
    )
  }
}

export default new GalleryService()
