<template>
  <div class="notification-badge-container" :class="containerClass">
    <!-- Main notification icon/trigger -->
    <div
      class="notification-trigger"
      :class="{ 'has-notifications': hasNotifications, 'is-loading': loading }"
      @click="handleClick"
      @click.stop
    >
      <!-- Notification icon -->
      <q-icon
        :name="icon"
        :size="iconSize"
        :color="iconColor"
        class="notification-icon"
      />

      <!-- Unread count badge -->
      <transition name="badge-bounce">
        <div
          v-if="showBadge"
          class="unread-badge"
          :class="badgeClass"
        >
          <span class="badge-text">{{ badgeText }}</span>
        </div>
      </transition>

      <!-- Loading indicator -->
      <div v-if="loading" class="loading-overlay">
        <q-circular-progress
          indeterminate
          size="16px"
          color="white"
          :thickness="0.8"
        />
      </div>
    </div>

    <!-- Tooltip -->
    <q-tooltip
      v-if="tooltip"
      anchor="bottom middle"
      self="top middle"
      :offset="[0, 8]"
      class="notification-tooltip"
    >
      {{ tooltipText }}
    </q-tooltip>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useNotificationStore } from 'src/stores/notification'

export default {
  name: 'NotificationBadge',

  props: {
    // Badge appearance
    icon: {
      type: String,
      default: 'fas fa-bell'
    },
    iconSize: {
      type: String,
      default: '20px'
    },
    iconColor: {
      type: String,
      default: 'grey-6'
    },

    // Badge behavior
    maxCount: {
      type: Number,
      default: 99
    },
    showZero: {
      type: Boolean,
      default: false
    },
    clickable: {
      type: Boolean,
      default: true
    },
    tooltip: {
      type: Boolean,
      default: true
    },

    // Override values (for manual control)
    count: {
      type: Number,
      default: null
    },
    loading: {
      type: Boolean,
      default: false
    },

    // Styling
    size: {
      type: String,
      default: 'medium',
      validator: (value) => ['small', 'medium', 'large'].includes(value)
    },
    variant: {
      type: String,
      default: 'default',
      validator: (value) => ['default', 'outline', 'flat'].includes(value)
    },
    color: {
      type: String,
      default: 'negative'
    },
    position: {
      type: String,
      default: 'top-right',
      validator: (value) => [
        'top-right', 'top-left', 'bottom-right', 'bottom-left'
      ].includes(value)
    }
  },

  emits: ['click', 'badge-click'],

  setup(props, { emit }) {
    const notificationStore = useNotificationStore()

    // Computed values
    const unreadCount = computed(() => {
      return props.count !== null ? props.count : notificationStore.unreadCount
    })

    const hasNotifications = computed(() => {
      return unreadCount.value > 0
    })

    const showBadge = computed(() => {
      return hasNotifications.value || (props.showZero && unreadCount.value === 0)
    })

    const badgeText = computed(() => {
      const count = unreadCount.value
      if (count > props.maxCount) {
        return `${props.maxCount}+`
      }
      return count.toString()
    })

    const tooltipText = computed(() => {
      const count = unreadCount.value
      if (count === 0) {
        return 'No new notifications'
      } else if (count === 1) {
        return '1 unread notification'
      } else {
        return `${count} unread notifications`
      }
    })

    const containerClass = computed(() => {
      return {
        [`badge-${props.size}`]: true,
        [`badge-${props.variant}`]: true,
        'clickable': props.clickable
      }
    })

    const badgeClass = computed(() => {
      return {
        [`bg-${props.color}`]: true,
        [`badge-position-${props.position}`]: true,
        'text-white': true,
        'badge-large-count': unreadCount.value > 99
      }
    })

    // Methods
    const handleClick = (event) => {
      event?.stopPropagation()
      event?.preventDefault()

      if (props.clickable) {
        emit('click', event)
        if (hasNotifications.value) {
          emit('badge-click', {
            count: unreadCount.value,
            event
          })
        }
      }
    }

    return {
      // Store
      notificationStore,

      // Computed
      unreadCount,
      hasNotifications,
      showBadge,
      badgeText,
      tooltipText,
      containerClass,
      badgeClass,

      // Methods
      handleClick
    }
  }
}
</script>

<style scoped>
.notification-badge-container {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.notification-trigger {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  border-radius: 50%;
  padding: 8px;
}

.clickable .notification-trigger {
  cursor: pointer;
}

.clickable .notification-trigger:hover {
  background: rgba(0, 0, 0, 0.04);
}

.notification-trigger.has-notifications .notification-icon {
  color: #1976d2 !important;
}

.notification-trigger.has-notifications:hover {
  background: rgba(25, 118, 210, 0.04);
}

.notification-trigger.is-loading {
  pointer-events: none;
}

.notification-icon {
  transition: all 0.2s ease;
}

.notification-trigger:hover .notification-icon {
  transform: scale(1.1);
}

.notification-trigger.has-notifications .notification-icon {
  animation: bellShake 0.8s ease-in-out;
}

/* Unread badge */
.unread-badge {
  position: absolute;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
  padding: 2px 4px;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
  z-index: 10;
}

.badge-text {
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.5px;
}

.badge-large-count {
  min-width: 22px;
  height: 20px;
  border-radius: 10px;
  font-size: 9px;
  padding: 2px 5px;
}

/* Badge positions */
.badge-position-top-right {
  top: -2px;
  right: -2px;
}

.badge-position-top-left {
  top: -2px;
  left: -2px;
}

.badge-position-bottom-right {
  bottom: -2px;
  right: -2px;
}

.badge-position-bottom-left {
  bottom: -2px;
  left: -2px;
}

/* Loading overlay */
.loading-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  width: 100%;
  height: 100%;
  z-index: 15;
}

/* Size variants */
.badge-small .notification-trigger {
  padding: 4px;
}

.badge-small .notification-icon {
  font-size: 16px !important;
}

.badge-small .unread-badge {
  min-width: 14px;
  height: 14px;
  border-radius: 7px;
  font-size: 8px;
  border-width: 1px;
}

.badge-small .badge-position-top-right,
.badge-small .badge-position-bottom-right {
  right: -1px;
}

.badge-small .badge-position-top-left,
.badge-small .badge-position-bottom-left {
  left: -1px;
}

.badge-small .badge-position-top-right,
.badge-small .badge-position-top-left {
  top: -1px;
}

.badge-small .badge-position-bottom-right,
.badge-small .badge-position-bottom-left {
  bottom: -1px;
}

.badge-medium .notification-trigger {
  padding: 8px;
}

.badge-large .notification-trigger {
  padding: 12px;
}

.badge-large .notification-icon {
  font-size: 24px !important;
}

.badge-large .unread-badge {
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  font-size: 11px;
}

.badge-large .badge-position-top-right,
.badge-large .badge-position-bottom-right {
  right: -3px;
}

.badge-large .badge-position-top-left,
.badge-large .badge-position-bottom-left {
  left: -3px;
}

.badge-large .badge-position-top-right,
.badge-large .badge-position-top-left {
  top: -3px;
}

.badge-large .badge-position-bottom-right,
.badge-large .badge-position-bottom-left {
  bottom: -3px;
}

/* Variant styles */
.badge-outline .notification-trigger {
  border: 1px solid #e0e0e0;
  border-radius: 50%;
}

.badge-outline .notification-trigger:hover {
  border-color: #1976d2;
  background: rgba(25, 118, 210, 0.04);
}

.badge-flat .notification-trigger {
  background: #f5f5f5;
  border-radius: 50%;
}

.badge-flat .notification-trigger:hover {
  background: rgba(25, 118, 210, 0.08);
}

/* Animations */
.badge-bounce-enter-active {
  animation: badgeBounce 0.4s ease-out;
}

.badge-bounce-leave-active {
  animation: badgeBounce 0.2s ease-in reverse;
}

@keyframes badgeBounce {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes bellShake {
  0%, 100% {
    transform: rotate(0deg);
  }
  10%, 30%, 50%, 70%, 90% {
    transform: rotate(-10deg);
  }
  20%, 40%, 60%, 80% {
    transform: rotate(10deg);
  }
}

/* Tooltip styling */
.notification-tooltip {
  font-size: 12px;
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.87);
  color: white;
  border-radius: 4px;
  max-width: 200px;
  text-align: center;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .badge-medium .notification-trigger {
    padding: 6px;
  }

  .badge-large .notification-trigger {
    padding: 8px;
  }

  .badge-large .notification-icon {
    font-size: 20px !important;
  }

  .unread-badge {
    font-size: 9px;
  }

  .badge-large .unread-badge {
    font-size: 10px;
  }
}

/* Dark mode support */
.body--dark .notification-trigger:hover {
  background: rgba(255, 255, 255, 0.1);
}

.body--dark .notification-trigger.has-notifications:hover {
  background: rgba(25, 118, 210, 0.2);
}

.body--dark .badge-outline .notification-trigger {
  border-color: #424242;
}

.body--dark .badge-flat .notification-trigger {
  background: #424242;
}

.body--dark .unread-badge {
  border-color: #1e1e1e;
}
</style>
