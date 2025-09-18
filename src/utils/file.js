/* eslint-disable no-useless-catch */
// src/utils/file.js
import { api } from 'boot/axios'
import { showError, showSuccess, showProgress, showConfirm } from './notification.js'

/**
 * File type categories
 */
export const FILE_CATEGORIES = {
  IMAGE: 'image',
  DOCUMENT: 'document',
  SPREADSHEET: 'spreadsheet',
  PRESENTATION: 'presentation',
  VIDEO: 'video',
  AUDIO: 'audio',
  ARCHIVE: 'archive',
  CODE: 'code',
  OTHER: 'other'
}

/**
 * MIME type mappings
 */
export const MIME_TYPES = {
  // Images
  'image/jpeg': { category: FILE_CATEGORIES.IMAGE, extensions: ['jpg', 'jpeg'] },
  'image/png': { category: FILE_CATEGORIES.IMAGE, extensions: ['png'] },
  'image/gif': { category: FILE_CATEGORIES.IMAGE, extensions: ['gif'] },
  'image/webp': { category: FILE_CATEGORIES.IMAGE, extensions: ['webp'] },
  'image/svg+xml': { category: FILE_CATEGORIES.IMAGE, extensions: ['svg'] },
  'image/bmp': { category: FILE_CATEGORIES.IMAGE, extensions: ['bmp'] },

  // Documents
  'application/pdf': { category: FILE_CATEGORIES.DOCUMENT, extensions: ['pdf'] },
  'application/msword': { category: FILE_CATEGORIES.DOCUMENT, extensions: ['doc'] },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { category: FILE_CATEGORIES.DOCUMENT, extensions: ['docx'] },
  'text/plain': { category: FILE_CATEGORIES.DOCUMENT, extensions: ['txt'] },
  'application/rtf': { category: FILE_CATEGORIES.DOCUMENT, extensions: ['rtf'] },

  // Spreadsheets
  'application/vnd.ms-excel': { category: FILE_CATEGORIES.SPREADSHEET, extensions: ['xls'] },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { category: FILE_CATEGORIES.SPREADSHEET, extensions: ['xlsx'] },
  'text/csv': { category: FILE_CATEGORIES.SPREADSHEET, extensions: ['csv'] },

  // Presentations
  'application/vnd.ms-powerpoint': { category: FILE_CATEGORIES.PRESENTATION, extensions: ['ppt'] },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { category: FILE_CATEGORIES.PRESENTATION, extensions: ['pptx'] },

  // Video
  'video/mp4': { category: FILE_CATEGORIES.VIDEO, extensions: ['mp4'] },
  'video/mpeg': { category: FILE_CATEGORIES.VIDEO, extensions: ['mpeg', 'mpg'] },
  'video/quicktime': { category: FILE_CATEGORIES.VIDEO, extensions: ['mov'] },
  'video/x-msvideo': { category: FILE_CATEGORIES.VIDEO, extensions: ['avi'] },
  'video/webm': { category: FILE_CATEGORIES.VIDEO, extensions: ['webm'] },

  // Audio
  'audio/mpeg': { category: FILE_CATEGORIES.AUDIO, extensions: ['mp3'] },
  'audio/wav': { category: FILE_CATEGORIES.AUDIO, extensions: ['wav'] },
  'audio/ogg': { category: FILE_CATEGORIES.AUDIO, extensions: ['ogg'] },
  'audio/webm': { category: FILE_CATEGORIES.AUDIO, extensions: ['weba'] },

  // Archives
  'application/zip': { category: FILE_CATEGORIES.ARCHIVE, extensions: ['zip'] },
  'application/x-rar-compressed': { category: FILE_CATEGORIES.ARCHIVE, extensions: ['rar'] },
  'application/x-7z-compressed': { category: FILE_CATEGORIES.ARCHIVE, extensions: ['7z'] },
  'application/x-tar': { category: FILE_CATEGORIES.ARCHIVE, extensions: ['tar'] },
  'application/gzip': { category: FILE_CATEGORIES.ARCHIVE, extensions: ['gz'] },

  // Code
  'text/html': { category: FILE_CATEGORIES.CODE, extensions: ['html', 'htm'] },
  'text/css': { category: FILE_CATEGORIES.CODE, extensions: ['css'] },
  'text/javascript': { category: FILE_CATEGORIES.CODE, extensions: ['js'] },
  'application/json': { category: FILE_CATEGORIES.CODE, extensions: ['json'] },
  'application/xml': { category: FILE_CATEGORIES.CODE, extensions: ['xml'] }
}

/**
 * Gallery-specific constants
 */
export const GALLERY_MEDIA_TYPES = {
  IMAGE: 'Image',
  VIDEO: 'Video',
  DOCUMENT: 'Document',
  AUDIO: 'Audio'
}

export const GALLERY_CATEGORIES = {
  PROGRESS: 'Progress',
  ISSUE: 'Issue',
  BEFORE: 'Before',
  AFTER: 'After',
  BLUEPRINT: 'Blueprint'
}

/**
 * File upload configuration
 */
export const UPLOAD_CONFIG = {
  maxFileSize: 100 * 1024 * 1024, // 100MB default
  chunkSize: 1024 * 1024, // 1MB chunks for large files
  maxRetries: 3,
  retryDelay: 1000,
  allowedTypes: Object.keys(MIME_TYPES),
  imageMaxDimensions: {
    width: 4096,
    height: 4096
  },
  thumbnailSize: {
    width: 200,
    height: 200
  }
}

/**
 * Get file extension
 * @param {string} filename - File name
 * @returns {string} File extension
 */
export const getFileExtension = (filename) => {
  if (!filename) return ''
  const parts = filename.split('.')
  return parts.length > 1 ? parts.pop().toLowerCase() : ''
}

/**
 * Get file category
 * @param {File|string} file - File object or MIME type
 * @returns {string} File category
 */
export const getFileCategory = (file) => {
  const mimeType = typeof file === 'string' ? file : file.type
  const typeInfo = MIME_TYPES[mimeType]
  return typeInfo?.category || FILE_CATEGORIES.OTHER
}

/**
 * Get file icon
 * @param {File|string} file - File object or filename
 * @returns {string} Icon name
 */
export const getFileIcon = (file) => {
  const category = typeof file === 'object' ? getFileCategory(file) : getFileCategoryByName(file)

  const iconMap = {
    [FILE_CATEGORIES.IMAGE]: 'image',
    [FILE_CATEGORIES.DOCUMENT]: 'description',
    [FILE_CATEGORIES.SPREADSHEET]: 'table_chart',
    [FILE_CATEGORIES.PRESENTATION]: 'slideshow',
    [FILE_CATEGORIES.VIDEO]: 'videocam',
    [FILE_CATEGORIES.AUDIO]: 'audiotrack',
    [FILE_CATEGORIES.ARCHIVE]: 'folder_zip',
    [FILE_CATEGORIES.CODE]: 'code',
    [FILE_CATEGORIES.OTHER]: 'insert_drive_file'
  }

  return iconMap[category] || 'insert_drive_file'
}

/**
 * Get file category by filename
 * @param {string} filename - File name
 * @returns {string} File category
 */
export const getFileCategoryByName = (filename) => {
  const extension = getFileExtension(filename)

  // eslint-disable-next-line no-unused-vars
  for (const [mimeType, info] of Object.entries(MIME_TYPES)) {
    if (info.extensions.includes(extension)) {
      return info.category
    }
  }

  return FILE_CATEGORIES.OTHER
}

/**
 * Format file size
 * @param {number} bytes - File size in bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i]
}

/**
 * Validate file
 * @param {File} file - File to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export const validateFile = (file, options = {}) => {
  const {
    maxSize = UPLOAD_CONFIG.maxFileSize,
    allowedTypes = UPLOAD_CONFIG.allowedTypes,
    allowedExtensions = null,
    allowedCategories = null
  } = options

  const result = {
    valid: true,
    errors: []
  }

  // Check file size
  if (file.size > maxSize) {
    result.valid = false
    result.errors.push(`File size exceeds maximum allowed size of ${formatFileSize(maxSize)}`)
  }

  // Check MIME type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    result.valid = false
    result.errors.push(`File type "${file.type}" is not allowed`)
  }

  // Check extension
  if (allowedExtensions) {
    const extension = getFileExtension(file.name)
    if (!allowedExtensions.includes(extension)) {
      result.valid = false
      result.errors.push(`File extension ".${extension}" is not allowed`)
    }
  }

  // Check category
  if (allowedCategories) {
    const category = getFileCategory(file)
    if (!allowedCategories.includes(category)) {
      result.valid = false
      result.errors.push(`File category "${category}" is not allowed`)
    }
  }

  return result
}

/**
 * Read file as data URL
 * @param {File} file - File to read
 * @returns {Promise<string>} Data URL
 */
export const readFileAsDataURL = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Read file as text
 * @param {File} file - File to read
 * @returns {Promise<string>} File content
 */
export const readFileAsText = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsText(file)
  })
}

/**
 * Read file as array buffer
 * @param {File} file - File to read
 * @returns {Promise<ArrayBuffer>} Array buffer
 */
export const readFileAsArrayBuffer = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Create image thumbnail
 * @param {File} file - Image file
 * @param {Object} options - Thumbnail options
 * @returns {Promise<Blob>} Thumbnail blob
 */
export const createImageThumbnail = (file, options = {}) => {
  const {
    width = UPLOAD_CONFIG.thumbnailSize.width,
    height = UPLOAD_CONFIG.thumbnailSize.height,
    quality = 0.8,
    format = 'image/jpeg'
  } = options

  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    try {
      const dataUrl = await readFileAsDataURL(file)
      const img = new Image()

      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        // Calculate dimensions
        let targetWidth = width
        let targetHeight = height

        const aspectRatio = img.width / img.height

        if (img.width > img.height) {
          targetHeight = width / aspectRatio
        } else {
          targetWidth = height * aspectRatio
        }

        canvas.width = targetWidth
        canvas.height = targetHeight

        // Draw resized image
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

        // Convert to blob
        canvas.toBlob(
          (blob) => resolve(blob),
          format,
          quality
        )
      }

      img.onerror = reject
      img.src = dataUrl
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Upload file to server
 * @param {File} file - File to upload
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result
 */
export const uploadFile = async (file, options = {}) => {
  const {
    endpoint = '/files/upload',
    fieldName = 'file',
    data = {},
    onProgress = null,
    validateOptions = {},
    generateThumbnail = false
  } = options

  // Validate file
  const validation = validateFile(file, validateOptions)
  if (!validation.valid) {
    throw new Error(validation.errors.join(', '))
  }

  // Create form data
  const formData = new FormData()
  formData.append(fieldName, file)

  // Add thumbnail if image
  if (generateThumbnail && getFileCategory(file) === FILE_CATEGORIES.IMAGE) {
    try {
      const thumbnail = await createImageThumbnail(file)
      formData.append('thumbnail', thumbnail, `thumb_${file.name}`)
    } catch (error) {
      console.error('Error creating thumbnail:', error)
    }
  }

  // Add additional data
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value)
  })

  // Upload file
  try {
    const response = await api.post(endpoint, formData, {
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
    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Upload multiple files
 * @param {FileList|Array<File>} files - Files to upload
 * @param {Object} options - Upload options
 * @returns {Promise<Array>} Upload results
 */
export const uploadMultipleFiles = async (files, options = {}) => {
  const {
    concurrent = 3,
    onFileProgress = null,
    onTotalProgress = null,
    ...uploadOptions
  } = options

  const fileArray = Array.from(files)
  const results = []
  const errors = []

  // Create progress tracker
  const progress = {
    total: fileArray.length,
    completed: 0,
    failed: 0,
    percentage: 0
  }

  // Upload function
  const uploadSingle = async (file, index) => {
    try {
      const result = await uploadFile(file, {
        ...uploadOptions,
        onProgress: (percent) => {
          if (onFileProgress) {
            onFileProgress(index, percent, file)
          }
        }
      })

      progress.completed++
      results.push({ file, result, index })
    } catch (error) {
      progress.failed++
      errors.push({ file, error, index })
    }

    // Update total progress
    progress.percentage = Math.round(((progress.completed + progress.failed) / progress.total) * 100)
    if (onTotalProgress) {
      onTotalProgress(progress)
    }
  }

  // Upload in batches
  for (let i = 0; i < fileArray.length; i += concurrent) {
    const batch = fileArray.slice(i, i + concurrent)
    await Promise.all(
      batch.map((file, batchIndex) => uploadSingle(file, i + batchIndex))
    )
  }

  return { results, errors, progress }
}

/**
 * Chunked file upload for large files
 * @param {File} file - Large file to upload
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result
 */
export const uploadLargeFile = async (file, options = {}) => {
  const {
    endpoint = '/files/upload/chunked',
    chunkSize = UPLOAD_CONFIG.chunkSize,
    onProgress = null,
    data = {}
  } = options

  const totalChunks = Math.ceil(file.size / chunkSize)
  const uploadId = generateUploadId()

  const progressTracker = showProgress({
    message: `Uploading ${file.name}...`,
    progress: 0
  })

  try {
    // Upload chunks
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * chunkSize
      const end = Math.min(start + chunkSize, file.size)
      const chunk = file.slice(start, end)

      const formData = new FormData()
      formData.append('chunk', chunk)
      formData.append('uploadId', uploadId)
      formData.append('chunkIndex', chunkIndex)
      formData.append('totalChunks', totalChunks)
      formData.append('filename', file.name)
      formData.append('fileSize', file.size)
      formData.append('mimeType', file.type)

      // Add additional data
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value)
      })

      await api.post(`${endpoint}/chunk`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      const progress = Math.round(((chunkIndex + 1) / totalChunks) * 100)
      progressTracker.update(progress, `Uploading ${file.name}... ${progress}%`)

      if (onProgress) {
        onProgress(progress, { chunkIndex, totalChunks })
      }
    }

    // Complete upload
    const response = await api.post(`${endpoint}/complete`, {
      uploadId,
      filename: file.name,
      fileSize: file.size,
      mimeType: file.type,
      ...data
    })

    progressTracker.complete(`${file.name} uploaded successfully!`)

    return response.data
  } catch (error) {
    progressTracker.error(`Failed to upload ${file.name}`)
    throw error
  }
}

/**
 * Download file from server
 * @param {string} url - File URL
 * @param {string} filename - Save as filename
 * @param {Object} options - Download options
 * @returns {Promise<void>}
 */
export const downloadFile = async (url, filename, options = {}) => {
  const {
    onProgress = null,
    headers = {}
  } = options

  const progressTracker = showProgress({
    message: `Downloading ${filename}...`,
    progress: 0
  })

  try {
    const response = await api.get(url, {
      responseType: 'blob',
      headers,
      onDownloadProgress: (progressEvent) => {
        if (progressEvent.lengthComputable) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          progressTracker.update(percentCompleted, `Downloading ${filename}... ${percentCompleted}%`)

          if (onProgress) {
            onProgress(percentCompleted, progressEvent)
          }
        }
      }
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

    progressTracker.complete(`${filename} downloaded successfully!`)
  } catch (error) {
    progressTracker.error(`Failed to download ${filename}`)
    throw error
  }
}

/**
 * Get presigned upload URL (for S3)
 * @param {Object} options - Presigned URL options
 * @returns {Promise<Object>} Presigned URL data
 */
export const getPresignedUploadUrl = async (options = {}) => {
  const {
    filename,
    fileType,
    fileSize,
    path = '',
    expiresIn = 3600
  } = options

  try {
    const response = await api.post('/files/presigned-upload', {
      filename,
      fileType,
      fileSize,
      path,
      expiresIn
    })

    return response.data
  } catch (error) {
    throw error
  }
}

/**
 * Upload file to S3 using presigned URL
 * @param {File} file - File to upload
 * @param {string} presignedUrl - Presigned upload URL
 * @param {Object} options - Upload options
 * @returns {Promise<void>}
 */
export const uploadToS3 = async (file, presignedUrl, options = {}) => {
  const {
    onProgress = null,
    headers = {}
  } = options

  try {
    await api.put(presignedUrl, file, {
      headers: {
        'Content-Type': file.type,
        ...headers
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(percentCompleted, progressEvent)
        }
      }
    })
  } catch (error) {
    throw error
  }
}

/**
 * Delete file from server
 * @param {string} fileId - File ID
 * @param {Object} options - Delete options
 * @returns {Promise<void>}
 */
export const deleteFile = async (fileId, options = {}) => {
  const {
    endpoint = '/files',
    confirmDelete = true
  } = options

  if (confirmDelete) {
    const confirmed = await showConfirm({
      title: 'Delete File',
      message: 'Are you sure you want to delete this file?',
      ok: { label: 'Delete', color: 'negative' }
    })

    if (!confirmed) return
  }

  try {
    await api.delete(`${endpoint}/${fileId}`)
    showSuccess('File deleted successfully')
  } catch (error) {
    showError('Failed to delete file')
    throw error
  }
}

/**
 * Generate unique upload ID
 * @returns {string} Upload ID
 */
export const generateUploadId = () => {
  return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Check if file is image
 * @param {File|string} file - File or MIME type
 * @returns {boolean}
 */
export const isImage = (file) => {
  const mimeType = typeof file === 'string' ? file : file.type
  return mimeType.startsWith('image/')
}

/**
 * Check if file is video
 * @param {File|string} file - File or MIME type
 * @returns {boolean}
 */
export const isVideo = (file) => {
  const mimeType = typeof file === 'string' ? file : file.type
  return mimeType.startsWith('video/')
}

/**
 * Check if file is audio
 * @param {File|string} file - File or MIME type
 * @returns {boolean}
 */
export const isAudio = (file) => {
  const mimeType = typeof file === 'string' ? file : file.type
  return mimeType.startsWith('audio/')
}

/**
 * Get file preview URL
 * @param {File|string} file - File or file URL
 * @returns {Promise<string>} Preview URL
 */
export const getFilePreviewUrl = async (file) => {
  if (typeof file === 'string') {
    return file // Already a URL
  }

  if (isImage(file)) {
    return await readFileAsDataURL(file)
  }

  // For other file types, return icon
  return null
}

/**
 * Compress image file
 * @param {File} file - Image file
 * @param {Object} options - Compression options
 * @returns {Promise<File>} Compressed file
 */
export const compressImage = async (file, options = {}) => {
  const {
    maxWidth = UPLOAD_CONFIG.imageMaxDimensions.width,
    maxHeight = UPLOAD_CONFIG.imageMaxDimensions.height,
    quality = 0.8,
    format = file.type
  } = options

  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    try {
      const dataUrl = await readFileAsDataURL(file)
      const img = new Image()

      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        // Calculate new dimensions
        let { width, height } = img

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width *= ratio
          height *= ratio
        }

        canvas.width = width
        canvas.height = height

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob], file.name, {
              type: format,
              lastModified: Date.now()
            })
            resolve(compressedFile)
          },
          format,
          quality
        )
      }

      img.onerror = reject
      img.src = dataUrl
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Gallery upload configuration
 */
export const GALLERY_UPLOAD_CONFIG = {
  ...UPLOAD_CONFIG,
  allowedGalleryTypes: [
    // Images
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    // Videos
    'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm',
    // Documents
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    // Audio
    'audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg'
  ],
  galleryThumbnailSizes: {
    small: { width: 150, height: 150 },
    medium: { width: 300, height: 300 },
    large: { width: 600, height: 600 }
  }
}

/**
 * Get gallery media type from MIME type
 * @param {string} mimeType - MIME type
 * @returns {string} Gallery media type
 */
export const getGalleryMediaType = (mimeType) => {
  if (mimeType.startsWith('image/')) return GALLERY_MEDIA_TYPES.IMAGE
  if (mimeType.startsWith('video/')) return GALLERY_MEDIA_TYPES.VIDEO
  if (mimeType.startsWith('audio/')) return GALLERY_MEDIA_TYPES.AUDIO
  return GALLERY_MEDIA_TYPES.DOCUMENT
}

/**
 * Validate file for gallery upload
 * @param {File} file - File to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export const validateGalleryFile = (file, options = {}) => {
  const {
    allowedTypes = GALLERY_UPLOAD_CONFIG.allowedGalleryTypes,
    maxSize = GALLERY_UPLOAD_CONFIG.maxFileSize,
    ...otherOptions
  } = options

  return validateFile(file, {
    allowedTypes,
    maxSize,
    ...otherOptions
  })
}

/**
 * Get gallery-specific file icon
 * @param {File|string} file - File object, MIME type, or gallery media type
 * @returns {string} Icon name
 */
export const getGalleryFileIcon = (file) => {
  let mediaType

  if (typeof file === 'string') {
    // If it's already a gallery media type
    if (Object.values(GALLERY_MEDIA_TYPES).includes(file)) {
      mediaType = file
    } else {
      // It's a MIME type
      mediaType = getGalleryMediaType(file)
    }
  } else {
    mediaType = getGalleryMediaType(file.type)
  }

  const iconMap = {
    [GALLERY_MEDIA_TYPES.IMAGE]: 'image',
    [GALLERY_MEDIA_TYPES.VIDEO]: 'videocam',
    [GALLERY_MEDIA_TYPES.AUDIO]: 'audiotrack',
    [GALLERY_MEDIA_TYPES.DOCUMENT]: 'description'
  }

  return iconMap[mediaType] || 'insert_drive_file'
}

/**
 * Get gallery category icon
 * @param {string} category - Gallery category
 * @returns {string} Icon name
 */
export const getGalleryCategoryIcon = (category) => {
  const iconMap = {
    [GALLERY_CATEGORIES.PROGRESS]: 'timeline',
    [GALLERY_CATEGORIES.ISSUE]: 'report_problem',
    [GALLERY_CATEGORIES.BEFORE]: 'history',
    [GALLERY_CATEGORIES.AFTER]: 'update',
    [GALLERY_CATEGORIES.BLUEPRINT]: 'architecture'
  }

  return iconMap[category] || 'folder'
}

/**
 * Get gallery category color
 * @param {string} category - Gallery category
 * @returns {string} Color name
 */
export const getGalleryCategoryColor = (category) => {
  const colorMap = {
    [GALLERY_CATEGORIES.PROGRESS]: 'primary',
    [GALLERY_CATEGORIES.ISSUE]: 'negative',
    [GALLERY_CATEGORIES.BEFORE]: 'info',
    [GALLERY_CATEGORIES.AFTER]: 'positive',
    [GALLERY_CATEGORIES.BLUEPRINT]: 'purple'
  }

  return colorMap[category] || 'grey'
}

/**
 * Create media thumbnail for gallery
 * @param {File} file - Media file
 * @param {Object} options - Thumbnail options
 * @returns {Promise<Blob>} Thumbnail blob
 */
export const createMediaThumbnail = async (file, options = {}) => {
  const {
    size = 'medium',
    ...thumbnailOptions
  } = options

  const dimensions = GALLERY_UPLOAD_CONFIG.galleryThumbnailSizes[size] ||
                    GALLERY_UPLOAD_CONFIG.galleryThumbnailSizes.medium

  if (isImage(file)) {
    return await createImageThumbnail(file, {
      ...dimensions,
      ...thumbnailOptions
    })
  } else if (isVideo(file)) {
    // For videos, we'll need to extract first frame
    return await extractVideoThumbnail(file, {
      ...dimensions,
      ...thumbnailOptions
    })
  }

  return null
}

/**
 * Extract thumbnail from video file
 * @param {File} file - Video file
 * @param {Object} options - Thumbnail options
 * @returns {Promise<Blob>} Video thumbnail
 */
export const extractVideoThumbnail = (file, options = {}) => {
  const {
    width = GALLERY_UPLOAD_CONFIG.galleryThumbnailSizes.medium.width,
    height = GALLERY_UPLOAD_CONFIG.galleryThumbnailSizes.medium.height,
    quality = 0.8,
    seekTime = 1 // Seek to 1 second
  } = options

  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    video.addEventListener('loadedmetadata', () => {
      video.currentTime = Math.min(seekTime, video.duration)
    })

    video.addEventListener('seeked', () => {
      canvas.width = width
      canvas.height = height

      // Calculate aspect ratio
      const aspectRatio = video.videoWidth / video.videoHeight
      let drawWidth = width
      let drawHeight = height

      if (aspectRatio > 1) {
        drawHeight = width / aspectRatio
      } else {
        drawWidth = height * aspectRatio
      }

      const offsetX = (width - drawWidth) / 2
      const offsetY = (height - drawHeight) / 2

      ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight)

      canvas.toBlob(resolve, 'image/jpeg', quality)
    })

    video.addEventListener('error', reject)

    video.src = URL.createObjectURL(file)
    video.load()
  })
}

/**
 * Get media preview URL for gallery
 * @param {Object} media - Media object from API
 * @returns {string} Preview URL
 */
export const getMediaPreviewUrl = (media) => {
  if (!media) return null

  // For images, use thumbnail if available, otherwise main file
  if (media.mediaType === GALLERY_MEDIA_TYPES.IMAGE) {
    return media.thumbnailUrl || media.fileUrl
  }

  // For videos, use thumbnail if available
  if (media.mediaType === GALLERY_MEDIA_TYPES.VIDEO) {
    return media.thumbnailUrl
  }

  // For other types, return null (will show icon instead)
  return null
}

/**
 * Get media display URL for gallery
 * @param {Object} media - Media object from API
 * @returns {string} Display URL
 */
export const getMediaDisplayUrl = (media) => {
  if (!media) return null
  return media.fileUrl
}

/**
 * Format gallery file info
 * @param {Object} media - Media object
 * @returns {Object} Formatted file info
 */
export const formatGalleryFileInfo = (media) => {
  if (!media) return {}

  return {
    name: media.originalFileName || media.fileName,
    size: formatFileSize(media.fileSize),
    type: media.mediaType,
    category: media.mediaCategory,
    mimeType: media.mimeType,
    uploadedDate: media.uploadedDate,
    uploader: media.uploadedByName,
    isPublic: media.isPublic,
    icon: getGalleryFileIcon(media.mediaType),
    categoryIcon: getGalleryCategoryIcon(media.mediaCategory),
    categoryColor: getGalleryCategoryColor(media.mediaCategory)
  }
}

/**
 * Check if media can be previewed
 * @param {Object} media - Media object
 * @returns {boolean} Can preview
 */
export const canPreviewMedia = (media) => {
  if (!media) return false

  const previewableTypes = [
    GALLERY_MEDIA_TYPES.IMAGE,
    GALLERY_MEDIA_TYPES.VIDEO
  ]

  return previewableTypes.includes(media.mediaType)
}

/**
 * Check if media can be played inline
 * @param {Object} media - Media object
 * @returns {boolean} Can play inline
 */
export const canPlayMediaInline = (media) => {
  if (!media) return false

  const playableTypes = [
    GALLERY_MEDIA_TYPES.VIDEO,
    GALLERY_MEDIA_TYPES.AUDIO
  ]

  return playableTypes.includes(media.mediaType)
}

/**
 * Generate gallery upload data
 * @param {Object} options - Upload options
 * @returns {Object} Upload request data
 */
export const generateGalleryUploadData = (options = {}) => {
  const {
    nodeId,
    category = GALLERY_CATEGORIES.PROGRESS,
    caption = '',
    isPublic = true,
    sortOrder = 0,
    metadata = {}
  } = options

  return {
    nodeId,
    mediaCategory: category,
    caption,
    isPublic,
    sortOrder,
    metadata
  }
}

/**
 * Validate gallery upload data
 * @param {Object} uploadData - Upload data to validate
 * @returns {Object} Validation result
 */
export const validateGalleryUploadData = (uploadData) => {
  const result = {
    valid: true,
    errors: []
  }

  if (!uploadData.nodeId) {
    result.valid = false
    result.errors.push('Node ID is required')
  }

  if (uploadData.mediaCategory && !Object.values(GALLERY_CATEGORIES).includes(uploadData.mediaCategory)) {
    result.valid = false
    result.errors.push('Invalid media category')
  }

  return result
}

/**
 * Create gallery file object for upload
 * @param {File} file - File to upload
 * @param {Object} uploadData - Upload data
 * @returns {Object} Gallery file object
 */
export const createGalleryFileObject = (file, uploadData) => {
  return {
    file,
    uploadData,
    id: generateUploadId(),
    name: file.name,
    size: file.size,
    type: getGalleryMediaType(file.type),
    icon: getGalleryFileIcon(file.type),
    progress: 0,
    status: 'pending', // pending, uploading, completed, error
    error: null,
    result: null
  }
}

/**
 * Sort gallery items
 * @param {Array} items - Gallery items
 * @param {Object} sortOptions - Sort options
 * @returns {Array} Sorted items
 */
export const sortGalleryItems = (items, sortOptions = {}) => {
  const {
    field = 'uploadedDate',
    direction = 'desc',
    groupByCategory = false
  } = sortOptions

  let sortedItems = [...items]

  // Group by category if requested
  if (groupByCategory) {
    const grouped = {}
    sortedItems.forEach(item => {
      const category = item.mediaCategory || 'Other'
      if (!grouped[category]) grouped[category] = []
      grouped[category].push(item)
    })

    // Sort within each group
    Object.keys(grouped).forEach(category => {
      grouped[category].sort((a, b) => {
        return sortItems(a, b, field, direction)
      })
    })

    // Flatten back to array
    sortedItems = Object.values(grouped).flat()
  } else {
    sortedItems.sort((a, b) => sortItems(a, b, field, direction))
  }

  return sortedItems
}

/**
 * Helper function for sorting items
 * @param {Object} a - First item
 * @param {Object} b - Second item
 * @param {string} field - Sort field
 * @param {string} direction - Sort direction
 * @returns {number} Sort result
 */
const sortItems = (a, b, field, direction) => {
  let result = 0

  switch (field) {
    case 'name':
      result = (a.originalFileName || a.fileName).localeCompare(b.originalFileName || b.fileName)
      break
    case 'size':
      result = a.fileSize - b.fileSize
      break
    case 'uploadedDate':
      result = new Date(a.uploadedDate) - new Date(b.uploadedDate)
      break
    case 'mediaType':
      result = a.mediaType.localeCompare(b.mediaType)
      break
    case 'sortOrder':
      result = (a.sortOrder || 0) - (b.sortOrder || 0)
      break
    default:
      result = 0
  }

  return direction === 'desc' ? -result : result
}

export const filterGalleryItems = (items, filters = {}) => {
  console.log('filterGalleryItems called with:', items.length, 'items and filters:', filters)

  const {
    mediaType,
    mediaCategory,
    isPublic,
    searchTerm,
    dateRange,
    uploader
  } = filters

  const result = items.filter(item => {
    console.log('Filtering item:', item.originalFileName, 'with filters:', {
      mediaType, mediaCategory, isPublic, searchTerm, dateRange, uploader
    })

    // Media type filter
    if (mediaType && item.mediaType !== mediaType) {
      console.log('Filtered out by mediaType - expected:', mediaType, 'got:', item.mediaType)
      return false
    }

    // Media category filter
    if (mediaCategory && item.mediaCategory !== mediaCategory) {
      console.log('Filtered out by mediaCategory - expected:', mediaCategory, 'got:', item.mediaCategory)
      return false
    }

    // Public/private filter
    if (isPublic !== null && isPublic !== undefined && item.isPublic !== isPublic) {
      console.log('Filtered out by isPublic - expected:', isPublic, 'got:', item.isPublic)
      return false
    }

    // Search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      const searchableText = [
        item.originalFileName,
        item.fileName,
        item.caption,
        item.uploadedByName
      ].filter(Boolean).join(' ').toLowerCase()

      console.log('Search term filter - term:', term, 'searchableText:', searchableText)

      if (!searchableText.includes(term)) {
        console.log('Filtered out by searchTerm - term not found in searchable text')
        return false
      }
    }

    // Date range filter
    if (dateRange && dateRange.start && dateRange.end) {
      const uploadDate = new Date(item.uploadedDate)
      const startDate = new Date(dateRange.start)
      const endDate = new Date(dateRange.end)

      console.log('Date range filter - uploadDate:', uploadDate, 'start:', startDate, 'end:', endDate)

      if (uploadDate < startDate || uploadDate > endDate) {
        console.log('Filtered out by dateRange - upload date outside range')
        return false
      }
    }

    // Uploader filter
    if (uploader && item.uploadedByName !== uploader) {
      console.log('Filtered out by uploader - expected:', uploader, 'got:', item.uploadedByName)
      return false
    }

    console.log('Item passed all filters:', item.originalFileName)
    return true
  })

  console.log('filterGalleryItems returning:', result.length, 'items out of', items.length, 'input items')
  return result
}

// Export all functions as default
export default {
  FILE_CATEGORIES,
  MIME_TYPES,
  UPLOAD_CONFIG,
  getFileExtension,
  getFileCategory,
  getFileIcon,
  getFileCategoryByName,
  formatFileSize,
  validateFile,
  readFileAsDataURL,
  readFileAsText,
  readFileAsArrayBuffer,
  createImageThumbnail,
  uploadFile,
  uploadMultipleFiles,
  uploadLargeFile,
  downloadFile,
  getPresignedUploadUrl,
  uploadToS3,
  deleteFile,
  generateUploadId,
  isImage,
  isVideo,
  isAudio,
  getFilePreviewUrl,
  compressImage,
  GALLERY_MEDIA_TYPES,
  GALLERY_CATEGORIES,
  GALLERY_UPLOAD_CONFIG,
  getGalleryMediaType,
  validateGalleryFile,
  getGalleryFileIcon,
  getGalleryCategoryIcon,
  getGalleryCategoryColor,
  createMediaThumbnail,
  extractVideoThumbnail,
  getMediaPreviewUrl,
  getMediaDisplayUrl,
  formatGalleryFileInfo,
  canPreviewMedia,
  canPlayMediaInline,
  generateGalleryUploadData,
  validateGalleryUploadData,
  createGalleryFileObject,
  sortGalleryItems,
  filterGalleryItems
}
