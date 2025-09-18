<template>
  <div
    class="notification-item"
    :class="itemClass"
    @click="handleClick"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- Leading icon/avatar -->
    <div class="notification-icon">
      <q-avatar
        :size="compact ? '32px' : '40px'"
        :color="iconColor"
        :text-color="iconTextColor"
        class="notification-avatar"
      >
        <q-icon :name="iconName" :size="compact ? '16px' : '20px'" />
      </q-avatar>

      <!-- Unread indicator dot -->
      <div v-if="!notification.isRead" class="unread-dot"></div>
    </div>

    <!-- Content -->
    <div class="notification-content">
      <!-- Header with title and timestamp -->
      <div class="notification-header">
        <div class="notification-title">{{ notification.notificationContent || 'Notification' }}</div>
        <div class="notification-time">
          <q-icon name="fas fa-clock" size="12px" class="q-mr-xs" />
          {{ formatTime(notification.insertDate) }}
        </div>
      </div>

      <!-- Message/Body -->
      <div v-if="notification.message" class="notification-message">
        {{ truncatedMessage }}
      </div>

      <!-- Metadata -->
      <div v-if="showMetadata" class="notification-metadata">
        <div class="metadata-item">
          <q-icon name="fas fa-tag" size="11px" class="q-mr-xs" />
          <span>{{ formatNotificationType(notification.notificationType) }}</span>
        </div>

        <div v-if="notification.notificationChannel" class="metadata-item">
          <q-icon :name="getChannelIcon(notification.notificationChannel)" size="11px" class="q-mr-xs" />
          <span>{{ notification.notificationChannel }}</span>
        </div>

        <div v-if="notification.notificationPriority" class="metadata-item">
          <q-icon :name="getPriorityIcon(notification.notificationPriority)" size="11px" class="q-mr-xs" />
          <span>{{ notification.notificationPriority }}</span>
        </div>
      </div>

      <!-- Action buttons footer -->
      <div v-if="showActions && !compact" class="notification-actions">
        <q-btn
          v-if="!notification.isRead"
          label="Mark as read"
          size="sm"
          flat
          dense
          color="primary"
          @click.stop="markAsRead"
        />

        <q-btn
          v-if="notification.actionUrl"
          label="View"
          size="sm"
          flat
          dense
          color="primary"
          @click.stop="handleActionClick"
        />

        <q-btn
          icon="fas fa-trash"
          size="sm"
          flat
          round
          dense
          color="negative"
          @click.stop="deleteNotification"
        >
          <q-tooltip>Delete notification</q-tooltip>
        </q-btn>
      </div>
    </div>

    <!-- Hover actions (compact mode) -->
    <div v-if="showActions && compact && isHovered" class="hover-actions">
      <q-btn
        v-if="!notification.isRead"
        icon="fas fa-check"
        size="sm"
        flat
        round
        dense
        color="primary"
        @click.stop="markAsRead"
      >
        <q-tooltip>Mark as read</q-tooltip>
      </q-btn>

      <q-btn
        icon="fas fa-trash"
        size="sm"
        flat
        round
        dense
        color="negative"
        @click.stop="deleteNotification"
      >
        <q-tooltip>Delete</q-tooltip>
      </q-btn>
    </div>

    <!-- Priority indicator -->
    <div
      v-if="notification.notificationPriority && notification.notificationPriority !== 'Medium'"
      class="priority-indicator"
      :class="`priority-${notification.notificationPriority.toLowerCase()}`"
    ></div>

    <!-- Navigation loading overlay -->
    <div v-if="isNavigating" class="navigation-overlay">
      <q-spinner color="primary" size="20px" />
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { date } from 'quasar'
import navigationService from 'src/services/navigation.service'

export default {
  name: 'NotificationItem',

  props: {
    notification: {
      type: Object,
      required: true
    },
    compact: {
      type: Boolean,
      default: false
    },
    showActions: {
      type: Boolean,
      default: true
    },
    showMetadata: {
      type: Boolean,
      default: false
    },
    clickable: {
      type: Boolean,
      default: true
    },
    messageLines: {
      type: Number,
      default: 2
    },
    maxMessageLength: {
      type: Number,
      default: 120
    }
  },

  emits: [
    'click',
    'mark-read',
    'mark-clicked',
    'delete',
    'action-click'
  ],

  setup(props, { emit }) {
    const router = useRouter()

    // Local state
    const isHovered = ref(false)
    const isNavigating = ref(false)

    // Computed properties
    const itemClass = computed(() => {
      return {
        'notification-compact': props.compact,
        'notification-unread': !props.notification.isRead,
        'notification-read': props.notification.isRead,
        'notification-clickable': props.clickable,
        'notification-hovered': isHovered.value,
        'notification-navigating': isNavigating.value,
        [`priority-${props.notification.notificationPriority?.toLowerCase()}`]: props.notification.notificationPriority
      }
    })

    const iconName = computed(() => {
      // Map notification types to icons
      const typeIconMap = {
        'TASK_CREATED': 'fas fa-tasks',
        'TASK_ASSIGNED': 'fas fa-user-check',
        'TASK_UPDATED': 'fas fa-edit',
        'TASK_COMPLETED': 'fas fa-check-circle',
        'PROJECT_CREATED': 'fas fa-folder-plus',
        'PROJECT_UPDATED': 'fas fa-folder-open',
        'DEADLINE_APPROACHING': 'fas fa-clock',
        'DEADLINE_MISSED': 'fas fa-exclamation-triangle',
        'MESSAGE_RECEIVED': 'fas fa-envelope',
        'MENTION_RECEIVED': 'fas fa-at',
        'SYSTEM_ANNOUNCEMENT': 'fas fa-bullhorn',
        'NOTE_CREATED': 'fas fa-sticky-note-2',
        'NOTE_UPDATED': 'fas fa-edit',
        'MEDIA_UPLOADED': 'fas fa-image',
        'STAKEHOLDER_ASSIGNED': 'fas fa-user-plus',
        'DEFAULT': 'fas fa-bell'
      }

      return typeIconMap[props.notification.notificationType] ||
             typeIconMap.DEFAULT
    })

    const iconColor = computed(() => {
      if (!props.notification.isRead) {
        // Unread notifications have colored icons based on priority
        const priorityColors = {
          'High': 'negative',
          'Normal': 'primary',
          'Low': 'info'
        }
        return priorityColors[props.notification.notificationPriority] || 'primary'
      }
      return 'grey-5'
    })

    const iconTextColor = computed(() => {
      return !props.notification.isRead ? 'white' : 'grey-7'
    })

    const truncatedMessage = computed(() => {
      const message = props.notification.message || ''
      if (message.length <= props.maxMessageLength) {
        return message
      }
      return message.substring(0, props.maxMessageLength) + '...'
    })

    // Methods
    const formatTime = (timestamp) => {
      if (!timestamp) return ''

      const now = new Date()
      const notificationDate = new Date(timestamp)
      const diffMinutes = date.getDateDiff(now, notificationDate, 'minutes')

      if (diffMinutes < 1) {
        return 'Just now'
      } else if (diffMinutes < 60) {
        return `${diffMinutes}m ago`
      } else if (diffMinutes < 1440) { // 24 hours
        const hours = Math.floor(diffMinutes / 60)
        return `${hours}h ago`
      } else if (diffMinutes < 10080) { // 7 days
        const days = Math.floor(diffMinutes / 1440)
        return `${days}d ago`
      } else {
        return date.formatDate(notificationDate, 'MMM D')
      }
    }

    const formatNotificationType = (type) => {
      if (!type) return 'General'

      return type.replace(/_/g, ' ')
                 .split(' ')
                 .map(word => word.charAt(0) + word.slice(1).toLowerCase())
                 .join(' ')
    }

    const getChannelIcon = (channel) => {
      const channelIcons = {
        'InApp': 'fas fa-bell',
        'Email': 'fas fa-envelope',
        'SMS': 'fas fa-sms',
        'Push': 'fas fa-mobile-alt'
      }
      return channelIcons[channel] || 'fas fa-bell'
    }

    const getPriorityIcon = (priority) => {
      const priorityIcons = {
        'High': 'fas fa-exclamation-circle',
        'Normal': 'fas fa-circle',
        'Low': 'fas fa-chevron-down'
      }
      return priorityIcons[priority] || 'fas fa-circle'
    }

    const handleClick = async () => {
      if (props.clickable && !isNavigating.value) {
        emit('click', props.notification)

        // Auto-mark as clicked if not already
        if (!props.notification.clickedTime) {
          emit('mark-clicked', props.notification)
        }

        // Handle navigation for node-related notifications
        if (hasNodeNavigation(props.notification)) {
          isNavigating.value = true

          try {
            const result = await navigationService.navigateToNotification(props.notification, router)
            if (!result.success) {
              console.error('Navigation failed:', result.error)
            }
          } catch (error) {
            console.error('Navigation error:', error)
          } finally {
            isNavigating.value = false
          }
        }
        // Handle other action URLs if present
        else if (props.notification.actionUrl) {
          try {
            // Check if it's an internal route
            if (props.notification.actionUrl.startsWith('/')) {
              await router.push(props.notification.actionUrl)
            } else {
              // External URL - open in new tab
              window.open(props.notification.actionUrl, '_blank')
            }
          } catch (error) {
            console.error('Error navigating to action URL:', error)
          }
        }
      }
    }

    const hasNodeNavigation = (notification) => {
      try {
        const notificationData = JSON.parse(notification.notificationData || '{}')
        return !!notificationData.nodeId
      // eslint-disable-next-line no-unused-vars
      } catch (error) {
        return false
      }
    }

    const handleActionClick = () => {
      emit('action-click', props.notification)
      handleClick()
    }

    const markAsRead = () => {
      if (!props.notification.isRead) {
        emit('mark-read', props.notification)
      }
    }

    const deleteNotification = () => {
      emit('delete', props.notification)
    }

    return {
      // Local state
      isHovered,
      isNavigating,

      // Computed
      itemClass,
      iconName,
      iconColor,
      iconTextColor,
      truncatedMessage,

      // Methods
      formatTime,
      formatNotificationType,
      getChannelIcon,
      getPriorityIcon,
      handleClick,
      handleActionClick,
      markAsRead,
      deleteNotification
    }
  }
}
</script>

<style scoped>
.notification-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  padding: 16px 20px;
  background: white;
  transition: all 0.2s ease;
  cursor: default;
  gap: 12px;
}

.notification-clickable {
  cursor: pointer;
}

.notification-clickable:hover {
  background: #f8f9fa;
}

.notification-unread {
  background: #f3f7ff;
  border-left: 4px solid #1976d2;
}

.notification-unread:hover {
  background: #eef4ff;
}

.notification-read {
  opacity: 0.85;
}

.notification-compact {
  padding: 12px 16px;
  gap: 10px;
}

.notification-navigating {
  opacity: 0.7;
  pointer-events: none;
}

/* Icon section */
.notification-icon {
  position: relative;
  flex-shrink: 0;
}

.notification-avatar {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

.unread-dot {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  background: #f44336;
  border: 2px solid white;
  border-radius: 50%;
}

/* Content section */
.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}

.notification-title {
  font-weight: 500;
  font-size: 14px;
  color: #212121;
  line-height: 1.3;
  flex: 1;
}

.notification-unread .notification-title {
  font-weight: 600;
  color: #1976d2;
}

.notification-time {
  font-size: 11px;
  color: #757575;
  white-space: nowrap;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.notification-message {
  font-size: 13px;
  color: #424242;
  line-height: 1.4;
  margin-bottom: 8px;
  word-break: break-word;
}

.notification-compact .notification-message {
  font-size: 12px;
  margin-bottom: 6px;
}

.notification-read .notification-message {
  color: #666;
}

/* Metadata */
.notification-metadata {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 8px;
}

.metadata-item {
  display: flex;
  align-items: center;
  font-size: 11px;
  color: #757575;
}

.metadata-item span {
  text-transform: capitalize;
}

/* Actions */
.notification-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.hover-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 4px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(4px);
  border-radius: 6px;
  padding: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.notification-compact .hover-actions {
  top: 8px;
  right: 8px;
}

/* Priority indicator */
.priority-indicator {
  position: absolute;
  top: 0;
  right: 0;
  width: 4px;
  height: 100%;
  border-radius: 0 4px 4px 0;
}

.priority-high {
  background: linear-gradient(135deg, #f44336, #d32f2f);
}

.priority-high .priority-indicator {
  background: #f44336;
}

.priority-low {
  opacity: 0.9;
}

.priority-low .priority-indicator {
  background: #4caf50;
}

/* Navigation overlay */
.navigation-overlay {
  position: absolute;
  top: 50%;
  right: 16px;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  padding: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Priority-specific styling */
.notification-item.priority-high:not(.notification-read) {
  border-left-color: #f44336;
  background: #fff5f5;
}

.notification-item.priority-high:not(.notification-read):hover {
  background: #ffebee;
}

.notification-item.priority-low:not(.notification-read) {
  border-left-color: #4caf50;
  background: #f8fff8;
}

.notification-item.priority-low:not(.notification-read):hover {
  background: #f0fff0;
}

/* Compact mode adjustments */
.notification-compact .notification-title {
  font-size: 13px;
}

.notification-compact .notification-time {
  font-size: 10px;
}

.notification-compact .notification-actions {
  margin-top: 6px;
}

.notification-compact .metadata-item {
  font-size: 10px;
}

/* Dark mode support */
.body--dark .notification-item {
  background: #1e1e1e;
  border-left-color: #424242;
}

.body--dark .notification-clickable:hover {
  background: #2a2a2a;
}

.body--dark .notification-unread {
  background: #1a1f2e;
  border-left-color: #1976d2;
}

.body--dark .notification-unread:hover {
  background: #1e2332;
}

.body--dark .notification-title {
  color: #e0e0e0;
}

.body--dark .notification-unread .notification-title {
  color: #64b5f6;
}

.body--dark .notification-message {
  color: #bdbdbd;
}

.body--dark .notification-read .notification-message {
  color: #757575;
}

.body--dark .notification-time {
  color: #757575;
}

.body--dark .metadata-item {
  color: #757575;
}

.body--dark .hover-actions {
  background: rgba(42, 42, 42, 0.95);
}

.body--dark .notification-avatar {
  box-shadow: 0 1px 3px rgba(255, 255, 255, 0.1);
}

.body--dark .navigation-overlay {
  background: rgba(42, 42, 42, 0.9);
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .notification-item {
    padding: 12px 16px;
    gap: 10px;
  }

  .notification-compact {
    padding: 10px 12px;
    gap: 8px;
  }

  .notification-title {
    font-size: 13px;
  }

  .notification-message {
    font-size: 12px;
  }

  .notification-time {
    font-size: 10px;
  }

  .hover-actions {
    top: 8px;
    right: 8px;
  }

  .notification-compact .hover-actions {
    top: 6px;
    right: 6px;
  }

  .notification-actions {
    flex-wrap: wrap;
    gap: 6px;
  }
}

/* Animation for new notifications */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.notification-item.notification-new {
  animation: slideIn 0.3s ease-out;
}

/* Focus states for accessibility */
.notification-item:focus-visible {
  outline: 2px solid #1976d2;
  outline-offset: -2px;
}

.notification-item:focus-visible.notification-unread {
  outline-color: #1976d2;
}
</style>
