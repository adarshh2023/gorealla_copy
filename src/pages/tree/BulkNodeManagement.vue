<template>
  <q-page padding>
    <div class="bulk-nodes-container">
      <!-- Header -->
      <div class="page-header">
        <div class="row items-center justify-between">
          <div class="col">
            <h4 class="text-h4 q-ma-none">Bulk Node Management</h4>
            <p class="text-grey-6 q-mt-sm">Rapidly create, edit, and manage project nodes in bulk</p>
          </div>
          <div class="col-auto">
            <q-btn
              icon="refresh"
              label="Refresh"
              color="primary"
              outline
              @click="loadNodes"
              :loading="isLoading"
            />
          </div>
        </div>
      </div>

      <!-- Filters & Actions -->
      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <div class="row q-col-gutter-md items-end">
            <!-- Project Filter -->
            <div class="col-xs-12 col-sm-4 col-md-4">
              <q-select
                v-model="selectedProject"
                :options="projectOptions"
                option-label="nodeName"
                option-value="recCode"
                label="Filter by Project"
                filled
                dense
                emit-value
                map-options
                @update:model-value="loadNodes([])"
              >
                <template v-slot:prepend>
                  <q-icon name="business" />
                </template>
              </q-select>
            </div>

            <!-- Actions -->
            <div class="col-xs-12 col-sm-4 col-md-4">
              <div class="row q-gutter-sm">
                <q-btn
                  icon="add"
                  label="Add"
                  color="positive"
                  @click="showAddDialog = true"
                />
                <q-btn
                  icon="edit"
                  label="Edit"
                  color="primary"
                  :disable="selectedNodes.length === 0"
                  @click="showEditDialog = true"
                />
                <q-btn
                  icon="delete"
                  label="Delete"
                  color="negative"
                  :disable="selectedNodes.length === 0"
                  @click="confirmBulkDelete"
                />
              </div>
            </div>

            <!-- Status Filter -->
            <div class="col-xs-12 col-sm-4 col-md-4">
              <q-select
                v-model="statusFilter"
                :options="statusOptions"
                label="Status"
                filled
                dense
                emit-value
                map-options
                clearable
                @update:model-value="loadNodes([])"
              />
            </div>

            <!-- Search -->
            <div class="col-xs-12 col-sm-12 col-md-12">
              <SearchChips
                placeholder="Search properties..."
                @search="handleSearch"
                @chips-updated="handleChipsUpdated"
                :max-chips="5"
              />
              <!-- <q-input
                v-model="searchQuery"
                label="Search nodes..."
                filled
                dense
                debounce="500"
                @update:model-value="loadNodes"
              >
                <template v-slot:prepend>
                  <q-icon name="search" />
                </template>
                <template v-slot:append>
                  <q-icon
                    v-if="searchQuery"
                    name="close"
                    class="cursor-pointer"
                    @click="searchQuery = ''; loadNodes()"
                  />
                </template>
              </q-input> -->
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Selection Info -->
      <div v-if="selectedNodes.length > 0" class="selection-banner q-mb-md">
        <q-banner inline-actions class="bg-primary text-white">
          <template v-slot:avatar>
            <q-icon name="check_circle" />
          </template>
          {{ selectedNodes.length }} node(s) selected
          <template v-slot:action>
            <q-btn flat label="Clear Selection" @click="clearSelection" />
          </template>
        </q-banner>
      </div>

      <!-- Data Table -->
      <q-table
        :rows="nodes"
        :columns="columns"
        :loading="isLoading"
        :pagination="pagination"
        :selected="selectedNodes"
        selection="multiple"
        row-key="recCode"
        flat
        bordered
        @update:selected="selectedNodes = $event"
        @request="onTableRequest"
        server-side-pagination
        class="nodes-table"
      >
        <!-- Header slot for select all -->
        <template v-slot:header-selection="scope">
          <q-checkbox v-model="scope.selected" />
        </template>

        <!-- Body slot for selection -->
        <template v-slot:body-selection="scope">
          <q-checkbox
            :model-value="scope.selected"
            @update:model-value="scope.selected = $event"
          />
        </template>

        <!-- Node Name with Breadcrumb -->
        <template v-slot:body-cell-nodeName="props">
          <q-td :props="props">
            <div class="node-name-container">
              <div class="node-name text-weight-medium">
                {{ props.row.nodeName }}
              </div>
              <div class="breadcrumb-path text-caption text-grey-6">
                <template v-if="props.row.breadcrumbPath && props.row.breadcrumbPath.length > 0">
                  <span v-for="(item, index) in props.row.breadcrumbPath" :key="item.recCode">
                    {{ item.nodeName }}<span v-if="index < props.row.breadcrumbPath.length - 1"> → </span>
                  </span>
                </template>
                <span v-else>Root Level</span>
              </div>
            </div>
          </q-td>
        </template>

        <!-- Node Type with Icon -->
        <template v-slot:body-cell-nodeType="props">
          <q-td :props="props">
            <div class="row items-center q-gutter-xs">
              <q-icon
                :name="getNodeTypeIcon(props.row.nodeTypeId)"
                :color="getNodeTypeColor(props.row.nodeTypeId)"
                size="sm"
              />
              <!-- <span>{{ getNodeTypeName(props.row.nodeTypeId) }}</span> -->
            </div>
          </q-td>
        </template>

        <!-- Status with Chip -->
        <template v-slot:body-cell-status="props">
          <q-td :props="props">
            <q-chip
              :color="getStatusColor(props.row.status)"
              text-color="white"
              size="sm"
              dense
            >
              {{ props.row.status }}
            </q-chip>
          </q-td>
        </template>

        <!-- Priority with Chip -->
        <template v-slot:body-cell-priority="props">
          <q-td :props="props">
            <q-chip
              :color="getPriorityColor(props.row.priority)"
              text-color="white"
              size="sm"
              dense
            >
              {{ props.row.priority }}
            </q-chip>
          </q-td>
        </template>

        <!-- Budget Amount -->
        <template v-slot:body-cell-budgetAmount="props">
          <q-td :props="props">
            <span v-if="props.row.budgetAmount">
              ₹{{ formatCurrency(props.row.budgetAmount) }}
            </span>
            <span v-else class="text-grey-5">-</span>
          </q-td>
        </template>

        <!-- Stakeholders -->
        <template v-slot:body-cell-stakeholders="props">
          <q-td :props="props">
            <div v-if="props.row.stakeholders && props.row.stakeholders.length > 0">
              <q-chip
                v-for="stakeholder in props.row.stakeholders.slice(0, 2)"
                :key="stakeholder.recCode"
                size="sm"
                outline
                color="primary"
                class="q-mr-xs"
              >
                {{ stakeholder.stakeholderName }}
              </q-chip>
              <q-chip
                v-if="props.row.stakeholders.length > 2"
                size="sm"
                color="grey"
                text-color="white"
              >
                +{{ props.row.stakeholders.length - 2 }}
              </q-chip>
            </div>
            <span v-else class="text-grey-5">-</span>
          </q-td>
        </template>

        <!-- Actions -->
        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <q-btn
              icon="settings"
              size="sm"
              flat
              round
              dense
              color="primary"
              @click="showNodeProperties(props.row)"
            >
              <q-tooltip>View Properties</q-tooltip>
            </q-btn>
          </q-td>
        </template>

        <!--  eslint-disable-next-line vue/no-unused-vars -->
        <template v-slot:bottom="props">
          <div class="row items-center full-width">
            <div class="col">
              <div class="text-caption text-grey-6">
                Showing {{ ((pagination.page - 1) * pagination.rowsPerPage) + 1 }}
                to {{ Math.min(pagination.page * pagination.rowsPerPage, pagination.rowsNumber) }}
                of {{ pagination.rowsNumber }} records
              </div>
            </div>
            <div class="col-auto">
              <q-pagination
                v-model="pagination.page"
                :max="Math.ceil(pagination.rowsNumber / pagination.rowsPerPage)"
                :max-pages="6"
                direction-links
                @update:model-value="onTableRequest({ pagination })"
              />
            </div>
            <div class="col-auto q-ml-md">
              <q-select
                v-model="pagination.rowsPerPage"
                :options="[10, 25, 50, 100, 200, 500, 1000, 2000]"
                label="Rows per page"
                dense
                outlined
                @update:model-value="onTableRequest({ pagination })"
                style="min-width: 120px"
              />
            </div>
          </div>
        </template>

        <!-- No data slot -->
        <template v-slot:no-data="{ message }">
          <div class="full-width row flex-center q-gutter-sm text-grey-6">
            <q-icon size="2em" name="inbox" />
            <span>{{ message }}</span>
          </div>
        </template>
      </q-table>
    </div>

    <!-- Add Nodes Dialog -->
    <q-dialog v-model="showAddDialog" persistent maximized>
      <q-card>
        <q-card-section class="row items-center">
          <div class="text-h6">Add Nodes in Bulk</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pa-md">
          <div class="row q-col-gutter-md q-mb-md">
            <!-- Node Type Selection -->
            <div class="col-12 col-md-6">
              <q-select
                v-model="bulkAdd.nodeTypeId"
                :options="nodeTypeOptions"
                option-label="typeName"
                option-value="recCode"
                label="Node Type *"
                filled
                dense
                emit-value
                map-options
                :rules="[val => !!val || 'Node type is required']"
              >
                <template v-slot:prepend>
                  <q-icon name="category" />
                </template>
              </q-select>
            </div>

            <!-- Parent Selection Info -->
            <div class="col-12 col-md-6">
              <q-banner
                class="bg-blue-1 text-blue-8"
                dense
                rounded
              >
                <template v-slot:avatar>
                  <q-icon name="info" color="blue" />
                </template>
                <div class="text-caption">
                  <strong v-if="selectedNodes.length === 0">
                    Will create as root level nodes
                  </strong>
                  <strong v-else>
                    Will create as children under {{ selectedNodes.length }} selected node(s)
                  </strong>
                </div>
              </q-banner>
            </div>
          </div>

          <!-- Bulk Properties -->
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12 col-md-4">
              <q-select
                v-model="bulkAdd.status"
                :options="statusOptions"
                label="Status"
                filled
                dense
                emit-value
                map-options
              />
            </div>
            <div class="col-12 col-md-4">
              <q-select
                v-model="bulkAdd.priority"
                :options="priorityOptions"
                label="Priority"
                filled
                dense
                emit-value
                map-options
              />
            </div>
            <div class="col-12 col-md-4">
              <q-input
                v-model.number="bulkAdd.budgetAmount"
                label="Budget Amount"
                filled
                dense
                type="number"
                prefix="₹"
              />
            </div>
          </div>

          <!-- Date Range -->
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12 col-md-6">
              <q-input
                v-model="bulkAdd.startDate"
                label="Start Date"
                filled
                dense
                mask="##-##-####"
              >
                <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date
                        v-model="bulkAdd.startDate"
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
            <div class="col-12 col-md-6">
              <q-input
                v-model="bulkAdd.endDate"
                label="End Date"
                filled
                dense
                mask="##-##-####"
              >
                <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date
                        v-model="bulkAdd.endDate"
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
          </div>

          <!-- Stakeholder Assignment -->
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12 col-md-6">
              <q-select
                v-model="bulkAdd.stakeholderId"
                :options="stakeholderOptions"
                option-label="stakeholderName"
                option-value="recCode"
                label="Assign Stakeholder"
                filled
                dense
                emit-value
                map-options
                clearable
                use-input
                @filter="filterStakeholders"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="bulkAdd.assignmentType"
                label="Assignment Type"
                filled
                dense
                :disable="!bulkAdd.stakeholderId"
                placeholder="e.g., Primary Contractor, Engineer"
              />
            </div>
          </div>

          <!-- Node Names Input -->
          <div class="q-mb-md">
            <label class="text-subtitle2 q-mb-sm block">Node Names (one per line) *</label>
            <q-input
              v-model="bulkAdd.nodeNames"
              type="textarea"
              rows="8"
              filled
              placeholder="Enter node names, one per line:&#10;Node 1&#10;Node 2&#10;Node 3"
              :rules="[val => !!val && val.trim() || 'At least one node name is required']"
            />
            <div class="text-caption text-grey-6 q-mt-xs">
              <template v-if="selectedNodes.length === 0">
                {{ getNodeNamesCount() }} root node(s) will be created
              </template>
              <template v-else>
                {{ selectedNodes.length }} parent(s) × {{ getNodeNamesCount() }} name(s) = {{ getTotalNodesToCreate() }} total node(s) will be created
              </template>
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancel" @click="cancelAdd" />
          <q-btn
            label="Create Nodes"
            color="positive"
            @click="executeAdd"
            :loading="isCreating"
            :disable="!canCreateNodes"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Edit Nodes Dialog -->
    <q-dialog v-model="showEditDialog" persistent>
      <q-card style="min-width: 600px">
        <q-card-section>
          <div class="text-h6">Edit {{ selectedNodes.length }} Node(s)</div>
          <p class="text-grey-6">Changes will be applied to all selected nodes</p>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pt-none">
          <div class="row q-col-gutter-md">
            <!-- Basic Properties -->
            <div class="col-12">
              <q-input
                v-model="bulkEdit.nodeDescription"
                label="Description (leave empty to keep current)"
                filled
                dense
                type="textarea"
                rows="2"
              />
            </div>

            <div class="col-6">
              <q-input
                v-model="bulkEdit.startDate"
                label="Start Date"
                filled
                dense
                mask="##-##-####"
              >
                <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date
                        v-model="bulkEdit.startDate"
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

            <div class="col-6">
              <q-input
                v-model="bulkEdit.endDate"
                label="End Date"
                filled
                dense
                mask="##-##-####"
              >
                <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date
                        v-model="bulkEdit.endDate"
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

            <div class="col-6">
              <q-select
                v-model="bulkEdit.status"
                :options="[{ label: 'Keep Current', value: null }, ...statusOptions]"
                label="Status"
                filled
                dense
                emit-value
                map-options
              />
            </div>

            <div class="col-6">
              <q-select
                v-model="bulkEdit.priority"
                :options="[{ label: 'Keep Current', value: null }, ...priorityOptions]"
                label="Priority"
                filled
                dense
                emit-value
                map-options
              />
            </div>

            <div class="col-12">
              <q-input
                v-model.number="bulkEdit.budgetAmount"
                label="Budget Amount (leave empty to keep current)"
                filled
                dense
                type="number"
                prefix="₹"
              />
            </div>

            <!-- Stakeholder Assignment -->
            <div class="col-6">
              <q-select
                v-model="bulkEdit.stakeholderId"
                :options="[{ stakeholderName: 'Keep Current', recCode: null }, ...stakeholderOptions]"
                option-label="stakeholderName"
                option-value="recCode"
                label="Assign Stakeholder"
                filled
                dense
                emit-value
                map-options
                use-input
                @filter="filterStakeholders"
              />
            </div>
            <div class="col-6">
              <q-input
                v-model="bulkEdit.assignmentType"
                label="Assignment Type"
                filled
                dense
                :disable="!bulkEdit.stakeholderId"
              />
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="cancelEdit" />
          <q-btn
            label="Update Nodes"
            color="primary"
            @click="executeEdit"
            :loading="isUpdating"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Node Properties Drawer -->
    <ProjectNodeProperties
      v-if="selectedNodeForProperties"
      v-model="showPropertiesDrawer"
      :node-id="selectedNodeForProperties.recCode"
      :node-name="selectedNodeForProperties.nodeName"
      :node-type="getNodeTypeName(selectedNodeForProperties.nodeTypeId)"
      :node-type-id="selectedNodeForProperties.nodeTypeId"
      :node-icon="getNodeTypeIcon(selectedNodeForProperties.nodeTypeId)"
      :icon-color="getNodeTypeColor(selectedNodeForProperties.nodeTypeId)"
      :completion-percentage="selectedNodeForProperties.completionPercentage"
      @node-updated="handleNodeUpdated"
    />
  </q-page>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useProjectStore } from 'stores/project'
import projectService from 'src/services/api/project.service'
import stakeholderService from 'src/services/api/stakeholder.service'
import { showSuccess, showError } from 'src/utils/notification'
import ProjectNodeProperties from 'src/components/ProjectNodeProperties.vue'
import SearchChips from 'src/components/SearchChips.vue'

export default {
  name: 'BulkNodeManagement',

  components: {
    ProjectNodeProperties,
    SearchChips
  },

  setup() {
    const $q = useQuasar()
    const projectStore = useProjectStore()

    // Reactive data
    const isLoading = ref(false)
    const isCreating = ref(false)
    const isUpdating = ref(false)
    const nodes = ref([])
    const selectedNodes = ref([])
    const currentKeywords = ref([])
    const projects = ref([])
    const nodeTypes = ref([])
    const stakeholders = ref([])
    const filteredStakeholders = ref([])

    // Filters
    const selectedProject = ref(null)
    const searchQuery = ref('')
    const statusFilter = ref(null)

    // Dialogs
    const showAddDialog = ref(false)
    const showEditDialog = ref(false)
    const showPropertiesDrawer = ref(false)
    const selectedNodeForProperties = ref(null)

    // Bulk add form
    const bulkAdd = ref({
      nodeTypeId: null,
      status: 'Not Started',
      priority: 'Medium',
      budgetAmount: null,
      startDate: '',
      endDate: '',
      stakeholderId: null,
      assignmentType: '',
      nodeNames: ''
    })

    // Bulk edit form
    const bulkEdit = ref({
      nodeDescription: '',
      startDate: '',
      endDate: '',
      status: null,
      priority: null,
      budgetAmount: null,
      stakeholderId: null,
      assignmentType: ''
    })

    // Table configuration
    const pagination = ref({
      page: 1,
      rowsPerPage: 100,
      rowsNumber: 0,
      sortBy: 'insertDate',
      descending: false
    })

    const columns = [
      {
        name: 'nodeName',
        required: true,
        label: 'Node Name & Path',
        align: 'left',
        field: 'nodeName',
        sortable: true,
        style: 'width: 300px'
      },
      {
        name: 'nodeType',
        align: 'left',
        label: 'Type',
        field: 'nodeTypeId',
        sortable: true
      },
      {
        name: 'status',
        align: 'center',
        label: 'Status',
        field: 'status',
        sortable: true
      },
      {
        name: 'priority',
        align: 'center',
        label: 'Priority',
        field: 'priority',
        sortable: true
      },
      {
        name: 'budgetAmount',
        align: 'right',
        label: 'Budget',
        field: 'budgetAmount',
        sortable: true
      },
      {
        name: 'stakeholders',
        align: 'left',
        label: 'Stakeholders',
        field: 'stakeholders',
        sortable: false
      },
      {
        name: 'insertDate',
        align: 'center',
        label: 'Created',
        field: 'insertDate',
        sortable: true,
        format: val => val ? new Date(val).toLocaleDateString() : '-'
      },
      {
        name: 'actions',
        align: 'center',
        label: 'Actions',
        field: 'actions',
        sortable: false
      }
    ]

    // Options
    const statusOptions = [
      { label: 'Not Started', value: 'Not Started' },
      { label: 'In Progress', value: 'In Progress' },
      { label: 'On Hold', value: 'On Hold' },
      { label: 'Completed', value: 'Completed' },
      { label: 'Cancelled', value: 'Cancelled' }
    ]

    const priorityOptions = [
      { label: 'Low', value: 'Low' },
      { label: 'Medium', value: 'Medium' },
      { label: 'High', value: 'High' },
      { label: 'Urgent', value: 'Urgent' }
    ]

    // Computed properties
    const projectOptions = computed(() => projects.value)
    const nodeTypeOptions = computed(() => nodeTypes.value)
    const stakeholderOptions = computed(() => filteredStakeholders.value)

    const parentNodeOptions = computed(() => {
      // No longer needed since we use QTable selection
      return []
    })

    const canCreateNodes = computed(() => {
      return bulkAdd.value.nodeTypeId && bulkAdd.value.nodeNames.trim()
    })

    // Search Chips
    const handleSearch = async (keywords) => {
      console.log('Search triggered via event:', keywords)
      currentKeywords.value = [...keywords]
      pagination.value.page = 1 // Reset to first page for new search
      await loadNodes(keywords)
    }

    // Handle chips updates
    const handleChipsUpdated = (keywords) => {
      console.log('Keywords updated:', keywords)
      currentKeywords.value = [...keywords]
      pagination.value.page = 1 // Reset to first page for new search
      loadNodes(keywords) // Immediate search on chip updates
    }

    // Utility functions
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
    }

    const formatCurrency = (amount) => {
      if (!amount) return '0'
      return new Intl.NumberFormat('en-IN').format(amount)
    }

    const getNodeNamesCount = () => {
      if (!bulkAdd.value.nodeNames) return 0
      return bulkAdd.value.nodeNames.trim().split('\n').filter(name => name.trim()).length
    }

    const getTotalNodesToCreate = () => {
      const nameCount = getNodeNamesCount()
      // eslint-disable-next-line no-unused-vars
      const parentCount = selectedNodes.value.length || 1 // At least 1 for root level
      return nameCount * (selectedNodes.value.length || 1)
    }

    const formatDateForBackend = (dateStr) => {
      if (!dateStr) return null
      const [day, month, year] = dateStr.split('-')
      return `${year}-${month}-${day}`
    }

    // Node type helpers
    const getNodeTypeName = (nodeTypeId) => {
      const nodeType = nodeTypes.value.find(t => t.recCode === nodeTypeId)
      return nodeType ? nodeType.typeName : 'Unknown'
    }

    const getNodeTypeIcon = (nodeTypeId) => {
      const nodeType = nodeTypes.value.find(t => t.recCode === nodeTypeId)
      return nodeType ? nodeType.iconName || 'folder' : 'folder'
    }

    const getNodeTypeColor = (nodeTypeId) => {
      const nodeType = nodeTypes.value.find(t => t.recCode === nodeTypeId)
      return nodeType ? nodeType.colorCode || 'primary' : 'primary'
    }

    // Status/Priority color helpers
    const getStatusColor = (status) => {
      const colorMap = {
        'Not Started': 'grey',
        'In Progress': 'primary',
        'On Hold': 'warning',
        'Completed': 'positive',
        'Cancelled': 'negative'
      }
      return colorMap[status] || 'grey'
    }

    const getPriorityColor = (priority) => {
      const colorMap = {
        'Low': 'grey',
        'Medium': 'primary',
        'High': 'warning',
        'Urgent': 'negative'
      }
      return colorMap[priority] || 'grey'
    }

    // Data loading functions
    const loadProjects = async () => {
      try {
        const response = await projectService.getAllProjects({ size: 1000 })
        if (response.success) {
          projects.value = response.data.content || []
        }
      } catch (error) {
        console.error('Failed to load projects:', error)
      }
    }

    const loadNodeTypes = async () => {
      try {
        const types = await projectStore.fetchNodeTypes()
        nodeTypes.value = types
      } catch (error) {
        console.error('Failed to load node types:', error)
      }
    }

    const loadStakeholders = async () => {
      try {
        const response = await stakeholderService.getAllStakeholders({ size: 1000 })
        if (response.success) {
          stakeholders.value = response.data.content || []
          filteredStakeholders.value = stakeholders.value
        }
      } catch (error) {
        console.error('Failed to load stakeholders:', error)
      }
    }

    const loadNodes = async (keywords = []) => {
      isLoading.value = true
      try {
        const params = {
          page: pagination.value.page - 1,
          size: pagination.value.rowsPerPage,
          sort: pagination.value.sortBy,
          direction: pagination.value.descending ? 'DESC' : 'ASC'
        }

        // Add project filter if selected
        if (selectedProject.value) {
          params.projectId = selectedProject.value
        }

        // Add status filter if selected
        if (statusFilter.value) {
          params.status = statusFilter.value
        }

        // Use hierarchical search with keywords
        const response = await projectService.searchNodesWithPathsArray(keywords, params)

        if (response.success) {
          nodes.value = await Promise.all(response.data.content.map(async (node) => {
            // Parse breadcrumb path from treePath (already excludes current node)
            try {
              if (node.treePath && typeof node.treePath === 'string') {
                node.breadcrumbPath = JSON.parse(node.treePath)
              } else if (Array.isArray(node.treePath)) {
                node.breadcrumbPath = node.treePath
              } else {
                node.breadcrumbPath = []
              }
            // eslint-disable-next-line no-unused-vars
            } catch (error) {
              node.breadcrumbPath = []
            }

            // Get stakeholder assignments
            try {
              const stakeholderResponse = await stakeholderService.getActiveAssignmentsForNode(node.recCode)
              if (stakeholderResponse.success) {
                node.stakeholders = stakeholderResponse.data.map(assignment => ({
                  recCode: assignment.stakeholder.recCode,
                  stakeholderName: assignment.stakeholder.stakeholderName,
                  assignmentType: assignment.assignmentType
                }))
              } else {
                node.stakeholders = []
              }
            // eslint-disable-next-line no-unused-vars
            } catch (error) {
              node.stakeholders = []
            }

            return node
          }))

          pagination.value.rowsNumber = response.data.totalElements
        }
      } catch (error) {
        showError('Failed to load nodes')
        console.error(error)
      } finally {
        isLoading.value = false
      }
    }

    // Table request handler
    const onTableRequest = (props) => {
      pagination.value.page = props.pagination.page
      pagination.value.rowsPerPage = props.pagination.rowsPerPage
      pagination.value.sortBy = props.pagination.sortBy
      pagination.value.descending = props.pagination.descending
      pagination.value.rowsNumber = props.pagination.rowsNumber

      // Use current keywords for pagination/sorting
      loadNodes(currentKeywords.value)
    }

    // Filter functions
    const filterStakeholders = (val, update) => {
      update(() => {
        if (val === '') {
          filteredStakeholders.value = stakeholders.value
        } else {
          const needle = val.toLowerCase()
          filteredStakeholders.value = stakeholders.value.filter(
            s => s.stakeholderName.toLowerCase().indexOf(needle) > -1
          )
        }
      })
    }

    // Selection functions
    const clearSelection = () => {
      selectedNodes.value = []
    }

    // Add operations
    const executeAdd = async () => {
      if (!canCreateNodes.value) return

      isCreating.value = true
      try {
        const nodeNames = bulkAdd.value.nodeNames.trim().split('\n').filter(name => name.trim())
        const parentNodes = selectedNodes.value.length > 0 ? selectedNodes.value : [null] // null = root level

        const nodesToCreate = []

        // Create nodes for each parent × each name combination
        parentNodes.forEach(parentNode => {
          nodeNames.forEach(name => {
            nodesToCreate.push({
              recCode: generateUUID(),
              nodeName: name.trim(),
              nodeDescription: '',
              parentNodeId: parentNode ? parentNode.recCode : null,
              nodeTypeId: bulkAdd.value.nodeTypeId,
              startDate: formatDateForBackend(bulkAdd.value.startDate),
              endDate: formatDateForBackend(bulkAdd.value.endDate),
              status: bulkAdd.value.status,
              priority: bulkAdd.value.priority,
              budgetAmount: bulkAdd.value.budgetAmount || 0,
              stakeholderAssignments: bulkAdd.value.stakeholderId ? [{
                stakeholderId: bulkAdd.value.stakeholderId,
                assignmentType: bulkAdd.value.assignmentType || 'Assigned'
              }] : [],
              tags: []
            })
          })
        })

        // Call bulk create API (assumed endpoint)
        const response = await projectService.bulkCreateNodes({ nodes: nodesToCreate })

        if (response.success) {
          const totalCreated = nodesToCreate.length
          showSuccess(`Successfully created ${totalCreated} nodes`)
          showAddDialog.value = false
          resetAddForm()
          clearSelection() // Clear selection after creation
          await loadNodes(currentKeywords.value)
        }
      } catch (error) {
        showError('Failed to create nodes. Transaction rolled back.')
        console.error(error)
      } finally {
        isCreating.value = false
      }
    }

    const cancelAdd = () => {
      showAddDialog.value = false
      resetAddForm()
    }

    const resetAddForm = () => {
      bulkAdd.value = {
        nodeTypeId: null,
        status: 'Not Started',
        priority: 'Medium',
        budgetAmount: null,
        startDate: '',
        endDate: '',
        stakeholderId: null,
        assignmentType: '',
        nodeNames: ''
      }
    }

    // Edit operations
    const executeEdit = async () => {
      if (selectedNodes.value.length === 0) return

      isUpdating.value = true
      try {
        const updates = selectedNodes.value.map(node => {
          const update = { nodeId: node.recCode }

          // Only include fields that have values
          if (bulkEdit.value.nodeDescription.trim()) {
            update.nodeDescription = bulkEdit.value.nodeDescription
          }
          if (bulkEdit.value.startDate) {
            update.startDate = formatDateForBackend(bulkEdit.value.startDate)
          }
          if (bulkEdit.value.endDate) {
            update.endDate = formatDateForBackend(bulkEdit.value.endDate)
          }
          if (bulkEdit.value.status) {
            update.status = bulkEdit.value.status
          }
          if (bulkEdit.value.priority) {
            update.priority = bulkEdit.value.priority
          }
          if (bulkEdit.value.budgetAmount !== null && bulkEdit.value.budgetAmount !== undefined) {
            update.budgetAmount = bulkEdit.value.budgetAmount
          }
          if (bulkEdit.value.stakeholderId) {
            update.stakeholderAssignments = [{
              stakeholderId: bulkEdit.value.stakeholderId,
              assignmentType: bulkEdit.value.assignmentType || 'Assigned'
            }]
          }

          return update
        })

        // Call bulk update API (assumed endpoint)
        const response = await projectService.bulkUpdateNodes({ updates })

        if (response.success) {
          showSuccess(`Successfully updated ${selectedNodes.value.length} nodes`)
          showEditDialog.value = false
          resetEditForm()
          clearSelection()
          await loadNodes(currentKeywords.value)
        }
      } catch (error) {
        showError('Failed to update nodes. Transaction rolled back.')
        console.error(error)
      } finally {
        isUpdating.value = false
      }
    }

    const cancelEdit = () => {
      showEditDialog.value = false
      resetEditForm()
    }

    const resetEditForm = () => {
      bulkEdit.value = {
        nodeDescription: '',
        startDate: '',
        endDate: '',
        status: null,
        priority: null,
        budgetAmount: null,
        stakeholderId: null,
        assignmentType: ''
      }
    }

    // Delete operations
    const confirmBulkDelete = () => {
      if (selectedNodes.value.length === 0) return

      // Check if any selected node has children
      // eslint-disable-next-line no-unused-vars
      const nodesWithChildren = selectedNodes.value.filter(node => {
        // This would need to be determined from the node data or an API call
        return false // Assume no children for now
      })

      let message = `Are you sure you want to delete ${selectedNodes.value.length} node(s)?`
      if (nodesWithChildren.length > 0) {
        message += ` ${nodesWithChildren.length} node(s) have children and cannot be deleted.`
      }

      $q.dialog({
        title: 'Confirm Bulk Delete',
        message,
        cancel: true,
        persistent: true,
        color: 'negative'
      }).onOk(async () => {
        await executeBulkDelete()
      })
    }

    const executeBulkDelete = async () => {
      try {
        const nodeIds = selectedNodes.value.map(node => node.recCode)

        // Call bulk delete API (assumed endpoint)
        const response = await projectService.bulkDeleteNodes({
          nodeIds,
          force: false
        })

        if (response.success) {
          showSuccess(`Successfully deleted ${nodeIds.length} nodes`)
          clearSelection()
          await loadNodes(currentKeywords.value)
        }
      } catch (error) {
        showError('Failed to delete nodes. Transaction rolled back.')
        console.error(error)
      }
    }

    // Property operations
    const showNodeProperties = (node) => {
      selectedNodeForProperties.value = node
      showPropertiesDrawer.value = true
    }

    const handleNodeUpdated = ({ nodeId, updates }) => {
      // Update the node in the local array
      const nodeIndex = nodes.value.findIndex(n => n.recCode === nodeId)
      if (nodeIndex !== -1) {
        nodes.value[nodeIndex] = { ...nodes.value[nodeIndex], ...updates }
      }
    }

    // Extended project service with bulk operations
    /* projectService.bulkCreateNodes = async (data) => {
      // This would be implemented when the actual API is available
      return await projectService.api.post('/projects/nodes/bulk', data)
    }

    projectService.bulkUpdateNodes = async (data) => {
      // This would be implemented when the actual API is available
      return await projectService.api.put('/projects/nodes/bulk', data)
    }

    projectService.bulkDeleteNodes = async (data) => {
      // This would be implemented when the actual API is available
      return await projectService.api.delete('/projects/nodes/bulk', { data })
    } */

    // Lifecycle
    onMounted(async () => {
      await Promise.all([
        loadProjects(),
        loadNodeTypes(),
        loadStakeholders()
      ])
      // await loadNodes()
    })

    // Watchers
    watch([selectedProject, statusFilter], () => {
      pagination.value.page = 1
      // Clear keywords when project changes, keep when status changes
      if (selectedProject.value) {
        currentKeywords.value = [] // Reset keywords on project change
      }
      loadNodes(currentKeywords.value)
    })

    return {
      // State
      isLoading,
      isCreating,
      isUpdating,
      nodes,
      selectedNodes,
      projects,
      nodeTypes,
      stakeholders,
      currentKeywords,

      // Filters
      selectedProject,
      searchQuery,
      statusFilter,

      // Dialogs
      showAddDialog,
      showEditDialog,
      showPropertiesDrawer,
      selectedNodeForProperties,

      // Forms
      bulkAdd,
      bulkEdit,

      // Table
      pagination,
      columns,

      // Options
      statusOptions,
      priorityOptions,
      projectOptions,
      nodeTypeOptions,
      stakeholderOptions,
      parentNodeOptions,

      // Computed
      canCreateNodes,

      // Methods
      loadNodes,
      onTableRequest,
      filterStakeholders,
      clearSelection,
      executeAdd,
      cancelAdd,
      resetAddForm,
      executeEdit,
      cancelEdit,
      resetEditForm,
      confirmBulkDelete,
      executeBulkDelete,
      showNodeProperties,
      handleNodeUpdated,

      // Utilities
      formatCurrency,
      getNodeNamesCount,
      getTotalNodesToCreate,
      getNodeTypeName,
      getNodeTypeIcon,
      getNodeTypeColor,
      getStatusColor,
      getPriorityColor,
      // Search
      handleSearch,
      handleChipsUpdated
    }
  }
}
</script>

<style lang="scss" scoped>
.bulk-nodes-container {
  max-width: 100%;
}

.page-header {
  margin-bottom: 24px;
}

.selection-banner {
  .q-banner {
    border-radius: 8px;
  }
}

.nodes-table {
  .node-name-container {
    .node-name {
      font-size: 14px;
      margin-bottom: 4px;
    }

    .breadcrumb-path {
      font-size: 12px;
      line-height: 1.2;
      max-width: 280px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: normal;
    }
  }
}

// Responsive adjustments
@media (max-width: 768px) {
  .nodes-table {
    ::v-deep(.q-table__container) {
      .q-table__middle {
        overflow-x: auto;
      }
    }
  }

  .node-name-container {
    .breadcrumb-path {
      max-width: 200px;
      word-wrap: break-word;
      white-space: normal;
    }
  }
}

// Table styling
.nodes-table {
  ::v-deep(.q-table__top) {
    padding: 12px 16px;
  }

  ::v-deep(.q-table__bottom) {
    padding: 12px 16px;
  }

  ::v-deep(.q-table th) {
    font-weight: 600;
    text-transform: uppercase;
    font-size: 12px;
    letter-spacing: 0.5px;
  }

  ::v-deep(.q-table td) {
    padding: 12px 16px;
  }

  ::v-deep(.q-table tbody tr:hover) {
    background-color: rgba(0, 0, 0, 0.02);
  }
}

// Dialog styling
.q-dialog .q-card {
  .q-card-section {
    &:first-child {
      border-bottom: 1px solid #e0e0e0;
    }

    &:last-child {
      border-top: 1px solid #e0e0e0;
    }
  }
}

// Form styling
.q-field {
  .q-field__control {
    height: 40px;
  }

  &.q-field--dense .q-field__control {
    height: 32px;
  }
}
</style>
