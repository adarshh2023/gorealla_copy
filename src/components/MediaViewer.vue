<template>
  <q-dialog
    v-model="isOpen"
    maximized
    persistent
    transition-show="fade"
    transition-hide="fade"
    class="media-viewer-dialog"
  >
    <div class="media-viewer-container" @keydown="handleKeydown">
      <!-- Header Bar -->
      <div class="viewer-header">
        <div class="header-left">
          <q-btn
            icon="arrow_back"
            flat
            round
            color="white"
            @click="handleClose"
          >
            <q-tooltip>Close (Esc)</q-tooltip>
          </q-btn>

          <div class="file-info">
            <div class="file-name">{{ item.originalFileName || item.fileName }}</div>
            <div class="file-details">
              {{ formatFileSize(item.fileSize) }} • {{ item.mediaType }}
              <span v-if="item.mediaCategory"> • {{ item.mediaCategory }}</span>
            </div>
          </div>
        </div>

        <div class="header-center">
          <div class="navigation-info" v-if="items.length > 1">
            {{ currentIndex + 1 }} of {{ items.length }}
          </div>
        </div>

        <div class="header-right">
          <!-- Slideshow Toggle -->
          <q-btn
            v-if="canStartSlideshow"
            :icon="isSlideshow ? 'pause' : 'slideshow'"
            flat
            round
            color="white"
            @click="toggleSlideshow"
          >
            <q-tooltip>{{ isSlideshow ? 'Pause Slideshow' : 'Start Slideshow' }}</q-tooltip>
          </q-btn>

          <!-- Zoom Controls (for images) -->
          <template v-if="item.mediaType === 'Image'">
            <q-btn
              icon="zoom_out"
              flat
              round
              color="white"
              @click="zoomOut"
              :disable="zoomLevel <= 0.5"
            >
              <q-tooltip>Zoom Out (-)</q-tooltip>
            </q-btn>

            <q-btn
              icon="zoom_in"
              flat
              round
              color="white"
              @click="zoomIn"
              :disable="zoomLevel >= 3"
            >
              <q-tooltip>Zoom In (+)</q-tooltip>
            </q-btn>

            <q-btn
              icon="fit_screen"
              flat
              round
              color="white"
              @click="resetZoom"
            >
              <q-tooltip>Fit to Screen (0)</q-tooltip>
            </q-btn>
          </template>

          <!-- Download -->
          <q-btn
            icon="download"
            flat
            round
            color="white"
            @click="handleDownload"
          >
            <q-tooltip>Download</q-tooltip>
          </q-btn>

          <!-- Edit -->
          <q-btn
            icon="edit"
            flat
            round
            color="white"
            @click="handleEdit"
          >
            <q-tooltip>Edit</q-tooltip>
          </q-btn>

          <!-- More Options -->
          <q-btn
            icon="more_vert"
            flat
            round
            color="white"
          >
            <q-menu>
              <q-list>
                <q-item clickable v-close-popup @click="copyFileUrl">
                  <q-item-section avatar>
                    <q-icon name="link" />
                  </q-item-section>
                  <q-item-section>Copy Link</q-item-section>
                </q-item>

                <q-item clickable v-close-popup @click="openInNewTab">
                  <q-item-section avatar>
                    <q-icon name="open_in_new" />
                  </q-item-section>
                  <q-item-section>Open in New Tab</q-item-section>
                </q-item>

                <q-separator />

                <q-item clickable v-close-popup @click="handleDelete">
                  <q-item-section avatar>
                    <q-icon name="delete" color="negative" />
                  </q-item-section>
                  <q-item-section>Delete</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </div>

      <!-- Main Content Area -->
      <div class="viewer-content" @click="handleContentClick">
        <!-- Navigation Arrows -->
        <div
          v-if="items.length > 1"
          class="nav-arrow nav-arrow-left"
          @click.stop="navigatePrevious"
        >
          <q-btn
            icon="chevron_left"
            flat
            round
            size="lg"
            color="white"
          >
            <q-tooltip>Previous (←)</q-tooltip>
          </q-btn>
        </div>

        <div
          v-if="items.length > 1"
          class="nav-arrow nav-arrow-right"
          @click.stop="navigateNext"
        >
          <q-btn
            icon="chevron_right"
            flat
            round
            size="lg"
            color="white"
          >
            <q-tooltip>Next (→)</q-tooltip>
          </q-btn>
        </div>

        <!-- Media Display -->
        <div class="media-container">
          <!-- Image Viewer -->
          <div
            v-if="item.mediaType === 'Image'"
            class="image-viewer"
            ref="imageContainer"
            @wheel.prevent="handleWheel"
            @mousedown="handleMouseDown"
            @mousemove="handleMouseMove"
            @mouseup="handleMouseUp"
            @mouseleave="handleMouseUp"
          >
            <img
              ref="imageElement"
              :src="item.fileUrl"
              :alt="item.originalFileName || item.fileName"
              class="viewer-image"
              :style="imageStyles"
              @load="handleImageLoad"
              @error="handleImageError"
              draggable="false"
            />
          </div>

          <!-- Video Player -->
          <div v-else-if="item.mediaType === 'Video'" class="video-viewer">
            <video
              ref="videoElement"
              :src="item.fileUrl"
              class="viewer-video"
              controls
              preload="metadata"
              @loadedmetadata="handleVideoLoad"
              @error="handleVideoError"
            >
              Your browser does not support the video tag.
            </video>
          </div>

          <!-- Audio Player -->
          <div v-else-if="item.mediaType === 'Audio'" class="audio-viewer">
            <div class="audio-container">
              <div class="audio-info">
                <q-icon name="audiotrack" size="64px" color="white" />
                <div class="audio-title">{{ item.originalFileName || item.fileName }}</div>
                <div class="audio-details">
                  {{ formatFileSize(item.fileSize) }}
                  <span v-if="audioDuration"> • {{ formatDuration(audioDuration) }}</span>
                </div>
              </div>

              <audio
                ref="audioElement"
                :src="item.fileUrl"
                class="viewer-audio"
                controls
                preload="metadata"
                @loadedmetadata="handleAudioLoad"
                @error="handleAudioError"
              >
                Your browser does not support the audio tag.
              </audio>
            </div>
          </div>

          <!-- Document Viewer -->
          <div v-else class="document-viewer">
            <div class="document-container">
              <div class="document-info">
                <q-icon :name="getFileIcon()" size="64px" color="white" />
                <div class="document-title">{{ item.originalFileName || item.fileName }}</div>
                <div class="document-details">
                  {{ formatFileSize(item.fileSize) }} • {{ getFileExtension() }}
                </div>
              </div>

              <div class="document-actions">
                <q-btn
                  color="primary"
                  icon="download"
                  label="Download"
                  @click="handleDownload"
                  class="q-mb-md"
                />

                <q-btn
                  color="secondary"
                  icon="open_in_new"
                  label="Open in New Tab"
                  @click="openInNewTab"
                />
              </div>

              <!-- PDF Preview (if supported) -->
              <div v-if="isPdf" class="pdf-preview">
                <iframe
                  :src="item.fileUrl"
                  class="pdf-frame"
                  @error="handlePdfError"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Loading Overlay -->
        <div v-if="isLoading" class="loading-overlay">
          <q-spinner-dots size="48px" color="white" />
          <div class="loading-text">Loading...</div>
        </div>

        <!-- Error Overlay -->
        <div v-if="hasError" class="error-overlay">
          <q-icon name="error_outline" size="64px" color="negative" />
          <div class="error-text">Failed to load media</div>
          <q-btn
            label="Download Instead"
            color="primary"
            @click="handleDownload"
            class="q-mt-md"
          />
        </div>
      </div>

      <!-- Bottom Info Panel (optional) -->
      <div v-if="showInfo" class="viewer-info">
        <div class="info-content">
          <div v-if="item.caption" class="caption">
            {{ item.caption }}
          </div>

          <div class="metadata">
            <div class="metadata-item">
              <span class="label">Uploaded:</span>
              <span>{{ formatDate(item.uploadedDate) }}</span>
            </div>
            <div class="metadata-item" v-if="item.uploadedByName">
              <span class="label">By:</span>
              <span>{{ item.uploadedByName }}</span>
            </div>
            <div class="metadata-item" v-if="imageDimensions">
              <span class="label">Dimensions:</span>
              <span>{{ imageDimensions }}</span>
            </div>
            <div class="metadata-item" v-if="item.isPublic !== undefined">
              <span class="label">Visibility:</span>
              <q-chip
                :icon="item.isPublic ? 'public' : 'lock'"
                :color="item.isPublic ? 'positive' : 'warning'"
                text-color="white"
                size="sm"
              >
                {{ item.isPublic ? 'Public' : 'Private' }}
              </q-chip>
            </div>
          </div>
        </div>

        <q-btn
          icon="info"
          flat
          round
          color="white"
          @click="showInfo = false"
        >
          <q-tooltip>Hide Info</q-tooltip>
        </q-btn>
      </div>

      <!-- Show Info Button -->
      <q-btn
        v-if="!showInfo"
        icon="info_outline"
        flat
        round
        color="white"
        class="info-toggle"
        @click="showInfo = true"
      >
        <q-tooltip>Show Info</q-tooltip>
      </q-btn>

      <!-- Slideshow Timer -->
      <div v-if="isSlideshow" class="slideshow-timer">
        <q-linear-progress
          :value="slideshowProgress"
          color="primary"
          size="4px"
        />
      </div>
    </div>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { formatFileSize, getGalleryFileIcon } from 'src/utils/file'
import { showError, showSuccess } from 'src/utils/notification'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  item: {
    type: Object,
    required: true
  },
  items: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits([
  'update:modelValue',
  'navigate',
  'close',
  'download',
  'edit',
  'delete'
])

// Refs
const imageContainer = ref(null)
const imageElement = ref(null)
const videoElement = ref(null)
const audioElement = ref(null)

// State
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isLoading = ref(false)
const hasError = ref(false)
const showInfo = ref(false)

// Image viewer state
const zoomLevel = ref(1)
const imagePosition = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const imageDimensions = ref('')

// Media state
const audioDuration = ref(0)

// Slideshow state
const isSlideshow = ref(false)
const slideshowTimer = ref(null)
const slideshowInterval = ref(3000) // 3 seconds
const slideshowProgress = ref(0)
const slideshowProgressTimer = ref(null)

// Computed
const currentIndex = computed(() => {
  return props.items.findIndex(item => item.recCode === props.item.recCode)
})

const canStartSlideshow = computed(() => {
  return props.items.length > 1 &&
         props.items.some(item => item.mediaType === 'Image')
})

const isPdf = computed(() => {
  return props.item.mimeType === 'application/pdf'
})

const imageStyles = computed(() => ({
  transform: `translate(${imagePosition.value.x}px, ${imagePosition.value.y}px) scale(${zoomLevel.value})`,
  transformOrigin: 'center center',
  transition: isDragging.value ? 'none' : 'transform 0.3s ease',
  cursor: isDragging.value ? 'grabbing' : (zoomLevel.value > 1 ? 'grab' : 'default')
}))

// Methods
const handleClose = () => {
  stopSlideshow()
  emit('close')
}

const handleKeydown = (event) => {
  switch (event.key) {
    case 'Escape':
      handleClose()
      break
    case 'ArrowLeft':
      navigatePrevious()
      break
    case 'ArrowRight':
      navigateNext()
      break
    case ' ':
      event.preventDefault()
      if (canStartSlideshow.value) {
        toggleSlideshow()
      }
      break
    case '+':
    case '=':
      if (props.item.mediaType === 'Image') {
        zoomIn()
      }
      break
    case '-':
      if (props.item.mediaType === 'Image') {
        zoomOut()
      }
      break
    case '0':
      if (props.item.mediaType === 'Image') {
        resetZoom()
      }
      break
  }
}

const navigatePrevious = () => {
  emit('navigate', 'previous')
}

const navigateNext = () => {
  emit('navigate', 'next')
}

const handleContentClick = (event) => {
  // Close on background click (not on media)
  if (event.target.classList.contains('viewer-content') ||
      event.target.classList.contains('media-container')) {
    handleClose()
  }
}

// Zoom and Pan for Images
const zoomIn = () => {
  if (zoomLevel.value < 3) {
    zoomLevel.value = Math.min(3, zoomLevel.value + 0.25)
  }
}

const zoomOut = () => {
  if (zoomLevel.value > 0.5) {
    zoomLevel.value = Math.max(0.5, zoomLevel.value - 0.25)

    // Reset position if zoomed out too much
    if (zoomLevel.value === 1) {
      imagePosition.value = { x: 0, y: 0 }
    }
  }
}

const resetZoom = () => {
  zoomLevel.value = 1
  imagePosition.value = { x: 0, y: 0 }
}

const handleWheel = (event) => {
  if (props.item.mediaType !== 'Image') return

  const delta = event.deltaY > 0 ? -0.1 : 0.1
  const newZoom = Math.min(3, Math.max(0.5, zoomLevel.value + delta))

  if (newZoom !== zoomLevel.value) {
    zoomLevel.value = newZoom

    if (zoomLevel.value === 1) {
      imagePosition.value = { x: 0, y: 0 }
    }
  }
}

const handleMouseDown = (event) => {
  if (props.item.mediaType !== 'Image' || zoomLevel.value <= 1) return

  isDragging.value = true
  dragStart.value = {
    x: event.clientX - imagePosition.value.x,
    y: event.clientY - imagePosition.value.y
  }
}

const handleMouseMove = (event) => {
  if (!isDragging.value) return

  imagePosition.value = {
    x: event.clientX - dragStart.value.x,
    y: event.clientY - dragStart.value.y
  }
}

const handleMouseUp = () => {
  isDragging.value = false
}

// Media Loading Handlers
const handleImageLoad = () => {
  isLoading.value = false
  hasError.value = false

  if (imageElement.value) {
    const img = imageElement.value
    imageDimensions.value = `${img.naturalWidth} × ${img.naturalHeight}`
  }
}

const handleImageError = () => {
  isLoading.value = false
  hasError.value = true
}

const handleVideoLoad = () => {
  isLoading.value = false
  hasError.value = false
}

const handleVideoError = () => {
  isLoading.value = false
  hasError.value = true
}

const handleAudioLoad = () => {
  isLoading.value = false
  hasError.value = false

  if (audioElement.value) {
    audioDuration.value = audioElement.value.duration
  }
}

const handleAudioError = () => {
  isLoading.value = false
  hasError.value = true
}

const handlePdfError = () => {
  console.warn('PDF preview not supported, showing download option')
}

// Slideshow
const toggleSlideshow = () => {
  if (isSlideshow.value) {
    stopSlideshow()
  } else {
    startSlideshow()
  }
}

const startSlideshow = () => {
  if (!canStartSlideshow.value) return

  isSlideshow.value = true
  startSlideshowTimer()
  startProgressTimer()
}

const stopSlideshow = () => {
  isSlideshow.value = false

  if (slideshowTimer.value) {
    clearTimeout(slideshowTimer.value)
    slideshowTimer.value = null
  }

  if (slideshowProgressTimer.value) {
    clearInterval(slideshowProgressTimer.value)
    slideshowProgressTimer.value = null
  }

  slideshowProgress.value = 0
}

const startSlideshowTimer = () => {
  slideshowTimer.value = setTimeout(() => {
    if (isSlideshow.value) {
      navigateNext()
      startSlideshowTimer()
    }
  }, slideshowInterval.value)
}

const startProgressTimer = () => {
  slideshowProgress.value = 0
  const step = 0.01 // 1% per step
  const stepTime = slideshowInterval.value * step // Time per step

  slideshowProgressTimer.value = setInterval(() => {
    if (slideshowProgress.value >= 1) {
      slideshowProgress.value = 0
    } else {
      slideshowProgress.value += step
    }
  }, stepTime)
}

// Actions
const handleDownload = () => {
  emit('download', props.item)
}

const handleEdit = () => {
  emit('edit', props.item)
}

const handleDelete = () => {
  emit('delete', props.item)
}

const copyFileUrl = async () => {
  try {
    await navigator.clipboard.writeText(props.item.fileUrl)
    showSuccess('File URL copied to clipboard')
  // eslint-disable-next-line no-unused-vars
  } catch (error) {
    showError('Failed to copy URL')
  }
}

const openInNewTab = () => {
  window.open(props.item.fileUrl, '_blank')
}

// Utilities
const getFileIcon = () => {
  return getGalleryFileIcon(props.item.mediaType)
}

const getFileExtension = () => {
  const fileName = props.item.originalFileName || props.item.fileName || ''
  const parts = fileName.split('.')
  return parts.length > 1 ? parts.pop().toUpperCase() : ''
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString()
}

const formatDuration = (seconds) => {
  if (!seconds || !isFinite(seconds)) return ''

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

// Watchers
watch(() => props.item, () => {
  // Reset state when item changes
  isLoading.value = true
  hasError.value = false
  resetZoom()
  imageDimensions.value = ''
  audioDuration.value = 0

  // Reset slideshow progress
  if (isSlideshow.value) {
    slideshowProgress.value = 0
    if (slideshowProgressTimer.value) {
      clearInterval(slideshowProgressTimer.value)
      startProgressTimer()
    }
  }
}, { immediate: true })

watch(isOpen, (newValue) => {
  if (newValue) {
    // Add keyboard listener
    nextTick(() => {
      document.addEventListener('keydown', handleKeydown)
    })
  } else {
    // Remove keyboard listener and stop slideshow
    document.removeEventListener('keydown', handleKeydown)
    stopSlideshow()
  }
})

// Lifecycle
onMounted(() => {
  if (isOpen.value) {
    document.addEventListener('keydown', handleKeydown)
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  stopSlideshow()
})
</script>

<style lang="scss" scoped>
.media-viewer-dialog {
  :deep(.q-dialog__inner) {
    padding: 0;
  }
}

.media-viewer-container {
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.viewer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  z-index: 100;
  color: white;

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1;
    min-width: 0;

    .file-info {
      min-width: 0;

      .file-name {
        font-size: 16px;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 300px;
      }

      .file-details {
        font-size: 14px;
        opacity: 0.8;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }

  .header-center {
    display: flex;
    justify-content: center;
    min-width: 120px;

    .navigation-info {
      font-size: 14px;
      opacity: 0.8;
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    justify-content: flex-end;
  }
}

.viewer-content {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.nav-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;

  &.nav-arrow-left {
    left: 24px;
  }

  &.nav-arrow-right {
    right: 24px;
  }
}

.media-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.image-viewer {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  .viewer-image {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    user-select: none;
  }
}

.video-viewer {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  .viewer-video {
    max-width: 100%;
    max-height: 100%;
    outline: none;
  }
}

.audio-viewer {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  .audio-container {
    text-align: center;
    color: white;

    .audio-info {
      margin-bottom: 32px;

      .audio-title {
        font-size: 24px;
        font-weight: 500;
        margin: 16px 0 8px;
        max-width: 600px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .audio-details {
        font-size: 16px;
        opacity: 0.8;
      }
    }

    .viewer-audio {
      width: 400px;
      max-width: 100%;
    }
  }
}

.document-viewer {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  .document-container {
    text-align: center;
    color: white;
    max-width: 600px;
    width: 100%;

    .document-info {
      margin-bottom: 32px;

      .document-title {
        font-size: 24px;
        font-weight: 500;
        margin: 16px 0 8px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .document-details {
        font-size: 16px;
        opacity: 0.8;
      }
    }

    .document-actions {
      margin-bottom: 32px;

      .q-btn {
        margin: 0 8px;
      }
    }

    .pdf-preview {
      .pdf-frame {
        width: 100%;
        height: 600px;
        border: none;
        background: white;
        border-radius: 8px;
      }
    }
  }
}

.loading-overlay,
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  z-index: 20;

  .loading-text,
  .error-text {
    margin-top: 16px;
    font-size: 18px;
  }
}

.viewer-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  color: white;
  padding: 24px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;

  .info-content {
    flex: 1;

    .caption {
      font-size: 16px;
      margin-bottom: 16px;
      line-height: 1.5;
    }

    .metadata {
      display: flex;
      flex-wrap: wrap;
      gap: 24px;

      .metadata-item {
        display: flex;
        align-items: center;
        gap: 8px;

        .label {
          opacity: 0.8;
          font-weight: 500;
        }
      }
    }
  }
}

.info-toggle {
  position: absolute;
  bottom: 24px;
  right: 24px;
  z-index: 10;
}

.slideshow-timer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;
}

// Responsive
@media (max-width: 768px) {
  .viewer-header {
    padding: 12px 16px;

    .header-left {
      gap: 12px;

      .file-info {
        .file-name {
          font-size: 14px;
          max-width: 200px;
        }

        .file-details {
          font-size: 12px;
        }
      }
    }

    .header-center {
      min-width: 80px;

      .navigation-info {
        font-size: 12px;
      }
    }

    .header-right {
      gap: 4px;
    }
  }

  .nav-arrow {
    &.nav-arrow-left {
      left: 12px;
    }

    &.nav-arrow-right {
      right: 12px;
    }
  }

  .viewer-info {
    padding: 16px;

    .metadata {
      gap: 16px;

      .metadata-item {
        font-size: 14px;
      }
    }
  }

  .audio-viewer .audio-container {
    .audio-title {
      font-size: 18px;
    }

    .viewer-audio {
      width: 100%;
    }
  }

  .document-viewer .document-container {
    padding: 16px;

    .document-title {
      font-size: 18px;
    }

    .pdf-preview .pdf-frame {
      height: 400px;
    }
  }
}

@media (max-width: 480px) {
  .viewer-header {
    .header-left .file-info .file-name {
      max-width: 150px;
    }
  }

  .info-toggle {
    bottom: 16px;
    right: 16px;
  }
}

// Touch gestures for mobile
@media (hover: none) and (pointer: coarse) {
  .image-viewer .viewer-image {
    cursor: default;
  }
}
</style>
