<template>
  <q-page class="notifications-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <q-breadcrumbs class="text-grey-6 q-mb-sm">
            <q-breadcrumbs-el label="Dashboard" icon="fas fa-home" :to="{ name: 'dashboard' }" />
            <q-breadcrumbs-el label="Notifications" icon="fas fa-bell" />
          </q-breadcrumbs>

          <div class="page-title">
            <q-icon name="fas fa-bell" size="32px" class="q-mr-md text-primary" />
            <div>
              <h3 class="title-text">Notifications</h3>
              <p class="title-subtitle">Manage and view all your notifications</p>
            </div>
          </div>
        </div>

        <div class="header-actions">
          <q-btn
            label="Settings"
            icon="fas fa-cog"
            color="primary"
            flat
            @click="openSettings"
            class="q-mr-sm"
          />

          <q-btn
            label="Mark all read"
            icon="fas fa-check-double"
            color="positive"
            flat
            @click="markAllAsRead"
            :loading="markingAllRead"
            :disable="unreadCount === 0"
          />
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="page-content">
      <NotificationInbox
        :show-stats="true"
        :page-size="25"
        :virtual-item-size="120"
        :auto-refresh="true"
        :refresh-interval="30000"
        @notification-click="handleNotificationClick"
        @settings-click="openSettings"
        class="notifications-inbox-component"
      />
    </div>

    <!-- Settings Dialog -->
    <NotificationSettings
      v-if="showSettingsDialog"
      @close="closeSettings"
    />

    <!-- Loading Overlay -->
    <q-inner-loading :showing="initialLoading" color="primary">
      <q-spinner-gears size="50px" />
      <div class="loading-message">Loading notifications...</div>
    </q-inner-loading>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useNotificationStore } from 'src/stores/notification'
import { useNotificationSettingsStore } from 'src/stores/notificationSettings'
import NotificationInbox from 'src/components/NotificationInbox.vue'
import NotificationSettings from 'src/pages/notifications/NotificationSettingsPage.vue'

// Composables
const router = useRouter()
const route = useRoute()
const $q = useQuasar()
const notificationStore = useNotificationStore()
const notificationSettingsStore = useNotificationSettingsStore()

// Local state
const showSettingsDialog = ref(false)
const initialLoading = ref(true)
const markingAllRead = ref(false)

// Computed properties
const unreadCount = computed(() => notificationStore.unreadCount)

// Methods
const openSettings = () => {
  showSettingsDialog.value = true
}

const closeSettings = () => {
  showSettingsDialog.value = false
}

const markAllAsRead = async () => {
  try {
    markingAllRead.value = true
    await notificationStore.markAllAsRead()

    $q.notify({
      type: 'positive',
      message: 'All notifications marked as read',
      position: 'top',
      timeout: 2000
    })
  } catch (error) {
    console.error('Error marking all as read:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to mark notifications as read',
      position: 'top'
    })
  } finally {
    markingAllRead.value = false
  }
}

const handleNotificationClick = (notification) => {
  console.log('Notification clicked on page:', notification)

  // Handle navigation based on notification type or action URL
  if (notification.actionUrl) {
    try {
      // Check if it's an internal route
      if (notification.actionUrl.startsWith('/')) {
        router.push(notification.actionUrl)
      } else {
        // External URL - open in new tab
        window.open(notification.actionUrl, '_blank')
      }
    } catch (error) {
      console.error('Error navigating to notification URL:', error)
      $q.notify({
        type: 'warning',
        message: 'Unable to navigate to notification link',
        position: 'top'
      })
    }
  }
}

const initializePage = async () => {
  try {
    initialLoading.value = true

    // Initialize stores if not already done
    if (!notificationStore.hasNotifications && !notificationStore.loading) {
      await notificationStore.initialize()
    }

    // Load notification settings for the settings dialog
    if (!notificationSettingsStore.hasSettings && !notificationSettingsStore.loading) {
      await notificationSettingsStore.loadMySettings()
    }

  } catch (error) {
    console.error('Error initializing notifications page:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to load notifications',
      position: 'top',
      actions: [
        {
          label: 'Retry',
          color: 'white',
          handler: () => initializePage()
        }
      ]
    })
  } finally {
    initialLoading.value = false
  }
}

// Handle route query parameters
const handleRouteQuery = () => {
  const query = route.query

  // If there's a settings parameter, open settings dialog
  if (query.settings === 'true') {
    openSettings()
    // Clean up URL
    router.replace({ name: route.name })
  }

  // If there's a specific notification ID to highlight
  if (query.notification) {
    // This could be handled by the NotificationInbox component
    // You could pass it as a prop or emit an event
    console.log('Highlighting notification:', query.notification)
  }
}

// Watch for route changes
watch(
  () => route.query,
  () => handleRouteQuery(),
  { immediate: true }
)

// Lifecycle
onMounted(async () => {
  // Set page meta
  document.title = 'Notifications - Gorealla Developer'

  // Handle route query parameters
  handleRouteQuery()

  // Initialize page data
  await initializePage()
})

onBeforeUnmount(() => {
  // Clean up any timers or subscriptions if needed
  notificationStore.stopAutoRefresh()
})

// Provide global error handler for the page
const handleGlobalError = (error) => {
  console.error('Global error on notifications page:', error)
  $q.notify({
    type: 'negative',
    message: 'An unexpected error occurred',
    position: 'top'
  })
}

// Watch for store errors
watch(
  () => notificationStore.error,
  (newError) => {
    if (newError) {
      handleGlobalError(newError)
    }
  }
)
</script>

<style scoped>
.notifications-page {
  background: #f8f9fa;
  min-height: 100vh;
}

/* Page Header */
.page-header {
  background: white;
  border-bottom: 1px solid #e0e0e0;
  padding: 24px 32px;
  margin-bottom: 0;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1400px;
  margin: 0 auto;
}

.header-left {
  flex: 1;
}

.page-title {
  display: flex;
  align-items: center;
  margin-top: 8px;
}

.title-text {
  font-size: 28px;
  font-weight: 600;
  color: #212121;
  margin: 0 0 4px 0;
  line-height: 1.2;
}

.title-subtitle {
  font-size: 14px;
  color: #666;
  margin: 0;
  line-height: 1.4;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Page Content */
.page-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0;
}

.notifications-inbox-component {
  background: white;
  border-radius: 0;
  box-shadow: none;
  min-height: calc(100vh - 140px);
}

/* Loading */
.loading-message {
  margin-top: 12px;
  font-size: 14px;
  color: #666;
  text-align: center;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .page-header {
    padding: 20px 24px;
  }

  .page-content {
    padding: 0;
  }

  .notifications-inbox-component {
    border-radius: 0;
  }
}

@media (max-width: 768px) {
  .page-header {
    padding: 16px 20px;
  }

  .header-content {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .header-actions {
    justify-content: flex-end;
  }

  .title-text {
    font-size: 24px;
  }

  .page-title {
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
  }

  .page-title .q-icon {
    margin-right: 0;
    margin-bottom: 8px;
  }
}

@media (max-width: 480px) {
  .page-header {
    padding: 12px 16px;
  }

  .title-text {
    font-size: 20px;
  }

  .header-actions {
    flex-direction: column;
    gap: 8px;
  }

  .header-actions .q-btn {
    width: 100%;
  }
}

/* Dark mode support */
.body--dark .notifications-page {
  background: #121212;
}

.body--dark .page-header {
  background: #1e1e1e;
  border-bottom-color: #424242;
}

.body--dark .title-text {
  color: #e0e0e0;
}

.body--dark .title-subtitle {
  color: #bdbdbd;
}

.body--dark .notifications-inbox-component {
  background: #1e1e1e;
}

.body--dark .loading-message {
  color: #bdbdbd;
}

/* Focus states for accessibility */
.q-btn:focus-visible {
  outline: 2px solid rgba(25, 118, 210, 0.3);
  outline-offset: 2px;
}

/* Animation for page load */
.notifications-page {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Loading overlay customization */
:deep(.q-inner-loading) {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
}

.body--dark :deep(.q-inner-loading) {
  background: rgba(18, 18, 18, 0.9);
}
</style>
