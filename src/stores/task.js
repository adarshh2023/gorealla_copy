// src/stores/task.js
import { defineStore } from 'pinia'
import taskService from 'src/services/api/task.service'
import { showSuccess, showError, showWarning, showInfo } from 'src/utils/notification'
import { useAuthStore } from './auth'

export const useTaskStore = defineStore('task', {
  state: () => ({
    // Tasks list
    tasks: [],
    totalTasks: 0,
    currentPage: 0,
    pageSize: 20,

    // Current task
    currentTask: null,

    // Node tasks
    nodeTasks: new Map(),

    // User tasks
    myTasks: [],
    myTasksTotal: 0,

    // Loading states
    isLoading: false,
    isLoadingTask: false,
    isLoadingMyTasks: false,

    // Filters
    filters: {
      search: '',
      status: null,
      priority: null,
      assignee: null,
      nodeId: null,
      dateRange: null,
      showCompleted: true
    },

    // Sort
    sortBy: 'dueDate',
    sortDirection: 'ASC',

    // Task statistics
    statistics: {
      total: 0,
      byStatus: {},
      byPriority: {},
      overdue: 0,
      dueToday: 0,
      dueSoon: 0
    },

    // Recently updated tasks
    recentlyUpdated: [],

    // Task templates
    taskTemplates: [],

    // Bulk selection
    selectedTasks: new Set(),

    // Task updates subscription
    taskUpdatesEnabled: true
  }),

  getters: {
    /**
     * Get filtered tasks
     */
    filteredTasks: (state) => {
      let filtered = [...state.tasks]

      // Apply search filter
      if (state.filters.search) {
        const search = state.filters.search.toLowerCase()
        filtered = filtered.filter(task =>
          task.taskName.toLowerCase().includes(search) ||
          task.taskDescription?.toLowerCase().includes(search)
        )
      }

      // Apply status filter
      if (state.filters.status) {
        filtered = filtered.filter(task => task.status === state.filters.status)
      }

      // Apply priority filter
      if (state.filters.priority) {
        filtered = filtered.filter(task => task.priority === state.filters.priority)
      }

      // Apply assignee filter
      if (state.filters.assignee) {
        filtered = filtered.filter(task =>
          task.assignedUserId === state.filters.assignee ||
          task.assignedStakeholderId === state.filters.assignee
        )
      }

      // Apply completed filter
      if (!state.filters.showCompleted) {
        filtered = filtered.filter(task => task.status !== 'Completed')
      }

      return filtered
    },

    /**
     * Get tasks grouped by status
     */
    tasksByStatus: (state) => {
      const groups = {
        'Pending': [],
        'In Progress': [],
        'On Hold': [],
        'Completed': [],
        'Cancelled': []
      }

      state.tasks.forEach(task => {
        const status = task.status || 'Pending'
        if (groups[status]) {
          groups[status].push(task)
        }
      })

      return groups
    },

    /**
     * Get overdue tasks
     */
    overdueTasks: (state) => {
      const now = new Date()
      now.setHours(0, 0, 0, 0)

      return state.tasks.filter(task => {
        if (!task.dueDate || task.status === 'Completed' || task.status === 'Cancelled') {
          return false
        }

        const dueDate = new Date(task.dueDate)
        dueDate.setHours(0, 0, 0, 0)

        return dueDate < now
      })
    },

    /**
     * Get tasks due today
     */
    tasksDueToday: (state) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      return state.tasks.filter(task => {
        if (!task.dueDate || task.status === 'Completed' || task.status === 'Cancelled') {
          return false
        }

        const dueDate = new Date(task.dueDate)
        return dueDate >= today && dueDate < tomorrow
      })
    },

    /**
     * Get my pending tasks count
     */
    myPendingTasksCount: (state) => {
      return state.myTasks.filter(task =>
        task.status !== 'Completed' && task.status !== 'Cancelled'
      ).length
    },

    /**
     * Get task by ID
     */
    getTaskById: (state) => (taskId) => {
      return state.tasks.find(task => task.recCode === taskId)
    },

    /**
     * Get tasks for node
     */
    getTasksForNode: (state) => (nodeId) => {
      return state.nodeTasks.get(nodeId) || []
    },

    /**
     * Check if task is selected
     */
    isTaskSelected: (state) => (taskId) => {
      return state.selectedTasks.has(taskId)
    },

    /**
     * Get selected tasks
     */
    getSelectedTasks: (state) => {
      return state.tasks.filter(task => state.selectedTasks.has(task.recCode))
    },

    /**
     * Get task progress percentage
     */
    getTaskProgress: (state) => (taskId) => {
      const task = state.getTaskById(taskId)
      if (!task) return 0

      if (task.status === 'Completed') return 100
      if (task.status === 'Cancelled') return 0

      return task.progressPercentage || 0
    }
  },

  actions: {
    /**
     * Fetch tasks for current user
     */
    async fetchMyTasks(params = {}) {
      this.isLoadingMyTasks = true

      try {
        const queryParams = {
          page: params.page ?? 0,
          size: params.size ?? 50,
          sort: 'dueDate',
          direction: 'ASC'
        }

        const response = await taskService.getMyTasks(queryParams)

        if (response.success) {
          this.myTasks = response.data.content
          this.myTasksTotal = response.data.totalElements

          // Update statistics
          this.updateStatistics()
        }

        return response
      } catch (error) {
        showError('Failed to fetch your tasks')
        throw error
      } finally {
        this.isLoadingMyTasks = false
      }
    },

    /**
     * Fetch tasks for node
     */
    async fetchNodeTasks(nodeId) {
      this.isLoading = true

      try {
        const response = await taskService.getNodeTasks(nodeId)

        if (response.success) {
          this.nodeTasks.set(nodeId, response.data)

          // Merge with main tasks list
          this.mergeTasksToList(response.data)
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch node tasks')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Fetch single task
     */
    async fetchTask(taskId) {
      if (this.currentTask?.recCode === taskId) {
        return this.currentTask
      }

      this.isLoadingTask = true

      try {
        const response = await taskService.getTaskById(taskId)

        if (response.success) {
          this.currentTask = response.data

          // Update in list
          this.updateTaskInList(response.data)
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch task')
        throw error
      } finally {
        this.isLoadingTask = false
      }
    },

    /**
     * Create task
     */
    async createTask(taskData) {
      this.isLoading = true

      try {
        const response = await taskService.createTask(taskData)

        if (response.success) {
          // Add to lists
          this.tasks.unshift(response.data)
          this.totalTasks++

          // Add to node tasks if applicable
          if (taskData.nodeId) {
            const nodeTasks = this.nodeTasks.get(taskData.nodeId) || []
            nodeTasks.unshift(response.data)
            this.nodeTasks.set(taskData.nodeId, nodeTasks)
          }

          // Add to my tasks if assigned to current user
          const authStore = useAuthStore()
          if (response.data.assignedUserId === authStore.user?.recCode) {
            this.myTasks.unshift(response.data)
          }

          showSuccess('Task created successfully')
        }

        return response
      } catch (error) {
        showError('Failed to create task')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Update task
     */
    async updateTask(taskId, updateData) {
      this.isLoading = true

      try {
        const response = await taskService.updateTask(taskId, updateData)

        if (response.success) {
          // Update in all lists
          this.updateTaskInList(response.data)

          // Update current task
          if (this.currentTask?.recCode === taskId) {
            this.currentTask = { ...this.currentTask, ...response.data }
          }

          // Add to recently updated
          this.addToRecentlyUpdated(response.data)

          showSuccess('Task updated successfully')
        }

        return response
      } catch (error) {
        showError('Failed to update task')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Delete task
     */
    async deleteTask(taskId) {
      // Check if can delete
      const canDeleteResponse = await taskService.canDeleteTask(taskId)

      if (!canDeleteResponse.data.canDelete) {
        showError(canDeleteResponse.data.reason || 'Cannot delete this task')
        return false
      }

      this.isLoading = true

      try {
        await taskService.deleteTask(taskId)

        // Remove from all lists
        this.removeTaskFromLists(taskId)

        // Clear current if deleted
        if (this.currentTask?.recCode === taskId) {
          this.currentTask = null
        }

        showSuccess('Task deleted successfully')
        return true
      } catch (error) {
        showError('Failed to delete task')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Update task status
     */
    async updateTaskStatus(taskId, status) {
      try {
        const statusData = {
          status,
          statusChangedBy: useAuthStore().user?.recCode,
          statusChangedDate: new Date().toISOString()
        }

        await taskService.updateTaskStatus(taskId, statusData)

        // Update local state
        const task = this.getTaskById(taskId)
        if (task) {
          task.status = status

          // Update progress based on status
          if (status === 'Completed') {
            task.progressPercentage = 100
          } else if (status === 'Cancelled') {
            task.progressPercentage = 0
          }
        }

        showSuccess('Task status updated')
        return true
      } catch (error) {
        showError('Failed to update task status')
        throw error
      }
    },

    /**
     * Update task progress
     */
    async updateTaskProgress(taskId, progress) {
      try {
        await taskService.updateTaskProgress(taskId, progress)

        // Update local state
        const task = this.getTaskById(taskId)
        if (task) {
          task.progressPercentage = progress

          // Auto-complete if 100%
          if (progress === 100 && task.status !== 'Completed') {
            await this.updateTaskStatus(taskId, 'Completed')
          }
        }

        showSuccess('Task progress updated')
        return true
      } catch (error) {
        showError('Failed to update task progress')
        throw error
      }
    },

    /**
     * Assign task
     */
    async assignTask(taskId, assignmentData) {
      try {
        await taskService.assignTask(taskId, assignmentData)

        // Update local state
        const task = this.getTaskById(taskId)
        if (task) {
          if (assignmentData.assignedUserId) {
            task.assignedUserId = assignmentData.assignedUserId
            task.assignedUserName = assignmentData.assignedUserName
          }
          if (assignmentData.assignedStakeholderId) {
            task.assignedStakeholderId = assignmentData.assignedStakeholderId
            task.assignedStakeholderName = assignmentData.assignedStakeholderName
          }
        }

        showSuccess('Task assigned successfully')
        return true
      } catch (error) {
        showError('Failed to assign task')
        throw error
      }
    },

    /**
     * Bulk update tasks
     */
    async bulkUpdateTasks(taskIds, updateData) {
      if (taskIds.length === 0) {
        showWarning('No tasks selected')
        return
      }

      this.isLoading = true

      try {
        const promises = taskIds.map(taskId =>
          taskService.updateTask(taskId, updateData)
        )

        const results = await Promise.allSettled(promises)

        const succeeded = results.filter(r => r.status === 'fulfilled').length
        const failed = results.filter(r => r.status === 'rejected').length

        if (succeeded > 0) {
          showSuccess(`${succeeded} tasks updated successfully`)

          // Refresh tasks
          if (this.filters.nodeId) {
            await this.fetchNodeTasks(this.filters.nodeId)
          } else {
            await this.fetchMyTasks()
          }
        }

        if (failed > 0) {
          showWarning(`${failed} tasks failed to update`)
        }

        // Clear selection
        this.clearSelection()

        return { succeeded, failed }
      } catch (error) {
        showError('Bulk update failed')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Fetch overdue tasks
     */
    async fetchOverdueTasks() {
      try {
        const response = await taskService.getOverdueTasks()

        if (response.success) {
          return response.data
        }

        return []
      } catch (error) {
        console.error('Failed to fetch overdue tasks:', error)
        return []
      }
    },

    /**
     * Fetch upcoming tasks
     */
    async fetchUpcomingTasks(days = 7) {
      try {
        const response = await taskService.getTasksDueInDays(days)

        if (response.success) {
          return response.data
        }

        return []
      } catch (error) {
        console.error('Failed to fetch upcoming tasks:', error)
        return []
      }
    },

    /**
     * Search tasks
     */
    async searchTasks(query, options = {}) {
      try {
        const response = await taskService.searchTasks(query, options)
        return response.data
      } catch (error) {
        showError('Task search failed')
        throw error
      }
    },

    /**
     * Set filters
     */
    setFilters(filters) {
      this.filters = { ...this.filters, ...filters }

      // Fetch tasks based on filter context
      if (filters.nodeId) {
        this.fetchNodeTasks(filters.nodeId)
      } else {
        this.fetchMyTasks()
      }
    },

    /**
     * Clear filters
     */
    clearFilters() {
      const nodeId = this.filters.nodeId // Preserve node context

      this.filters = {
        search: '',
        status: null,
        priority: null,
        assignee: null,
        nodeId,
        dateRange: null,
        showCompleted: true
      }
    },

    /**
     * Toggle task selection
     */
    toggleTaskSelection(taskId) {
      if (this.selectedTasks.has(taskId)) {
        this.selectedTasks.delete(taskId)
      } else {
        this.selectedTasks.add(taskId)
      }
    },

    /**
     * Select all tasks
     */
    selectAllTasks() {
      this.filteredTasks.forEach(task => {
        this.selectedTasks.add(task.recCode)
      })
    },

    /**
     * Clear selection
     */
    clearSelection() {
      this.selectedTasks.clear()
    },

    /**
     * Update task in list
     */
    updateTaskInList(updatedTask) {
      // Update in main list
      const index = this.tasks.findIndex(t => t.recCode === updatedTask.recCode)
      if (index !== -1) {
        this.tasks[index] = { ...this.tasks[index], ...updatedTask }
      }

      // Update in my tasks
      const myIndex = this.myTasks.findIndex(t => t.recCode === updatedTask.recCode)
      if (myIndex !== -1) {
        this.myTasks[myIndex] = { ...this.myTasks[myIndex], ...updatedTask }
      }

      // Update in node tasks
      // eslint-disable-next-line no-unused-vars
      this.nodeTasks.forEach((tasks, nodeId) => {
        const nodeIndex = tasks.findIndex(t => t.recCode === updatedTask.recCode)
        if (nodeIndex !== -1) {
          tasks[nodeIndex] = { ...tasks[nodeIndex], ...updatedTask }
        }
      })
    },

    /**
     * Remove task from lists
     */
    removeTaskFromLists(taskId) {
      // Remove from main list
      this.tasks = this.tasks.filter(t => t.recCode !== taskId)
      this.totalTasks--

      // Remove from my tasks
      this.myTasks = this.myTasks.filter(t => t.recCode !== taskId)

      // Remove from node tasks
      this.nodeTasks.forEach((tasks, nodeId) => {
        const filtered = tasks.filter(t => t.recCode !== taskId)
        this.nodeTasks.set(nodeId, filtered)
      })

      // Remove from selection
      this.selectedTasks.delete(taskId)
    },

    /**
     * Merge tasks to main list
     */
    mergeTasksToList(tasks) {
      tasks.forEach(task => {
        const exists = this.tasks.some(t => t.recCode === task.recCode)
        if (!exists) {
          this.tasks.push(task)
        } else {
          this.updateTaskInList(task)
        }
      })
    },

    /**
     * Add to recently updated
     */
    addToRecentlyUpdated(task) {
      // Remove if exists
      this.recentlyUpdated = this.recentlyUpdated.filter(
        t => t.recCode !== task.recCode
      )

      // Add to beginning
      this.recentlyUpdated.unshift({
        ...task,
        updatedAt: new Date()
      })

      // Limit to 10 items
      if (this.recentlyUpdated.length > 10) {
        this.recentlyUpdated = this.recentlyUpdated.slice(0, 10)
      }
    },

    /**
     * Update statistics
     */
    updateStatistics() {
      const stats = {
        total: this.myTasks.length,
        byStatus: {},
        byPriority: {},
        overdue: 0,
        dueToday: 0,
        dueSoon: 0
      }

      const now = new Date()
      now.setHours(0, 0, 0, 0)

      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const nextWeek = new Date(now)
      nextWeek.setDate(nextWeek.getDate() + 7)

      this.myTasks.forEach(task => {
        // Count by status
        stats.byStatus[task.status] = (stats.byStatus[task.status] || 0) + 1

        // Count by priority
        stats.byPriority[task.priority] = (stats.byPriority[task.priority] || 0) + 1

        // Count overdue/upcoming
        if (task.dueDate && task.status !== 'Completed' && task.status !== 'Cancelled') {
          const dueDate = new Date(task.dueDate)
          dueDate.setHours(0, 0, 0, 0)

          if (dueDate < now) {
            stats.overdue++
          } else if (dueDate.getTime() === now.getTime()) {
            stats.dueToday++
          } else if (dueDate < nextWeek) {
            stats.dueSoon++
          }
        }
      })

      this.statistics = stats
    },

    /**
     * Subscribe to task updates
     */
    subscribeToTaskUpdates() {
      this.taskUpdatesEnabled = true

      // Listen for WebSocket task updates
      window.addEventListener('task:update', (event) => {
        if (this.taskUpdatesEnabled) {
          const update = event.detail
          this.handleTaskUpdate(update)
        }
      })
    },

    /**
     * Handle task update from WebSocket
     */
    handleTaskUpdate(update) {
      // eslint-disable-next-line no-unused-vars
      const { taskId, updateType, data } = update

      // Fetch updated task
      this.fetchTask(taskId).then(task => {
        // Show notification based on update type
        if (updateType === 'assigned' && task.assignedUserId === useAuthStore().user?.recCode) {
          showInfo(`New task assigned: ${task.taskName}`)
        }
      })
    },

    /**
     * Reset store
     */
    resetStore() {
      this.$reset()
      this.nodeTasks.clear()
      this.selectedTasks.clear()
    }
  }
})
