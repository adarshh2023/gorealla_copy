<template>
  <div
    class="project-node"
    :class="[nodeStateClass, { 'node-selected': isSelected }]"
    :draggable="!isNew && !isEditing"
    @click="handleNodeClick"
    @dblclick="startEdit"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @dragover="handleDragOver"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <!-- Notification dot for notification state -->
    <div
      v-if="hasNotificationState"
      class="notification-dot"
    ></div>

    <!-- Dynamic state icons -->
    <div
      v-if="nodeStates && nodeStates.length > 0"
      class="state-icons-container"
    >
      <q-icon
        v-for="(state, stateIndex) in nodeStates"
        :key="`state-${stateIndex}-${state.type}`"
        :name="getStateIcon(state.type)"
        class="state-icon clickable-icon"
        :class="getStateIconClass(state.type)"
        :style="getStateIconStyle(stateIndex)"
        size="20px"
        :title="state.tooltip || state.type"
        @click.stop="handleStateIconClick(state, stateIndex)"
      />
    </div>

    <!-- Action buttons (always visible) -->
    <div class="action-buttons">
      <!-- Properties button (gear icon) -->
      <q-btn
        icon="settings"
        size="sm"
        flat
        round
        dense
        color="primary"
        class="action-btn properties-btn"
        @click.stop="handleShowProperties"
      >
        <q-tooltip>Properties</q-tooltip>
      </q-btn>

      <!-- Context menu button (three dots) -->
      <q-btn
        ref="contextMenuTrigger"
        icon="more_vert"
        size="sm"
        flat
        round
        dense
        color="grey-6"
        class="action-btn context-btn"
        @click.stop="showContextMenu"
      >
        <q-tooltip>More options</q-tooltip>
      </q-btn>
    </div>

    <!-- Main node content -->
    <div class="node-content">
      <!-- Node header with icon and name -->
      <div class="node-header">
        <q-icon
          :name="nodeIcon || 'folder'"
          :color="iconColor || 'primary'"
          class="node-icon"
          size="24px"
        />

        <!-- Editing mode -->
        <q-input
          v-if="isEditing"
          v-model="editingName"
          dense
          borderless
          autofocus
          @keyup.enter.stop="saveEdit"
          @keyup.esc.stop="cancelEdit"
          @blur="saveEdit"
          @click.stop
          class="node-name-input"
        />

        <!-- Display mode -->
        <span v-else class="node-name">{{ nodeName }}</span>

        <!-- Node type indicator for new nodes without type -->
        <q-btn
          v-if="isNew && !nodeTypeId"
          icon="category"
          size="xs"
          flat
          round
          dense
          color="warning"
          class="q-ml-xs"
          @click.stop="$emit('select-node-type', { nodeId, event: $event })"
        >
          <q-tooltip>Click to select node type</q-tooltip>
        </q-btn>
      </div>

      <!-- Progress bar -->
      <div
        v-if="completionPercentage !== null && !isEditing"
        class="progress-container"
      >
        <q-linear-progress
          :value="completionPercentage / 100"
          color="positive"
          track-color="grey-3"
          size="8px"
          rounded
        />
      </div>
    </div>

    <!-- Context Menu -->
    <q-menu
      ref="contextMenuRef"
      anchor="bottom right"
      self="top right"
      auto-close
      context-menu
    >
      <q-list dense style="min-width: 180px">
        <q-item clickable @click="startEdit" v-close-popup>
          <q-item-section avatar>
            <q-icon name="edit" />
          </q-item-section>
          <q-item-section>Edit</q-item-section>
        </q-item>

        <q-item clickable @click="handleSelectNodeType" v-close-popup>
          <q-item-section avatar>
            <q-icon name="category" />
          </q-item-section>
          <q-item-section>Change Node Type</q-item-section>
        </q-item>

        <q-item clickable @click="handleShowProperties" v-close-popup>
          <q-item-section avatar>
            <q-icon name="settings" />
          </q-item-section>
          <q-item-section>Properties</q-item-section>
        </q-item>

        <q-separator />

        <q-item clickable @click="handleDelete" class="text-negative" v-close-popup>
          <q-item-section avatar>
            <q-icon name="delete" color="negative" />
          </q-item-section>
          <q-item-section>Delete</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </div>
</template>

<script>
import { useQuasar } from 'quasar'

export default {
  name: 'ProjectNodeCard',

  props: {
    // Node data
    nodeName: {
      type: String,
      required: true
    },
    nodeType: {
      type: String,
      default: 'folder'
    },
    nodeIcon: {
      type: String,
      default: null
    },
    iconColor: {
      type: String,
      default: null
    },
    completionPercentage: {
      type: Number,
      default: null
    },
    nodeStates: {
      type: Array,
      default: () => [],
    },
    hasChildren: {
      type: Boolean,
      default: false
    },
    isExpanded: {
      type: Boolean,
      default: false
    },
    isSelected: {
      type: Boolean,
      default: false
    },
    nodeTypeId: {
      type: String,
      default: null
    },
    isNew: {
      type: Boolean,
      default: false
    },
    nodeId: {
      type: String,
      default: null
    },
    status: {
      type: String,
      default: 'Not Started'
    },
    priority: {
      type: String,
      default: 'Medium'
    },
    parentNodeId: {
      type: String,
      default: null
    }
  },

  emits: [
    'node-click',
    'toggle-expand',
    'state-icon-click',
    'node-edit',
    'node-delete',
    'show-properties',
    'select-node-type',
    'save-new-node',
    // Drag events
    'dragstart',
    'dragend',
    'dragover',
    'dragenter',
    'dragleave',
    'drop'
  ],

  data() {
    return {
      isHovered: false,
      isEditing: this.isNew || false,
      editingName: this.nodeName
    }
  },

  computed: {
    nodeStateClass() {
      const classes = {}

      if (this.isNew && !this.nodeTypeId) {
        classes['node-unsaved'] = true
      }

      if (this.nodeStates && this.nodeStates.length > 0) {
        const hasAlert = this.nodeStates.some(state => state.type === 'alert')
        const hasDelayed = this.nodeStates.some(state => state.type === 'delayed')
        const hasNotification = this.nodeStates.some(state => state.type === 'notification')

        if (hasAlert) {
          classes['node-alert'] = true
        } else if (hasDelayed) {
          classes['node-delayed'] = true
        } else if (hasNotification) {
          classes['node-notification'] = true
        }
      } else {
        classes['node-normal'] = true
      }

      return classes
    },

    hasNotificationState() {
      return this.nodeStates && this.nodeStates.some(state => state.type === 'notification')
    }
  },

  watch: {
    isNew(newVal) {
      if (newVal) {
        this.isEditing = true
        this.$nextTick(() => {
          // Auto-focus will be handled by the input's autofocus attribute
        })
      }
    },

    nodeName(newName) {
      this.editingName = newName
    }
  },

  setup() {
    const $q = useQuasar()
    return { quasar: $q }
  },

  methods: {
    // FIXED: Drag event handlers with proper data passing
    handleDragStart(event) {
      if (this.isNew || this.isEditing) {
        event.preventDefault()
        return false
      }

      console.log('Card drag start:', this.nodeName)

      // FIXED: Pass the actual drag event and complete node data
      this.$emit('dragstart', event, event, {
        recCode: this.nodeId,
        nodeName: this.nodeName,  // FIXED: Ensure nodeName is passed correctly
        nodeTypeId: this.nodeTypeId,
        parentNodeId: this.parentNodeId,
        nodeType: this.nodeType,
        icon: this.nodeIcon,
        iconColor: this.iconColor,
        isNew: this.isNew
      })

      return true
    },

    handleDragEnd(event) {
      console.log('Card drag end:', this.nodeName)
      this.$emit('dragend', event)
    },

    handleDragOver(event) {
      // FIXED: Stop propagation to prevent column handler
      event.preventDefault()
      event.stopPropagation()

      this.$emit('dragover', event, {
        recCode: this.nodeId,
        nodeName: this.nodeName,
        parentNodeId: this.parentNodeId
      })
    },

    handleDragEnter(event) {
      // FIXED: Stop propagation to prevent column handler
      event.preventDefault()
      event.stopPropagation()

      this.$emit('dragenter', event, {
        recCode: this.nodeId,
        nodeName: this.nodeName,
        parentNodeId: this.parentNodeId
      })
    },

    handleDragLeave(event) {
      this.$emit('dragleave', event)
    },

    handleDrop(event) {
      // FIXED: Critical - stop ALL event propagation
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()

      console.log('Card drop event - target:', this.nodeName)

      this.$emit('drop', event, {
        recCode: this.nodeId,
        nodeName: this.nodeName,
        parentNodeId: this.parentNodeId
      })
    },

    // State icon methods (unchanged)
    getStateIcon(stateType) {
      const iconMap = {
        alert: 'lightbulb',
        delayed: 'warning',
        chat: 'chat_bubble',
        task: 'assignment',
        notes: 'sticky_note_2',
        notification: 'notifications'
      }
      return iconMap[stateType] || 'info'
    },

    getStateIconClass(stateType) {
      const classMap = {
        alert: 'icon-alert',
        delayed: 'icon-delayed',
        chat: 'icon-chat',
        task: 'icon-task',
        notes: 'icon-notes',
        notification: 'icon-notification'
      }
      return classMap[stateType] || 'icon-default'
    },

    getStateIconStyle(index) {
      const baseOffset = 90
      const spacing = 30
      const rightPosition = baseOffset + (index * spacing)

      return {
        right: `${rightPosition}px`
      }
    },

    handleStateIconClick(state, stateIndex) {
      this.$emit('state-icon-click', {
        nodeId: this.nodeId,
        nodeName: this.nodeName,
        nodeType: this.nodeType,
        stateType: state.type,
        stateData: state,
        stateIndex: stateIndex
      })
    },

    // Node interaction methods (unchanged)
    handleNodeClick() {
      if (!this.isEditing) {
        this.$emit('node-click', {
          nodeId: this.nodeId,
          nodeName: this.nodeName,
          nodeType: this.nodeType,
          completionPercentage: this.completionPercentage,
          status: this.status,
          priority: this.priority,
          states: this.nodeStates
        })
      }
    },

    handleShowProperties() {
      if (!this.isEditing) {
        this.$emit('node-click', {
          nodeId: this.nodeId,
          nodeName: this.nodeName,
          nodeType: this.nodeType,
          completionPercentage: this.completionPercentage,
          status: this.status,
          priority: this.priority,
          states: this.nodeStates
        })
      }

      this.$emit('show-properties', { nodeId: this.nodeId })
    },

    handleSelectNodeType() {
      const mockEvent = new Event('click')
      this.$emit('select-node-type', { nodeId: this.nodeId, event: mockEvent })
    },

    showContextMenu() {
      if (this.$refs.contextMenuRef) {
        this.$refs.contextMenuRef.show()
      }
    },

    startEdit() {
      if (!this.isEditing) {
        this.isEditing = true
        this.editingName = this.nodeName
      }
    },

    saveEdit() {
      const trimmedName = this.editingName.trim()

      if (trimmedName === '') {
        this.cancelEdit()
        return
      }

      if (this.isNew) {
        this.$emit('node-edit', {
          nodeId: this.nodeId,
          oldName: this.nodeName,
          newName: trimmedName
        })

        if (!this.nodeTypeId) {
          this.isEditing = false
          this.quasar.notify({
            message: 'Please select a node type to save this node',
            color: 'warning',
            position: 'top',
            timeout: 2000,
            actions: [
              { label: 'Dismiss', color: 'white' }
            ]
          })
          return
        }

        this.$emit('save-new-node', {
          nodeId: this.nodeId,
          nodeName: trimmedName,
          nodeTypeId: this.nodeTypeId,
          parentNodeId: this.parentNodeId
        })
      } else {
        if (trimmedName !== this.nodeName) {
          this.$emit('node-edit', {
            nodeId: this.nodeId,
            oldName: this.nodeName,
            newName: trimmedName
          })
        }
      }

      this.isEditing = false
    },

    cancelEdit() {
      this.isEditing = false
      this.editingName = this.nodeName
    },

    handleDelete() {
      this.quasar.dialog({
        title: 'Confirm Delete',
        message: `Are you sure you want to delete "${this.nodeName}"? This action cannot be undone.`,
        cancel: true,
        persistent: true
      }).onOk(() => {
        this.$emit('node-delete', {
          nodeId: this.nodeId,
          nodeName: this.nodeName
        })
      })
    }
  }
}
</script>

<style scoped>
.project-node {
  position: relative;
  display: flex;
  align-items: center;
  padding: 12px;
  margin: 4px 0;
  border-radius: 8px;
  border: 2px solid;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 60px;
}

.project-node:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* FIXED: Enhanced drag states */
.project-node[draggable="true"] {
  cursor: grab;
}

.project-node[draggable="true"]:active {
  cursor: grabbing;
}

.project-node.dragging {
  opacity: 0.5;
  transform: scale(0.95);
  cursor: grabbing;
}

/* FIXED: Improved drop target styling */
.project-node.valid-drop-target {
  border: 3px dashed #4caf50 !important;
  background-color: rgba(76, 175, 80, 0.1) !important;
  transform: scale(1.02);
  box-shadow: 0 0 15px rgba(76, 175, 80, 0.3);
}

.project-node.invalid-drop-target {
  border: 3px dashed #f44336 !important;
  background-color: rgba(244, 67, 54, 0.05) !important;
  opacity: 0.6;
  cursor: not-allowed;
}

.project-node.drag-over-valid {
  border: 3px solid #4caf50 !important;
  background-color: rgba(76, 175, 80, 0.15) !important;
  transform: scale(1.03);
  box-shadow: 0 0 20px rgba(76, 175, 80, 0.4);
}

.project-node.drag-over-invalid {
  border: 3px solid #f44336 !important;
  background-color: rgba(244, 67, 54, 0.1) !important;
  box-shadow: 0 0 20px rgba(244, 67, 54, 0.4);
}

/* Selected state */
.node-selected {
  border-color: #1976d2 !important;
  background: #e3f2fd !important;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.2);
}

/* Node states */
.node-normal {
  border-color: #e0e0e0;
}

.node-normal.node-unsaved {
  border-style: dashed;
  border-color: #ffc107;
  background: #fffbf0;
}

.node-notification {
  border-color: #1976d2;
  background: #f3f7ff;
}

.node-delayed {
  border-color: #ffc107;
  background: #fffbf0;
}

.node-alert {
  border-color: #f44336;
  background: #fff5f5;
}

/* Selected state overrides */
.node-selected.node-notification,
.node-selected.node-delayed,
.node-selected.node-alert {
  background: #e3f2fd !important;
}

/* Notification dot */
.notification-dot {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  background: #f44336;
  border-radius: 50%;
  z-index: 10;
}

/* Action buttons container */
.action-buttons {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  z-index: 5;
}

/* State icons container */
.state-icons-container {
  position: absolute;
  top: -13px;
  right: 0;
  z-index: 3;
}

/* State icons */
.state-icon {
  position: absolute;
  border-radius: 50%;
  border: #424242 thin dotted;
  padding: 2px;
  background: white;
}

.clickable-icon {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.clickable-icon:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Icon color classes */
.icon-alert {
  color: #ff9800;
  border-color: #ff9800;
}

.icon-delayed {
  color: #ffc107;
  border-color: #ffc107;
}

.icon-chat {
  color: #2196f3;
  border-color: #2196f3;
}

.icon-task {
  color: #4caf50;
  border-color: #4caf50;
}

.icon-notes {
  color: #9c27b0;
  border-color: #9c27b0;
}

.icon-notification {
  color: #f44336;
  border-color: #f44336;
}

.icon-default {
  color: #757575;
  border-color: #757575;
}

.action-btn {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.action-btn:hover {
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.properties-btn:hover {
  background: #e3f2fd;
}

.context-btn:hover {
  background: #f5f5f5;
}

/* Node content */
.node-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-right: 80px;
}

.node-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.node-icon {
  flex-shrink: 0;
}

.node-name {
  font-weight: 500;
  font-size: 14px;
  color: #212121;
  flex: 1;
  word-break: break-word;
}

/* Node name input for editing */
.node-name-input {
  flex: 1;
}

.node-name-input ::v-deep(.q-field__control) {
  height: 24px;
  min-height: 24px;
  padding: 0;
}

.node-name-input ::v-deep(input) {
  padding: 0 4px;
  font-weight: 500;
  font-size: 14px;
  color: #212121;
}

.node-name-input ::v-deep(.q-field__control:before) {
  border-bottom: 2px solid #1976d2;
}

/* Progress container */
.progress-container {
  width: 100%;
}

/* Context Menu Styling */
.q-menu .q-list .q-item {
  min-height: 40px;
}

.q-menu .q-list .q-item-section--avatar {
  min-width: 32px;
}

/* FIXED: Enhanced drag feedback animations */
@keyframes dragHover {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}

.project-node.drag-over-valid {
  animation: dragHover 1s infinite;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .project-node {
    padding: 10px;
    margin: 3px 0;
  }

  .node-content {
    padding-right: 70px;
  }

  .action-buttons {
    gap: 2px;
  }

  .action-btn {
    min-width: 28px;
    min-height: 28px;
  }

  .node-name {
    font-size: 13px;
  }

  .state-icons-container {
    top: -10px;
  }

  .state-icon {
    padding: 1px;
  }
}

/* Prevent drag during editing */
.project-node.is-editing {
  cursor: default !important;
}

.project-node.is-editing[draggable] {
  pointer-events: none;
}

.project-node.is-editing .node-content {
  pointer-events: all;
}
</style>
