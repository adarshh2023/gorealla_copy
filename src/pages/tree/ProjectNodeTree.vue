<!-- ProjectNodeTree -->
<template>
  <q-page padding>
    <div class="row q-col-gutter-md">
      <!-- Header -->
      <div class="col-12">
        <div class="row items-center q-col-gutter-md">
          <div class="col-12 col-md-4">
            <h5 class="text-h5 q-ma-none">Project Tree Management</h5>
          </div>
          <div class="col-12 col-md-5">
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
          <div class="col-12 col-md-3 text-right">
            <q-btn
              label="New Project"
              color="primary"
              icon="add"
              @click="showNewProjectDialog = true"
            />
          </div>
        </div>
      </div>

      <!-- Tree Container -->
      <div class="col-12" v-if="selectedRootNode">
        <q-card>
          <q-card-section>
            <!-- Tree header with Add button -->
            <div v-if="treeData.length > 0" class="row items-center q-mb-md q-px-sm">
              <div class="col">
                <div class="text-subtitle1 text-weight-medium">
                  {{ selectedProjectName }}
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
            <div v-if="treeData.length === 0" class="text-center q-pa-lg">
              <q-icon name="folder_open" size="64px" color="grey-5" />
              <p class="text-h6 text-grey-7 q-mt-md q-mb-lg">No nodes available</p>
              <q-btn
                label="Add First Node"
                color="primary"
                icon="add"
                @click="addChildNode({})"
              />
            </div>

            <!-- Tree view -->
            <div v-show="treeData.length > 0" class="q-pa-sm">
              <q-tree
                ref="treeRef"
                :nodes="treeData"
                node-key="recCode"
                label-key="label"
                default-expand-all
                @lazy-load="onLazyLoad"
              >
                <template v-slot:default-header="prop">
                  <div
                    class="row items-center full-width no-wrap"
                    @contextmenu.prevent.stop="showContextMenu($event, prop.node)"
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

                    <div v-else
                      class="row items-center full-width no-wrap"
                      @contextmenu.prevent="showContextMenu($event, prop.node)"
                    >
                      <span
                        @dblclick="startEdit(prop.node)"
                        class="cursor-pointer node-label"
                      >
                        {{ prop.node.label }}
                      </span>

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

                      <q-space />

                      <div class="row items-center q-gutter-xs">
                        <!-- <q-btn
                          icon="add"
                          size="sm"
                          flat
                          round
                          dense
                          color="primary"
                          @click.stop="addChildNode(prop.node)"
                        >
                          <q-tooltip>Add child node</q-tooltip>
                        </q-btn> -->
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

    <!-- Node Type Selection Dialog -->
    <q-dialog v-model="nodeTypeDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Select Node Type</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-select
            v-model="selectedNodeType"
            :options="nodeTypes"
            option-label="typeName"
            option-value="recCode"
            label="Node Type"
            filled
            emit-value
            map-options
          >
            <template v-slot:option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section avatar>
                  <q-icon
                    :name="scope.opt.iconName || 'folder'"
                    :color="scope.opt.colorCode ? undefined : 'primary'"
                    :style="scope.opt.colorCode ? `color: ${scope.opt.colorCode}` : ''"
                  />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ scope.opt.typeName }}</q-item-label>
                  <q-item-label caption v-if="scope.opt.typeDescription">
                    {{ scope.opt.typeDescription }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn flat label="Save" color="primary" @click="saveNodeType" :disable="!selectedNodeType" />
        </q-card-actions>
      </q-card>
    </q-dialog>

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
  </q-page>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useProjectStore } from 'stores/project'
import projectService from 'src/services/api/project.service'
import { showSuccess, showError } from 'src/utils/notification'

export default {
  name: 'ProjectNodeTree',

  setup() {
    const $q = useQuasar()
    const projectStore = useProjectStore()

    // Refs
    const treeRef = ref(null)
    const newProjectForm = ref(null)
    const selectedRootNode = ref(null)
    const treeData = ref([])
    const rootNodes = ref([])
    const nodeTypes = ref([])
    const categories = ref([])
    const hoveredNode = ref(null)
    const contextMenuVisible = ref(false)
    const contextMenuTarget = ref(null)
    const contextNode = ref(null)
    const nodeTypeDialog = ref(false)
    const selectedNodeType = ref(null)
    const editingNodeForType = ref(null)
    const showNewProjectDialog = ref(false)
    const isCreatingProject = ref(false)
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

    // Fetch node types
    const fetchTreeCategories = async () => {
      try {
        const cats = await projectStore.fetchCategories()
        categories.value = cats
      } catch (error) {
        showError('Failed to fetch tree categories')
        console.error(error)
      }
    }

    // Load tree data
    const loadTreeData = async () => {
      if (!selectedRootNode.value) return

      try {
        const response = await projectService.getProjectTree(selectedRootNode.value)
        if (response.success && response.data && response.data.length > 0) {
          // Get the root node from the array
          const rootNode = response.data[0]

          // Load only the children of the root node
          if (rootNode.children && rootNode.children.length > 0) {
            treeData.value = rootNode.children.map(child => formatTreeNode(child, true))
          } else {
            treeData.value = []
          }
        }
      } catch (error) {
        showError('Failed to load tree data')
        console.error(error)
      }
    }

    // Load tree data
    /* const loadTreeData = async () => {
      if (!selectedRootNode.value) return

      try {
        const response = await projectService.getProjectTree(selectedRootNode.value)
        if (response.success) {
          treeData.value = [formatTreeNode(response.data)]
        }
      } catch (error) {
        showError('Failed to load tree data')
        console.error(error)
      }
    } */

    // Format tree node
    const formatTreeNode = (node, isTopLevel = false) => {
      const nodeType = nodeTypes.value.find(t => t.recCode === node.nodeTypeId)
      if (typeof isTopLevel !== 'boolean') isTopLevel = false; // when called from map (recursion returns index, and causes incorrect isTopLevel true)
      return {
        ...node,
        label: node.nodeName,
        icon: isTopLevel ? 'star' : (nodeType?.iconName || 'folder'),
        iconColor: isTopLevel ? 'amber' : (nodeType?.colorCode || 'primary'),
        lazy: false, // node.hasChildren || false,
        editing: false,
        children: node.children ? node.children.map(formatTreeNode) : []
      }
    }

    // Lazy load children
    const onLazyLoad = async ({ node, done }) => {
      try {
        const response = await projectService.getNodeChildren(node.recCode)
        if (response.success) {
          const children = response.data.map(formatTreeNode)
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

    // Start editing node
    const startEdit = (node) => {
      node.editing = true
      node.originalName = node.nodeName
    }

    // Cancel edit
    const cancelEdit = (node) => {
      node.editing = false
      node.nodeName = node.originalName
      delete node.originalName
    }

    // Save node
    const saveNode = async (node) => {
      if (!node.nodeName || node.nodeName.trim() === '') {
        showError('Node name cannot be empty')
        cancelEdit(node)
        return
      }

      node.editing = false
      node.label = node.nodeName.trim()

      // For new nodes without type, just update the label and wait for type selection
      if (!node.nodeTypeId && node.isNew) {
        node.label = node.nodeName.trim()
        return
      }

      try {
        // Find the first project-type node type or use a default
        // const defaultNodeTypeId = nodeTypes.value.find(t => t.typeName === 'Project')?.recCode || nodeTypes.value[0]?.recCode
        // const defaultTreeCategoryId = categories.value.find(t => t.CategoryName === 'Project')?.recCode || categories.value[0]?.recCode

        const nodeData = {
          nodeName: node.nodeName.trim(),
          nodeTypeId: node.nodeTypeId
        }

        if (node.isNew) {
          // Create new node
          const createData = {
            ...nodeData,
            parentNodeId: node.parentNodeId,
            recCode: node.tempId || generateUUID()
          }

          const response = await projectService.createNode(createData)
          if (response.success) {
            // Update node with server response
            const newNodeData = formatTreeNode(response.data)
            Object.assign(node, newNodeData)
            node.recCode = response.data.recCode
            delete node.isNew
            delete node.tempId
            showSuccess('Node created successfully')
          }
        } else {
          // Update existing node
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

    // Add child node
    const addChildNode = (parentNode) => {
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
        children: []
      }

      if (parentNode.recCode) {
        // Adding to an existing node in the tree
        if (!parentNode.children) {
          parentNode.children = []
        }
        parentNode.children.push(newNode)

        // Expand parent node
        if (treeRef.value) {
          treeRef.value.setExpanded(parentNode.recCode, true)
        }
      } else {
        // Adding to root level (direct child of the selected project)
        treeData.value.push(newNode)
      }

      // Auto-focus on the new node
      setTimeout(() => {
        startEdit(newNode)
      }, 100)
    }

    // Delete node
    const deleteNode = (node) => {
      $q.dialog({
        title: 'Confirm Delete',
        message: `Are you sure you want to delete "${node.nodeName}"? This action cannot be undone.`,
        cancel: true,
        persistent: true
      }).onOk(async () => {
        try {
          if (node.isNew) {
            // Remove from parent's children
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

    // Remove node from tree
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

      findAndRemove(treeData.value)
    }

    // Show context menu
    const showContextMenu = (event, node) => {
      // For left click on category button or right click anywhere
      contextNode.value = node
      contextMenuTarget.value = event.currentTarget || event.target
      contextMenuVisible.value = true

      // Prevent default context menu
      event.preventDefault()
      event.stopPropagation()
    }

    // Set node type from context menu
    const setNodeType = async (node, nodeTypeId) => {
      try {
        const selectedType = nodeTypes.value.find(t => t.recCode === nodeTypeId)

        if (node.isNew && !node.nodeTypeId) {
          // For new nodes, just set the type and save
          node.nodeTypeId = nodeTypeId
          if (selectedType) {
            node.icon = selectedType.iconName || 'folder'
            node.iconColor = selectedType.colorCode || 'primary'
          }

          // If node has a name, save it
          if (node.nodeName && node.nodeName !== 'New Node') {
            await saveNode(node)
          }
        } else if (!node.isNew) {
          // For existing nodes, update via API
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

    // Change node type (for compatibility with old dialog)
    const changeNodeType = () => {
      editingNodeForType.value = contextNode.value
      selectedNodeType.value = contextNode.value.nodeTypeId
      nodeTypeDialog.value = true
    }

    // Save node type (for dialog)
    const saveNodeType = async () => {
      if (!selectedNodeType.value || !editingNodeForType.value) return

      await setNodeType(editingNodeForType.value, selectedNodeType.value)
      nodeTypeDialog.value = false
      editingNodeForType.value = null
    }

    // Create new project (root node)
    const createNewProject = async () => {
      const valid = await newProjectForm.value.validate()
      if (!valid) return

      isCreatingProject.value = true

      try {
        // Convert date format from DD-MM-YYYY to YYYY-MM-DD for backend
        const formatDateForBackend = (dateStr) => {
          if (!dateStr) return null
          const [day, month, year] = dateStr.split('-')
          return `${year}-${month}-${day}`
        }

        // Find the first project-type node type or use a default
        const defaultNodeTypeId = nodeTypes.value.find(t => t.typeName === 'Unit')?.recCode || nodeTypes.value[0]?.recCode
        const defaultTreeCategoryId = categories.value.find(t => t.CategoryName === 'Project')?.recCode || categories.value[0]?.recCode

        const projectData = {
          ...newProject.value,
          recCode: generateUUID(),
          parentNodeId: null, // This makes it a root node
          nodeTypeId: defaultNodeTypeId, // Use default node type
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

          // Add to root nodes list
          rootNodes.value.push(response.data)

          // Select the new project
          selectedRootNode.value = response.data.recCode

          // Reset form and close dialog
          resetNewProjectForm()
          showNewProjectDialog.value = false

          // Load the tree for new project
          await loadTreeData()
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

    // On root node change
    const onRootNodeChange = () => {
      if (selectedRootNode.value) {
        loadTreeData()
      } else {
        treeData.value = []
      }
    }

    // Mounted
    onMounted(async () => {
      await fetchNodeTypes()
      await fetchTreeCategories()
      await fetchRootNodes()

      // Auto-select first project if available
      if (rootNodeOptions.value.length > 0) {
        selectedRootNode.value = rootNodeOptions.value[0].recCode
        await loadTreeData()
      }
    })

    return {
      // Refs
      treeRef,
      newProjectForm,
      selectedRootNode,
      treeData,
      rootNodeOptions,
      selectedProjectName,
      nodeTypes,
      categories,
      hoveredNode,
      contextMenuVisible,
      contextMenuTarget,
      contextNode,
      nodeTypeDialog,
      selectedNodeType,
      showNewProjectDialog,
      isCreatingProject,
      newProject,

      // Methods
      onLazyLoad,
      startEdit,
      cancelEdit,
      saveNode,
      addChildNode,
      deleteNode,
      showContextMenu,
      setNodeType,
      changeNodeType,
      saveNodeType,
      onRootNodeChange,
      createNewProject,
      resetNewProjectForm
    }
  }
}
</script>

<style lang="scss" scoped>
.node-label {
  padding: 2px 4px;
  border-radius: 3px;

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
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
  padding: 4px 8px;
}

/* Ensure the entire node row captures mouse events */
::v-deep(.q-tree__node) {
  .q-tree__node-header {
    position: relative;
  }
}
</style>
