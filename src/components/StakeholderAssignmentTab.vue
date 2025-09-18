<template>
  <ErrorBoundary ref="errorBoundary">
    <div
      class="stakeholder-assignment-tab"
      role="region"
      aria-label="Stakeholder Assignments"
    >
      <!-- Header with Add Button -->
      <div class="assignments-header q-mb-md" v-if="canViewAssignments">
        <q-btn
          label="Add Assignment"
          icon="person_add"
          color="primary"
          size="sm"
          @click="showAddAssignmentDialog = true"
          :disable="!canManageAssignments"
          aria-label="Add new stakeholder assignment"
          v-if="canManageAssignments"
        />
      </div>

      <!-- Show access denied if no view permission -->
      <div v-if="!canViewAssignments" class="access-denied text-center q-pa-lg">
        <q-icon name="lock" size="48px" color="grey-5" />
        <p class="text-grey-6 q-mt-md">You don't have permission to view assignments</p>
      </div>

      <!-- Loading State -->
      <div v-if="isLoadingAssignments" class="text-center q-pa-lg">
        <q-spinner-dots size="40px" color="primary" />
      </div>

      <!-- Empty State -->
      <div v-else-if="assignments.length === 0" class="empty-state text-center q-pa-lg">
        <q-icon name="people_outline" size="48px" color="grey-5" />
        <p class="text-grey-6 q-mt-md">No assignments yet</p>
      </div>

      <!-- Assignments Grouped by Type -->
      <div v-else class="assignments-container">
        <div
          v-for="(group, assignmentType) in groupedAssignments"
          :key="assignmentType"
          class="assignment-group q-mb-lg"
        >
          <!-- Group Header -->
          <div class="group-header q-mb-sm">
            <q-chip
              :color="getAssignmentTypeColor(assignmentType)"
              text-color="white"
              icon="label"
            >
              {{ assignmentType }} ({{ group.length }})
            </q-chip>
          </div>

          <!-- Assignment Cards -->
          <div class="assignment-cards">
            <q-card
              v-for="assignment in group"
              :key="assignment.recCode"
              class="assignment-card q-mb-sm"
              flat
              bordered
              :tabindex="0"
              role="article"
              :aria-label="`Assignment for ${assignment.displayName}`"
              @keydown.enter="editAssignment(assignment)"
              @keydown.space.prevent="editAssignment(assignment)"
            >
              <q-card-section class="q-pa-md">
                <!-- Assignment Header -->
                <div class="assignment-header">
                  <div class="assignee-info">
                    <q-avatar
                      :color="assignment.isUserAssignment ? 'primary' : 'secondary'"
                      text-color="white"
                      size="32px"
                    >
                      <q-icon :name="assignment.isUserAssignment ? 'person' : 'business'" />
                    </q-avatar>

                    <div class="assignee-details q-ml-sm">
                      <div class="assignee-name text-weight-medium">
                        {{ assignment.displayName }}
                      </div>
                      <div class="assignee-meta text-caption text-grey-6">
                        {{ assignment.isUserAssignment ? 'Internal User' : 'Stakeholder' }}
                        <span v-if="assignment.assigneeSpecialization" class="q-ml-sm">
                          • {{ assignment.assigneeSpecialization }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Actions -->
                  <div class="assignment-actions">
                    <q-btn
                      icon="edit"
                      size="sm"
                      flat
                      round
                      dense
                      color="primary"
                      @click="editAssignment(assignment)"
                      :disable="!canManageAssignments"
                    >
                      <q-tooltip>Edit Assignment</q-tooltip>
                    </q-btn>
                    <q-btn
                      icon="delete"
                      size="sm"
                      flat
                      round
                      dense
                      color="negative"
                      @click="deleteAssignment(assignment)"
                      :disable="!canManageAssignments"
                    >
                      <q-tooltip>Remove Assignment</q-tooltip>
                    </q-btn>
                  </div>
                </div>

                <!-- Assignment Details -->
                <div class="assignment-details q-mt-sm">
                  <div class="assignment-dates text-caption text-grey-7">
                    <q-icon name="event" size="xs" class="q-mr-xs" />
                    {{ formatDateRange(assignment.startDate, assignment.endDate) }}
                    <span v-if="assignment.durationText" class="q-ml-sm">
                      ({{ assignment.durationText }})
                    </span>
                  </div>

                  <div v-if="assignment.contractAmount" class="assignment-amount text-caption text-grey-7 q-mt-xs">
                    <q-icon name="attach_money" size="xs" class="q-mr-xs" />
                    ₹{{ formatCurrency(assignment.contractAmount) }}
                  </div>

                  <div v-if="assignment.notes" class="assignment-notes text-caption q-mt-xs">
                    <q-icon name="note" size="xs" class="q-mr-xs" />
                    {{ assignment.notes }}
                  </div>
                </div>

                <!-- Status Badge -->
                <div class="assignment-status q-mt-sm">
                  <q-chip
                    :color="assignment.isActive ? 'positive' : 'grey'"
                    text-color="white"
                    size="sm"
                    dense
                  >
                    {{ assignment.isActive ? 'Active' : 'Inactive' }}
                  </q-chip>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>

      <!-- Add/Edit Assignment Dialog -->
      <AssignmentFormDialog
        v-model="showAddAssignmentDialog"
        :node-id="nodeId"
        :editing-assignment="editingAssignment"
        @assignment-saved="handleAssignmentSaved"
        @assignment-cancelled="handleAssignmentCancelled"
      />

       <!-- Network error state -->
      <div v-if="networkError" class="network-error q-pa-lg text-center">
        <q-icon name="wifi_off" size="48px" color="warning" />
        <p class="text-grey-6 q-mt-md">Network connection issues</p>
        <q-btn
          color="primary"
          label="Retry"
          @click="loadAssignments(true)"
          :loading="isLoadingAssignments"
        />
      </div>
    </div>
  </ErrorBoundary>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'stores/auth'
import { useProjectStore } from 'stores/project'
import stakeholderService from 'src/services/api/stakeholder.service'
import ErrorBoundary from './ErrorBoundary.vue'
import { defineAsyncComponent } from 'vue'
// Lazy load the form dialog
const AssignmentFormDialog = defineAsyncComponent(() =>
  import('./AssignmentFormDialog.vue')
)

// Props & Emits
const props = defineProps({
  nodeId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['assignments-loaded', 'assignments-error'])

const errorBoundary = ref(null)
const networkError = ref(false)

// Composables
const $q = useQuasar()
const authStore = useAuthStore()
const projectStore = useProjectStore()

// State
const isLoadingAssignments = ref(false)
const assignments = ref([])
const showAddAssignmentDialog = ref(false)
const editingAssignment = ref(null)

// Computed
const canManageAssignments = computed(() => {
  const userRole = authStore.user?.userRole

  // Admin can manage everywhere
  if (userRole === 'Admin') return true

  // ProjectManager can only manage their assigned projects
  if (userRole === 'ProjectManager') {
    // TODO: Check if current user is assigned as ProjectManager to this node's project
    return checkProjectManagerAccess()
  }

  return false
})

const canViewAssignments = computed(() => {
  const userRole = authStore.user?.userRole
  return ['Admin', 'ProjectManager', 'Engineer', 'User'].includes(userRole)
})

const groupedAssignments = computed(() => {
  return stakeholderService.groupAssignmentsByType(assignments.value)
})

const checkProjectManagerAccess = () => {
  // This would check if current user is assigned as ProjectManager to the project
  // containing this node - implementation depends on how project assignment is stored
  return true // Placeholder - implement based on your project assignment logic
}

// Methods
// Replace direct service calls with store methods
// Enhanced error handling in loadAssignments
const loadAssignments = async (forceRefresh = false) => {
  if (!forceRefresh && assignments.value.length > 0) return

  isLoadingAssignments.value = true
  networkError.value = false

  try {
    const assignmentData = await projectStore.fetchNodeAssignments(props.nodeId, forceRefresh)
    assignments.value = assignmentData
    emit('assignments-loaded', assignmentData)
  } catch (error) {
    console.error('Failed to load assignments:', error)

    if (error.code === 'NETWORK_ERROR') {
      networkError.value = true
    } else {
      errorBoundary.value?.showError('Failed to load assignments. Please try again.')
    }

    emit('assignments-error', error)
  } finally {
    isLoadingAssignments.value = false
  }
}

const deleteAssignment = async (assignment) => {
  $q.dialog({
    title: 'Delete Assignment',
    message: `Are you sure you want to remove ${assignment.displayName} from this assignment?`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await projectStore.deleteAssignment(assignment.recCode, props.nodeId)
      await loadAssignments(true)
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      // Error handling already done in store
    }
  })
}

const editAssignment = (assignment) => {
  editingAssignment.value = assignment
  showAddAssignmentDialog.value = true
}

const handleAssignmentSaved = () => {
  showAddAssignmentDialog.value = false
  editingAssignment.value = null
  loadAssignments(true)
}

const handleAssignmentCancelled = () => {
  showAddAssignmentDialog.value = false
  editingAssignment.value = null
}

// Utility methods
const getAssignmentTypeColor = (type) => {
  const colorMap = {
    'Primary': 'primary',
    'Secondary': 'secondary',
    'Consultant': 'info',
    'Viewer': 'grey',
    'Editor': 'warning'
  }
  return colorMap[type] || 'grey'
}

// eslint-disable-next-line no-unused-vars
const formatDateRange = (startDate, endDate) => {
  // Date formatting logic
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN').format(amount)
}

// Lifecycle
onMounted(() => {
  loadAssignments()
})
</script>

<style lang="scss" scoped>
.stakeholder-assignment-tab {
  .assignments-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .assignment-group {
    .group-header {
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 8px;
    }
  }

  .assignment-card {
    transition: all 0.2s ease;

    &:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transform: translateY(-1px);
    }

    .assignment-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;

      .assignee-info {
        display: flex;
        align-items: center;
        flex: 1;
      }

      .assignment-actions {
        display: flex;
        gap: 4px;
      }
    }
  }

  // Assignment type color coding
  .assignment-group {
    .group-header {
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 8px;
      position: relative;

      &::before {
        content: '';
        position: absolute;
        left: 0;
        bottom: 0;
        height: 3px;
        width: 100%;
        background: var(--assignment-color);
      }

      &.primary-group::before { background: #1976d2; }
      &.secondary-group::before { background: #7b1fa2; }
      &.consultant-group::before { background: #0288d1; }
      &.viewer-group::before { background: #616161; }
      &.editor-group::before { background: #f57c00; }
    }
  }

  .assignment-card {
    transition: all 0.2s ease;
    border-left: 4px solid var(--assignment-border-color);

    &.primary-assignment {
      --assignment-border-color: #1976d2;
      &:hover { box-shadow: 0 2px 8px rgba(25, 118, 210, 0.2); }
    }
    &.secondary-assignment {
      --assignment-border-color: #7b1fa2;
      &:hover { box-shadow: 0 2px 8px rgba(123, 31, 162, 0.2); }
    }
    &.consultant-assignment {
      --assignment-border-color: #0288d1;
      &:hover { box-shadow: 0 2px 8px rgba(2, 136, 209, 0.2); }
    }
    &.viewer-assignment {
      --assignment-border-color: #616161;
      &:hover { box-shadow: 0 2px 8px rgba(97, 97, 97, 0.2); }
    }
    &.editor-assignment {
      --assignment-border-color: #f57c00;
      &:hover { box-shadow: 0 2px 8px rgba(245, 124, 0, 0.2); }
    }

    &:hover {
      transform: translateY(-2px);
    }

    // Status indicators
    .assignment-status {
      .q-chip {
        &.active { animation: pulse 2s infinite; }
      }
    }
  }

  // Empty state enhancement
  .empty-state {
    .q-icon {
      opacity: 0.3;
      transition: opacity 0.3s ease;
    }

    &:hover .q-icon {
      opacity: 0.6;
    }
  }
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(76, 175, 80, 0); }
  100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
}

// Mobile responsive enhancements
@media (max-width: 600px) {
  .assignment-card {
    .assignment-header {
      flex-direction: column;
      align-items: flex-start;

      .assignment-actions {
        align-self: flex-end;
        margin-top: 8px;
      }
    }

    .assignee-details {
      .assignee-name {
        font-size: 14px;
      }
    }
  }
}
</style>
