<template>
  <div class="video-recording-container">
    <!-- Camera Preview -->
    <div class="camera-preview-container">
      <div 
        ref="videoContainer"
        class="video-preview"
        @click="handleVideoClick"
      >
        <video
          ref="videoElement"
          class="preview-video"
          :class="{ recording: isRecording }"
          autoplay
          muted
          playsinline
        ></video>

        <!-- Recording Status Overlay -->
        <div v-if="isRecording" class="recording-status-overlay">
          <div class="recording-indicator">
            <div class="recording-dot"></div>
            <span class="recording-text">REC {{ formatTime(recordingDuration) }}</span>
          </div>
          
          <div class="flag-counter">
            <q-icon name="flag" size="16px" />
            <span>{{ totalFlags }}</span>
          </div>
        </div>

        <!-- Preview Flag Indicators -->
        <div
          v-for="flag in previewFlags"
          :key="flag.id"
          class="preview-flag"
          :class="`flag-${flag.type}`"
          :style="getFlagStyle(flag)"
        >
          <q-icon name="flag" size="16px" />
        </div>
      </div>
    </div>

    <!-- Recording Controls -->
    <div class="recording-controls">
      <div class="control-row">
        <!-- Start/Stop Recording -->
        <q-btn
          v-if="!isRecording"
          round
          size="lg"
          color="red"
          icon="videocam"
          class="record-button"
          @click="startRecording"
          :loading="isInitializing"
          :disable="!canRecord"
        >
          <q-tooltip>Start Recording</q-tooltip>
        </q-btn>

        <div v-else class="recording-actions">
          <!-- Pause/Resume -->
          <q-btn
            round
            color="orange"
            :icon="isPaused ? 'play_arrow' : 'pause'"
            @click="togglePause"
            :disable="!canRecord"
          >
            <q-tooltip>{{ isPaused ? 'Resume' : 'Pause' }}</q-tooltip>
          </q-btn>

          <!-- Stop Recording -->
          <q-btn
            round
            size="lg"
            color="red"
            icon="stop"
            class="stop-button"
            @click="stopRecording"
            :loading="isProcessing"
          >
            <q-tooltip>Stop Recording</q-tooltip>
          </q-btn>
        </div>
      </div>

      <!-- Recording Info -->
      <div v-if="!isRecording" class="recording-info">
        <p class="info-text">Tap anywhere on the video to add flags during recording</p>
        <p class="info-subtext">{{ totalFlags > 0 ? `${totalFlags} preview flags added` : 'No flags added yet' }}</p>
      </div>

      <div v-else class="recording-stats">
        <div class="stat-item">
          <q-icon name="schedule" size="16px" />
          <span>{{ formatTime(recordingDuration) }}</span>
        </div>
        <div class="stat-item">
          <q-icon name="flag" size="16px" />
          <span>{{ recordingFlags.length }} flags</span>
        </div>
      </div>
    </div>

    <!-- Speed Dial for Flag Selection -->
    <FlagSpeedDial
      :visible="showSpeedDial"
      :coordinates="speedDialCoordinates"
      @flag-selected="onFlagSelected"
      @close="closeSpeedDial"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
// import { useQuasar } from 'quasar'
import FlagSpeedDial from './FlagSpeedDial.vue'
import videoCameraService from 'src/services/camera/video-camera.service'
import { showError, showSuccess } from 'src/utils/notification'


// Emits  
const emit = defineEmits(['recording-complete', 'close', 'update:modelValue'])

// Quasar
// const $q = useQuasar()

// Refs
const videoElement = ref(null)
const videoContainer = ref(null)

// State
const isRecording = ref(false)
const isPaused = ref(false)
const isInitializing = ref(false)
const isProcessing = ref(false)
const canRecord = ref(false)
const recordingDuration = ref(0)
const previewFlags = ref([])
const recordingFlags = ref([])

// Speed dial state
const showSpeedDial = ref(false)
const speedDialCoordinates = ref({ x: 0, y: 0 })
const pendingFlagCoordinates = ref(null)

// Recording timer
let recordingTimer = null

// Computed
const totalFlags = computed(() => previewFlags.value.length + recordingFlags.value.length)

// Methods
const initializeCamera = async () => {
  try {
    isInitializing.value = true
    
    // Initialize video service
    const initialized = await videoCameraService.initialize()
    if (!initialized) {
      throw new Error('Video recording not available')
    }

    // Check permissions
    const hasPermissions = await videoCameraService.checkPermissions()
    if (!hasPermissions) {
      throw new Error('Camera and microphone permissions required')
    }

    canRecord.value = true
  } catch (error) {
    console.error('Camera initialization failed:', error)
    showError('Failed to initialize camera: ' + error.message)
    canRecord.value = false
  } finally {
    isInitializing.value = false
  }
}

const startRecording = async () => {
  try {
    isInitializing.value = true

    const result = await videoCameraService.startVideoRecording({
      width: 1920,
      height: 1080,
      facingMode: 'environment' // rear camera
    })

    if (!result.success) {
      throw new Error(result.error)
    }

    // Set video stream
    if (videoElement.value && result.stream) {
      videoElement.value.srcObject = result.stream
    }

    isRecording.value = true
    recordingDuration.value = 0
    recordingFlags.value = []

    // Start duration timer
    startRecordingTimer()

    showSuccess('Recording started')
  } catch (error) {
    console.error('Failed to start recording:', error)
    showError('Failed to start recording: ' + error.message)
  } finally {
    isInitializing.value = false
  }
}

const stopRecording = async () => {
  try {
    isProcessing.value = true
    stopRecordingTimer()

    const result = await videoCameraService.stopVideoRecording()

    if (!result.success) {
      throw new Error(result.error)
    }

    // Clean up video element
    if (videoElement.value) {
      videoElement.value.srcObject = null
    }

    isRecording.value = false
    isPaused.value = false

    // Emit recording complete with video file and metadata
    emit('recording-complete', {
      videoFile: result.videoFile,
      metadata: result.metadata,
      duration: result.duration
    })

    showSuccess('Video recorded successfully')
    
  } catch (error) {
    console.error('Failed to stop recording:', error)
    showError('Failed to stop recording: ' + error.message)
  } finally {
    // Always set isProcessing to false
    isProcessing.value = false
  }
}

const togglePause = () => {
  if (isPaused.value) {
    const resumed = videoCameraService.resumeRecording()
    if (resumed) {
      isPaused.value = false
      startRecordingTimer()
    }
  } else {
    const paused = videoCameraService.pauseRecording()
    if (paused) {
      isPaused.value = true
      stopRecordingTimer()
    }
  }
}

const handleVideoClick = (event) => {
  if (!showSpeedDial.value) {
    const rect = videoContainer.value.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // Store coordinates for when flag is selected
    pendingFlagCoordinates.value = {
      x: event.clientX, // Screen coordinates for speed dial
      y: event.clientY,
      relativeX: x, // Relative to video container
      relativeY: y,
      containerWidth: rect.width,
      containerHeight: rect.height
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
        x: coords.relativeX,
        y: coords.relativeY
      },
      type: flagData.type,
      dimensions: {
        width: coords.containerWidth,
        height: coords.containerHeight
      },
      timestamp: isRecording.value ? videoCameraService.getCurrentTimestamp() : null
    }

    // Add flag to appropriate array
    if (isRecording.value) {
      recordingFlags.value.push(flag)
      // Also add to service
      videoCameraService.addFlag(
        flag.coordinates,
        flag.type,
        flag.dimensions
      )
    } else {
      previewFlags.value.push(flag)
      // Add as preview flag to service
      videoCameraService.addFlag(
        flag.coordinates,
        flag.type,
        flag.dimensions,
        true
      )
    }
  }

  closeSpeedDial()
}

const closeSpeedDial = () => {
  showSpeedDial.value = false
  pendingFlagCoordinates.value = null
}

const startRecordingTimer = () => {
  recordingTimer = setInterval(() => {
    recordingDuration.value = videoCameraService.getRecordingDuration()
  }, 100)
}

const stopRecordingTimer = () => {
  if (recordingTimer) {
    clearInterval(recordingTimer)
    recordingTimer = null
  }
}

const getFlagStyle = (flag) => {
  if (!flag.dimensions) return {}

  return {
    left: `${(flag.coordinates.x / flag.dimensions.width) * 100}%`,
    top: `${(flag.coordinates.y / flag.dimensions.height) * 100}%`,
    transform: 'translate(-50%, -50%)'
  }
}

const formatTime = (milliseconds) => {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

const generateFlagId = () => {
  return `flag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

const cleanup = () => {
  stopRecordingTimer()
  
  if (videoElement.value && videoElement.value.srcObject) {
    const stream = videoElement.value.srcObject
    stream.getTracks().forEach(track => track.stop())
    videoElement.value.srcObject = null
  }

  videoCameraService.cleanup()
  
  isRecording.value = false
  isPaused.value = false
  recordingDuration.value = 0
  previewFlags.value = []
  recordingFlags.value = []
}

// Lifecycle
onMounted(async () => {
  await initializeCamera()
})

onUnmounted(() => {
  cleanup()
})
</script>

<style lang="scss" scoped>
.video-recording-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #000;
  position: relative;
}

.camera-preview-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.video-preview {
  position: relative;
  width: 100%;
  height: 100%;
  cursor: crosshair;

  &.recording {
    cursor: crosshair;
  }
}

.preview-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #000;

  &.recording {
    border: 3px solid #ff4444;
    animation: recording-pulse 2s infinite;
  }
}

.recording-status-overlay {
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 10;
}

.recording-indicator {
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  padding: 8px 12px;
  border-radius: 20px;
  color: white;
  font-weight: 600;
}

.recording-dot {
  width: 8px;
  height: 8px;
  background: #ff4444;
  border-radius: 50%;
  margin-right: 8px;
  animation: recording-blink 1s infinite;
}

.recording-text {
  font-size: 14px;
  font-family: 'Courier New', monospace;
}

.flag-counter {
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  padding: 8px 12px;
  border-radius: 20px;
  color: white;
  font-weight: 600;
  gap: 4px;
}

.preview-flag {
  position: absolute;
  z-index: 5;
  pointer-events: none;
  animation: flag-appear 0.3s ease-out;

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
}

.recording-controls {
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(20px);
  padding: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.control-row {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 16px;
}

.record-button {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #ff4444, #cc0000);
  border: 4px solid white;
  box-shadow: 0 4px 20px rgba(255, 68, 68, 0.4);

  &:hover {
    box-shadow: 0 6px 30px rgba(255, 68, 68, 0.6);
  }
}

.recording-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stop-button {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #ff4444, #cc0000);
  border: 4px solid white;
  box-shadow: 0 4px 20px rgba(255, 68, 68, 0.4);

  &:hover {
    box-shadow: 0 6px 30px rgba(255, 68, 68, 0.6);
  }
}

.recording-info {
  text-align: center;
  color: rgba(255, 255, 255, 0.8);

  .info-text {
    font-size: 16px;
    margin-bottom: 4px;
  }

  .info-subtext {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.6);
  }
}

.recording-stats {
  display: flex;
  justify-content: center;
  gap: 24px;
  color: white;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  font-weight: 500;
}

// Animations
@keyframes recording-pulse {
  0% {
    border-color: #ff4444;
  }
  50% {
    border-color: #ff8888;
  }
  100% {
    border-color: #ff4444;
  }
}

@keyframes recording-blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0.3;
  }
}

@keyframes flag-appear {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.5);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

// Mobile optimizations
@media (max-width: 768px) {
  .recording-controls {
    padding: 16px;
  }

  .record-button,
  .stop-button {
    width: 70px;
    height: 70px;
  }

  .recording-stats {
    gap: 16px;
  }

  .stat-item {
    font-size: 14px;
  }

  .recording-status-overlay {
    top: 16px;
    left: 16px;
    right: 16px;
  }

  .recording-indicator,
  .flag-counter {
    padding: 6px 10px;
    font-size: 12px;
  }
}

// Dark mode and high contrast
@media (prefers-color-scheme: dark) {
  .recording-controls {
    background: rgba(0, 0, 0, 0.9);
  }
}

@media (prefers-contrast: high) {
  .recording-indicator,
  .flag-counter {
    background: rgba(0, 0, 0, 0.9);
    border: 1px solid white;
  }

  .preview-flag {
    filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.8));
  }
}

// Landscape mode adjustments
@media (orientation: landscape) and (max-height: 600px) {
  .recording-controls {
    padding: 12px 24px;
  }

  .control-row {
    margin-bottom: 8px;
  }

  .record-button,
  .stop-button {
    width: 60px;
    height: 60px;
  }
}
</style>