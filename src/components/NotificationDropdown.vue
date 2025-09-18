<template>
  <div class="notification-dropdown-container">
    <!-- Notification Badge Trigger -->
    <NotificationBadge
      :loading="loading"
      :clickable="true"
      :tooltip="true"
      :size="badgeSize"
      :variant="badgeVariant"
      @click="toggleDropdown"
    />

    <!-- Dropdown Menu -->
    <q-menu
      ref="dropdownMenu"
      anchor="bottom right"
      self="top right"
      :offset="[0, 8]"
      :max-width="maxWidth"
      :max-height="maxHeight"
      class="notification-dropdown"
      auto-close
      :persistent="false"
      @show="onDropdownShow"
      @hide="onDropdownHide"
      @click.stop
    >
      <div class="dropdown-content" @click.stop>
        <!-- Header -->
        <div class="dropdown-header">
          <div class="header-title">
            <q-icon name="fas fa-bell" size="18px" class="q-mr-sm" />
            <span class="title-text">Notifications</span>
            <q-badge
              v-if="unreadCount > 0"
              :label="unreadCount > 99 ? '99+' : unreadCount"
              color="negative"
              rounded
              class="q-ml-sm"
            />
          </div>

          <div class="header-actions">
            <!-- Mark all as read button -->
            <q-btn
              v-if="unreadCount > 0"
              icon="fas fa-check-double"
              size="sm"
              flat
              round
              dense
              color="primary"
              @click="markAllAsRead"
              :loading="markingAllRead"
            >
              <q-tooltip>Mark all as read</q-tooltip>
            </q-btn>

            <!-- Settings button -->
            <q-btn
              icon="fas fa-cog"
              size="sm"
              flat
              round
              dense
              color="grey-6"
              @click="openSettings"
            >
              <q-tooltip>Notification settings</q-tooltip>
            </q-btn>

            <!-- Refresh button -->
            <q-btn
              icon="fas fa-sync-alt"
              size="sm"
              flat
              round
              dense
              color="grey-6"
              @click="refreshNotifications"
              :loading="refreshing"
            >
              <q-tooltip>Refresh notifications</q-tooltip>
            </q-btn>
          </div>
        </div>

        <!-- Quick filters -->
        <div v-if="showFilters" class="dropdown-filters">
          <q-btn-group flat>
            <q-btn
              :color="activeFilter === 'all' ? 'primary' : 'grey-6'"
              :outline="activeFilter !== 'all'"
              size="sm"
              label="All"
              @click="setFilter('all')"
            />
            <q-btn
              :color="activeFilter === 'unread' ? 'primary' : 'grey-6'"
              :outline="activeFilter !== 'unread'"
              size="sm"
              label="Unread"
              @click="setFilter('unread')"
              :disable="unreadCount === 0"
            />
            <q-btn
              :color="activeFilter === 'today' ? 'primary' : 'grey-6'"
              :outline="activeFilter !== 'today'"
              size="sm"
              label="Today"
              @click="setFilter('today')"
            />
          </q-btn-group>
        </div>

        <!-- Notification List -->
        <div class="dropdown-body">
          <!-- Loading state -->
          <div v-if="loading && filteredNotifications.length === 0" class="loading-state">
            <q-spinner color="primary" size="md" />
            <span class="loading-text">Loading notifications...</span>
          </div>

          <!-- Empty state -->
          <div v-else-if="filteredNotifications.length === 0" class="empty-state">
            <q-icon :name="emptyIcon" size="48px" color="grey-4" />
            <p class="empty-title">{{ emptyTitle }}</p>
            <p class="empty-subtitle">{{ emptySubtitle }}</p>
          </div>

          <!-- Notifications -->
          <div v-else class="notifications-list">
            <NotificationItem
              v-for="notification in displayedNotifications"
              :key="notification.recCode"
              :notification="notification"
              :compact="true"
              :show-actions="showItemActions"
              @click="onNotificationClick"
              @mark-read="onMarkAsRead"
              @mark-clicked="onMarkAsClicked"
              @delete="onDeleteNotification"
              class="dropdown-notification-item"
            />

            <!-- Load more button -->
            <div v-if="canLoadMore" class="load-more-container">
              <q-btn
                label="Load more"
                color="primary"
                flat
                size="sm"
                @click="loadMore"
                :loading="loadingMore"
                class="full-width"
              />
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="dropdown-footer">
          <q-btn
            :to="inboxRoute"
            label="View all notifications"
            color="primary"
            flat
            size="sm"
            icon-right="fas fa-arrow-right"
            class="full-width"
            @click="closeDropdown"
          />
        </div>
      </div>
    </q-menu>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useNotificationStore } from 'src/stores/notification'
import { useRouter } from 'vue-router'
import { Notify } from 'quasar'
import NotificationBadge from './NotificationBadge.vue'
import NotificationItem from './NotificationItem.vue'

export default {
  name: 'NotificationDropdown',

  components: {
    NotificationBadge,
    NotificationItem
  },

  props: {
    // Badge appearance
    badgeSize: {
      type: String,
      default: 'medium'
    },
    badgeVariant: {
      type: String,
      default: 'default'
    },

    // Dropdown behavior
    maxItems: {
      type: Number,
      default: 10
    },
    maxWidth: {
      type: String,
      default: '400px'
    },
    maxHeight: {
      type: String,
      default: '600px'
    },
    autoRefresh: {
      type: Boolean,
      default: true
    },
    refreshInterval: {
      type: Number,
      default: 30000 // 30 seconds
    },

    // Features
    showFilters: {
      type: Boolean,
      default: true
    },
    showItemActions: {
      type: Boolean,
      default: true
    },

    // Routes
    inboxRoute: {
      type: [String, Object],
      default: '/notifications'
    },
    settingsRoute: {
      type: [String, Object],
      default: '/notifications/settings'
    }
  },

  emits: [
    'notification-click',
    'settings-click',
    'show',
    'hide'
  ],

  setup(props, { emit }) {
    const notificationStore = useNotificationStore()
    const router = useRouter()

    // Refs
    const dropdownMenu = ref(null)
    const refreshTimer = ref(null)

    // Local state
    const activeFilter = ref('all')
    const loadingMore = ref(false)
    const refreshing = ref(false)
    const markingAllRead = ref(false)

    // Computed properties
    const loading = computed(() => notificationStore.loading)
    const unreadCount = computed(() => notificationStore.unreadCount)
    const notifications = computed(() => notificationStore.notifications)
    const recentNotifications = computed(() => notificationStore.recentNotifications)

    const filteredNotifications = computed(() => {
      const allNotifications = notifications.value.length > 0
        ? notifications.value
        : recentNotifications.value

      switch (activeFilter.value) {
        case 'unread':
          return allNotifications.filter(n => !n.isRead)
        case 'today': {
          const today = new Date().toDateString()
          return allNotifications.filter(n => {
            const notifDate = new Date(n.insertDate).toDateString()
            return notifDate === today
          })
        }
        default:
          return allNotifications
      }
    })

    const displayedNotifications = computed(() => {
      return filteredNotifications.value.slice(0, props.maxItems)
    })

    const canLoadMore = computed(() => {
      return filteredNotifications.value.length > props.maxItems &&
             notifications.value.length > 0 &&
             notificationStore.hasNext
    })

    const emptyIcon = computed(() => {
      switch (activeFilter.value) {
        case 'unread':
          return 'fas fa-check-circle'
        case 'today':
          return 'fas fa-calendar-check'
        default:
          return 'fas fa-bell-slash'
      }
    })

    const emptyTitle = computed(() => {
      switch (activeFilter.value) {
        case 'unread':
          return 'All caught up!'
        case 'today':
          return 'No notifications today'
        default:
          return 'No notifications'
      }
    })

    const emptySubtitle = computed(() => {
      switch (activeFilter.value) {
        case 'unread':
          return 'You have no unread notifications'
        case 'today':
          return 'No new notifications for today'
        default:
          return 'You\'ll see notifications here when you get them'
      }
    })

    // Methods
    const toggleDropdown = (event) => {
      event?.stopPropagation()
      if (dropdownMenu.value) {
        dropdownMenu.value.toggle(event)
      }
    }

    const closeDropdown = () => {
      if (dropdownMenu.value) {
        dropdownMenu.value.hide()
      }
    }

    const onDropdownShow = async () => {
      emit('show')

      // Load fresh data when dropdown opens
      if (notifications.value.length === 0) {
        await Promise.all([
          notificationStore.loadNotifications(),
          notificationStore.loadUnreadCount()
        ])
      } else {
        // Just refresh unread count
        notificationStore.loadUnreadCount()
      }

      // Start auto-refresh if enabled
      if (props.autoRefresh) {
        startAutoRefresh()
      }
    }

    const onDropdownHide = () => {
      emit('hide')
      stopAutoRefresh()
    }

    const setFilter = (filter) => {
      activeFilter.value = filter
    }

    const refreshNotifications = async () => {
      try {
        refreshing.value = true
        await notificationStore.refreshNotifications()
      } catch (error) {
        console.error('Error refreshing notifications:', error)
        Notify.create({
          type: 'negative',
          message: 'Failed to refresh notifications',
          position: 'top'
        })
      } finally {
        refreshing.value = false
      }
    }

    const markAllAsRead = async () => {
      try {
        markingAllRead.value = true
        await notificationStore.markAllAsRead()
      } catch (error) {
        console.error('Error marking all as read:', error)
        Notify.create({
          type: 'negative',
          message: 'Failed to mark notifications as read',
          position: 'top'
        })
      } finally {
        markingAllRead.value = false
      }
    }

    const loadMore = async () => {
      try {
        loadingMore.value = true
        await notificationStore.loadMore()
      } catch (error) {
        console.error('Error loading more notifications:', error)
        Notify.create({
          type: 'negative',
          message: 'Failed to load more notifications',
          position: 'top'
        })
      } finally {
        loadingMore.value = false
      }
    }

    const onNotificationClick = (notification) => {
      emit('notification-click', notification)

      // Mark as clicked if not already
      if (!notification.clickedTime) {
        notificationStore.markAsClicked(notification.recCode)
      }

      // Navigate if there's an action URL
      if (notification.actionUrl) {
        router.push(notification.actionUrl)
        closeDropdown()
      }
    }

    const onMarkAsRead = (notification) => {
      notificationStore.markAsRead(notification.recCode)
    }

    const onMarkAsClicked = (notification) => {
      notificationStore.markAsClicked(notification.recCode)
    }

    const onDeleteNotification = (notification) => {
      notificationStore.deleteNotification(notification.recCode)
    }

    const openSettings = () => {
      emit('settings-click')
      closeDropdown()

      if (props.settingsRoute) {
        router.push(props.settingsRoute)
      }
    }

    const startAutoRefresh = () => {
      stopAutoRefresh()
      refreshTimer.value = setInterval(() => {
        if (!refreshing.value && !loading.value) {
          notificationStore.loadUnreadCount()
          if (activeFilter.value === 'all' || activeFilter.value === 'today') {
            notificationStore.loadRecentNotifications(5)
          }
        }
      }, props.refreshInterval)
    }

    const stopAutoRefresh = () => {
      if (refreshTimer.value) {
        clearInterval(refreshTimer.value)
        refreshTimer.value = null
      }
    }

    // Lifecycle
    onMounted(() => {
      // Initialize notification store if needed
      if (!notificationStore.hasNotifications && !loading.value) {
        notificationStore.initialize()
      }
    })

    onUnmounted(() => {
      stopAutoRefresh()
    })

    // Watch for filter changes
    watch(activeFilter, (newFilter) => {
      // Reset to first page when filter changes
      if (newFilter === 'all' && notifications.value.length === 0) {
        notificationStore.loadNotifications()
      }
    })

    return {
      // Refs
      dropdownMenu,

      // Store
      notificationStore,

      // Local state
      activeFilter,
      loadingMore,
      refreshing,
      markingAllRead,

      // Computed
      loading,
      unreadCount,
      notifications,
      filteredNotifications,
      displayedNotifications,
      canLoadMore,
      emptyIcon,
      emptyTitle,
      emptySubtitle,

      // Methods
      toggleDropdown,
      closeDropdown,
      onDropdownShow,
      onDropdownHide,
      setFilter,
      refreshNotifications,
      markAllAsRead,
      loadMore,
      onNotificationClick,
      onMarkAsRead,
      onMarkAsClicked,
      onDeleteNotification,
      openSettings
    }
  }
}
</script>

<style scoped>
.notification-dropdown-container {
  position: relative;
}

.dropdown-content {
  min-width: 300px;
  max-width: 400px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

/* Header */
.dropdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px;
  border-bottom: 1px solid #e0e0e0;
  background: #fafafa;
}

.header-title {
  display: flex;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
  color: #212121;
}

.title-text {
  flex: 1;
}

.header-actions {
  display: flex;
  gap: 4px;
}

/* Filters */
.dropdown-filters {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  background: white;
}

/* Body */
.dropdown-body {
  max-height: 400px;
  overflow-y: auto;
  background: white;
}

/* Loading state */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 20px;
  gap: 12px;
}

.loading-text {
  font-size: 14px;
  color: #666;
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 20px;
  text-align: center;
}

.empty-title {
  font-size: 16px;
  font-weight: 500;
  color: #424242;
  margin: 12px 0 4px;
}

.empty-subtitle {
  font-size: 14px;
  color: #666;
  margin: 0;
  line-height: 1.4;
}

/* Notifications list */
.notifications-list {
  background: white;
}

.dropdown-notification-item {
  border-bottom: 1px solid #f5f5f5;
}

.dropdown-notification-item:last-child {
  border-bottom: none;
}

/* Load more */
.load-more-container {
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
}

/* Footer */
.dropdown-footer {
  padding: 12px 16px;
  border-top: 1px solid #e0e0e0;
  background: #fafafa;
}

/* Scrollbar styling */
.dropdown-body::-webkit-scrollbar {
  width: 6px;
}

.dropdown-body::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.dropdown-body::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.dropdown-body::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Dark mode support */
.body--dark .dropdown-content {
  background: #1e1e1e;
  border: 1px solid #424242;
}

.body--dark .dropdown-header {
  background: #2d2d2d;
  border-bottom-color: #424242;
}

.body--dark .header-title {
  color: #e0e0e0;
}

.body--dark .dropdown-filters {
  background: #1e1e1e;
  border-bottom-color: #424242;
}

.body--dark .dropdown-body {
  background: #1e1e1e;
}

.body--dark .dropdown-footer {
  background: #2d2d2d;
  border-top-color: #424242;
}

.body--dark .load-more-container {
  background: #2d2d2d;
  border-top-color: #424242;
}

.body--dark .empty-title {
  color: #e0e0e0;
}

.body--dark .empty-subtitle {
  color: #bdbdbd;
}

.body--dark .loading-text {
  color: #bdbdbd;
}

.body--dark .dropdown-notification-item {
  border-bottom-color: #333;
}

/* Responsive adjustments */
@media (max-width: 480px) {
  .dropdown-content {
    min-width: 280px;
    max-width: 320px;
  }

  .dropdown-header {
    padding: 12px 16px 8px;
  }

  .header-title {
    font-size: 15px;
  }

  .dropdown-filters {
    padding: 8px 12px;
  }

  .empty-state {
    padding: 24px 16px;
  }

  .loading-state {
    padding: 24px 16px;
  }
}

/* Animation for dropdown opening */
:global(.q-menu) {
  animation: dropdownSlide 0.2s ease-out;
}

@keyframes dropdownSlide {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
