<template>
  <div class="image-flag-system">
    <!-- Image Display with Flag Overlay -->
    <div 
      class="image-container"
      ref="imageContainer"
      @click="handleImageClick"
    >
      <img
        ref="imageElement"
        :src="imageUrl"
        :alt="imageName"
        class="flag-image"
        @load="handleImageLoad"
        @error="handleImageError"
        draggable="false"
      />

      <!-- Flag Overlay -->
      <div class="flags-overlay">
        <div
          v-for="flag in imageFlags"
          :key="flag.id"
          class="image-flag"
          :class="`flag-${flag.type}`"
          :style="getFlagStyle(flag)"
          @click.stop="handleFlagClick(flag)"
        >
          <q-icon name="flag" size="20px" />
          <q-tooltip>{{ flag.type }} flag</q-tooltip>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="image-loading">
        <q-spinner-dots size="40px" color="primary" />
      </div>

      <!-- Error State -->
      <div v-if="hasError" class="image-error">
        <q-icon name="error" size="48px" color="negative" />
        <p>Failed to load image</p>
      </div>
    </div>

    <!-- Flag Speed Dial -->
    <FlagSpeedDial
      :visible="showSpeedDial"
      :coordinates="speedDialCoordinates"
      @flag-selected="onFlagSelected"
      @close="closeSpeedDial"
    />

    <!-- Notes Dialog -->
    <q-dialog v-model="showNotesDialog" maximized>
      <div class="notes-dialog-container">
        <div class="notes-header">
          <h5>Flag Notes</h5>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import FlagSpeedDial from './FlagSpeedDial.vue'
import NoteEditor from 'components/ProjectNodeProperties/NoteEditor.vue'

// Props
const props = defineProps({
  imageUrl: {
    type: String,
    required: true
  },
  imageName: {
    type: String,
    default: 'Image'
  },
  existingFlags: {
    type: Array,
    default: () => []
  },
  readonly: {
    type: Boolean,
    default: false
  },
  enableFlagPlacement: {
    type: Boolean,
    default: true
  }
})

// Emits
const emit = defineEmits(['flags-updated', 'flag-added', 'flag-removed'])

// Refs
const imageElement = ref(null)
const imageContainer = ref(null)

// State
const isLoading = ref(true)
const hasError = ref(false)
const imageFlags = ref([...props.existingFlags])
const imageDimensions = ref({ width: 0, height: 0 })

// Speed dial state
const showSpeedDial = ref(false)
const speedDialCoordinates = ref({ x: 0, y: 0 })
const pendingFlagCoordinates = ref(null)

// Notes dialog state
const showNotesDialog = ref(false)
const currentNoteData = ref('')
const currentFlag = ref(null)

// Methods
const handleImageLoad = () => {
  isLoading.value = false
  hasError.value = false
  
  if (imageElement.value) {
    imageDimensions.value = {
      width: imageElement.value.naturalWidth,
      height: imageElement.value.naturalHeight
    }
  }
}

const handleImageError = () => {
  isLoading.value = false
  hasError.value = true
}

const handleImageClick = (event) => {
  if (!props.enableFlagPlacement || props.readonly) return
  
  if (!showSpeedDial.value) {
    const rect = imageContainer.value.getBoundingClientRect()
    const imageRect = imageElement.value.getBoundingClientRect()
    
    // Calculate click position relative to the actual image
    const imageX = event.clientX - imageRect.left
    const imageY = event.clientY - imageRect.top
    
    // Calculate percentage coordinates relative to the image
    const percentX = (imageX / imageRect.width) * 100
    const percentY = (imageY / imageRect.height) * 100
    
    // Store coordinates for when flag is selected
    pendingFlagCoordinates.value = {
      x: event.clientX, // Screen coordinates for speed dial
      y: event.clientY,
      imageX: imageX, // Relative to image
      imageY: imageY,
      percentX: percentX, // Percentage coordinates
      percentY: percentY,
      imageWidth: imageRect.width,
      imageHeight: imageRect.height,
      naturalWidth: imageDimensions.value.width,
      naturalHeight: imageDimensions.value.height
    }

    speedDialCoordinates.value = {
      x: event.clientX,
      y: event.clientY
    }

    showSpeedDial.value = true
  }
}

const onFlagSelected = (flagData) => {
  if (pendingFlagCoordinates.value) {
    const coords = pendingFlagCoordinates.value
    
    const flag = {
      id: generateFlagId(),
      coordinates: {
        x: coords.percentX,
        y: coords.percentY
      },
      type: flagData.type,
      dimensions: {
        width: coords.naturalWidth,
        height: coords.naturalHeight
      },
      timestamp: null, // Image flags don't have timestamps
      notes_id: null // Will be set when notes are added
    }

    imageFlags.value.push(flag)
    
    // Emit events
    emit('flag-added', flag)
    emit('flags-updated', [...imageFlags.value])
  }

  closeSpeedDial()
}

const closeSpeedDial = () => {
  showSpeedDial.value = false
  pendingFlagCoordinates.value = null
}

const handleFlagClick = (flag) => {
  // Open notes dialog for this flag
  currentFlag.value = flag
  currentNoteData.value = '' // Load existing note if any
  showNotesDialog.value = true
}

const handleNoteSave = (noteData) => {
  if (currentFlag.value) {
    // Update flag with notes reference
    currentFlag.value.notes_id = noteData.id || generateNoteId()
    
    // Emit update
    emit('flags-updated', [...imageFlags.value])
  }
  
  showNotesDialog.value = false
  currentFlag.value = null
}

const handleNoteCancel = () => {
  showNotesDialog.value = false
  currentFlag.value = null
}

const removeFlag = (flagId) => {
  const flagIndex = imageFlags.value.findIndex(flag => flag.id === flagId)
  if (flagIndex > -1) {
    const removedFlag = imageFlags.value.splice(flagIndex, 1)[0]
    emit('flag-removed', removedFlag)
    emit('flags-updated', [...imageFlags.value])
  }
}

const getFlagStyle = (flag) => {
  return {
    left: `${flag.coordinates.x}%`,
    top: `${flag.coordinates.y}%`,
    transform: 'translate(-50%, -50%)'
  }
}

const generateFlagId = () => {
  return `flag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

const generateNoteId = () => {
  return `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Public methods for parent component
const addFlag = (coordinates, type) => {
  const flag = {
    id: generateFlagId(),
    coordinates: { ...coordinates },
    type,
    dimensions: { ...imageDimensions.value },
    timestamp: null,
    notes_id: null
  }
  
  imageFlags.value.push(flag)
  emit('flag-added', flag)
  emit('flags-updated', [...imageFlags.value])
  
  return flag
}

const clearAllFlags = () => {
  imageFlags.value = []
  emit('flags-updated', [])
}

const getFlags = () => {
  return [...imageFlags.value]
}

const setFlags = (flags) => {
  imageFlags.value = [...flags]
  emit('flags-updated', [...imageFlags.value])
}

// Expose methods to parent
defineExpose({
  addFlag,
  removeFlag,
  clearAllFlags,
  getFlags,
  setFlags
})

// Update flags when props change
watch(() => props.existingFlags, (newFlags) => {
  imageFlags.value = [...newFlags]
}, { deep: true })
</script>

<style lang="scss" scoped>
.image-flag-system {
  position: relative;
  width: 100%;
  height: 100%;
}

.image-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: crosshair;
  overflow: hidden;

  &.readonly {
    cursor: default;
  }
}

.flag-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  user-select: none;
  display: block;
}

.flags-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
}

.image-flag {
  position: absolute;
  pointer-events: auto;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 11;
  user-select: none;

  &.flag-red {
    color: #ff4444;
    filter: drop-shadow(0 0 4px rgba(255, 68, 68, 0.6));
  }

  &.flag-green {
    color: #44ff44;
    filter: drop-shadow(0 0 4px rgba(68, 255, 68, 0.6));
  }

  &.flag-yellow {
    color: #ffaa44;
    filter: drop-shadow(0 0 4px rgba(255, 170, 68, 0.6));
  }

  &.flag-other {
    color: #888888;
    filter: drop-shadow(0 0 4px rgba(136, 136, 136, 0.6));
  }

  &:hover {
    transform: translate(-50%, -50%) scale(1.2);
    filter: drop-shadow(0 0 8px currentColor);
  }

  &:active {
    transform: translate(-50%, -50%) scale(1.1);
  }
}

.image-loading,
.image-error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #666;
}

.image-error {
  p {
    margin-top: 16px;
    font-size: 14px;
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
    flex-shrink: 0;

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
  .image-flag {
    &:hover {
      transform: translate(-50%, -50%) scale(1.1);
    }
  }

  .notes-dialog-container {
    .notes-header {
      padding: 16px;

      h5 {
        font-size: 18px;
      }
    }

    .notes-content {
      padding: 16px;
    }
  }
}

// High contrast mode
@media (prefers-contrast: high) {
  .image-flag {
    &.flag-red {
      color: #ff0000;
      filter: drop-shadow(0 0 6px rgba(255, 0, 0, 0.8));
    }

    &.flag-green {
      color: #00ff00;
      filter: drop-shadow(0 0 6px rgba(0, 255, 0, 0.8));
    }

    &.flag-yellow {
      color: #ffaa00;
      filter: drop-shadow(0 0 6px rgba(255, 170, 0, 0.8));
    }

    &.flag-other {
      color: #666666;
      filter: drop-shadow(0 0 6px rgba(102, 102, 102, 0.8));
    }
  }
}

// Touch device optimizations
@media (hover: none) and (pointer: coarse) {
  .image-flag {
    // Larger touch targets on mobile
    padding: 4px;
    
    &:hover {
      transform: translate(-50%, -50%);
    }

    &:active {
      transform: translate(-50%, -50%) scale(1.2);
    }
  }
}

// Animation for flag appearance
.image-flag {
  animation: flag-appear 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes flag-appear {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.5) rotate(-10deg);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1) rotate(0deg);
  }
}
</style>