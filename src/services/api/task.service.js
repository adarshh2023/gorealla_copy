// src/services/api/task.service.js
import { api } from 'boot/axios'
import { API_ENDPOINTS, PAGINATION } from 'src/constants/api.constants'

class TaskService {
  /**
   * Create new task
   * @param {Object} taskData - Task creation data
   * @returns {Promise<Object>} Created task
   */
  async createTask(taskData) {
    return await api.post(API_ENDPOINTS.TASKS.BASE, taskData)
  }

  /**
   * Get task by ID
   * @param {string} taskId - Task ID
   * @returns {Promise<Object>} Task data
   */
  async getTaskById(taskId) {
    return await api.get(API_ENDPOINTS.TASKS.BY_ID(taskId))
  }

  /**
   * Update task
   * @param {string} taskId - Task ID
   * @param {Object} taskData - Updated task data
   * @returns {Promise<Object>} Updated task
   */
  async updateTask(taskId, taskData) {
    return await api.put(API_ENDPOINTS.TASKS.BY_ID(taskId), taskData)
  }

  /**
   * Delete task
   * @param {string} taskId - Task ID
   * @returns {Promise<void>}
   */
  async deleteTask(taskId) {
    return await api.delete(API_ENDPOINTS.TASKS.BY_ID(taskId))
  }

  /**
   * Get tasks by node
   * @param {string} nodeId - Node ID
   * @returns {Promise<Array>} Node tasks
   */
  async getNodeTasks(nodeId) {
    return await api.get(API_ENDPOINTS.TASKS.BY_NODE(nodeId))
  }

  /**
   * Get tasks for current user
   * @param {Object} params - Pagination parameters
   * @returns {Promise<Object>} Paginated tasks
   */
  async getMyTasks(params = {}) {
    const queryParams = {
      page: params.page || PAGINATION.DEFAULT_PAGE,
      size: params.size || PAGINATION.DEFAULT_SIZE,
      sort: `${params.sort || 'dueDate'},${params.direction || 'ASC'}`
    }

    return await api.get(API_ENDPOINTS.TASKS.MY_TASKS, { params: queryParams })
  }

  /**
   * Get tasks by status
   * @param {string} status - Task status
   * @param {Object} params - Pagination parameters
   * @returns {Promise<Object>} Paginated tasks
   */
  async getTasksByStatus(status, params = {}) {
    const queryParams = {
      page: params.page || PAGINATION.DEFAULT_PAGE,
      size: params.size || PAGINATION.DEFAULT_SIZE,
      sort: `${params.sort || PAGINATION.DEFAULT_SORT},${params.direction || PAGINATION.DEFAULT_DIRECTION}`
    }

    return await api.get(API_ENDPOINTS.TASKS.BY_STATUS(status), { params: queryParams })
  }

  /**
   * Get tasks by priority
   * @param {string} priority - Task priority
   * @param {Object} params - Pagination parameters
   * @returns {Promise<Object>} Paginated tasks
   */
  async getTasksByPriority(priority, params = {}) {
    const queryParams = {
      page: params.page || PAGINATION.DEFAULT_PAGE,
      size: params.size || PAGINATION.DEFAULT_SIZE,
      sort: `${params.sort || 'dueDate'},${params.direction || 'ASC'}`
    }

    return await api.get(API_ENDPOINTS.TASKS.BY_PRIORITY(priority), { params: queryParams })
  }

  /**
   * Search tasks
   * @param {string} query - Search query
   * @param {Object} params - Pagination parameters
   * @returns {Promise<Object>} Search results
   */
  async searchTasks(query, params = {}) {
    const queryParams = {
      query,
      page: params.page || PAGINATION.DEFAULT_PAGE,
      size: params.size || PAGINATION.DEFAULT_SIZE,
      sort: `${params.sort || 'taskName'},${params.direction || 'ASC'}`
    }

    return await api.get(API_ENDPOINTS.TASKS.SEARCH, { params: queryParams })
  }

  /**
   * Update task status
   * @param {string} taskId - Task ID
   * @param {Object} statusData - Status update data
   * @returns {Promise<void>}
   */
  async updateTaskStatus(taskId, statusData) {
    return await api.put(API_ENDPOINTS.TASKS.UPDATE_STATUS(taskId), statusData)
  }

  /**
   * Assign task to user/stakeholder
   * @param {string} taskId - Task ID
   * @param {Object} assignmentData - Assignment data
   * @returns {Promise<void>}
   */
  async assignTask(taskId, assignmentData) {
    return await api.put(API_ENDPOINTS.TASKS.ASSIGN(taskId), assignmentData)
  }

  /**
   * Update task progress
   * @param {string} taskId - Task ID
   * @param {number} progress - Progress percentage (0-100)
   * @returns {Promise<void>}
   */
  async updateTaskProgress(taskId, progress) {
    return await api.put(API_ENDPOINTS.TASKS.UPDATE_PROGRESS(taskId), null, {
      params: { progress }
    })
  }

  /**
   * Get overdue tasks
   * @returns {Promise<Array>} Overdue tasks
   */
  async getOverdueTasks() {
    return await api.get(API_ENDPOINTS.TASKS.OVERDUE)
  }

  /**
   * Get tasks due today
   * @returns {Promise<Array>} Tasks due today
   */
  async getTasksDueToday() {
    return await api.get(API_ENDPOINTS.TASKS.DUE_TODAY)
  }

  /**
   * Get tasks due in next N days
   * @param {number} days - Number of days
   * @returns {Promise<Array>} Upcoming tasks
   */
  async getTasksDueInDays(days = 7) {
    return await api.get(API_ENDPOINTS.TASKS.DUE_SOON, {
      params: { days }
    })
  }

  /**
   * Get tasks in date range
   * @param {string} startDate - Start date (ISO format)
   * @param {string} endDate - End date (ISO format)
   * @returns {Promise<Array>} Tasks in date range
   */
  async getTasksInDateRange(startDate, endDate) {
    return await api.get(API_ENDPOINTS.TASKS.DATE_RANGE, {
      params: { startDate, endDate }
    })
  }

  /**
   * Get user task summary
   * @returns {Promise<Object>} Task summary
   */
  async getUserTaskSummary() {
    return await api.get(API_ENDPOINTS.TASKS.SUMMARY)
  }

  /**
   * Get upcoming tasks for user
   * @param {number} days - Number of days to look ahead
   * @returns {Promise<Array>} Upcoming tasks
   */
  async getUpcomingTasksForUser(days = 30) {
    return await api.get(API_ENDPOINTS.TASKS.UPCOMING, {
      params: { days }
    })
  }

  /**
   * Get task count by status for a node
   * @param {string} nodeId - Node ID
   * @returns {Promise<Object>} Status counts
   */
  async getTaskCountByStatus(nodeId) {
    return await api.get(API_ENDPOINTS.TASKS.STATUS_COUNT(nodeId))
  }

  /**
   * Get task completion statistics for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} Completion statistics
   */
  async getTaskCompletionStats(projectId) {
    return await api.get(API_ENDPOINTS.TASKS.COMPLETION_STATS(projectId))
  }

  /**
   * Check if task can be deleted
   * @param {string} taskId - Task ID
   * @returns {Promise<Object>} Delete check result
   */
  async canDeleteTask(taskId) {
    return await api.get(API_ENDPOINTS.TASKS.CAN_DELETE(taskId))
  }

  /**
   * Calculate task duration in days
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @returns {number} Duration in days
   */
  calculateTaskDuration(startDate, endDate) {
    if (!startDate || !endDate) return 0

    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays
  }

  /**
   * Get task priority color
   * @param {string} priority - Task priority
   * @returns {string} Color name
   */
  getTaskPriorityColor(priority) {
    const colorMap = {
      'Low': 'grey',
      'Medium': 'primary',
      'High': 'warning',
      'Urgent': 'negative'
    }

    return colorMap[priority] || 'grey'
  }

  /**
   * Get task status color
   * @param {string} status - Task status
   * @returns {string} Color name
   */
  getTaskStatusColor(status) {
    const colorMap = {
      'Pending': 'grey',
      'In Progress': 'primary',
      'On Hold': 'warning',
      'Completed': 'positive',
      'Cancelled': 'negative'
    }

    return colorMap[status] || 'grey'
  }

  /**
   * Get task status icon
   * @param {string} status - Task status
   * @returns {string} Icon name
   */
  getTaskStatusIcon(status) {
    const iconMap = {
      'Pending': 'schedule',
      'In Progress': 'play_circle',
      'On Hold': 'pause_circle',
      'Completed': 'check_circle',
      'Cancelled': 'cancel'
    }

    return iconMap[status] || 'help'
  }

  /**
   * Format task due date
   * @param {string} dueDate - Due date
   * @returns {Object} Formatted date info
   */
  formatTaskDueDate(dueDate) {
    if (!dueDate) return { text: 'No due date', color: 'grey' }

    const due = new Date(dueDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    due.setHours(0, 0, 0, 0)

    const diffTime = due - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return {
        text: `Overdue by ${Math.abs(diffDays)} days`,
        color: 'negative',
        isOverdue: true
      }
    } else if (diffDays === 0) {
      return {
        text: 'Due today',
        color: 'warning',
        isDueToday: true
      }
    } else if (diffDays === 1) {
      return {
        text: 'Due tomorrow',
        color: 'warning',
        isDueTomorrow: true
      }
    } else if (diffDays <= 7) {
      return {
        text: `Due in ${diffDays} days`,
        color: 'primary'
      }
    } else {
      return {
        text: `Due in ${diffDays} days`,
        color: 'grey'
      }
    }
  }

  /**
   * Calculate task progress percentage
   * @param {Object} task - Task object
   * @returns {number} Progress percentage
   */
  calculateTaskProgress(task) {
    if (!task.estimatedHours || task.estimatedHours === 0) {
      return task.status === 'Completed' ? 100 : 0
    }

    const progress = (task.actualHours / task.estimatedHours) * 100
    return Math.min(Math.round(progress), 100)
  }
}

export default new TaskService()
