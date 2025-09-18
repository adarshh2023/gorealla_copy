<template>
  <div class="examples-container">
    <h3>ProjectNode Component Usage Examples</h3>

    <!-- Example 1: Multiple states -->
    <div class="example-section">
      <h4>Multiple States Example</h4>
      <ProjectNode
        node-id="floor-002"
        node-name="First Floor"
        node-type="floor"
        :completion-percentage="15"
        :node-states="multipleStatesExample"
        :has-children="true"
        :is-expanded="false"
        priority="High"
        status="Delayed"
        @node-click="handleNodeClick"
        @toggle-expand="handleToggleExpand"
        @state-icon-click="handleStateIconClick"
      />
    </div>

    <!-- Example 2: Chat and Notes only -->
    <div class="example-section">
      <h4>Communication States Example</h4>
      <ProjectNode
        node-id="unit-101"
        node-name="Unit 101 - 2BHK"
        node-type="unit"
        :completion-percentage="45"
        :node-states="communicationStatesExample"
        :has-children="true"
        :is-expanded="false"
        priority="Medium"
        status="In Progress"
        @node-click="handleNodeClick"
        @toggle-expand="handleToggleExpand"
      />
    </div>

    <!-- Example 3: Task only -->
    <div class="example-section">
      <h4>Task State Example</h4>
      <ProjectNode
        node-id="room-bedroom1"
        node-name="Bedroom 1"
        node-type="room"
        :completion-percentage="80"
        :node-states="taskStateExample"
        :has-children="true"
        :is-expanded="true"
        priority="Low"
        status="Nearly Complete"
        @node-click="handleNodeClick"
        @toggle-expand="handleToggleExpand"
      />
    </div>

    <!-- Example 4: No states (normal) -->
    <div class="example-section">
      <h4>Normal State Example</h4>
      <ProjectNode
        node-id="work-painting"
        node-name="Wall Painting"
        node-type="work"
        :completion-percentage="100"
        :node-states="[]"
        :has-children="false"
        :is-expanded="false"
        priority="Medium"
        status="Completed"
        @node-click="handleNodeClick"
        @toggle-expand="handleToggleExpand"
      />
    </div>

    <!-- Example 5: All possible states -->
    <div class="example-section">
      <h4>All States Example</h4>
      <ProjectNode
        node-id="building-a"
        node-name="Building A"
        node-type="building"
        :completion-percentage="65"
        :node-states="allStatesExample"
        :has-children="true"
        :is-expanded="false"
        priority="High"
        status="Active"
        @node-click="handleNodeClick"
        @toggle-expand="handleToggleExpand"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
// Import your ProjectNode component
import ProjectNode from 'components/ProjectNode.vue'

// Example data for different scenarios
const multipleStatesExample = ref([
  {
    type: 'delayed',
    count: 2,
    tooltip: '2 delayed tasks'
  },
  {
    type: 'alert',
    count: 1,
    tooltip: '1 critical issue'
  },
  {
    type: 'chat',
    count: 5,
    tooltip: '5 unread messages'
  }
])

const communicationStatesExample = ref([
  {
    type: 'chat',
    count: 3,
    tooltip: '3 new messages'
  },
  {
    type: 'notes',
    count: 2,
    tooltip: '2 new notes'
  }
])

const taskStateExample = ref([
  {
    type: 'task',
    count: 1,
    tooltip: '1 pending task'
  }
])

const allStatesExample = ref([
  {
    type: 'alert',
    count: 1,
    tooltip: 'Quality issue reported'
  },
  {
    type: 'delayed',
    count: 3,
    tooltip: '3 delayed activities'
  },
  {
    type: 'chat',
    count: 8,
    tooltip: '8 unread messages'
  },
  {
    type: 'task',
    count: 5,
    tooltip: '5 pending tasks'
  },
  {
    type: 'notes',
    count: 2,
    tooltip: '2 new notes'
  },
  {
    type: 'notification',
    count: 1,
    tooltip: '1 system notification'
  }
])

// Event handlers
const handleNodeClick = (nodeData) => {
  console.log('Node clicked:', nodeData)
  // Handle node click logic
}

const handleStateIconClick = (stateIconData) => {
  console.log('State icon clicked:', stateIconData)

  // Handle different state types
  switch (stateIconData.stateType) {
    case 'chat':
      // Navigate to chat for this node
      console.log(`Opening chat for ${stateIconData.nodeName}`)
      // Example: router.push(`/chat/${stateIconData.nodeId}`)
      break

    case 'task':
      // Show tasks for this node
      console.log(`Opening tasks for ${stateIconData.nodeName}`)
      // Example: openTasksModal(stateIconData.nodeId)
      break

    case 'notes':
      // Show notes for this node
      console.log(`Opening notes for ${stateIconData.nodeName}`)
      // Example: openNotesPanel(stateIconData.nodeId)
      break

    case 'alert':
      // Show alert details
      console.log(`Opening alerts for ${stateIconData.nodeName}`)
      // Example: showAlertDetails(stateIconData.nodeId)
      break

    case 'delayed':
      // Show delayed items
      console.log(`Opening delayed items for ${stateIconData.nodeName}`)
      // Example: showDelayedItems(stateIconData.nodeId)
      break

    case 'notification':
      // Show notifications
      console.log(`Opening notifications for ${stateIconData.nodeName}`)
      // Example: showNotifications(stateIconData.nodeId)
      break

    default:
      console.log(`Unknown state type: ${stateIconData.stateType}`)
  }
}

const handleToggleExpand = (toggleData) => {
  console.log('Toggle expand:', toggleData)
  // Handle expand/collapse logic
}
</script>

<style scoped>
.examples-container {
  padding: 20px;
  max-width: 600px;
}

.example-section {
  margin-bottom: 30px;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fafafa;
}

.example-section h4 {
  margin-top: 0;
  color: #424242;
}
</style>
