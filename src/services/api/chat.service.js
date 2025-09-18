// src/services/api/chat.service.js
import { api } from 'boot/axios'
import { API_ENDPOINTS, PAGINATION } from 'src/constants/api.constants'

class ChatService {
  /**
   * Create chat
   * @param {Object} chatData - Chat data
   * @returns {Promise<Object>} Created chat
   */
  async createChat(chatData) {
    return await api.post(API_ENDPOINTS.CHATS.BASE, chatData)
  }

  /**
   * Get chat by ID
   * @param {string} chatId - Chat ID
   * @returns {Promise<Object>} Chat data
   */
  async getChatById(chatId) {
    return await api.get(API_ENDPOINTS.CHATS.BY_ID(chatId))
  }

  /**
   * Update chat
   * @param {string} chatId - Chat ID
   * @param {Object} chatData - Updated chat data
   * @returns {Promise<Object>} Updated chat
   */
  async updateChat(chatId, chatData) {
    return await api.put(API_ENDPOINTS.CHATS.BY_ID(chatId), chatData)
  }

  /**
   * Delete chat
   * @param {string} chatId - Chat ID
   * @returns {Promise<void>}
   */
  async deleteChat(chatId) {
    return await api.delete(API_ENDPOINTS.CHATS.BY_ID(chatId))
  }

  /**
   * Get node chats
   * @param {string} nodeId - Node ID
   * @returns {Promise<Array>} Node chats
   */
  async getNodeChats(nodeId) {
    return await api.get(API_ENDPOINTS.CHATS.NODE_CHATS(nodeId))
  }

  /**
   * Get project chats
   * @param {string} projectId - Project ID
   * @returns {Promise<Array>} Project chats
   */
  async getProjectChats(projectId) {
    return await api.get(API_ENDPOINTS.CHATS.PROJECT_CHATS(projectId))
  }

  /**
   * Get chats by type
   * @param {string} chatType - Chat type
   * @param {Object} params - Pagination parameters
   * @returns {Promise<Object>} Paginated chats
   */
  async getChatsByType(chatType, params = {}) {
    const queryParams = {
      page: params.page || PAGINATION.DEFAULT_PAGE,
      size: params.size || PAGINATION.DEFAULT_SIZE,
      sort: `${params.sort || PAGINATION.DEFAULT_SORT},${params.direction || PAGINATION.DEFAULT_DIRECTION}`
    }

    return await api.get(API_ENDPOINTS.CHATS.BY_TYPE(chatType), { params: queryParams })
  }

  /**
   * Get user chats
   * @param {string} userId - User ID
   * @param {Object} params - Pagination parameters
   * @returns {Promise<Object>} Paginated chats
   */
  async getUserChats(userId, params = {}) {
    const queryParams = {
      page: params.page || PAGINATION.DEFAULT_PAGE,
      size: params.size || PAGINATION.DEFAULT_SIZE,
      sort: `${params.sort || PAGINATION.DEFAULT_SORT},${params.direction || PAGINATION.DEFAULT_DIRECTION}`
    }

    return await api.get(API_ENDPOINTS.CHATS.USER_CHATS(userId), { params: queryParams })
  }

  /**
   * Search chats
   * @param {string} searchTerm - Search term
   * @param {Object} params - Pagination parameters
   * @returns {Promise<Object>} Search results
   */
  async searchChats(searchTerm, params = {}) {
    const queryParams = {
      searchTerm,
      page: params.page || PAGINATION.DEFAULT_PAGE,
      size: params.size || PAGINATION.DEFAULT_SIZE,
      sort: `${params.sort || PAGINATION.DEFAULT_SORT},${params.direction || PAGINATION.DEFAULT_DIRECTION}`
    }

    return await api.get(API_ENDPOINTS.CHATS.SEARCH, { params: queryParams })
  }

  /**
   * Get chats with recent activity
   * @param {number} limit - Number of chats to return
   * @returns {Promise<Array>} Recent chats
   */
  async getChatsWithRecentActivity(limit = 10) {
    return await api.get(API_ENDPOINTS.CHATS.RECENT_ACTIVITY, {
      params: { limit }
    })
  }

  /**
   * Send message
   * @param {string} chatId - Chat ID
   * @param {Object} messageData - Message data
   * @returns {Promise<Object>} Sent message
   */
  async sendMessage(chatId, messageData) {
    return await api.post(API_ENDPOINTS.CHATS.MESSAGES(chatId), messageData)
  }

  /**
   * Update message
   * @param {string} messageId - Message ID
   * @param {string} newContent - New message content
   * @returns {Promise<Object>} Updated message
   */
  async updateMessage(messageId, newContent) {
    return await api.put(API_ENDPOINTS.CHATS.MESSAGE_BY_ID(messageId), null, {
      params: { newContent }
    })
  }

  /**
   * Delete message
   * @param {string} messageId - Message ID
   * @returns {Promise<void>}
   */
  async deleteMessage(messageId) {
    return await api.delete(API_ENDPOINTS.CHATS.MESSAGE_BY_ID(messageId))
  }

  /**
   * Mark message as deleted
   * @param {string} messageId - Message ID
   * @returns {Promise<void>}
   */
  async markMessageAsDeleted(messageId) {
    return await api.post(API_ENDPOINTS.CHATS.MARK_DELETED(messageId))
  }

  /**
   * Get message by ID
   * @param {string} messageId - Message ID
   * @returns {Promise<Object>} Message data
   */
  async getMessageById(messageId) {
    return await api.get(API_ENDPOINTS.CHATS.MESSAGE_BY_ID(messageId))
  }

  /**
   * Get chat messages
   * @param {string} chatId - Chat ID
   * @param {Object} params - Pagination parameters
   * @returns {Promise<Object>} Paginated messages
   */
  async getChatMessages(chatId, params = {}) {
    const queryParams = {
      page: params.page || PAGINATION.DEFAULT_PAGE,
      size: params.size || 50, // Higher default for chat
      sort: `${params.sort || PAGINATION.DEFAULT_SORT},${params.direction || PAGINATION.DEFAULT_DIRECTION}`
    }

    return await api.get(API_ENDPOINTS.CHATS.MESSAGES(chatId), { params: queryParams })
  }

  /**
   * Get undeleted messages
   * @param {string} chatId - Chat ID
   * @param {Object} params - Pagination parameters
   * @returns {Promise<Object>} Paginated messages
   */
  async getUndeletedMessages(chatId, params = {}) {
    const queryParams = {
      page: params.page || PAGINATION.DEFAULT_PAGE,
      size: params.size || 50,
      sort: `${params.sort || PAGINATION.DEFAULT_SORT},${params.direction || PAGINATION.DEFAULT_DIRECTION}`
    }

    return await api.get(API_ENDPOINTS.CHATS.UNDELETED_MESSAGES(chatId), { params: queryParams })
  }

  /**
   * Get thread replies
   * @param {string} parentMessageId - Parent message ID
   * @returns {Promise<Array>} Thread replies
   */
  async getThreadReplies(parentMessageId) {
    return await api.get(API_ENDPOINTS.CHATS.THREAD_REPLIES(parentMessageId))
  }

  /**
   * Add reply to message
   * @param {string} parentMessageId - Parent message ID
   * @param {Object} replyData - Reply message data
   * @returns {Promise<void>}
   */
  async addReplyToMessage(parentMessageId, replyData) {
    return await api.post(API_ENDPOINTS.CHATS.ADD_REPLY(parentMessageId), replyData)
  }

  /**
   * Search messages in chat
   * @param {string} chatId - Chat ID
   * @param {string} searchTerm - Search term
   * @param {Object} params - Pagination parameters
   * @returns {Promise<Object>} Search results
   */
  async searchMessages(chatId, searchTerm, params = {}) {
    const queryParams = {
      searchTerm,
      page: params.page || PAGINATION.DEFAULT_PAGE,
      size: params.size || PAGINATION.DEFAULT_SIZE,
      sort: `${params.sort || PAGINATION.DEFAULT_SORT},${params.direction || PAGINATION.DEFAULT_DIRECTION}`
    }

    return await api.get(API_ENDPOINTS.CHATS.SEARCH_MESSAGES(chatId), { params: queryParams })
  }

  /**
   * Get messages with attachments
   * @param {string} chatId - Chat ID
   * @param {Object} params - Pagination parameters
   * @returns {Promise<Object>} Messages with attachments
   */
  async getMessagesWithAttachments(chatId, params = {}) {
    const queryParams = {
      page: params.page || PAGINATION.DEFAULT_PAGE,
      size: params.size || PAGINATION.DEFAULT_SIZE,
      sort: `${params.sort || PAGINATION.DEFAULT_SORT},${params.direction || PAGINATION.DEFAULT_DIRECTION}`
    }

    return await api.get(API_ENDPOINTS.CHATS.MESSAGES_WITH_ATTACHMENTS(chatId), { params: queryParams })
  }

  /**
   * Get chat participants
   * @param {string} chatId - Chat ID
   * @returns {Promise<Array>} Participants list
   */
  async getChatParticipants(chatId) {
    return await api.get(API_ENDPOINTS.CHATS.PARTICIPANTS(chatId))
  }

  /**
   * Add participant to chat
   * @param {string} chatId - Chat ID
   * @param {string} userId - User ID to add
   * @returns {Promise<void>}
   */
  async addParticipantToChat(chatId, userId) {
    return await api.post(API_ENDPOINTS.CHATS.PARTICIPANTS(chatId), null, {
      params: { userId }
    })
  }

  /**
   * Remove participant from chat
   * @param {string} chatId - Chat ID
   * @param {string} userId - User ID to remove
   * @returns {Promise<void>}
   */
  async removeParticipantFromChat(chatId, userId) {
    return await api.delete(API_ENDPOINTS.CHATS.REMOVE_PARTICIPANT(chatId, userId))
  }

  /**
   * Get chat statistics
   * @param {string} chatId - Chat ID
   * @returns {Promise<Object>} Chat statistics
   */
  async getChatStatistics(chatId) {
    return await api.get(API_ENDPOINTS.CHATS.STATISTICS(chatId))
  }

  /**
   * Get message count
   * @param {string} chatId - Chat ID
   * @returns {Promise<number>} Message count
   */
  async getMessageCount(chatId) {
    return await api.get(API_ENDPOINTS.CHATS.MESSAGE_COUNT(chatId))
  }

  /**
   * Get latest message
   * @param {string} chatId - Chat ID
   * @returns {Promise<Object>} Latest message
   */
  async getLatestMessage(chatId) {
    return await api.get(API_ENDPOINTS.CHATS.LATEST_MESSAGE(chatId))
  }

  /**
   * Get message count by type
   * @param {string} chatId - Chat ID
   * @returns {Promise<Object>} Count by type
   */
  async getMessageCountByType(chatId) {
    return await api.get(API_ENDPOINTS.CHATS.MESSAGE_COUNT_BY_TYPE(chatId))
  }

  /**
   * Mark chat as read
   * @param {string} chatId - Chat ID
   * @returns {Promise<void>}
   */
  async markChatAsRead(chatId) {
    return await api.post(API_ENDPOINTS.CHATS.MARK_READ(chatId))
  }

  /**
   * Get unread message count
   * @param {string} chatId - Chat ID
   * @returns {Promise<number>} Unread count
   */
  async getUnreadMessageCount(chatId) {
    return await api.get(API_ENDPOINTS.CHATS.UNREAD_COUNT(chatId))
  }

  /**
   * Get unread chats
   * @returns {Promise<Array>} Unread chats
   */
  async getUnreadChats() {
    return await api.get(API_ENDPOINTS.CHATS.UNREAD_CHATS)
  }

  /**
   * Get user chat summary
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Chat summary
   */
  async getUserChatSummary(userId) {
    return await api.get(API_ENDPOINTS.CHATS.USER_SUMMARY(userId))
  }

  /**
   * Get active chats for project
   * @param {string} projectId - Project ID
   * @returns {Promise<Array>} Active chats
   */
  async getActiveChatsForProject(projectId) {
    return await api.get(API_ENDPOINTS.CHATS.PROJECT_ACTIVE_CHATS(projectId))
  }

  /**
   * Get chat activity report
   * @param {string} projectId - Project ID
   * @param {number} days - Number of days
   * @returns {Promise<Object>} Activity report
   */
  async getChatActivityReport(projectId, days = 30) {
    return await api.get(API_ENDPOINTS.CHATS.ACTIVITY_REPORT(projectId), {
      params: { days }
    })
  }

  /**
   * Format message time
   * @param {string} timestamp - Message timestamp
   * @returns {string} Formatted time
   */
  formatMessageTime(timestamp) {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date

    // Less than 1 minute
    if (diff < 60000) {
      return 'Just now'
    }

    // Less than 1 hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000)
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
    }

    // Less than 24 hours
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000)
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
    }

    // Less than 7 days
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000)
      return `${days} ${days === 1 ? 'day' : 'days'} ago`
    }

    // Default to date
    return date.toLocaleDateString()
  }

  /**
   * Get message type icon
   * @param {string} messageType - Message type
   * @returns {string} Icon name
   */
  getMessageTypeIcon(messageType) {
    const iconMap = {
      'Text': 'message',
      'Image': 'image',
      'File': 'attach_file',
      'System': 'info'
    }

    return iconMap[messageType] || 'message'
  }

  /**
   * Check if message is editable
   * @param {Object} message - Message object
   * @param {string} currentUserId - Current user ID
   * @returns {boolean} Can edit
   */
  canEditMessage(message, currentUserId) {
    if (!message || message.isDeleted) return false
    if (message.insertUser !== currentUserId) return false

    // Can only edit within 15 minutes
    const messageTime = new Date(message.insertDate)
    const now = new Date()
    const diff = now - messageTime

    return diff < 900000 // 15 minutes
  }
}

export default new ChatService()
