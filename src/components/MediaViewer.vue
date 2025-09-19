<template>
  <q-dialog
    v-model="isOpen"
    maximized
    class="media-viewer-dialog"
    @hide="handleDialogHide"
  >
    <div class="media-viewer-container">
      <!-- Enhanced Header with Flag Timeline -->
      <div class="viewer-header">
        <div class="header-left">
          <q-btn icon="close" flat round dense size="md" color="white" @click="handleClose" />
          <div class="file-info">
            <div class="file-name">{{ item?.originalFileName || item?.fileName }}</div>
            <div class="file-details">
              {{ getFileExtension() }} • {{ formatFileSize(item?.fileSize) }}
              <span v-if="item?.mediaType === 'Video' && videoDuration"> • {{ formatDuration(videoDuration) }}</span>
            </div>
          </div>
        </div>

        <div class="header-center">
          <div class="navigation-info" v-if="items.length > 1">
            {{ currentIndex + 1 }} / {{ items.length }}
          </div>
        </div>

        <div class="header-right">
          <!-- Video Timeline Controls (only for videos with flags) -->
          <div v-if="item?.mediaType === 'Video' && hasVideoFlags" class="timeline-controls">
            <q-btn
              icon="skip_previous"
              flat
              round
              dense
              size="sm"
              color="white"
              @click="previousFlag"
              :disable="!canGoPreviousFlag"
            >
              <q-tooltip>Previous Flag</q-tooltip>
            </q-btn>
            <q-btn
              icon="skip_next"
              flat
              round
              dense
              size="sm"
              color="white"
              @click="nextFlag"
              :disable="!canGoNextFlag"
            >
              <q-tooltip>Next Flag</q-tooltip>
            </q-btn>
          </div>

          <q-btn icon="download" flat round dense size="md" color="white" @click="downloadMedia">
            <q-tooltip>Download</q-tooltip>
          </q-btn>
          <q-btn icon="info" flat round dense size="md" color="white" @click="toggleInfo">
            <q-tooltip>Info</q-tooltip>
          </q-btn>
        </div>
      </div>

      <!-- Enhanced Video Timeline (for videos with flags) -->
      <div v-if="item?.mediaType === 'Video' && hasVideoFlags" class="video-timeline-bar">
        <div class="timeline-container">
          <div
            class="timeline-track"
            @click="handleTimelineClick"
            ref="timelineElement"
          >
            <div class="timeline-progress" :style="{ width: `${timelineProgress}%` }"></div>
            
            <!-- Flag markers on timeline -->
            <div
              v-for="flag in videoFlags"
              :key="flag.id"
              class="timeline-flag-marker"
              :class="`flag-${flag.type}`"
              :style="{ left: `${(flag.timestamp / videoDuration) * 100}%` }"
              @click.stop="jumpToFlag(flag)"
            >
              <q-tooltip>{{ flag.type }} flag at {{ formatDuration(flag.timestamp) }}</q-tooltip>
            </div>
          </div>
          
          <div class="timeline-time">
            {{ formatDuration(currentVideoTime) }} / {{ formatDuration(videoDuration) }}
          </div>
        </div>
      </div>

      <!-- Media Display Area -->
      <div class="viewer-content">
        <!-- Navigation Arrows -->
        <div
          v-if="items.length > 1"
          class="nav-arrow nav-arrow-left"
          @click.stop="navigatePrevious"
        >
          <q-btn icon="chevron_left" flat round size="lg" color="white">
            <q-tooltip>Previous (←)</q-tooltip>
          </q-btn>
        </div>

        <div
          v-if="items.length > 1"
          class="nav-arrow nav-arrow-right"
          @click.stop="navigateNext"
        >
          <q-btn icon="chevron_right" flat round size="lg" color="white">
            <q-tooltip>Next (→)</q-tooltip>
          </q-btn>
        </div>

        <!-- Media Container -->
        <div class="media-container">
          <!-- Enhanced Image Viewer with Flags -->
          <div
            v-if="item?.mediaType === 'Image'"
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

            <!-- Image Flags Overlay -->
            <div class="image-flags-overlay">
              <div
                v-for="flag in imageFlags"
                :key="flag.id"
                class="image-flag"
                :class="`flag-${flag.type}`"
                :style="getImageFlagStyle(flag)"
                @click="handleFlagClick(flag)"
              >
                <q-icon name="flag" size="20px" />
                <q-tooltip>{{ flag.type }} flag</q-tooltip>
              </div>
            </div>
          </div>

          <!-- Enhanced Video Player with Flags -->
          <div v-else-if="item?.mediaType === 'Video'" class="video-viewer">
            <div class="video-container" ref="videoContainer">
              <video
                ref="videoElement"
                :src="item.fileUrl"
                class="viewer-video"
                controls
                preload="metadata"
                @loadedmetadata="handleVideoLoad"
                @timeupdate="handleVideoTimeUpdate"
                @error="handleVideoError"
              >
                Your browser does not support the video tag.
              </video>

              <!-- Video Flags Overlay -->
              <div class="video-flags-overlay">
                <div
                  v-for="flag in visibleVideoFlags"
                  :key="flag.id"
                  class="video-flag"
                  :class="`flag-${flag.type}`"
                  :style="getVideoFlagStyle(flag)"
                  @click="handleFlagClick(flag)"
                >
                  <q-icon name="flag" size="20px" />
                  <q-tooltip>{{ flag.type }} flag at {{ formatDuration(flag.timestamp) }}</q-tooltip>
                </div>
              </div>
            </div>
          </div>

          <!-- Audio Player (unchanged) -->
          <div v-else-if="item?.mediaType === 'Audio'" class="audio-viewer">
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

          <!-- Document Viewer (unchanged) -->
          <div v-else class="document-viewer">
            <div class="document-container">
              <div class="document-info">
                <q-icon name="description" size="64px" color="white" />
                <div class="document-title">{{ item?.originalFileName || item?.fileName }}</div>
                <div class="document-details">
                  {{ getFileExtension().toUpperCase() }} • {{ formatFileSize(item?.fileSize) }}
                </div>
              </div>

              <div class="document-actions">
                <q-btn
                  color="primary"
                  icon="download"
                  label="Download"
                  @click="downloadMedia"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Info Panel -->
      <div v-if="showInfo" class="viewer-info">
        <div class="info-content">
          <div class="info-header">
            <h6>Media Information</h6>
            <q-btn icon="close" flat round dense size="sm" color="white" @click="toggleInfo" />
          </div>

          <div class="metadata">
            <div class="metadata-item">
              <q-icon name="insert_drive_file" />
              <span class="label">Name:</span>
              <span>{{ item?.originalFileName || item?.fileName }}</span>
            </div>
            
            <div class="metadata-item">
              <q-icon name="straighten" />
              <span class="label">Size:</span>
              <span>{{ formatFileSize(item?.fileSize) }}</span>
            </div>

            <div v-if="item?.mediaType === 'Image' && imageDimensions" class="metadata-item">
              <q-icon name="photo_size_select_large" />
              <span class="label">Dimensions:</span>
              <span>{{ imageDimensions }}</span>
            </div>

            <div v-if="item?.mediaType === 'Video' && videoDuration" class="metadata-item">
              <q-icon name="schedule" />
              <span class="label">Duration:</span>
              <span>{{ formatDuration(videoDuration) }}</span>
            </div>

            <div class="metadata-item">
              <q-icon name="calendar_today" />
              <span class="label">Uploaded:</span>
              <span>{{ formatDate(item?.uploadedDate) }}</span>
            </div>

            <div v-if="totalFlags > 0" class="metadata-item">
              <q-icon name="flag" />
              <span class="label">Flags:</span>
              <span>{{ totalFlags }} flags added</span>
            </div>
          </div>

          <!-- Flag Summary -->
          <div v-if="totalFlags > 0" class="flags-summary">
            <h6>Flags</h6>
            <div class="flag-list">
              <div
                v-for="flag in allFlags"
                :key="flag.id"
                class="flag-item"
                @click="jumpToFlag(flag)"
              >
                <q-icon name="flag" :color="getFlagColor(flag.type)" />
                <span class="flag-type">{{ flag.type }}</span>
                <span v-if="flag.timestamp" class="flag-time">{{ formatDuration(flag.timestamp) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Notes Dialog Integration -->
    <q-dialog v-model="showNotesDialog" maximized>
      <div class="notes-dialog-container">
        <div class="notes-header">
          <h5>Notes</h5>
          <q-btn icon="close" flat round dense color="white" v-close-popup />
        </div>
        <div class="notes-content">
          <NoteEditor
            v-if="showNotesDialog"
            v-model="currentNoteData"
            :readonly="false"
            @save-note="handleNoteSave"
            @cancel-note="handleNoteCancel"
          />
        </div>
      </div>
    </q-dialog>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import NoteEditor from 'components/NoteEditor.vue'

// Props
const props = defineProps({
  item: {
    type: Object,
    default: null
  },
  items: {
    type: Array,
    default: () => []
  },
  currentIndex: {
    type: Number,
    default: 0
  },
  modelValue: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['close', 'navigate', 'update:modelValue'])

// Refs
const imageElement = ref(null)
const imageContainer = ref(null)
const videoElement = ref(null)
const videoContainer = ref(null)
const audioElement = ref(null)
const timelineElement = ref(null)

// State
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const showInfo = ref(false)
const showNotesDialog = ref(false)
const currentNoteData = ref('')

// Media state
const isLoading = ref(true)
const hasError = ref(false)
const imageDimensions = ref('')
const audioDuration = ref(0)
const videoDuration = ref(0)
const currentVideoTime = ref(0)

// Flag state  
const videoFlags = ref([])
const imageFlags = ref([])
const visibleVideoFlags = ref([])
const currentFlagIndex = ref(-1)

// Zoom and pan for images
const zoomLevel = ref(1)
const imagePosition = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })

// Computed properties
const imageStyles = computed(() => {
  return {
    transform: `scale(${zoomLevel.value}) translate(${imagePosition.value.x}px, ${imagePosition.value.y}px)`,
    cursor: zoomLevel.value > 1 ? (isDragging.value ? 'grabbing' : 'grab') : 'default'
  }
})

const hasVideoFlags = computed(() => videoFlags.value.length > 0)

const timelineProgress = computed(() => {
  if (!videoDuration.value) return 0
  return (currentVideoTime.value / videoDuration.value) * 100
})

const totalFlags = computed(() => videoFlags.value.length + imageFlags.value.length)

const allFlags = computed(() => [...videoFlags.value, ...imageFlags.value])

const canGoPreviousFlag = computed(() => {
  return hasVideoFlags.value && currentFlagIndex.value > 0
})

const canGoNextFlag = computed(() => {
  return hasVideoFlags.value && currentFlagIndex.value < videoFlags.value.length - 1
})

// Methods
const loadMediaFlags = () => {
  if (!props.item?.metadata?.flags) {
    videoFlags.value = []
    imageFlags.value = []
    return
  }

  const flags = props.item.metadata.flags || []
  
  if (props.item.mediaType === 'Video') {
    videoFlags.value = flags.filter(flag => flag.timestamp !== null)
      .sort((a, b) => a.timestamp - b.timestamp)
    imageFlags.value = []
  } else if (props.item.mediaType === 'Image') {
    imageFlags.value = flags.filter(flag => flag.timestamp === null)
    videoFlags.value = []
  } else {
    videoFlags.value = []
    imageFlags.value = []
  }

  updateVisibleVideoFlags()
}

const updateVisibleVideoFlags = () => {
  if (!hasVideoFlags.value) {
    visibleVideoFlags.value = []
    return
  }

  const currentTime = currentVideoTime.value * 1000 // Convert to milliseconds
  
  visibleVideoFlags.value = videoFlags.value.filter(flag => {
    const flagTime = flag.timestamp
    const flagEndTime = flagTime + 500 // Flag visible for 500ms
    return currentTime >= flagTime && currentTime <= flagEndTime
  })
}

const getImageFlagStyle = (flag) => {
  // Convert percentage coordinates back to pixel positions
  return {
    left: `${flag.coordinates.x}%`,
    top: `${flag.coordinates.y}%`,
    transform: 'translate(-50%, -50%)'
  }
}

const getVideoFlagStyle = (flag) => {
  // Convert percentage coordinates back to pixel positions
  return {
    left: `${flag.coordinates.x}%`,
    top: `${flag.coordinates.y}%`,
    transform: 'translate(-50%, -50%)'
  }
}

const getFlagColor = (flagType) => {
  switch (flagType) {
    case 'red': return 'red'
    case 'green': return 'green'  
    case 'yellow': return 'orange'
    case 'other': return 'grey'
    default: return 'grey'
  }
}

const handleFlagClick = () => {
  // Open notes dialog when flag is clicked
  currentNoteData.value = ''
  showNotesDialog.value = true
}

const jumpToFlag = (flag) => {
  if (props.item.mediaType === 'Video' && flag.timestamp && videoElement.value) {
    const timeInSeconds = flag.timestamp / 1000
    videoElement.value.currentTime = timeInSeconds
    
    // Update current flag index
    currentFlagIndex.value = videoFlags.value.findIndex(f => f.id === flag.id)
  }
}

const nextFlag = () => {
  if (canGoNextFlag.value) {
    currentFlagIndex.value++
    const flag = videoFlags.value[currentFlagIndex.value]
    jumpToFlag(flag)
  }
}

const previousFlag = () => {
  if (canGoPreviousFlag.value) {
    currentFlagIndex.value--
    const flag = videoFlags.value[currentFlagIndex.value]
    jumpToFlag(flag)
  }
}

const handleTimelineClick = (event) => {
  if (!timelineElement.value || !videoDuration.value) return
  
  const rect = timelineElement.value.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const percentage = clickX / rect.width
  const targetTime = percentage * videoDuration.value
  
  if (videoElement.value) {
    videoElement.value.currentTime = targetTime
  }
}

const handleVideoTimeUpdate = () => {
  if (videoElement.value) {
    currentVideoTime.value = videoElement.value.currentTime
    updateVisibleVideoFlags()
    
    // Update current flag index based on time
    if (hasVideoFlags.value) {
      const currentTimeMs = currentVideoTime.value * 1000
      let closestIndex = -1
      let closestDistance = Infinity
      
      videoFlags.value.forEach((flag, index) => {
        const distance = Math.abs(flag.timestamp - currentTimeMs)
        if (distance < closestDistance && distance < 1000) { // Within 1 second
          closestDistance = distance
          closestIndex = index
        }
      })
      
      currentFlagIndex.value = closestIndex
    }
  }
}

const handleNoteSave = () => {
  showNotesDialog.value = false
  // Handle note save logic here
}

const handleNoteCancel = () => {
  showNotesDialog.value = false
}

// Image zoom and pan
const resetZoom = () => {
  zoomLevel.value = 1
  imagePosition.value = { x: 0, y: 0 }
}

const handleWheel = (event) => {
  if (props.item?.mediaType !== 'Image') return
  
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
  if (props.item?.mediaType !== 'Image' || zoomLevel.value <= 1) return
  
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

// Media loading handlers
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
  
  if (videoElement.value) {
    videoDuration.value = videoElement.value.duration
  }
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

// Navigation
const navigatePrevious = () => {
  if (props.currentIndex > 0) {
    emit('navigate', props.currentIndex - 1)
  }
}

const navigateNext = () => {
  if (props.currentIndex < props.items.length - 1) {
    emit('navigate', props.currentIndex + 1)
  }
}

// Dialog handlers
const handleClose = () => {
  emit('close')
}

const handleDialogHide = () => {
  resetZoom()
  showInfo.value = false
  showNotesDialog.value = false
}

const toggleInfo = () => {
  showInfo.value = !showInfo.value
}

// Utility functions
const formatFileSize = (bytes) => {
  if (!bytes) return ''
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

const getFileExtension = () => {
  if (!props.item?.originalFileName && !props.item?.fileName) return ''
  const fileName = props.item.originalFileName || props.item.fileName
  const parts = fileName.split('.')
  return parts.length > 1 ? parts.pop().toUpperCase() : ''
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString()
}

const formatDuration = (seconds) => {
  if (!seconds || !isFinite(seconds)) return '0:00'
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

const downloadMedia = () => {
  if (props.item?.fileUrl) {
    const link = document.createElement('a')
    link.href = props.item.fileUrl
    link.download = props.item.originalFileName || props.item.fileName || 'download'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// Keyboard navigation
const handleKeydown = (event) => {
  if (!isOpen.value) return
  
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
    case 'ArrowUp':
      if (hasVideoFlags.value) {
        previousFlag()
      }
      break
    case 'ArrowDown':
      if (hasVideoFlags.value) {
        nextFlag()
      }
      break
    case 'i':
    case 'I':
      toggleInfo()
      break
  }
}

// Watchers
watch(() => props.item, () => {
  // Reset state when item changes
  isLoading.value = true
  hasError.value = false
  resetZoom()
  imageDimensions.value = ''
  audioDuration.value = 0
  videoDuration.value = 0
  currentVideoTime.value = 0
  currentFlagIndex.value = -1
  
  // Load flags for new item
  loadMediaFlags()
}, { immediate: true })

watch(isOpen, (newValue) => {
  if (newValue) {
    nextTick(() => {
      document.addEventListener('keydown', handleKeydown)
    })
  } else {
    document.removeEventListener('keydown', handleKeydown)
  }
})

// Lifecycle
onMounted(() => {
  if (isOpen.value) {
    document.addEventListener('keydown', handleKeydown)
  }
  loadMediaFlags()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
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
  flex-shrink: 0;

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

    .timeline-controls {
      display: flex;
      gap: 4px;
      margin-right: 8px;
    }
  }
}

.video-timeline-bar {
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  padding: 12px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.timeline-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.timeline-track {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  position: relative;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
}

.timeline-progress {
  height: 100%;
  background: linear-gradient(90deg, #00bcd4, #2196f3);
  border-radius: 3px;
  transition: width 0.1s ease;
}

.timeline-flag-marker {
  position: absolute;
  top: 50%;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  cursor: pointer;
  z-index: 2;

  &.flag-red {
    background: #ff4444;
    box-shadow: 0 0 6px rgba(255, 68, 68, 0.6);
  }

  &.flag-green {
    background: #44ff44;
    box-shadow: 0 0 6px rgba(68, 255, 68, 0.6);
  }

  &.flag-yellow {
    background: #ffaa44;
    box-shadow: 0 0 6px rgba(255, 170, 68, 0.6);
  }

  &.flag-other {
    background: #888888;
    box-shadow: 0 0 6px rgba(136, 136, 136, 0.6);
  }

  &:hover {
    transform: translate(-50%, -50%) scale(1.2);
  }
}

.timeline-time {
  color: white;
  font-size: 12px;
  font-family: 'Courier New', monospace;
  min-width: 100px;
  text-align: right;
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
  position: relative;

  .viewer-image {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    user-select: none;
  }
}

.image-flags-overlay,
.video-flags-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 5;
}

.image-flag,
.video-flag {
  position: absolute;
  pointer-events: auto;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 6;

  &.flag-red {
    color: #ff4444;
  }

  &.flag-green {
    color: #44ff44;
  }

  &.flag-yellow {
    color: #ffaa44;
  }

  &.flag-other {
    color: #888888;
  }

  &:hover {
    transform: translate(-50%, -50%) scale(1.2);
    filter: drop-shadow(0 0 8px currentColor);
  }
}

.video-viewer {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.video-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.viewer-video {
  max-width: 100%;
  max-height: 100%;
  outline: none;
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

    .audio-title {
      font-size: 24px;
      margin: 16px 0;
      font-weight: 500;
    }

    .audio-details {
      opacity: 0.8;
      margin-bottom: 24px;
    }

    .viewer-audio {
      width: 400px;
      max-width: 80vw;
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
    padding: 48px;

    .document-title {
      font-size: 24px;
      margin: 16px 0;
      font-weight: 500;
    }

    .document-details {
      opacity: 0.8;
      margin-bottom: 32px;
    }
  }
}

.viewer-info {
  position: fixed;
  right: 0;
  top: 0;
  height: 100vh;
  width: 400px;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(20px);
  z-index: 200;
  overflow-y: auto;
  border-left: 1px solid rgba(255, 255, 255, 0.1);

  .info-content {
    padding: 24px;
    color: white;
  }

  .info-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    h6 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }
  }

  .metadata {
    margin-bottom: 32px;

    .metadata-item {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
      font-size: 14px;

      .label {
        font-weight: 500;
        min-width: 80px;
      }
    }
  }

  .flags-summary {
    h6 {
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 600;
    }

    .flag-list {
      .flag-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px;
        border-radius: 4px;
        cursor: pointer;
        margin-bottom: 4px;
        transition: background 0.2s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .flag-type {
          text-transform: capitalize;
          font-weight: 500;
        }

        .flag-time {
          margin-left: auto;
          font-size: 12px;
          opacity: 0.8;
          font-family: 'Courier New', monospace;
        }
      }
    }
  }
}

.notes-dialog-container {
  width: 100vw;
  height: 100vh;
  background: white;
  display: flex;
  flex-direction: column;

  .notes-header {
    background: linear-gradient(135deg, #26a69a 0%, #00897b 100%);
    color: white;
    padding: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    h5 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }
  }

  .notes-content {
    flex: 1;
    overflow: hidden;
    padding: 24px;
  }
}

// Mobile responsive
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

  .video-timeline-bar {
    padding: 8px 16px;
  }

  .timeline-flag-marker {
    width: 10px;
    height: 10px;
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
    width: 100vw;
    
    .info-content {
      padding: 16px;
    }
  }

  .notes-dialog-container {
    .notes-header {
      padding: 16px;
    }

    .notes-content {
      padding: 16px;
    }
  }
}

// Animation keyframes
@keyframes flag-pulse {
  0%, 100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 0.7;
    transform: translate(-50%, -50%) scale(1.1);
  }
}

.video-flag {
  animation: flag-pulse 2s infinite;
}
</style>