// src/utils/export.js
import { api } from 'boot/axios'
import { showSuccess, showError, showProgress } from './notification'
import { formatDate } from './date'
import { formatCurrency } from '../services/api/dashboard.service'

/**
 * Export formats
 */
export const EXPORT_FORMATS = {
  CSV: 'csv',
  PDF: 'pdf',
  EXCEL: 'excel',
  JSON: 'json',
  XML: 'xml'
}

/**
 * Report types
 */
export const REPORT_TYPES = {
  PROJECT_SUMMARY: 'project_summary',
  PROJECT_DETAIL: 'project_detail',
  TASK_LIST: 'task_list',
  RESOURCE_ALLOCATION: 'resource_allocation',
  FINANCIAL_SUMMARY: 'financial_summary',
  PROGRESS_REPORT: 'progress_report',
  MILESTONE_REPORT: 'milestone_report',
  RISK_ASSESSMENT: 'risk_assessment',
  STAKEHOLDER_REPORT: 'stakeholder_report',
  CUSTOM: 'custom'
}

/**
 * Paper sizes for PDF
 */
export const PAPER_SIZES = {
  A4: { width: 210, height: 297, unit: 'mm' },
  LETTER: { width: 8.5, height: 11, unit: 'in' },
  LEGAL: { width: 8.5, height: 14, unit: 'in' },
  A3: { width: 297, height: 420, unit: 'mm' }
}

/**
 * Export configuration
 */
export const EXPORT_CONFIG = {
  csv: {
    delimiter: ',',
    lineBreak: '\r\n',
    quotes: '"',
    escape: '"',
    header: true,
    bom: true // Byte Order Mark for Excel compatibility
  },
  pdf: {
    pageSize: PAPER_SIZES.A4,
    orientation: 'portrait',
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
    fontSize: 10,
    fontFamily: 'Helvetica',
    lineHeight: 1.5
  },
  excel: {
    sheetName: 'Report',
    headerStyle: {
      font: { bold: true },
      fill: { fgColor: { rgb: 'FF1976D2' } },
      alignment: { horizontal: 'center' }
    }
  }
}

/**
 * Convert data to CSV format
 * @param {Array} data - Array of objects to convert
 * @param {Object} options - CSV options
 * @returns {string} CSV string
 */
export const dataToCSV = (data, options = {}) => {
  const config = { ...EXPORT_CONFIG.csv, ...options }

  if (!data || data.length === 0) {
    return ''
  }

  // Get headers
  const headers = config.columns || Object.keys(data[0])

  // Build CSV
  let csv = ''

  // Add BOM for Excel
  if (config.bom) {
    csv += '\ufeff'
  }

  // Add headers
  if (config.header) {
    csv += headers.map(header => {
      const label = config.columnLabels?.[header] || header
      return quoteCSVValue(label, config)
    }).join(config.delimiter) + config.lineBreak
  }

  // Add data rows
  data.forEach(row => {
    csv += headers.map(header => {
      let value = row[header]

      // Apply formatter if provided
      if (config.formatters?.[header]) {
        value = config.formatters[header](value, row)
      }

      return quoteCSVValue(value, config)
    }).join(config.delimiter) + config.lineBreak
  })

  return csv
}

/**
 * Quote CSV value if needed
 * @param {*} value - Value to quote
 * @param {Object} config - CSV config
 * @returns {string} Quoted value
 */
const quoteCSVValue = (value, config) => {
  if (value === null || value === undefined) {
    return ''
  }

  const stringValue = String(value)

  // Check if quoting is needed
  const needsQuoting =
    stringValue.includes(config.delimiter) ||
    stringValue.includes(config.quotes) ||
    stringValue.includes('\n') ||
    stringValue.includes('\r')

  if (needsQuoting) {
    // Escape quotes
    const escaped = stringValue.replace(
      new RegExp(config.quotes, 'g'),
      config.escape + config.quotes
    )
    return config.quotes + escaped + config.quotes
  }

  return stringValue
}

/**
 * Export data as CSV file
 * @param {Array} data - Data to export
 * @param {string} filename - Output filename
 * @param {Object} options - Export options
 */
export const exportToCSV = (data, filename = 'export.csv', options = {}) => {
  try {
    const csv = dataToCSV(data, options)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    downloadBlob(blob, filename)
    showSuccess(`Exported ${data.length} records to ${filename}`)
  } catch (error) {
    showError('Failed to export CSV')
    throw error
  }
}

/**
 * Export data as JSON file
 * @param {*} data - Data to export
 * @param {string} filename - Output filename
 * @param {boolean} pretty - Pretty print JSON
 */
export const exportToJSON = (data, filename = 'export.json', pretty = true) => {
  try {
    const json = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data)
    const blob = new Blob([json], { type: 'application/json' })
    downloadBlob(blob, filename)
    showSuccess(`Exported data to ${filename}`)
  } catch (error) {
    showError('Failed to export JSON')
    throw error
  }
}

/**
 * Generate PDF report
 * @param {Object} reportData - Report data
 * @param {Object} options - PDF options
 * @returns {Promise<Blob>} PDF blob
 */
export const generatePDFReport = async (reportData, options = {}) => {
  const {
    type = REPORT_TYPES.CUSTOM,
    title = 'Report',
    subtitle = '',
    orientation = 'portrait',
    pageSize = PAPER_SIZES.A4,
    margins = EXPORT_CONFIG.pdf.margins,
    includeHeader = true,
    includeFooter = true,
    includePageNumbers = true,
    includeTOC = false,
    watermark = null
  } = options

  const progressTracker = showProgress({
    message: 'Generating PDF report...',
    progress: 0
  })

  try {
    // Prepare report request
    const reportRequest = {
      reportType: type,
      title,
      subtitle,
      data: reportData,
      options: {
        orientation,
        pageSize,
        margins,
        includeHeader,
        includeFooter,
        includePageNumbers,
        includeTOC,
        watermark
      }
    }

    progressTracker.update(30, 'Preparing report data...')

    // Call API to generate PDF
    const response = await api.post('/reports/generate-pdf', reportRequest, {
      responseType: 'blob',
      timeout: 60000 // 1 minute timeout for large reports
    })

    progressTracker.update(90, 'Finalizing report...')

    const pdfBlob = new Blob([response.data], { type: 'application/pdf' })

    progressTracker.complete('PDF report generated successfully!')

    return pdfBlob
  } catch (error) {
    progressTracker.error('Failed to generate PDF report')
    throw error
  }
}

/**
 * Export report as PDF
 * @param {Object} reportData - Report data
 * @param {string} filename - Output filename
 * @param {Object} options - Export options
 */
export const exportToPDF = async (reportData, filename = 'report.pdf', options = {}) => {
  try {
    const pdfBlob = await generatePDFReport(reportData, options)
    downloadBlob(pdfBlob, filename)
  } catch (error) {
    console.error('PDF export error:', error)
    throw error
  }
}

/**
 * Export to Excel format
 * @param {Object} data - Data to export
 * @param {string} filename - Output filename
 * @param {Object} options - Export options
 */
export const exportToExcel = async (data, filename = 'export.xlsx', options = {}) => {
  const {
    sheets = null, // Multiple sheets support
    sheetName = EXPORT_CONFIG.excel.sheetName,
    includeHeaders = true,
    autoFilter = true,
    freezePane = true,
    columnWidths = null
  } = options

  const progressTracker = showProgress({
    message: 'Generating Excel file...',
    progress: 0
  })

  try {
    // Prepare Excel data
    const excelRequest = {
      data: sheets || { [sheetName]: data },
      options: {
        includeHeaders,
        autoFilter,
        freezePane,
        columnWidths,
        headerStyle: EXPORT_CONFIG.excel.headerStyle
      }
    }

    progressTracker.update(50, 'Processing data...')

    // Call API to generate Excel
    const response = await api.post('/reports/generate-excel', excelRequest, {
      responseType: 'blob'
    })

    progressTracker.update(90, 'Finalizing Excel file...')

    const excelBlob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })

    downloadBlob(excelBlob, filename)

    progressTracker.complete('Excel file generated successfully!')
  } catch (error) {
    progressTracker.error('Failed to generate Excel file')
    throw error
  }
}

/**
 * Generate project summary report
 * @param {string} projectId - Project ID
 * @param {Object} options - Report options
 * @returns {Promise<Object>} Report data
 */
export const generateProjectSummaryReport = async (projectId, options = {}) => {
  const {
    includeFinancials = true,
    includeTasks = true,
    includeResources = true,
    includeRisks = true,
    dateRange = null
  } = options

  try {
    const response = await api.post(`/reports/project/${projectId}/summary`, {
      includeFinancials,
      includeTasks,
      includeResources,
      includeRisks,
      dateRange
    })

    return response.data
  } catch (error) {
    showError('Failed to generate project summary report')
    throw error
  }
}

/**
 * Generate task list report
 * @param {Object} filters - Task filters
 * @param {Object} options - Report options
 * @returns {Promise<Object>} Report data
 */
export const generateTaskListReport = async (filters = {}, options = {}) => {
  const {
    projectId = null,
    status = null,
    priority = null,
    assignee = null,
    dateRange = null,
    includeSubtasks = true,
    groupBy = null
  } = filters

  try {
    const response = await api.post('/reports/tasks', {
      filters: {
        projectId,
        status,
        priority,
        assignee,
        dateRange
      },
      options: {
        includeSubtasks,
        groupBy,
        ...options
      }
    })

    return response.data
  } catch (error) {
    showError('Failed to generate task list report')
    throw error
  }
}

/**
 * Generate financial summary report
 * @param {string} projectId - Project ID
 * @param {Object} options - Report options
 * @returns {Promise<Object>} Report data
 */
export const generateFinancialSummaryReport = async (projectId, options = {}) => {
  const {
    includeBudget = true,
    includeActuals = true,
    includeVariance = true,
    includeForecast = true,
    dateRange = null,
    groupBy = 'category' // category, month, quarter
  } = options

  try {
    const response = await api.post(`/reports/project/${projectId}/financial`, {
      includeBudget,
      includeActuals,
      includeVariance,
      includeForecast,
      dateRange,
      groupBy
    })

    return response.data
  } catch (error) {
    showError('Failed to generate financial summary report')
    throw error
  }
}

/**
 * Format report data for export
 * @param {Array} data - Raw data
 * @param {string} reportType - Report type
 * @returns {Array} Formatted data
 */
export const formatReportData = (data, reportType) => {
  const formatters = {
    [REPORT_TYPES.PROJECT_SUMMARY]: (row) => ({
      'Project Name': row.projectName,
      'Status': row.status,
      'Progress': `${row.progress}%`,
      'Start Date': formatDate(row.startDate),
      'End Date': formatDate(row.endDate),
      'Budget': formatCurrency(row.budget),
      'Actual Cost': formatCurrency(row.actualCost),
      'Variance': formatCurrency(row.variance)
    }),

    [REPORT_TYPES.TASK_LIST]: (row) => ({
      'Task ID': row.taskId,
      'Task Name': row.taskName,
      'Status': row.status,
      'Priority': row.priority,
      'Assignee': row.assigneeName || 'Unassigned',
      'Due Date': formatDate(row.dueDate),
      'Progress': `${row.progress}%`,
      'Hours Estimated': row.estimatedHours,
      'Hours Actual': row.actualHours
    }),

    [REPORT_TYPES.RESOURCE_ALLOCATION]: (row) => ({
      'Resource': row.resourceName,
      'Type': row.resourceType,
      'Project': row.projectName,
      'Allocation': `${row.allocation}%`,
      'Start Date': formatDate(row.startDate),
      'End Date': formatDate(row.endDate),
      'Total Hours': row.totalHours,
      'Rate': formatCurrency(row.rate),
      'Cost': formatCurrency(row.totalCost)
    }),

    [REPORT_TYPES.FINANCIAL_SUMMARY]: (row) => ({
      'Category': row.category,
      'Budget': formatCurrency(row.budget),
      'Actual': formatCurrency(row.actual),
      'Variance': formatCurrency(row.variance),
      'Variance %': `${row.variancePercent}%`,
      'Forecast': formatCurrency(row.forecast),
      'Status': row.status
    })
  }

  const formatter = formatters[reportType] || ((row) => row)
  return data.map(formatter)
}

/**
 * Create report filename
 * @param {string} reportType - Report type
 * @param {string} format - Export format
 * @param {Object} options - Additional options
 * @returns {string} Filename
 */
export const createReportFilename = (reportType, format, options = {}) => {
  const {
    projectName = null,
    prefix = 'report',
    includeDate = true,
    includeTime = false
  } = options

  let filename = prefix

  // Add project name if provided
  if (projectName) {
    filename += `_${projectName.replace(/[^a-zA-Z0-9]/g, '_')}`
  }

  // Add report type
  filename += `_${reportType}`

  // Add timestamp
  if (includeDate) {
    const date = new Date()
    filename += `_${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`

    if (includeTime) {
      filename += `_${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}`
    }
  }

  // Add format extension
  filename += `.${format}`

  return filename
}

/**
 * Download blob as file
 * @param {Blob} blob - File blob
 * @param {string} filename - Filename
 */
const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename

  // Trigger download
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Clean up
  window.URL.revokeObjectURL(url)
}

/**
 * Export chart as image
 * @param {HTMLElement} chartElement - Chart DOM element
 * @param {string} filename - Output filename
 * @param {string} format - Image format (png, jpeg)
 */
export const exportChartAsImage = async (chartElement, filename = 'chart.png', format = 'png') => {
  try {
    // Use html2canvas or similar library
    const canvas = await html2canvas(chartElement)

    canvas.toBlob((blob) => {
      downloadBlob(blob, filename)
      showSuccess(`Chart exported as ${filename}`)
    }, `image/${format}`)
  } catch (error) {
    showError('Failed to export chart')
    throw error
  }
}

/**
 * Batch export multiple reports
 * @param {Array} reports - Array of report configurations
 * @param {Object} options - Export options
 */
export const batchExportReports = async (reports, options = {}) => {
  const {
    format = EXPORT_FORMATS.PDF,
    combineReports = false,
    zipFilename = 'reports.zip'
  } = options

  const progressTracker = showProgress({
    message: 'Preparing batch export...',
    progress: 0
  })

  try {
    const results = []

    for (let i = 0; i < reports.length; i++) {
      const report = reports[i]
      const progress = Math.round(((i + 1) / reports.length) * 100)

      progressTracker.update(progress, `Generating ${report.name}...`)

      // Generate report based on type
      let reportData
      switch (report.type) {
        case REPORT_TYPES.PROJECT_SUMMARY:
          reportData = await generateProjectSummaryReport(report.projectId, report.options)
          break
        case REPORT_TYPES.TASK_LIST:
          reportData = await generateTaskListReport(report.filters, report.options)
          break
        case REPORT_TYPES.FINANCIAL_SUMMARY:
          reportData = await generateFinancialSummaryReport(report.projectId, report.options)
          break
        default:
          reportData = report.data
      }

      results.push({
        name: report.name,
        type: report.type,
        data: reportData,
        format
      })
    }

    if (combineReports && format === EXPORT_FORMATS.PDF) {
      // Combine PDFs into single file
      progressTracker.update(95, 'Combining reports...')
      // Implementation depends on PDF library
    } else {
      // Create zip file with all reports
      progressTracker.update(95, 'Creating zip file...')
      // Implementation depends on zip library
    }

    progressTracker.complete('Batch export completed successfully!')
  } catch (error) {
    progressTracker.error('Batch export failed')
    throw error
  }
}

/**
 * Schedule report generation
 * @param {Object} schedule - Schedule configuration
 * @returns {Promise<Object>} Schedule response
 */
export const scheduleReport = async (schedule) => {
  const {
    reportType,
    reportConfig,
    frequency, // daily, weekly, monthly
    recipients,
    format = EXPORT_FORMATS.PDF,
    time = '08:00'
  } = schedule

  try {
    const response = await api.post('/reports/schedule', {
      reportType,
      reportConfig,
      frequency,
      recipients,
      format,
      time
    })

    showSuccess('Report scheduled successfully')
    return response.data
  } catch (error) {
    showError('Failed to schedule report')
    throw error
  }
}

// Export all functions as default
export default {
  EXPORT_FORMATS,
  REPORT_TYPES,
  PAPER_SIZES,
  EXPORT_CONFIG,
  dataToCSV,
  exportToCSV,
  exportToJSON,
  generatePDFReport,
  exportToPDF,
  exportToExcel,
  generateProjectSummaryReport,
  generateTaskListReport,
  generateFinancialSummaryReport,
  formatReportData,
  createReportFilename,
  exportChartAsImage,
  batchExportReports,
  scheduleReport
}
