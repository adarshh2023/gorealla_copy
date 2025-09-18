<template>
  <q-page class="notification-settings-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <q-breadcrumbs class="text-grey-6 q-mb-sm">
            <q-breadcrumbs-el label="Dashboard" icon="fas fa-home" :to="{ name: 'dashboard' }" />
            <q-breadcrumbs-el label="Notifications" icon="fas fa-bell" :to="{ name: 'notifications' }" />
            <q-breadcrumbs-el label="Settings" icon="fas fa-cog" />
          </q-breadcrumbs>

          <div class="page-title">
            <q-icon name="fas fa-cog" size="32px" class="q-mr-md text-primary" />
            <div>
              <h3 class="title-text">Notification Settings</h3>
              <p class="title-subtitle">Configure your notification preferences</p>
            </div>
          </div>
        </div>

        <div class="header-actions">
          <q-btn
            label="Back to Notifications"
            icon="fas fa-arrow-left"
            color="grey-6"
            flat
            @click="goBackToNotifications"
            class="q-mr-sm"
          />

          <q-btn
            label="Save All"
            icon="fas fa-save"
            color="primary"
            @click="saveAllSettings"
            :loading="saving"
          />
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="page-content">
      <div class="settings-container">

        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
          <q-spinner-gears size="50px" color="primary" />
          <p class="loading-text">Loading notification settings...</p>
        </div>

        <!-- Settings Content -->
        <div v-else class="settings-sections">

          <!-- Quick Settings Card -->
          <q-card class="settings-card quick-settings-card">
            <q-card-section>
              <div class="card-header">
                <h5 class="card-title">
                  <q-icon name="fas fa-toggle-on" class="q-mr-sm" />
                  Quick Settings
                </h5>
                <p class="card-description">Toggle notification channels on or off globally</p>
              </div>

              <div class="quick-toggles">
                <div class="toggle-item">
                  <div class="toggle-info">
                    <q-icon name="fas fa-bell" class="toggle-icon text-primary" />
                    <div class="toggle-details">
                      <div class="toggle-label">In-App Notifications</div>
                      <div class="toggle-description">Show notifications within the application</div>
                    </div>
                  </div>
                  <q-toggle
                    v-model="inAppEnabled"
                    color="primary"
                    :loading="toggling"
                    @update:model-value="toggleInApp"
                  />
                </div>

                <q-separator class="q-my-md" />

                <div class="toggle-item">
                  <div class="toggle-info">
                    <q-icon name="fas fa-envelope" class="toggle-icon text-blue" />
                    <div class="toggle-details">
                      <div class="toggle-label">Email Notifications</div>
                      <div class="toggle-description">Receive notifications via email</div>
                    </div>
                  </div>
                  <q-toggle
                    v-model="emailEnabled"
                    color="blue"
                    :loading="toggling"
                    @update:model-value="toggleEmail"
                  />
                </div>

                <q-separator class="q-my-md" />

                <div class="toggle-item">
                  <div class="toggle-info">
                    <q-icon name="fas fa-sms" class="toggle-icon text-green" />
                    <div class="toggle-details">
                      <div class="toggle-label">SMS Notifications</div>
                      <div class="toggle-description">Receive notifications via SMS</div>
                    </div>
                  </div>
                  <q-toggle
                    v-model="smsEnabled"
                    color="green"
                    :loading="toggling"
                    @update:model-value="toggleSms"
                  />
                </div>

                <q-separator class="q-my-md" />

                <div class="toggle-item">
                  <div class="toggle-info">
                    <q-icon name="fas fa-mobile-alt" class="toggle-icon text-purple" />
                    <div class="toggle-details">
                      <div class="toggle-label">Push Notifications</div>
                      <div class="toggle-description">Receive push notifications on your devices</div>
                    </div>
                  </div>
                  <q-toggle
                    v-model="pushEnabled"
                    color="purple"
                    :loading="toggling"
                    @update:model-value="togglePush"
                  />
                </div>
              </div>
            </q-card-section>
          </q-card>

          <!-- Notification Types Settings -->
          <q-card class="settings-card notification-types-card">
            <q-card-section>
              <div class="card-header">
                <h5 class="card-title">
                  <q-icon name="fas fa-list-ul" class="q-mr-sm" />
                  Notification Types
                </h5>
                <p class="card-description">Configure settings for specific types of notifications</p>
              </div>

              <div class="type-settings">
                <q-expansion-item
                  v-for="setting in typeSettings"
                  :key="setting.notificationType"
                  :label="formatNotificationType(setting.notificationType)"
                  :caption="getTypeDescription(setting.notificationType)"
                  :icon="getTypeIcon(setting.notificationType)"
                  class="type-expansion"
                  header-class="type-expansion-header"
                >
                  <q-card flat class="type-card">
                    <q-card-section>
                      <!-- Enable/disable this type -->
                      <div class="type-toggle">
                        <q-checkbox
                          v-model="setting.enabled"
                          :label="`Enable ${formatNotificationType(setting.notificationType)} notifications`"
                          color="primary"
                          @update:model-value="updateTypeSetting(setting)"
                        />
                      </div>

                      <!-- Channel preferences for this type -->
                      <div v-if="setting.enabled" class="type-channels">
                        <h6 class="channels-title">Delivery Channels</h6>

                        <div class="channel-options">
                          <q-checkbox
                            v-model="setting.inAppEnabled"
                            label="In-App"
                            color="primary"
                            :disable="!inAppEnabled"
                            @update:model-value="updateTypeSetting(setting)"
                          />
                          <q-checkbox
                            v-model="setting.emailEnabled"
                            label="Email"
                            color="blue"
                            :disable="!emailEnabled"
                            @update:model-value="updateTypeSetting(setting)"
                          />
                          <q-checkbox
                            v-model="setting.smsEnabled"
                            label="SMS"
                            color="green"
                            :disable="!smsEnabled"
                            @update:model-value="updateTypeSetting(setting)"
                          />
                          <q-checkbox
                            v-model="setting.pushEnabled"
                            label="Push"
                            color="purple"
                            :disable="!pushEnabled"
                            @update:model-value="updateTypeSetting(setting)"
                          />
                        </div>
                      </div>
                    </q-card-section>
                  </q-card>
                </q-expansion-item>
              </div>
            </q-card-section>
          </q-card>

          <!-- Device Management -->
          <q-card class="settings-card device-management-card">
            <q-card-section>
              <div class="card-header">
                <h5 class="card-title">
                  <q-icon name="fas fa-devices" class="q-mr-sm" />
                  Device Management
                </h5>
                <p class="card-description">Manage devices registered for push notifications</p>
              </div>

              <div class="device-section">
                <!-- No devices state -->
                <div v-if="deviceTokens.length === 0" class="no-devices">
                  <q-icon name="fas fa-mobile-alt" size="48px" color="grey-4" />
                  <h6 class="no-devices-title">No devices registered</h6>
                  <p class="no-devices-text">
                    Register this device to receive push notifications
                  </p>
                  <q-btn
                    label="Register This Device"
                    color="primary"
                    icon="fas fa-plus"
                    @click="registerDevice"
                    :loading="registeringDevice"
                  />
                </div>

                <!-- Devices list -->
                <div v-else class="devices-grid">
                  <q-card
                    v-for="device in deviceTokens"
                    :key="device.recCode"
                    class="device-card"
                    :class="{ 'device-inactive': !device.isActive }"
                    flat
                    bordered
                  >
                    <q-card-section class="device-header">
                      <div class="device-info">
                        <q-avatar
                          :icon="getDeviceIcon(device.deviceType)"
                          :color="device.isActive ? 'primary' : 'grey-5'"
                          text-color="white"
                          size="40px"
                        />
                        <div class="device-details">
                          <div class="device-name">{{ device.deviceName || 'Unknown Device' }}</div>
                          <div class="device-meta">
                            <q-chip
                              :label="device.deviceType"
                              size="sm"
                              outline
                              color="grey-6"
                              class="q-mr-xs"
                            />
                            <span class="device-last-used">
                              Last used {{ formatLastUsed(device.lastUsedDate) }}
                            </span>
                          </div>
                        </div>
                      </div>

                      <q-btn-dropdown
                        flat
                        round
                        dense
                        icon="fas fa-ellipsis-v"
                        class="device-menu"
                      >
                        <q-list>
                          <q-item
                            v-if="device.isActive"
                            clickable
                            @click="deactivateDevice(device)"
                          >
                            <q-item-section avatar>
                              <q-icon name="fas fa-pause" />
                            </q-item-section>
                            <q-item-section>Deactivate</q-item-section>
                          </q-item>
                          <q-item
                            v-else
                            clickable
                            @click="activateDevice(device)"
                          >
                            <q-item-section avatar>
                              <q-icon name="fas fa-play" />
                            </q-item-section>
                            <q-item-section>Activate</q-item-section>
                          </q-item>
                          <q-separator />
                          <q-item
                            clickable
                            class="text-negative"
                            @click="deleteDevice(device)"
                          >
                            <q-item-section avatar>
                              <q-icon name="fas fa-trash" color="negative" />
                            </q-item-section>
                            <q-item-section>Delete</q-item-section>
                          </q-item>
                        </q-list>
                      </q-btn-dropdown>
                    </q-card-section>

                    <q-card-section class="device-status">
                      <q-chip
                        :color="device.isActive ? 'positive' : 'grey'"
                        :text-color="device.isActive ? 'white' : 'grey-8'"
                        size="sm"
                        :label="device.isActive ? 'Active' : 'Inactive'"
                      />
                    </q-card-section>
                  </q-card>
                </div>
              </div>
            </q-card-section>
          </q-card>

          <!-- Reset Section -->
          <q-card class="settings-card reset-card">
            <q-card-section>
              <div class="card-header">
                <h5 class="card-title">
                  <q-icon name="fas fa-undo" class="q-mr-sm" />
                  Reset Settings
                </h5>
                <p class="card-description">Reset all notification settings to default values</p>
              </div>

              <div class="reset-section">
                <q-btn
                  label="Reset to Defaults"
                  icon="fas fa-undo"
                  color="warning"
                  outline
                  @click="confirmResetToDefaults"
                  :loading="resetting"
                />
              </div>
            </q-card-section>
          </q-card>

        </div>
      </div>
    </div>

    <!-- Success Banner -->
    <q-banner
      v-if="showSuccessBanner"
      class="success-banner text-white bg-positive"
      dense
    >
      <q-icon name="fas fa-check-circle" class="q-mr-sm" />
      Settings saved successfully!

      <template v-slot:action>
        <q-btn
          flat
          dense
          icon="fas fa-times"
          @click="showSuccessBanner = false"
        />
      </template>
    </q-banner>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useNotificationSettingsStore } from 'src/stores/notificationSettings'
import { useDeviceTokenStore } from 'src/stores/deviceToken'
import { date } from 'quasar'

// Composables
const router = useRouter()
const $q = useQuasar()
const notificationSettingsStore = useNotificationSettingsStore()
const deviceTokenStore = useDeviceTokenStore()

// Local state
const saving = ref(false)
const resetting = ref(false)
const registeringDevice = ref(false)
const showSuccessBanner = ref(false)

// Quick toggle states
const inAppEnabled = ref(true)
const emailEnabled = ref(true)
const smsEnabled = ref(true)
const pushEnabled = ref(true)

// Computed properties
const loading = computed(() =>
  notificationSettingsStore.loading || deviceTokenStore.loading
)
const toggling = computed(() => notificationSettingsStore.toggling)
const settings = computed(() => notificationSettingsStore.settings)
const deviceTokens = computed(() => deviceTokenStore.deviceTokens)

const typeSettings = computed(() => {
  // Group settings by notification type
  const types = {}
  settings.value.forEach(setting => {
    if (!types[setting.notificationType]) {
      types[setting.notificationType] = {
        notificationType: setting.notificationType,
        enabled: setting.enabled,
        inAppEnabled: setting.inAppEnabled,
        emailEnabled: setting.emailEnabled,
        smsEnabled: setting.smsEnabled,
        pushEnabled: setting.pushEnabled,
        recCode: setting.recCode
      }
    }
  })
  return Object.values(types)
})

// Methods
const formatNotificationType = (type) => {
  if (!type) return 'General'

  return type.replace(/_/g, ' ')
             .split(' ')
             .map(word => word.charAt(0) + word.slice(1).toLowerCase())
             .join(' ')
}

const getTypeDescription = (type) => {
  const descriptions = {
    'TASK_CREATED': 'When new tasks are created',
    'TASK_ASSIGNED': 'When tasks are assigned to you',
    'TASK_UPDATED': 'When task details are updated',
    'TASK_COMPLETED': 'When tasks are marked complete',
    'PROJECT_CREATED': 'When new projects are created',
    'PROJECT_UPDATED': 'When project details change',
    'DEADLINE_APPROACHING': 'When deadlines are coming up',
    'DEADLINE_MISSED': 'When deadlines are missed',
    'MESSAGE_RECEIVED': 'When you receive messages',
    'MENTION_RECEIVED': 'When you are mentioned',
    'SYSTEM_ANNOUNCEMENT': 'System-wide announcements'
  }
  return descriptions[type] || 'General notifications'
}

const getTypeIcon = (type) => {
  const icons = {
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
    'SYSTEM_ANNOUNCEMENT': 'fas fa-bullhorn'
  }
  return icons[type] || 'fas fa-bell'
}

const getDeviceIcon = (deviceType) => {
  const icons = {
    'Android': 'fab fa-android',
    'iOS': 'fab fa-apple',
    'Web': 'fas fa-globe',
    'Desktop': 'fas fa-desktop'
  }
  return icons[deviceType] || 'fas fa-mobile-alt'
}

const formatLastUsed = (timestamp) => {
  if (!timestamp) return 'Never'
  return date.formatDate(timestamp, 'MMM D, YYYY')
}

const toggleInApp = async () => {
  // Handle in-app toggle
  console.log('Toggle in-app:', inAppEnabled.value)
}

/*
const toggleInApp = async () => {
  // Handle in-app toggle locally since it doesn't require backend service
   inAppEnabled.value = !inAppEnabled.value

  // You could save this preference to localStorage or update user settings
  localStorage.setItem('inAppNotificationsEnabled', inAppEnabled.value.toString())
}
*/

const toggleEmail = async () => {
  try {
    await notificationSettingsStore.toggleEmailNotifications()
  // eslint-disable-next-line no-unused-vars
  } catch (error) {
    emailEnabled.value = !emailEnabled.value // Revert on error
  }
}

const toggleSms = async () => {
  try {
    await notificationSettingsStore.toggleSmsNotifications()
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    smsEnabled.value = !smsEnabled.value // Revert on error
  }
}

const togglePush = async () => {
  try {
    await notificationSettingsStore.togglePushNotifications()
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    pushEnabled.value = !pushEnabled.value // Revert on error
  }
}

const updateTypeSetting = async (setting) => {
  try {
    await notificationSettingsStore.updateSettings(setting.recCode, setting)
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Failed to update notification setting',
      position: 'top'
    })
  }
}

const registerDevice = async () => {
  try {
    registeringDevice.value = true
    await deviceTokenStore.autoRegisterDevice()
  } catch (error) {
    console.error('Error registering device:', error)
  } finally {
    registeringDevice.value = false
  }
}

const activateDevice = async (device) => {
  await deviceTokenStore.activateDeviceToken(device.recCode)
}

const deactivateDevice = async (device) => {
  await deviceTokenStore.deactivateDeviceToken(device.recCode)
}

const deleteDevice = async (device) => {
  $q.dialog({
    title: 'Delete Device',
    message: `Are you sure you want to delete "${device.deviceName || 'this device'}"?`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    await deviceTokenStore.deleteDeviceToken(device.recCode)
  })
}

const confirmResetToDefaults = () => {
  $q.dialog({
    title: 'Reset Settings',
    message: 'Are you sure you want to reset all notification settings to defaults? This action cannot be undone.',
    cancel: true,
    persistent: true,
    color: 'warning'
  }).onOk(async () => {
    await resetToDefaults()
  })
}

const resetToDefaults = async () => {
  try {
    resetting.value = true
    await notificationSettingsStore.createDefaultSettings()
    showSuccessBanner.value = true

    setTimeout(() => {
      showSuccessBanner.value = false
    }, 3000)
  } catch (error) {
    console.error('Error resetting settings:', error)
  } finally {
    resetting.value = false
  }
}

const saveAllSettings = async () => {
  try {
    saving.value = true

    // Save any pending changes here
    showSuccessBanner.value = true

    setTimeout(() => {
      showSuccessBanner.value = false
    }, 3000)

  } catch (error) {
    console.error('Error saving settings:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to save settings',
      position: 'top'
    })
  } finally {
    saving.value = false
  }
}

const goBackToNotifications = () => {
  router.push({ name: 'notifications' })
}

const loadSettings = async () => {
  try {
    await Promise.all([
      notificationSettingsStore.loadMySettings(),
      deviceTokenStore.loadMyDeviceTokens()
    ])

    // Update quick toggle states
    inAppEnabled.value = notificationSettingsStore.inAppEnabled
    emailEnabled.value = notificationSettingsStore.emailEnabled
    smsEnabled.value = notificationSettingsStore.smsEnabled
    pushEnabled.value = notificationSettingsStore.pushEnabled
  } catch (error) {
    console.error('Error loading settings:', error)
  }
}

// Watch for store changes
watch(
  () => notificationSettingsStore.emailEnabled,
  (newVal) => { emailEnabled.value = newVal }
)

watch(
  () => notificationSettingsStore.smsEnabled,
  (newVal) => { smsEnabled.value = newVal }
)

watch(
  () => notificationSettingsStore.pushEnabled,
  (newVal) => { pushEnabled.value = newVal }
)

watch(
  () => notificationSettingsStore.inAppEnabled,
  (newVal) => { inAppEnabled.value = newVal }
)

// Lifecycle
onMounted(async () => {
  document.title = 'Notification Settings - Gorealla Developer'
  await loadSettings()
})
</script>

<style scoped>
.notification-settings-page {
  background: #f8f9fa;
  min-height: 100vh;
}

/* Page Header */
.page-header {
  background: white;
  border-bottom: 1px solid #e0e0e0;
  padding: 24px 32px;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
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
  padding: 32px;
}

.settings-container {
  max-width: 1200px;
  margin: 0 auto;
}

/* Loading */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px;
  text-align: center;
}

.loading-text {
  margin-top: 16px;
  font-size: 16px;
  color: #666;
}

/* Settings Cards */
.settings-sections {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.settings-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
}

.card-header {
  margin-bottom: 24px;
}

.card-title {
  font-size: 20px;
  font-weight: 600;
  color: #212121;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
}

.card-description {
  font-size: 14px;
  color: #666;
  margin: 0;
  line-height: 1.5;
}

/* Quick Settings */
.quick-toggles {
  display: flex;
  flex-direction: column;
}

.toggle-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 0;
}

.toggle-info {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.toggle-icon {
  font-size: 20px;
}

.toggle-details {
  flex: 1;
}

.toggle-label {
  font-size: 16px;
  font-weight: 500;
  color: #212121;
  margin-bottom: 4px;
}

.toggle-description {
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

/* Notification Types */
.type-settings {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.type-expansion {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.type-card {
  background: #f8f9fa;
}

.type-toggle {
  margin-bottom: 16px;
}

.channels-title {
  font-size: 14px;
  font-weight: 600;
  color: #424242;
  margin: 0 0 12px 0;
}

.channel-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 16px;
}

/* Device Management */
.device-section {
  margin-top: 16px;
}

.no-devices {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  text-align: center;
  border: 2px dashed #e0e0e0;
  border-radius: 12px;
  background: #fafafa;
}

.no-devices-title {
  margin: 16px 0 8px;
  font-size: 18px;
  font-weight: 500;
  color: #424242;
}

.no-devices-text {
  margin: 0 0 24px;
  font-size: 14px;
  color: #666;
  max-width: 300px;
}

.devices-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.device-card {
  border-radius: 8px;
  transition: all 0.2s ease;
}

.device-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.device-inactive {
  opacity: 0.6;
}

.device-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.device-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.device-details {
  flex: 1;
}

.device-name {
  font-size: 16px;
  font-weight: 500;
  color: #212121;
  margin-bottom: 4px;
}

.device-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.device-last-used {
  font-size: 12px;
  color: #666;
}

.device-status {
  padding-top: 0;
}

/* Reset Section */
.reset-section {
  display: flex;
  justify-content: flex-start;
}

/* Success Banner */
.success-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    transform: translateY(-100%);
  }
  to {
    transform: translateY(0);
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .page-content {
    padding: 16px;
  }

  .header-content {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .channel-options {
    grid-template-columns: 1fr;
  }

  .devices-grid {
    grid-template-columns: 1fr;
  }

  .toggle-item {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
}

/* Dark mode */
.body--dark .notification-settings-page {
  background: #121212;
}

.body--dark .page-header {
  background: #1e1e1e;
  border-bottom-color: #424242;
}

.body--dark .settings-card {
  background: #1e1e1e;
  border-color: #424242;
}

.body--dark .type-card {
  background: #2a2a2a;
}

.body--dark .no-devices {
  background: #2d2d2d;
  border-color: #424242;
}
</style>
