// src/stores/ui.js
import { defineStore } from 'pinia'
import { Dark, LocalStorage, Screen } from 'quasar'

export const useUIStore = defineStore('ui', {
  state: () => ({
    // Sidebar
    leftDrawerOpen: true,
    rightDrawerOpen: false,
    miniMode: false,

    // Theme
    darkMode: false,
    primaryColor: '#1976D2',
    accentColor: '#FF9800',

    // Layout
    layout: 'default', // default, compact, comfortable
    showHeader: true,
    showFooter: false,
    fixedHeader: true,
    fixedDrawer: true,

    // Navigation
    breadcrumbs: [],
    pageTitle: '',
    backButton: false,

    // Loading states
    pageLoading: false,
    globalLoading: false,
    loadingMessage: '',

    // Dialogs
    activeDialogs: new Set(),
    dialogStack: [],

    // Tooltips
    showTooltips: true,
    tooltipDelay: 500,

    // Tables
    defaultPageSize: 20,
    tableDense: false,

    // Forms
    formSize: 'md', // sm, md, lg
    formLabelPosition: 'top', // top, left, right

    // Notifications
    notificationPosition: 'top-right',
    notificationTimeout: 5000,

    // Search
    globalSearchOpen: false,
    searchHistory: [],

    // Preferences
    language: 'en-US',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h', // 12h, 24h
    firstDayOfWeek: 1, // 0 = Sunday, 1 = Monday

    // Accessibility
    highContrast: false,
    reducedMotion: false,
    fontSize: 'normal', // small, normal, large

    // Device info
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenWidth: 0,
    screenHeight: 0,

    // Tour/Onboarding
    tourCompleted: false,
    tourStep: 0,
    showHints: true,

    // Feature flags
    features: {
      darkMode: true,
      multiLanguage: false,
      advancedSearch: true,
      bulkActions: true,
      shortcuts: true,
      offlineMode: false
    },

    // Keyboard shortcuts
    shortcutsEnabled: true,
    activeShortcuts: new Map(),

    // Context menus
    contextMenus: new Map(),

    // Panels
    activePanels: new Set(),
    panelPositions: new Map(),

    // Focus management
    lastFocusedElement: null,
    focusTrap: null
  }),

  getters: {
    /**
     * Check if drawer should be in mini mode
     */
    shouldBeMini: (state) => {
      return state.miniMode || (state.isMobile && !state.leftDrawerOpen)
    },

    /**
     * Get current theme
     */
    currentTheme: (state) => ({
      dark: state.darkMode,
      primary: state.primaryColor,
      accent: state.accentColor
    }),

    /**
     * Get layout classes
     */
    layoutClasses: (state) => {
      const classes = [`layout-${state.layout}`]

      if (state.darkMode) classes.push('dark-mode')
      if (state.highContrast) classes.push('high-contrast')
      if (state.reducedMotion) classes.push('reduced-motion')
      if (state.fontSize !== 'normal') classes.push(`font-${state.fontSize}`)

      return classes.join(' ')
    },

    /**
     * Check if any dialog is open
     */
    hasActiveDialog: (state) => {
      return state.activeDialogs.size > 0
    },

    /**
     * Get top dialog
     */
    topDialog: (state) => {
      return state.dialogStack[state.dialogStack.length - 1] || null
    },

    /**
     * Check if loading
     */
    isLoading: (state) => {
      return state.pageLoading || state.globalLoading
    },

    /**
     * Get viewport size
     */
    viewportSize: (state) => {
      if (state.isMobile) return 'mobile'
      if (state.isTablet) return 'tablet'
      return 'desktop'
    },

    /**
     * Check if feature is enabled
     */
    isFeatureEnabled: (state) => (feature) => {
      return state.features[feature] || false
    },

    /**
     * Get time format pattern
     */
    timeFormatPattern: (state) => {
      return state.timeFormat === '24h' ? 'HH:mm' : 'hh:mm A'
    },

    /**
     * Get datetime format pattern
     */
    dateTimeFormatPattern: (state) => {
      return `${state.dateFormat} ${state.timeFormatPattern}`
    }
  },

  actions: {
    /**
     * Initialize UI store
     */
    initialize() {
      // Load preferences from storage
      this.loadPreferences()

      // Setup responsive handlers
      this.setupResponsiveHandlers()

      // Setup keyboard shortcuts
      this.setupKeyboardShortcuts()

      // Apply theme
      this.applyTheme()

      // Check device type
      this.checkDeviceType()
    },

    /**
     * Toggle left drawer
     */
    toggleLeftDrawer() {
      this.leftDrawerOpen = !this.leftDrawerOpen
      this.savePreference('leftDrawerOpen', this.leftDrawerOpen)
    },

    /**
     * Toggle right drawer
     */
    toggleRightDrawer() {
      this.rightDrawerOpen = !this.rightDrawerOpen
    },

    /**
     * Toggle mini mode
     */
    toggleMiniMode() {
      this.miniMode = !this.miniMode
      this.savePreference('miniMode', this.miniMode)
    },

    /**
     * Set dark mode
     */
    setDarkMode(value) {
      this.darkMode = value
      Dark.set(value)
      this.savePreference('darkMode', value)

      // Emit event for other components
      window.dispatchEvent(new CustomEvent('theme:changed', {
        detail: { darkMode: value }
      }))
    },

    /**
     * Toggle dark mode
     */
    toggleDarkMode() {
      this.setDarkMode(!this.darkMode)
    },

    /**
     * Set theme colors
     */
    setThemeColors(primary, accent) {
      this.primaryColor = primary
      this.accentColor = accent

      // Apply to CSS variables
      document.documentElement.style.setProperty('--q-primary', primary)
      document.documentElement.style.setProperty('--q-accent', accent)

      this.savePreference('primaryColor', primary)
      this.savePreference('accentColor', accent)
    },

    /**
     * Set layout
     */
    setLayout(layout) {
      this.layout = layout
      this.savePreference('layout', layout)
    },

    /**
     * Set page title
     */
    setPageTitle(title) {
      this.pageTitle = title
      document.title = title ? `${title} - Gorealla Developer` : 'Gorealla Developer'
    },

    /**
     * Set breadcrumbs
     */
    setBreadcrumbs(breadcrumbs) {
      this.breadcrumbs = breadcrumbs
    },

    /**
     * Show loading
     */
    showLoading(message = 'Loading...', global = false) {
      this.loadingMessage = message

      if (global) {
        this.globalLoading = true
      } else {
        this.pageLoading = true
      }
    },

    /**
     * Hide loading
     */
    hideLoading() {
      this.pageLoading = false
      this.globalLoading = false
      this.loadingMessage = ''
    },

    /**
     * Open dialog
     */
    openDialog(dialogId, data = {}) {
      this.activeDialogs.add(dialogId)
      this.dialogStack.push({ id: dialogId, data })

      // Disable body scroll
      if (this.activeDialogs.size === 1) {
        document.body.style.overflow = 'hidden'
      }
    },

    /**
     * Close dialog
     */
    closeDialog(dialogId) {
      this.activeDialogs.delete(dialogId)
      this.dialogStack = this.dialogStack.filter(d => d.id !== dialogId)

      // Re-enable body scroll if no dialogs
      if (this.activeDialogs.size === 0) {
        document.body.style.overflow = ''
      }
    },

    /**
     * Toggle global search
     */
    toggleGlobalSearch() {
      this.globalSearchOpen = !this.globalSearchOpen

      if (this.globalSearchOpen) {
        // Focus search input after DOM update
        this.$nextTick(() => {
          const searchInput = document.querySelector('#global-search-input')
          if (searchInput) searchInput.focus()
        })
      }
    },

    /**
     * Add to search history
     */
    addToSearchHistory(query) {
      if (!query) return

      // Remove if exists
      this.searchHistory = this.searchHistory.filter(q => q !== query)

      // Add to beginning
      this.searchHistory.unshift(query)

      // Limit to 10 items
      if (this.searchHistory.length > 10) {
        this.searchHistory = this.searchHistory.slice(0, 10)
      }

      this.savePreference('searchHistory', this.searchHistory)
    },

    /**
     * Set language
     */
    setLanguage(language) {
      this.language = language
      this.savePreference('language', language)

      // TODO: Apply language change
      window.dispatchEvent(new CustomEvent('language:changed', {
        detail: { language }
      }))
    },

    /**
     * Set timezone
     */
    setTimezone(timezone) {
      this.timezone = timezone
      this.savePreference('timezone', timezone)
    },

    /**
     * Set date format
     */
    setDateFormat(format) {
      this.dateFormat = format
      this.savePreference('dateFormat', format)
    },

    /**
     * Set time format
     */
    setTimeFormat(format) {
      this.timeFormat = format
      this.savePreference('timeFormat', format)
    },

    /**
     * Set font size
     */
    setFontSize(size) {
      this.fontSize = size

      // Apply to root element
      const root = document.documentElement
      root.classList.remove('font-small', 'font-normal', 'font-large')
      if (size !== 'normal') {
        root.classList.add(`font-${size}`)
      }

      this.savePreference('fontSize', size)
    },

    /**
     * Toggle high contrast
     */
    toggleHighContrast() {
      this.highContrast = !this.highContrast

      document.documentElement.classList.toggle('high-contrast', this.highContrast)
      this.savePreference('highContrast', this.highContrast)
    },

    /**
     * Toggle reduced motion
     */
    toggleReducedMotion() {
      this.reducedMotion = !this.reducedMotion

      document.documentElement.classList.toggle('reduced-motion', this.reducedMotion)
      this.savePreference('reducedMotion', this.reducedMotion)
    },

    /**
     * Register keyboard shortcut
     */
    registerShortcut(key, handler, description = '') {
      this.activeShortcuts.set(key, { handler, description })
    },

    /**
     * Unregister keyboard shortcut
     */
    unregisterShortcut(key) {
      this.activeShortcuts.delete(key)
    },

    /**
     * Show context menu
     */
    showContextMenu(menuId, event, items) {
      event.preventDefault()

      this.contextMenus.set(menuId, {
        x: event.clientX,
        y: event.clientY,
        items
      })
    },

    /**
     * Hide context menu
     */
    hideContextMenu(menuId) {
      this.contextMenus.delete(menuId)
    },

    /**
     * Open panel
     */
    openPanel(panelId, position = 'right') {
      this.activePanels.add(panelId)
      this.panelPositions.set(panelId, position)
    },

    /**
     * Close panel
     */
    closePanel(panelId) {
      this.activePanels.delete(panelId)
      this.panelPositions.delete(panelId)
    },

    /**
     * Set focus trap
     */
    setFocusTrap(element) {
      this.lastFocusedElement = document.activeElement
      this.focusTrap = element

      // Trap focus
      if (element) {
        const focusableElements = element.querySelectorAll(
          'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
        )

        if (focusableElements.length > 0) {
          focusableElements[0].focus()
        }
      }
    },

    /**
     * Release focus trap
     */
    releaseFocusTrap() {
      if (this.lastFocusedElement) {
        this.lastFocusedElement.focus()
        this.lastFocusedElement = null
      }
      this.focusTrap = null
    },

    /**
     * Save preference
     */
    savePreference(key, value) {
      const preferences = LocalStorage.getItem('uiPreferences') || {}
      preferences[key] = value
      LocalStorage.set('uiPreferences', preferences)
    },

    /**
     * Load preferences
     */
    loadPreferences() {
      const preferences = LocalStorage.getItem('uiPreferences') || {}

      // Apply saved preferences
      Object.entries(preferences).forEach(([key, value]) => {
        if (this.hasOwnProperty(key)) {
          this[key] = value
        }
      })

      // Apply dark mode
      if (this.darkMode) {
        Dark.set(true)
      }
    },

    /**
     * Reset preferences
     */
    resetPreferences() {
      LocalStorage.remove('uiPreferences')
      this.$reset()
      this.initialize()
    },

    /**
     * Apply theme
     */
    applyTheme() {
      // Apply CSS variables
      const root = document.documentElement
      root.style.setProperty('--q-primary', this.primaryColor)
      root.style.setProperty('--q-accent', this.accentColor)

      // Apply dark mode
      Dark.set(this.darkMode)

      // Apply other classes
      root.classList.toggle('high-contrast', this.highContrast)
      root.classList.toggle('reduced-motion', this.reducedMotion)

      if (this.fontSize !== 'normal') {
        root.classList.add(`font-${this.fontSize}`)
      }
    },

    /**
     * Check device type
     */
    checkDeviceType() {
      this.screenWidth = Screen.width
      this.screenHeight = Screen.height

      this.isMobile = Screen.xs || Screen.sm
      this.isTablet = Screen.md
      this.isDesktop = Screen.lg || Screen.xl

      // Auto-close drawer on mobile
      if (this.isMobile) {
        this.leftDrawerOpen = false
      }
    },

    /**
     * Setup responsive handlers
     */
    setupResponsiveHandlers() {
      // Watch for screen size changes
      Screen.setSizes({
        sm: 600,
        md: 1024,
        lg: 1440,
        xl: 1920
      })

      // Handle resize
      let resizeTimer
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer)
        resizeTimer = setTimeout(() => {
          this.checkDeviceType()
        }, 250)
      })

      // Handle orientation change
      window.addEventListener('orientationchange', () => {
        setTimeout(() => {
          this.checkDeviceType()
        }, 500)
      })
    },

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
      // Default shortcuts
      this.registerShortcut('ctrl+k', () => {
        this.toggleGlobalSearch()
      }, 'Open global search')

      this.registerShortcut('ctrl+/', () => {
        this.showShortcutsDialog()
      }, 'Show keyboard shortcuts')

      this.registerShortcut('ctrl+d', () => {
        this.toggleDarkMode()
      }, 'Toggle dark mode')

      this.registerShortcut('ctrl+\\', () => {
        this.toggleLeftDrawer()
      }, 'Toggle sidebar')

      this.registerShortcut('esc', () => {
        if (this.globalSearchOpen) {
          this.globalSearchOpen = false
        } else if (this.hasActiveDialog) {
          this.closeDialog(this.topDialog.id)
        }
      }, 'Close active element')

      // Listen for keyboard events
      document.addEventListener('keydown', (event) => {
        if (!this.shortcutsEnabled) return

        // Build key combination
        const keys = []
        if (event.ctrlKey || event.metaKey) keys.push('ctrl')
        if (event.altKey) keys.push('alt')
        if (event.shiftKey) keys.push('shift')

        // Add the actual key
        if (event.key.length === 1) {
          keys.push(event.key.toLowerCase())
        } else {
          keys.push(event.key)
        }

        const keyCombination = keys.join('+')

        // Check if shortcut exists
        const shortcut = this.activeShortcuts.get(keyCombination)
        if (shortcut) {
          // Prevent default unless in input field
          const target = event.target
          const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)

          if (!isInput || keyCombination === 'esc') {
            event.preventDefault()
            shortcut.handler(event)
          }
        }
      })
    },

    /**
     * Show shortcuts dialog
     */
    showShortcutsDialog() {
      const shortcuts = Array.from(this.activeShortcuts.entries()).map(([key, data]) => ({
        key,
        description: data.description
      }))

      this.openDialog('shortcuts', { shortcuts })
    },

    /**
     * Start tour
     */
    startTour() {
      this.tourStep = 0
      this.tourCompleted = false

      window.dispatchEvent(new CustomEvent('tour:start'))
    },

    /**
     * Next tour step
     */
    nextTourStep() {
      this.tourStep++

      window.dispatchEvent(new CustomEvent('tour:step', {
        detail: { step: this.tourStep }
      }))
    },

    /**
     * Complete tour
     */
    completeTour() {
      this.tourCompleted = true
      this.tourStep = 0
      this.savePreference('tourCompleted', true)

      window.dispatchEvent(new CustomEvent('tour:complete'))
    },

    /**
     * Reset store
     */
    resetStore() {
      // Close all dialogs
      this.activeDialogs.clear()
      this.dialogStack = []
      document.body.style.overflow = ''

      // Clear context menus
      this.contextMenus.clear()

      // Clear panels
      this.activePanels.clear()
      this.panelPositions.clear()

      // Reset loading states
      this.pageLoading = false
      this.globalLoading = false

      // Reset other dynamic state
      this.globalSearchOpen = false
      this.breadcrumbs = []
      this.pageTitle = ''
    }
  }
})
