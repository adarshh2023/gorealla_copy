<template>
  <q-dialog
    v-model="isOpen"
    persistent
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
    class="edit-media-dialog"
  >
    <q-card class="edit-media-card">
      <!-- Header -->
      <q-card-section class="dialog-header">
        <div class="header-content">
          <div class="header-left">
            <q-icon name="edit" size="24px" class="q-mr-sm" />
            <div>
              <div class="text-h6">Edit Media</div>
              <div class="text-caption text-grey-6">
                {{ item.originalFileName || item.fileName }}
              </div>
            </div>
          </div>

          <div class="header-right">
            <q-btn
              icon="close"
              flat
              round
              dense
              v-close-popup
              @click="handleClose"
            />
          </div>
        </div>
      </q-card-section>

      <!-- Main Content -->
      <q-card-section class="dialog-content">
        <div class="edit-container">
          <!-- Media Preview -->
          <div class="media-preview-section">
            <div class="preview-container">
              <!-- Image Preview -->
              <q-img
                v-if="item.mediaType === 'Image'"
                :src="item.thumbnailUrl || item.fileUrl"
                class="preview-image"
                fit="contain"
              >
                <template v-slot:loading>
                  <div class="absolute-full flex flex-center">
                    <q-spinner-dots color="primary" size="40px" />
                  </div>
                </template>
                <template v-slot:error>
                  <div class="absolute-full flex flex-center bg-grey-3">
                    <q-icon name="broken_image" size="48px" color="grey-6" />
                  </div>
                </template>
              </q-img>

              <!-- Video Preview -->
              <div v-else-if="item.mediaType === 'Video'" class="video-preview">
                <video
                  v-if="item.thumbnailUrl"
                  :poster="item.thumbnailUrl"
                  class="preview-video"
                  controls
                  preload="none"
                >
                  <source :src="item.fileUrl" :type="item.mimeType">
                  Your browser does not support the video tag.
                </video>
                <div v-else class="file-icon-large">
                  <q-icon name="videocam" size="64px" color="grey-6" />
                </div>
              </div>

              <!-- Audio Preview -->
              <div v-else-if="item.mediaType === 'Audio'" class="audio-preview">
                <div class="audio-icon">
                  <q-icon name="audiotrack" size="64px" color="primary" />
                </div>
                <audio
                  :src="item.fileUrl"
                  controls
                  preload="none"
                  class="audio-player"
                >
                  Your browser does not support the audio tag.
                </audio>
              </div>

              <!-- Document Preview -->
              <div v-else class="document-preview">
                <div class="document-icon">
                  <q-icon :name="getFileIcon()" size="64px" color="primary" />
                  <div class="file-extension">{{ getFileExtension() }}</div>
                </div>
              </div>
            </div>

            <!-- File Info -->
            <div class="file-info-card">
              <q-list>
                <q-item>
                  <q-item-section avatar>
                    <q-icon name="info" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>File Information</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section avatar>
                    <q-icon name="insert_drive_file" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>File Name</q-item-label>
                    <q-item-label caption>{{ item.originalFileName || item.fileName }}</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section avatar>
                    <q-icon name="storage" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>File Size</q-item-label>
                    <q-item-label caption>{{ formatFileSize(item.fileSize) }}</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section avatar>
                    <q-icon name="category" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Media Type</q-item-label>
                    <q-item-label caption>{{ item.mediaType }} ({{ item.mimeType }})</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section avatar>
                    <q-icon name="schedule" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Uploaded</q-item-label>
                    <q-item-label caption>
                      {{ formatDateTime(item.uploadedDate) }}
                      <span v-if="item.uploadedByName"> by {{ item.uploadedByName }}</span>
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </div>

          <!-- Edit Form -->
          <div class="edit-form-section">
            <q-form @submit="handleSave" class="edit-form">
              <!-- Caption -->
              <div class="form-section">
                <q-input
                  v-model="formData.caption"
                  label="Caption"
                  placeholder="Add a caption or description..."
                  outlined
                  type="textarea"
                  rows="3"
                  counter
                  maxlength="500"
                  class="q-mb-md"
                >
                  <template v-slot:prepend>
                    <q-icon name="subject" />
                  </template>
                </q-input>
              </div>

              <!-- Category -->
              <div class="form-section">
                <q-select
                  v-model="formData.mediaCategory"
                  :options="categoryOptions"
                  label="Category"
                  outlined
                  emit-value
                  map-options
                  class="q-mb-md"
                >
                  <template v-slot:prepend>
                    <q-icon name="folder" />
                  </template>
                  <template v-slot:selected-item="scope">
                    <q-chip
                      v-if="scope.opt"
                      :icon="scope.opt.icon"
                      :color="scope.opt.color"
                      text-color="white"
                      size="sm"
                    >
                      {{ scope.opt.label }}
                    </q-chip>
                  </template>
                  <template v-slot:option="scope">
                    <q-item v-bind="scope.itemProps">
                      <q-item-section avatar>
                        <q-icon :name="scope.opt.icon" :color="scope.opt.color" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>{{ scope.opt.label }}</q-item-label>
                        <q-item-label caption>{{ scope.opt.description }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>

              <!-- Visibility -->
              <div class="form-section">
                <q-field
                  label="Visibility"
                  outlined
                  class="q-mb-md"
                >
                  <template v-slot:prepend>
                    <q-icon name="visibility" />
                  </template>
                  <template v-slot:control>
                    <div class="visibility-options">
                      <q-radio
                        v-model="formData.isPublic"
                        :val="true"
                        label="Public"
                        class="visibility-option"
                      />
                      <q-radio
                        v-model="formData.isPublic"
                        :val="false"
                        label="Private"
                        class="visibility-option"
                      />
                    </div>
                  </template>
                </q-field>

                <div class="visibility-description">
                  <q-icon
                    :name="formData.isPublic ? 'public' : 'lock'"
                    :color="formData.isPublic ? 'positive' : 'warning'"
                    size="16px"
                    class="q-mr-xs"
                  />
                  <span class="text-caption">
                    {{ formData.isPublic
                        ? 'This file can be viewed by anyone with access to the project'
                        : 'This file is only visible to project members'
                    }}
                  </span>
                </div>
              </div>

              <!-- Sort Order -->
              <div class="form-section">
                <q-input
                  v-model.number="formData.sortOrder"
                  label="Sort Order"
                  type="number"
                  outlined
                  min="0"
                  step="1"
                  class="q-mb-md"
                  hint="Lower numbers appear first"
                >
                  <template v-slot:prepend>
                    <q-icon name="sort" />
                  </template>
                </q-input>
              </div>

              <!-- Metadata (Advanced) -->
              <div class="form-section">
                <q-expansion-item
                  icon="settings"
                  label="Advanced Settings"
                  header-class="text-primary"
                >
                  <!-- Custom Metadata -->
                  <div class="metadata-section">
                    <div class="section-title">
                      <q-icon name="code" class="q-mr-sm" />
                      <span>Custom Metadata</span>
                    </div>

                    <div class="metadata-editor">
                      <div
                        v-for="(meta, index) in metadataItems"
                        :key="index"
                        class="metadata-item"
                      >
                        <q-input
                          v-model="meta.key"
                          label="Key"
                          outlined
                          dense
                          class="metadata-key"
                        />
                        <q-input
                          v-model="meta.value"
                          label="Value"
                          outlined
                          dense
                          class="metadata-value"
                        />
                        <q-btn
                          icon="remove"
                          flat
                          round
                          dense
                          color="negative"
                          @click="removeMetadataItem(index)"
                          class="metadata-remove"
                        />
                      </div>

                      <q-btn
                        icon="add"
                        label="Add Metadata"
                        flat
                        color="primary"
                        @click="addMetadataItem"
                        class="q-mt-sm"
                      />
                    </div>
                  </div>

                  <!-- File Actions -->
                  <div class="file-actions-section q-mt-lg">
                    <div class="section-title">
                      <q-icon name="settings" class="q-mr-sm" />
                      <span>File Actions</span>
                    </div>

                    <div class="action-buttons">
                      <q-btn
                        icon="download"
                        label="Download Original"
                        color="primary"
                        flat
                        @click="downloadFile"
                        class="q-mb-sm"
                      />

                      <q-btn
                        icon="open_in_new"
                        label="Open in New Tab"
                        color="secondary"
                        flat
                        @click="openInNewTab"
                        class="q-mb-sm"
                      />

                      <q-btn
                        icon="link"
                        label="Copy Link"
                        color="info"
                        flat
                        @click="copyFileUrl"
                        class="q-mb-sm"
                      />
                    </div>
                  </div>
                </q-expansion-item>
              </div>

              <!-- Action Buttons -->
              <div class="form-actions">
                <q-btn
                  label="Cancel"
                  flat
                  @click="handleClose"
                  class="q-mr-sm"
                />
                <q-btn
                  label="Save Changes"
                  type="submit"
                  color="primary"
                  :loading="isSaving"
                  :disable="!hasChanges"
                />
              </div>
            </q-form>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  formatFileSize,
  getGalleryFileIcon,
  getGalleryCategoryIcon,
  getGalleryCategoryColor,
  GALLERY_CATEGORIES
} from 'src/utils/file'
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
  }
})

// Emits
const emit = defineEmits([
  'update:modelValue',
  'saved',
  'close'
])

// State
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isSaving = ref(false)

// Form data
const formData = ref({
  caption: '',
  mediaCategory: '',
  isPublic: true,
  sortOrder: 0
})

const originalData = ref({})
const metadataItems = ref([])

// Options
const categoryOptions = [
  {
    label: 'Progress',
    value: GALLERY_CATEGORIES.PROGRESS,
    icon: getGalleryCategoryIcon(GALLERY_CATEGORIES.PROGRESS),
    color: getGalleryCategoryColor(GALLERY_CATEGORIES.PROGRESS),
    description: 'Construction progress photos'
  },
  {
    label: 'Issues',
    value: GALLERY_CATEGORIES.ISSUE,
    icon: getGalleryCategoryIcon(GALLERY_CATEGORIES.ISSUE),
    color: getGalleryCategoryColor(GALLERY_CATEGORIES.ISSUE),
    description: 'Problems or defects found'
  },
  {
    label: 'Before',
    value: GALLERY_CATEGORIES.BEFORE,
    icon: getGalleryCategoryIcon(GALLERY_CATEGORIES.BEFORE),
    color: getGalleryCategoryColor(GALLERY_CATEGORIES.BEFORE),
    description: 'Before work photos'
  },
  {
    label: 'After',
    value: GALLERY_CATEGORIES.AFTER,
    icon: getGalleryCategoryIcon(GALLERY_CATEGORIES.AFTER),
    color: getGalleryCategoryColor(GALLERY_CATEGORIES.AFTER),
    description: 'After work completion'
  },
  {
    label: 'Blueprint',
    value: GALLERY_CATEGORIES.BLUEPRINT,
    icon: getGalleryCategoryIcon(GALLERY_CATEGORIES.BLUEPRINT),
    color: getGalleryCategoryColor(GALLERY_CATEGORIES.BLUEPRINT),
    description: 'Technical drawings and plans'
  }
]

// Computed
const hasChanges = computed(() => {
  return JSON.stringify(formData.value) !== JSON.stringify(originalData.value) ||
         JSON.stringify(metadataItems.value) !== JSON.stringify(getOriginalMetadataItems())
})

// Methods
const initializeForm = () => {
  formData.value = {
    caption: props.item.caption || '',
    mediaCategory: props.item.mediaCategory || '',
    isPublic: props.item.isPublic !== undefined ? props.item.isPublic : true,
    sortOrder: props.item.sortOrder || 0
  }

  originalData.value = { ...formData.value }

  // Initialize metadata items
  if (props.item.metadata && typeof props.item.metadata === 'object') {
    metadataItems.value = Object.entries(props.item.metadata).map(([key, value]) => ({
      key,
      value: String(value)
    }))
  } else {
    metadataItems.value = []
  }
}

const getOriginalMetadataItems = () => {
  if (props.item.metadata && typeof props.item.metadata === 'object') {
    return Object.entries(props.item.metadata).map(([key, value]) => ({
      key,
      value: String(value)
    }))
  }
  return []
}

const addMetadataItem = () => {
  metadataItems.value.push({ key: '', value: '' })
}

const removeMetadataItem = (index) => {
  metadataItems.value.splice(index, 1)
}

const handleSave = async () => {
  isSaving.value = true

  try {
    // Prepare update data
    const updateData = {
      caption: formData.value.caption.trim(),
      mediaCategory: formData.value.mediaCategory,
      isPublic: formData.value.isPublic,
      sortOrder: formData.value.sortOrder
    }

    // Prepare metadata
    const metadata = {}
    metadataItems.value.forEach(item => {
      if (item.key.trim() && item.value.trim()) {
        metadata[item.key.trim()] = item.value.trim()
      }
    })

    if (Object.keys(metadata).length > 0) {
      updateData.metadata = metadata
    }

    // Emit save event with update data
    emit('saved', { item: props.item, updateData })

    showSuccess('Media updated successfully')
    handleClose()

  } catch (error) {
    showError('Failed to update media')
    console.error('Update error:', error)
  } finally {
    isSaving.value = false
  }
}

const handleClose = () => {
  emit('close')
}

// File actions
const downloadFile = () => {
  const link = document.createElement('a')
  link.href = props.item.fileUrl
  link.download = props.item.originalFileName || props.item.fileName
  link.click()
}

const openInNewTab = () => {
  window.open(props.item.fileUrl, '_blank')
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

// Utilities
const getFileIcon = () => {
  return getGalleryFileIcon(props.item.mediaType)
}

const getFileExtension = () => {
  const fileName = props.item.originalFileName || props.item.fileName || ''
  const parts = fileName.split('.')
  return parts.length > 1 ? parts.pop().toUpperCase() : ''
}

const formatDateTime = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString()
}

// Watchers
watch(() => props.item, initializeForm, { immediate: true })

// Lifecycle
onMounted(() => {
  initializeForm()
})
</script>

<style lang="scss" scoped>
.edit-media-dialog {
  .edit-media-card {
    height: 100vh;
    display: flex;
    flex-direction: column;
  }
}

.dialog-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px;
  flex-shrink: 0;

  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .header-left {
      display: flex;
      align-items: center;
    }
  }
}

.dialog-content {
  flex: 1;
  overflow: hidden;
  padding: 0;
}

.edit-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: 100%;
  gap: 0;
}

.media-preview-section {
  background: #f8f9fa;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.preview-container {
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  background: white;
  margin: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  .preview-image {
    max-width: 100%;
    max-height: 400px;
    border-radius: 8px;
  }

  .video-preview {
    width: 100%;
    text-align: center;

    .preview-video {
      max-width: 100%;
      max-height: 300px;
      border-radius: 8px;
    }

    .file-icon-large {
      padding: 48px;
    }
  }

  .audio-preview {
    width: 100%;
    text-align: center;

    .audio-icon {
      margin-bottom: 24px;
    }

    .audio-player {
      width: 100%;
      max-width: 400px;
    }
  }

  .document-preview {
    text-align: center;

    .document-icon {
      position: relative;
      display: inline-block;

      .file-extension {
        position: absolute;
        bottom: -8px;
        left: 50%;
        transform: translateX(-50%);
        background: #1976d2;
        color: white;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: bold;
      }
    }
  }
}

.file-info-card {
  margin: 0 24px 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.edit-form-section {
  padding: 24px;
  overflow-y: auto;
}

.edit-form {
  max-width: 500px;
}

.form-section {
  margin-bottom: 24px;
}

.visibility-options {
  display: flex;
  gap: 24px;
  padding: 12px 0;

  .visibility-option {
    flex: 1;
  }
}

.visibility-description {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 4px;
  margin-top: 8px;
}

.metadata-section {
  margin-top: 16px;

  .section-title {
    display: flex;
    align-items: center;
    font-weight: 500;
    margin-bottom: 16px;
    color: #424242;
  }

  .metadata-editor {
    .metadata-item {
      display: grid;
      grid-template-columns: 1fr 1fr auto;
      gap: 12px;
      align-items: center;
      margin-bottom: 12px;

      .metadata-key,
      .metadata-value {
        min-width: 0;
      }

      .metadata-remove {
        flex-shrink: 0;
      }
    }
  }
}

.file-actions-section {
  .section-title {
    display: flex;
    align-items: center;
    font-weight: 500;
    margin-bottom: 16px;
    color: #424242;
  }

  .action-buttons {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .q-btn {
      justify-content: flex-start;
    }
  }
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding-top: 24px;
  border-top: 1px solid #e0e0e0;
  margin-top: 24px;
}

// Responsive
@media (max-width: 1024px) {
  .edit-container {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }

  .media-preview-section {
    border-right: none;
    border-bottom: 1px solid #e0e0e0;
    max-height: 50vh;
  }

  .preview-container {
    margin: 16px;
    min-height: 200px;

    .preview-image {
      max-height: 250px;
    }
  }

  .file-info-card {
    margin: 0 16px 16px;
  }

  .edit-form-section {
    padding: 16px;
  }
}

@media (max-width: 768px) {
  .dialog-header {
    padding: 16px;
  }

  .preview-container {
    margin: 12px;
    padding: 16px;
    min-height: 150px;

    .preview-image {
      max-height: 200px;
    }
  }

  .file-info-card {
    margin: 0 12px 12px;
  }

  .edit-form-section {
    padding: 12px;
  }

  .edit-form {
    max-width: none;
  }

  .metadata-item {
    grid-template-columns: 1fr;
    gap: 8px;

    .metadata-remove {
      justify-self: end;
    }
  }

  .visibility-options {
    flex-direction: column;
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .dialog-header {
    .header-content {
      .header-left {
        .text-h6 {
          font-size: 1.1rem;
        }
      }
    }
  }

  .form-actions {
    flex-direction: column;
    gap: 12px;

    .q-btn {
      width: 100%;
    }
  }
}

// Dark mode support
.body--dark {
  .media-preview-section {
    background: #2d2d2d;
    border-right-color: #424242;
  }

  .preview-container,
  .file-info-card {
    background: #424242;
    color: #e0e0e0;
  }

  .visibility-description {
    background: #616161;
    color: #e0e0e0;
  }

  .form-actions {
    border-top-color: #424242;
  }
}

// Loading animation
.preview-container {
  .q-spinner-dots {
    opacity: 0.8;
  }
}

// Smooth transitions
.edit-container,
.preview-container,
.file-info-card {
  transition: all 0.3s ease;
}

.form-section {
  transition: margin-bottom 0.3s ease;
}

// Focus styles
.edit-form {
  .q-field--focused {
    .q-field__control {
      box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
    }
  }
}
</style>
