// src/services/api/note.service.js
import { api } from 'boot/axios'
import { API_ENDPOINTS, PAGINATION } from 'src/constants/api.constants'

class NoteService {
  /**
   * Create note
   * @param {Object} noteData - Note creation data
   * @returns {Promise<Object>} Created note
   */
  async createNote(noteData) {
    return await api.post(API_ENDPOINTS.NOTES.BASE, noteData)
  }

  /**
   * Get note by ID
   * @param {string} noteId - Note ID
   * @returns {Promise<Object>} Note data
   */
  async getNoteById(noteId) {
    return await api.get(API_ENDPOINTS.NOTES.BY_ID(noteId))
  }

  /**
   * Update note
   * @param {string} noteId - Note ID
   * @param {Object} noteData - Updated note data
   * @returns {Promise<Object>} Updated note
   */
  async updateNote(noteId, noteData) {
    return await api.put(API_ENDPOINTS.NOTES.BY_ID(noteId), noteData)
  }

  /**
   * Delete note
   * @param {string} noteId - Note ID
   * @returns {Promise<void>}
   */
  async deleteNote(noteId) {
    return await api.delete(API_ENDPOINTS.NOTES.BY_ID(noteId))
  }

  /**
   * Get notes for node
   * @param {string} nodeId - Node ID
   * @param {Object} params - Pagination parameters
   * @returns {Promise<Object>} Paginated notes
   */
  async getNodeNotes(nodeId, params = {}) {
    const queryParams = {
      page: params.page || PAGINATION.DEFAULT_PAGE,
      size: params.size || PAGINATION.DEFAULT_SIZE,
      sort: `${params.sort || PAGINATION.DEFAULT_SORT},${params.direction || PAGINATION.DEFAULT_DIRECTION}`
    }

    return await api.get(API_ENDPOINTS.NOTES.BY_NODE(nodeId), { params: queryParams })
  }

  /**
   * Get notes by type
   * @param {string} nodeId - Node ID
   * @param {string} noteType - Note type
   * @param {Object} params - Pagination parameters
   * @returns {Promise<Object>} Paginated notes
   */
  async getNodeNotesByType(nodeId, noteType, params = {}) {
    const queryParams = {
      page: params.page || PAGINATION.DEFAULT_PAGE,
      size: params.size || PAGINATION.DEFAULT_SIZE,
      sort: `${params.sort || PAGINATION.DEFAULT_SORT},${params.direction || PAGINATION.DEFAULT_DIRECTION}`
    }

    return await api.get(API_ENDPOINTS.NOTES.BY_TYPE(nodeId, noteType), { params: queryParams })
  }

  /**
   * Get important notes for node
   * @param {string} nodeId - Node ID
   * @returns {Promise<Array>} Important notes
   */
  async getImportantNotes(nodeId) {
    return await api.get(API_ENDPOINTS.NOTES.IMPORTANT(nodeId))
  }

  /**
   * Get public notes for node
   * @param {string} nodeId - Node ID
   * @param {Object} params - Pagination parameters
   * @returns {Promise<Object>} Paginated public notes
   */
  async getPublicNotes(nodeId, params = {}) {
    const queryParams = {
      page: params.page || PAGINATION.DEFAULT_PAGE,
      size: params.size || PAGINATION.DEFAULT_SIZE,
      sort: `${params.sort || PAGINATION.DEFAULT_SORT},${params.direction || PAGINATION.DEFAULT_DIRECTION}`
    }

    return await api.get(API_ENDPOINTS.NOTES.PUBLIC(nodeId), { params: queryParams })
  }

  /**
   * Get notes by author
   * @param {string} authorId - Author ID
   * @param {Object} params - Pagination parameters
   * @returns {Promise<Object>} Paginated notes
   */
  async getNotesByAuthor(authorId, params = {}) {
    const queryParams = {
      page: params.page || PAGINATION.DEFAULT_PAGE,
      size: params.size || PAGINATION.DEFAULT_SIZE,
      sort: `${params.sort || PAGINATION.DEFAULT_SORT},${params.direction || PAGINATION.DEFAULT_DIRECTION}`
    }

    return await api.get(API_ENDPOINTS.NOTES.BY_AUTHOR(authorId), { params: queryParams })
  }

  /**
   * Search notes
   * @param {string} query - Search query
   * @param {string} nodeId - Node ID (optional)
   * @param {Object} params - Pagination parameters
   * @returns {Promise<Object>} Search results
   */
  async searchNotes(query, nodeId = null, params = {}) {
    const queryParams = {
      query,
      page: params.page || PAGINATION.DEFAULT_PAGE,
      size: params.size || PAGINATION.DEFAULT_SIZE,
      sort: `${params.sort || PAGINATION.DEFAULT_SORT},${params.direction || PAGINATION.DEFAULT_DIRECTION}`
    }

    if (nodeId) {
      queryParams.nodeId = nodeId
    }

    return await api.get(API_ENDPOINTS.NOTES.SEARCH, { params: queryParams })
  }

  /**
   * Get notes in date range
   * @param {string} startDate - Start date (ISO format)
   * @param {string} endDate - End date (ISO format)
   * @param {string} nodeId - Node ID (optional)
   * @param {Object} params - Pagination parameters
   * @returns {Promise<Object>} Notes in date range
   */
  async getNotesInDateRange(startDate, endDate, nodeId = null, params = {}) {
    const queryParams = {
      startDate,
      endDate,
      page: params.page || PAGINATION.DEFAULT_PAGE,
      size: params.size || PAGINATION.DEFAULT_SIZE,
      sort: `${params.sort || PAGINATION.DEFAULT_SORT},${params.direction || PAGINATION.DEFAULT_DIRECTION}`
    }

    if (nodeId) {
      queryParams.nodeId = nodeId
    }

    return await api.get(API_ENDPOINTS.NOTES.DATE_RANGE, { params: queryParams })
  }

  /**
   * Get recent notes
   * @param {Array} nodeIds - Array of node IDs
   * @param {number} limit - Number of notes to return
   * @returns {Promise<Array>} Recent notes
   */
  async getRecentNotes(nodeIds, limit = 10) {
    return await api.get(API_ENDPOINTS.NOTES.RECENT, {
      params: { nodeIds: nodeIds.join(','), limit }
    })
  }

  /**
   * Toggle note importance
   * @param {string} noteId - Note ID
   * @returns {Promise<Object>} Updated note
   */
  async toggleImportant(noteId) {
    return await api.post(API_ENDPOINTS.NOTES.TOGGLE_IMPORTANT(noteId))
  }

  /**
   * Toggle note privacy
   * @param {string} noteId - Note ID
   * @returns {Promise<Object>} Updated note
   */
  async togglePrivacy(noteId) {
    return await api.post(API_ENDPOINTS.NOTES.TOGGLE_PRIVACY(noteId))
  }

  /**
   * Get note statistics for node
   * @param {string} nodeId - Node ID
   * @returns {Promise<Object>} Note statistics
   */
  async getNoteStatistics(nodeId) {
    return await api.get(API_ENDPOINTS.NOTES.STATISTICS(nodeId))
  }

  /**
   * Export notes
   * @param {string} nodeId - Node ID
   * @returns {Promise<Array>} Exported notes
   */
  async exportNotes(nodeId) {
    return await api.get(API_ENDPOINTS.NOTES.EXPORT, {
      params: { nodeId }
    })
  }

  // NEW MENTION-RELATED METHODS
  // ===========================

  /**
   * Get users and stakeholders available for mentions
   * @returns {Promise<Array>} List of mention users
   */
  async getMentionUsers() {
    return await api.get(API_ENDPOINTS.NOTES.MENTIONS.USERS)
  }

  /**
   * Get mentions for a specific note
   * @param {string} noteId - Note ID
   * @returns {Promise<Array>} List of mentions for the note
   */
  async getNoteMentions(noteId) {
    return await api.get(API_ENDPOINTS.NOTES.MENTIONS.BY_NOTE(noteId))
  }

  /**
   * Get mention statistics for current user
   * @returns {Promise<Object>} Mention statistics
   */
  async getMentionStatistics() {
    return await api.get(API_ENDPOINTS.NOTES.MENTIONS.STATISTICS)
  }

  /**
   * Mark mentions as read
   * @param {Array} mentionIds - Array of mention IDs to mark as read
   * @returns {Promise<void>}
   */
  async markMentionsAsRead(mentionIds) {
    return await api.post(API_ENDPOINTS.NOTES.MENTIONS.MARK_READ, mentionIds)
  }

  /**
   * Get unread mentions for current user
   * @param {Object} params - Pagination parameters
   * @returns {Promise<Object>} Paginated unread mentions
   */
  async getUnreadMentions(params = {}) {
    const queryParams = {
      page: params.page || PAGINATION.DEFAULT_PAGE,
      size: params.size || PAGINATION.DEFAULT_SIZE,
      sort: `${params.sort || PAGINATION.DEFAULT_SORT},${params.direction || PAGINATION.DEFAULT_DIRECTION}`
    }

    return await api.get(API_ENDPOINTS.NOTES.MENTIONS.UNREAD, { params: queryParams })
  }

  // ENHANCED UTILITY METHODS
  // ========================

  /**
   * Format note for display
   * @param {Object} note - Note object
   * @returns {Object} Formatted note
   */
  formatNoteDisplay(note) {
    return {
      ...note,
      typeIcon: this.getNoteTypeIcon(note.noteType),
      typeColor: this.getNoteTypeColor(note.noteType),
      formattedDate: this.formatNoteDate(note.insertDate),
      excerpt: this.createNoteExcerpt(note.noteContent),
      authorName: note.insertUserName || 'Unknown',
      hasAttachments: note.attachmentCount > 0,
      mentionCount: note.mentions ? note.mentions.length : 0,
      hasUserMentions: note.mentions ? note.mentions.some(m => m.userRole === 'User') : false,
      hasStakeholderMentions: note.mentions ? note.mentions.some(m => m.userRole === 'Stakeholder') : false
    }
  }

  /**
   * Get note type icon
   * @param {string} noteType - Note type
   * @returns {string} Icon name
   */
  getNoteTypeIcon(noteType) {
    const iconMap = {
      'General': 'description',
      'Issue': 'error_outline',
      'Progress': 'trending_up',
      'Quality': 'verified'
    }

    return iconMap[noteType] || 'note'
  }

  /**
   * Get note type color
   * @param {string} noteType - Note type
   * @returns {string} Color name
   */
  getNoteTypeColor(noteType) {
    const colorMap = {
      'General': 'primary',
      'Issue': 'negative',
      'Progress': 'positive',
      'Quality': 'warning'
    }

    return colorMap[noteType] || 'grey'
  }

  /**
   * Format note date
   * @param {string} dateString - Date string
   * @returns {string} Formatted date
   */
  formatNoteDate(dateString) {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date

    // Today
    if (diff < 86400000 && date.getDate() === now.getDate()) {
      return `Today at ${date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })}`
    }

    // Yesterday
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    if (date.getDate() === yesterday.getDate()) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })}`
    }

    // Within a week
    if (diff < 604800000) {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    }

    // Default
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  /**
   * Create note excerpt
   * @param {string} content - Note content
   * @param {number} maxLength - Maximum excerpt length
   * @returns {string} Excerpt
   */
  createNoteExcerpt(content, maxLength = 200) {
    if (!content) return ''

    // Strip HTML tags and mention chips
    let plainText = content
      .replace(/<span[^>]*class="mention-chip"[^>]*>.*?<\/span>/g, '') // Remove mention chips
      .replace(/<[^>]*>/g, '') // Remove other HTML tags

    if (plainText.length <= maxLength) {
      return plainText
    }

    // Find last space before maxLength
    const lastSpace = plainText.lastIndexOf(' ', maxLength)
    const cutoff = lastSpace > 0 ? lastSpace : maxLength

    return plainText.substring(0, cutoff) + '...'
  }

  /**
   * Extract mentions from note content
   * @param {string} content - HTML content with mention chips
   * @returns {Array} Array of mention objects
   */
  extractMentionsFromContent(content) {
    if (!content) return []

    const mentions = []
    const mentionChipRegex = /<span[^>]*class="mention-chip"[^>]*data-rec-code="([^"]*)"[^>]*data-user-role="([^"]*)"[^>]*>.*?@([^<]+).*?<\/span>/g
    let match

    while ((match = mentionChipRegex.exec(content)) !== null) {
      mentions.push({
        recCode: match[1],
        userRole: match[2],
        name: match[3],
        mentionPosition: content.indexOf(match[0])
      })
    }

    return mentions
  }

  /**
   * Validate note data before sending to backend
   * @param {Object} noteData - Note data to validate
   * @returns {Object} Validation result
   */
  validateNoteData(noteData) {
    const errors = []
    const warnings = []

    // Required fields
    if (!noteData.noteContent || !noteData.noteContent.trim()) {
      errors.push('Note content is required')
    }

    // Content length validation
    if (noteData.noteContent && noteData.noteContent.length > 5000) {
      errors.push('Note content exceeds maximum length of 5000 characters')
    }

    // Subject length validation
    if (noteData.subject && noteData.subject.length > 200) {
      errors.push('Subject exceeds maximum length of 200 characters')
    }

    // Mentions validation
    if (noteData.mentions && noteData.mentions.length > 50) {
      warnings.push('Note has more than 50 mentions, which may impact performance')
    }

    // Check for mentions in content that don't have corresponding mention objects
    const contentMentions = this.extractMentionsFromContent(noteData.noteContent)
    const providedMentions = noteData.mentions || []

    if (contentMentions.length !== providedMentions.length) {
      warnings.push('Mismatch between mentions in content and mention data')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Process note data for backend compatibility
   * @param {Object} frontendNoteData - Note data from frontend
   * @returns {Object} Backend-compatible note data
   */
  processNoteForBackend(frontendNoteData) {
    // Ensure mentions have proper structure
    const processedMentions = (frontendNoteData.mentions || []).map(mention => ({
      id: mention.id,
      recCode: mention.recCode,
      name: mention.name,
      userRole: mention.userRole,
      mentionPosition: mention.mentionPosition || 0
    }))

    return {
      subject: frontendNoteData.subject || '',
      noteContent: frontendNoteData.noteContent || '',
      noteType: frontendNoteData.noteType || 'General',
      isImportant: frontendNoteData.isImportant || false,
      isPrivate: frontendNoteData.isPrivate || false,
      mentions: processedMentions,
      parentNoteId: frontendNoteData.parentNoteId || null,
      nodeId: frontendNoteData.nodeId
    }
  }

  /**
   * Group notes by date
   * @param {Array} notes - Notes array
   * @returns {Object} Grouped notes
   */
  groupNotesByDate(notes) {
    const groups = {}
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const thisWeek = new Date(today)
    thisWeek.setDate(thisWeek.getDate() - 7)

    notes.forEach(note => {
      const noteDate = new Date(note.insertDate)
      noteDate.setHours(0, 0, 0, 0)

      let groupKey

      if (noteDate.getTime() === today.getTime()) {
        groupKey = 'Today'
      } else if (noteDate.getTime() === yesterday.getTime()) {
        groupKey = 'Yesterday'
      } else if (noteDate >= thisWeek) {
        groupKey = 'This Week'
      } else {
        groupKey = noteDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long'
        })
      }

      if (!groups[groupKey]) {
        groups[groupKey] = []
      }

      groups[groupKey].push(this.formatNoteDisplay(note))
    })

    return groups
  }

  /**
   * Filter notes by type
   * @param {Array} notes - Notes array
   * @param {string} type - Note type
   * @returns {Array} Filtered notes
   */
  filterNotesByType(notes, type) {
    if (!type || type === 'All') return notes
    return notes.filter(note => note.noteType === type)
  }

  /**
   * Filter notes by mention presence
   * @param {Array} notes - Notes array
   * @param {string} mentionFilter - 'all', 'with-mentions', 'without-mentions'
   * @returns {Array} Filtered notes
   */
  filterNotesByMentions(notes, mentionFilter = 'all') {
    if (mentionFilter === 'all') return notes
    if (mentionFilter === 'with-mentions') {
      return notes.filter(note => note.mentions && note.mentions.length > 0)
    }
    if (mentionFilter === 'without-mentions') {
      return notes.filter(note => !note.mentions || note.mentions.length === 0)
    }
    return notes
  }

  /**
   * Sort notes
   * @param {Array} notes - Notes array
   * @param {string} sortBy - Sort field
   * @param {string} direction - Sort direction
   * @returns {Array} Sorted notes
   */
  sortNotes(notes, sortBy = 'insertDate', direction = 'DESC') {
    const sorted = [...notes]

    sorted.sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]

      // Handle date fields
      if (sortBy.includes('Date')) {
        aValue = new Date(aValue)
        bValue = new Date(bValue)
      }

      // Handle numeric fields
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return direction === 'ASC' ? aValue - bValue : bValue - aValue
      }

      // Handle string fields
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue)
        return direction === 'ASC' ? comparison : -comparison
      }

      return 0
    })

    return sorted
  }

  /**
   * Get mention statistics for a set of notes
   * @param {Array} notes - Notes array
   * @returns {Object} Mention statistics
   */
  getMentionStatisticsForNotes(notes) {
    let totalMentions = 0
    let userMentions = 0
    let stakeholderMentions = 0
    const mentionedUsers = new Set()
    const mentionedStakeholders = new Set()

    notes.forEach(note => {
      if (note.mentions && note.mentions.length > 0) {
        totalMentions += note.mentions.length

        note.mentions.forEach(mention => {
          if (mention.userRole === 'User') {
            userMentions++
            mentionedUsers.add(mention.recCode)
          } else if (mention.userRole === 'Stakeholder') {
            stakeholderMentions++
            mentionedStakeholders.add(mention.recCode)
          }
        })
      }
    })

    return {
      totalMentions,
      userMentions,
      stakeholderMentions,
      uniqueUsersMentioned: mentionedUsers.size,
      uniqueStakeholdersMentioned: mentionedStakeholders.size,
      notesWithMentions: notes.filter(n => n.mentions && n.mentions.length > 0).length,
      averageMentionsPerNote: notes.length > 0 ? (totalMentions / notes.length).toFixed(2) : 0
    }
  }
}

export default new NoteService()
