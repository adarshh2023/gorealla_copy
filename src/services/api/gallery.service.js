// src/services/api/gallery.service.js - Enhanced version
import { api } from "boot/axios";
import { API_ENDPOINTS, PAGINATION } from "src/constants/api.constants";
import { validateGalleryFile } from "src/utils/file";
import { showError, showSuccess, showProgress } from "src/utils/notification";

class EnhancedGalleryService {
  /**
   * Upload single media file with flag metadata support
   * @param {File} file - File to upload
   * @param {Object} uploadData - Upload data
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} Upload result
   */
  async uploadMedia(file, uploadData, options = {}) {
    const { onProgress = null } = options;

    // Enhanced file validation for videos
    if (file.size === 0) {
      throw new Error("File is empty");
    }

    if (file.size > 100 * 1024 * 1024) {
      // 100MB limit
      throw new Error("File is too large (max 100MB)");
    }

    // Log file details for debugging
    console.log("Uploading file:", {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    });

    // Validate file
    const fileValidation = validateGalleryFile(file);
    if (!fileValidation.valid) {
      throw new Error(fileValidation.errors.join(", "));
    }

    // Create form data
    const formData = new FormData();
    formData.append("file", file);

    // Add upload data fields
    Object.entries(uploadData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(
          key,
          typeof value === "object" ? JSON.stringify(value) : value
        );
      }
    });

    const response = await api.post(API_ENDPOINTS.GALLERY.UPLOAD, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted, progressEvent);
        }
      },
    });

    return response;
  }

  /**
   * Upload media with flag metadata
   * @param {File} file - File to upload
   * @param {Object} uploadData - Upload data
   * @param {Array} flags - Flag data array
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} Upload result
   */
  async uploadMediaWithFlags(file, uploadData, flags = [], options = {}) {
    const metadata = {
      mediaType: file.type.startsWith("video/") ? "video" : "image",
      flags: flags,
      ...(uploadData.metadata || {}),
    };

    const enhancedUploadData = {
      ...uploadData,
      metadata: metadata,
    };

    return this.uploadMedia(file, enhancedUploadData, options);
  }

  /**
   * Prepare files for upload
   * @param {FileList|Array<File>} files - Files to prepare
   * @param {Object} uploadData - Upload data
   * @returns {Array<Object>} Prepared file objects
   */
  prepareFilesForUpload(files, uploadData) {
    return Array.from(files).map((file, index) => ({
      id: `upload_${Date.now()}_${index}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      file: file,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadData: uploadData,
      status: "pending",
      progress: 0,
      error: null,
      metadata: uploadData.metadata || {},
    }));
  }

  /**
   * Upload video with recording metadata and flags
   * @param {File} videoFile - Video file to upload
   * @param {Object} recordingData - Recording metadata
   * @param {Object} uploadData - Upload data
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} Upload result
   */
  async uploadVideoWithRecordingData(
    videoFile,
    recordingData,
    uploadData,
    options = {}
  ) {
    const { onProgress = null } = options;

    // Prepare comprehensive metadata
    const metadata = {
      mediaType: "video",
      duration: recordingData.duration,
      dimensions: recordingData.dimensions || { width: 1920, height: 1080 },
      flags: (recordingData.flags || []).map((flag) => ({
        id: flag.id,
        timestamp: flag.timestamp,
        coordinates: {
          x:
            typeof flag.coordinates.x === "number"
              ? flag.coordinates.x
              : parseFloat(flag.coordinates.x),
          y:
            typeof flag.coordinates.y === "number"
              ? flag.coordinates.y
              : parseFloat(flag.coordinates.y),
        },
        type: flag.type,
        dimensions: {
          width: flag.dimensions.width,
          height: flag.dimensions.height,
        },
      })),
      recordingInfo: {
        recordedAt: new Date().toISOString(),
        device: navigator.userAgent,
        platform: navigator.platform,
      },
      ...(uploadData.metadata || {}),
    };

    // Enhanced upload data
    const enhancedUploadData = {
      ...uploadData,
      mediaType: "Video",
      metadata: metadata,
    };

    return this.uploadMedia(videoFile, enhancedUploadData, { onProgress });
  }

  /**
   * Upload image with flag metadata
   * @param {File} imageFile - Image file to upload
   * @param {Array} flags - Image flags
   * @param {Object} uploadData - Upload data
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} Upload result
   */
  async uploadImageWithFlags(imageFile, flags = [], uploadData, options = {}) {
    const { onProgress = null } = options;

    // Get image dimensions
    const imageDimensions = await this.getImageDimensions(imageFile);

    // Prepare metadata
    const metadata = {
      mediaType: "image",
      dimensions: imageDimensions,
      flags: flags.map((flag) => ({
        id: flag.id,
        timestamp: null, // Images don't have timestamps
        coordinates: {
          x:
            typeof flag.coordinates.x === "number"
              ? flag.coordinates.x
              : parseFloat(flag.coordinates.x),
          y:
            typeof flag.coordinates.y === "number"
              ? flag.coordinates.y
              : parseFloat(flag.coordinates.y),
        },
        type: flag.type,
        dimensions: imageDimensions,
        notes_id: flag.notes_id || null,
      })),
      ...(uploadData.metadata || {}),
    };

    // Enhanced upload data
    const enhancedUploadData = {
      ...uploadData,
      mediaType: "Image",
      metadata: metadata,
    };

    return this.uploadMedia(imageFile, enhancedUploadData, { onProgress });
  }

  /**
   * Get image dimensions from file
   * @param {File} imageFile - Image file
   * @returns {Promise<Object>} Dimensions object
   */
  async getImageDimensions(imageFile) {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(imageFile);

      img.onload = () => {
        const dimensions = {
          width: img.naturalWidth,
          height: img.naturalHeight,
        };
        URL.revokeObjectURL(url);
        resolve(dimensions);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ width: 1920, height: 1080 });
      };

      img.src = url;
    });
  }

  /**
   * Update media metadata (including flags)
   * @param {string} mediaId - Media ID
   * @param {Object} metadata - New metadata
   * @returns {Promise<Object>} Updated media
   */
  async updateMediaMetadata(mediaId, metadata) {
    const response = await api.put(
      API_ENDPOINTS.GALLERY.METADATA(mediaId),
      metadata
    );
    return response;
  }

  /**
   * Add flag to existing media
   * @param {string} mediaId - Media ID
   * @param {Object} flagData - Flag data
   * @returns {Promise<Object>} Updated media
   */
  async addFlagToMedia(mediaId, flagData) {
    // Get current media metadata
    const currentMedia = await this.getMediaById(mediaId);
    const currentMetadata = currentMedia.data.metadata || {};
    const currentFlags = currentMetadata.flags || [];

    // Add new flag
    const newFlag = {
      id: flagData.id || this.generateFlagId(),
      timestamp: flagData.timestamp || null,
      coordinates: {
        x:
          typeof flagData.coordinates.x === "number"
            ? flagData.coordinates.x
            : parseFloat(flagData.coordinates.x),
        y:
          typeof flagData.coordinates.y === "number"
            ? flagData.coordinates.y
            : parseFloat(flagData.coordinates.y),
      },
      type: flagData.type,
      dimensions: flagData.dimensions,
      notes_id: flagData.notes_id || null,
    };

    const updatedFlags = [...currentFlags, newFlag];

    // Update metadata
    const updatedMetadata = {
      ...currentMetadata,
      flags: updatedFlags,
    };

    return await this.updateMediaMetadata(mediaId, updatedMetadata);
  }

  /**
   * Remove flag from media
   * @param {string} mediaId - Media ID
   * @param {string} flagId - Flag ID to remove
   * @returns {Promise<Object>} Updated media
   */
  async removeFlagFromMedia(mediaId, flagId) {
    // Get current media metadata
    const currentMedia = await this.getMediaById(mediaId);
    const currentMetadata = currentMedia.data.metadata || {};
    const currentFlags = currentMetadata.flags || [];

    // Remove flag
    const updatedFlags = currentFlags.filter((flag) => flag.id !== flagId);

    // Update metadata
    const updatedMetadata = {
      ...currentMetadata,
      flags: updatedFlags,
    };

    return await this.updateMediaMetadata(mediaId, updatedMetadata);
  }

  /**
   * Update flag in media
   * @param {string} mediaId - Media ID
   * @param {string} flagId - Flag ID to update
   * @param {Object} flagData - Updated flag data
   * @returns {Promise<Object>} Updated media
   */
  async updateFlagInMedia(mediaId, flagId, flagData) {
    // Get current media metadata
    const currentMedia = await this.getMediaById(mediaId);
    const currentMetadata = currentMedia.data.metadata || {};
    const currentFlags = currentMetadata.flags || [];

    // Update flag
    const updatedFlags = currentFlags.map((flag) => {
      if (flag.id === flagId) {
        return {
          ...flag,
          ...flagData,
          coordinates: {
            x:
              typeof flagData.coordinates?.x === "number"
                ? flagData.coordinates.x
                : parseFloat(flagData.coordinates?.x || flag.coordinates.x),
            y:
              typeof flagData.coordinates?.y === "number"
                ? flagData.coordinates.y
                : parseFloat(flagData.coordinates?.y || flag.coordinates.y),
          },
        };
      }
      return flag;
    });

    // Update metadata
    const updatedMetadata = {
      ...currentMetadata,
      flags: updatedFlags,
    };

    return await this.updateMediaMetadata(mediaId, updatedMetadata);
  }

  /**
   * Get media flags
   * @param {string} mediaId - Media ID
   * @returns {Promise<Array>} Array of flags
   */
  async getMediaFlags(mediaId) {
    const media = await this.getMediaById(mediaId);
    return media.data.metadata?.flags || [];
  }

  /**
   * Generate unique flag ID
   * @returns {string} Unique flag ID
   */
  generateFlagId() {
    return `flag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Upload media with progress tracking and flag support
   * @param {File} file - File to upload
   * @param {Object} uploadData - Upload data
   * @param {Object} options - Options
   * @returns {Promise<Object>} Upload result
   */
  async uploadWithProgressAndFlags(file, uploadData, options = {}) {
    const {
      showNotifications = true,
      showProgressDialog = true,
      flags = [],
      recordingData = null,
    } = options;

    let progressTracker = null;

    if (showProgressDialog) {
      progressTracker = showProgress({
        message: `Uploading ${file.name}...`,
        progress: 0,
      });
    }

    try {
      let result;

      // Choose upload method based on file type and data
      if (file.type.startsWith("video/") && recordingData) {
        result = await this.uploadVideoWithRecordingData(
          file,
          recordingData,
          uploadData,
          {
            onProgress: (percent) => {
              if (progressTracker) {
                progressTracker.update(
                  percent,
                  `Uploading ${file.name}... ${percent}%`
                );
              }
            },
          }
        );
      } else if (flags.length > 0) {
        result = await this.uploadMediaWithFlags(file, uploadData, flags, {
          onProgress: (percent) => {
            if (progressTracker) {
              progressTracker.update(
                percent,
                `Uploading ${file.name}... ${percent}%`
              );
            }
          },
        });
      } else {
        result = await this.uploadMedia(file, uploadData, {
          onProgress: (percent) => {
            if (progressTracker) {
              progressTracker.update(
                percent,
                `Uploading ${file.name}... ${percent}%`
              );
            }
          },
        });
      }

      if (progressTracker) {
        progressTracker.complete(`${file.name} uploaded successfully!`);
      }

      if (showNotifications) {
        const flagCount = flags.length || recordingData?.flags?.length || 0;
        const message =
          flagCount > 0
            ? `${file.name} uploaded with ${flagCount} flags`
            : `${file.name} uploaded successfully`;
        showSuccess(message);
      }

      return result;
    } catch (error) {
      if (progressTracker) {
        progressTracker.error(`Failed to upload ${file.name}`);
      }

      if (showNotifications) {
        showError(`Failed to upload ${file.name}: ${error.message}`);
      }

      throw error;
    }
  }

  // Include all existing methods from original gallery service
  /**
   * Upload multiple media files
   * @param {FileList|Array<File>} files - Files to upload
   * @param {Object} uploadData - Upload data
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} Upload results
   */
  async uploadMultipleMedia(files, uploadData, options = {}) {
    const { onTotalProgress = null } = options;

    const fileArray = Array.from(files);

    // Create progress tracker
    const progress = {
      total: fileArray.length,
      completed: 0,
      failed: 0,
      percentage: 0,
    };

    // Create form data
    const formData = new FormData();
    fileArray.forEach((file) => {
      formData.append("files", file);
    });

    // Add upload data fields
    Object.entries(uploadData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(
          key,
          typeof value === "object" ? JSON.stringify(value) : value
        );
      }
    });

    const response = await api.post(
      API_ENDPOINTS.GALLERY.UPLOAD_MULTIPLE,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (onTotalProgress) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            progress.percentage = percentCompleted;
            onTotalProgress(progress);
          }
        },
      }
    );

    return response;
  }

  /**
   * Get media by ID
   * @param {string} mediaId - Media ID
   * @returns {Promise<Object>} Media data
   */
  async getMediaById(mediaId) {
    const response = await api.get(API_ENDPOINTS.GALLERY.BY_ID(mediaId));
    return response;
  }

  /**
   * Update media details
   * @param {string} mediaId - Media ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated media
   */
  async updateMediaDetails(mediaId, updateData) {
    const response = await api.put(
      API_ENDPOINTS.GALLERY.BY_ID(mediaId),
      updateData
    );
    return response;
  }

  /**
   * Delete media
   * @param {string} mediaId - Media ID
   * @returns {Promise<void>}
   */
  async deleteMedia(mediaId) {
    await api.delete(API_ENDPOINTS.GALLERY.BY_ID(mediaId));
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
      sort: `${params.sort || "sortOrder"},${params.direction || "ASC"}`,
    };

    const response = await api.get(API_ENDPOINTS.GALLERY.NODE_GALLERY(nodeId), {
      params: queryParams,
    });
    return response;
  }

  /**
   * Get gallery summary for a node
   * @param {string} nodeId - Node ID
   * @returns {Promise<Object>} Gallery summary
   */
  async getGallerySummary(nodeId) {
    const response = await api.get(API_ENDPOINTS.GALLERY.NODE_SUMMARY(nodeId));
    return response;
  }

  /**
   * Download media file
   * @param {string} mediaId - Media ID
   * @param {string} filename - Download filename
   * @returns {Promise<void>}
   */
  async downloadMedia(mediaId, filename) {
    const response = await api.get(API_ENDPOINTS.GALLERY.DOWNLOAD(mediaId), {
      responseType: "blob",
    });

    // Create download link
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    window.URL.revokeObjectURL(downloadUrl);
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      available: true,
      flagsSupported: true,
      videoRecordingSupported: true,
      metadataSupported: true,
    };
  }
}

export default new EnhancedGalleryService();
