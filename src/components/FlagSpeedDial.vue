<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="flag-speed-dial-overlay"
      @click="handleOverlayClick"
    >
      <div
        class="flag-speed-dial"
        :style="dialStyle"
        @click.stop
      >
        <div class="flag-options">
          <div
            v-for="flag in flagTypes"
            :key="flag.type"
            class="flag-option"
            @click="selectFlag(flag.type)"
          >
            <q-icon
              :name="flag.icon"
              :color="flag.color"
              size="24px"
            />
            <div class="flag-label">{{ flag.label }}</div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  coordinates: {
    type: Object,
    default: () => ({ x: 0, y: 0 })
  },
  containerElement: {
    type: [HTMLElement, null],
    default: null
  }
})

// Emits
const emit = defineEmits(['flag-selected', 'close'])

// Flag types configuration
const flagTypes = ref([
  {
    type: 'red',
    icon: 'flag',
    color: 'red',
    label: 'Red Flag'
  },
  {
    type: 'green',
    icon: 'flag',
    color: 'green',
    label: 'Green Flag'
  },
  {
    type: 'yellow',
    icon: 'flag',
    color: 'orange',
    label: 'Yellow Flag'
  },
  {
    type: 'other',
    icon: 'flag',
    color: 'grey',
    label: 'Other'
  }
])

// Computed position style
const dialStyle = computed(() => {
  if (!props.visible) return {}

  let x = props.coordinates.x
  let y = props.coordinates.y

  // Adjust position to keep speed dial within viewport
  const dialWidth = 280 // Approximate width of speed dial
  const dialHeight = 80 // Approximate height of speed dial
  const padding = 20

  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  // Adjust horizontal position
  if (x + dialWidth + padding > viewportWidth) {
    x = viewportWidth - dialWidth - padding
  }
  if (x < padding) {
    x = padding
  }

  // Adjust vertical position
  if (y + dialHeight + padding > viewportHeight) {
    y = y - dialHeight - padding
  }
  if (y < padding) {
    y = padding
  }

  return {
    position: 'fixed',
    left: `${x}px`,
    top: `${y}px`,
    zIndex: 9999
  }
})

// Methods
const selectFlag = (flagType) => {
  emit('flag-selected', {
    type: flagType,
    coordinates: props.coordinates
  })
}

const handleOverlayClick = (event) => {
  // Only close if clicking on the overlay, not the speed dial itself
  if (event.target.classList.contains('flag-speed-dial-overlay')) {
    emit('close')
  }
}

// Watch for visibility changes to handle focus
watch(() => props.visible, (isVisible) => {
  if (isVisible) {
    nextTick(() => {
      // Focus management if needed
      document.addEventListener('keydown', handleEscapeKey)
    })
  } else {
    document.removeEventListener('keydown', handleEscapeKey)
  }
})

const handleEscapeKey = (event) => {
  if (event.key === 'Escape') {
    emit('close')
  }
}
</script>

<style lang="scss" scoped>
.flag-speed-dial-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9998;
  pointer-events: auto;
}

.flag-speed-dial {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  padding: 8px;
  animation: speed-dial-appear 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.flag-options {
  display: flex;
  gap: 8px;
}

.flag-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 8px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 60px;
  position: relative;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0px) scale(0.95);
  }
}

.flag-label {
  font-size: 10px;
  font-weight: 500;
  text-align: center;
  margin-top: 4px;
  color: #333;
  line-height: 1.2;
}

// Animations
@keyframes speed-dial-appear {
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(10px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

// Mobile specific styles
@media (max-width: 768px) {
  .flag-speed-dial {
    padding: 12px;
  }

  .flag-option {
    min-width: 55px;
    padding: 14px 6px 10px;
  }

  .flag-label {
    font-size: 9px;
  }
}

// Dark mode support
@media (prefers-color-scheme: dark) {
  .flag-speed-dial {
    background: rgba(30, 30, 30, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .flag-option {
    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }

  .flag-label {
    color: #f0f0f0;
  }
}

// High contrast mode
@media (prefers-contrast: high) {
  .flag-speed-dial {
    background: white;
    border: 2px solid black;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  }

  .flag-option {
    border: 1px solid #ccc;

    &:hover {
      background: #f0f0f0;
      border-color: #000;
    }
  }

  .flag-label {
    color: black;
    font-weight: 600;
  }
}

// Touch device optimizations
@media (hover: none) and (pointer: coarse) {
  .flag-option {
    min-width: 65px;
    padding: 16px 8px 12px;

    &:hover {
      transform: none;
    }

    &:active {
      background: rgba(0, 0, 0, 0.1);
      transform: scale(0.95);
    }
  }
}
</style>