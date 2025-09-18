<template>
  <div class="unified-voice-search">
    <q-input
      v-model="searchText"
      :placeholder="placeholder"
      outlined
      dense
      clearable
      :loading="isProcessing"
      :readonly="isProcessing"
      @update:model-value="handleSearchInput"
      @clear="handleClear"
      @keyup.enter="handleEnterKey"
      class="voice-search-input"
    >
      <template v-slot:prepend>
        <q-icon name="search" />
      </template>

      <template v-slot:append>
        <!-- Voice Input Button -->
        <q-btn
          :icon="microphoneIcon"
          flat
          round
          dense
          size="sm"
          :color="microphoneColor"
          :class="microphoneClass"
          @click="toggleVoiceInput"
          :disable="isProcessing"
          class="voice-input-btn"
        >
          <q-tooltip>{{ microphoneTooltip }}</q-tooltip>
        </q-btn>
      </template>

      <!-- Loading message in input field -->
      <template v-if="isProcessing" v-slot:loading>
        <q-spinner-dots color="primary" size="20px" />
      </template>
    </q-input>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { showError, showWarning } from 'src/utils/notification'

// Props
const props = defineProps({
  placeholder: {
    type: String,
    default: 'Search...'
  },
  keywords: {
    type: Array,
    default: () => ["Wing B", "201", "301", "Living Room", "Kitchen","2nd Floor","Master Bedroom","Bonding Coat Application","Wing A"],
  },
  debounceMs: {
    type: Number,
    default: 300
  },
  enableVoice: {
    type: Boolean,
    default: true
  },
  apiEndpoint: {
    type: String,
    default: 'http://localhost:3000/api/v1/parse'
  }
})

// Emits
const emit = defineEmits(['search', 'voice-result', 'voice-error'])

// Reactive state
const searchText = ref('')
const isListening = ref(false)
const isProcessing = ref(false)
const originalSpeechText = ref('')
const recognition = ref(null)
const debounceTimer = ref(null)

// Voice recognition setup
const setupSpeechRecognition = () => {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    console.warn('Speech recognition not supported in this browser')
    return false
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  recognition.value = new SpeechRecognition()

  recognition.value.continuous = false
  recognition.value.interimResults = false
  recognition.value.lang = 'en-US'
  recognition.value.maxAlternatives = 1

  recognition.value.onstart = () => {
    console.log('Speech recognition started')
    isListening.value = true
  }

  recognition.value.onresult = async (event) => {
    const transcript = event.results[0][0].transcript
    console.log('Speech recognition result:', transcript)
    
    // Step 2: Display original speech text
    originalSpeechText.value = transcript
    searchText.value = transcript
    isListening.value = false

    // Step 3: Process with API
    await processVoiceInput(transcript)
  }

  recognition.value.onerror = (event) => {
    console.error('Speech recognition error:', event.error)
    isListening.value = false
    isProcessing.value = false
    
    if (event.error === 'not-allowed') {
      showError('Microphone access denied. Please enable microphone permissions.')
    } else if (event.error === 'no-speech') {
      showWarning('No speech detected. Please try again.')
    } else {
      showError('Voice recognition failed. Please try again.')
    }
    
    emit('voice-error', event.error)
  }

  recognition.value.onend = () => {
    console.log('Speech recognition ended')
    isListening.value = false
  }

  return true
}

// Computed properties
const microphoneIcon = computed(() => {
  if (isListening.value) return 'mic'
  if (isProcessing.value) return 'hourglass_empty'
  return 'mic_none'
})

const microphoneColor = computed(() => {
  if (isListening.value) return 'negative'
  if (isProcessing.value) return 'warning'
  return 'grey-6'
})

const microphoneClass = computed(() => {
  return {
    'mic-listening': isListening.value,
    'mic-processing': isProcessing.value,
    'mic-idle': !isListening.value && !isProcessing.value
  }
})

const microphoneTooltip = computed(() => {
  if (isListening.value) return 'Listening... Click to stop'
  if (isProcessing.value) return 'Processing voice input...'
  return 'Click to use voice search'
})

const isVoiceSupported = computed(() => {
  return ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window)
})

// Methods
const toggleVoiceInput = () => {
  if (!props.enableVoice || !isVoiceSupported.value) {
    showWarning('Voice input is not supported in this browser')
    return
  }

  if (isListening.value) {
    stopListening()
  } else {
    startListening()
  }
}

const startListening = () => {
  if (!recognition.value) {
    if (!setupSpeechRecognition()) {
      showError('Voice input is not available')
      return
    }
  }

  try {
    recognition.value.start()
  } catch (error) {
    console.error('Failed to start speech recognition:', error)
    showError('Failed to start voice input')
  }
}

const stopListening = () => {
  if (recognition.value && isListening.value) {
    recognition.value.stop()
  }
}

const processVoiceInput = async (speechText) => {
  try {
    // Step 3: Show processing state
    isProcessing.value = true
    searchText.value = 'We are processing your input...'

    // Prepare API request
    const requestData = {
      input: speechText,
      keywords: props.keywords,
      options: {
        threshold: 1,
        maxSuggestions: 10,
        enableLearning: true,
        preserveOrder: true,
        removeFiller: true,
        handleSynonyms: true,
        fuzzyThreshold: 1,
        maxSegmentLength: 1,
        includePartial: true,
        caseInsensitive: true,
        timeout: 5000
      }
    }

    console.log('Sending voice input to API:', requestData)

    // Call API
    const response = await fetch(props.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    const result = await response.json()
    console.log('API response:', result)

    // Step 4: Display API output and execute search
    const processedText = result.output || result.value || speechText
    searchText.value = processedText

    // Emit search with processed text
    emit('search', processedText)
    emit('voice-result', {
      original: speechText,
      processed: processedText,
      apiResponse: result
    })

  } catch (error) {
    console.error('Voice processing error:', error)
    
    // Fallback to original speech text
    searchText.value = originalSpeechText.value
    
    showError('Failed to process voice input. Using original text.')
    emit('voice-error', error.message)
    
    // Still emit search with original text
    emit('search', originalSpeechText.value)
  } finally {
    isProcessing.value = false
  }
}

const handleSearchInput = (value) => {
  // Clear debounce timer
  if (debounceTimer.value) {
    clearTimeout(debounceTimer.value)
  }

  // Don't emit search during processing state
  if (isProcessing.value) return

  // Debounce search
  debounceTimer.value = setTimeout(() => {
    emit('search', value)
  }, props.debounceMs)
}

const handleClear = () => {
  searchText.value = ''
  originalSpeechText.value = ''
  emit('search', '')
}

const handleEnterKey = () => {
  if (debounceTimer.value) {
    clearTimeout(debounceTimer.value)
  }
  emit('search', searchText.value)
}

// Lifecycle
onMounted(() => {
  if (props.enableVoice && isVoiceSupported.value) {
    setupSpeechRecognition()
  }
})

onUnmounted(() => {
  if (debounceTimer.value) {
    clearTimeout(debounceTimer.value)
  }
  
  if (recognition.value) {
    recognition.value.abort()
  }
})

// Watch for external changes
watch(() => props.keywords, () => {
  // Keywords updated - could be used for better voice processing
  console.log('Keywords updated:', props.keywords)
})
</script>

<style lang="scss" scoped>
.unified-voice-search {
  width: 100%;
}

.voice-search-input {
  width: 100%;
}

.voice-input-btn {
  transition: all 0.3s ease;
  margin-left: 4px;
}

// Microphone button states
.mic-idle {
  opacity: 0.7;
  
  &:hover {
    opacity: 1;
    transform: scale(1.1);
  }
}

.mic-listening {
  animation: micPulse 1.5s infinite;
  transform: scale(1.1);
}

.mic-processing {
  animation: micSpin 2s linear infinite;
}

// Animations
@keyframes micPulse {
  0% {
    transform: scale(1.1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
  100% {
    transform: scale(1.1);
    opacity: 1;
  }
}

@keyframes micSpin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// Input field styling
.voice-search-input :deep(.q-field__control) {
  position: relative;
}

.voice-search-input :deep(.q-field__append) {
  padding-left: 8px;
}

// Processing state styling
.voice-search-input.processing :deep(.q-field__native) {
  color: #666;
  font-style: italic;
}

// Responsive adjustments
@media (max-width: 600px) {
  .voice-input-btn {
    margin-left: 2px;
  }
}

// Dark mode support
.body--dark .voice-search-input {
  .mic-idle {
    opacity: 0.8;
  }
}

// Accessibility
.voice-input-btn:focus {
  outline: 2px solid rgba(25, 118, 210, 0.3);
  outline-offset: 2px;
}

// Disabled state
.voice-input-btn[disabled] {
  opacity: 0.3;
  cursor: not-allowed;
}
</style>