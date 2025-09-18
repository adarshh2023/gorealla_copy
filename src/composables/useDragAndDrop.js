// src/composables/useDragAndDrop.js - FIXED VERSION
import { ref, computed } from 'vue'
import { showSuccess, showError } from 'src/utils/notification'
import projectService from 'src/services/api/project.service'

export function useDragAndDrop() {
  // Drag state
  const draggedNode = ref(null)
  const dragOverTarget = ref(null)
  const isDragging = ref(false)
  const dragPreview = ref(null)
  const dropTargetType = ref(null) // 'node' or 'column'
  const actualDropTarget = ref(null)

  // Throttling timers
  let dragOverThrottle = null
  let dragLeaveThrottle = null

  // FIXED: Updated validation logic
  const isValidDropTarget = computed(() => {
    return (targetNode, targetType) => {
      if (!draggedNode.value) return false

      // Cannot drop if dragged node is temporary/new
      if (draggedNode.value.isNew) {
        return false
      }

      // Cannot drop node into itself
      if (targetType === 'node' && targetNode.recCode === draggedNode.value.recCode) {
        return false
      }

      // FIXED: Allow same-level drops into different nodes
      // Only prevent if dropping into same node, not same parent
      if (targetType === 'node') {
        // Allow dropping PODIUM into B WING even if they share same parent
        return targetNode.recCode !== draggedNode.value.recCode
      }

      // For column drops, prevent only if it's the exact same parent
      if (targetType === 'column') {
        return targetNode.parentId !== draggedNode.value.parentNodeId
      }

      return true
    }
  })

  // Enhanced circular reference check with tree data
  const isDescendantOfWithTreeData = (nodeId, ancestorId, treeData) => {
    if (!treeData || !nodeId || !ancestorId) return false

    const visited = new Set()
    const maxDepth = 20

    const checkDescendant = (currentNodeId, targetAncestorId) => {
      if (visited.has(currentNodeId) || visited.size > maxDepth) {
        return false
      }
      visited.add(currentNodeId)

      // Find the node in tree data
      for (const column of treeData) {
        for (const node of column.nodes) {
          if (node.recCode === currentNodeId) {
            if (node.parentNodeId === targetAncestorId) {
              return true
            }
            if (node.parentNodeId) {
              return checkDescendant(node.parentNodeId, targetAncestorId)
            }
          }
        }
      }
      return false
    }

    return checkDescendant(nodeId, ancestorId)
  }

  // FIXED: Improved drag start with better data tracking
  const handleDragStart = (event, node) => {
    // Only allow dragging of saved nodes
    if (node.isNew) {
      event.preventDefault()
      showError('Cannot move unsaved nodes. Please save the node first.')
      return false
    }

    draggedNode.value = { ...node } // Create copy to avoid reference issues
    isDragging.value = true
    dropTargetType.value = null
    actualDropTarget.value = null

    // FIXED: Check if dataTransfer exists before using it
    if (event.dataTransfer) {
      // Set drag data with more specific information
      const dragData = {
        nodeId: node.recCode,
        nodeName: node.nodeName,
        parentNodeId: node.parentNodeId,
        nodeType: node.nodeType
      }

      event.dataTransfer.setData('application/json', JSON.stringify(dragData))
      event.dataTransfer.setData('text/plain', node.recCode) // Fallback
      event.dataTransfer.effectAllowed = 'move'

      // Create drag preview
      const dragImage = createDragPreview(node)
      if (dragImage) {
        event.dataTransfer.setDragImage(dragImage, 10, 10)
      }
    } else {
      console.warn('dataTransfer is null in dragstart event')
    }

    // Add visual feedback to dragged element
    event.target.classList.add('dragging')
    document.body.classList.add('dragging')

    return true
  }

  const handleDragEnd = (event) => {
    // Cleanup
    draggedNode.value = null
    dragOverTarget.value = null
    isDragging.value = false
    dropTargetType.value = null
    actualDropTarget.value = null

    // Remove visual feedback
    event.target.classList.remove('dragging')
    document.body.classList.remove('dragging')

    // Clear all drag-over classes from DOM
    document.querySelectorAll('.drag-over-valid, .drag-over-invalid').forEach(el => {
      el.classList.remove('drag-over-valid', 'drag-over-invalid')
    })

    // Cleanup drag preview
    if (dragPreview.value) {
      try {
        document.body.removeChild(dragPreview.value)
      // eslint-disable-next-line no-unused-vars
      } catch (e) {
        // Element might already be removed
      }
      dragPreview.value = null
    }

    // Clear throttle timers
    if (dragOverThrottle) {
      clearTimeout(dragOverThrottle)
      dragOverThrottle = null
    }
    if (dragLeaveThrottle) {
      clearTimeout(dragLeaveThrottle)
      dragLeaveThrottle = null
    }
  }

  // FIXED: Improved drag over with better target detection and null checks
  const handleDragOver = (event, target, targetType) => {
    event.preventDefault()
    event.stopPropagation() // FIXED: Prevent bubbling

    if (!draggedNode.value) return

    // Throttle for performance
    if (dragOverThrottle) return

    dragOverThrottle = setTimeout(() => {
      // Store the current target info for drop handler
      actualDropTarget.value = target
      dropTargetType.value = targetType

      const isValid = isValidDropTarget.value(target, targetType)

      // FIXED: Check if dataTransfer exists before accessing dropEffect
      if (event.dataTransfer) {
        if (isValid) {
          event.dataTransfer.dropEffect = 'move'
          dragOverTarget.value = { target, type: targetType }
        } else {
          event.dataTransfer.dropEffect = 'none'
          dragOverTarget.value = null
        }
      } else {
        // Fallback when dataTransfer is null
        console.warn('dataTransfer is null in dragover event')
        if (isValid) {
          dragOverTarget.value = { target, type: targetType }
        } else {
          dragOverTarget.value = null
        }
      }

      dragOverThrottle = null
    }, 50)
  }

  // FIXED: Better drag enter with proper class management
  const handleDragEnter = (event, target, targetType) => {
    event.preventDefault()
    event.stopPropagation() // FIXED: Prevent bubbling

    if (!draggedNode.value) return

    // Clear any pending drag leave timeout
    if (dragLeaveThrottle) {
      clearTimeout(dragLeaveThrottle)
      dragLeaveThrottle = null
    }

    const isValid = isValidDropTarget.value(target, targetType)
    const element = event.currentTarget

    if (!element) return

    try {
      // Remove any existing drag classes first
      element.classList.remove('drag-over-valid', 'drag-over-invalid')

      // Add appropriate class
      if (isValid) {
        element.classList.add('drag-over-valid')
      } else {
        element.classList.add('drag-over-invalid')
      }
    } catch (error) {
      console.warn('Error managing drag classes:', error)
    }
  }

  // FIXED: More reliable drag leave handling
  const handleDragLeave = (event) => {
    const currentTarget = event.currentTarget
    const relatedTarget = event.relatedTarget

    if (!currentTarget) return

    // Clear any existing timeout
    if (dragLeaveThrottle) {
      clearTimeout(dragLeaveThrottle)
      dragLeaveThrottle = null
    }

    try {
      // Only process if actually leaving the element
      if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
        dragLeaveThrottle = setTimeout(() => {
          if (currentTarget && currentTarget.classList) {
            currentTarget.classList.remove('drag-over-valid', 'drag-over-invalid')
          }

          // Also check if we're leaving the actual drop target
          if (actualDropTarget.value && currentTarget.contains &&
              !currentTarget.contains(relatedTarget)) {
            actualDropTarget.value = null
            dropTargetType.value = null
          }

          dragLeaveThrottle = null
        }, 100)
      }
    } catch (error) {
      console.warn('Error in drag leave handler:', error)

      // Fallback cleanup
      if (currentTarget && currentTarget.classList) {
        currentTarget.classList.remove('drag-over-valid', 'drag-over-invalid')
      }
    }
  }

  // FIXED: Improved drop handling with better target detection
  const handleDrop = async (event, target, targetType, treeData = null) => {
    event.preventDefault()
    event.stopPropagation() // FIXED: Critical - prevent bubbling to parent handlers

    console.log('Drop handler called with:', {
      targetType,
      targetName: target.nodeName || target.title,
      draggedNode: draggedNode.value?.nodeName
    })

    // Clear timers immediately
    if (dragOverThrottle) {
      clearTimeout(dragOverThrottle)
      dragOverThrottle = null
    }
    if (dragLeaveThrottle) {
      clearTimeout(dragLeaveThrottle)
      dragLeaveThrottle = null
    }

    // Remove visual feedback
    try {
      const element = event.currentTarget
      if (element && element.classList) {
        element.classList.remove('drag-over-valid', 'drag-over-invalid')
      }
    } catch (error) {
      console.warn('Error removing drag classes:', error)
    }

    if (!draggedNode.value) {
      console.log('No dragged node found')
      return false
    }

    // Use the stored target info for more reliable detection
    const finalTarget = actualDropTarget.value || target
    const finalTargetType = dropTargetType.value || targetType

    console.log('Final drop target:', {
      finalTargetType,
      finalTargetName: finalTarget.nodeName || finalTarget.title
    })

    // Capture values before any state changes
    const movedNodeName = draggedNode.value.nodeName
    const draggedNodeId = draggedNode.value.recCode

    // FIXED: Enhanced validation
    let isValid = isValidDropTarget.value(finalTarget, finalTargetType)

    // Additional circular reference check if tree data available
    if (treeData && finalTargetType === 'node') {
      const wouldCreateCircularRef = isDescendantOfWithTreeData(
        finalTarget.recCode,
        draggedNode.value.recCode,
        treeData
      )
      if (wouldCreateCircularRef) {
        console.log('Circular reference detected')
        isValid = false
      }
    }

    if (!isValid) {
      console.log('Invalid drop target')
      showError('Invalid drop target')
      return false
    }

    // FIXED: Better parent ID determination
    let newParentId
    let targetName

    if (finalTargetType === 'node') {
      // Dropping ON a node - make it a child of that node
      newParentId = finalTarget.recCode
      targetName = finalTarget.nodeName
      console.log(`Dropping INTO node: ${targetName}`)
    } else if (finalTargetType === 'column') {
      // Dropping in empty column space - use column's parent
      newParentId = finalTarget.parentId
      targetName = finalTarget.title || 'column'
      console.log(`Dropping into column: ${targetName}`)
    } else {
      console.log('Unknown target type:', finalTargetType)
      showError('Invalid drop target type')
      return false
    }

    // FIXED: Prevent same-parent moves only for exact same parent
    if (newParentId === draggedNode.value.parentNodeId) {
      console.log('Same parent - no move needed')
      showError('Node is already in this location')
      return false
    }

    try {
      console.log(`Moving node ${draggedNodeId} to parent ${newParentId}`)

      // Call API to move node
      const moveResult = await moveNode(draggedNodeId, newParentId)

      if (moveResult.success) {
        console.log('Move successful')
        showSuccess(`Successfully moved "${movedNodeName}" to ${targetName}`)
        return true
      } else {
        console.log('Move failed:', moveResult.message)
        showError('Failed to move node: ' + moveResult.message)
        return false
      }
    } catch (error) {
      console.error('Error moving node:', error)
      showError('Failed to move node: ' + error.message)
      return false
    }
  }

  // Move node API call (unchanged)
  const moveNode = async (nodeId, newParentId) => {
    try {
      const response = await projectService.moveNode(nodeId, newParentId)
      return {
        success: response.success || true,
        message: response.message || 'Node moved successfully'
      }
    } catch (error) {
      console.error('Error in moveNode API call:', error)
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to move node'
      }
    }
  }

  // FIXED: Create drag preview element with Font Awesome support
  const createDragPreview = (node) => {
    try {
      const preview = document.createElement('div')
      preview.className = 'drag-preview'

      // FIXED: Ensure we have valid node name and icon
      const iconName = node.icon || 'folder'
      const iconColor = node.iconColor || '#1976d2'
      const nodeName = node.nodeName || node.name || 'Unnamed Node' // FIXED: Multiple fallbacks

      console.log('Creating drag preview for:', { iconName, iconColor, nodeName })

      preview.innerHTML = `
        <div class="drag-preview-content">
          <i class="fas fa-${iconName}" style="color: ${iconColor}; font-size: 16px;"></i>
          <span style="margin-left: 8px;">${nodeName}</span>
        </div>
      `

      // Style the preview
      Object.assign(preview.style, {
        position: 'absolute',
        top: '-1000px',
        left: '-1000px',
        padding: '8px 12px',
        backgroundColor: 'white',
        border: '2px solid #1976d2',
        borderRadius: '4px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        zIndex: '9999',
        pointerEvents: 'none',
        opacity: '0.9',
        display: 'flex',
        alignItems: 'center',
        whiteSpace: 'nowrap'
      })

      document.body.appendChild(preview)
      dragPreview.value = preview

      return preview
    } catch (error) {
      console.error('Error creating drag preview:', error)
      return null
    }
  }

  // Get drag state classes for elements
  const getDragClasses = (node, target, targetType) => {
    const classes = []

    if (isDragging.value && draggedNode.value?.recCode === node?.recCode) {
      classes.push('dragging')
    }

    if (isDragging.value && draggedNode.value) {
      if (isValidDropTarget.value(target, targetType)) {
        classes.push('valid-drop-target')
      } else {
        classes.push('invalid-drop-target')
      }
    }

    return classes
  }

  // Check if an element can be dragged
  const canDrag = (node) => {
    return node && !node.isNew && !isDragging.value
  }

  // Reset drag state
  const resetDragState = () => {
    // Clear timers
    if (dragOverThrottle) {
      clearTimeout(dragOverThrottle)
      dragOverThrottle = null
    }
    if (dragLeaveThrottle) {
      clearTimeout(dragLeaveThrottle)
      dragLeaveThrottle = null
    }

    // Reset state
    draggedNode.value = null
    dragOverTarget.value = null
    isDragging.value = false
    dropTargetType.value = null
    actualDropTarget.value = null

    // Remove global drag class
    document.body.classList.remove('dragging')

    // Clean up any remaining drag classes
    document.querySelectorAll('.drag-over-valid, .drag-over-invalid').forEach(el => {
      el.classList.remove('drag-over-valid', 'drag-over-invalid')
    })

    // Cleanup preview
    if (dragPreview.value) {
      try {
        document.body.removeChild(dragPreview.value)
        // eslint-disable-next-line no-unused-vars
      } catch (e) {
        // Element might already be removed
      }
      dragPreview.value = null
    }
  }

  return {
    // State
    draggedNode,
    dragOverTarget,
    isDragging,
    dropTargetType,
    actualDropTarget,

    // Computed
    isValidDropTarget,

    // Methods
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    moveNode,
    getDragClasses,
    canDrag,
    resetDragState,
    isDescendantOfWithTreeData
  }
}
