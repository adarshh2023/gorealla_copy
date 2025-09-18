// src/stores/chat.js
import { defineStore } from 'pinia'
import chatService from 'src/services/api/chat.service'
import { showSuccess, showError, showInfo } from 'src/utils/notification'
import { useAuthStore } from './auth'

export const useChatStore = defineStore('chat', {
  state: () => ({
    // Chats list
    chats: [],
    totalChats: 0,

    // Active chat
    activeChat: null,
    activeChatId: null,

    // Messages
    messages: new Map(), // chatId -> messages array
    messagesLoading: new Map(), // chatId -> loading state
    hasMoreMessages: new Map(), // chatId -> boolean

    // Node/Project chats
    nodeChats: new Map(), // nodeId -> chats array
    projectChats: new Map(), // projectId -> chats array

    // Loading states
    isLoading: false,
    isSendingMessage: false,

    // Unread counts
    unreadCounts: new Map(), // chatId -> count
    totalUnread: 0,

    // Typing indicators
    typingUsers: new Map(), // chatId -> Set of userIds

    // Online users
    onlineUsers: new Set(),

    // Search
    searchQuery: '',
    searchResults: [],
    isSearching: false,

    // Draft messages
    drafts: new Map(), // chatId -> draft message

    // File uploads
    uploadingFiles: new Map(), // messageId -> upload progress

    // Emoji reactions
    recentEmojis: ['👍', '❤️', '😄', '🎉', '👏'],

    // Chat settings
    settings: {
      soundEnabled: true,
      desktopNotifications: true,
      enterToSend: true,
      showTimestamps: true,
      messageGrouping: true
    },

    // Pagination
    messagePageSize: 50,

    // Real-time connection
    isConnected: false,
    reconnectAttempts: 0
  }),

  getters: {
    /**
     * Get sorted chats by last activity
     */
    sortedChats: (state) => {
      return [...state.chats].sort((a, b) => {
        const aTime = a.lastMessageTime ? new Date(a.lastMessageTime) : new Date(a.insertDate)
        const bTime = b.lastMessageTime ? new Date(b.lastMessageTime) : new Date(b.insertDate)
        return bTime - aTime
      })
    },

    /**
     * Get filtered chats
     */
    filteredChats: (state) => {
      if (!state.searchQuery) {
        return state.sortedChats
      }

      const query = state.searchQuery.toLowerCase()
      return state.sortedChats.filter(chat =>
        chat.chatName?.toLowerCase().includes(query) ||
        chat.lastMessage?.toLowerCase().includes(query)
      )
    },

    /**
     * Get unread chats
     */
    unreadChats: (state) => {
      return state.chats.filter(chat => {
        const unread = state.unreadCounts.get(chat.recCode) || 0
        return unread > 0
      })
    },

    /**
     * Get chat messages
     */
    getChatMessages: (state) => (chatId) => {
      return state.messages.get(chatId) || []
    },

    /**
     * Get chat unread count
     */
    getChatUnreadCount: (state) => (chatId) => {
      return state.unreadCounts.get(chatId) || 0
    },

    /**
     * Check if user is typing
     */
    isUserTyping: (state) => (chatId, userId) => {
      const typingSet = state.typingUsers.get(chatId)
      return typingSet ? typingSet.has(userId) : false
    },

    /**
     * Get typing users for chat
     */
    getTypingUsers: (state) => (chatId) => {
      const typingSet = state.typingUsers.get(chatId)
      return typingSet ? Array.from(typingSet) : []
    },

    /**
     * Check if user is online
     */
    isUserOnline: (state) => (userId) => {
      return state.onlineUsers.has(userId)
    },

    /**
     * Get chat draft
     */
    getChatDraft: (state) => (chatId) => {
      return state.drafts.get(chatId) || ''
    },

    /**
     * Get grouped messages by date
     */
    getGroupedMessages: (state) => (chatId) => {
      const messages = state.getChatMessages(chatId)
      const groups = []
      let currentGroup = null
      let lastDate = null

      messages.forEach(message => {
        const messageDate = new Date(message.insertDate).toDateString()

        if (messageDate !== lastDate) {
          currentGroup = {
            date: messageDate,
            messages: []
          }
          groups.push(currentGroup)
          lastDate = messageDate
        }

        currentGroup.messages.push(message)
      })

      return groups
    }
  },

  actions: {
    /**
     * Initialize chat store
     */
    async initialize() {
      // Load settings from storage
      this.loadSettings()

      // Load drafts
      this.loadDrafts()

      // Setup WebSocket listeners
      this.setupWebSocketListeners()

      // Fetch initial data
      if (useAuthStore().isAuthenticated) {
        await this.fetchUserChats()
        await this.fetchUnreadCounts()
      }
    },

    /**
     * Fetch user chats
     */
    async fetchUserChats() {
      this.isLoading = true

      try {
        const authStore = useAuthStore()
        const response = await chatService.getUserChats(authStore.user.recCode)

        if (response.success) {
          this.chats = response.data.content
          this.totalChats = response.data.totalElements
        }

        return response
      } catch (error) {
        showError('Failed to fetch chats')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Fetch node chats
     */
    async fetchNodeChats(nodeId) {
      try {
        const response = await chatService.getNodeChats(nodeId)

        if (response.success) {
          this.nodeChats.set(nodeId, response.data)

          // Merge with main chats list
          this.mergeChatsToList(response.data)
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch node chats')
        throw error
      }
    },

    /**
     * Fetch project chats
     */
    async fetchProjectChats(projectId) {
      try {
        const response = await chatService.getProjectChats(projectId)

        if (response.success) {
          this.projectChats.set(projectId, response.data)

          // Merge with main chats list
          this.mergeChatsToList(response.data)
        }

        return response.data
      } catch (error) {
        showError('Failed to fetch project chats')
        throw error
      }
    },

    /**
     * Create chat
     */
    async createChat(chatData) {
      this.isLoading = true

      try {
        const response = await chatService.createChat(chatData)

        if (response.success) {
          this.chats.unshift(response.data)
          this.totalChats++

          // Add to node/project chats if applicable
          if (chatData.nodeId) {
            const nodeChats = this.nodeChats.get(chatData.nodeId) || []
            nodeChats.unshift(response.data)
            this.nodeChats.set(chatData.nodeId, nodeChats)
          }

          if (chatData.projectId) {
            const projectChats = this.projectChats.get(chatData.projectId) || []
            projectChats.unshift(response.data)
            this.projectChats.set(chatData.projectId, projectChats)
          }

          showSuccess('Chat created successfully')

          // Open the new chat
          await this.openChat(response.data.recCode)
        }

        return response
      } catch (error) {
        showError('Failed to create chat')
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Open chat
     */
    async openChat(chatId) {
      // Check if already active
      if (this.activeChatId === chatId) {
        return this.activeChat
      }

      // Save draft for previous chat
      if (this.activeChatId) {
        this.saveDraft(this.activeChatId)
      }

      try {
        // Fetch chat details
        const response = await chatService.getChatById(chatId)

        if (response.success) {
          this.activeChat = response.data
          this.activeChatId = chatId

          // Set global active chat ID for notifications
          window.$activeChatId = chatId

          // Fetch messages if not cached
          if (!this.messages.has(chatId)) {
            await this.fetchMessages(chatId)
          }

          // Mark as read
          await this.markChatAsRead(chatId)

          // Join chat room (WebSocket)
          this.joinChatRoom(chatId)
        }

        return response.data
      } catch (error) {
        showError('Failed to open chat')
        throw error
      }
    },

    /**
     * Close active chat
     */
    closeChat() {
      if (this.activeChatId) {
        // Save draft
        this.saveDraft(this.activeChatId)

        // Leave chat room (WebSocket)
        this.leaveChatRoom(this.activeChatId)

        // Clear active chat
        this.activeChat = null
        this.activeChatId = null
        window.$activeChatId = null
      }
    },

    /**
     * Fetch messages for chat
     */
    async fetchMessages(chatId, options = {}) {
      const {
        page = 0,
        size = this.messagePageSize,
        append = false
      } = options

      this.messagesLoading.set(chatId, true)

      try {
        const response = await chatService.getChatMessages(chatId, { page, size })

        if (response.success) {
          const messages = response.data.content.reverse() // Reverse for chronological order

          if (append) {
            // Prepend older messages
            const existing = this.messages.get(chatId) || []
            this.messages.set(chatId, [...messages, ...existing])
          } else {
            // Replace messages
            this.messages.set(chatId, messages)
          }

          // Update has more flag
          this.hasMoreMessages.set(chatId, !response.data.last)
        }

        return response
      } catch (error) {
        showError('Failed to fetch messages')
        throw error
      } finally {
        this.messagesLoading.set(chatId, false)
      }
    },

    /**
     * Load more messages
     */
    async loadMoreMessages(chatId) {
      const messages = this.messages.get(chatId) || []
      const page = Math.floor(messages.length / this.messagePageSize)

      return await this.fetchMessages(chatId, {
        page,
        append: true
      })
    },

    /**
     * Send message
     */
    async sendMessage(chatId, messageData) {
      this.isSendingMessage = true

      // Create optimistic message
      const tempId = `temp_${Date.now()}`
      const optimisticMessage = {
        recCode: tempId,
        chatId,
        content: messageData.content,
        messageType: messageData.messageType || 'Text',
        insertUser: useAuthStore().user.recCode,
        insertUserName: useAuthStore().user.fullName,
        insertDate: new Date().toISOString(),
        isDeleted: false,
        isSending: true
      }

      // Add to messages
      const messages = this.messages.get(chatId) || []
      messages.push(optimisticMessage)
      this.messages.set(chatId, [...messages])

      try {
        const response = await chatService.sendMessage(chatId, messageData)

        if (response.success) {
          // Replace optimistic message with real one
          const messageIndex = messages.findIndex(m => m.recCode === tempId)
          if (messageIndex !== -1) {
            messages[messageIndex] = response.data
            this.messages.set(chatId, [...messages])
          }

          // Update chat's last message
          const chat = this.chats.find(c => c.recCode === chatId)
          if (chat) {
            chat.lastMessage = messageData.content
            chat.lastMessageTime = response.data.insertDate
            chat.lastMessageBy = response.data.insertUserName
          }

          // Clear draft
          this.clearDraft(chatId)

          // Play sound if enabled
          if (this.settings.soundEnabled) {
            this.playMessageSound()
          }
        }

        return response
      } catch (error) {
        // Remove optimistic message on error
        const messageIndex = messages.findIndex(m => m.recCode === tempId)
        if (messageIndex !== -1) {
          messages.splice(messageIndex, 1)
          this.messages.set(chatId, [...messages])
        }

        showError('Failed to send message')
        throw error
      } finally {
        this.isSendingMessage = false
      }
    },

    /**
     * Update message
     */
    async updateMessage(messageId, newContent) {
      try {
        const response = await chatService.updateMessage(messageId, newContent)

        if (response.success) {
          // Update in local state
          this.messages.forEach((messages, chatId) => {
            const messageIndex = messages.findIndex(m => m.recCode === messageId)
            if (messageIndex !== -1) {
              messages[messageIndex] = {
                ...messages[messageIndex],
                content: newContent,
                isEdited: true,
                editDate: new Date().toISOString()
              }
              this.messages.set(chatId, [...messages])
            }
          })

          showSuccess('Message updated')
        }

        return response
      } catch (error) {
        showError('Failed to update message')
        throw error
      }
    },

    /**
     * Delete message
     */
    async deleteMessage(messageId) {
      try {
        await chatService.markMessageAsDeleted(messageId)

        // Update in local state
        this.messages.forEach((messages, chatId) => {
          const messageIndex = messages.findIndex(m => m.recCode === messageId)
          if (messageIndex !== -1) {
            messages[messageIndex].isDeleted = true
            messages[messageIndex].content = 'This message has been deleted'
            this.messages.set(chatId, [...messages])
          }
        })

        showSuccess('Message deleted')
        return true
      } catch (error) {
        showError('Failed to delete message')
        throw error
      }
    },

    /**
     * Search messages
     */
    async searchMessages(query) {
      if (!query) {
        this.searchResults = []
        return
      }

      this.isSearching = true

      try {
        const promises = this.chats.map(chat =>
          chatService.searchMessages(chat.recCode, query)
        )

        const results = await Promise.allSettled(promises)

        const allMessages = []
        results.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value.success) {
            const chat = this.chats[index]
            result.value.data.content.forEach(message => {
              allMessages.push({
                ...message,
                chatName: chat.chatName,
                chatId: chat.recCode
              })
            })
          }
        })

        this.searchResults = allMessages.sort((a, b) =>
          new Date(b.insertDate) - new Date(a.insertDate)
        )
      } catch (error) {
        showError('Search failed')
        throw error
      } finally {
        this.isSearching = false
      }
    },

    /**
     * Mark chat as read
     */
    async markChatAsRead(chatId) {
      try {
        await chatService.markChatAsRead(chatId)

        // Update unread count
        const previousCount = this.unreadCounts.get(chatId) || 0
        this.unreadCounts.set(chatId, 0)
        this.totalUnread = Math.max(0, this.totalUnread - previousCount)

        // Update notification badge
        window.dispatchEvent(new CustomEvent('notification:badge', {
          detail: { count: this.totalUnread }
        }))
      } catch (error) {
        console.error('Failed to mark chat as read:', error)
      }
    },

    /**
     * Fetch unread counts
     */
    async fetchUnreadCounts() {
      try {
        const response = await chatService.getUnreadChats()

        if (response.success) {
          this.totalUnread = 0
          response.data.forEach(chat => {
            this.unreadCounts.set(chat.recCode, chat.unreadCount)
            this.totalUnread += chat.unreadCount
          })
        }
      } catch (error) {
        console.error('Failed to fetch unread counts:', error)
      }
    },

    /**
     * Handle incoming message (WebSocket)
     */
    handleIncomingMessage(message) {
      const { chatId } = message

      // Add to messages if chat is loaded
      if (this.messages.has(chatId)) {
        const messages = this.messages.get(chatId)
        messages.push(message)
        this.messages.set(chatId, [...messages])
      }

      // Update chat's last message
      const chat = this.chats.find(c => c.recCode === chatId)
      if (chat) {
        chat.lastMessage = message.content
        chat.lastMessageTime = message.insertDate
        chat.lastMessageBy = message.insertUserName
      }

      // Update unread count if not active chat
      if (chatId !== this.activeChatId) {
        const currentUnread = this.unreadCounts.get(chatId) || 0
        this.unreadCounts.set(chatId, currentUnread + 1)
        this.totalUnread++

        // Show notification
        if (this.settings.desktopNotifications) {
          showInfo(`New message from ${message.insertUserName}`)
        }

        // Play sound
        if (this.settings.soundEnabled) {
          this.playMessageSound()
        }
      }
    },

    /**
     * Handle typing indicator
     */
    handleTypingIndicator(data) {
      const { chatId, userId, isTyping } = data

      if (!this.typingUsers.has(chatId)) {
        this.typingUsers.set(chatId, new Set())
      }

      const typingSet = this.typingUsers.get(chatId)

      if (isTyping) {
        typingSet.add(userId)
      } else {
        typingSet.delete(userId)
      }
    },

    /**
     * Send typing indicator
     */
    sendTypingIndicator(chatId, isTyping) {
      window.dispatchEvent(new CustomEvent('websocket:send', {
        detail: {
          type: 'typing',
          payload: {
            chatId,
            userId: useAuthStore().user.recCode,
            isTyping
          }
        }
      }))
    },

    /**
     * Join chat room (WebSocket)
     */
    joinChatRoom(chatId) {
      window.dispatchEvent(new CustomEvent('websocket:send', {
        detail: {
          type: 'join_chat',
          payload: { chatId }
        }
      }))
    },

    /**
     * Leave chat room (WebSocket)
     */
    leaveChatRoom(chatId) {
      window.dispatchEvent(new CustomEvent('websocket:send', {
        detail: {
          type: 'leave_chat',
          payload: { chatId }
        }
      }))
    },

    /**
     * Save draft
     */
    saveDraft(chatId, content = '') {
      const textarea = document.querySelector(`#chat-${chatId}-input`)
      const draft = content || textarea?.value || ''

      if (draft) {
        this.drafts.set(chatId, draft)
        localStorage.setItem('chatDrafts', JSON.stringify(Array.from(this.drafts)))
      }
    },

    /**
     * Clear draft
     */
    clearDraft(chatId) {
      this.drafts.delete(chatId)
      localStorage.setItem('chatDrafts', JSON.stringify(Array.from(this.drafts)))
    },

    /**
     * Load drafts from storage
     */
    loadDrafts() {
      try {
        const stored = localStorage.getItem('chatDrafts')
        if (stored) {
          this.drafts = new Map(JSON.parse(stored))
        }
      } catch (error) {
        console.error('Error loading drafts:', error)
      }
    },

    /**
     * Load settings from storage
     */
    loadSettings() {
      try {
        const stored = localStorage.getItem('chatSettings')
        if (stored) {
          this.settings = { ...this.settings, ...JSON.parse(stored) }
        }
      } catch (error) {
        console.error('Error loading chat settings:', error)
      }
    },

    /**
     * Update settings
     */
    updateSettings(settings) {
      this.settings = { ...this.settings, ...settings }
      localStorage.setItem('chatSettings', JSON.stringify(this.settings))
    },

    /**
     * Play message sound
     */
    playMessageSound() {
      try {
        const audio = new Audio('/sounds/message.mp3')
        audio.volume = 0.5
        audio.play()
      } catch (error) {
        console.error('Error playing sound:', error)
      }
    },

    /**
     * Merge chats to main list
     */
    mergeChatsToList(chats) {
      chats.forEach(chat => {
        const exists = this.chats.some(c => c.recCode === chat.recCode)
        if (!exists) {
          this.chats.push(chat)
        }
      })
    },

    /**
     * Setup WebSocket listeners
     */
    setupWebSocketListeners() {
      // Listen for chat messages
      window.addEventListener('chat:message', (event) => {
        this.handleIncomingMessage(event.detail)
      })

      // Listen for typing indicators
      window.addEventListener('chat:typing', (event) => {
        this.handleTypingIndicator(event.detail)
      })

      // Listen for online status
      window.addEventListener('user:online', (event) => {
        const { userId, isOnline } = event.detail
        if (isOnline) {
          this.onlineUsers.add(userId)
        } else {
          this.onlineUsers.delete(userId)
        }
      })

      // Listen for connection status
      window.addEventListener('websocket:connected', () => {
        this.isConnected = true
        this.reconnectAttempts = 0
      })

      window.addEventListener('websocket:disconnected', () => {
        this.isConnected = false
      })
    },

    /**
     * Reset store
     */
    resetStore() {
      this.$reset()
      this.messages.clear()
      this.messagesLoading.clear()
      this.hasMoreMessages.clear()
      this.nodeChats.clear()
      this.projectChats.clear()
      this.unreadCounts.clear()
      this.typingUsers.clear()
      this.onlineUsers.clear()
      this.drafts.clear()
      this.uploadingFiles.clear()
    }
  }
})
