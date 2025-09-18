// src/services/api/dashboard.service.js
import { api } from 'boot/axios'
import { API_ENDPOINTS } from 'src/constants/api.constants'

class DashboardService {
  // ===== Project Dashboard =====

  /**
   * Get project dashboard
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} Project dashboard data
   */
  async getProjectDashboard(projectId) {
    return await api.get(API_ENDPOINTS.DASHBOARD.PROJECT(projectId))
  }

  /**
   * Get multi-project dashboard
   * @param {Array<string>} projectIds - Array of project IDs
   * @returns {Promise<Array>} Multi-project dashboard data
   */
  async getMultiProjectDashboard(projectIds) {
    return await api.post(API_ENDPOINTS.DASHBOARD.MULTI_PROJECT, projectIds)
  }

  /**
   * Get project health metrics
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} Health metrics
   */
  async getProjectHealthMetrics(projectId) {
    return await api.get(API_ENDPOINTS.DASHBOARD.PROJECT_HEALTH(projectId))
  }

  /**
   * Get critical path
   * @param {string} projectId - Project ID
   * @returns {Promise<Array>} Critical path nodes
   */
  async getCriticalPath(projectId) {
    return await api.get(API_ENDPOINTS.DASHBOARD.CRITICAL_PATH(projectId))
  }

  /**
   * Get project risks
   * @param {string} projectId - Project ID
   * @returns {Promise<Array>} Risk indicators
   */
  async getProjectRisks(projectId) {
    return await api.get(API_ENDPOINTS.DASHBOARD.PROJECT_RISKS(projectId))
  }

  // ===== User Dashboard =====

  /**
   * Get current user dashboard
   * @returns {Promise<Object>} User dashboard data
   */
  async getMyDashboard() {
    return await api.get(API_ENDPOINTS.DASHBOARD.MY_DASHBOARD)
  }

  /**
   * Get user dashboard by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User dashboard data
   */
  async getUserDashboard(userId) {
    return await api.get(API_ENDPOINTS.DASHBOARD.USER_DASHBOARD(userId))
  }

  /**
   * Get user performance metrics
   * @param {string} userId - User ID
   * @param {string} startDate - Start date (ISO format)
   * @param {string} endDate - End date (ISO format)
   * @returns {Promise<Object>} Performance metrics
   */
  async getUserPerformanceMetrics(userId, startDate, endDate) {
    return await api.get(API_ENDPOINTS.DASHBOARD.USER_PERFORMANCE(userId), {
      params: { startDate, endDate }
    })
  }

  /**
   * Get user projects summary
   * @param {string} userId - User ID
   * @returns {Promise<Array>} User projects
   */
  async getUserProjects(userId) {
    return await api.get(API_ENDPOINTS.DASHBOARD.USER_PROJECTS(userId))
  }

  /**
   * Get user workload
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Workload data
   */
  async getUserWorkload(userId) {
    return await api.get(API_ENDPOINTS.DASHBOARD.USER_WORKLOAD(userId))
  }

  // ===== Company Dashboard =====

  /**
   * Get company dashboard
   * @returns {Promise<Object>} Company dashboard data
   */
  async getCompanyDashboard() {
    return await api.get(API_ENDPOINTS.DASHBOARD.COMPANY)
  }

  /**
   * Get company metrics
   * @param {string} startDate - Start date (ISO format)
   * @param {string} endDate - End date (ISO format)
   * @returns {Promise<Object>} Company metrics
   */
  async getCompanyMetrics(startDate, endDate) {
    return await api.get(API_ENDPOINTS.DASHBOARD.COMPANY_METRICS, {
      params: { startDate, endDate }
    })
  }

  /**
   * Get all active projects
   * @returns {Promise<Array>} Active projects
   */
  async getAllActiveProjects() {
    return await api.get(API_ENDPOINTS.DASHBOARD.ACTIVE_PROJECTS)
  }

  /**
   * Get resource utilization
   * @returns {Promise<Object>} Resource utilization data
   */
  async getResourceUtilization() {
    return await api.get(API_ENDPOINTS.DASHBOARD.RESOURCE_UTILIZATION)
  }

  // ===== Node Dashboard =====

  /**
   * Get node dashboard
   * @param {string} nodeId - Node ID
   * @returns {Promise<Object>} Node dashboard data
   */
  async getNodeDashboard(nodeId) {
    return await api.get(API_ENDPOINTS.DASHBOARD.NODE_DASHBOARD(nodeId))
  }

  /**
   * Get node metrics
   * @param {string} nodeId - Node ID
   * @returns {Promise<Object>} Node metrics
   */
  async getNodeMetrics(nodeId) {
    return await api.get(API_ENDPOINTS.DASHBOARD.NODE_METRICS(nodeId))
  }

  /**
   * Get node recent activities
   * @param {string} nodeId - Node ID
   * @param {number} limit - Number of activities
   * @returns {Promise<Array>} Recent activities
   */
  async getNodeRecentActivities(nodeId, limit = 10) {
    return await api.get(API_ENDPOINTS.DASHBOARD.NODE_ACTIVITIES(nodeId), {
      params: { limit }
    })
  }

  /**
   * Get node completion trend
   * @param {string} nodeId - Node ID
   * @param {number} days - Number of days
   * @returns {Promise<Object>} Completion trend data
   */
  async getNodeCompletionTrend(nodeId, days = 30) {
    return await api.get(API_ENDPOINTS.DASHBOARD.NODE_COMPLETION_TREND(nodeId), {
      params: { days }
    })
  }

  // ===== Activity Tracking =====

  /**
   * Get recent activities
   * @param {number} limit - Number of activities
   * @returns {Promise<Array>} Recent activities
   */
  async getRecentActivities(limit = 20) {
    return await api.get(API_ENDPOINTS.DASHBOARD.RECENT_ACTIVITIES, {
      params: { limit }
    })
  }

  /**
   * Get project activities
   * @param {string} projectId - Project ID
   * @param {number} limit - Number of activities
   * @returns {Promise<Array>} Project activities
   */
  async getProjectActivities(projectId, limit = 20) {
    return await api.get(API_ENDPOINTS.DASHBOARD.PROJECT_ACTIVITIES(projectId), {
      params: { limit }
    })
  }

  /**
   * Get user activities
   * @param {string} userId - User ID
   * @param {number} limit - Number of activities
   * @returns {Promise<Array>} User activities
   */
  async getUserActivities(userId, limit = 20) {
    return await api.get(API_ENDPOINTS.DASHBOARD.USER_ACTIVITIES(userId), {
      params: { limit }
    })
  }

  /**
   * Get activities by type
   * @param {string} startDate - Start date (ISO format)
   * @param {string} endDate - End date (ISO format)
   * @returns {Promise<Object>} Activities grouped by type
   */
  async getActivitiesByType(startDate, endDate) {
    return await api.get(API_ENDPOINTS.DASHBOARD.ACTIVITIES_BY_TYPE, {
      params: { startDate, endDate }
    })
  }

  // ===== Performance Metrics =====

  /**
   * Get overall performance metrics
   * @returns {Promise<Object>} Overall performance metrics
   */
  async getOverallPerformanceMetrics() {
    return await api.get(API_ENDPOINTS.DASHBOARD.OVERALL_PERFORMANCE)
  }

  /**
   * Get project performance metrics
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} Project performance metrics
   */
  async getProjectPerformanceMetrics(projectId) {
    return await api.get(API_ENDPOINTS.DASHBOARD.PROJECT_PERFORMANCE(projectId))
  }

  /**
   * Get team performance metrics
   * @param {string} startDate - Start date (ISO format)
   * @param {string} endDate - End date (ISO format)
   * @returns {Promise<Object>} Team performance metrics
   */
  async getTeamPerformanceMetrics(startDate, endDate) {
    return await api.get(API_ENDPOINTS.DASHBOARD.TEAM_PERFORMANCE, {
      params: { startDate, endDate }
    })
  }

  /**
   * Get resource utilization report
   * @returns {Promise<Array>} Resource utilization report
   */
  async getResourceUtilizationReport() {
    return await api.get(API_ENDPOINTS.DASHBOARD.RESOURCE_UTILIZATION_REPORT)
  }

  // ===== Financial Dashboard =====

  /**
   * Get financial dashboard
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} Financial dashboard data
   */
  async getFinancialDashboard(projectId) {
    return await api.get(API_ENDPOINTS.DASHBOARD.FINANCIAL(projectId))
  }

  /**
   * Get budget analysis
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} Budget analysis
   */
  async getBudgetAnalysis(projectId) {
    return await api.get(API_ENDPOINTS.DASHBOARD.BUDGET_ANALYSIS(projectId))
  }

  /**
   * Get cost variance report
   * @param {string} projectId - Project ID
   * @returns {Promise<Array>} Cost variance report
   */
  async getCostVarianceReport(projectId) {
    return await api.get(API_ENDPOINTS.DASHBOARD.COST_VARIANCE(projectId))
  }

  /**
   * Get financial trends
   * @param {string} projectId - Project ID
   * @param {number} months - Number of months
   * @returns {Promise<Object>} Financial trends
   */
  async getFinancialTrends(projectId, months = 6) {
    return await api.get(API_ENDPOINTS.DASHBOARD.FINANCIAL_TRENDS(projectId), {
      params: { months }
    })
  }

  // ===== Milestone and Timeline =====

  /**
   * Get upcoming milestones
   * @param {number} days - Number of days to look ahead
   * @returns {Promise<Array>} Upcoming milestones
   */
  async getUpcomingMilestones(days = 30) {
    return await api.get(API_ENDPOINTS.DASHBOARD.UPCOMING_MILESTONES, {
      params: { days }
    })
  }

  /**
   * Get project milestones
   * @param {string} projectId - Project ID
   * @returns {Promise<Array>} Project milestones
   */
  async getProjectMilestones(projectId) {
    return await api.get(API_ENDPOINTS.DASHBOARD.PROJECT_MILESTONES(projectId))
  }

  /**
   * Get timeline analysis
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} Timeline analysis
   */
  async getTimelineAnalysis(projectId) {
    return await api.get(API_ENDPOINTS.DASHBOARD.TIMELINE_ANALYSIS(projectId))
  }

  /**
   * Get delayed nodes
   * @param {string} projectId - Project ID
   * @returns {Promise<Array>} Delayed nodes
   */
  async getDelayedNodes(projectId) {
    return await api.get(API_ENDPOINTS.DASHBOARD.DELAYED_NODES(projectId))
  }

  // ===== Quality Metrics =====

  /**
   * Get quality metrics
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} Quality metrics
   */
  async getQualityMetrics(projectId) {
    return await api.get(API_ENDPOINTS.DASHBOARD.QUALITY_METRICS(projectId))
  }

  /**
   * Get quality issues
   * @param {string} projectId - Project ID
   * @returns {Promise<Array>} Quality issues
   */
  async getQualityIssues(projectId) {
    return await api.get(API_ENDPOINTS.DASHBOARD.QUALITY_ISSUES(projectId))
  }

  /**
   * Get defect analysis
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} Defect analysis
   */
  async getDefectAnalysis(projectId) {
    return await api.get(API_ENDPOINTS.DASHBOARD.DEFECT_ANALYSIS(projectId))
  }

  // ===== Custom Reports =====

  /**
   * Generate custom report
   * @param {Object} reportRequest - Report request data
   * @returns {Promise<Object>} Generated report
   */
  async generateCustomReport(reportRequest) {
    return await api.post(API_ENDPOINTS.DASHBOARD.CUSTOM_REPORT, reportRequest)
  }

  /**
   * Get KPI report
   * @param {string} projectId - Project ID
   * @returns {Promise<Array>} KPI report
   */
  async getKPIReport(projectId) {
    return await api.get(API_ENDPOINTS.DASHBOARD.KPI_REPORT(projectId))
  }

  /**
   * Get executive summary
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} Executive summary
   */
  async getExecutiveSummary(projectId) {
    return await api.get(API_ENDPOINTS.DASHBOARD.EXECUTIVE_SUMMARY(projectId))
  }

  // ===== Utility Methods =====

  /**
   * Format percentage
   * @param {number} value - Percentage value
   * @returns {string} Formatted percentage
   */
  formatPercentage(value) {
    if (value === null || value === undefined) return '0%'
    return `${Math.round(value)}%`
  }

  /**
   * Format currency
   * @param {number} value - Currency value
   * @returns {string} Formatted currency
   */
  formatCurrency(value) {
    if (value === null || value === undefined) return '₹0'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  /**
   * Calculate variance
   * @param {number} actual - Actual value
   * @param {number} planned - Planned value
   * @returns {Object} Variance data
   */
  calculateVariance(actual, planned) {
    if (!planned || planned === 0) {
      return {
        value: 0,
        percentage: 0,
        status: 'neutral',
        text: 'No baseline'
      }
    }

    const variance = actual - planned
    const percentage = (variance / planned) * 100

    return {
      value: variance,
      percentage: Math.round(percentage),
      status: variance < 0 ? 'negative' : variance > 0 ? 'positive' : 'neutral',
      text: `${variance >= 0 ? '+' : ''}${this.formatCurrency(variance)} (${Math.round(percentage)}%)`
    }
  }

  /**
   * Get health status color
   * @param {string} status - Health status
   * @returns {string} Color name
   */
  getHealthStatusColor(status) {
    const colorMap = {
      'Excellent': 'positive',
      'Good': 'primary',
      'Fair': 'warning',
      'Poor': 'negative',
      'Critical': 'negative'
    }

    return colorMap[status] || 'grey'
  }

  /**
   * Get risk level color
   * @param {string} level - Risk level
   * @returns {string} Color name
   */
  getRiskLevelColor(level) {
    const colorMap = {
      'Low': 'positive',
      'Medium': 'warning',
      'High': 'negative',
      'Critical': 'negative'
    }

    return colorMap[level] || 'grey'
  }

  /**
   * Calculate trend
   * @param {Array} dataPoints - Array of data points with date and value
   * @returns {Object} Trend data
   */
  calculateTrend(dataPoints) {
    if (!dataPoints || dataPoints.length < 2) {
      return {
        direction: 'neutral',
        percentage: 0,
        icon: 'trending_flat'
      }
    }

    const recent = dataPoints[dataPoints.length - 1].value
    const previous = dataPoints[dataPoints.length - 2].value

    if (previous === 0) {
      return {
        direction: recent > 0 ? 'up' : 'neutral',
        percentage: 0,
        icon: recent > 0 ? 'trending_up' : 'trending_flat'
      }
    }

    const change = ((recent - previous) / previous) * 100

    return {
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      percentage: Math.abs(Math.round(change)),
      icon: change > 0 ? 'trending_up' : change < 0 ? 'trending_down' : 'trending_flat'
    }
  }

  /**
   * Format activity type
   * @param {string} activityType - Activity type
   * @returns {Object} Formatted activity type
   */
  formatActivityType(activityType) {
    const typeMap = {
      'task_created': { icon: 'add_task', color: 'primary', label: 'Task Created' },
      'task_completed': { icon: 'task_alt', color: 'positive', label: 'Task Completed' },
      'note_added': { icon: 'note_add', color: 'info', label: 'Note Added' },
      'status_changed': { icon: 'update', color: 'warning', label: 'Status Changed' },
      'assignment_added': { icon: 'person_add', color: 'secondary', label: 'Assignment Added' },
      'milestone_reached': { icon: 'flag', color: 'positive', label: 'Milestone Reached' },
      'issue_reported': { icon: 'error', color: 'negative', label: 'Issue Reported' }
    }

    return typeMap[activityType] || { icon: 'info', color: 'grey', label: activityType }
  }

  /**
   * Build chart data from metrics
   * @param {Object} metrics - Raw metrics data
   * @param {string} chartType - Type of chart
   * @returns {Object} Chart configuration
   */
  // eslint-disable-next-line no-unused-vars
  buildChartData(metrics, chartType) {
    // This would be customized based on your charting library (e.g., Chart.js, ECharts)
    // Example for a simple line chart
    return {
      labels: metrics.labels || [],
      datasets: [{
        label: metrics.title || 'Data',
        data: metrics.values || [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1
      }],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        }
      }
    }
  }
}

export default new DashboardService()
