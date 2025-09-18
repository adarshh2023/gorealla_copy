<template>
  <q-page padding>
    <div class="column-view-container">
      <!-- Header -->
      <div class="view-header">
        <div class="row">
          <div class="col-xs-10 col-sm-10 col-md-6 q-pa-xs">
            <q-select
              v-model="selectedRootNode"
              :options="rootNodeOptions"
              option-label="nodeName"
              option-value="recCode"
              label="Select Project"
              filled
              dense
              emit-value
              map-options
              @update:model-value="onRootNodeChange"
            >
              <template v-slot:prepend>
                <q-icon name="business" />
              </template>
            </q-select>
          </div>
          <div class="col-xs-1 col-sm-1 col-md-1 q-pa-xs">
            <q-btn
              color="primary"
              icon="account_tree"
              flat
              @click="showNewProjectDialog = true"
            >
              <q-tooltip>Add a Project</q-tooltip>
            </q-btn>
          </div>
          <div class="col-xs-12 col-sm-12 col-md-5 q-pa-xs">
            <SearchChips
              placeholder="Search properties..."
              @search="handleSearch"
              @chips-updated="handleChipsUpdated"
              :max-chips="5"
            />
            <!-- <q-input
              v-model="searchNodes"
              dense
              standout="bg-primary text-white"
              :placeholder="showSearchResults ? 'Search results - press Esc to clear' : 'Search nodes...'"
              class="q-mr-md search-input"
              :loading="isSearching"
              @keydown="handleSearchKeydown"
            >
              <template v-slot:prepend>
                <q-icon :name="showSearchResults ? 'search_off' : 'search'" />
              </template>
              <template v-slot:append>
                <q-icon
                  v-if="searchNodes || showSearchResults"
                  :name="showSearchResults ? 'clear_all' : 'close'"
                  class="cursor-pointer"
                  @click="clearSearch"
                >
                  <q-tooltip>{{ showSearchResults ? 'Clear search and restore view' : 'Clear search' }}</q-tooltip>
                </q-icon>
              </template>
            </q-input> -->
          </div>
        </div>
      </div>

      <!-- Columns Container -->
      <div v-if="selectedRootNode" class="columns-wrapper">
        <!-- Breadcrumb Path Bar -->
        <div class="breadcrumb-bar">
          <q-breadcrumbs
            active-color="primary"
            separator-color="grey-5"
            class="breadcrumb-navigation"
          >
            <!-- Project root breadcrumb -->
            <q-breadcrumbs-el
              :label="selectedProjectName"
              icon="business"
              class="breadcrumb-item cursor-pointer"
              tabindex="0"
              role="button"
              :aria-label="`Navigate to project ${selectedProjectName}`"
              @click="navigateToBreadcrumb(-1)"
              @keydown="handleBreadcrumbKeydown($event, -1)"
            >
              <q-tooltip>Click to navigate to project root</q-tooltip>
            </q-breadcrumbs-el>

            <!-- Node path breadcrumbs -->
            <q-breadcrumbs-el
              v-for="(nodeId, index) in selectedNodesPath"
              :key="`breadcrumb-${nodeId}-${index}`"
              :label="getNodeName(nodeId, index)"
              class="breadcrumb-item cursor-pointer"
              tabindex="0"
              role="button"
              :aria-label="`Navigate to ${getNodeName(nodeId, index)}`"
              @click="navigateToBreadcrumb(index)"
              @keydown="handleBreadcrumbKeydown($event, index)"
            >
              <q-tooltip>Click to navigate to {{ getNodeName(nodeId, index) }}</q-tooltip>
            </q-breadcrumbs-el>
          </q-breadcrumbs>

          <div class="breadcrumb-actions">
            <q-btn
              icon="refresh"
              size="sm"
              flat
              round
              dense
              color="primary"
              @click="refreshCurrentView"
              class="q-ml-sm"
            >
              <q-tooltip>Refresh current view</q-tooltip>
            </q-btn>

            <q-btn
              icon="home"
              size="sm"
              flat
              round
              dense
              color="primary"
              @click="navigateToBreadcrumb(-1)"
              class="q-ml-xs"
            >
              <q-tooltip>Go to project root</q-tooltip>
            </q-btn>
          </div>
        </div>

        <div class="columns-scroll-container">
          <div class="columns-flex-container">
            <!-- Search Results View -->
            <div v-if="showSearchResults" class="search-results-container">
              <div class="search-results-column node-column">
                <!-- Search Results Header -->
                <div class="column-header">
                  <div class="column-title">
                    <q-icon name="search" class="q-mr-sm" />
                    {{ isSearching ? 'Searching...' : `Search Results (${searchResults.length})` }}
                  </div>
                  <div class="search-actions">
                    <q-btn
                      icon="clear_all"
                      size="sm"
                      round
                      flat
                      color="primary"
                      @click="clearSearch"
                    >
                      <q-tooltip>Clear search and restore view</q-tooltip>
                    </q-btn>
                  </div>
                </div>

                <!-- Search Results Content -->
                <div class="column-content">
                  <!-- Loading State -->
                  <div v-if="isSearching" class="search-loading">
                    <q-spinner-dots size="48px" color="primary" />
                    <p class="text-grey-6 q-mt-md">Searching nodes...</p>
                  </div>

                  <!-- No Results State -->
                  <div v-else-if="searchResults.length === 0" class="empty-column">
                    <q-icon name="search_off" size="48px" color="grey-5" />
                    <p class="text-grey-6 q-mt-md">No nodes found</p>
                    <p class="text-grey-5 text-caption">Try adjusting your search terms</p>
                  </div>

                  <!-- Search Results -->
                  <div v-else class="search-results-list">
                    <div
                      v-for="node in searchResults"
                      :key="node.recCode"
                      class="search-result-item"
                    >
                      <ProjectNodeCard
                        :node-id="node.recCode"
                        :node-name="node.nodeName"
                        :node-icon="node.icon"
                        :icon-color="node.iconColor"
                        :node-type="node.nodeType"
                        :node-type-id="node.nodeTypeId"
                        :parent-node-id="node.parentNodeId"
                        :is-new="false"
                        :is-selected="false"
                        :has-children="node.hasChildren"
                        :completion-percentage="node.completionPercentage"
                        :node-states="node.states || []"
                        style="margin-bottom: 20px;"
                        @node-click="handleSearchResultClick(node)"
                        @show-properties="handleShowProperties"
                      />

                      <!-- Search result path display -->
                      <div v-if="node.breadcrumbPath && node.breadcrumbPath.length > 0" class="search-result-path">
                        <q-icon name="place" size="xs" class="q-mr-xs text-grey-6" />
                        <span class="text-caption text-grey-6">
                          {{ node.breadcrumbPath.map(p => p.nodeName).join(' → ') }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Normal Columns View -->
            <template v-else>
              <!-- Generate columns based on selection path -->
              <div
                v-for="(column, index) in columns"
                :key="column.id"
                class="node-column"
              >
                <!-- Column Header -->
                <div class="column-header">
                  <div class="column-title-container">
                    <div class="column-title">
                      {{ column.title }}
                    </div>
                    <div class="column-search-controls">
                      <!-- Search Toggle Icon -->
                      <q-btn
                        :icon="columnSearchStates[index]?.visible ? 'search_off' : 'search'"
                        size="sm"
                        flat
                        round
                        dense
                        color="primary"
                        @click="toggleColumnSearch(index)"
                        class="search-toggle-btn"
                      >
                        <q-tooltip>{{ columnSearchStates[index]?.visible ? 'Hide search' : 'Search nodes' }}</q-tooltip>
                        <!-- Active filter badge -->
                        <q-badge
                          v-if="columnSearchStates[index]?.term"
                          color="orange"
                          floating
                          rounded
                        >
                          {{ getFilteredNodes(column, index).length }}
                        </q-badge>
                      </q-btn>
                    </div>
                    <div class="column-header-actions">
                      <!-- Existing add button -->
                      <q-btn
                        v-if="column.isLoading"
                        size="sm"
                        round
                        flat
                        color="primary"
                        :loading="true"
                      >
                        <q-tooltip>Loading...</q-tooltip>
                      </q-btn>
                      <q-btn
                        v-else
                        icon="add"
                        size="sm"
                        round
                        flat
                        color="primary"
                        @click="addNodeToColumn(index)"
                      >
                        <q-tooltip>Add node</q-tooltip>
                      </q-btn>
                    </div>
                  </div>

                  <!-- Expandable Search Input -->
                  <div
                    v-if="columnSearchStates[index]?.visible"
                    class="column-search-input"
                  >
                    <q-input
                      v-model="columnSearchStates[index].term"
                      placeholder="Search nodes..."
                      dense
                      filled
                      debounce="300"
                      class="search-input-field"
                    >
                      <template v-slot:prepend>
                        <q-icon name="search" size="xs" />
                      </template>
                      <template v-slot:append>
                        <q-icon
                          v-if="columnSearchStates[index]?.term"
                          name="close"
                          size="xs"
                          class="cursor-pointer"
                          @click="clearColumnSearch(index)"
                        >
                          <q-tooltip>Clear search</q-tooltip>
                        </q-icon>
                      </template>
                    </q-input>
                  </div>
                </div>

                <!-- Column Content with Filtered Nodes -->
                <div
                  class="column-content"
                  @dragover="handleColumnDragOver($event, column, index)"
                  @dragenter="handleColumnDragEnter($event, column)"
                  @dragleave="handleColumnDragLeave($event)"
                  @drop="handleColumnDrop($event, column, index)"
                  :class="getColumnDragClasses(column)"
                >
                  <!-- Loading State -->
                  <div v-if="column.isLoading" class="loading-column">
                    <q-spinner-dots size="48px" color="primary" />
                    <p class="text-grey-6 q-mt-md">Loading nodes...</p>
                  </div>

                  <!-- Empty State with Drop Zone -->
                  <div
                    v-else-if="getFilteredNodes(column, index).length === 0"
                    class="empty-column drop-zone"
                    :class="{ 'drag-over-valid': isDragging && canDropInColumn(column) }"
                  >
                    <q-icon name="folder_open" size="48px" color="grey-5" />
                    <p class="text-grey-6 q-mt-md">No nodes</p>
                    <p v-if="isDragging && canDropInColumn(column)" class="text-primary text-caption q-mt-sm">
                      Drop here to move node
                    </p>
                  </div>

                  <!-- Node Cards -->
                  <ProjectNodeCard
                    v-for="node in getFilteredNodes(column, index)"
                    :key="node.recCode"
                    :node-id="node.recCode"
                    :node-name="node.nodeName"
                    :node-icon="node.icon"
                    :icon-color="node.iconColor"
                    :node-type="node.nodeType"
                    :node-type-id="node.nodeTypeId"
                    :parent-node-id="column.parentId"
                    :is-new="node.isNew"
                    :is-selected="selectedNodes[index] === node.recCode"
                    :has-children="node.hasChildren"
                    :completion-percentage="node.completionPercentage"
                    :node-states="node.states || []"
                    :class="getNodeDragClasses(node)"
                    style="margin-bottom: 20px;"
                    @node-click="handleNodeClick(node, index)"
                    @node-edit="handleNodeEdit"
                    @node-delete="handleNodeDelete"
                    @show-properties="handleShowProperties"
                    @select-node-type="handleSelectNodeType(node, $event)"
                    @save-new-node="handleSaveNewNode"
                    @dragstart="handleNodeDragStart($event, $event, node)"
                    @dragend="handleNodeDragEnd($event)"
                    @dragover="handleNodeDragOver($event, node)"
                    @dragenter="handleNodeDragEnter($event, node)"
                    @dragleave="handleNodeDragLeave($event)"
                    @drop="handleNodeDrop($event, node, index)"
                  />
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <q-card>
          <q-card-section class="text-center q-pa-lg">
            <q-icon name="view_column" size="64px" color="grey-5" />
            <p class="text-h6 text-grey-7 q-mt-md">Select a project to view its column structure</p>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Context Menu for Node Type Selection -->
    <q-menu
      v-model="nodeTypeMenuVisible"
      :target="nodeTypeMenuTarget"
      anchor="bottom left"
      self="top left"
    >
      <q-list dense style="min-width: 250px">
        <q-item-label header class="text-grey-8">Select Node Type</q-item-label>
        <q-item
          v-for="nodeType in nodeTypes"
          :key="nodeType.recCode"
          clickable
          v-close-popup
          @click="setNodeType(contextNode, nodeType)"
        >
          <q-item-section avatar>
            <q-icon
              :name="nodeType.iconName || 'folder'"
              :color="nodeType.colorCode ? undefined : 'primary'"
              :style="nodeType.colorCode ? `color: ${nodeType.colorCode}` : ''"
            />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ nodeType.typeName }}</q-item-label>
            <q-item-label caption v-if="nodeType.typeDescription">
              {{ nodeType.typeDescription }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-menu>

    <!-- New Project Dialog -->
    <q-dialog v-model="showNewProjectDialog" persistent>
      <q-card style="min-width: 450px">
        <q-card-section>
          <div class="text-h6">Create New Project</div>
        </q-card-section>

        <q-form @submit="createNewProject" ref="newProjectForm">
          <q-card-section class="q-pt-none">
            <div class="q-gutter-md">
              <q-input
                v-model="newProject.nodeName"
                label="Project Name"
                filled
                :rules="[val => !!val || 'Project name is required']"
                autofocus
              />

              <q-input
                v-model="newProject.nodeDescription"
                label="Project Description"
                filled
                type="textarea"
                rows="3"
              />

              <q-input
                v-model="newProject.projectType"
                label="Project Type"
                filled
                :rules="[
                  val => !!val || 'Project type is required',
                  val => ['Residential', 'Commercial'].includes(val) || 'Project type must be either Residential or Commercial'
                ]"
                hint="Enter 'Residential' or 'Commercial'"
              />

              <q-input
                v-model="newProject.projectLocation"
                label="Project Location"
                filled
              />

              <q-input
                v-model="newProject.startDate"
                label="Start Date"
                filled
                mask="##-##-####"
                :rules="[
                  val => !val || /^\d{2}-\d{2}-\d{4}$/.test(val) || 'Date must be in DD-MM-YYYY format'
                ]"
              >
                <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date
                        v-model="newProject.startDate"
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

              <q-input
                v-model="newProject.endDate"
                label="End Date"
                filled
                mask="##-##-####"
                :rules="[
                  val => !val || /^\d{2}-\d{2}-\d{4}$/.test(val) || 'Date must be in DD-MM-YYYY format'
                ]"
              >
                <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date
                        v-model="newProject.endDate"
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

              <q-input
                v-model.number="newProject.budgetAmount"
                label="Budget Amount"
                filled
                type="number"
                prefix="₹"
                :rules="[val => val >= 0 || 'Budget must be positive']"
              />
            </div>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="Cancel" color="primary" v-close-popup @click="resetNewProjectForm" />
            <q-btn flat label="Create" color="primary" type="submit" :loading="isCreatingProject" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- Node Properties Drawer -->
    <ProjectNodeProperties
      v-if="selectedNodeForProperties"
      v-model="showPropertiesDrawer"
      :node-id="selectedNodeForProperties.nodeId"
      :node-name="selectedNodeForProperties.nodeName"
      :node-type="selectedNodeForProperties.nodeType"
      :node-type-id="selectedNodeForProperties.nodeTypeId"
      :node-icon="selectedNodeForProperties.icon"
      :icon-color="selectedNodeForProperties.iconColor"
      :completion-percentage="selectedNodeForProperties.completionPercentage"
      :initial-tab="selectedNodeForProperties.initialTab"
      :project-users="allProjectUsers"
      @node-updated="handleNodeUpdated"
    />
  </q-page>
</template>

<script>
import { ref, computed, onMounted, watch, nextTick, onBeforeUnmount } from 'vue'
import { useProjectStore } from 'stores/project'
import projectService from 'src/services/api/project.service'
import { showSuccess, showError } from 'src/utils/notification'
import ProjectNodeCard from 'src/components/EnhancedProjectNodeCard.vue'
import ProjectNodeProperties from 'src/components/ProjectNodeProperties.vue'
import userService from 'src/services/api/user.service'
import stakeholderService from 'src/services/api/stakeholder.service'
import { useRoute } from 'vue-router'
import { onActivated } from 'vue'
import { useDragAndDrop } from 'src/composables/useDragAndDrop'
import SearchChips from 'src/components/SearchChips.vue'

export default {
  name: 'ProjectColumnView',

  components: {
    ProjectNodeCard,
    ProjectNodeProperties,
    SearchChips
  },

  setup() {
    const projectStore = useProjectStore()
    const route = useRoute()

    const initialProjectId = computed(() => route.query.project || null)
    const initialNodeId = computed(() => route.query.node || null)
    const initialTab = computed(() => route.query.tab || 'basic')


    // Initialize drag and drop functionality
    const {
      isDragging,
      draggedNode,
      isValidDropTarget,
      handleDragStart,
      handleDragEnd,
      handleDragOver,
      handleDragEnter,
      handleDragLeave,
      handleDrop,
      getDragClasses,
      canDrag,
      resetDragState,
      isDescendantOfWithTreeData
    } = useDragAndDrop()

    // Refs
    const newProjectForm = ref(null)
    const selectedRootNode = ref(null)
    const rootNodes = ref([])
    const nodeTypes = ref([])
    const categories = ref([])
    const columns = ref([])
    const selectedNodes = ref({}) // Track selected node per column
    const searchNodes = ref(null)
    const showNewProjectDialog = ref(false)
    const isCreatingProject = ref(false)
    const nodeTypeMenuVisible = ref(false)
    const nodeTypeMenuTarget = ref(null)
    const contextNode = ref(null)

    // Search-related refs
    const isSearching = ref(false)
    const searchResults = ref([])
    const showSearchResults = ref(false)
    const searchDebounceTimer = ref(null)
    const columnSearchStates = ref({})

    // Property sheet state
    const showPropertiesDrawer = ref(false)
    const selectedNodeForProperties = ref(null)

    // All users

    const allProjectUsers = ref([])

    const newProject = ref({
      nodeName: '',
      nodeDescription: '',
      projectType: '',
      nodeTypeId: null,
      treeCategoryId: null,
      projectLocation: '',
      startDate: '',
      endDate: '',
      budgetAmount: 0,
      currency: 'INR',
      status: 'Not Started',
      priority: 'Medium'
    })

    // Storage key for selection persistence
    const STORAGE_KEY = 'projectColumnViewSelection'

    // Computed
    const rootNodeOptions = computed(() => {
      return rootNodes.value.filter(node => node.activeFlag)
    })

    const selectedProjectName = computed(() => {
      const project = rootNodes.value.find(node => node.recCode === selectedRootNode.value)
      return project ? project.nodeName : 'Project'
    })

    const selectedNodesPath = computed(() => {
      // Return array of selected node IDs in order
      const path = []
      Object.keys(selectedNodes.value)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .forEach(key => {
          if (selectedNodes.value[key]) {
            path.push(selectedNodes.value[key])
          }
        })
      return path
    })

    const handleSearch = async (keywords) => {
      console.log('Search triggered via event:', keywords)

      if (!keywords || keywords.length === 0) {
        clearSearch()
        return
      }

      if (!selectedRootNode.value) {
        clearSearch()
        return
      }

      isSearching.value = true
      try {
        const response = await projectService.searchNodesWithPathsArray(keywords, {
          projectId: selectedRootNode.value,
          size: 500
        })

        if (response.success && response.data && response.data.content) {
          searchResults.value = response.data.content.map(node => {
            const formattedNode = formatNode(node)

            try {
              if (node.treePath && typeof node.treePath === 'string') {
                formattedNode.breadcrumbPath = JSON.parse(node.treePath)
              } else if (Array.isArray(node.treePath)) {
                formattedNode.breadcrumbPath = node.treePath
              } else {
                formattedNode.breadcrumbPath = []
              }
            // eslint-disable-next-line no-unused-vars
            } catch (error) {
              formattedNode.breadcrumbPath = []
            }

            return formattedNode
          })

          showSearchResults.value = true
        } else {
          searchResults.value = []
          showSearchResults.value = true
        }
      } catch (error) {
        showError('Search failed')
        console.error('Search error:', error)
        searchResults.value = []
        showSearchResults.value = true
      } finally {
        isSearching.value = false
      }
    }

    // Handle chips updates
    const handleChipsUpdated = (keywords) => {
      console.log('Keywords updated:', keywords)
      handleSearch(keywords)
    }

    // Methods for search functionality
    const toggleColumnSearch = (columnIndex) => {
      if (!columnSearchStates.value[columnIndex]) {
        columnSearchStates.value[columnIndex] = { visible: false, term: '' }
      }

      columnSearchStates.value[columnIndex].visible = !columnSearchStates.value[columnIndex].visible

      // Clear search when hiding
      if (!columnSearchStates.value[columnIndex].visible) {
        columnSearchStates.value[columnIndex].term = ''
      }
    }

    const clearColumnSearch = (columnIndex) => {
      if (columnSearchStates.value[columnIndex]) {
        columnSearchStates.value[columnIndex].term = ''
      }
    }

    const getFilteredNodes = (column, columnIndex) => {
      const searchState = columnSearchStates.value[columnIndex]

      if (!searchState || !searchState.term || !searchState.term.trim()) {
        return column.nodes || []
      }

      const searchTerm = searchState.term.toLowerCase().trim()

      return (column.nodes || []).filter(node =>
        node.nodeName.toLowerCase().includes(searchTerm)
      )
    }

    // Reset search states on navigation
    const resetColumnSearches = () => {
      columnSearchStates.value = {}
    }

    /**
     * Initialize view from query parameters (notification navigation)
     */
    const initializeFromQueryParams = async () => {
      if (initialProjectId.value && initialNodeId.value) {
        try {
          console.log('Initializing from query params:', {
            projectId: initialProjectId.value,
            nodeId: initialNodeId.value,
            tab: initialTab.value
          })

          // Clear search if active
          if (showSearchResults.value) {
            clearSearch()
          }

          // Set the project
          selectedRootNode.value = initialProjectId.value
          await initializeColumns()

          // Navigate to the specific node
          const pathResponse = await projectService.getNodeById(initialNodeId.value)
          if (pathResponse.success) {
            console.log(pathResponse.data)
            // Build the complete path including the target node
            const completePath = [
              // Start with project root (will be handled in buildPathToNode)
              ...JSON.parse(pathResponse.data.treePath),
              // Add the target node itself
              {
                recCode: initialNodeId.value,
                nodeName: pathResponse.data.noedName,
                nodeTypeId: pathResponse.data.nodeTypeId
              }
            ]
            await buildPathToNodeFromBreadcrumb(completePath)

            // Wait for DOM update
            await nextTick()

            // Open properties drawer for the target node
            const targetNode = findNodeInColumns(initialNodeId.value)
            if (targetNode) {
              selectedNodeForProperties.value = {
                nodeId: initialNodeId.value,
                nodeName: targetNode.nodeName,
                nodeType: targetNode.nodeType,
                nodeTypeId: targetNode.nodeTypeId,
                icon: targetNode.icon,
                iconColor: targetNode.iconColor,
                completionPercentage: targetNode.completionPercentage,
                initialTab: initialTab.value
              }

              // Open the drawer
              showPropertiesDrawer.value = true

              showSuccess(`Opened ${targetNode.nodeName} - ${initialTab.value} tab`)
            } else {
              showError('Node not found in current view')
            }
          } else {
            showError('Could not determine node location')
          }
        } catch (error) {
          showError('Failed to navigate to specified node')
          console.error('Query param navigation error:', error)
        }
      }
    }

    /**
     * Find node in any column by ID
     */
    const findNodeInColumns = (nodeId) => {
      for (const column of columns.value) {
        const node = column.nodes.find(n => n.recCode === nodeId)
        if (node) return node
      }
      return null
    }

    /**
     * Check if we're being initialized from query parameters
     */
    const shouldInitializeFromQueryParams = () => {
      const hasProject = !!(initialProjectId.value || route.query.project)
      const hasNode = !!(initialNodeId.value || route.query.node)

      return hasProject && hasNode
    }

    // Get node name by ID from columns
    const getNodeName = (nodeId, columnIndex) => {
      // First try to find in current columns
      if (columnIndex < columns.value.length) {
        const node = columns.value[columnIndex].nodes.find(n => n.recCode === nodeId)
        if (node) {
          return node.nodeName
        }
      }

      // Fallback: try to find in any column (in case of data inconsistency)
      for (const column of columns.value) {
        const node = column.nodes.find(n => n.recCode === nodeId)
        if (node) {
          return node.nodeName
        }
      }

      // Last fallback
      return `Node ${columnIndex + 1}`
    }

    // Search Functions
    // =================

    // Perform server-side search
    const performSearch = async (query) => {
      if (!query || !query.trim() || !selectedRootNode.value) {
        clearSearch()
        return
      }

      isSearching.value = true
      try {
        const response = await projectService.searchNodesWithPaths(query.trim(), {
          projectId: selectedRootNode.value,
          size: 500 // Increase size for comprehensive search
        })

        if (response.success && response.data && response.data.content) {
          // Format search results
          searchResults.value = response.data.content.map(node => {
            const formattedNode = formatNode(node)

            // Parse breadcrumb path if it exists
            try {
              if (node.treePath && typeof node.treePath === 'string') {
                formattedNode.breadcrumbPath = JSON.parse(node.treePath)
              } else if (Array.isArray(node.treePath)) {
                formattedNode.breadcrumbPath = node.treePath
              } else {
                formattedNode.breadcrumbPath = []
              }
              // eslint-disable-next-line no-unused-vars
            } catch (error) {
              formattedNode.breadcrumbPath = []
            }

            return formattedNode
          })

          showSearchResults.value = true
        } else {
          // No results found
          searchResults.value = []
          showSearchResults.value = true
        }
      } catch (error) {
        showError('Search failed')
        console.error('Search error:', error)
        searchResults.value = []
        showSearchResults.value = true
      } finally {
        isSearching.value = false
      }
    }

    // Clear search and restore original view
    const clearSearch = () => {
      searchNodes.value = ''
      searchResults.value = []
      isSearching.value = false

      if (showSearchResults.value) {
        showSearchResults.value = false
        // No need to restore original columns since we're using lazy loading
      }
    }

    // Debounced search for live search
    const debouncedSearch = (query) => {
      if (searchDebounceTimer.value) {
        clearTimeout(searchDebounceTimer.value)
      }

      searchDebounceTimer.value = setTimeout(() => {
        performSearch(query)
      }, 300) // 300ms debounce delay
    }

    // Handle search input keydown for manual search
    const handleSearchKeydown = (event) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        // Clear debounce timer and search immediately
        if (searchDebounceTimer.value) {
          clearTimeout(searchDebounceTimer.value)
        }
        performSearch(searchNodes.value)
      } else if (event.key === 'Escape') {
        clearSearch()
      }
    }

    // Handle search result click - navigate to node location
    const handleSearchResultClick = async (node) => {
      try {
        await navigateToSearchResult(node)
      } catch (error) {
        showError('Failed to navigate to search result')
        console.error('Navigation error:', error)
      }
    }

    // Navigate to search result location in tree
    const navigateToSearchResult = async (node) => {
      try {
        // Clear search first
        clearSearch()

        // Use the existing breadcrumb path from search results
        if (node.breadcrumbPath && node.breadcrumbPath.length >= 0) {
          // Build the complete path including the target node
          const completePath = [
            // Start with project root (will be handled in buildPathToNode)
            ...node.breadcrumbPath,
            // Add the target node itself
            {
              recCode: node.recCode,
              nodeName: node.nodeName,
              nodeTypeId: node.nodeTypeId
            }
          ]

          // Reset selections and columns
          selectedNodes.value = {}
          columns.value = []

          // Build the column path step by step using the breadcrumb path
          await buildPathToNodeFromBreadcrumb(completePath)

          showSuccess(`Navigated to ${node.nodeName}`)
        } else {
          // Fallback: if no breadcrumb path, try to place it in root level
          console.warn('No breadcrumb path found for node, placing in root level')

          // Reset to root and try to find the node in first level
          selectedNodes.value = {}
          columns.value = []
          await initializeColumns()

          // Try to find the node in the first column
          if (columns.value[0]) {
            const foundNode = columns.value[0].nodes.find(n => n.recCode === node.recCode)
            if (foundNode) {
              // Select the node if found in root level
              selectedNodes.value[0] = node.recCode
              await loadChildrenForNode(node.recCode, node.nodeName, 1)
              showSuccess(`Navigated to ${node.nodeName}`)
            } else {
              showError('Could not locate node in project structure')
            }
          } else {
            showError('Could not determine node location')
          }
        }
      } catch (error) {
        showError('Failed to navigate to node location')
        console.error('Navigate to node error:', error)
      }
    }

    // Build column path using breadcrumb path from search results
    const buildPathToNodeFromBreadcrumb = async (completePath) => {
      try {
        // Start with root project
        await initializeColumns()

        // The completePath structure: [breadcrumb parents..., target node]
        // We need to navigate through all breadcrumb parents, then select the target
        const breadcrumbParents = completePath.slice(0, -1) // All except target
        const targetNode = completePath[completePath.length - 1] // The actual target

        // Navigate through each parent in the breadcrumb path
        for (let i = 0; i < breadcrumbParents.length; i++) {
          const pathNode = breadcrumbParents[i]
          const nodeId = pathNode.recCode

          // Find the node in current column
          const currentColumnIndex = i
          if (currentColumnIndex < columns.value.length) {
            // Wait for column to finish loading if needed
            let attempts = 0
            while (columns.value[currentColumnIndex]?.isLoading && attempts < 50) {
              await new Promise(resolve => setTimeout(resolve, 100))
              attempts++
            }

            const node = columns.value[currentColumnIndex].nodes.find(n => n.recCode === nodeId)
            if (node) {
              // Select this node and load its children
              selectedNodes.value[currentColumnIndex] = nodeId
              await loadChildrenForNode(nodeId, node.nodeName, currentColumnIndex + 1)
            } else {
              console.warn(`Node ${nodeId} (${pathNode.nodeName}) not found in column ${currentColumnIndex}`)
              // Try to load it anyway - maybe the node was added after column load
              await loadChildrenForNode(nodeId, pathNode.nodeName, currentColumnIndex + 1)
            }
          } else {
            console.warn(`Column ${currentColumnIndex} not available`)
            break
          }
        }

        // Now navigate to the target node in the final column
        const targetColumnIndex = breadcrumbParents.length

        if (targetColumnIndex < columns.value.length) {
          // Wait for final column to load
          let attempts = 0
          while (columns.value[targetColumnIndex]?.isLoading && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100))
            attempts++
          }

          // Find and select the target node
          const foundTargetNode = columns.value[targetColumnIndex].nodes.find(n => n.recCode === targetNode.recCode)
          if (foundTargetNode) {
            selectedNodes.value[targetColumnIndex] = targetNode.recCode
            // Load children for the target node to show its potential children
            await loadChildrenForNode(targetNode.recCode, targetNode.nodeName, targetColumnIndex + 1)
          } else {
            console.warn(`Target node ${targetNode.recCode} (${targetNode.nodeName}) not found in final column`)
          }
        }

        // Save the updated selection state
        saveSelectionToStorage()

      } catch (error) {
        console.error('Error building path from breadcrumb:', error)
        throw error
      }
    }

    // Navigation Functions
    // ====================

    const navigateToBreadcrumb = async (targetIndex) => {
      try {
        // Reset column searches on navigation
        resetColumnSearches()

        // Prevent navigation if already at that level
        const currentDepth = Object.keys(selectedNodes.value).length - 1
        if (targetIndex === currentDepth) {
          return // Already at this level
        }

        // Handle project root navigation (targetIndex = -1)
        if (targetIndex === -1) {
          // Clear all selections and show only first column
          selectedNodes.value = {}
          await initializeColumns() // This will load first column
          saveSelectionToStorage()
          showSuccess(`Navigated to ${selectedProjectName.value}`)
          return
        }

        // Validate target index
        if (targetIndex < 0 || targetIndex >= selectedNodesPath.value.length) {
          showError('Invalid navigation target')
          return
        }

        // Get the target node ID from the path
        const targetNodeId = selectedNodesPath.value[targetIndex]
        if (!targetNodeId) {
          showError('Target node not found in path')
          return
        }

        // Find the target node in the appropriate column
        const targetColumnIndex = targetIndex
        let targetNode = null

        if (targetColumnIndex < columns.value.length) {
          targetNode = columns.value[targetColumnIndex].nodes.find(n => n.recCode === targetNodeId)
        }

        if (!targetNode) {
          showError('Cannot navigate to selected item - refreshing view')
          await refreshCurrentView()
          return
        }

        // Store the target node name for success message
        const targetNodeName = targetNode.nodeName

        // Clear selections beyond target index
        Object.keys(selectedNodes.value).forEach(key => {
          const keyIndex = parseInt(key)
          if (keyIndex > targetIndex) {
            delete selectedNodes.value[key]
          }
        })

        // Ensure the target node is selected
        selectedNodes.value[targetIndex] = targetNodeId

        // Truncate columns to show up to target level
        columns.value = columns.value.slice(0, targetIndex + 1)

        // Load fresh children for the target node
        await loadChildrenForNode(targetNodeId, targetNodeName, targetIndex + 1)

        // Save the updated selection state
        saveSelectionToStorage()

        showSuccess(`Navigated to ${targetNodeName}`)

      } catch (error) {
        showError('Navigation failed')
        console.error('Breadcrumb navigation error:', error)
      }
    }

    // Handle keyboard navigation for accessibility
    const handleBreadcrumbKeydown = (event, targetIndex) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        navigateToBreadcrumb(targetIndex)
      }
    }

    // Utility Functions
    // =================

    // Generate UUID
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
    }

    // Save selection to storage
    const saveSelectionToStorage = () => {
      const selection = {
        projectId: selectedRootNode.value,
        selectedNodes: selectedNodes.value,
        // Save temporary nodes that haven't been saved yet
        tempNodes: {}
      }

      // Collect all temporary nodes
      columns.value.forEach((column, colIndex) => {
        const tempNodesInColumn = column.nodes.filter(n => n.isNew)
        if (tempNodesInColumn.length > 0) {
          selection.tempNodes[colIndex] = tempNodesInColumn
        }
      })

      localStorage.setItem(STORAGE_KEY, JSON.stringify(selection))
    }

    // Load selection from storage
    const loadSelectionFromStorage = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
          const selection = JSON.parse(saved)
          return selection
        }
      } catch (error) {
        console.error('Failed to load saved selection:', error)
      }
      return null
    }

    // Format node for display
    const formatNode = (node) => {
      const nodeType = nodeTypes.value.find(t => t.recCode === node.nodeTypeId)

      // Use the new API response format
      const formatted = {
        ...node,
        icon: node.iconName || nodeType?.iconName || 'folder',
        iconColor: nodeType?.colorCode || 'primary',
        hasChildren: node.hasChildren || false,
        states: node.nodeStates || [],
        nodeType: node.nodeTypeName || nodeType?.typeName || 'Unknown'
      }

      // Preserve the isNew flag if it was set
      if (node.isNew) {
        formatted.isNew = true
      }

      return formatted
    }

    // Data Fetching Functions
    // =======================

    // Fetch users and Stakeholders for tagging in notes, tasks etc.
    const fetchUsersAndStakeholders = async () => {
      try {
        const [usersResponse, stakeholdersResponse] = await Promise.allSettled([
          userService.getAllUsers(),
          stakeholderService.getAllStakeholders()
        ])

        const combinedUsers = []

        // Process users
        if (usersResponse.status === 'fulfilled' && usersResponse.value.success) {
          const users = usersResponse.value.data.content || []
          users.forEach(user => {
            combinedUsers.push({
              recCode: user.recCode,
              name: user.fullName,
              userRole: 'User'
            })
          })
        }

        // Process stakeholders
        if (stakeholdersResponse.status === 'fulfilled' && stakeholdersResponse.value.success) {
          const stakeholders = stakeholdersResponse.value.data.content || []
          stakeholders.forEach(stakeholder => {
            combinedUsers.push({
              recCode: stakeholder.recCode,
              name: stakeholder.contactPersonName,
              userRole: 'Stakeholder'
            })
          })
        }

        return combinedUsers
      } catch (error) {
        console.error('Failed to load users and stakeholders:', error)
        return []
      }
    }
    // Fetch root nodes
    const fetchRootNodes = async () => {
      try {
        const response = await projectService.getAllProjects()
        if (response.success) {
          rootNodes.value = response.data.content || []
        }
      } catch (error) {
        showError('Failed to fetch projects')
        console.error(error)
      }
    }

    // Fetch node types
    const fetchNodeTypes = async () => {
      try {
        const types = await projectStore.fetchNodeTypes()
        nodeTypes.value = types
      } catch (error) {
        showError('Failed to fetch node types')
        console.error(error)
      }
    }

    // Fetch tree categories
    const fetchTreeCategories = async () => {
      try {
        const cats = await projectStore.fetchCategories()
        categories.value = cats
      } catch (error) {
        showError('Failed to fetch tree categories')
        console.error(error)
      }
    }

    // Initialize columns with lazy loading - only load first level
    const initializeColumns = async () => {
      if (!selectedRootNode.value) {
        columns.value = []
        return
      }

      try {
        // Load only the immediate children of the project root
        await loadChildrenForNode(selectedRootNode.value, selectedProjectName.value, 0)

        // Try to restore previous selection if available
        const savedSelection = loadSelectionFromStorage()
        if (savedSelection && savedSelection.projectId === selectedRootNode.value) {
          await restoreSelectionPath(savedSelection)
        }

      } catch (error) {
        showError('Failed to load project data')
        console.error(error)
      }
    }

    // Load children for a specific node (lazy loading)
    const loadChildrenForNode = async (nodeId, parentName, columnIndex) => {
      try {
        // Set loading state for the column
        if (columns.value[columnIndex]) {
          columns.value[columnIndex].isLoading = true
        } else {
          // Create new column with loading state
          columns.value.push({
            id: `col-${columnIndex}`,
            title: parentName,
            parentId: nodeId,
            nodes: [],
            isLoading: true
          })
        }

        // Fetch children from API
        const response = await projectService.getNodeChildren(nodeId)
        let childNodes = []

        if (response.success && response.data && response.data.length > 0) {
          childNodes = response.data.map(formatNode)
        }

        // Update or create the column
        if (columns.value[columnIndex]) {
          columns.value[columnIndex].nodes = childNodes
          columns.value[columnIndex].isLoading = false
        } else {
          columns.value.push({
            id: `col-${columnIndex}`,
            title: parentName,
            parentId: nodeId,
            nodes: childNodes,
            isLoading: false
          })
        }

      } catch (error) {
        showError('Failed to load children')
        console.error('Load children error:', error)

        // Remove loading state on error
        if (columns.value[columnIndex]) {
          columns.value[columnIndex].isLoading = false
        }
      }
    }

    // Restore selection path using lazy loading
    const restoreSelectionPath = async (savedSelection) => {
      try {
        const savedNodes = savedSelection.selectedNodes

        // Restore selections step by step
        for (let i = 0; i < Object.keys(savedNodes).length; i++) {
          const nodeId = savedNodes[i]
          if (!nodeId) continue

          // Wait for current column to be loaded
          let attempts = 0
          while ((!columns.value[i] || columns.value[i].isLoading) && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100))
            attempts++
          }

          if (columns.value[i] && !columns.value[i].isLoading) {
            // Find the node in current column
            const node = columns.value[i].nodes.find(n => n.recCode === nodeId)
            if (node) {
              // Select this node and load its children
              selectedNodes.value[i] = nodeId

              // Load next column if this isn't the last selection
              if (savedNodes[i + 1]) {
                await loadChildrenForNode(nodeId, node.nodeName, i + 1)
              }
            } else {
              // Node not found, stop restoration
              break
            }
          } else {
            // Column failed to load, stop restoration
            break
          }
        }

        // Restore temporary nodes if any
        if (savedSelection.tempNodes) {
          Object.entries(savedSelection.tempNodes).forEach(([colIndex, tempNodes]) => {
            const columnIndex = parseInt(colIndex)
            if (columns.value[columnIndex]) {
              tempNodes.forEach(tempNode => {
                // Check if node already exists (was saved)
                const exists = columns.value[columnIndex].nodes.find(n =>
                  n.recCode === tempNode.recCode ||
                  n.recCode === tempNode.tempId ||
                  (tempNode.tempId && n.tempId === tempNode.tempId)
                )

                if (!exists) {
                  // Re-add the temporary node with all its properties
                  const restoredNode = {
                    ...tempNode,
                    isNew: true,
                    isEditing: false // Don't auto-edit on restore
                  }
                  columns.value[columnIndex].nodes.push(restoredNode)
                }
              })
            }
          })
        }

      } catch (error) {
        console.error('Error restoring selection path:', error)
      }
    }

    // Node Interaction Functions
    // ==========================

    // Handle node click with lazy loading
    const handleNodeClick = async (node, columnIndex) => {
      // If in search mode, handle search result click
      if (showSearchResults.value) {
        await handleSearchResultClick(node)
        return
      }

      // Normal node click logic
      // Update selection
      selectedNodes.value[columnIndex] = node.recCode

      // Remove columns after this one
      columns.value = columns.value.slice(0, columnIndex + 1)

      // Clear selections for removed columns
      Object.keys(selectedNodes.value).forEach(key => {
        if (parseInt(key) > columnIndex) {
          delete selectedNodes.value[key]
        }
      })

      // Load children for the selected node (lazy loading)
      await loadChildrenForNode(node.recCode, node.nodeName, columnIndex + 1)

      // Save selection
      saveSelectionToStorage()
    }

    // Add node to column
    const addNodeToColumn = (columnIndex) => {
      // Don't allow adding nodes in search mode
      if (showSearchResults.value) {
        showError('Cannot add nodes while searching. Please clear search first.')
        return
      }

      let parentNodeId = null

      if (columnIndex === 0) {
        // Adding to first column - parent is the project root
        parentNodeId = selectedRootNode.value
      } else {
        // Adding to other columns - parent is selected node from previous column
        const selectedInPrevColumn = selectedNodes.value[columnIndex - 1]
        if (!selectedInPrevColumn) {
          showError('Please select a parent node first')
          return
        }
        parentNodeId = selectedInPrevColumn
      }

      // Create temporary node
      const tempId = 'temp-' + Date.now()
      const newNode = {
        recCode: tempId,
        tempId: tempId,
        nodeName: 'New Node',
        parentNodeId: parentNodeId,
        nodeTypeId: null,
        treeCategoryId: null,
        icon: 'folder',
        iconColor: 'grey',
        isNew: true,
        isEditing: true,
        hasChildren: false,
        states: []
      }

      // Add to column
      if (columns.value[columnIndex]) {
        columns.value[columnIndex].nodes.push(newNode)
      }

      // Save state including temp nodes
      saveSelectionToStorage()

      // Focus on the new node after DOM update
      nextTick(() => {
        // The ProjectNodeCard will handle the auto-focus
      })
    }

    const refreshCurrentView = async () => {
      if (selectedRootNode.value) {
        // If in search mode, clear search and refresh
        if (showSearchResults.value) {
          clearSearch()
        }

        // Clear any saved temp nodes to avoid duplicates
        localStorage.removeItem(STORAGE_KEY)

        // Force refresh the columns with lazy loading
        selectedNodes.value = {}
        columns.value = []
        await initializeColumns()

        showSuccess('View refreshed')
      }
    }

    // Handle node edit
    // eslint-disable-next-line no-unused-vars
    const handleNodeEdit = async ({ nodeId, oldName, newName }) => {
      // For temporary nodes, just update the local name without API call
      if (nodeId.startsWith('temp-')) {
        columns.value.forEach(column => {
          const node = column.nodes.find(n => n.recCode === nodeId)
          if (node) {
            node.nodeName = newName
          }
        })
        return
      }

      // For existing nodes, update via API
      try {
        const response = await projectService.updateNode(nodeId, { nodeName: newName })
        if (response.success) {
          // Update node name in all columns
          columns.value.forEach(column => {
            const node = column.nodes.find(n => n.recCode === nodeId)
            if (node) {
              node.nodeName = newName
            }
            // Update column title if this node is selected
            const columnIndex = columns.value.indexOf(column)
            if (selectedNodes.value[columnIndex - 1] === nodeId && columnIndex > 0) {
              column.title = newName
            }
          })
          showSuccess('Node updated successfully')
        }
      } catch (error) {
        showError('Failed to update node')
        console.error(error)
      }
    }

    const handleSaveNewNode = async ({ nodeId, nodeName, nodeTypeId, parentNodeId }) => {
      try {
        const nodeData = {
          nodeName: nodeName.trim(),
          parentNodeId: parentNodeId,
          nodeTypeId: nodeTypeId,
          recCode: generateUUID()
        }

        const response = await projectService.createNode(nodeData)
        if (response.success) {
          // Find and update the temporary node
          columns.value.forEach(column => {
            const nodeIndex = column.nodes.findIndex(n => n.recCode === nodeId)
            if (nodeIndex !== -1) {
              const tempNode = column.nodes[nodeIndex]
              const serverNode = response.data

              // Update with server response
              column.nodes[nodeIndex] = {
                ...tempNode,
                recCode: serverNode.recCode,
                nodeName: serverNode.nodeName,
                nodeTypeId: serverNode.nodeTypeId,
                isNew: false, // Remove new flag
                hasChildren: false
              }

              // Update icon from node type
              const nodeType = nodeTypes.value.find(t => t.recCode === serverNode.nodeTypeId)
              if (nodeType) {
                column.nodes[nodeIndex].icon = nodeType.iconName || 'folder'
                column.nodes[nodeIndex].iconColor = nodeType.colorCode || 'primary'
              }
            }
          })

          // Clear/invalidate cache after successful creation
          if (projectStore && typeof projectStore.clearCache === 'function') {
            projectStore.clearCache()
          }

          showSuccess('Node created successfully')
          saveSelectionToStorage()
        }
      } catch (error) {
        showError('Failed to create node')
        console.error('Create node error:', error)
      }
    }

    // Handle node delete
    // eslint-disable-next-line no-unused-vars
    const handleNodeDelete = async ({ nodeId, nodeName }) => {
      try {
        await projectService.deleteNode(nodeId)

        // Remove from columns and handle cascading effects
        let nodeFound = false
        let foundColumnIndex = -1

        columns.value.forEach((column, index) => {
          const nodeIndex = column.nodes.findIndex(n => n.recCode === nodeId)
          if (nodeIndex !== -1) {
            column.nodes.splice(nodeIndex, 1)
            nodeFound = true
            foundColumnIndex = index
          }
        })

        if (nodeFound) {
          // If deleted node was selected, remove subsequent columns
          if (selectedNodes.value[foundColumnIndex] === nodeId) {
            columns.value = columns.value.slice(0, foundColumnIndex + 1)
            delete selectedNodes.value[foundColumnIndex]

            // Clear selections for removed columns
            Object.keys(selectedNodes.value).forEach(key => {
              if (parseInt(key) > foundColumnIndex) {
                delete selectedNodes.value[key]
              }
            })
          }

          showSuccess('Node deleted successfully')
          saveSelectionToStorage()
        }
      } catch (error) {
        showError('Failed to delete node')
        console.error(error)
      }
    }

    // Handle show properties
    const handleShowProperties = ({ nodeId }) => {
      // Find the node in columns
      let nodeData = null
      for (const column of columns.value) {
        const node = column.nodes.find(n => n.recCode === nodeId)
        if (node) {
          nodeData = node
          break
        }
      }

      if (nodeData) {
        selectedNodeForProperties.value = {
          nodeId: nodeId,
          nodeName: nodeData.nodeName,
          nodeType: nodeData.nodeType,
          nodeTypeId: nodeData.nodeTypeId,
          icon: nodeData.icon,
          iconColor: nodeData.iconColor,
          completionPercentage: nodeData.completionPercentage,
          initialTab: initialTab.value || 'basic'
        }
        showPropertiesDrawer.value = true
      }
    }

    const handleNodeUpdated = ({ nodeId, updates }) => {
      // Update the node in columns
      columns.value.forEach(column => {
        const node = column.nodes.find(n => n.recCode === nodeId)
        if (node) {
          // Update node properties
          if (updates.status) node.status = updates.status
          if (updates.priority) node.priority = updates.priority
          if (updates.nodeDescription !== undefined) node.nodeDescription = updates.nodeDescription

          // Update completion percentage if status changed
          if (updates.status === 'Completed') {
            node.completionPercentage = 100
          } else if (updates.status === 'Cancelled') {
            node.completionPercentage = 0
          }
        }
      })

      // Update column headers if needed
      const pathIndex = selectedNodesPath.value.indexOf(nodeId)
      if (pathIndex >= 0 && pathIndex + 1 < columns.value.length) {
        const column = columns.value[pathIndex + 1]
        if (column && updates.nodeName) {
          column.title = updates.nodeName
        }
      }
    }

    // Project Management Functions
    // ============================

    // Create new project
    const createNewProject = async () => {
      const valid = await newProjectForm.value.validate()
      if (!valid) return

      isCreatingProject.value = true

      try {
        const formatDateForBackend = (dateStr) => {
          if (!dateStr) return null
          const [day, month, year] = dateStr.split('-')
          return `${year}-${month}-${day}`
        }

        const defaultNodeTypeId = nodeTypes.value.find(t => t.typeName === 'Unit')?.recCode || nodeTypes.value[0]?.recCode
        const defaultTreeCategoryId = categories.value.find(t => t.CategoryName === 'Project')?.recCode || categories.value[0]?.recCode

        const projectData = {
          ...newProject.value,
          recCode: generateUUID(),
          parentNodeId: null,
          nodeTypeId: defaultNodeTypeId,
          treeCategoryId: defaultTreeCategoryId,
          isRootNode: true,
          treeLevel: 0,
          nodeOrder: rootNodes.value.length + 1,
          startDate: formatDateForBackend(newProject.value.startDate),
          endDate: formatDateForBackend(newProject.value.endDate)
        }

        const response = await projectService.createProject(projectData)

        if (response.success) {
          showSuccess('Project created successfully')
          rootNodes.value.push(response.data)
          selectedRootNode.value = response.data.recCode
          resetNewProjectForm()
          showNewProjectDialog.value = false
          await initializeColumns()
        }
      } catch (error) {
        showError('Failed to create project')
        console.error(error)
      } finally {
        isCreatingProject.value = false
      }
    }

    // Reset new project form
    const resetNewProjectForm = () => {
      newProject.value = {
        nodeName: '',
        nodeDescription: '',
        projectType: '',
        nodeTypeId: null,
        treeCategoryId: null,
        projectLocation: '',
        startDate: '',
        endDate: '',
        budgetAmount: 0,
        currency: 'INR',
        status: 'Not Started',
        priority: 'Medium'
      }
      newProjectForm.value?.resetValidation()
    }

    // Node Type Management
    // ====================

    // Handle select node type
    const handleSelectNodeType = (node, eventData) => {
      showNodeTypeMenu(eventData.event, node)
    }

    // Show node type menu
    const showNodeTypeMenu = (event, node) => {
      contextNode.value = node
      nodeTypeMenuTarget.value = event.currentTarget || event.target
      nodeTypeMenuVisible.value = true
    }

    // Set node type
    const setNodeType = async (node, nodeType) => {
      // Update the node's type properties
      node.nodeTypeId = nodeType.recCode
      node.icon = nodeType.iconName || 'folder'
      node.iconColor = nodeType.colorCode || 'primary'

      // If this is a new node with a valid name, create it immediately
      if ((node.isNew || node.tempId) && node.nodeName && node.nodeName.trim() !== '' && node.nodeName !== 'New Node') {
        await handleSaveNewNode({
          nodeId: node.recCode,
          nodeName: node.nodeName.trim(),
          nodeTypeId: node.nodeTypeId,
          parentNodeId: node.parentNodeId
        })
      } else if (!node.isNew && !node.tempId) {
        // For existing nodes, update the node type via PUT
        try {
          const response = await projectService.updateNode(node.recCode, { nodeTypeId: nodeType.recCode })
          if (response.success) {
            showSuccess('Node type updated successfully')
          }
        } catch (error) {
          showError('Failed to update node type')
          console.error('Update node type error:', error)
        }
      }
    }

    // Drag and Drop Handlers
    // ======================

    // Node drag handlers
    const handleNodeDragStart = (event, dragEvent, node) => {
      console.log('Node drag start:', node.nodeName)
      // FIXED: Pass dragEvent (the actual drag event) instead of event (click event)
      return handleDragStart(dragEvent, node)
    }

    const handleNodeDragEnd = (event) => {
      console.log('Node drag end')
      handleDragEnd(event)
    }

    const handleNodeDragOver = (event, node) => {
      event.stopPropagation() // FIXED: Critical - stop bubbling to column
      handleDragOver(event, node, 'node')
    }

    const handleNodeDragEnter = (event, node) => {
      event.stopPropagation() // FIXED: Critical - stop bubbling to column
      handleDragEnter(event, node, 'node')
    }

    const handleNodeDragLeave = (event) => {
      // Don't stop propagation here - we want this to bubble up properly
      const currentTarget = event.currentTarget
      const relatedTarget = event.relatedTarget

      if (!currentTarget) return

      try {
        if (!currentTarget.contains(relatedTarget)) {
          handleDragLeave(event)
        }
      } catch (error) {
        console.warn('Error in node drag leave:', error)
        handleDragLeave(event)
      }
    }

    // FIXED: Node drop handler with priority over column
    // eslint-disable-next-line no-unused-vars
    const handleNodeDrop = async (event, node, columnIndex) => {
      event.stopPropagation() // FIXED: Critical - prevent column handler from firing
      event.stopImmediatePropagation() // FIXED: Stop ALL other handlers

      console.log('Node drop handler - dropping onto node:', node.nodeName)

      const success = await handleDrop(event, node, 'node', columns.value)
      if (success) {
        console.log('Node drop successful, refreshing view')
        await refreshCurrentView()
      }
      return success
    }

    // FIXED: Column drag handlers with lower priority
    // eslint-disable-next-line no-unused-vars
    const handleColumnDragOver = (event, column, columnIndex) => {
      // Only handle if not already handled by node
      if (event.defaultPrevented) return

      if (showSearchResults.value) {
        event.dataTransfer.dropEffect = 'none'
        return
      }

      console.log('Column drag over:', column.title)
      handleDragOver(event, column, 'column')
    }

    const handleColumnDragEnter = (event, column) => {
      // Only handle if not already handled by node
      if (event.defaultPrevented) return

      if (showSearchResults.value) return

      console.log('Column drag enter:', column.title)
      handleDragEnter(event, column, 'column')
    }

    const handleColumnDragLeave = (event) => {
      // Only handle if not already handled by node
      if (event.defaultPrevented) return

      const currentTarget = event.currentTarget
      const relatedTarget = event.relatedTarget

      if (!currentTarget) return

      try {
        if (!currentTarget.contains(relatedTarget)) {
          handleDragLeave(event)
        }
      } catch (error) {
        console.warn('Error in column drag leave:', error)
        handleDragLeave(event)
      }
    }

    // FIXED: Column drop handler as fallback only
    // eslint-disable-next-line no-unused-vars
    const handleColumnDrop = async (event, column, columnIndex) => {
      // Only handle if event wasn't already handled by a node
      if (event.defaultPrevented) {
        console.log('Column drop ignored - already handled by node')
        return false
      }

      if (showSearchResults.value) {
        event.preventDefault()
        return false
      }

      console.log('Column drop handler - dropping into column:', column.title)

      const success = await handleDrop(event, column, 'column', columns.value)
      if (success) {
        console.log('Column drop successful, refreshing view')
        await refreshCurrentView()
      }
      return success
    }

    // FIXED: Updated drag classes utility functions
    const getNodeDragClasses = (node) => {
      const classes = getDragClasses(node, node, 'node')

      // Add additional classes based on drag state
      if (isDragging.value && draggedNode.value) {
        if (draggedNode.value.recCode === node.recCode) {
          classes.push('node-being-dragged')
        } else if (!node.isNew) {
          // FIXED: Updated validation for same-level drops
          const isValidTarget = isValidDropTarget.value(node, 'node')
          const wouldCreateCircular = isDescendantOfWithTreeData(
            node.recCode,
            draggedNode.value.recCode,
            columns.value
          )

          if (isValidTarget && !wouldCreateCircular) {
            classes.push('valid-drop-target')
          } else {
            classes.push('invalid-drop-target')
          }
        }
      }

      return classes
    }

    const getColumnDragClasses = (column) => {
      const classes = []

      if (isDragging.value) {
        if (canDropInColumn(column)) {
          classes.push('valid-drop-column')
        } else {
          classes.push('invalid-drop-column')
        }
      }

      return classes
    }

    // FIXED: Updated column drop validation
    const canDropInColumn = (column) => {
      if (!draggedNode.value || showSearchResults.value) return false

      // Cannot drop if dragged node is temporary
      if (draggedNode.value.isNew) return false

      // FIXED: Allow drop if different parent (enables same-level moves to different parents)
      return column.parentId !== draggedNode.value.parentNodeId
    }

    // On root node change
    const onRootNodeChange = () => {
      // Clear search if active
      if (showSearchResults.value) {
        clearSearch()
      }

      // Reset column searches
      resetColumnSearches()

      selectedNodes.value = {}
      columns.value = []
      if (selectedRootNode.value) {
        initializeColumns()
        allProjectUsers.value = fetchUsersAndStakeholders()
      }
    }

    // Watchers
    // ========

    // Add this watcher to handle query parameter changes
    watch(() => route.query, async (newQuery, oldQuery) => {
      // Only trigger if we have the required params and they actually changed
      if (newQuery.project && newQuery.node &&
          (newQuery.project !== oldQuery?.project ||
          newQuery.node !== oldQuery?.node ||
          newQuery.tab !== oldQuery?.tab)) {

        console.log('Route query params changed, navigating to node:', newQuery)

        // Clear any existing state
        if (showSearchResults.value) {
          clearSearch()
        }

        // Set the project if it changed
        if (newQuery.project !== selectedRootNode.value) {
          selectedRootNode.value = newQuery.project
          await initializeColumns()
        }

        // Navigate to the specific node
        try {
          const pathResponse = await projectService.getNodeById(newQuery.node)
          if (pathResponse.success) {
            console.log(pathResponse.data)

            // Build the complete path including the target node
            const completePath = [
              // Parse the treePath from the node data
              ...JSON.parse(pathResponse.data.treePath),
              // Add the target node itself
              {
                recCode: newQuery.node,
                nodeName: pathResponse.data.nodeName, // Fixed typo: was noedName
                nodeTypeId: pathResponse.data.nodeTypeId
              }
            ]

            await buildPathToNodeFromBreadcrumb(completePath)

            await nextTick()

            // Open properties drawer
            const targetNode = findNodeInColumns(newQuery.node)
            if (targetNode) {
              selectedNodeForProperties.value = {
                nodeId: newQuery.node,
                nodeName: targetNode.nodeName,
                nodeType: targetNode.nodeType,
                nodeTypeId: targetNode.nodeTypeId,
                icon: targetNode.icon,
                iconColor: targetNode.iconColor,
                completionPercentage: targetNode.completionPercentage,
                initialTab: newQuery.tab || 'basic'
              }

              showPropertiesDrawer.value = true
              showSuccess(`Opened ${targetNode.nodeName} - ${newQuery.tab || 'basic'} tab`)
            }
          }
        } catch (error) {
          console.error('Error navigating to node from query change:', error)
          showError('Failed to navigate to notification target')
        }
      }
    }, { immediate: false }) // Don't run immediately to avoid conflicts with onMounted

    // Watch for search input changes (live search)
    watch(searchNodes, (newValue) => {
      if (newValue && newValue.trim()) {
        debouncedSearch(newValue)
      } else if (!newValue) {
        clearSearch()
      }
    })

    // Watch for route changes
    watch(() => route.path, async (newPath) => {
      if (newPath.includes('/projects/column-view') && selectedRootNode.value) {
        // Refresh data when navigating back to this view
        await nextTick()
        await refreshCurrentView()
      }
    })

    // Lifecycle Hooks
    // ===============

    // Mounted
    onMounted(async () => {
      await fetchNodeTypes()
      await fetchTreeCategories()
      await fetchRootNodes()

      // Check if we have query parameters using the computed properties
      const hasQueryParams = initialProjectId.value && initialNodeId.value

      if (hasQueryParams) {
        console.log('Initializing from query parameters')
        // Set the project first
        selectedRootNode.value = initialProjectId.value
        await initializeColumns()

        // The watcher should handle the navigation, but let's trigger it manually for initial load
        try {
          const pathResponse = await projectService.getNodeById(initialNodeId.value)
          if (pathResponse.success) {
            console.log(pathResponse.data)

            // Build the complete path including the target node
            const completePath = [
              ...JSON.parse(pathResponse.data.treePath),
              {
                recCode: initialNodeId.value,
                nodeName: pathResponse.data.nodeName, // Fixed typo
                nodeTypeId: pathResponse.data.nodeTypeId
              }
            ]

            await buildPathToNodeFromBreadcrumb(completePath)

            await nextTick()

            // Open properties drawer
            const targetNode = findNodeInColumns(initialNodeId.value)
            if (targetNode) {
              selectedNodeForProperties.value = {
                nodeId: initialNodeId.value,
                nodeName: targetNode.nodeName,
                nodeType: targetNode.nodeType,
                nodeTypeId: targetNode.nodeTypeId,
                icon: targetNode.icon,
                iconColor: targetNode.iconColor,
                completionPercentage: targetNode.completionPercentage,
                initialTab: initialTab.value
              }

              showPropertiesDrawer.value = true
              showSuccess(`Opened ${targetNode.nodeName} - ${initialTab.value} tab`)
            }
          }
        } catch (error) {
          console.error('Error in initial query param navigation:', error)
          showError('Failed to navigate to specified node')
        }
      } else {
        console.log('Initializing normally from menu/direct access')
        // Original initialization logic
        const savedSelection = loadSelectionFromStorage()
        if (savedSelection && rootNodeOptions.value.find(p => p.recCode === savedSelection.projectId)) {
          selectedRootNode.value = savedSelection.projectId
        } else if (rootNodeOptions.value.length > 0) {
          selectedRootNode.value = rootNodeOptions.value[0].recCode
        }

        if (selectedRootNode.value) {
          await initializeColumns()
        }
      }
      // get all users for the project
      if (selectedRootNode.value) {
        allProjectUsers.value = await fetchUsersAndStakeholders()
        console.log(allProjectUsers)
      }
    })

    onActivated(async () => {
      // This runs when component is activated (navigated back to)
      if (selectedRootNode.value) {
        await refreshCurrentView()
      }
    })

    // Cleanup on unmount
    onBeforeUnmount(() => {
      if (searchDebounceTimer.value) {
        clearTimeout(searchDebounceTimer.value)
      }
      // Reset drag state on unmount
      resetDragState()
    })

    return {
      // Refs
      newProjectForm,
      selectedRootNode,
      rootNodeOptions,
      selectedProjectName,
      columns,
      selectedNodes,
      searchNodes,
      showNewProjectDialog,
      isCreatingProject,
      newProject,
      nodeTypeMenuVisible,
      nodeTypeMenuTarget,
      contextNode,
      nodeTypes,
      allProjectUsers,

      // Search refs
      isSearching,
      searchResults,
      showSearchResults,

      // Computed
      selectedNodesPath,

      // Methods
      getNodeName,
      navigateToBreadcrumb,
      handleBreadcrumbKeydown,
      onRootNodeChange,
      addNodeToColumn,
      handleNodeClick,
      handleSearchResultClick,
      handleNodeEdit,
      handleSaveNewNode,
      handleNodeDelete,
      handleShowProperties,
      handleSelectNodeType,

      initializeFromQueryParams,
      findNodeInColumns,
      shouldInitializeFromQueryParams,

      showNodeTypeMenu,
      setNodeType,
      createNewProject,
      resetNewProjectForm,

      // Search methods
      performSearch,
      clearSearch,
      debouncedSearch,
      handleSearchKeydown,
      navigateToSearchResult,
      buildPathToNodeFromBreadcrumb,
      refreshCurrentView,

      // node properties
      showPropertiesDrawer,
      selectedNodeForProperties,
      handleNodeUpdated,

      // Drag and drop
      isDragging,
      draggedNode,
      handleNodeDragStart,
      handleNodeDragEnd,
      handleNodeDragOver,
      handleNodeDragEnter,
      handleNodeDragLeave,
      handleNodeDrop,
      handleColumnDragOver,
      handleColumnDragEnter,
      handleColumnDragLeave,
      handleColumnDrop,
      getNodeDragClasses,
      getColumnDragClasses,
      canDrag,
      canDropInColumn,
      //
      handleSearch,
      handleChipsUpdated,
      // Column search functionality
      columnSearchStates,
      toggleColumnSearch,
      clearColumnSearch,
      getFilteredNodes,
      resetColumnSearches
    }
  }
}
</script>

<style lang="scss" scoped>
.column-view-container {
  height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
}

.view-header {
  flex-shrink: 0;
  margin-bottom: 20px;
}

.columns-wrapper {
  flex: 1;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
}

/* Enhanced breadcrumb styling */
.breadcrumb-bar {
  background: white;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.breadcrumb-navigation {
  flex: 1;
}

.breadcrumb-actions {
  display: flex;
  align-items: center;
}

/* Breadcrumb item styling */
.breadcrumb-item {
  transition: all 0.2s ease;
  border-radius: 4px;
  padding: 6px 10px;
  margin: -6px -10px; /* Negative margin to expand click area */
  position: relative;
}

.breadcrumb-item:hover {
  background-color: rgba(25, 118, 210, 0.08);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(25, 118, 210, 0.1);
}

.breadcrumb-item:active {
  transform: translateY(0);
  background-color: rgba(25, 118, 210, 0.12);
}

.breadcrumb-item:focus {
  outline: 2px solid rgba(25, 118, 210, 0.3);
  outline-offset: 2px;
}

/* Deep styling for Quasar breadcrumb elements */
.breadcrumb-bar ::v-deep(.q-breadcrumbs__el) {
  color: #1976d2;
  font-weight: 500;
  transition: all 0.2s ease;
}

.breadcrumb-bar ::v-deep(.q-breadcrumbs__el:hover) {
  color: #1565c0;
}

.breadcrumb-bar ::v-deep(.q-breadcrumbs__el:last-child) {
  color: #424242;
  font-weight: 600;
}

/* Separator styling */
.breadcrumb-bar ::v-deep(.q-breadcrumbs__separator) {
  color: #9e9e9e;
  margin: 0 8px;
}

/* Icon styling in breadcrumbs */
.breadcrumb-bar ::v-deep(.q-icon) {
  margin-right: 6px;
}

.columns-scroll-container {
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 10px;
}

.columns-flex-container {
  display: flex;
  gap: 16px;
  height: 100%;
  min-width: min-content;
}

.node-column {
  flex-shrink: 0;
  width: 300px;
  background: #f5f5f5;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.column-header {
  display: flex;
  flex-direction: column;
  padding: 12px 16px;
  background: white;
  border-radius: 8px 8px 0 0;
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0;
}

.column-title-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.column-title {
  font-weight: 600;
  font-size: 16px;
  color: #424242;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.column-search-controls {
  display: flex;
  align-items: center;
  margin-right: 8px;
}

.search-toggle-btn {
  position: relative;

  .q-badge {
    font-size: 10px;
    min-width: 16px;
    height: 16px;
  }
}

.column-search-input {
  margin-top: 8px;
  margin-bottom: 4px;

  .search-input-field {
    .q-field__control {
      height: 32px;
      min-height: 32px;
    }

    .q-field__marginal {
      height: 32px;
    }
  }
}

/* Search input styling */
.search-input-field {
  .q-field__control {
    border-radius: 4px;
    background-color: #f8f9fa;

    &:hover {
      background-color: #e9ecef;
    }

    &.q-field__control--focused {
      background-color: white;
      box-shadow: 0 0 0 1px #1976d2;
    }
  }

  .q-field__native {
    font-size: 13px;
  }
}

/* Badge positioning */
.search-toggle-btn .q-badge--floating {
  top: -2px;
  right: -2px;
}

/* Mobile responsive adjustments */
@media (max-width: 768px) {
  .column-title-container {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .column-search-controls {
    align-self: flex-end;
    margin-right: 0;
  }

  .column-search-input {
    width: 100%;
  }
}

.column-header-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.column-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.empty-column, .loading-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: calc(100vh - 200px);
}

/* Search Results Styling */
.search-results-container {
  width: 100%;
  display: flex;
  justify-content: center;
}

.search-results-column {
  width: 100%;
  max-width: 600px;
}

.search-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  text-align: center;
}

.search-results-list {
  /* Ensure proper spacing for search results */
}

.search-result-item {
  position: relative;
}

.search-result-path {
  margin-top: 8px;
  margin-left: 16px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  max-width: 100%;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 4px;
  padding: 4px 8px;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.search-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Scrollbar styling */
.columns-scroll-container::-webkit-scrollbar {
  height: 8px;
}

.columns-scroll-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.columns-scroll-container::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.columns-scroll-container::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.column-content::-webkit-scrollbar {
  width: 6px;
}

.column-content::-webkit-scrollbar-track {
  background: transparent;
}

.column-content::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.column-content::-webkit-scrollbar-thumb:hover {
  background: #999;
}

/* Loading state for breadcrumbs */
.breadcrumb-loading {
  opacity: 0.6;
  pointer-events: none;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .breadcrumb-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding: 10px 12px;
  }

  .breadcrumb-actions {
    align-self: flex-end;
  }

  .breadcrumb-item {
    padding: 4px 8px;
    font-size: 0.9em;
  }

  .columns-flex-container {
    flex-direction: column;
    overflow-x: hidden;
    overflow-y: auto;
  }

  .node-column {
    width: 100%;
    flex-shrink: 1;
    min-height: 300px;
    height: auto;
  }

  .column-content {
    max-height: 400px;
  }

  .columns-scroll-container {
    overflow-x: hidden;
    overflow-y: auto;
  }

  .search-results-column {
    max-width: 100%;
  }
}

/* Tablet responsive */
@media (min-width: 769px) and (max-width: 1024px) {
  .node-column {
    width: 280px;
  }

  .search-results-column {
    max-width: 500px;
  }
}

/* Large screen optimizations */
@media (min-width: 1440px) {
  .node-column {
    width: 320px;
  }

  .search-results-column {
    max-width: 700px;
  }
}

/* Loading animation */
@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

.loading-column {
  animation: pulse 2s infinite;
}

/* Smooth transitions for search state changes */
.search-results-container {
  animation: fadeIn 0.3s ease-in-out;
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

/* Enhanced tooltips positioning */
.breadcrumb-item .q-tooltip {
  font-size: 12px;
  max-width: 200px;
}

/* Better visual hierarchy for search results */
.search-results-list {
  .search-result-item {
    border-left: 3px solid transparent;
    transition: border-color 0.2s ease;

    &:hover {
      border-left-color: #1976d2;
    }
  }
}

/* Improved spacing for mobile search results */
@media (max-width: 768px) {
  .search-result-path {
    margin-left: 8px;
    margin-right: 8px;
    font-size: 0.8em;
  }

  .search-loading, .loading-column {
    height: 150px;

    p {
      font-size: 0.9em;
    }
  }
}

/* RTL support (if needed) */
[dir="rtl"] {
  .breadcrumb-bar ::v-deep(.q-icon) {
    margin-right: 0;
    margin-left: 6px;
  }

  .search-result-path {
    direction: rtl;
  }
}

/* Column loading state styling */
.column-header {
  .q-btn {
    &[loading] {
      opacity: 0.7;
    }
  }
}

/* Enhanced column transitions */
.node-column {
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
}

/* Loading spinner customization */
.loading-column, .search-loading {
  .q-spinner-dots {
    opacity: 0.8;
  }

  p {
    margin-top: 12px;
    font-size: 14px;
  }
}

/* Drag and Drop Styles */
/* =================== */

/* Drag preview styling */
.drag-preview {
  .drag-preview-content {
    display: flex;
    align-items: center;
    gap: 8px;

    i {
      font-size: 16px;
    }

    span {
      color: #333;
    }
  }
}

/* Node being dragged */
.node-being-dragged {
  opacity: 0.5;
  transform: scale(0.95);
  transition: all 0.2s ease;
}

/* Valid drop targets */
.valid-drop-target {
  border: 2px dashed #4caf50 !important;
  background-color: rgba(76, 175, 80, 0.05);
  transform: scale(1.02);
  transition: all 0.2s ease;
}

/* Invalid drop targets */
.invalid-drop-target {
  border: 2px dashed #f44336 !important;
  background-color: rgba(244, 67, 54, 0.05);
  opacity: 0.6;
  cursor: not-allowed;
}

/* Drag over states */
.drag-over-valid {
  border: 3px solid #4caf50 !important;
  background-color: rgba(76, 175, 80, 0.1);
  box-shadow: 0 0 15px rgba(76, 175, 80, 0.3);
}

.drag-over-invalid {
  border: 3px solid #f44336 !important;
  background-color: rgba(244, 67, 54, 0.1);
  box-shadow: 0 0 15px rgba(244, 67, 54, 0.3);
}

/* Enhanced drag over states with smooth transitions */
.valid-drop-column {
  .column-content {
    border: 2px dashed #2196f3;
    background-color: rgba(33, 150, 243, 0.05);
    transition: all 0.3s ease;
    box-shadow: inset 0 0 20px rgba(33, 150, 243, 0.1);
  }
}

.invalid-drop-column {
  .column-content {
    opacity: 0.6;
    pointer-events: none;
    transition: opacity 0.2s ease;
  }
}

/* Empty column drop zone with enhanced feedback */
.empty-column.drop-zone {
  min-height: 150px;
  border: 2px dashed transparent;
  border-radius: 8px;
  transition: all 0.3s ease;

  &.drag-over-valid {
    border-color: #4caf50;
    background-color: rgba(76, 175, 80, 0.1);
    transform: scale(1.02);
    box-shadow: 0 0 20px rgba(76, 175, 80, 0.2);

    .q-icon {
      color: #4caf50 !important;
      transform: scale(1.1);
      transition: all 0.2s ease;
    }

    p {
      color: #4caf50 !important;
      font-weight: 500;
    }
  }
}

/* Enhanced drag-over states for better visibility */
.drag-over-valid {
  border: 3px solid #4caf50 !important;
  background-color: rgba(76, 175, 80, 0.1);
  box-shadow: 0 0 15px rgba(76, 175, 80, 0.3);
  transform: scale(1.01);
  transition: all 0.2s ease;
}

.drag-over-invalid {
  border: 3px solid #f44336 !important;
  background-color: rgba(244, 67, 54, 0.1);
  box-shadow: 0 0 15px rgba(244, 67, 54, 0.3);
  transition: all 0.2s ease;
}

/* Global drag cursor */
.dragging * {
  cursor: grabbing !important;
}

/* Disable text selection during drag */
.dragging {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

/* Node card drag styling */
.node-column ::v-deep(.project-node-card) {
  &[draggable="true"] {
    cursor: grab;

    &:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      transform: translateY(-2px);
      transition: all 0.2s ease;
    }

    &:active {
      cursor: grabbing;
    }
  }

  &.node-being-dragged {
    opacity: 0.5;
    transform: scale(0.95) !important;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  }

  &.valid-drop-target {
    border: 2px dashed #4caf50;
    background-color: rgba(76, 175, 80, 0.05);

    &:hover {
      border-color: #388e3c;
      background-color: rgba(76, 175, 80, 0.1);
    }
  }

  &.invalid-drop-target {
    border: 2px dashed #f44336;
    background-color: rgba(244, 67, 54, 0.05);
    cursor: not-allowed;
    opacity: 0.6;
  }
}

/* Animate drop zone highlighting */
@keyframes dropZonePulse {
  0% { background-color: rgba(76, 175, 80, 0.05); }
  50% { background-color: rgba(76, 175, 80, 0.15); }
  100% { background-color: rgba(76, 175, 80, 0.05); }
}

.drag-over-valid.empty-column {
  animation: dropZonePulse 1.5s infinite;
}

/* Drag feedback text */
.drag-feedback-text {
  font-size: 12px;
  color: #666;
  text-align: center;
  margin-top: 8px;
  font-style: italic;
}

/* Prevent drag on temporary nodes */
.node-column ::v-deep(.project-node-card.is-new) {
  cursor: default !important;

  &[draggable="false"] {
    opacity: 0.7;
  }
}
</style>
