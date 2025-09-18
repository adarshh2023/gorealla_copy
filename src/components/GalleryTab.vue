<template>
  <div class="gallery-tab">
    <!-- Gallery Toolbar -->
    <div class="gallery-toolbar">
      <div class="toolbar-left">
        <!-- Camera Button (Mobile Only) -->
        <q-btn
          v-if="isNativePlatform"
          color="secondary"
          icon="photo_camera"
          label="Camera"
          size="sm"
          @click="openCameraOptions"
          class="q-mr-sm"
        />

        <!-- Upload Button -->
        <q-btn
          color="primary"
          icon="cloud_upload"
          size="sm"
          @click="triggerFileUpload"
          :loading="galleryStore.uploading"
        />

        <!-- Hidden File Input -->
        <input
          ref="fileInput"
          type="file"
          multiple
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
          style="display: none"
          @change="handleFileSelection"
        />

        <!-- View Mode Toggle -->
        <q-btn-toggle
          v-model="viewMode"
          toggle-color="primary"
          :options="[
            { icon: 'grid_view', value: 'grid', slot: 'grid' },
            { icon: 'view_list', value: 'list', slot: 'list' }
          ]"
          size="sm"
          class="q-ml-sm"
        />
      </div>

      <div class="toolbar-right">
        <!-- Search -->
        <q-input
          v-model="searchTerm"
          placeholder="Search files..."
          dense
          outlined
          style="min-width: 200px"
          @update:model-value="handleSearch"
        >
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
          <template v-slot:append>
            <q-icon
              v-if="searchTerm"
              name="clear"
              class="cursor-pointer"
              @click="clearSearch"
            />
          </template>
        </q-input>

        <!-- Filter Menu -->
        <q-btn
          icon="filter_list"
          flat
          round
          dense
          size="sm"
          class="q-ml-sm"
        >
          <q-menu>
            <q-list style="min-width: 200px">
              <!-- Media Type Filter -->
              <q-item-label header>Media Type</q-item-label>
              <q-item
                v-for="type in mediaTypeOptions"
                :key="type.value"
                clickable
                v-close-popup
                @click="setFilter('mediaType', type.value)"
              >
                <q-item-section avatar>
                  <q-icon :name="type.icon" />
                </q-item-section>
                <q-item-section>{{ type.label }}</q-item-section>
                <q-item-section side v-if="filters.mediaType === type.value">
                  <q-icon name="check" color="primary" />
                </q-item-section>
              </q-item>

              <q-separator />

              <!-- Category Filter -->
              <q-item-label header>Category</q-item-label>
              <q-item
                v-for="category in categoryOptions"
                :key="category.value"
                clickable
                v-close-popup
                @click="setFilter('mediaCategory', category.value)"
              >
                <q-item-section avatar>
                  <q-icon :name="category.icon" :color="category.color" />
                </q-item-section>
                <q-item-section>{{ category.label }}</q-item-section>
                <q-item-section side v-if="filters.mediaCategory === category.value">
                  <q-icon name="check" color="primary" />
                </q-item-section>
              </q-item>

              <q-separator />

              <!-- Clear Filters -->
              <q-item clickable v-close-popup @click="clearFilters">
                <q-item-section avatar>
                  <q-icon name="clear_all" />
                </q-item-section>
                <q-item-section>Clear Filters</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>

        <!-- More Options -->
        <q-btn
          icon="more_vert"
          flat
          round
          dense
          size="sm"
          class="q-ml-sm"
        >
          <q-menu>
            <q-list>
              <q-item clickable v-close-popup @click="refreshGallery">
                <q-item-section avatar>
                  <q-icon name="refresh" />
                </q-item-section>
                <q-item-section>Refresh</q-item-section>
              </q-item>

              <q-item clickable v-close-popup @click="selectAllVisible">
                <q-item-section avatar>
                  <q-icon name="select_all" />
                </q-item-section>
                <q-item-section>Select All</q-item-section>
              </q-item>

              <q-item clickable v-close-popup @click="clearSelection" :disable="!hasSelectedItems">
                <q-item-section avatar>
                  <q-icon name="deselect" />
                </q-item-section>
                <q-item-section>Clear Selection</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </div>
    </div>

    <!-- Selection Actions Bar -->
    <div v-if="hasSelectedItems" class="selection-bar">
      <div class="selection-info">
        <q-icon name="check_circle" color="primary" />
        <span class="q-ml-sm">{{ selectedItemsCount }} item(s) selected</span>
      </div>

      <div class="selection-actions">
        <q-btn
          icon="folder"
          label="Move to Category"
          size="sm"
          flat
          @click="showCategoryDialog = true"
        />

        <q-btn
          icon="visibility"
          label="Make Public"
          size="sm"
          flat
          @click="bulkUpdateVisibility(true)"
        />

        <q-btn
          icon="visibility_off"
          label="Make Private"
          size="sm"
          flat
          @click="bulkUpdateVisibility(false)"
        />

        <q-btn
          icon="delete"
          label="Delete"
          size="sm"
          flat
          color="negative"
          @click="confirmBulkDelete"
        />
      </div>
    </div>

    <!-- Upload Progress -->
    <div v-if="galleryStore.uploading" class="upload-progress">
      <q-linear-progress
        :value="uploadProgress.percentage / 100"
        color="primary"
        size="4px"
      />
      <div class="upload-status q-pa-sm">
        <span v-if="uploadProgress.currentFile">
          Uploading: {{ uploadProgress.currentFile }}
        </span>
        <span v-else>
          {{ uploadProgress.completed }}/{{ uploadProgress.total }} files uploaded
        </span>
      </div>
    </div>

    <!-- Camera Options Dialog -->
    <q-dialog v-model="showCameraOptions">
      <q-card style="min-width: 300px">
        <q-card-section>
          <div class="text-h6">Take Photo</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-list>
            <q-item clickable v-close-popup @click="captureFromCamera('rear')">
              <q-item-section avatar>
                <q-icon name="camera_rear" color="primary" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Back Camera</q-item-label>
                <q-item-label caption>Use rear camera</q-item-label>
              </q-item-section>
            </q-item>

            <q-item clickable v-close-popup @click="captureFromCamera('front')">
              <q-item-section avatar>
                <q-icon name="camera_front" color="primary" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Front Camera</q-item-label>
                <q-item-label caption>Use front camera</q-item-label>
              </q-item-section>
            </q-item>

            <q-separator />

            <q-item clickable v-close-popup @click="captureFromGallery">
              <q-item-section avatar>
                <q-icon name="photo_library" color="secondary" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Photo Library</q-item-label>
                <q-item-label caption>Choose from gallery</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Drag & Drop Zone -->
    <div
      class="gallery-content"
      :class="{ 'drag-over': isDragOver }"
      @dragover.prevent="handleDragOver"
      @dragenter.prevent="handleDragEnter"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
    >
      <!-- Loading State -->
      <div v-if="galleryStore.loading" class="loading-state">
        <q-spinner-dots size="48px" color="primary" />
        <p class="text-grey-6 q-mt-md">Loading gallery...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredItems.length === 0 && !searchTerm && !hasActiveFilters" class="empty-state">
        <q-icon name="photo_library" size="64px" color="grey-5" />
        <p class="text-h6 text-grey-6 q-mt-md">No files uploaded yet</p>
        <p class="text-grey-5">
          {{ isNativePlatform ? 'Take photos or upload files' : 'Drag and drop files here or click upload button' }}
        </p>
        <div class="empty-actions">
          <q-btn
            v-if="isNativePlatform"
            color="secondary"
            icon="photo_camera"
            label="Take Photo"
            class="q-mr-md q-mt-md"
            @click="openCameraOptions"
          />
          <q-btn
            color="primary"
            icon="cloud_upload"
            label="Upload Files"
            class="q-mt-md"
            @click="triggerFileUpload"
          />
        </div>
      </div>

      <!-- No Results State -->
      <div v-else-if="filteredItems.length === 0" class="empty-state">
        <q-icon name="search_off" size="64px" color="grey-5" />
        <p class="text-h6 text-grey-6 q-mt-md">No files found</p>
        <p class="text-grey-5">Try adjusting your search or filters</p>
        <q-btn
          flat
          label="Clear Filters"
          @click="clearAllFilters"
          class="q-mt-md"
        />
      </div>

      <!-- Gallery Grid/List -->
      <div v-else class="gallery-view" :class="`gallery-${viewMode}`">
        <!-- Grid View -->
        <template v-if="viewMode === 'grid'">
          <div
            v-for="item in filteredItems"
            :key="item.recCode"
            class="gallery-item-wrapper"
          >
            <GalleryItem
              :item="item"
              :selected="selectedItems.includes(item.recCode)"
              :view-mode="viewMode"
              @click="handleItemClick"
              @select="handleItemSelect"
              @view="handleItemView"
              @download="handleItemDownload"
              @delete="handleItemDelete"
              @edit="handleItemEdit"
            />
          </div>
        </template>

        <!-- List View -->
        <template v-else>
          <q-list separator>
            <GalleryItem
              v-for="item in filteredItems"
              :key="item.recCode"
              :item="item"
              :selected="selectedItems.includes(item.recCode)"
              :view-mode="viewMode"
              @click="handleItemClick"
              @select="handleItemSelect"
              @view="handleItemView"
              @download="handleItemDownload"
              @delete="handleItemDelete"
              @edit="handleItemEdit"
            />
          </q-list>
        </template>
      </div>

      <!-- Load More Button -->
      <div v-if="hasMoreItems" class="load-more-container q-pa-md text-center">
        <q-btn
          label="Load More"
          color="primary"
          flat
          icon="expand_more"
          @click="loadMore"
          :loading="galleryStore.loading"
        />
      </div>

      <!-- Drag Overlay -->
      <div v-if="isDragOver" class="drag-overlay">
        <div class="drag-content">
          <q-icon name="cloud_upload" size="64px" color="primary" />
          <p class="text-h6 text-primary q-mt-md">Drop files to upload</p>
        </div>
      </div>
    </div>

    <!-- Category Dialog -->
    <q-dialog v-model="showCategoryDialog">
      <q-card style="min-width: 300px">
        <q-card-section>
          <div class="text-h6">Move to Category</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-select
            v-model="selectedCategory"
            :options="categoryOptions"
            label="Select Category"
            emit-value
            map-options
            filled
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn flat label="Move" color="primary" @click="bulkUpdateCategory" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Media Viewer Dialog -->
    <MediaViewer
      v-if="showMediaViewer"
      v-model="showMediaViewer"
      :item="selectedViewItem"
      :items="filteredItems"
      @navigate="handleViewerNavigate"
      @close="handleViewerClose"
      @delete="handleItemDelete"
      @edit="handleItemEdit"
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
import MediaViewer from './MediaViewer.vue'
import EditMediaDialog from './EditMediaDialog.vue'
import CameraCaptureDialog from './CameraCaptureDialog.vue'

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
const isDragOver = ref(false)
const dragCounter = ref(0)

// Dialog states
const showCategoryDialog = ref(false)
const showMediaViewer = ref(false)
const showEditDialog = ref(false)
const showCameraOptions = ref(false)
const showCameraCaptureDialog = ref(false)
const selectedCategory = ref(null)
const selectedViewItem = ref(null)
const selectedEditItem = ref(null)
const capturedImageData = ref(null)

// Platform detection
const isNativePlatform = computed(() => Capacitor.isNativePlatform())

// Options
const mediaTypeOptions = [
  { label: 'All Types', value: null, icon: 'all_inclusive' },
  { label: 'Images', value: GALLERY_MEDIA_TYPES.IMAGE, icon: 'image' },
  { label: 'Videos', value: GALLERY_MEDIA_TYPES.VIDEO, icon: 'videocam' },
  { label: 'Documents', value: GALLERY_MEDIA_TYPES.DOCUMENT, icon: 'description' },
  { label: 'Audio', value: GALLERY_MEDIA_TYPES.AUDIO, icon: 'audiotrack' }
]

const categoryOptions = [
  { label: 'All Categories', value: null, icon: 'all_inclusive', color: 'grey' },
  { label: 'Progress', value: GALLERY_CATEGORIES.PROGRESS, icon: 'timeline', color: 'primary' },
  { label: 'Issues', value: GALLERY_CATEGORIES.ISSUE, icon: 'report_problem', color: 'negative' },
  { label: 'Before', value: GALLERY_CATEGORIES.BEFORE, icon: 'history', color: 'info' },
  { label: 'After', value: GALLERY_CATEGORIES.AFTER, icon: 'update', color: 'positive' },
  { label: 'Blueprint', value: GALLERY_CATEGORIES.BLUEPRINT, icon: 'architecture', color: 'purple' }
]

// Computed
const filteredItems = computed(() => galleryStore.filteredItems)
const selectedItems = computed(() => galleryStore.selectedItems)
const selectedItemsCount = computed(() => galleryStore.selectedItemsCount)
const hasSelectedItems = computed(() => galleryStore.hasSelectedItems)
const filters = computed(() => galleryStore.filters)
const uploadProgress = computed(() => galleryStore.uploadProgress)
const hasMoreItems = computed(() => galleryStore.pagination.hasNext)

const hasActiveFilters = computed(() => {
  return filters.value.mediaType ||
         filters.value.mediaCategory ||
         filters.value.searchTerm ||
         filters.value.isPublic !== null
})

// Camera methods
const openCameraOptions = () => {
  showCameraOptions.value = true
}

const captureFromCamera = async (direction = 'rear') => {
  try {
    const image = await Camera.getPhoto({
      quality: 80,
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

// eslint-disable-next-line no-unused-vars
const handleCameraCaptureSaved = async (uploadedItem) => {
  showSuccess('Photo uploaded successfully')
  await galleryStore.refreshGallery()
}

const handleCameraCaptureClose = () => {
  showCameraCaptureDialog.value = false
  capturedImageData.value = null
}

// Existing methods remain the same...
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
    showError('Failed to upload files')
    console.error('Upload error:', error)
  }
}

const handleSearch = (value) => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }

  searchTimeout.value = setTimeout(() => {
    galleryStore.setFilter('searchTerm', value)
  }, 300)
}

const clearSearch = () => {
  searchTerm.value = ''
  galleryStore.setFilter('searchTerm', '')
}

const setFilter = (key, value) => {
  galleryStore.setFilter(key, value)
}

const clearFilters = () => {
  galleryStore.clearFilters()
}

const clearAllFilters = () => {
  searchTerm.value = ''
  galleryStore.clearFilters()
}

const refreshGallery = async () => {
  await galleryStore.refreshGallery()
  showSuccess('Gallery refreshed')
}

const selectAllVisible = () => {
  galleryStore.selectAllItems()
}

const clearSelection = () => {
  galleryStore.clearSelection()
}

const loadMore = async () => {
  await galleryStore.loadNextPage()
}

// Item interactions
const handleItemClick = (item) => {
  galleryStore.toggleItemSelection(item.recCode)
}

const handleItemSelect = (item) => {
  galleryStore.toggleItemSelection(item.recCode)
}

const handleItemView = (item) => {
  selectedViewItem.value = item
  showMediaViewer.value = true
}

const handleItemDownload = async (item) => {
  try {
    await galleryStore.downloadItem(item)
    showSuccess('Download started')
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    showError('Failed to download file')
  }
}

const handleItemDelete = async (item) => {
  const confirmed = await showConfirm({
    title: 'Delete File',
    message: `Are you sure you want to delete "${item.originalFileName || item.fileName}"?`,
    ok: { label: 'Delete', color: 'negative' }
  })

  if (confirmed) {
    try {
      await galleryStore.removeGalleryItem(item.recCode)
      showSuccess('File deleted successfully')
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
      showError('Failed to delete file')
    }
  }
}

const handleItemEdit = (item) => {
  selectedEditItem.value = item
  showEditDialog.value = true
}

// eslint-disable-next-line no-unused-vars
const handleItemUpdated = (updatedItem) => {
  showSuccess('File updated successfully')
}

// Bulk operations
const bulkUpdateCategory = async () => {
  if (!selectedCategory.value) return

  try {
    await galleryStore.bulkUpdateCategory(selectedItems.value, selectedCategory.value)
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    showError('Failed to update category')
  }
}

const bulkUpdateVisibility = async (isPublic) => {
  try {
    await galleryStore.bulkUpdateVisibility(selectedItems.value, isPublic)
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    showError('Failed to update visibility')
  }
}

const confirmBulkDelete = async () => {
  const confirmed = await showConfirm({
    title: 'Delete Files',
    message: `Are you sure you want to delete ${selectedItemsCount.value} file(s)?`,
    ok: { label: 'Delete', color: 'negative' }
  })

  if (confirmed) {
    try {
      await galleryStore.bulkDelete([...selectedItems.value])
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
      showError('Failed to delete files')
    }
  }
}

// Drag and Drop
const handleDragOver = (e) => {
  e.dataTransfer.dropEffect = 'copy'
}

// eslint-disable-next-line no-unused-vars
const handleDragEnter = (e) => {
  dragCounter.value++
  isDragOver.value = true
}

// eslint-disable-next-line no-unused-vars
const handleDragLeave = (e) => {
  dragCounter.value--
  if (dragCounter.value <= 0) {
    isDragOver.value = false
    dragCounter.value = 0
  }
}

const handleDrop = (e) => {
  isDragOver.value = false
  dragCounter.value = 0

  const files = Array.from(e.dataTransfer.files)
  if (files.length > 0) {
    uploadFiles(files)
  }
}

// Media Viewer
const handleViewerNavigate = (direction) => {
  const currentIndex = filteredItems.value.findIndex(item => item.recCode === selectedViewItem.value.recCode)
  let newIndex

  if (direction === 'next') {
    newIndex = currentIndex + 1
    if (newIndex >= filteredItems.value.length) newIndex = 0
  } else {
    newIndex = currentIndex - 1
    if (newIndex < 0) newIndex = filteredItems.value.length - 1
  }

  selectedViewItem.value = filteredItems.value[newIndex]
}

const handleViewerClose = () => {
  showMediaViewer.value = false
  selectedViewItem.value = null
}

const handleEditClose = () => {
  showEditDialog.value = false
  selectedEditItem.value = null
}

// Lifecycle
onMounted(async () => {
  galleryStore.setCurrentNode(props.nodeId)
  await galleryStore.loadGallery()
  await galleryStore.loadGallerySummary()
})

onUnmounted(() => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
})

// Watch for node changes
watch(() => props.nodeId, async (newNodeId) => {
  if (newNodeId) {
    galleryStore.setCurrentNode(newNodeId)
    await galleryStore.loadGallery()
    await galleryStore.loadGallerySummary()
  }
})
</script>

<style lang="scss" scoped>
.gallery-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.gallery-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  background: white;
  flex-shrink: 0;

  .toolbar-left {
    display: flex;
    align-items: center;
  }

  .toolbar-right {
    display: flex;
    align-items: center;
  }
}

.selection-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(25, 118, 210, 0.1);
  border-bottom: 1px solid rgba(25, 118, 210, 0.2);
  flex-shrink: 0;

  .selection-info {
    display: flex;
    align-items: center;
    color: #1976d2;
    font-weight: 500;
  }

  .selection-actions {
    display: flex;
    gap: 8px;
  }
}

.upload-progress {
  background: white;
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0;

  .upload-status {
    font-size: 14px;
    color: #666;
    text-align: center;
  }
}

.gallery-content {
  flex: 1;
  overflow-y: auto;
  position: relative;
  transition: all 0.3s ease;

  &.drag-over {
    border: 2px dashed #1976d2;
    background: rgba(25, 118, 210, 0.05);
  }
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 48px 24px;

  .empty-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
  }
}

.gallery-view {
  padding: 16px;

  &.gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
  }

  &.gallery-list {
    .gallery-item-wrapper {
      margin-bottom: 1px;
    }
  }
}

.load-more-container {
  border-top: 1px solid #e0e0e0;
  background: white;
}

.drag-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;

  .drag-content {
    text-align: center;
    pointer-events: none;
  }
}

// Responsive
@media (max-width: 768px) {
  .gallery-toolbar {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;

    .toolbar-left,
    .toolbar-right {
      justify-content: center;
    }
  }

  .selection-bar {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;

    .selection-actions {
      justify-content: center;
    }
  }

  .gallery-view.gallery-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .gallery-view.gallery-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 8px;
  }

  .gallery-toolbar {
    padding: 12px;
  }

  .empty-actions {
    flex-direction: column;
    align-items: center;
  }
}
</style>
