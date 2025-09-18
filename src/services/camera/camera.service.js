// src/services/camera/camera.service.js
import { Capacitor } from '@capacitor/core'
import { Camera, CameraResultType, CameraSource, CameraDirection } from '@capacitor/camera'
import { showError } from 'src/utils/notification'

class CameraService {
  constructor() {
    this.isAvailable = false
    this.permissionsGranted = false
  }

  /**
   * Initialize camera service
   */
  async initialize() {
    try {
      this.isAvailable = Capacitor.isNativePlatform()

      if (this.isAvailable) {
        await this.checkPermissions()
      }

      return this.isAvailable
    } catch (error) {
      console.error('Camera service initialization failed:', error)
      return false
    }
  }

  /**
   * Check camera permissions
   */
  async checkPermissions() {
    try {
      if (!this.isAvailable) return false

      // Capacitor Camera plugin handles permissions automatically
      // but we can check if the device supports camera
      this.permissionsGranted = true
      return true
    } catch (error) {
      console.error('Permission check failed:', error)
      return false
    }
  }

  /**
   * Request camera permissions
   */
  async requestPermissions() {
    try {
      if (!this.isAvailable) return false

      // Capacitor Camera handles permission requests automatically
      // when getPhoto is called for the first time
      this.permissionsGranted = true
      return true
    } catch (error) {
      console.error('Permission request failed:', error)
      return false
    }
  }

  /**
   * Capture photo from camera
   */
  async capturePhoto(options = {}) {
    try {
      if (!this.isAvailable) {
        throw new Error('Camera not available on this platform')
      }

      const {
        source = CameraSource.Camera,
        direction = CameraDirection.Rear,
        quality = 80,
        width = 1920,
        height = 1080,
        allowEditing = false,
        resultType = CameraResultType.DataUrl
      } = options

      const image = await Camera.getPhoto({
        quality,
        allowEditing,
        resultType,
        source,
        direction,
        width,
        height,
        // Additional optimizations
        correctOrientation: true,
        saveToGallery: false
      })

      return {
        success: true,
        data: {
          dataUrl: image.dataUrl,
          webPath: image.webPath,
          format: image.format || 'jpeg',
          source: this.getSourceName(source),
          direction: this.getDirectionName(direction),
          quality,
          dimensions: { width, height }
        }
      }
    } catch (error) {
      console.error('Camera capture failed:', error)

      // Handle user cancellation gracefully
      if (error.message?.includes('cancelled') || error.message?.includes('canceled')) {
        return {
          success: false,
          cancelled: true,
          error: 'User cancelled'
        }
      }

      return {
        success: false,
        cancelled: false,
        error: error.message || 'Camera capture failed'
      }
    }
  }

  /**
   * Capture photo from rear camera
   */
  async captureFromRearCamera(options = {}) {
    return await this.capturePhoto({
      ...options,
      source: CameraSource.Camera,
      direction: CameraDirection.Rear
    })
  }

  /**
   * Capture photo from front camera
   */
  async captureFromFrontCamera(options = {}) {
    return await this.capturePhoto({
      ...options,
      source: CameraSource.Camera,
      direction: CameraDirection.Front
    })
  }

  /**
   * Select photo from gallery/photos app
   */
  async selectFromGallery(options = {}) {
    return await this.capturePhoto({
      ...options,
      source: CameraSource.Photos,
      quality: 90 // Higher quality for gallery photos
    })
  }

  /**
   * Capture with progress tracking
   */
  async captureWithProgress(options = {}, progressCallback = null) {
    try {
      if (progressCallback) {
        progressCallback({ status: 'initializing', message: 'Preparing camera...' })
      }

      const result = await this.capturePhoto(options)

      if (progressCallback) {
        if (result.success) {
          progressCallback({ status: 'completed', message: 'Photo captured successfully' })
        } else {
          progressCallback({ status: 'error', message: result.error })
        }
      }

      return result
    } catch (error) {
      if (progressCallback) {
        progressCallback({ status: 'error', message: error.message })
      }
      throw error
    }
  }

  /**
   * Optimize captured image
   */
  async optimizeImage(dataUrl, options = {}) {
    try {
      const {
        quality = 80,
        maxWidth = 1920,
        maxHeight = 1080,
        format = 'jpeg'
      } = options

      return new Promise((resolve) => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()

        img.onload = () => {
          // Calculate new dimensions
          let { width, height } = img

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height)
            width *= ratio
            height *= ratio
          }

          // Set canvas size
          canvas.width = width
          canvas.height = height

          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height)

          const optimizedDataUrl = canvas.toDataURL(`image/${format}`, quality / 100)

          resolve({
            dataUrl: optimizedDataUrl,
            originalSize: { width: img.width, height: img.height },
            optimizedSize: { width, height },
            compressionRatio: quality / 100
          })
        }

        img.src = dataUrl
      })
    } catch (error) {
      console.error('Image optimization failed:', error)
      throw error
    }
  }

  /**
   * Convert data URL to File object
   */
  async dataUrlToFile(dataUrl, filename, mimeType = 'image/jpeg') {
    try {
      const response = await fetch(dataUrl)
      const blob = await response.blob()
      return new File([blob], filename, { type: mimeType })
    } catch (error) {
      console.error('Data URL to File conversion failed:', error)
      throw error
    }
  }

  /**
   * Get estimated file size from data URL
   */
  getEstimatedFileSize(dataUrl) {
    try {
      // Remove data URL header
      const base64 = dataUrl.split(',')[1]
      // Estimate size (base64 is ~33% larger than binary)
      const sizeInBytes = (base64.length * 3) / 4
      return {
        bytes: Math.round(sizeInBytes),
        kb: Math.round(sizeInBytes / 1024),
        mb: Math.round((sizeInBytes / 1024 / 1024) * 100) / 100
      }
    } catch (error) {
      console.error('File size estimation failed:', error)
      return { bytes: 0, kb: 0, mb: 0 }
    }
  }

  /**
   * Validate camera capabilities
   */
  async validateCapabilities() {
    try {
      if (!this.isAvailable) {
        return {
          available: false,
          camera: false,
          gallery: false,
          error: 'Camera not available on web platform'
        }
      }

      return {
        available: true,
        camera: true,
        gallery: true,
        frontCamera: true,
        rearCamera: true
      }
    } catch (error) {
      console.error('Capability validation failed:', error)
      return {
        available: false,
        error: error.message
      }
    }
  }

  /**
   * Handle camera errors gracefully
   */
  handleCameraError(error, context = 'camera operation') {
    console.error(`Camera error in ${context}:`, error)

    // Check for common error types
    if (error.message?.includes('permission')) {
      showError('Camera permission denied. Please enable camera access in settings.')
      return 'permission_denied'
    } else if (error.message?.includes('cancelled') || error.message?.includes('canceled')) {
      // User cancelled - don't show error
      return 'user_cancelled'
    } else if (error.message?.includes('not available')) {
      showError('Camera is not available on this device.')
      return 'not_available'
    } else {
      showError(`${context} failed. Please try again.`)
      return 'unknown_error'
    }
  }

  // Utility methods
  getSourceName(source) {
    switch (source) {
      case CameraSource.Camera:
        return 'camera'
      case CameraSource.Photos:
        return 'gallery'
      default:
        return 'unknown'
    }
  }

  getDirectionName(direction) {
    switch (direction) {
      case CameraDirection.Front:
        return 'front'
      case CameraDirection.Rear:
        return 'rear'
      default:
        return 'rear'
    }
  }

  /**
   * Generate filename with timestamp
   */
  generateFilename(prefix = 'photo', extension = 'jpg') {
    const timestamp = new Date().toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .split('.')[0]
    return `${prefix}_${timestamp}.${extension}`
  }

  /**
   * Get default photo settings for different categories
   */
  getDefaultSettings(category) {
    const baseSettings = {
      quality: 80,
      width: 1920,
      height: 1080,
      correctOrientation: true,
      saveToGallery: false
    }

    switch (category) {
      case 'progress':
        return {
          ...baseSettings,
          quality: 85,
          description: 'Construction progress documentation'
        }
      case 'issue':
        return {
          ...baseSettings,
          quality: 90, // Higher quality for issue documentation
          description: 'Issue or defect documentation'
        }
      case 'blueprint':
        return {
          ...baseSettings,
          quality: 95, // Highest quality for technical documents
          width: 2560,
          height: 1440,
          description: 'Technical drawing or blueprint'
        }
      case 'before':
        return {
          ...baseSettings,
          description: 'Before work baseline photo'
        }
      case 'after':
        return {
          ...baseSettings,
          description: 'After work completion photo'
        }
      default:
        return baseSettings
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      available: this.isAvailable,
      platform: Capacitor.getPlatform(),
      permissions: this.permissionsGranted,
      isNative: Capacitor.isNativePlatform()
    }
  }
}

export default new CameraService()
