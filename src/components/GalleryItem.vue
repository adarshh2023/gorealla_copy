<template>
  <!-- Grid View -->
  <q-card
    v-if="viewMode === 'grid'"
    class="gallery-item-card"
    :class="{ 'selected': selected, 'clickable': true }"
    @click="handleClick"
  >
    <!-- Selection Checkbox -->
    <div class="selection-overlay" v-if="selected || showSelection">
      <q-checkbox
        :model-value="selected"
        @update:model-value="handleSelect"
        @click.stop
        color="primary"
        class="selection-checkbox"
      />
    </div>

    <!-- Media Preview -->
    <div class="media-preview" @click.stop="handleView">
      <!-- Image Preview -->
      <q-img
        v-if="item.mediaType === 'Image'"
        :src="previewUrl || fallbackImageUrl"
        :ratio="1"
        class="preview-image"
        loading="lazy"
        @error="handleImageError"
      >
        <template v-slot:loading>
          <div class="absolute-full flex flex-center">
            <q-spinner-dots color="primary" size="40px" />
          </div>
        </template>
        <template v-slot:error>
          <div class="absolute-full flex flex-center bg-grey-3">
            <q-icon name="broken_image" size="40px" color="grey-6" />
          </div>
        </template>

        <!-- Play button overlay for videos with thumbnails -->
        <div v-if="item.mediaType === 'Video'" class="play-overlay">
          <q-icon name="play_circle_filled" size="48px" color="white" />
        </div>
      </q-img>

      <!-- Video Preview (when no thumbnail) -->
      <div
        v-else-if="item.mediaType === 'Video'"
        class="file-icon-preview"
        :style="{ backgroundColor: '#f5f5f5' }"
      >
        <q-icon name="videocam" size="48px" color="grey-6" />
        <div class="play-overlay">
          <q-icon name="play_circle_filled" size="48px" color="primary" />
        </div>
      </div>

      <!-- Audio Preview -->
      <div
        v-else-if="item.mediaType === 'Audio'"
        class="file-icon-preview"
        :style="{ backgroundColor: '#e8f5e8' }"
      >
        <q-icon name="audiotrack" size="48px" color="green-6" />
        <div class="audio-overlay">
          <q-icon name="play_circle_filled" size="32px" color="green" />
        </div>
      </div>

      <!-- Document Preview -->
      <div
        v-else
        class="file-icon-preview"
        :style="{ backgroundColor: getDocumentBgColor() }"
      >
        <q-icon :name="getFileIcon()" size="48px" :color="getDocumentIconColor()" />
        <div class="document-type">
          {{ getFileExtension() }}
        </div>
      </div>
    </div>

    <!-- Card Content -->
    <q-card-section class="card-content">
      <!-- File Name -->
      <div class="file-name" :title="item.originalFileName || item.fileName">
        {{ truncateFileName(item.originalFileName || item.fileName, 20) }}
      </div>

      <!-- File Info -->
      <div class="file-info">
        <div class="file-size text-caption text-grey-6">
          {{ formatFileSize(item.fileSize) }}
        </div>
        <div class="file-date text-caption text-grey-6">
          {{ formatDate(item.uploadedDate) }}
        </div>
      </div>

      <!-- Category Badge -->
      <div v-if="item.mediaCategory" class="category-badge">
        <q-chip
          :icon="getCategoryIcon(item.mediaCategory)"
          :color="getCategoryColor(item.mediaCategory)"
          text-color="white"
          size="sm"
          dense
        >
          {{ item.mediaCategory }}
        </q-chip>
      </div>

      <!-- Visibility Badge -->
      <div class="visibility-badge">
        <q-icon
          :name="item.isPublic ? 'public' : 'lock'"
          :color="item.isPublic ? 'positive' : 'warning'"
          size="16px"
          :title="item.isPublic ? 'Public' : 'Private'"
        />
      </div>
    </q-card-section>

    <!-- Action Menu -->
    <div class="action-menu">
      <q-btn
        icon="more_vert"
        flat
        round
        dense
        size="sm"
        @click.stop
      >
        <q-menu>
          <q-list dense>
            <q-item clickable v-close-popup @click="handleView">
              <q-item-section avatar>
                <q-icon name="visibility" />
              </q-item-section>
              <q-item-section>View</q-item-section>
            </q-item>

            <q-item clickable v-close-popup @click="handleDownload">
              <q-item-section avatar>
                <q-icon name="download" />
              </q-item-section>
              <q-item-section>Download</q-item-section>
            </q-item>

            <q-item clickable v-close-popup @click="handleEdit">
              <q-item-section avatar>
                <q-icon name="edit" />
              </q-item-section>
              <q-item-section>Edit</q-item-section>
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
  </q-card>

  <!-- List View -->
  <q-item
    v-else
    class="gallery-item-list"
    :class="{ 'selected': selected }"
    clickable
    @click="handleClick"
  >
    <!-- Selection -->
    <q-item-section avatar>
      <q-checkbox
        :model-value="selected"
        @update:model-value="handleSelect"
        @click.stop
        color="primary"
      />
    </q-item-section>

    <!-- Thumbnail/Icon -->
    <q-item-section avatar>
      <q-avatar size="48px" class="list-thumbnail">
        <q-img
          v-if="item.mediaType === 'Image' && previewUrl"
          :src="previewUrl"
          @error="handleImageError"
        />
        <q-icon
          v-else
          :name="getFileIcon()"
          :color="getIconColor()"
          size="24px"
        />
      </q-avatar>
    </q-item-section>

    <!-- File Details -->
    <q-item-section>
      <q-item-label class="file-name-list">
        {{ item.originalFileName || item.fileName }}
      </q-item-label>
      <q-item-label caption class="file-info-list">
        <div class="info-row">
          <span>{{ formatFileSize(item.fileSize) }}</span>
          <span class="separator">•</span>
          <span>{{ item.mediaType }}</span>
          <span v-if="item.mediaCategory" class="separator">•</span>
          <span v-if="item.mediaCategory">{{ item.mediaCategory }}</span>
        </div>
        <div class="info-row">
          <span>{{ formatDate(item.uploadedDate) }}</span>
          <span class="separator">•</span>
          <span>{{ item.uploadedByName || 'Unknown' }}</span>
        </div>
      </q-item-label>
    </q-item-section>

    <!-- Status Indicators -->
    <q-item-section side>
      <div class="list-indicators">
        <!-- Category -->
        <q-chip
          v-if="item.mediaCategory"
          :icon="getCategoryIcon(item.mediaCategory)"
          :color="getCategoryColor(item.mediaCategory)"
          text-color="white"
          size="sm"
          dense
        >
          {{ item.mediaCategory }}
        </q-chip>

        <!-- Visibility -->
        <q-icon
          :name="item.isPublic ? 'public' : 'lock'"
          :color="item.isPublic ? 'positive' : 'warning'"
          size="18px"
          :title="item.isPublic ? 'Public' : 'Private'"
          class="q-ml-sm"
        />
      </div>
    </q-item-section>

    <!-- Actions -->
    <q-item-section side>
      <div class="list-actions">
        <q-btn
          icon="visibility"
          flat
          round
          dense
          size="sm"
          @click.stop="handleView"
          class="action-btn"
        >
          <q-tooltip>View</q-tooltip>
        </q-btn>

        <q-btn
          icon="download"
          flat
          round
          dense
          size="sm"
          @click.stop="handleDownload"
          class="action-btn"
        >
          <q-tooltip>Download</q-tooltip>
        </q-btn>

        <q-btn
          icon="edit"
          flat
          round
          dense
          size="sm"
          @click.stop="handleEdit"
          class="action-btn"
        >
          <q-tooltip>Edit</q-tooltip>
        </q-btn>

        <q-btn
          icon="delete"
          flat
          round
          dense
          size="sm"
          color="negative"
          @click.stop="handleDelete"
          class="action-btn"
        >
          <q-tooltip>Delete</q-tooltip>
        </q-btn>
      </div>
    </q-item-section>
  </q-item>
</template>

<script setup>
import { ref, computed } from 'vue'
import { formatFileSize, getGalleryFileIcon, getGalleryCategoryIcon, getGalleryCategoryColor } from 'src/utils/file'

// Props
const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  selected: {
    type: Boolean,
    default: false
  },
  viewMode: {
    type: String,
    default: 'grid',
    validator: (value) => ['grid', 'list'].includes(value)
  }
})

// Emits
const emit = defineEmits([
  'click',
  'select',
  'view',
  'download',
  'delete',
  'edit'
])

// Refs
const showSelection = ref(false)
const fallbackImageUrl = ref('')

// Computed
const previewUrl = computed(() => {
  // For images, use thumbnailUrl if available, otherwise use fileUrl
  if (props.item.mediaType === 'Image') {
    return props.item.thumbnailUrl || props.item.fileUrl
  }

  // For videos, use thumbnailUrl if available
  if (props.item.mediaType === 'Video' && props.item.thumbnailUrl) {
    return props.item.thumbnailUrl
  }

  // For other media types, return null (will show icon)
  return null
})

// Methods
const handleClick = () => {
  emit('click', props.item)
}

const handleSelect = () => {
  emit('select', props.item)
}

const handleView = () => {
  emit('view', props.item)
}

const handleDownload = () => {
  emit('download', props.item)
}

const handleDelete = () => {
  emit('delete', props.item)
}

const handleEdit = () => {
  emit('edit', props.item)
}

const handleImageError = () => {
  // Set fallback or handle error
  console.warn('Failed to load image:', props.item.fileName)
}

const getFileIcon = () => {
  return getGalleryFileIcon(props.item.mediaType)
}

const getIconColor = () => {
  const colorMap = {
    'Image': 'blue-6',
    'Video': 'red-6',
    'Audio': 'green-6',
    'Document': 'orange-6'
  }
  return colorMap[props.item.mediaType] || 'grey-6'
}

const getCategoryIcon = (category) => {
  return getGalleryCategoryIcon(category)
}

const getCategoryColor = (category) => {
  return getGalleryCategoryColor(category)
}

const getDocumentBgColor = () => {
  const colorMap = {
    'pdf': '#ff5722',
    'doc': '#2196f3',
    'docx': '#2196f3',
    'xls': '#4caf50',
    'xlsx': '#4caf50',
    'ppt': '#ff9800',
    'pptx': '#ff9800'
  }
  const extension = getFileExtension().toLowerCase()
  return colorMap[extension] ? `${colorMap[extension]}20` : '#f5f5f5'
}

const getDocumentIconColor = () => {
  const colorMap = {
    'pdf': 'red-8',
    'doc': 'blue-8',
    'docx': 'blue-8',
    'xls': 'green-8',
    'xlsx': 'green-8',
    'ppt': 'orange-8',
    'pptx': 'orange-8'
  }
  const extension = getFileExtension().toLowerCase()
  return colorMap[extension] || 'grey-8'
}

const getFileExtension = () => {
  const fileName = props.item.originalFileName || props.item.fileName || ''
  const parts = fileName.split('.')
  return parts.length > 1 ? parts.pop().toUpperCase() : ''
}

const truncateFileName = (fileName, maxLength) => {
  if (!fileName) return ''
  if (fileName.length <= maxLength) return fileName

  const extension = getFileExtension()
  const nameWithoutExtension = fileName.substring(0, fileName.lastIndexOf('.'))
  const truncatedName = nameWithoutExtension.substring(0, maxLength - extension.length - 3)

  return `${truncatedName}...${extension.toLowerCase()}`
}

const formatDate = (dateString) => {
  if (!dateString) return ''

  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`

  return date.toLocaleDateString()
}
</script>

<style lang="scss" scoped>
// Grid View Styles
.gallery-item-card {
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

    .selection-overlay {
      opacity: 1;
    }

    .action-menu {
      opacity: 1;
    }
  }

  &.selected {
    border-color: #1976d2;
    box-shadow: 0 0 0 1px #1976d2;

    .selection-overlay {
      opacity: 1;
    }
  }
}

.selection-overlay {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.2s ease;

  .selection-checkbox {
    background: rgba(255, 255, 255, 0.9);
    border-radius: 4px;
  }
}

.media-preview {
  position: relative;
  cursor: pointer;
  height: 200px;
  overflow: hidden;

  .preview-image {
    height: 100%;
  }

  .file-icon-preview {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  .play-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 5;
    opacity: 0.8;
    transition: opacity 0.2s ease;

    &:hover {
      opacity: 1;
    }
  }

  .audio-overlay {
    position: absolute;
    bottom: 8px;
    right: 8px;
    background: rgba(0, 0, 0, 0.7);
    border-radius: 50%;
    padding: 4px;
  }

  .document-type {
    position: absolute;
    bottom: 8px;
    right: 8px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: bold;
  }
}

.card-content {
  padding: 12px;
  min-height: 80px;
  position: relative;

  .file-name {
    font-weight: 500;
    margin-bottom: 8px;
    color: #424242;
    line-height: 1.2;
  }

  .file-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .category-badge {
    margin-bottom: 4px;
  }

  .visibility-badge {
    position: absolute;
    top: 12px;
    right: 12px;
  }
}

.action-menu {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 10;

  .q-btn {
    background: rgba(255, 255, 255, 0.9);
  }
}

// List View Styles
.gallery-item-list {
  border: 1px solid transparent;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.02);

    .action-btn {
      opacity: 1;
    }
  }

  &.selected {
    background: rgba(25, 118, 210, 0.08);
    border-color: #1976d2;
  }
}

.list-thumbnail {
  border: 1px solid #e0e0e0;

  .q-img {
    border-radius: inherit;
  }
}

.file-name-list {
  font-weight: 500;
  color: #424242;
}

.file-info-list {
  .info-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 2px 0;

    .separator {
      color: #bdbdbd;
      font-size: 12px;
    }
  }
}

.list-indicators {
  display: flex;
  align-items: center;
}

.list-actions {
  display: flex;
  gap: 4px;

  .action-btn {
    opacity: 0.6;
    transition: opacity 0.2s ease;

    &:hover {
      opacity: 1;
    }
  }
}

// Responsive
@media (max-width: 768px) {
  .media-preview {
    height: 150px;
  }

  .card-content {
    padding: 8px;
    min-height: 60px;

    .file-name {
      font-size: 14px;
    }
  }

  .list-actions {
    .action-btn {
      opacity: 1; // Always show on mobile
    }
  }
}

@media (max-width: 480px) {
  .media-preview {
    height: 120px;
  }

  .card-content {
    padding: 6px;

    .file-name {
      font-size: 13px;
    }

    .file-info {
      font-size: 11px;
    }
  }

  .file-info-list {
    font-size: 12px;
  }
}

// Animation for selection state
.gallery-item-card.selected,
.gallery-item-list.selected {
  animation: selectPulse 0.3s ease;
}

@keyframes selectPulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
  100% {
    transform: scale(1);
  }
}

// Dark mode support (if needed)
.body--dark {
  .gallery-item-card {
    background: #424242;

    &:hover {
      background: #4a4a4a;
    }
  }

  .file-name,
  .file-name-list {
    color: #e0e0e0;
  }

  .list-thumbnail {
    border-color: #616161;
  }

  .selection-checkbox {
    background: rgba(66, 66, 66, 0.9);
  }

  .action-menu .q-btn {
    background: rgba(66, 66, 66, 0.9);
  }
}
</style>
