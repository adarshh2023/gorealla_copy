// src/utils/date.js
import { date } from 'quasar'

/**
 * Format date to display format
 * @param {string|Date} dateValue - Date value
 * @param {string} format - Date format (default: 'DD MMM YYYY')
 * @returns {string}
 */
export const formatDate = (dateValue, format = 'DD MMM YYYY') => {
  if (!dateValue) return '-'
  return date.formatDate(dateValue, format)
}

/**
 * Format date with time
 * @param {string|Date} dateValue - Date value
 * @param {string} format - Date format (default: 'DD MMM YYYY HH:mm')
 * @returns {string}
 */
export const formatDateTime = (dateValue, format = 'DD MMM YYYY HH:mm') => {
  if (!dateValue) return '-'
  return date.formatDate(dateValue, format)
}

/**
 * Format time only
 * @param {string|Date} dateValue - Date value
 * @param {string} format - Time format (default: 'HH:mm')
 * @returns {string}
 */
export const formatTime = (dateValue, format = 'HH:mm') => {
  if (!dateValue) return '-'
  return date.formatDate(dateValue, format)
}

/**
 * Get relative time (e.g., '2 hours ago')
 * @param {string|Date} dateValue - Date value
 * @returns {string}
 */
export const getRelativeTime = (dateValue) => {
  if (!dateValue) return ''

  const now = new Date()
  const then = new Date(dateValue)
  const diffMs = now - then
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)

  if (diffSecs < 60) return 'just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`
  if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`
  return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`
}

/**
 * Get time from now (future)
 * @param {string|Date} dateValue - Date value
 * @returns {string}
 */
export const getTimeFromNow = (dateValue) => {
  if (!dateValue) return ''

  const now = new Date()
  const then = new Date(dateValue)
  const diffMs = then - now

  if (diffMs < 0) return getRelativeTime(dateValue)

  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)

  if (diffSecs < 60) return 'in a moment'
  if (diffMins < 60) return `in ${diffMins} minute${diffMins > 1 ? 's' : ''}`
  if (diffHours < 24) return `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`
  if (diffDays < 7) return `in ${diffDays} day${diffDays > 1 ? 's' : ''}`
  if (diffWeeks < 4) return `in ${diffWeeks} week${diffWeeks > 1 ? 's' : ''}`
  if (diffMonths < 12) return `in ${diffMonths} month${diffMonths > 1 ? 's' : ''}`
  return `in ${diffYears} year${diffYears > 1 ? 's' : ''}`
}

/**
 * Check if date is today
 * @param {string|Date} dateValue - Date value
 * @returns {boolean}
 */
export const isToday = (dateValue) => {
  if (!dateValue) return false
  return date.isSameDate(dateValue, new Date(), 'day')
}

/**
 * Check if date is yesterday
 * @param {string|Date} dateValue - Date value
 * @returns {boolean}
 */
export const isYesterday = (dateValue) => {
  if (!dateValue) return false
  const yesterday = date.subtractFromDate(new Date(), { days: 1 })
  return date.isSameDate(dateValue, yesterday, 'day')
}

/**
 * Check if date is tomorrow
 * @param {string|Date} dateValue - Date value
 * @returns {boolean}
 */
export const isTomorrow = (dateValue) => {
  if (!dateValue) return false
  const tomorrow = date.addToDate(new Date(), { days: 1 })
  return date.isSameDate(dateValue, tomorrow, 'day')
}

/**
 * Check if date is in past
 * @param {string|Date} dateValue - Date value
 * @returns {boolean}
 */
export const isPast = (dateValue) => {
  if (!dateValue) return false
  return new Date(dateValue) < new Date()
}

/**
 * Check if date is in future
 * @param {string|Date} dateValue - Date value
 * @returns {boolean}
 */
export const isFuture = (dateValue) => {
  if (!dateValue) return false
  return new Date(dateValue) > new Date()
}

/**
 * Check if date is within range
 * @param {string|Date} dateValue - Date value
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {boolean}
 */
export const isWithinRange = (dateValue, startDate, endDate) => {
  if (!dateValue || !startDate || !endDate) return false
  return date.isBetweenDates(dateValue, startDate, endDate, { inclusiveFrom: true, inclusiveTo: true })
}

/**
 * Get days between dates
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {number}
 */
export const getDaysBetween = (startDate, endDate) => {
  if (!startDate || !endDate) return 0
  return date.getDateDiff(endDate, startDate, 'days')
}

/**
 * Get working days between dates (excluding weekends)
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {number}
 */
export const getWorkingDaysBetween = (startDate, endDate) => {
  if (!startDate || !endDate) return 0

  let count = 0
  let currentDate = new Date(startDate)
  const end = new Date(endDate)

  while (currentDate <= end) {
    const dayOfWeek = currentDate.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
      count++
    }
    currentDate = date.addToDate(currentDate, { days: 1 })
  }

  return count
}

/**
 * Add days to date
 * @param {string|Date} dateValue - Date value
 * @param {number} days - Number of days to add
 * @returns {Date}
 */
export const addDays = (dateValue, days) => {
  if (!dateValue) return null
  return date.addToDate(dateValue, { days })
}

/**
 * Subtract days from date
 * @param {string|Date} dateValue - Date value
 * @param {number} days - Number of days to subtract
 * @returns {Date}
 */
export const subtractDays = (dateValue, days) => {
  if (!dateValue) return null
  return date.subtractFromDate(dateValue, { days })
}

/**
 * Get start of day
 * @param {string|Date} dateValue - Date value
 * @returns {Date}
 */
export const getStartOfDay = (dateValue = new Date()) => {
  return date.startOfDate(dateValue, 'day')
}

/**
 * Get end of day
 * @param {string|Date} dateValue - Date value
 * @returns {Date}
 */
export const getEndOfDay = (dateValue = new Date()) => {
  return date.endOfDate(dateValue, 'day')
}

/**
 * Get start of week
 * @param {string|Date} dateValue - Date value
 * @returns {Date}
 */
export const getStartOfWeek = (dateValue = new Date()) => {
  return date.startOfDate(dateValue, 'week')
}

/**
 * Get end of week
 * @param {string|Date} dateValue - Date value
 * @returns {Date}
 */
export const getEndOfWeek = (dateValue = new Date()) => {
  return date.endOfDate(dateValue, 'week')
}

/**
 * Get start of month
 * @param {string|Date} dateValue - Date value
 * @returns {Date}
 */
export const getStartOfMonth = (dateValue = new Date()) => {
  return date.startOfDate(dateValue, 'month')
}

/**
 * Get end of month
 * @param {string|Date} dateValue - Date value
 * @returns {Date}
 */
export const getEndOfMonth = (dateValue = new Date()) => {
  return date.endOfDate(dateValue, 'month')
}

/**
 * Get calendar format for date
 * @param {string|Date} dateValue - Date value
 * @returns {string}
 */
export const getCalendarFormat = (dateValue) => {
  if (!dateValue) return ''

  if (isToday(dateValue)) return `Today, ${formatTime(dateValue)}`
  if (isYesterday(dateValue)) return `Yesterday, ${formatTime(dateValue)}`
  if (isTomorrow(dateValue)) return `Tomorrow, ${formatTime(dateValue)}`

  const now = new Date()
  const then = new Date(dateValue)

  // If within same year
  if (now.getFullYear() === then.getFullYear()) {
    return formatDate(dateValue, 'ddd, MMM D')
  }

  return formatDate(dateValue, 'ddd, MMM D, YYYY')
}

/**
 * Parse date string to Date object
 * @param {string} dateString - Date string
 * @param {string} format - Date format
 * @returns {Date|null}
 */
export const parseDate = (dateString, format = 'YYYY-MM-DD') => {
  if (!dateString) return null
  return date.extractDate(dateString, format)
}

/**
 * Convert date to ISO string
 * @param {string|Date} dateValue - Date value
 * @returns {string}
 */
export const toISOString = (dateValue) => {
  if (!dateValue) return ''
  return new Date(dateValue).toISOString()
}

/**
 * Convert date to ISO date string (YYYY-MM-DD)
 * @param {string|Date} dateValue - Date value
 * @returns {string}
 */
export const toISODateString = (dateValue) => {
  if (!dateValue) return ''
  return formatDate(dateValue, 'YYYY-MM-DD')
}

/**
 * Get date ranges
 * @returns {Object}
 */
export const getDateRanges = () => {
  const today = new Date()

  return {
    today: {
      from: getStartOfDay(today),
      to: getEndOfDay(today),
      label: 'Today'
    },
    yesterday: {
      from: getStartOfDay(subtractDays(today, 1)),
      to: getEndOfDay(subtractDays(today, 1)),
      label: 'Yesterday'
    },
    thisWeek: {
      from: getStartOfWeek(today),
      to: getEndOfWeek(today),
      label: 'This Week'
    },
    lastWeek: {
      from: getStartOfWeek(subtractDays(today, 7)),
      to: getEndOfWeek(subtractDays(today, 7)),
      label: 'Last Week'
    },
    thisMonth: {
      from: getStartOfMonth(today),
      to: getEndOfMonth(today),
      label: 'This Month'
    },
    lastMonth: {
      from: getStartOfMonth(subtractDays(today, 30)),
      to: getEndOfMonth(subtractDays(today, 30)),
      label: 'Last Month'
    },
    last30Days: {
      from: subtractDays(today, 30),
      to: today,
      label: 'Last 30 Days'
    },
    last90Days: {
      from: subtractDays(today, 90),
      to: today,
      label: 'Last 90 Days'
    }
  }
}

/**
 * Format duration
 * @param {number} minutes - Duration in minutes
 * @returns {string}
 */
export const formatDuration = (minutes) => {
  if (!minutes || minutes < 0) return '0m'

  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

/**
 * Get age from date
 * @param {string|Date} birthDate - Birth date
 * @returns {number}
 */
export const getAge = (birthDate) => {
  if (!birthDate) return 0

  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }

  return age
}

// Export all functions as default
export default {
  formatDate,
  formatDateTime,
  formatTime,
  getRelativeTime,
  getTimeFromNow,
  isToday,
  isYesterday,
  isTomorrow,
  isPast,
  isFuture,
  isWithinRange,
  getDaysBetween,
  getWorkingDaysBetween,
  addDays,
  subtractDays,
  getStartOfDay,
  getEndOfDay,
  getStartOfWeek,
  getEndOfWeek,
  getStartOfMonth,
  getEndOfMonth,
  getCalendarFormat,
  parseDate,
  toISOString,
  toISODateString,
  getDateRanges,
  formatDuration,
  getAge
}
