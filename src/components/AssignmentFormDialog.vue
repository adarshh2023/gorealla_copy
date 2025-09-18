<template>
  <q-dialog
    v-model="isOpen"
    persistent
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="assignment-form-dialog">
      <!-- Loading overlay -->
      <q-inner-loading :showing="isInitialLoading">
        <q-spinner-dots size="50px" color="primary" />
        <div class="q-mt-md text-center">
          Loading form data...
        </div>
      </q-inner-loading>
      <!-- Header -->
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">
          {{ editingAssignment ? 'Edit Assignment' : 'Add Assignment' }}
        </div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-separator />

      <!-- Form Content -->
      <q-card-section class="scroll" style="max-height: 70vh">
        <q-form ref="assignmentForm" @submit="saveAssignment">
          <div class="row q-col-gutter-md">

            <!-- Assignment Type -->
            <div class="col-12 col-md-6">
              <q-select
                v-model="formData.assignmentType"
                label="Assignment Type *"
                :options="assignmentTypeOptions"
                outlined
                dense
                emit-value
                map-options
                :rules="[val => !!val || 'Assignment type is required']"
              >
                <template v-slot:selected-item="scope">
                  <q-chip
                    :color="getAssignmentTypeColor(scope.opt.value)"
                    text-color="white"
                    size="sm"
                    dense
                  >
                    {{ scope.opt.label }}
                  </q-chip>
                </template>
                <template v-slot:option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section>
                      <q-chip
                        :color="getAssignmentTypeColor(scope.opt.value)"
                        text-color="white"
                        size="sm"
                      >
                        {{ scope.opt.label }}
                      </q-chip>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <!-- Assignee Type Toggle -->
            <div class="col-12 col-md-6">
              <q-btn-toggle
                v-model="assigneeType"
                :options="assigneeTypeOptions"
                color="primary"
                toggle-color="primary"
                unelevated
                @update:model-value="onAssigneeTypeChange"
              />
            </div>

            <!-- User Selection (when assigneeType = 'USER') -->
            <div v-if="assigneeType === 'USER'" class="col-12">
              <q-select
                v-model="formData.assigneeId"
                label="Select User *"
                :options="filteredUsers"
                option-value="recCode"
                option-label="fullName"
                outlined
                dense
                emit-value
                map-options
                use-input
                @filter="filterUsers"
                :rules="[val => !!val || 'User selection is required']"
              >
                <template v-slot:selected-item="scope">
                  <div class="row items-center">
                    <q-avatar size="24px" color="primary" text-color="white">
                      <q-icon name="person" />
                    </q-avatar>
                    <span class="q-ml-sm">{{ scope.opt.fullName }}</span>
                    <span class="text-caption text-grey-6 q-ml-sm">
                      ({{ scope.opt.userRole }})
                    </span>
                  </div>
                </template>
                <template v-slot:option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section avatar>
                      <q-avatar size="32px" color="primary" text-color="white">
                        <q-icon name="person" />
                      </q-avatar>
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ scope.opt.fullName }}</q-item-label>
                      <q-item-label caption>{{ scope.opt.userRole }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <!-- Stakeholder Selection (when assigneeType = 'STAKEHOLDER') -->
            <div v-if="assigneeType === 'STAKEHOLDER'" class="col-12">
              <q-select
                v-model="formData.assigneeId"
                label="Select Stakeholder *"
                :options="filteredStakeholders"
                option-value="recCode"
                option-label="companyName"
                outlined
                dense
                emit-value
                map-options
                use-input
                @filter="filterStakeholders"
                :rules="[val => !!val || 'Stakeholder selection is required']"
              >
                <template v-slot:selected-item="scope">
                  <div class="row items-center">
                    <q-avatar size="24px" color="secondary" text-color="white">
                      <q-icon name="business" />
                    </q-avatar>
                    <span class="q-ml-sm">{{ scope.opt.companyName }}</span>
                    <span v-if="scope.opt.specialization" class="text-caption text-grey-6 q-ml-sm">
                      ({{ scope.opt.specialization }})
                    </span>
                  </div>
                </template>
                <template v-slot:option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section avatar>
                      <q-avatar size="32px" color="secondary" text-color="white">
                        <q-icon name="business" />
                      </q-avatar>
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ scope.opt.companyName }}</q-item-label>
                      <q-item-label caption>
                        {{ scope.opt.stakeholderType }}
                        <span v-if="scope.opt.specialization">
                          • {{ scope.opt.specialization }}
                        </span>
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <!-- Start Date -->
            <div class="col-12 col-md-6">
              <q-input
                v-model="formData.startDate"
                label="Start Date *"
                outlined
                dense
                mask="##-##-####"
                :rules="[
                  val => !!val || 'Start date is required',
                  val => /^\d{2}-\d{2}-\d{4}$/.test(val) || 'Invalid date format'
                ]"
              >
                <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date
                        v-model="formData.startDate"
                        mask="DD-MM-YYYY"
                        format="DD-MM-YYYY"
                      >
                        <div class="row items-center justify-end">
                          <q-btn v-close-popup label="Close" color="primary" flat />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>

            <!-- End Date -->
            <div class="col-12 col-md-6">
              <q-input
                v-model="formData.endDate"
                label="End Date"
                outlined
                dense
                mask="##-##-####"
                :rules="[
                  val => !val || /^\d{2}-\d{2}-\d{4}$/.test(val) || 'Invalid date format',
                  val => validateEndDate(val)
                ]"
              >
                <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date
                        v-model="formData.endDate"
                        mask="DD-MM-YYYY"
                        format="DD-MM-YYYY"
                      >
                        <div class="row items-center justify-end">
                          <q-btn v-close-popup label="Close" color="primary" flat />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>

            <!-- Contract Amount -->
            <div class="col-12 col-md-6">
              <q-input
                v-model.number="formData.contractAmount"
                label="Contract Amount"
                outlined
                dense
                type="number"
                prefix="₹"
                :rules="[val => !val || val >= 0 || 'Amount must be positive']"
              />
            </div>

            <!-- Active Status -->
            <div class="col-12 col-md-6">
              <q-toggle
                v-model="formData.isActive"
                label="Active Assignment"
                color="positive"
                class="q-mt-md"
              />
            </div>

            <!-- Notes -->
            <div class="col-12">
              <q-input
                v-model="formData.notes"
                label="Notes"
                outlined
                dense
                type="textarea"
                rows="3"
              />
            </div>
          </div>
        </q-form>
      </q-card-section>

      <q-separator />

      <!-- Actions -->
      <q-card-actions align="right" class="q-pa-md">
        <q-btn
          flat
          label="Cancel"
          color="primary"
          @click="cancelAssignment"
        />
        <q-btn
          label="Save"
          color="primary"
          :loading="isSaving"
          @click="saveAssignment"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ASSIGNMENT_TYPES } from 'src/constants/api.constants'
import stakeholderService from 'src/services/api/stakeholder.service'
import userService from 'src/services/api/user.service'
import { useProjectStore } from 'stores/project'
import { showError } from 'src/utils/notification'

// Add loading state
const isInitialLoading = ref(false)

// Props & Emits
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  nodeId: {
    type: String,
    required: true
  },
  editingAssignment: {
    type: Object,
    default: null
  }
})

const emit = defineEmits([
  'update:modelValue',
  'assignment-saved',
  'assignment-cancelled'
])

// Refs
const assignmentForm = ref(null)
const isSaving = ref(false)
const assigneeType = ref('USER')

// composables
const projectStore = useProjectStore()

// Form Data
const formData = ref({
  assignmentType: 'Primary',
  assigneeId: null,
  startDate: '',
  endDate: '',
  contractAmount: null,
  notes: '',
  isActive: true
})

// Options Data
const users = ref([])
const stakeholders = ref([])
const filteredUsers = ref([])
const filteredStakeholders = ref([])

// Computed
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const assignmentTypeOptions = computed(() =>
  // eslint-disable-next-line no-unused-vars
  Object.entries(ASSIGNMENT_TYPES).map(([key, value]) => ({
    label: value,
    value: value
  }))
)

const assigneeTypeOptions = computed(() => [
  { label: 'Internal User', value: 'USER', icon: 'person' },
  { label: 'Stakeholder', value: 'STAKEHOLDER', icon: 'business' }
])

// Methods
const loadUsers = async () => {
  try {
    const response = await userService.getAllUsers({ size: 100 })
    if (response.success) {
      users.value = response.data.content || []
      filteredUsers.value = users.value
    }
  } catch (error) {
    console.error('Failed to load users:', error)
  }
}

const loadStakeholders = async () => {
  try {
    const response = await stakeholderService.getAllStakeholders({ size: 100 })
    if (response.success) {
      stakeholders.value = response.data.content || []
      filteredStakeholders.value = stakeholders.value
    }
  } catch (error) {
    console.error('Failed to load stakeholders:', error)
  }
}

const filterUsers = (val, update) => {
  update(() => {
    if (val === '') {
      filteredUsers.value = users.value
    } else {
      const needle = val.toLowerCase()
      filteredUsers.value = users.value.filter(
        user => user.fullName.toLowerCase().indexOf(needle) > -1
      )
    }
  })
}

const filterStakeholders = (val, update) => {
  update(() => {
    if (val === '') {
      filteredStakeholders.value = stakeholders.value
    } else {
      const needle = val.toLowerCase()
      filteredStakeholders.value = stakeholders.value.filter(
        stakeholder => stakeholder.companyName.toLowerCase().indexOf(needle) > -1
      )
    }
  })
}

const onAssigneeTypeChange = () => {
  formData.value.assigneeId = null
}

const validateEndDate = (endDate) => {
  if (!endDate || !formData.value.startDate) return true

  const start = new Date(formData.value.startDate.split('-').reverse().join('-'))
  const end = new Date(endDate.split('-').reverse().join('-'))

  return end >= start || 'End date must be after start date'
}

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

const resetForm = () => {
  formData.value = {
    assignmentType: 'Primary',
    assigneeId: null,
    startDate: '',
    endDate: '',
    contractAmount: null,
    notes: '',
    isActive: true
  }
  assigneeType.value = 'USER'
  assignmentForm.value?.resetValidation()
}

const populateForm = (assignment) => {
  if (!assignment) return

  formData.value = {
    assignmentType: assignment.assignmentType,
    assigneeId: assignment.assigneeId,
    startDate: formatDateForDisplay(assignment.startDate),
    endDate: formatDateForDisplay(assignment.endDate),
    contractAmount: assignment.contractAmount,
    notes: assignment.notes || '',
    isActive: assignment.isActive !== false
  }
  assigneeType.value = assignment.assigneeType
}

const formatDateForDisplay = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).replace(/\//g, '-')
}

const formatDateForBackend = (dateString) => {
  if (!dateString) return null
  const [day, month, year] = dateString.split('-')
  return `${year}-${month}-${day}`
}

const saveAssignment = async () => {
  const valid = await assignmentForm.value.validate()
  if (!valid) return

  isSaving.value = true
  try {
    const assignmentData = {
      nodeId: props.nodeId,
      assigneeType: assigneeType.value,
      assigneeId: formData.value.assigneeId,
      assignmentType: formData.value.assignmentType,
      startDate: formatDateForBackend(formData.value.startDate),
      endDate: formatDateForBackend(formData.value.endDate),
      contractAmount: formData.value.contractAmount,
      notes: formData.value.notes,
      isActive: formData.value.isActive
    }

    if (props.editingAssignment) {
      await projectStore.updateAssignment(props.editingAssignment.recCode, assignmentData)
    } else {
      await projectStore.createAssignment(assignmentData)
    }

    emit('assignment-saved')
  } catch (error) {
    // Error handling already done in store
    console.error('Save assignment error:', error)
  } finally {
    isSaving.value = false
  }
}

const cancelAssignment = () => {
  resetForm()
  emit('assignment-cancelled')
}

// Watchers
watch(() => props.editingAssignment, (newAssignment) => {
  if (newAssignment) {
    populateForm(newAssignment)
  } else {
    resetForm()
  }
}, { immediate: true })

watch(isOpen, (newVal) => {
  if (newVal) {
    if (props.editingAssignment) {
      populateForm(props.editingAssignment)
    } else {
      resetForm()
    }
  }
})

// Lifecycle
onMounted(async () => {
  isInitialLoading.value = true
  try {
    await Promise.all([loadUsers(), loadStakeholders()])
  // eslint-disable-next-line no-unused-vars
  } catch (error) {
    showError('Failed to load form data')
  } finally {
    isInitialLoading.value = false
  }
})
</script>

<style lang="scss" scoped>
.assignment-form-dialog {
  width: 100%;
  max-width: 800px;
}

@media (max-width: 600px) {
  .assignment-form-dialog {
    .q-card-section {
      padding: 12px;
    }
  }
}
</style>
