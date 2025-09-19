<template>
  <div class="gallery-tab">
    <!-- Gallery Actions Header -->
    <div class="gallery-actions">
      <div class="actions-left">
        <q-btn-group>
          <q-btn
            icon="add"
            label="Add Media"
            color="primary"
            @click="showMediaOptions = !showMediaOptions"
          >
            <q-menu v-model="showMediaOptions">
              <q-list style="min-width: 200px">
                <q-item clickable v-close-popup @click="triggerFileUpload">
                  <q-item-section avatar>
                    <q-icon name="upload_file" />
                  </q-item-section>
                  <q-item-section>Upload Files</q-item-section>
                </q-item>

                <q-separator />

                <!-- Camera Options (only on mobile) -->
                <template v-if="isNativePlatform">
                  <q-item clickable v-close-popup @click="captureFromCamera('rear')">
                    <q-item-section avatar>
                      <q-icon name="photo_camera" />
                    </q-item-section>
                    <q-item-section>Rear Camera</q-item-section>
                  </q-item>

                  <q-item clickable v-close-popup @click="captureFromCamera('front')">
                    <q-item-section avatar>
                      <q-icon name="camera_front" />
                    </q-item-section>
                    <q-item-section>Front Camera</q-item-section>
                  </q-item>

                  <!-- Video Recording Option -->
                  <q-item clickable v-close-popup @click="startVideoRecording">
                    <q-item-section avatar>
                      <q-icon name="videocam" />
                    </q-item-section>
                    <q-item-section>Record Video</q-item-section>
                  </q-item>

                  <q-separator />
                </template>

                <q-item clickable v-close-popup @click="captureFromGallery">
                  <q-item-section avatar>
                    <q-icon name="photo_library" />
                  </q-item-section>
                  <q-item-section>From Gallery</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </q-btn-group>

        <q-btn-group>
          <q-btn
            :icon="viewMode === 'grid' ? 'view_list' : 'view_module'"
            :label="viewMode === 'grid' ? 'List View' : 'Grid View'"
            flat
            @click="toggleViewMode"
          />
        </q-btn-group>
      </div>

      <div class="actions-right">
        <q-input
          v-model="searchTerm"
          placeholder="Search media..."
          dense
          outlined
          class="search-input"
        >
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
          <template v-slot:append v-if="searchTerm">
            <q-icon name="clear" class="cursor-pointer" @click="searchTerm = ''" />
          </template>
        </q-input>

        <q-btn-dropdown
          icon="filter_list"
          flat
          label="Filter"
        >
          <div class="q-pa-md" style="min-width: 200px">
            <div class="text-subtitle2 q-mb-sm">Media Type</div>
            <q-option-group
              v-model="selectedMediaTypes"
              :options="mediaTypeOptions"
              color="primary"
              type="checkbox"
            />

            <div class="text-subtitle2 q-mt-md q-mb-sm">Category</div>
            <q-option-group
              v-model="selectedCategories"
              :options="categoryOptions"
              color="primary"
              type="checkbox"
            />
          </div>
        </q-btn-dropdown>
      </div>
    </div>

    <!-- Gallery Content -->
    <div class="gallery-content">
      <!-- Loading State -->
      <div v-if="galleryStore.isLoading" class="loading-container">
        <q-spinner-dots size="40px" color="primary" />
        <p>Loading gallery...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredItems.length === 0" class="empty-state">
        <q-icon name="photo_library" size="64px" color="grey-5" />
        <h5>No media files</h5>
        <p>Upload photos, videos, or documents to get started</p>
        <q-btn
          color="primary"
          icon="add"
          label="Add Media"
          @click="showMediaOptions = true"
        />
      </div>

      <!-- Gallery Items -->
      <div v-else :class="viewMode === 'grid' ? 'gallery-grid' : 'gallery-list'">
        <GalleryItem
          v-for="item in filteredItems"
          :key="item.recCode"
          :item="item"
          :view-mode="viewMode"
          @click="handleItemClick(item)"
          @edit="handleItemEdit(item)"
          @delete="handleItemDelete(item)"
        />
      </div>
    </div>

    <!-- Hidden File Input -->
    <input
      ref="fileInput"
      type="file"
      multiple
      accept="*/*"
      style="display: none"
      @change="handleFileSelection"
    />

    <!-- Media Viewer Dialog -->
    <EnhancedMediaViewer
      v-if="showMediaViewer"
      v-model="showMediaViewer"
      :item="selectedViewItem"
      :items="filteredItems"
      :current-index="selectedViewIndex"
      @close="handleViewerClose"
      @navigate="handleViewerNavigate"
    />

    <!-- Edit Media Dialog -->
    <EditMediaDialog
      v-if="showEditDialog"
      v-model="showEditDialog"
      :item="selectedEditItem"
      @saved="handleItemUpdated"
      @close="handleEditClose"
    />

    <!-- Camera Capture Dialog -->
    <CameraCaptureDialog
      v-if="showCameraCaptureDialog"
      v-model="showCameraCaptureDialog"
      :image-data="capturedImageData"
      :node-id="nodeId"
      @saved="handleCameraCaptureSaved"
      @close="handleCameraCaptureClose"
    />

    <!-- Video Recording Dialog -->
    <q-dialog
      v-model="showVideoRecordingDialog"
      maximized
      persistent
      class="video-recording-dialog"
    >
      <VideoRecordingInterface
        v-model="showVideoRecordingDialog"
        @recording-complete="handleVideoRecordingComplete"
        @close="handleVideoRecordingClose"
      />
    </q-dialog>

    <!-- Video Upload Dialog -->
    <q-dialog
      v-model="showVideoUploadDialog"
      maximized
      class="video-upload-dialog"
    >
      <div class="video-upload-container">
        <div class="video-upload-header">
          <h5>Upload Video</h5>
          <q-btn icon="close" flat round dense color="white" v-close-popup />
        </div>

        <div class="video-upload-content">
          <div class="video-preview-section">
            <div class="video-preview-container">
              <video
  v-if="recordedVideoData"
  :src="recordedVideoData.videoUrl"
  class="preview-video"
  controls
  preload="metadata"
  @loadeddata="handleVideoLoaded"
>
  Your browser does not support the video tag.
</video>
              
              <!-- Video Info -->
              <div class="video-info">
                <div class="info-item">
                  <q-icon name="schedule" />
                  <span>Duration: {{ formatDuration(recordedVideoData?.duration || 0) }}</span>
                </div>
                <div class="info-item">
                  <q-icon name="flag" />
                  <span>Flags: {{ recordedVideoData?.metadata?.flags?.length || 0 }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="video-form-section">
            <q-form @submit="handleVideoUpload" class="video-form">
              <div class="form-group">
                <q-input
                  v-model="videoUploadForm.caption"
                  label="Caption"
                  outlined
                  rows="3"
                  type="textarea"
                  placeholder="Add a caption for this video..."
                />
              </div>

              <div class="form-group">
                <q-select
                  v-model="videoUploadForm.category"
                  :options="categoryOptions"
                  option-value="value"
                  option-label="label"
                  label="Category"
                  outlined
                  emit-value
                  map-options
                />
              </div>

              <div class="form-group">
                <div class="visibility-section">
                  <div class="text-subtitle2 q-mb-sm">Visibility</div>
                  <q-option-group
                    v-model="videoUploadForm.isPublic"
                    :options="visibilityOptions"
                    color="primary"
                    type="radio"
                  />
                </div>
              </div>

              <div class="form-actions">
                <q-btn
                  type="button"
                  flat
                  label="Cancel"
                  @click="handleVideoUploadCancel"
                />
                <q-btn
                  type="submit"
                  color="primary"
                  label="Upload Video"
                  :loading="isUploadingVideo"
                  :disable="!recordedVideoData"
                />
              </div>
            </q-form>
          </div>
        </div>
      </div>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useGalleryStore } from 'stores/gallery'
import { GALLERY_MEDIA_TYPES, GALLERY_CATEGORIES } from 'src/utils/file'
import { showError, showSuccess, showConfirm } from 'src/utils/notification'
import { Capacitor } from '@capacitor/core'
import { Camera, CameraResultType, CameraSource, CameraDirection } from '@capacitor/camera'
import GalleryItem from './GalleryItem.vue'
import EnhancedMediaViewer from './MediaViewer.vue'
import EditMediaDialog from './EditMediaDialog.vue'
import CameraCaptureDialog from './CameraCaptureDialog.vue'
import VideoRecordingInterface from './VideoRecordingInterface.vue'
import galleryService from 'src/services/api/gallery.service'

// Props
const props = defineProps({
  nodeId: {
    type: String,
    required: true
  }
})

// Store
const galleryStore = useGalleryStore()

// Refs
const fileInput = ref(null)
const viewMode = ref('grid')
const searchTerm = ref('')
const searchTimeout = ref(null)

// Dialog states
const showMediaOptions = ref(false)
const showMediaViewer = ref(false)
const showEditDialog = ref(false)
const showCameraCaptureDialog = ref(false)
const showVideoRecordingDialog = ref(false)
const showVideoUploadDialog = ref(false)

// Selected items
const selectedViewItem = ref(null)
const selectedViewIndex = ref(0)
const selectedEditItem = ref(null)
const capturedImageData = ref(null)
const recordedVideoData = ref(null)

// Upload states
const isUploadingVideo = ref(false)

// Platform detection
const isNativePlatform = computed(() => Capacitor.isNativePlatform())

// Filter options
const selectedMediaTypes = ref([])
const selectedCategories = ref([])

const mediaTypeOptions = ref([
  { label: 'Images', value: GALLERY_MEDIA_TYPES.IMAGE },
  { label: 'Videos', value: GALLERY_MEDIA_TYPES.VIDEO },
  { label: 'Documents', value: GALLERY_MEDIA_TYPES.DOCUMENT }
])

const categoryOptions = ref([
  { label: 'Progress', value: GALLERY_CATEGORIES.PROGRESS },
  { label: 'Issues', value: GALLERY_CATEGORIES.ISSUE },
  { label: 'Before', value: GALLERY_CATEGORIES.BEFORE },
  { label: 'After', value: GALLERY_CATEGORIES.AFTER }
])

const visibilityOptions = ref([
  { label: 'Public', value: true },
  { label: 'Private', value: false }
])

// Video upload form
const videoUploadForm = ref({
  caption: '',
  category: GALLERY_CATEGORIES.PROGRESS,
  isPublic: true
})

// Computed
const filteredItems = computed(() => {
  let items = galleryStore.galleryItems

  // Apply search filter
  if (searchTerm.value) {
    const search = searchTerm.value.toLowerCase()
    items = items.filter(item => 
      (item.originalFileName || item.fileName || '').toLowerCase().includes(search) ||
      (item.caption || '').toLowerCase().includes(search)
    )
  }

  // Apply media type filter
  if (selectedMediaTypes.value.length > 0) {
    items = items.filter(item => selectedMediaTypes.value.includes(item.mediaType))
  }

  // Apply category filter
  if (selectedCategories.value.length > 0) {
    items = items.filter(item => selectedCategories.value.includes(item.mediaCategory))
  }

  return items
})

// Methods
const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid'
}

const triggerFileUpload = () => {
  fileInput.value?.click()
}

const handleFileSelection = (event) => {
  const files = event.target.files
  if (files && files.length > 0) {
    uploadFiles(files)
  }
  event.target.value = ''
}

const uploadFiles = async (files) => {
  try {
    const uploadData = {
      nodeId: props.nodeId,
      mediaCategory: GALLERY_CATEGORIES.PROGRESS,
      isPublic: true
    }

    await galleryStore.uploadFiles(files, uploadData)
    showSuccess(`${files.length} file(s) uploaded successfully`)
  } catch (error) {
    console.error('Upload failed:', error)
    showError('Failed to upload files')
  }
}

// Camera methods
const captureFromCamera = async (direction) => {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
      direction: direction === 'front' ? CameraDirection.Front : CameraDirection.Rear,
      width: 1920,
      height: 1080
    })

    capturedImageData.value = {
      dataUrl: image.dataUrl,
      format: image.format || 'jpeg',
      source: 'camera',
      direction
    }

    showCameraCaptureDialog.value = true

  } catch (error) {
    if (error.message !== 'User cancelled photos app') {
      console.error('Camera capture error:', error)
      showError('Failed to capture photo from camera')
    }
  }
}

const captureFromGallery = async () => {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Photos
    })

    capturedImageData.value = {
      dataUrl: image.dataUrl,
      format: image.format || 'jpeg',
      source: 'gallery'
    }

    showCameraCaptureDialog.value = true

  } catch (error) {
    if (error.message !== 'User cancelled photos app') {
      console.error('Gallery selection error:', error)
      showError('Failed to select photo from gallery')
    }
  }
}

// Video recording methods
const startVideoRecording = () => {
  showVideoRecordingDialog.value = true
}

const handleVideoRecordingComplete = (videoData) => {
  recordedVideoData.value = {
    ...videoData,
    videoUrl: URL.createObjectURL(videoData.videoFile)  // This line should already be there
  }
  
  showVideoRecordingDialog.value = false
  showVideoUploadDialog.value = true
}


const handleVideoRecordingClose = () => {
  showVideoRecordingDialog.value = false
}

const handleVideoUpload = async () => {
  if (!recordedVideoData.value) return

  try {
    isUploadingVideo.value = true

    const uploadData = {
      nodeId: props.nodeId,
      mediaCategory: videoUploadForm.value.category,
      caption: videoUploadForm.value.caption,
      isPublic: videoUploadForm.value.isPublic,
      metadata: recordedVideoData.value.metadata // Make sure metadata is included
    }

    // Use the uploadMediaWithFlags method if available, otherwise fallback to regular upload
    let result
    if (galleryStore.uploadFiles) {
      // Use the store's upload method
      await galleryStore.uploadFiles([recordedVideoData.value.videoFile], uploadData)
      result = { success: true }
    } else {
      // Direct service call
      result = await galleryService.uploadMedia(recordedVideoData.value.videoFile, uploadData)
    }
    
    if (result.success !== false) {
      showSuccess('Video uploaded successfully')
      handleVideoUploadCancel()
      // Refresh gallery if store method available
      if (galleryStore.refreshGallery) {
        await galleryStore.refreshGallery()
      }
    } else {
      throw new Error(result.error || 'Upload failed')
    }
    
  } catch (error) {
    console.error('Video upload failed:', error)
    showError('Failed to upload video: ' + (error.message || 'Unknown error'))
  } finally {
    isUploadingVideo.value = false
  }
}

const handleVideoUploadCancel = () => {
  showVideoUploadDialog.value = false
  recordedVideoData.value = null
  videoUploadForm.value = {
    caption: '',
    category: GALLERY_CATEGORIES.PROGRESS,
    isPublic: true
  }
}

// Gallery item handlers
const handleItemClick = (item) => {
  selectedViewItem.value = item
  selectedViewIndex.value = filteredItems.value.findIndex(i => i.recCode === item.recCode)
  showMediaViewer.value = true
}

const handleItemEdit = (item) => {
  selectedEditItem.value = item
  showEditDialog.value = true
}

const handleItemDelete = async (item) => {
  const confirmed = await showConfirm(
    'Delete Media',
    `Are you sure you want to delete "${item.originalFileName || item.fileName}"?`
  )

  if (confirmed) {
    try {
      await galleryStore.deleteMedia(item.recCode)
      showSuccess('Media deleted successfully')
    } catch (error) {
      console.error('Delete failed:', error)
      showError('Failed to delete media')
    }
  }
}

// Dialog handlers
const handleViewerClose = () => {
  showMediaViewer.value = false
  selectedViewItem.value = null
}

const handleViewerNavigate = (index) => {
  selectedViewIndex.value = index
  selectedViewItem.value = filteredItems.value[index]
}

const handleEditClose = () => {
  showEditDialog.value = false
  selectedEditItem.value = null
}

const handleItemUpdated = async () => {
  showSuccess('Media updated successfully')
  await galleryStore.refreshGallery()
  handleEditClose()
}

const handleCameraCaptureSaved = async () => {
  showSuccess('Photo uploaded successfully')
  await galleryStore.refreshGallery()
  handleCameraCaptureClose()
}

const handleCameraCaptureClose = () => {
  showCameraCaptureDialog.value = false
  capturedImageData.value = null
}

// Utility functions
const formatDuration = (milliseconds) => {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

// Search debouncing
watch(searchTerm, () => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
  searchTimeout.value = setTimeout(() => {
    // Search is handled by computed property
  }, 300)
})

// Load gallery on mount
onMounted(async () => {
  try {
    galleryStore.setCurrentNode(props.nodeId)
    await galleryStore.loadGallery()
  } catch (error) {
    console.error('Failed to load gallery:', error)
    showError('Failed to load gallery')
  }
})

// Cleanup
onUnmounted(() => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
  
  if (recordedVideoData.value?.videoUrl) {
    URL.revokeObjectURL(recordedVideoData.value.videoUrl)
  }
})
</script>

<style lang="scss" scoped>
.gallery-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.gallery-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  background: white;
  flex-shrink: 0;

  .actions-left,
  .actions-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .search-input {
    min-width: 200px;
  }
}

.gallery-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #666;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  text-align: center;
  color: #666;

  h5 {
    margin: 16px 0 8px;
    font-weight: 500;
  }

  p {
    margin-bottom: 24px;
    opacity: 0.8;
  }
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.gallery-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

// Video Upload Dialog Styles
.video-upload-container {
  width: 100vw;
  height: 100vh;
  background: white;
  display: flex;
  flex-direction: column;
}

.video-upload-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;

  h5 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
  }
}

.video-upload-content {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 400px;
  overflow: hidden;
}

.video-preview-section {
  background: #f8f9fa;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  padding: 24px;
}

.video-preview-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 24px;
}

.preview-video {
  max-width: 100%;
  max-height: 400px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.video-info {
  display: flex;
  gap: 24px;
  color: #666;

  .info-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
  }
}

.video-form-section {
  padding: 24px;
  overflow-y: auto;
  background: white;
}

.video-form {
  max-width: 100%;
}

.form-group {
  margin-bottom: 24px;
}

.visibility-section {
  .text-subtitle2 {
    color: #666;
    font-weight: 500;
  }
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 24px;
  border-top: 1px solid #e0e0e0;
  margin-top: 24px;
}

// Mobile responsive
@media (max-width: 1024px) {
  .gallery-actions {
    flex-direction: column;
    gap: 12px;
    padding: 12px;

    .actions-left,
    .actions-right {
      width: 100%;
      justify-content: space-between;
    }

    .search-input {
      min-width: 150px;
    }
  }

  .video-upload-content {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }

  .video-preview-section {
    border-right: none;
    border-bottom: 1px solid #e0e0e0;
    padding: 16px;
  }

  .video-form-section {
    padding: 16px;
  }
}

@media (max-width: 768px) {
  .gallery-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
  }

  .gallery-content {
    padding: 12px;
  }

  .video-upload-header {
    padding: 16px;
  }
}
</style>