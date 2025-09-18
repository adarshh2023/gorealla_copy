<template>
  <q-dialog
    v-model="isOpen"
    persistent
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
    class="camera-capture-dialog"
  >
    <q-card class="capture-dialog-card">
      <!-- Header -->
      <q-card-section class="dialog-header">
        <div class="header-content">
          <div class="header-left">
            <q-icon name="photo_camera" size="24px" class="q-mr-sm" />
            <div>
              <div class="text-h6">Add Photo</div>
              <div class="text-caption text-grey-6">
                {{ imageData?.source === 'camera' ? 'Camera Capture' : 'Photo Library' }}
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
        <div class="capture-container">
          <!-- Photo Preview -->
          <div class="photo-preview-section">
            <div class="preview-container">
              <img
                v-if="imageData?.dataUrl"
                :src="imageData.dataUrl"
                class="preview-image"
                alt="Captured photo"
              />
              <div v-else class="preview-placeholder">
                <q-icon name="image" size="64px" color="grey-5" />
                <p class="text-grey-6 q-mt-md">No image to preview</p>
              </div>
            </div>

            <!-- Photo Info -->
            <div class="photo-info-card">
              <q-list>
                <q-item>
                  <q-item-section avatar>
                    <q-icon name="info" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Photo Information</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section avatar>
                    <q-icon name="camera_alt" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Source</q-item-label>
                    <q-item-label caption>
                      {{ getSourceDescription() }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section avatar>
                    <q-icon name="image" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Format</q-item-label>
                    <q-item-label caption>{{ imageData?.format?.toUpperCase() || 'JPEG' }}</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section avatar>
                    <q-icon name="schedule" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Captured</q-item-label>
                    <q-item-label caption>{{ formatDateTime(new Date()) }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </div>

          <!-- Form Section -->
          <div class="form-section">
            <q-form @submit="handleSave" class="capture-form">
              <!-- Title -->
              <div class="form-group">
                <q-input
                  v-model="formData.title"
                  label="Title"
                  placeholder="Enter a title for this photo..."
                  outlined
                  maxlength="100"
                  counter
                  class="q-mb-md"
                >
                  <template v-slot:prepend>
                    <q-icon name="title" />
                  </template>
                </q-input>
              </div>

              <!-- Description -->
              <div class="form-group">
                <q-input
                  v-model="formData.description"
                  label="Description"
                  placeholder="Add a description or notes about this photo..."
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
              <div class="form-group">
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
              <div class="form-group">
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
                        ? 'This photo can be viewed by anyone with access to the project'
                        : 'This photo is only visible to project members'
                    }}
                  </span>
                </div>
              </div>

              <!-- Tags -->
              <div class="form-group">
                <q-select
                  v-model="formData.tags"
                  label="Tags"
                  outlined
                  multiple
                  use-input
                  use-chips
                  new-value-mode="add-unique"
                  placeholder="Add tags to organize your photo..."
                  class="q-mb-md"
                >
                  <template v-slot:prepend>
                    <q-icon name="local_offer" />
                  </template>
                  <template v-slot:hint>
                    Type tag names and press Enter to add
                  </template>
                </q-select>
              </div>

              <!-- Sort Order -->
              <div class="form-group">
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

              <!-- Quick Actions -->
              <div class="quick-actions">
                <div class="section-title">
                  <q-icon name="flash_on" class="q-mr-sm" />
                  <span>Quick Actions</span>
                </div>

                <div class="action-chips">
                  <q-chip
                    clickable
                    color="primary"
                    text-color="white"
                    icon="timeline"
                    @click="applyQuickSettings('progress')"
                  >
                    Progress Photo
                  </q-chip>

                  <q-chip
                    clickable
                    color="negative"
                    text-color="white"
                    icon="report_problem"
                    @click="applyQuickSettings('issue')"
                  >
                    Issue Found
                  </q-chip>

                  <q-chip
                    clickable
                    color="info"
                    text-color="white"
                    icon="history"
                    @click="applyQuickSettings('before')"
                  >
                    Before Work
                  </q-chip>

                  <q-chip
                    clickable
                    color="positive"
                    text-color="white"
                    icon="update"
                    @click="applyQuickSettings('after')"
                  >
                    After Work
                  </q-chip>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="form-actions">
                <q-btn
                  label="Retake"
                  icon="camera_alt"
                  flat
                  @click="handleRetake"
                  class="q-mr-sm"
                />
                <q-btn
                  label="Cancel"
                  flat
                  @click="handleClose"
                  class="q-mr-sm"
                />
                <q-btn
                  label="Save Photo"
                  type="submit"
                  color="primary"
                  icon="save"
                  :loading="isSaving"
                  :disable="!canSave"
                />
                <br/><br/><br/>
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
import { useGalleryStore } from 'stores/gallery'
import { GALLERY_CATEGORIES } from 'src/utils/file'
import { showError } from 'src/utils/notification'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  imageData: {
    type: Object,
    required: true
  },
  nodeId: {
    type: String,
    required: true
  }
})

// Emits
const emit = defineEmits([
  'update:modelValue',
  'saved',
  'close',
  'retake'
])

// Store
const galleryStore = useGalleryStore()

// State
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isSaving = ref(false)

// Form data
const formData = ref({
  title: '',
  description: '',
  mediaCategory: GALLERY_CATEGORIES.PROGRESS,
  isPublic: true,
  sortOrder: 0,
  tags: []
})

// Options
const categoryOptions = [
  {
    label: 'Progress',
    value: GALLERY_CATEGORIES.PROGRESS,
    icon: 'timeline',
    color: 'primary',
    description: 'Construction progress photos'
  },
  {
    label: 'Issues',
    value: GALLERY_CATEGORIES.ISSUE,
    icon: 'report_problem',
    color: 'negative',
    description: 'Problems or defects found'
  },
  {
    label: 'Before',
    value: GALLERY_CATEGORIES.BEFORE,
    icon: 'history',
    color: 'info',
    description: 'Before work photos'
  },
  {
    label: 'After',
    value: GALLERY_CATEGORIES.AFTER,
    icon: 'update',
    color: 'positive',
    description: 'After work completion'
  },
  {
    label: 'Blueprint',
    value: GALLERY_CATEGORIES.BLUEPRINT,
    icon: 'architecture',
    color: 'purple',
    description: 'Technical drawings and plans'
  }
]

// Computed
const canSave = computed(() => {
  return props.imageData?.dataUrl && formData.value.title.trim()
})

// Methods
const initializeForm = () => {
  // Generate default title based on category and timestamp
  const now = new Date()
  const timestamp = now.toLocaleString()

  formData.value = {
    title: `Photo ${timestamp}`,
    description: '',
    mediaCategory: GALLERY_CATEGORIES.PROGRESS,
    isPublic: true,
    sortOrder: 0,
    tags: []
  }
}

const applyQuickSettings = (type) => {
  switch (type) {
    case 'progress':
      formData.value.mediaCategory = GALLERY_CATEGORIES.PROGRESS
      formData.value.title = `Progress Photo ${new Date().toLocaleDateString()}`
      formData.value.tags = ['progress', 'construction']
      break
    case 'issue':
      formData.value.mediaCategory = GALLERY_CATEGORIES.ISSUE
      formData.value.title = `Issue Found ${new Date().toLocaleDateString()}`
      formData.value.tags = ['issue', 'problem']
      formData.value.isPublic = false
      break
    case 'before':
      formData.value.mediaCategory = GALLERY_CATEGORIES.BEFORE
      formData.value.title = `Before Work ${new Date().toLocaleDateString()}`
      formData.value.tags = ['before', 'baseline']
      break
    case 'after':
      formData.value.mediaCategory = GALLERY_CATEGORIES.AFTER
      formData.value.title = `After Work ${new Date().toLocaleDateString()}`
      formData.value.tags = ['after', 'completed']
      break
  }
}

const handleSave = async () => {
  if (!canSave.value) return

  isSaving.value = true

  try {
    // Optimize image before upload
    const optimizedImage = await optimizeImageData(props.imageData.dataUrl)

    // Convert data URL to File object
    const file = await dataUrlToFile(
      // props.imageData.dataUrl,
      optimizedImage.dataUrl,
      formData.value.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.jpg'
    )

    console.log('Original size:', getEstimatedFileSize(props.imageData.dataUrl))
    console.log('Optimized size:', getEstimatedFileSize(optimizedImage.dataUrl))

    // Prepare upload data
    const uploadData = {
      nodeId: props.nodeId,
      mediaCategory: formData.value.mediaCategory,
      isPublic: formData.value.isPublic,
      sortOrder: formData.value.sortOrder,
      caption: formData.value.description.trim(),
      metadata: {
        title: formData.value.title.trim(),
        source: props.imageData.source,
        cameraDirection: props.imageData.direction,
        tags: formData.value.tags.join(','),
        capturedAt: new Date().toISOString()
      }
    }

    // Upload using gallery store
    const result = await galleryStore.uploadSingleFile(file, uploadData)

    if (result.results && result.results.length > 0) {
      emit('saved', result.results[0])
      handleClose()
    } else {
      throw new Error('Upload failed - no result returned')
    }

  } catch (error) {
    console.error('Camera capture save error:', error)
    showError('Failed to save photo')
  } finally {
    isSaving.value = false
  }
}

const handleRetake = () => {
  emit('retake')
  handleClose()
}

const handleClose = () => {
  emit('close')
}

// Utility methods
// Add optimization function
const optimizeImageData = (dataUrl) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Target dimensions
      const maxWidth = 1920
      const maxHeight = 1080
      const quality = 0.8

      let { width, height } = img

      // Calculate resize ratio
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

      const optimizedDataUrl = canvas.toDataURL('image/jpeg', quality)

      resolve({
        dataUrl: optimizedDataUrl,
        width,
        height,
        quality
      })
    }

    img.src = dataUrl
  })
}

const getEstimatedFileSize = (dataUrl) => {
  const base64 = dataUrl.split(',')[1]
  const sizeInBytes = (base64.length * 3) / 4
  return {
    bytes: Math.round(sizeInBytes),
    kb: Math.round(sizeInBytes / 1024),
    mb: Math.round((sizeInBytes / 1024 / 1024) * 100) / 100
  }
}

const dataUrlToFile = (dataUrl, filename) => {
  return new Promise((resolve) => {
    const arr = dataUrl.split(',')
    const mime = arr[0].match(/:(.*?);/)[1]
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }

    resolve(new File([u8arr], filename, { type: mime }))
  })
}

const getSourceDescription = () => {
  if (!props.imageData) return 'Unknown'

  if (props.imageData.source === 'camera') {
    const direction = props.imageData.direction === 'front' ? 'Front' : 'Back'
    return `${direction} Camera`
  } else if (props.imageData.source === 'gallery') {
    return 'Photo Library'
  }

  return 'Camera'
}

const formatDateTime = (date) => {
  return date.toLocaleString()
}

// Watchers
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    initializeForm()
  }
})

// Lifecycle
onMounted(() => {
  if (props.modelValue) {
    initializeForm()
  }
})
</script>

<style lang="scss" scoped>
.camera-capture-dialog {
  .capture-dialog-card {
    height: 100vh;
    display: flex;
    flex-direction: column;
  }
}

.dialog-header {
  background: linear-gradient(135deg, #26a69a 0%, #00897b 100%);
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

.capture-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: 100%;
  gap: 0;
}

.photo-preview-section {
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
    object-fit: contain;
  }

  .preview-placeholder {
    text-align: center;
    color: #999;
  }
}

.photo-info-card {
  margin: 0 24px 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.form-section {
  padding: 24px;
  overflow-y: auto;
}

.capture-form {
  max-width: 500px;
}

.form-group {
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

.quick-actions {
  margin-bottom: 32px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;

  .section-title {
    display: flex;
    align-items: center;
    font-weight: 500;
    margin-bottom: 16px;
    color: #424242;
  }

  .action-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding-top: 24px;
  border-top: 1px solid #e0e0e0;
  margin-top: 24px;
  gap: 12px;
}

// Responsive
@media (max-width: 1024px) {
  .capture-container {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }

  .photo-preview-section {
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

  .photo-info-card {
    margin: 0 16px 16px;
  }

  .form-section {
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

  .photo-info-card {
    margin: 0 12px 12px;
  }

  .form-section {
    padding: 12px;
  }

  .capture-form {
    max-width: none;
  }

  .visibility-options {
    flex-direction: column;
    gap: 12px;
  }

  .action-chips {
    flex-direction: column;

    .q-chip {
      width: 100%;
      justify-content: center;
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

  .quick-actions {
    padding: 16px;
  }
}

// Dark mode support
.body--dark {
  .photo-preview-section {
    background: #2d2d2d;
    border-right-color: #424242;
  }

  .preview-container,
  .photo-info-card {
    background: #424242;
    color: #e0e0e0;
  }

  .visibility-description {
    background: #616161;
    color: #e0e0e0;
  }

  .quick-actions {
    background: #424242;
  }

  .form-actions {
    border-top-color: #424242;
  }
}

// Smooth transitions
.capture-container,
.preview-container,
.photo-info-card {
  transition: all 0.3s ease;
}

.form-group {
  transition: margin-bottom 0.3s ease;
}

// Focus styles
.capture-form {
  .q-field--focused {
    .q-field__control {
      box-shadow: 0 0 0 2px rgba(38, 166, 154, 0.2);
    }
  }
}
</style>
