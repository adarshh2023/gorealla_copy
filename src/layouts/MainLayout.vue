<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title>
          Gorealla Developer
        </q-toolbar-title>

        <!-- User Profile Section -->
        <div class="row items-center q-gutter-sm">
          <!-- User Info -->
          <div class="column items-end text-right q-mr-sm" v-if="user">
            <div class="text-body2 text-weight-medium">{{ user.fullName || user.email }}</div>
            <div class="text-caption text-grey-6">{{ user.userRole }}</div>
          </div>

          <!-- Notification Dropdown -->
          <NotificationDropdown
            badge-size="medium"
            badge-variant="default"
            :max-items="8"
            :show-filters="true"
            :show-item-actions="true"
            :auto-refresh="true"
            :refresh-interval="30000"
            inbox-route="/menu/notifications"
            settings-route="/menu/notifications/settings"
            @notification-click="handleNotificationClick"
            @settings-click="handleNotificationSettingsClick"
            @show="onNotificationDropdownShow"
            @hide="onNotificationDropdownHide"
            class="notification-dropdown-header"
          />

          <!-- Profile Menu -->
          <q-btn-dropdown
            flat
            round
            dense
            :icon="user?.profilePicture ? 'account_circle' : 'account_circle'"
            dropdown-icon="none"
          >
            <q-list style="min-width: 200px">
              <q-item-label header>Account</q-item-label>

              <q-item clickable v-close-popup @click="goToProfile">
                <q-item-section avatar>
                  <q-icon name="person" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Profile</q-item-label>
                  <q-item-label caption>Manage your account</q-item-label>
                </q-item-section>
              </q-item>

              <q-item clickable v-close-popup @click="goToSettings">
                <q-item-section avatar>
                  <q-icon name="settings" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Settings</q-item-label>
                  <q-item-label caption>App preferences</q-item-label>
                </q-item-section>
              </q-item>

              <q-separator />

              <q-item clickable v-close-popup @click="handleLogout">
                <q-item-section avatar>
                  <q-icon name="logout" color="negative" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-negative">Logout</q-item-label>
                  <q-item-label caption>Sign out of your account</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
    >
      <q-list>
        <q-item-label header>
          Navigation
        </q-item-label>

        <!-- Dashboard -->
        <q-item
          clickable
          :active="$route.path === '/menu/dashboard'"
          active-class="text-primary bg-blue-1"
          @click="navigateTo('/menu/dashboard')"
        >
          <q-item-section avatar>
            <q-icon name="fas fa-chart-pie" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Dashboard</q-item-label>
            <q-item-label caption>Project overview</q-item-label>
          </q-item-section>
        </q-item>

        <!-- Projects -->
        <q-expansion-item
          icon="fa-regular fa-folder-open"
          label="Projects"
          :default-opened="$route.path.startsWith('/menu/projects')"
        >
          <q-item
            clickable
            :active="$route.path === '/menu/projects/tree-view'"
            active-class="text-primary bg-blue-1"
            @click="navigateTo('/menu/projects/tree-view')"
          >
            <q-item-section avatar>
              <q-icon name="fas fa-sitemap" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Tree View</q-item-label>
              <q-item-label caption>Tree style view</q-item-label>
            </q-item-section>
          </q-item>
          <q-item
            clickable
            :active="$route.path === '/menu/projects/column-view'"
            active-class="text-primary bg-blue-1"
            @click="navigateTo('/menu/projects/column-view')"
          >
            <q-item-section avatar>
              <q-icon name="fas fa-table-columns" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Column View</q-item-label>
              <q-item-label caption>Kanban style view</q-item-label>
            </q-item-section>
          </q-item>
          <q-item
            clickable
            :active="$route.path === '/menu/projects/bulk-update-view'"
            active-class="text-primary bg-blue-1"
            @click="navigateTo('/menu/projects/bulk-update-view')"
          >
            <q-item-section avatar>
              <q-icon name="fas fa-list" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Tabular View</q-item-label>
              <q-item-label caption>Table style view</q-item-label>
            </q-item-section>
          </q-item>
        </q-expansion-item>

        <!-- Vendor Management -->
        <q-item
          clickable
          :active="$route.path === '/menu/vendors'"
          active-class="text-primary bg-blue-1"
          @click="navigateTo('/menu/vendors')"
        >
          <q-item-section avatar>
            <q-icon name="fas fa-handshake" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Vendor Management</q-item-label>
            <q-item-label caption>Manage vendor relationships</q-item-label>
          </q-item-section>
        </q-item>

        <!-- Notifications -->
        <q-item
          clickable
          :active="$route.path === '/menu/notifications'"
          active-class="text-primary bg-blue-1"
          @click="navigateTo('/menu/notifications')"
        >
          <q-item-section avatar>
            <q-icon name="fas fa-bell" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Notifications</q-item-label>
            <q-item-label caption>View all notifications</q-item-label>
          </q-item-section>
          <!-- Show unread count badge in sidebar if needed -->
          <q-item-section side v-if="unreadCount > 0">
            <q-badge
              :label="unreadCount > 99 ? '99+' : unreadCount"
              color="negative"
              rounded
            />
          </q-item-section>
        </q-item>

        <q-separator class="q-my-md" />

        <!-- Quick Actions -->
        <q-item-label header>
          Quick Actions
        </q-item-label>

        <q-item clickable @click="showCreateProject">
          <q-item-section avatar>
            <q-icon name="add_circle" color="positive" />
          </q-item-section>
          <q-item-section>
            <q-item-label>New Project</q-item-label>
            <q-item-label caption>Create a new project</q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable @click="showAddVendor">
          <q-item-section avatar>
            <q-icon name="add_business" color="secondary" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Add Vendor</q-item-label>
            <q-item-label caption>Register new vendors</q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable @click="showReports">
          <q-item-section avatar>
            <q-icon name="analytics" color="info" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Reports</q-item-label>
            <q-item-label caption>View project reports</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <!-- Logout Confirmation Dialog -->
    <q-dialog v-model="logoutDialog" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="logout" color="negative" text-color="white" />
          <span class="q-ml-sm">Are you sure you want to logout?</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn flat label="Logout" color="negative" @click="confirmLogout" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'stores/auth'
import { useNotificationStore } from 'stores/notification'
import { useDeviceTokenStore } from 'stores/deviceToken'
import { useQuasar } from 'quasar'
import NotificationDropdown from 'components/NotificationDropdown.vue'

const router = useRouter()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()
const deviceTokenStore = useDeviceTokenStore()
const $q = useQuasar()

const leftDrawerOpen = ref(false)
const logoutDialog = ref(false)

// Computed properties
const user = computed(() => authStore.user)
const unreadCount = computed(() => notificationStore.unreadCount)

// Methods
function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

function navigateTo(path) {
  router.push(path)
  // Close drawer on mobile
  if ($q.screen.lt.md) {
    leftDrawerOpen.value = false
  }
}

function goToProfile() {
  // Navigate to profile page when implemented
  $q.notify({
    type: 'info',
    message: 'Profile page coming soon',
    position: 'top'
  })
}

function goToSettings() {
  // Navigate to settings page when implemented
  $q.notify({
    type: 'info',
    message: 'Settings page coming soon',
    position: 'top'
  })
}

function showCreateProject() {
  // Show create project dialog when implemented
  $q.notify({
    type: 'info',
    message: 'Create project feature coming soon',
    position: 'top'
  })
}

function showAddVendor() {
  // Navigate to vendor management page with add dialog open
  router.push({ name: 'vendorManagement', query: { action: 'add' } })
  // Close drawer on mobile
  if ($q.screen.lt.md) {
    leftDrawerOpen.value = false
  }
}

function showReports() {
  // Navigate to reports page when implemented
  $q.notify({
    type: 'info',
    message: 'Reports feature coming soon',
    position: 'top'
  })
}

function handleLogout() {
  logoutDialog.value = true
}

async function confirmLogout() {
  try {
    $q.loading.show({
      message: 'Logging out...'
    })

    await authStore.logout()

    // Clean up notification stores on logout
    notificationStore.resetState()
    deviceTokenStore.resetState()

    $q.notify({
      type: 'positive',
      message: 'Logged out successfully',
      position: 'top'
    })

    router.push({ name: 'login' })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Logout failed',
      position: 'top'
    })
  } finally {
    $q.loading.hide()
    logoutDialog.value = false
  }
}

// Notification event handlers
function handleNotificationClick(notification) {
  console.log('Notification clicked in header:', notification)

  // Handle notification click logic
  // For example, navigate to related page
  if (notification.actionUrl) {
    router.push(notification.actionUrl)
  } else {
    // Default action - go to notifications page
    router.push('/menu/notifications')
  }
}

function handleNotificationSettingsClick() {
  console.log('Notification settings clicked')
  router.push('/menu/notifications/settings')
}

function onNotificationDropdownShow() {
  console.log('Notification dropdown opened')
  // Optional: Track analytics or perform other actions
}

function onNotificationDropdownHide() {
  console.log('Notification dropdown closed')
  // Optional: Track analytics or perform other actions
}

// Lifecycle hooks
onMounted(async () => {
  try {
    // Initialize notification stores after user login
    if (authStore.isAuthenticated) {
      console.log('Initializing notification system...')

      // Initialize device token store first (for push notifications)
      await deviceTokenStore.initialize()

      // Then initialize notification store
      await notificationStore.initialize()

      console.log('Notification system initialized successfully')
    }
  } catch (error) {
    console.error('Error initializing notification system:', error)
    // Don't show error to user as notifications are not critical for app functionality
  }
})
</script>

<style scoped>
.q-toolbar-title {
  font-weight: 600;
  letter-spacing: 0.5px;
}

.q-expansion-item {
  border-radius: 8px;
  margin: 4px 0;
}

.q-item {
  border-radius: 8px;
  margin: 2px 8px;
}

.q-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

/* Notification dropdown header styling */
.notification-dropdown-header {
  margin-right: 8px;
}

/* Badge styling in sidebar */
.q-item-section.side .q-badge {
  font-size: 10px;
  min-width: 18px;
  padding: 2px 6px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .column.items-end.text-right {
    display: none; /* Hide user info text on mobile to save space */
  }

  .notification-dropdown-header {
    margin-right: 4px;
  }
}

@media (max-width: 480px) {
  .q-gutter-sm {
    gap: 4px;
  }
}

/* Dark mode support */
.body--dark .q-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

/* Animation for notification badge in sidebar */
.q-item-section.side .q-badge {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

/* Focus states for accessibility */
.notification-dropdown-header:focus-within {
  outline: 2px solid rgba(25, 118, 210, 0.3);
  outline-offset: 2px;
  border-radius: 4px;
}
</style>
