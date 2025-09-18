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
            <q-input
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
            </q-input>
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
                        @node-click="handleSearchResultClick(node, 0)"
                        @show-properties="handleShowProperties"
                      />

                      <!-- Search result path display -->
                      <div v-if="node.nodePath && node.nodePath.length > 0" class="search-result-path">
                        <q-icon name="place" size="xs" class="q-mr-xs text-grey-6" />
                        <span class="text-caption text-grey-6">
                          {{ node.nodePath.map(p => p.nodeName).join(' → ') }}
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
                  <div class="column-title">
                    {{ column.title }}
                  </div>
                  <q-btn
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

                <!-- Column Content -->
                <div class="column-content">
                  <div v-if="column.nodes.length === 0" class="empty-column">
                    <q-icon name="folder_open" size="48px" color="grey-5" />
                    <p class="text-grey-6 q-mt-md">No nodes</p>
                  </div>

                  <ProjectNodeCard
                    v-for="node in column.nodes"
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
                    style="margin-bottom: 20px;"
                    @node-click="handleNodeClick(node, index)"
                    @node-edit="handleNodeEdit"
                    @node-delete="handleNodeDelete"
                    @show-properties="handleShowProperties"
                    @select-node-type="handleSelectNodeType(node, $event)"
                    @save-new-node="handleSaveNewNode"
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
      @node-updated="handleNodeUpdated"
    />
  </q-page>
</template>

<script>
import { ref, computed, onMounted, watch, nextTick, onBeforeUnmount, defineProps } from 'vue'
import { useProjectStore } from 'stores/project'
import projectService from 'src/services/api/project.service'
import { showSuccess, showError } from 'src/utils/notification'
import ProjectNodeCard from 'src/components/ProjectNodeCard.vue'
import ProjectNodeProperties from 'src/components/ProjectNodeProperties.vue'
import { useRoute } from 'vue-router'
import { onActivated } from 'vue'
// import { useQuasar } from 'quasar'

export default {
  name: 'ProjectColumnView',

  components: {
    ProjectNodeCard,
    ProjectNodeProperties
  },

  setup() {
    const props = defineProps({
      initialProjectId: {
        type: String,
        default: null
      },
      initialNodeId: {
        type: String,
        default: null
      },
      initialTab: {
        type: String,
        default: 'basic'
      }
    })

    const projectStore = useProjectStore()
    const route = useRoute()
    // const $q = useQuasar()

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
    const originalColumns = ref([]) // Store original columns when searching

    // Property sheet state
    const showPropertiesDrawer = ref(false)
    const selectedNodeForProperties = ref(null)

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

    // Perform search
    const performSearch = async (query) => {
      if (!query || !query.trim() || !selectedRootNode.value) {
        clearSearch()
        return
      }

      isSearching.value = true
      try {
        // First get all nodes in the current project tree
        const treeResponse = await projectService.getProjectTree(selectedRootNode.value)

        if (treeResponse.success && treeResponse.data && treeResponse.data.length > 0) {
          // Flatten the tree to get all nodes
          const allNodes = flattenTreeNodes(treeResponse.data[0])

          // Filter nodes by search query (case-insensitive search on nodeName)
          const searchTerm = query.trim().toLowerCase()
          const filteredNodes = allNodes.filter(node =>
            node.nodeName && node.nodeName.toLowerCase().includes(searchTerm)
          )
          // Format search results
          searchResults.value = filteredNodes.map(node => {
            const formattedNode = formatNode(node)
            return {
              ...formattedNode,
              searchScore: calculateSearchScore(node.nodeName, searchTerm),
              matchText: node.nodeName,
              nodePath: node.path || [] // Use the path built during flattening
            }
          })

          // Sort by search score (best matches first)
          searchResults.value.sort((a, b) => b.searchScore - a.searchScore)

          // Store original columns and show search results
          if (!showSearchResults.value) {
            originalColumns.value = [...columns.value]
          }
          showSearchResults.value = true

          // Replace columns with search results
          columns.value = [{
            id: 'search-results',
            title: `Search Results (${searchResults.value.length})`,
            parentId: 'search',
            nodes: searchResults.value
          }]
        } else {
          // No tree data available
          searchResults.value = []
          showSearchResults.value = true
          columns.value = [{
            id: 'search-results',
            title: 'No Data Available',
            parentId: 'search',
            nodes: []
          }]
        }
      } catch (error) {
        showError('Search failed')
        console.error('Search error:', error)
        searchResults.value = []
        showSearchResults.value = true
        columns.value = [{
          id: 'search-results',
          title: 'Search Error',
          parentId: 'search',
          nodes: []
        }]
      } finally {
        isSearching.value = false
      }
    }

    // Flatten tree nodes for searching
    const flattenTreeNodes = (rootNode, path = []) => {
      const nodes = []

      // Add current node with its path
      if (rootNode.recCode) {
        nodes.push({
          ...rootNode,
          path: [...path]
        })
      }

      // Recursively add children
      if (rootNode.children && rootNode.children.length > 0) {
        const currentPath = [...path]
        if (rootNode.nodeName && rootNode.recCode !== selectedRootNode.value) {
          currentPath.push({ nodeName: rootNode.nodeName, recCode: rootNode.recCode })
        }

        rootNode.children.forEach(child => {
          nodes.push(...flattenTreeNodes(child, currentPath))
        })
      }

      return nodes
    }

    // Calculate search score based on match quality
    const calculateSearchScore = (nodeName, searchTerm) => {
      if (!nodeName || !searchTerm) return 0

      const name = nodeName.toLowerCase()
      const term = searchTerm.toLowerCase()

      // Exact match gets highest score
      if (name === term) return 100

      // Starts with search term
      if (name.startsWith(term)) return 80

      // Contains search term
      if (name.includes(term)) return 60

      // Default score
      return 10
    }

    // Clear search and restore original view
    const clearSearch = () => {
      searchNodes.value = ''
      searchResults.value = []
      isSearching.value = false

      if (showSearchResults.value) {
        showSearchResults.value = false
        // Restore original columns
        columns.value = [...originalColumns.value]
        // showSuccess('Search cleared')
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

    // Handle search result click
    // eslint-disable-next-line no-unused-vars
    const handleSearchResultClick = async (node, columnIndex) => {
      try {
        // Option 1: Navigate to node location in tree
        await navigateToSearchResult(node)
      } catch (error) {
        showError('Failed to navigate to search result')
        console.error('Navigation error:', error)
      }
    }

    /**
     * Initialize view from query parameters (notification navigation)
     */
    const initializeFromQueryParams = async () => {
      if (props.initialProjectId && props.initialNodeId) {
        try {
          console.log('Initializing from query params:', {
            projectId: props.initialProjectId,
            nodeId: props.initialNodeId,
            tab: props.initialTab
          })

          // Clear search if active
          if (showSearchResults.value) {
            clearSearch()
          }

          // Set the project
          selectedRootNode.value = props.initialProjectId
          await initializeColumns()

          // Navigate to the specific node
          const pathResponse = await projectService.getNodeTreePath(props.initialNodeId)
          if (pathResponse.success && pathResponse.data.length > 0) {
            await buildPathToNode(pathResponse.data)

            // Wait for DOM update
            await nextTick()

            // Open properties drawer for the target node
            const targetNode = findNodeInColumns(props.initialNodeId)
            if (targetNode) {
              selectedNodeForProperties.value = {
                nodeId: props.initialNodeId,
                nodeName: targetNode.nodeName,
                nodeType: targetNode.nodeType,
                nodeTypeId: targetNode.nodeTypeId,
                icon: targetNode.icon,
                iconColor: targetNode.iconColor,
                completionPercentage: targetNode.completionPercentage,
                initialTab: props.initialTab
              }

              // Open the drawer
              showPropertiesDrawer.value = true

              showSuccess(`Opened ${targetNode.nodeName} - ${props.initialTab} tab`)
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
      return !!(props.initialProjectId && props.initialNodeId)
    }

    // Navigate to search result location in tree
    const navigateToSearchResult = async (node) => {
      try {
        // Clear search first
        clearSearch()

        // Get the node's path from root
        const pathResponse = await projectService.getNodeTreePath(node.recCode)

        if (pathResponse.success && pathResponse.data && pathResponse.data.length > 0) {
          const nodePath = pathResponse.data

          // Reset selections
          selectedNodes.value = {}

          // Build the column path step by step
          await buildPathToNode(nodePath)

          showSuccess(`Navigated to ${node.nodeName}`)
        } else {
          // If we can't get the path, try to navigate directly
          // showError('Could not determine exact location - attempting direct navigation')

          // Try to find the node in current columns
          let found = false
          for (let colIndex = 0; colIndex < columns.value.length; colIndex++) {
            const foundNode = columns.value[colIndex].nodes.find(n => n.recCode === node.recCode)
            if (foundNode) {
              await handleNodeClick(foundNode, colIndex)
              found = true
              break
            }
          }

          if (!found) {
            showError('Node not found in current view')
          }
        }
      } catch (error) {
        showError('Failed to navigate to node location')
        console.error('Navigate to node error:', error)
      }
    }

    // Build column path to specific node
    const buildPathToNode = async (nodePath) => {
      try {
        // Start with root project
        await initializeColumns()

        // Navigate through each level of the path (skip the project root)
        for (let i = 1; i < nodePath.length; i++) {
          const pathNode = nodePath[i]
          const nodeId = pathNode.recCode

          // Find the node in current column
          const currentColumnIndex = i - 1 // Adjust for skipping root
          if (currentColumnIndex < columns.value.length) {
            const node = columns.value[currentColumnIndex].nodes.find(n => n.recCode === nodeId)
            if (node) {
              // Select this node and load its children
              await handleNodeClick(node, currentColumnIndex)
            } else {
              console.warn(`Node ${nodeId} not found in column ${currentColumnIndex}`)
              break
            }
          }
        }
      } catch (error) {
        console.error('Error building path to node:', error)
        throw error
      }
    }

    // Navigation Functions
    // ====================

    const navigateToBreadcrumb = async (targetIndex) => {
      try {
        // Prevent navigation if already at that level
        const currentDepth = Object.keys(selectedNodes.value).length - 1
        if (targetIndex === currentDepth) {
          return // Already at this level
        }

        // Handle project root navigation (targetIndex = -1)
        if (targetIndex === -1) {
          // Clear all selections and show only first column
          selectedNodes.value = {}
          columns.value = columns.value.slice(0, 1)
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

        // Always fetch fresh children data for the target node
        try {
          let childNodes = []

          const response = await projectService.getNodeChildren(targetNodeId)
          if (response.success && response.data.length > 0) {
            childNodes = response.data.map(formatNode)
          }

          // Add the children column
          columns.value.push({
            id: `col-${targetIndex + 1}`,
            title: targetNodeName,
            parentId: targetNodeId,
            nodes: childNodes
          })

          // Save the updated selection state
          saveSelectionToStorage()

          showSuccess(`Navigated to ${targetNodeName}`)
        } catch (error) {
          showError('Failed to load children for selected item')
          console.error('Error loading children:', error)
        }

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

      // Preserve isNew flag if it exists
      const formatted = {
        ...node,
        icon: nodeType?.iconName || 'folder',
        iconColor: nodeType?.colorCode || 'primary',
        hasChildren: node.children?.length > 0 || false,
        states: node.nodeStates || []
      }

      // Preserve the isNew flag if it was set
      if (node.isNew) {
        formatted.isNew = true
      }

      return formatted
    }

    // Data Fetching Functions
    // =======================

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

    // Initialize columns with project data
    const initializeColumns = async (force = false) => {
      if (!selectedRootNode.value) {
        columns.value = []
        return
      }

      try {
        // Always fetch fresh data from server when initializing
        const response = await projectService.getProjectTree(selectedRootNode.value)
        if (response.success && response.data && response.data.length > 0) {
          const rootNode = response.data[0]

          // First column shows children of the root project
          if (rootNode.children && rootNode.children.length > 0) {
            columns.value = [{
              id: 'col-0',
              title: selectedProjectName.value,
              parentId: selectedRootNode.value,
              nodes: rootNode.children.map(formatNode)
            }]

            // Only restore selection if it's not a forced refresh
            if (!force) {
              const savedSelection = loadSelectionFromStorage()
              if (savedSelection && savedSelection.projectId === selectedRootNode.value) {
                await restoreSelectionPath(savedSelection.selectedNodes, rootNode)

                // Restore temporary nodes
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
              }
            }
          } else {
            columns.value = [{
              id: 'col-0',
              title: selectedProjectName.value,
              parentId: selectedRootNode.value,
              nodes: []
            }]
          }
        }
      } catch (error) {
        showError('Failed to load project data')
        console.error(error)
      }
    }

    // Restore selection path
    const restoreSelectionPath = async (savedNodes, treeData) => {
      let currentNode = treeData

      for (let i = 0; i < Object.keys(savedNodes).length; i++) {
        const nodeId = savedNodes[i]
        if (!nodeId) continue

        // Find the node in current level
        const node = findNodeById(currentNode.children || [], nodeId)
        if (node) {
          selectedNodes.value[i] = nodeId

          // Load next column if node has children
          if (node.children && node.children.length > 0) {
            const parentName = columns.value[i].nodes.find(n => n.recCode === nodeId)?.nodeName || 'Unknown'
            columns.value.push({
              id: `col-${i + 1}`,
              title: parentName,
              parentId: nodeId,
              nodes: node.children.map(formatNode)
            })
            currentNode = node
          } else {
            break
          }
        } else {
          break
        }
      }
    }

    // Find node by ID in array
    const findNodeById = (nodes, nodeId) => {
      for (const node of nodes) {
        if (node.recCode === nodeId) {
          return node
        }
        if (node.children) {
          const found = findNodeById(node.children, nodeId)
          if (found) return found
        }
      }
      return null
    }

    // Node Interaction Functions
    // ==========================

    // Handle node click
    const handleNodeClick = async (node, columnIndex) => {
      // If in search mode, handle search result click
      if (showSearchResults.value) {
        await handleSearchResultClick(node, columnIndex)
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

      // Always create a new column for the selected node's children
      try {
        let childNodes = []

        // Always fetch from server to get latest data
        const response = await projectService.getNodeChildren(node.recCode)
        if (response.success && response.data.length > 0) {
          childNodes = response.data.map(formatNode)
        }

        // Always push a new column, even if empty
        columns.value.push({
          id: `col-${columnIndex + 1}`,
          title: node.nodeName,
          parentId: node.recCode,
          nodes: childNodes
        })
      } catch (error) {
        showError('Failed to load children')
        console.error(error)
      }

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
      columns.value[columnIndex].nodes.push(newNode)

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

        // Force refresh the columns
        await initializeColumns(true)

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

          // Force refresh the tree cache for this project
          if (projectStore && typeof projectStore.fetchProjectTree === 'function') {
            await projectStore.fetchProjectTree(selectedRootNode.value, true) // force=true
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
          initialTab: props.initialTab || 'basic' // Pass the initial tab
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

    // Event Handlers
    // ==============

    // On root node change
    const onRootNodeChange = () => {
      // Clear search if active
      if (showSearchResults.value) {
        clearSearch()
      }

      selectedNodes.value = {}
      if (selectedRootNode.value) {
        initializeColumns()
      } else {
        columns.value = []
      }
    }

    // Watchers
    // ========

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

    // Watch for columns changes to handle empty columns
    watch(columns, (newColumns) => {
      // Don't apply empty column logic when showing search results
      if (showSearchResults.value) {
        return
      }

      // Don't remove empty columns - they're needed for adding children
      // Only remove if there are multiple empty columns at the end
      let lastNonEmptyIndex = -1
      for (let i = newColumns.length - 1; i >= 0; i--) {
        if (newColumns[i].nodes.length > 0) {
          lastNonEmptyIndex = i
          break
        }
      }

      // Keep at most one empty column at the end
      if (lastNonEmptyIndex >= 0 && lastNonEmptyIndex < newColumns.length - 2) {
        columns.value = newColumns.slice(0, lastNonEmptyIndex + 2)
      }
    }, { deep: true })

    // Lifecycle Hooks
    // ===============

    // Mounted
    onMounted(async () => {
      await fetchNodeTypes()
      await fetchTreeCategories()
      await fetchRootNodes()

      // Check if we should initialize from query parameters first
      if (shouldInitializeFromQueryParams()) {
        await initializeFromQueryParams()
      } else {
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
      buildPathToNode,
      flattenTreeNodes,
      calculateSearchScore,
      refreshCurrentView,

      // node properties
      showPropertiesDrawer,
      selectedNodeForProperties,
      handleNodeUpdated,
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
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  border-radius: 8px 8px 0 0;
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0;
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

.column-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.empty-column {
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

/* Dark mode support (if implemented)
@media (prefers-color-scheme: dark) {
  .breadcrumb-bar {
    background: #1e1e1e;
    color: #ffffff;
  }

  .node-column {
    background: #2d2d2d;
  }

  .column-header {
    background: #1e1e1e;
    border-bottom-color: #404040;
  }

  .column-title {
    color: #ffffff;
  }

  .search-result-path {
    background: rgba(255, 255, 255, 0.05);
  }
} */

/* Print styles */
@media print {
  .columns-wrapper {
    overflow: visible;
    height: auto;
  }

  .columns-scroll-container {
    overflow: visible;
  }

  .columns-flex-container {
    flex-direction: column;
  }

  .node-column {
    width: 100%;
    height: auto;
    page-break-inside: avoid;
    margin-bottom: 20px;
  }

  .breadcrumb-actions {
    display: none;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .breadcrumb-item:focus {
    outline: 3px solid #000000;
    outline-offset: 2px;
  }

  .column-header {
    border-bottom: 2px solid #000000;
  }

  .search-result-path {
    border: 1px solid #666666;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .breadcrumb-item,
  .breadcrumb-bar ::v-deep(.q-breadcrumbs__el) {
    transition: none;
  }

  .breadcrumb-item:hover {
    transform: none;
    box-shadow: none;
  }

  .breadcrumb-item:active {
    transform: none;
  }
}

/* Focus-visible support for better accessibility */
.breadcrumb-item:focus-visible {
  outline: 2px solid rgba(25, 118, 210, 0.6);
  outline-offset: 2px;
  background-color: rgba(25, 118, 210, 0.08);
}

/* Search input enhancements */
.search-input {
  transition: all 0.3s ease;
}

.search-input:focus-within {
  transform: scale(1.02);
}

/* Search result hover effects */
.search-result-item:hover {
  .search-result-path {
    background: rgba(25, 118, 210, 0.05);
  }
}

/* Loading animations */
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

.search-loading {
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

  .search-loading {
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
</style>
