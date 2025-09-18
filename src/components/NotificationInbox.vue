<template>
  <div class="notification-inbox">
    <!-- Header -->
    <div class="inbox-header">
      <div class="header-title">
        <q-icon name="fas fa-bell" size="24px" class="q-mr-sm" />
        <h4 class="title-text">Notifications</h4>
        <q-badge
          v-if="unreadCount > 0"
          :label="unreadCount > 99 ? '99+' : unreadCount"
          color="negative"
          rounded
          class="q-ml-sm"
        />
      </div>

      <div class="header-actions">
        <q-btn
          v-if="unreadCount > 0"
          label="Mark all as read"
          icon="fas fa-check-double"
          color="primary"
          flat
          @click="markAllAsRead"
          :loading="markingAllRead"
        />

        <q-btn
          label="Settings"
          icon="fas fa-cog"
          color="grey-6"
          flat
          @click="openSettings"
        />

        <q-btn
          icon="fas fa-sync-alt"
          color="grey-6"
          flat
          round
          @click="refreshNotifications"
          :loading="refreshing"
        >
          <q-tooltip>Refresh notifications</q-tooltip>
        </q-btn>
      </div>
    </div>

    <!-- Filters and Search -->
    <div class="inbox-toolbar">
      <!-- Search -->
      <div class="search-container">
        <q-input
          v-model="searchQuery"
          placeholder="Search notifications..."
          dense
          outlined
          clearable
          class="search-input"
          @clear="clearSearch"
          @keyup.enter="performSearch"
        >
          <template v-slot:prepend>
            <q-icon name="fas fa-search" />
          </template>
        </q-input>
      </div>

      <!-- Filters -->
      <div class="filters-container">
        <!-- Status filter -->
        <q-select
          v-model="statusFilter"
          :options="statusOptions"
          label="Status"
          dense
          outlined
          emit-value
          map-options
          class="filter-select"
        />

        <!-- Type filter -->
        <q-select
          v-model="typeFilter"
          :options="typeOptions"
          label="Type"
          dense
          outlined
          emit-value
          map-options
          clearable
          class="filter-select"
        />

        <!-- Date filter -->
        <q-select
          v-model="dateFilter"
          :options="dateOptions"
          label="Date"
          dense
          outlined
          emit-value
          map-options
          class="filter-select"
        />
      </div>

      <!-- Sort -->
      <div class="sort-container">
        <q-select
          v-model="sortOption"
          :options="sortOptions"
          label="Sort by"
          dense
          outlined
          emit-value
          map-options
          class="sort-select"
        />
      </div>
    </div>

    <!-- Stats -->
    <div v-if="showStats" class="inbox-stats">
      <div class="stat-item">
        <span class="stat-label">Total:</span>
        <span class="stat-value">{{ totalElements }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Unread:</span>
        <span class="stat-value text-primary">{{ unreadCount }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Today:</span>
        <span class="stat-value">{{ todayCount }}</span>
      </div>
    </div>

    <!-- Notification List -->
    <div class="inbox-body">
      <!-- Loading state -->
      <div v-if="loading && notifications.length === 0" class="loading-state">
        <q-spinner color="primary" size="xl" />
        <p class="loading-text">Loading notifications...</p>
      </div>

      <!-- Empty state -->
      <div v-else-if="notifications.length === 0" class="empty-state">
        <q-icon :name="emptyIcon" size="80px" color="grey-4" />
        <h5 class="empty-title">{{ emptyTitle }}</h5>
        <p class="empty-subtitle">{{ emptySubtitle }}</p>
        <q-btn
          v-if="hasFiltersApplied"
          label="Clear filters"
          color="primary"
          flat
          @click="clearFilters"
        />
      </div>

      <!-- Notifications -->
      <div v-else class="notifications-container">
        <!-- Virtual scrolling for performance -->
        <!-- eslint-disable-next-line vue/no-unused-vars -->
        <q-virtual-scroll :items="notifications" class="notifications-virtual-list" v-slot="{ item: notification, index }">
          <NotificationItem
            :key="notification.recCode"
            :notification="notification"
            :compact="false"
            :show-actions="true"
            :show-metadata="true"
            @click="onNotificationClick"
            @mark-read="onMarkAsRead"
            @mark-clicked="onMarkAsClicked"
            @delete="onDeleteNotification"
            @action-click="onActionClick"
            class="inbox-notification-item"
          />
        </q-virtual-scroll>

        <!-- Load more button -->
        <div v-if="hasNext" class="load-more-container">
          <q-btn
            label="Load more notifications"
            color="primary"
            flat
            size="md"
            @click="loadMore"
            :loading="loadingMore"
            class="full-width"
          />
        </div>
      </div>
    </div>

    <!-- Bottom pagination -->
    <div v-if="totalPages > 1" class="inbox-pagination">
      <q-pagination
        v-model="currentPage"
        :max="totalPages"
        :max-pages="7"
        :ellipses="true"
        :boundary-numbers="true"
        color="primary"
        @update:model-value="goToPage"
      />
    </div>

    <!-- Notification Settings Dialog -->
    <NotificationSettings
      v-if="showSettingsDialog"
      @close="closeSettings"
    />
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useNotificationStore } from 'src/stores/notification'
import { useRouter, useRoute } from 'vue-router'
import { Notify } from 'quasar'
import NotificationItem from './NotificationItem.vue'
import NotificationSettings from 'src/pages/notifications/NotificationSettingsPage.vue'

export default {
  name: 'NotificationInbox',

  components: {
    NotificationItem,
    NotificationSettings
  },

  props: {
    showStats: {
      type: Boolean,
      default: true
    },
    pageSize: {
      type: Number,
      default: 20
    },
    virtualItemSize: {
      type: Number,
      default: 100
    },
    autoRefresh: {
      type: Boolean,
      default: true
    },
    refreshInterval: {
      type: Number,
      default: 60000 // 1 minute
    }
  },

  setup(props) {
    const notificationStore = useNotificationStore()
    const router = useRouter()
    const route = useRoute()

    // Local state
    const searchQuery = ref('')
    const statusFilter = ref('all')
    const typeFilter = ref(null)
    const dateFilter = ref('all')
    const sortOption = ref('newest')
    const showSettingsDialog = ref(false)
    const refreshTimer = ref(null)
    const loadingMore = ref(false)
    const refreshing = ref(false)
    const markingAllRead = ref(false)

    // Filter options
    const statusOptions = [
      { label: 'All notifications', value: 'all' },
      { label: 'Unread only', value: 'unread' },
      { label: 'Read only', value: 'read' }
    ]

    const typeOptions = computed(() => {
      const types = new Set()
      notificationStore.notifications.forEach(n => {
        if (n.notificationType) {
          types.add(n.notificationType)
        }
      })

      return Array.from(types).map(type => ({
        label: formatNotificationType(type),
        value: type
      }))
    })

    const dateOptions = [
      { label: 'All time', value: 'all' },
      { label: 'Today', value: 'today' },
      { label: 'This week', value: 'week' },
      { label: 'This month', value: 'month' }
    ]

    const sortOptions = [
      { label: 'Newest first', value: 'newest' },
      { label: 'Oldest first', value: 'oldest' },
      { label: 'Unread first', value: 'unread' }
    ]

    // Computed properties
    const loading = computed(() => notificationStore.loading)
    const notifications = computed(() => filteredNotifications.value)
    const unreadCount = computed(() => notificationStore.unreadCount)
    const totalElements = computed(() => notificationStore.totalElements)
    const totalPages = computed(() => notificationStore.totalPages)
    const currentPage = computed({
      get: () => notificationStore.currentPage + 1, // Convert to 1-based
      set: (page) => notificationStore.goToPage(page - 1) // Convert to 0-based
    })
    const hasNext = computed(() => notificationStore.hasNext)

    const filteredNotifications = computed(() => {
      let filtered = [...notificationStore.notifications]

      // Apply search filter
      if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase().trim()
        filtered = filtered.filter(notification => {
          return (
            notification.title?.toLowerCase().includes(query) ||
            notification.message?.toLowerCase().includes(query) ||
            notification.notificationType?.toLowerCase().includes(query)
          )
        })
      }

      // Apply status filter
      if (statusFilter.value === 'unread') {
        filtered = filtered.filter(n => !n.isRead)
      } else if (statusFilter.value === 'read') {
        filtered = filtered.filter(n => n.isRead)
      }

      // Apply type filter
      if (typeFilter.value) {
        filtered = filtered.filter(n => n.notificationType === typeFilter.value)
      }

      // Apply date filter
      if (dateFilter.value !== 'all') {
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

        filtered = filtered.filter(n => {
          const notifDate = new Date(n.insertDate)

          switch (dateFilter.value) {
            case 'today':
              return notifDate >= today
            case 'week': {
              const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
              return notifDate >= weekAgo
            }
            case 'month': {
              const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
              return notifDate >= monthAgo
            }
            default:
              return true
          }
        })
      }

      // Apply sorting
      filtered.sort((a, b) => {
        switch (sortOption.value) {
          case 'oldest':
            return new Date(a.insertDate) - new Date(b.insertDate)
          case 'unread':
            if (a.isRead !== b.isRead) {
              return a.isRead ? 1 : -1
            }
            return new Date(b.insertDate) - new Date(a.insertDate)
          default: // newest
            return new Date(b.insertDate) - new Date(a.insertDate)
        }
      })

      return filtered
    })

    const todayCount = computed(() => {
      const today = new Date().toDateString()
      return notificationStore.notifications.filter(n => {
        const notifDate = new Date(n.insertDate).toDateString()
        return notifDate === today
      }).length
    })

    const hasFiltersApplied = computed(() => {
      return searchQuery.value.trim() !== '' ||
             statusFilter.value !== 'all' ||
             typeFilter.value !== null ||
             dateFilter.value !== 'all'
    })

    const emptyIcon = computed(() => {
      if (hasFiltersApplied.value) {
        return 'fas fa-filter'
      }
      return statusFilter.value === 'unread' ? 'fas fa-check-circle' : 'fas fa-bell-slash'
    })

    const emptyTitle = computed(() => {
      if (hasFiltersApplied.value) {
        return 'No matching notifications'
      }
      return statusFilter.value === 'unread' ? 'All caught up!' : 'No notifications'
    })

    const emptySubtitle = computed(() => {
      if (hasFiltersApplied.value) {
        return 'Try adjusting your filters or search query'
      }
      return statusFilter.value === 'unread'
        ? 'You have no unread notifications'
        : 'You\'ll see notifications here when you get them'
    })

    // Methods
    const formatNotificationType = (type) => {
      if (!type) return 'General'

      return type.replace(/_/g, ' ')
                 .split(' ')
                 .map(word => word.charAt(0) + word.slice(1).toLowerCase())
                 .join(' ')
    }

    // eslint-disable-next-line no-unused-vars
    const loadNotifications = async (showLoading = true) => {
      try {
        const params = {
          page: 0,
          size: props.pageSize,
          sortBy: sortOption.value === 'oldest' ? 'insertDate' : 'insertDate',
          sortDir: sortOption.value === 'oldest' ? 'asc' : 'desc'
        }

        await notificationStore.loadNotifications(params)
      } catch (error) {
        console.error('Error loading notifications:', error)
        Notify.create({
          type: 'negative',
          message: 'Failed to load notifications',
          position: 'top'
        })
      }
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

    const goToPage = (page) => {
      notificationStore.goToPage(page - 1)
    }

    const clearSearch = () => {
      searchQuery.value = ''
    }

    const performSearch = () => {
      // Search is reactive, this method can be used for analytics or other side effects
      console.log('Searching for:', searchQuery.value)
    }

    const clearFilters = () => {
      searchQuery.value = ''
      statusFilter.value = 'all'
      typeFilter.value = null
      dateFilter.value = 'all'
      sortOption.value = 'newest'
    }

    const onNotificationClick = (notification) => {
      console.log('Notification clicked:', notification)

      // Mark as clicked if not already
      if (!notification.clickedTime) {
        notificationStore.markAsClicked(notification.recCode)
      }

      // Navigate if there's an action URL
      if (notification.actionUrl) {
        router.push(notification.actionUrl)
      }
    }

    const onActionClick = (notification) => {
      if (notification.actionUrl) {
        router.push(notification.actionUrl)
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
      showSettingsDialog.value = true
    }

    const closeSettings = () => {
      showSettingsDialog.value = false
    }

    const startAutoRefresh = () => {
      if (!props.autoRefresh) return

      stopAutoRefresh()
      refreshTimer.value = setInterval(async () => {
        if (!refreshing.value && !loading.value) {
          try {
            await notificationStore.loadUnreadCount()
          } catch (error) {
            console.error('Auto-refresh error:', error)
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

    // Watchers
    watch([statusFilter, typeFilter, dateFilter, sortOption], () => {
      // Reset to first page when filters change
      if (notificationStore.currentPage !== 0) {
        notificationStore.goToPage(0)
      }
    })

    // eslint-disable-next-line no-unused-vars
    watch(searchQuery, (newQuery) => {
      // Debounce search if needed
      // For now, search is reactive
    })

    // Lifecycle
    onMounted(async () => {
      // Initialize from route query params if available
      if (route.query.status) {
        statusFilter.value = route.query.status
      }
      if (route.query.type) {
        typeFilter.value = route.query.type
      }
      if (route.query.search) {
        searchQuery.value = route.query.search
      }

      // Load initial data
      if (!notificationStore.hasNotifications) {
        await loadNotifications()
      }

      // Start auto refresh
      startAutoRefresh()
    })

    onUnmounted(() => {
      stopAutoRefresh()
    })

    return {
      // Local state
      searchQuery,
      statusFilter,
      typeFilter,
      dateFilter,
      sortOption,
      showSettingsDialog,
      loadingMore,
      refreshing,
      markingAllRead,

      // Options
      statusOptions,
      typeOptions,
      dateOptions,
      sortOptions,

      // Computed
      loading,
      notifications,
      unreadCount,
      totalElements,
      totalPages,
      currentPage,
      hasNext,
      todayCount,
      hasFiltersApplied,
      emptyIcon,
      emptyTitle,
      emptySubtitle,

      // Methods
      loadNotifications,
      refreshNotifications,
      markAllAsRead,
      loadMore,
      goToPage,
      clearSearch,
      performSearch,
      clearFilters,
      onNotificationClick,
      onActionClick,
      onMarkAsRead,
      onMarkAsClicked,
      onDeleteNotification,
      openSettings,
      closeSettings
    }
  }
}
</script>

<style scoped>
.notification-inbox {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
}

/* Header */
.inbox-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 32px 16px;
  border-bottom: 1px solid #e0e0e0;
  background: white;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-title {
  display: flex;
  align-items: center;
}

.title-text {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  color: #212121;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Toolbar */
.inbox-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 32px;
  background: #fafafa;
  border-bottom: 1px solid #e0e0e0;
  flex-wrap: wrap;
}

.search-container {
  flex: 1;
  min-width: 250px;
}

.search-input {
  max-width: 400px;
}

.filters-container {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-select {
  min-width: 120px;
}

.sort-container {
  min-width: 140px;
}

/* Stats */
.inbox-stats {
  display: flex;
  gap: 24px;
  padding: 12px 32px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stat-label {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: #212121;
}

/* Body */
.inbox-body {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.notifications-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.notifications-virtual-list {
  flex: 1;
}

.inbox-notification-item {
  border-bottom: 1px solid #f0f0f0;
}

.inbox-notification-item:last-child {
  border-bottom: none;
}

/* Loading and empty states */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  text-align: center;
  padding: 32px;
}

.loading-text {
  margin-top: 16px;
  font-size: 16px;
  color: #666;
}

.empty-title {
  margin: 16px 0 8px;
  font-size: 20px;
  font-weight: 500;
  color: #424242;
}

.empty-subtitle {
  margin: 0;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  max-width: 400px;
}

/* Load more */
.load-more-container {
  padding: 20px 32px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
}

/* Pagination */
.inbox-pagination {
  padding: 20px 32px;
  display: flex;
  justify-content: center;
  border-top: 1px solid #e0e0e0;
  background: white;
}

/* Dark mode support */
.body--dark .notification-inbox {
  background: #121212;
}

.body--dark .inbox-header {
  background: #1e1e1e;
  border-bottom-color: #424242;
}

.body--dark .title-text {
  color: #e0e0e0;
}

.body--dark .inbox-toolbar {
  background: #2d2d2d;
  border-bottom-color: #424242;
}

.body--dark .inbox-stats {
  background: #1a1a1a;
  border-bottom-color: #424242;
}

.body--dark .stat-label {
  color: #bdbdbd;
}

.body--dark .stat-value {
  color: #e0e0e0;
}

.body--dark .load-more-container {
  background: #2d2d2d;
  border-top-color: #424242;
}

.body--dark .inbox-pagination {
  background: #1e1e1e;
  border-top-color: #424242;
}

.body--dark .inbox-notification-item {
  border-bottom-color: #333;
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

/* Responsive design */
@media (max-width: 1024px) {
  .inbox-header {
    padding: 20px 24px 12px;
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .header-title {
    justify-content: space-between;
  }

  .header-actions {
    justify-content: flex-end;
  }

  .inbox-toolbar {
    padding: 12px 24px;
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .filters-container {
    order: 2;
  }

  .sort-container {
    order: 3;
  }

  .inbox-stats {
    padding: 8px 24px;
    justify-content: space-around;
  }

  .load-more-container {
    padding: 16px 24px;
  }

  .inbox-pagination {
    padding: 16px 24px;
  }
}

@media (max-width: 768px) {
  .inbox-header {
    padding: 16px 20px 8px;
  }

  .title-text {
    font-size: 24px;
  }

  .inbox-toolbar {
    padding: 8px 20px;
  }

  .filters-container {
    gap: 8px;
  }

  .filter-select {
    min-width: 100px;
  }

  .inbox-stats {
    padding: 6px 20px;
    gap: 16px;
    flex-wrap: wrap;
  }

  .load-more-container {
    padding: 12px 20px;
  }

  .inbox-pagination {
    padding: 12px 20px;
  }

  .loading-state,
  .empty-state {
    height: 300px;
    padding: 24px;
  }

  .empty-title {
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .inbox-header {
    padding: 12px 16px 6px;
  }

  .title-text {
    font-size: 20px;
  }

  .inbox-toolbar {
    padding: 6px 16px;
  }

  .search-container {
    min-width: auto;
  }

  .filters-container {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-select,
  .sort-select {
    min-width: auto;
  }

  .inbox-stats {
    padding: 4px 16px;
    gap: 12px;
  }

  .stat-item {
    flex-direction: column;
    gap: 2px;
    text-align: center;
  }

  .load-more-container {
    padding: 8px 16px;
  }

  .inbox-pagination {
    padding: 8px 16px;
  }
}

/* Smooth transitions */
.notifications-container {
  transition: opacity 0.2s ease;
}

.loading-state {
  opacity: 1;
  transition: opacity 0.3s ease;
}

/* Focus states for accessibility */
.search-input:focus-within {
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
}

.filter-select:focus-within,
.sort-select:focus-within {
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
}
</style>
