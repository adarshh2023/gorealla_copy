<template>
  <q-page padding>
    <div class="row q-col-gutter-md">
      <!-- Enhanced Header -->
      <div class="col-12">
        <!-- First Row: Project Selection and Controls -->
        <div class="row items-center q-col-gutter-md q-mb-md">
          <!-- Project Selection -->
          <div class="col-12 col-md-4">
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

          <!-- New Project Button -->
          <div class="col-12 col-md-1">
            <q-btn
              color="primary"
              icon="add"
              dense
              @click="showNewProjectDialog = true"
            >
              <q-tooltip>Create New Project</q-tooltip>
            </q-btn>
          </div>

          <!-- Status Filter -->
          <div class="col-12 col-md-3">
            <q-select
              v-model="selectedStatus"
              :options="statusFilterOptions"
              label="Status Filter"
              filled
              dense
              clearable
              emit-value
              map-options
              @update:model-value="applyFilters"
            >
              <template v-slot:prepend>
                <q-icon name="filter_list" />
              </template>
            </q-select>
          </div>

          <!-- Expansion Level Control -->
          <div class="col-12 col-md-4">
            <q-select
              v-model="expansionLevel"
              :options="expansionOptions"
              label="Expand Level"
              filled
              dense
              emit-value
              map-options
              @update:model-value="onExpansionLevelChange"
            >
              <template v-slot:prepend>
                <q-icon name="account_tree" />
              </template>
            </q-select>
          </div>
        </div>

        <!-- Second Row: Search -->
        <div class="row">
          <div class="col-12">
            <SearchChips
              placeholder="Search nodes..."
              @search="handleSearch"
              @chips-updated="handleChipsUpdated"
              :max-chips="5"
            />
          </div>
        </div>
      </div>

      <!-- Search/Filter Status Bar -->
      <div class="col-12" v-if="showSearchResults || selectedStatus">
        <q-banner inline-actions class="text-white bg-primary">
          <div class="row items-center">
            <div class="col">
              <span v-if="showSearchResults">
                Search Results: {{ filteredTreeData.length }} nodes found
                <q-chip
                  v-for="keyword in currentSearchKeywords"
                  :key="keyword"
                  :label="keyword"
                  size="sm"
                  color="white"
                  text-color="primary"
                  class="q-ml-xs"
                />
              </span>
              <span v-if="selectedStatus" class="q-ml-md">
                Status Filter: {{ getStatusLabel(selectedStatus) }}
              </span>
            </div>
            <div class="col-auto">
              <q-btn
                flat
                round
                dense
                icon="close"
                @click="clearAllFilters"
              >
                <q-tooltip>Clear all filters</q-tooltip>
              </q-btn>
            </div>
          </div>
        </q-banner>
      </div>

      <!-- Tree Container -->
      <div class="col-12" v-if="selectedRootNode">
        <q-card>
          <q-card-section>
            <!-- Tree header -->
            <div v-if="displayTreeData.length > 0" class="row items-center q-mb-md q-px-sm">
              <div class="col">
                <div class="text-subtitle1 text-weight-medium">
                  {{ selectedProjectName }}
                  <q-chip
                    v-if="showSearchResults || selectedStatus"
                    :label="`${filteredTreeData.length} nodes`"
                    size="sm"
                    color="primary"
                    class="q-ml-sm"
                  />
                </div>
              </div>
              <div class="col-auto">
                <q-btn
                  label="Add Top Level Node"
                  size="sm"
                  color="primary"
                  icon="add"
                  dense
                  @click="addChildNode({})"
                />
              </div>
            </div>

            <!-- Add button for empty tree -->
            <div v-if="displayTreeData.length === 0" class="text-center q-pa-lg">
              <q-icon
                :name="isSearching ? 'search' : 'folder_open'"
                size="64px"
                color="grey-5"
              />
              <p class="text-h6 text-grey-7 q-mt-md q-mb-lg">
                {{ isSearching ? 'Searching...' : (showSearchResults || selectedStatus) ? 'No matching nodes found' : 'No nodes available' }}
              </p>
              <q-btn
                v-if="!showSearchResults && !selectedStatus && !isSearching"
                label="Add First Node"
                color="primary"
                icon="add"
                @click="addChildNode({})"
              />
            </div>

            <!-- Tree view with enhanced features -->
            <div v-show="displayTreeData.length > 0" class="q-pa-sm">
              <q-tree
                ref="treeRef"
                :nodes="displayTreeData"
                node-key="recCode"
                label-key="label"
                :expanded="expandedNodes"
                @update:expanded="onNodesExpanded"
                @lazy-load="onLazyLoad"
              >
                <template v-slot:default-header="prop">
                  <div
                    class="row items-center full-width no-wrap tree-node-container"
                    @contextmenu.prevent.stop="showContextMenu($event, prop.node)"
                    @mouseenter="hoveredNode = prop.node.recCode"
                    @mouseleave="hoveredNode = null"
                  >
                    <q-icon
                      :name="prop.node.icon || 'folder'"
                      :color="prop.node.iconColor || 'primary'"
                      size="sm"
                      class="q-mr-sm"
                    />

                    <div v-if="prop.node.editing" class="row items-center q-gutter-xs">
                      <q-input
                        v-model="prop.node.nodeName"
                        dense
                        borderless
                        autofocus
                        @keyup.enter.stop="saveNode(prop.node)"
                        @keyup.esc.stop="cancelEdit(prop.node)"
                        @blur="saveNode(prop.node)"
                        @keydown.space.stop
                        class="node-name-input"
                        style="width: 200px"
                      />
                      <q-btn
                        icon="check"
                        size="sm"
                        flat
                        round
                        dense
                        color="positive"
                        @click="saveNode(prop.node)"
                      />
                      <q-btn
                        icon="close"
                        size="sm"
                        flat
                        round
                        dense
                        color="negative"
                        @click="cancelEdit(prop.node)"
                      />
                    </div>

                    <div v-else class="row items-center full-width no-wrap">
                      <div class="node-content-wrapper">
                        <!-- Node name and path -->
                        <div class="node-name-container">
                          <span
                            @dblclick="startEdit(prop.node)"
                            class="cursor-pointer node-label"
                            v-html="highlightSearchTerms(prop.node.label || prop.node.nodeName)"
                          ></span>

                          <!-- Tree path for search results -->
                          <div
                            v-if="prop.node.isSearchResult && prop.node.treePath && prop.node.treePath.length > 0"
                            class="node-tree-path"
                          >
                            <q-icon name="place" size="xs" class="path-icon" />
                            <span class="path-text">
                              {{ formatTreePath(prop.node.treePath) }}
                            </span>
                          </div>
                        </div>

                        <!-- Node type indicator for new nodes without type -->
                        <q-btn
                          v-if="prop.node.isNew && !prop.node.nodeTypeId"
                          icon="category"
                          size="xs"
                          flat
                          round
                          dense
                          color="warning"
                          class="q-ml-xs"
                          @click="showContextMenu($event, prop.node)"
                        >
                          <q-tooltip>Click to select node type</q-tooltip>
                        </q-btn>

                        <!-- Status chip -->
                        <q-chip
                          v-if="prop.node.status && prop.node.status !== 'Not Started'"
                          :color="getStatusColor(prop.node.status)"
                          text-color="white"
                          size="sm"
                          dense
                          class="q-ml-xs"
                        >
                          {{ prop.node.status }}
                        </q-chip>

                        <!-- Node actions - positioned after content with padding -->
                        <div class="row items-center q-gutter-xs node-actions q-ml-md">
                          <q-btn
                            v-show="hoveredNode === prop.node.recCode"
                            icon="add"
                            size="sm"
                            flat
                            round
                            dense
                            color="primary"
                            @click.stop="addChildNode(prop.node)"
                          >
                            <q-tooltip>Add child node</q-tooltip>
                          </q-btn>

                          <q-btn
                            v-show="hoveredNode === prop.node.recCode"
                            icon="settings"
                            size="sm"
                            flat
                            round
                            dense
                            color="info"
                            @click.stop="openNodeProperties(prop.node)"
                          >
                            <q-tooltip>Open properties</q-tooltip>
                          </q-btn>

                          <q-btn
                            v-show="hoveredNode === prop.node.recCode"
                            icon="edit"
                            size="sm"
                            flat
                            round
                            dense
                            color="info"
                            @click.stop="startEdit(prop.node)"
                          >
                            <q-tooltip>Edit node</q-tooltip>
                          </q-btn>

                          <q-btn
                            v-show="hoveredNode === prop.node.recCode"
                            icon="delete"
                            size="sm"
                            flat
                            round
                            dense
                            color="negative"
                            @click.stop="deleteNode(prop.node)"
                          >
                            <q-tooltip>Delete node</q-tooltip>
                          </q-btn>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
              </q-tree>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Empty State -->
      <div class="col-12" v-else>
        <q-card>
          <q-card-section class="text-center q-pa-lg">
            <q-icon name="account_tree" size="64px" color="grey-5" />
            <p class="text-h6 text-grey-7 q-mt-md">Select a project to view its tree structure</p>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Context Menu -->
    <q-menu
      v-model="contextMenuVisible"
      :target="contextMenuTarget"
      context-menu
    >
      <q-list dense style="min-width: 250px">
        <q-item-label header class="text-grey-8">Select Node Type</q-item-label>
        <q-item
          v-for="nodeType in nodeTypes"
          :key="nodeType.recCode"
          clickable
          v-close-popup
          @click="setNodeType(contextNode, nodeType.recCode)"
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
          <q-item-section side v-if="contextNode?.nodeTypeId === nodeType.recCode">
            <q-icon name="check" color="positive" />
          </q-item-section>
        </q-item>
        <q-separator />
        <q-item clickable v-close-popup @click="addChildNode(contextNode)">
          <q-item-section avatar>
            <q-icon name="add" />
          </q-item-section>
          <q-item-section>Add Child</q-item-section>
        </q-item>
        <q-item clickable v-close-popup @click="openNodeProperties(contextNode)">
          <q-item-section avatar>
            <q-icon name="settings" />
          </q-item-section>
          <q-item-section>Properties</q-item-section>
        </q-item>
        <q-item clickable v-close-popup @click="startEdit(contextNode)">
          <q-item-section avatar>
            <q-icon name="edit" />
          </q-item-section>
          <q-item-section>Edit</q-item-section>
        </q-item>
        <q-item clickable v-close-popup @click="deleteNode(contextNode)">
          <q-item-section avatar>
            <q-icon name="delete" />
          </q-item-section>
          <q-item-section>Delete</q-item-section>
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
      @node-updated="handleNodeUpdated"
    />
  </q-page>
</template>

<script>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useQuasar } from 'quasar'
import { useProjectStore } from 'stores/project'
import { useRoute, useRouter } from 'vue-router'
import projectService from 'src/services/api/project.service'
import { showSuccess, showError } from 'src/utils/notification'
import SearchChips from 'src/components/SearchChips.vue'
import ProjectNodeProperties from 'src/components/ProjectNodeProperties.vue'

export default {
  name: 'EnhancedProjectNodeTree',

  components: {
    SearchChips,
    ProjectNodeProperties
  },

  setup() {
    const $q = useQuasar()
    const projectStore = useProjectStore()
    const route = useRoute()
    const router = useRouter()

    // Initial URL params
    const initialProjectId = computed(() => route.query.project || null)
    const initialNodeId = computed(() => route.query.node || null)
    // eslint-disable-next-line no-unused-vars
    const initialTab = computed(() => route.query.tab || 'basic')

    // Refs
    const treeRef = ref(null)
    const newProjectForm = ref(null)
    const selectedRootNode = ref(null)
    const treeData = ref([])
    const filteredTreeData = ref([])
    const displayTreeData = ref([])
    const rootNodes = ref([])
    const nodeTypes = ref([])
    const categories = ref([])
    const hoveredNode = ref(null)
    const contextMenuVisible = ref(false)
    const contextMenuTarget = ref(null)
    const contextNode = ref(null)
    const showNewProjectDialog = ref(false)
    const isCreatingProject = ref(false)
    const expandedNodes = ref([])

    // Search and filter state
    const isSearching = ref(false)
    const showSearchResults = ref(false)
    const currentSearchKeywords = ref([])
    const selectedStatus = ref(null)

    // Expansion control
    const expansionLevel = ref('collapse')
    const expansionOptions = [
      { label: 'Collapse All', value: 'collapse' },
      { label: 'Level 1', value: 1 },
      { label: 'Level 2', value: 2 },
      { label: 'Level 3', value: 3 },
      { label: 'Expand All', value: 'all' }
    ]

    // Status filter options
    const statusFilterOptions = [
      { label: 'Not Started', value: 'Not Started' },
      { label: 'In Progress', value: 'In Progress' },
      { label: 'On Hold', value: 'On Hold' },
      { label: 'Completed', value: 'Completed' },
      { label: 'Cancelled', value: 'Cancelled' }
    ]

    // Properties drawer
    const showPropertiesDrawer = ref(false)
    const selectedNodeForProperties = ref(null)

    // New project form
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

    // Computed
    const rootNodeOptions = computed(() => {
      return rootNodes.value.filter(node => node.activeFlag)
    })

    const selectedProjectName = computed(() => {
      const project = rootNodes.value.find(node => node.recCode === selectedRootNode.value)
      return project ? project.nodeName : 'Project'
    })

    // Generate UUID
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
    }

    // Utility functions
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

    const getStatusLabel = (status) => {
      return statusFilterOptions.find(option => option.value === status)?.label || status
    }

    // Search highlighting
    const highlightSearchTerms = (text) => {
      if (!showSearchResults.value || !currentSearchKeywords.value.length || !text) {
        return text
      }

      let highlightedText = text
      currentSearchKeywords.value.forEach(keyword => {
        const regex = new RegExp(`(${keyword})`, 'gi')
        highlightedText = highlightedText.replace(regex, '<mark class="search-highlight">$1</mark>')
      })
      return highlightedText
    }

    // Data fetching functions
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

    const fetchNodeTypes = async () => {
      try {
        const types = await projectStore.fetchNodeTypes()
        nodeTypes.value = types
      } catch (error) {
        showError('Failed to fetch node types')
        console.error(error)
      }
    }

    const fetchTreeCategories = async () => {
      try {
        const cats = await projectStore.fetchCategories()
        categories.value = cats
      } catch (error) {
        showError('Failed to fetch tree categories')
        console.error(error)
      }
    }

    // Tree data management
    const formatTreeNode = (node, level = 0) => {
      const nodeType = nodeTypes.value.find(t => t.recCode === node.nodeTypeId)

      return {
        ...node,
        label: node.nodeName,
        icon: nodeType?.iconName || 'folder',
        iconColor: nodeType?.colorCode || 'primary',
        lazy: node.hasChildren || false,
        editing: false,
        level: level,
        children: node.children ? node.children.map(child => formatTreeNode(child, level + 1)) : []
      }
    }

    const loadTreeData = async () => {
      if (!selectedRootNode.value) return

      try {
        const response = await projectService.getProjectTree(selectedRootNode.value)
        if (response.success && response.data && response.data.length > 0) {
          const rootNode = response.data[0]

          if (rootNode.children && rootNode.children.length > 0) {
            treeData.value = rootNode.children.map(child => formatTreeNode(child, 1))
          } else {
            treeData.value = []
          }

          // Apply current filters
          applyFilters()

          // Apply expansion level
          setTimeout(() => {
            applyExpansionLevel()
          }, 100)
        } else {
          treeData.value = []
        }
      } catch (error) {
        showError('Failed to load tree data')
        console.error(error)
        treeData.value = []
      }
    }

    // Lazy loading for nodes
    const onLazyLoad = async ({ node, done }) => {
      try {
        const response = await projectService.getNodeChildren(node.recCode)
        if (response.success) {
          const children = response.data.map(child => formatTreeNode(child, node.level + 1))
          done(children)
        } else {
          done([])
        }
        // eslint-disable-next-line no-unused-vars
      } catch (error) {
        showError('Failed to load children')
        done([])
      }
    }

    // Search functionality
    const handleSearch = async (keywords) => {
      console.log('Search triggered:', keywords)
      currentSearchKeywords.value = keywords

      if (!keywords || keywords.length === 0) {
        clearSearch()
        return
      }

      if (!selectedRootNode.value) {
        clearSearch()
        return
      }

      isSearching.value = true
      showSearchResults.value = true

      try {
        // Use the search service with both keywords and status filter
        const searchParams = {
          projectId: selectedRootNode.value,
          size: 500
        }

        if (selectedStatus.value) {
          searchParams.status = selectedStatus.value
        }

        const response = await projectService.searchNodesWithPathsArray(keywords, searchParams)

        if (response.success && response.data && response.data.content) {
          // Build a tree structure from search results
          const searchResultsTree = buildTreeFromSearchResults(response.data.content)
          filteredTreeData.value = searchResultsTree
        } else {
          filteredTreeData.value = []
        }

        updateDisplayTree()
      } catch (error) {
        showError('Search failed')
        console.error('Search error:', error)
        filteredTreeData.value = []
      } finally {
        isSearching.value = false
      }
    }

    const handleChipsUpdated = (keywords) => {
      console.log('Keywords updated:', keywords)
      if (keywords.length === 0) {
        clearSearch()
      } else {
        handleSearch(keywords)
      }
    }

    const clearSearch = () => {
      currentSearchKeywords.value = []
      showSearchResults.value = false
      isSearching.value = false
      applyFilters()
    }

    // Build tree structure from flat search results
    const buildTreeFromSearchResults = (searchResults) => {
      const resultMap = new Map()
      const rootNodes = []

      // First pass: create all nodes and preserve tree path
      searchResults.forEach(result => {
        const formattedNode = formatTreeNode(result)
        formattedNode.isSearchResult = true

        // Parse and store tree path from search results
        try {
          if (result.treePath && typeof result.treePath === 'string') {
            formattedNode.treePath = JSON.parse(result.treePath)
          } else if (Array.isArray(result.treePath)) {
            formattedNode.treePath = result.treePath
          } else {
            formattedNode.treePath = []
          }
        } catch (error) {
          console.warn('Failed to parse tree path for node:', result.recCode, error)
          formattedNode.treePath = []
        }

        resultMap.set(result.recCode, formattedNode)
      })

      // Second pass: build parent-child relationships
      searchResults.forEach(result => {
        const node = resultMap.get(result.recCode)

        if (result.parentNodeId && result.parentNodeId !== selectedRootNode.value) {
          const parent = resultMap.get(result.parentNodeId)
          if (parent) {
            if (!parent.children) parent.children = []
            parent.children.push(node)
          } else {
            // Parent not in search results, make it root level
            rootNodes.push(node)
          }
        } else {
          // Top level node
          rootNodes.push(node)
        }
      })

      return rootNodes
    }

    const formatTreePath = (treePath) => {
      if (!treePath || treePath.length === 0) {
        return selectedProjectName.value
      }

      const pathNames = treePath
        .filter(pathItem => pathItem && pathItem.nodeName)
        .map(pathItem => pathItem.nodeName)

      // Prepend project name if not already included
      if (pathNames.length === 0 || pathNames[0] !== selectedProjectName.value) {
        pathNames.unshift(selectedProjectName.value)
      }

      return pathNames.join(' → ')
    }

    // Filter functionality
    const applyFilters = async () => {
      if (showSearchResults.value) {
        // Search is active, don't override with status-only filter
        return
      }

      if (!selectedStatus.value) {
        // No filters active, show original tree
        filteredTreeData.value = [...treeData.value]
        updateDisplayTree()
        return
      }

      // Apply status filter only
      try {
        const searchParams = {
          projectId: selectedRootNode.value,
          size: 500,
          status: selectedStatus.value
        }

        const response = await projectService.searchNodesWithPathsArray([], searchParams)

        if (response.success && response.data && response.data.content) {
          const filteredTree = buildTreeFromSearchResults(response.data.content)
          filteredTreeData.value = filteredTree
        } else {
          filteredTreeData.value = []
        }

        updateDisplayTree()
      } catch (error) {
        showError('Filter failed')
        console.error('Filter error:', error)
        filteredTreeData.value = [...treeData.value]
        updateDisplayTree()
      }
    }

    const clearAllFilters = () => {
      currentSearchKeywords.value = []
      selectedStatus.value = null
      showSearchResults.value = false
      isSearching.value = false
      applyFilters()
    }

    const updateDisplayTree = () => {
      displayTreeData.value = [...filteredTreeData.value]
    }

    // Expansion control
    const applyExpansionLevel = () => {
      const newExpanded = []

      if (expansionLevel.value === 'collapse') {
        expandedNodes.value = []
        return
      }

      if (expansionLevel.value === 'all') {
        // Expand all nodes
        const expandAllNodes = (nodes) => {
          nodes.forEach(node => {
            newExpanded.push(node.recCode)
            if (node.children && node.children.length > 0) {
              expandAllNodes(node.children)
            }
          })
        }
        expandAllNodes(displayTreeData.value)
      } else {
        // Expand to specific level
        const targetLevel = parseInt(expansionLevel.value)
        const expandToLevel = (nodes) => {
          nodes.forEach(node => {
            if (node.level && node.level <= targetLevel) {
              newExpanded.push(node.recCode)
            }
            if (node.children && node.children.length > 0) {
              expandToLevel(node.children)
            }
          })
        }
        expandToLevel(displayTreeData.value)
      }

      expandedNodes.value = newExpanded
    }

    const onExpansionLevelChange = () => {
      applyExpansionLevel()
    }

    const onNodesExpanded = (expanded) => {
      expandedNodes.value = expanded
    }

    // Node operations
    const startEdit = (node) => {
      node.editing = true
      node.originalName = node.nodeName
    }

    const cancelEdit = (node) => {
      node.editing = false
      node.nodeName = node.originalName
      delete node.originalName
    }

    const saveNode = async (node) => {
      if (!node.nodeName || node.nodeName.trim() === '') {
        showError('Node name cannot be empty')
        cancelEdit(node)
        return
      }

      node.editing = false
      node.label = node.nodeName.trim()

      if (!node.nodeTypeId && node.isNew) {
        node.label = node.nodeName.trim()
        return
      }

      try {
        const nodeData = {
          nodeName: node.nodeName.trim(),
          nodeTypeId: node.nodeTypeId
        }

        if (node.isNew) {
          const createData = {
            ...nodeData,
            parentNodeId: node.parentNodeId,
            recCode: node.tempId || generateUUID()
          }

          const response = await projectService.createNode(createData)
          if (response.success) {
            const newNodeData = formatTreeNode(response.data)
            Object.assign(node, newNodeData)
            node.recCode = response.data.recCode
            delete node.isNew
            delete node.tempId
            showSuccess('Node created successfully')
          }
        } else {
          const response = await projectService.updateNode(node.recCode, nodeData)
          if (response.success) {
            showSuccess('Node updated successfully')
          }
        }
      } catch (error) {
        showError('Failed to save node')
        console.error(error)
        if (node.isNew) {
          cancelEdit(node)
        }
      }
    }

    const addChildNode = (parentNode) => {
      if (showSearchResults.value || selectedStatus.value) {
        showError('Cannot add nodes while filtering. Please clear filters first.')
        return
      }

      const tempId = 'temp-' + Date.now()
      const newNode = {
        recCode: tempId,
        tempId: tempId,
        nodeName: 'New Node',
        label: 'New Node',
        parentNodeId: parentNode.recCode ? parentNode.recCode : selectedRootNode.value,
        nodeTypeId: null,
        treeCategoryId: null,
        icon: 'folder',
        iconColor: 'grey',
        editing: true,
        isNew: true,
        lazy: false,
        level: parentNode.level ? parentNode.level + 1 : 1,
        children: []
      }

      if (parentNode.recCode) {
        if (!parentNode.children) {
          parentNode.children = []
        }
        parentNode.children.push(newNode)

        // Expand parent node
        if (!expandedNodes.value.includes(parentNode.recCode)) {
          expandedNodes.value.push(parentNode.recCode)
        }
      } else {
        displayTreeData.value.push(newNode)
      }

      setTimeout(() => {
        startEdit(newNode)
      }, 100)
    }

    const deleteNode = (node) => {
      $q.dialog({
        title: 'Confirm Delete',
        message: `Are you sure you want to delete "${node.nodeName}"? This action cannot be undone.`,
        cancel: true,
        persistent: true
      }).onOk(async () => {
        try {
          if (node.isNew) {
            removeNodeFromTree(node)
          } else {
            await projectService.deleteNode(node.recCode)
            removeNodeFromTree(node)
            showSuccess('Node deleted successfully')
          }
        } catch (error) {
          showError('Failed to delete node')
          console.error(error)
        }
      })
    }

    const removeNodeFromTree = (nodeToRemove) => {
      const findAndRemove = (nodes) => {
        for (let i = 0; i < nodes.length; i++) {
          if (nodes[i].recCode === nodeToRemove.recCode) {
            nodes.splice(i, 1)
            return true
          }
          if (nodes[i].children && findAndRemove(nodes[i].children)) {
            return true
          }
        }
        return false
      }

      findAndRemove(displayTreeData.value)
      findAndRemove(treeData.value)
      findAndRemove(filteredTreeData.value)
    }

    // Context menu and node type management
    const showContextMenu = (event, node) => {
      contextNode.value = node
      contextMenuTarget.value = event.currentTarget || event.target
      contextMenuVisible.value = true
      event.preventDefault()
      event.stopPropagation()
    }

    const setNodeType = async (node, nodeTypeId) => {
      try {
        const selectedType = nodeTypes.value.find(t => t.recCode === nodeTypeId)

        if (node.isNew && !node.nodeTypeId) {
          node.nodeTypeId = nodeTypeId
          if (selectedType) {
            node.icon = selectedType.iconName || 'folder'
            node.iconColor = selectedType.colorCode || 'primary'
          }

          if (node.nodeName && node.nodeName !== 'New Node') {
            await saveNode(node)
          }
        } else if (!node.isNew) {
          const response = await projectService.updateNode(node.recCode, { nodeTypeId })
          if (response.success) {
            node.nodeTypeId = nodeTypeId
            if (selectedType) {
              node.icon = selectedType.iconName || 'folder'
              node.iconColor = selectedType.colorCode || 'primary'
            }
            showSuccess('Node type updated successfully')
          }
        }
      } catch (error) {
        showError('Failed to update node type')
        console.error(error)
      }
    }

    // Properties management
    const openNodeProperties = (node) => {
      if (node.isNew) {
        showError('Please save the node first before opening properties')
        return
      }

      selectedNodeForProperties.value = {
        nodeId: node.recCode,
        nodeName: node.nodeName,
        nodeType: node.nodeType || 'Unknown',
        nodeTypeId: node.nodeTypeId,
        icon: node.icon,
        iconColor: node.iconColor,
        completionPercentage: node.completionPercentage,
        initialTab: 'basic'
      }
      showPropertiesDrawer.value = true

      // Update URL for deep linking
      router.push({
        query: {
          ...route.query,
          project: selectedRootNode.value,
          node: node.recCode,
          tab: 'basic'
        }
      })
    }

    const handleNodeUpdated = ({ nodeId, updates }) => {
      // Update the node in tree data
      const updateNodeInTree = (nodes) => {
        for (const node of nodes) {
          if (node.recCode === nodeId) {
            if (updates.status) node.status = updates.status
            if (updates.priority) node.priority = updates.priority
            if (updates.nodeDescription !== undefined) node.nodeDescription = updates.nodeDescription
            if (updates.nodeName) {
              node.nodeName = updates.nodeName
              node.label = updates.nodeName
            }
            break
          }
          if (node.children && node.children.length > 0) {
            updateNodeInTree(node.children)
          }
        }
      }

      updateNodeInTree(treeData.value)
      updateNodeInTree(filteredTreeData.value)
      updateNodeInTree(displayTreeData.value)
    }

    // Project management
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
          await loadTreeData()
        }
      } catch (error) {
        showError('Failed to create project')
        console.error(error)
      } finally {
        isCreatingProject.value = false
      }
    }

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

    const onRootNodeChange = () => {
      clearAllFilters()
      expandedNodes.value = []
      treeData.value = []
      if (selectedRootNode.value) {
        loadTreeData()
      }
    }

    // Handle URL navigation
    const initializeFromQueryParams = async () => {
      if (initialProjectId.value && initialNodeId.value) {
        try {
          selectedRootNode.value = initialProjectId.value
          await loadTreeData()

          // Find and expand to the target node
          const pathResponse = await projectService.getNodeById(initialNodeId.value)
          if (pathResponse.success) {
            // Open properties for the target node
            await nextTick()

            const findNodeInTree = (nodes, targetId) => {
              for (const node of nodes) {
                if (node.recCode === targetId) {
                  return node
                }
                if (node.children && node.children.length > 0) {
                  const found = findNodeInTree(node.children, targetId)
                  if (found) return found
                }
              }
              return null
            }

            const targetNode = findNodeInTree(treeData.value, initialNodeId.value)
            if (targetNode) {
              openNodeProperties(targetNode)
            }
          }
        } catch (error) {
          console.error('Error navigating to initial node:', error)
        }
      }
    }

    // Watchers
    watch(() => route.query, async (newQuery, oldQuery) => {
      if (newQuery.project && newQuery.node &&
          (newQuery.project !== oldQuery?.project ||
          newQuery.node !== oldQuery?.node ||
          newQuery.tab !== oldQuery?.tab)) {

        if (newQuery.project !== selectedRootNode.value) {
          selectedRootNode.value = newQuery.project
          await loadTreeData()
        }

        // Find and open properties for the target node
        const findNodeInTree = (nodes, targetId) => {
          for (const node of nodes) {
            if (node.recCode === targetId) {
              return node
            }
            if (node.children && node.children.length > 0) {
              const found = findNodeInTree(node.children, targetId)
              if (found) return found
            }
          }
          return null
        }

        await nextTick()
        const targetNode = findNodeInTree(treeData.value, newQuery.node)
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
        }
      }
    }, { immediate: false })

    // Lifecycle
    onMounted(async () => {
      await fetchNodeTypes()
      await fetchTreeCategories()
      await fetchRootNodes()

      if (initialProjectId.value && initialNodeId.value) {
        await initializeFromQueryParams()
      } else {
        if (rootNodeOptions.value.length > 0) {
          selectedRootNode.value = rootNodeOptions.value[0].recCode
          await loadTreeData()
        }
      }
    })

    return {
      // Refs
      treeRef,
      newProjectForm,
      selectedRootNode,
      displayTreeData,
      rootNodeOptions,
      selectedProjectName,
      nodeTypes,
      categories,
      hoveredNode,
      contextMenuVisible,
      contextMenuTarget,
      contextNode,
      showNewProjectDialog,
      isCreatingProject,
      newProject,
      expandedNodes,

      // Search and filter
      isSearching,
      showSearchResults,
      currentSearchKeywords,
      selectedStatus,
      statusFilterOptions,
      filteredTreeData,

      // Expansion
      expansionLevel,
      expansionOptions,

      // Properties
      showPropertiesDrawer,
      selectedNodeForProperties,

      // Methods
      onLazyLoad,
      startEdit,
      cancelEdit,
      saveNode,
      addChildNode,
      deleteNode,
      showContextMenu,
      setNodeType,
      onRootNodeChange,
      createNewProject,
      resetNewProjectForm,
      onExpansionLevelChange,
      onNodesExpanded,
      handleSearch,
      handleChipsUpdated,
      clearSearch,
      applyFilters,
      clearAllFilters,
      openNodeProperties,
      handleNodeUpdated,

      // Utilities
      getStatusColor,
      getStatusLabel,
      highlightSearchTerms,
      formatTreePath
    }
  }
}
</script>

<style lang="scss" scoped>
.tree-node-container {
  transition: background-color 0.2s ease;
  padding: 4px 8px;
  border-radius: 4px;

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
}

.node-label {
  padding: 2px 4px;
  border-radius: 3px;

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
}

.node-content-wrapper {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 8px;
}

.node-name-container {
  display: flex;
  flex-direction: column;
  min-width: 0; // Allow text truncation
}

.node-tree-path {
  display: flex;
  align-items: center;
  margin-top: 2px;
  font-size: 11px;
  color: #666;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
  padding: 2px 6px;
  max-width: 500px;
  overflow: hidden;

  .path-icon {
    margin-right: 4px;
    color: #888;
  }

  .path-text {
    white-space: wrap;
    overflow: visible;
    text-overflow: ellipsis;
    font-style: italic;
  }
}

.node-actions {
  opacity: 0;
  transition: opacity 0.2s ease;
  flex-shrink: 0; // Prevent shrinking

  .tree-node-container:hover & {
    opacity: 1;
  }
}

.node-name-input {
  ::v-deep(.q-field__control) {
    height: 24px;
    min-height: 24px;
    border-bottom: blue thin solid;
  }

  ::v-deep(input) {
    padding: 0 4px;
  }
}

::v-deep(.q-tree__node-header) {
  padding: 0;
}

::v-deep(.q-tree__node) {
  .q-tree__node-header {
    position: relative;
  }
}

// Search highlighting
::v-deep(.search-highlight) {
  background-color: yellow;
  font-weight: bold;
  padding: 1px 2px;
  border-radius: 2px;
}

// Enhanced styling for better UX
.q-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.q-banner {
  border-radius: 4px;
  margin-bottom: 16px;
}

// Status chips styling
.q-chip {
  font-size: 11px;
  height: 20px;
}

// Responsive design
@media (max-width: 768px) {
  .row.q-col-gutter-md > .col-12.col-md-3,
  .row.q-col-gutter-md > .col-12.col-md-1,
  .row.q-col-gutter-md > .col-12.col-md-4,
  .row.q-col-gutter-md > .col-12.col-md-2 {
    margin-bottom: 8px;
  }

  .node-actions {
    opacity: 1; // Always show on mobile
  }
}

// Loading states
.q-spinner-dots {
  margin: 20px auto;
}

// Tree expansion animation
::v-deep(.q-tree__node--expanded) {
  .q-tree__node-header {
    font-weight: 500;
  }
}

// Context menu styling
.q-menu {
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

// Enhanced button styling
.q-btn {
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
  }
}

// Form styling in dialogs
.q-dialog .q-card {
  .q-input, .q-select {
    margin-bottom: 8px;
  }
}
</style>