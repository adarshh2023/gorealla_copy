// src/constants/api.constants.js

export const API_BASE_URL =
  process.env.API_URL || "http://localhost:8090/api/v1";
// export const API_BASE_URL = 'http://192.168.1.6:8090/api/v1'
// export const API_BASE_URL = '/api/v1'
// export const API_BASE_URL = 'https://jetrealty.gorealla.ai/api/v1'
export const API_ENDPOINTS = {
  UNITS: {
    BASE: "/units",
    BY_ID: (unitId) => `/units/${unitId}`,
    SEARCH: "/units/search",
    BY_TYPE: (unitType) => `/units/type/${unitType}`,
    BY_CATEGORY: (unitCategory) => `/units/category/${unitCategory}`,
    BY_TYPE_AND_CATEGORY: (unitType, unitCategory) =>
      `/units/type/${unitType}/category/${unitCategory}`,
    BASE_UNITS: "/units/base-units",
    DERIVED_BY_BASE: (baseUnitId) => `/units/base-unit/${baseUnitId}/derived`,
    CONVERTIBLE: (unitType) => `/units/type/${unitType}/convertible`,
    SYSTEM_UNITS: "/units/system-units",
    USER_DEFINED: "/units/user-defined",
    MARK_SYSTEM: (unitId) => `/units/${unitId}/system-unit`,
    CONVERT: "/units/convert",
    CONVERSION_FACTOR: "/units/conversion-factor",
    CONVERTIBLE_CHECK: "/units/convertible",
    UPDATE_DISPLAY_ORDER: (unitId) => `/units/${unitId}/display-order`,
    REORDER_IN_TYPE: (unitType) => `/units/type/${unitType}/reorder`,
    NEXT_DISPLAY_ORDER: (unitType) =>
      `/units/type/${unitType}/next-display-order`,
    OPTIMIZE_ORDER: (unitType) => `/units/type/${unitType}/optimize-order`,
    BULK_CREATE: "/units/bulk",
    BULK_DISPLAY_ORDER: "/units/bulk/display-order",
    BULK_CONVERSION: "/units/bulk/conversion-properties",
    BULK_DELETE: "/units/bulk",
    TYPES: "/units/types",
    CATEGORIES: "/units/categories",
    SYMBOLS: "/units/symbols",
    GROUPED_BY_TYPE: "/units/grouped-by-type",
    STATISTICS: "/units/statistics",
    ANALYTICS_TYPE: "/units/analytics/type",
    ANALYTICS_CATEGORY: "/units/analytics/category",
    ANALYTICS_CONVERSION: "/units/analytics/conversion-factors",
    MISSING_INFO: "/units/missing-info",
    COMPLEX_CONVERSIONS: "/units/complex-conversions",
    RECENT: "/units/recent",
    HIERARCHY: (unitType) => `/units/type/${unitType}/hierarchy`,
    PATH: (unitId) => `/units/${unitId}/path`,
    VALIDATE_HIERARCHY: (unitType) =>
      `/units/type/${unitType}/validate-hierarchy`,
    VALIDATE_CODE: (unitCode) => `/units/validate/unit-code/${unitCode}`,
    VALIDATE_NAME: (unitName) => `/units/validate/unit-name/${unitName}`,
    CAN_DELETE: (unitId) => `/units/${unitId}/can-delete`,
    VALIDATE_CIRCULAR: "/units/validate/circular-dependency",
    VALIDATE_DATA: (unitId) => `/units/${unitId}/validate`,
    EXPORT: "/units/export",
    COMMON_CONVERSIONS: (unitId) => `/units/${unitId}/common-conversions`,
    SUGGESTIONS: (unitType) => `/units/type/${unitType}/suggestions`,
    CONVERSION_HISTORY: "/units/conversion-history",
    FAVORITE_CONVERSIONS: "/units/favorite-conversions",
  },

  // Item Categories
  ITEM_CATEGORIES: {
    BASE: "/item-categories",
    BY_ID: (categoryId) => `/item-categories/${categoryId}`,
    SEARCH: "/item-categories/search",
    BY_REQUIREMENTS: "/item-categories/requirements",
    BY_LEVEL: (categoryLevel) => `/item-categories/level/${categoryLevel}`,
    ROOT: "/item-categories/root",
    CHILDREN: (categoryId) => `/item-categories/${categoryId}/children`,
    LEAF: "/item-categories/leaf",
    BY_COMPLIANCE: (standard) => `/item-categories/compliance/${standard}`,
    BY_UNIT: (unit) => `/item-categories/unit/${unit}`,
    TESTING_REQUIRED: "/item-categories/testing-required",
    SAMPLE_REQUIRED: "/item-categories/sample-required",
    QR_TRACKING_REQUIRED: "/item-categories/qr-tracking-required",
    STATISTICS: "/item-categories/statistics",
    UPDATE_DISPLAY_ORDER: (categoryId) =>
      `/item-categories/${categoryId}/display-order`,
    BATCH_DELETE: "/item-categories/batch",
    VALIDATE_CODE: (categoryCode) =>
      `/item-categories/validate/category-code/${categoryCode}`,
    VALIDATE_NAME: "/item-categories/validate/category-name",
    CAN_DELETE: (categoryId) => `/item-categories/${categoryId}/can-delete`,
    HAS_CHILDREN: (categoryId) => `/item-categories/${categoryId}/has-children`,
  },

  // Items Master
  ITEMS: {
    BASE: "/items",
    BY_ID: (itemId) => `/items/${itemId}`,
    SEARCH: "/items/search",
    BY_CATEGORY: (categoryId) => `/items/category/${categoryId}`,
    BY_STATUS: (status) => `/items/status/${status}`,
    BY_MATERIAL: (material) => `/items/material/${material}`,
    BY_HSN: (hsnCode) => `/items/hsn/${hsnCode}`,
    BY_VENDOR: (vendorId) => `/items/vendor/${vendorId}`,
    TESTING_REQUIRED: "/items/testing/required",
    SAMPLES_REQUIRED: "/items/samples/required",
    QR_TRACKING_REQUIRED: "/items/qr-tracking/required",
    SERIAL_NUMBERS_REQUIRED: "/items/serial-numbers/required",
    REORDER_REQUIRED: "/items/reorder/required",
    COST_RANGE: "/items/cost-range",
    MISSING_INFO: "/items/missing-info",
    RECENT: "/items/recent",
    BULK_CREATE: "/items/bulk",
    BULK_STATUS: "/items/bulk/status",
    BULK_CATEGORY: "/items/bulk/category",
    BULK_TESTING: "/items/bulk/testing-requirements",
    BULK_INVENTORY: "/items/bulk/inventory-properties",
    BULK_VENDOR: "/items/bulk/preferred-vendor",
    BULK_DELETE: "/items/bulk",
    UPDATE_METADATA: (itemId) => `/items/${itemId}/metadata`,
    GET_METADATA: (itemId) => `/items/${itemId}/metadata`,
    UPDATE_ALTERNATE_UNITS: (itemId) => `/items/${itemId}/alternate-units`,
    GET_ALTERNATE_UNITS: (itemId) => `/items/${itemId}/alternate-units`,
    STATISTICS: "/items/statistics",
    ANALYTICS_CATEGORY: "/items/analytics/category",
    ANALYTICS_MATERIAL: "/items/analytics/material",
    ANALYTICS_TESTING: "/items/analytics/testing-requirements",
    ANALYTICS_INVENTORY: "/items/analytics/inventory",
    ANALYTICS_COST: "/items/analytics/cost",
    VALIDATE_CODE: (itemCode) => `/items/validate/item-code/${itemCode}`,
    CAN_DELETE: (itemId) => `/items/${itemId}/can-delete`,
    GENERATE_CODE: "/items/generate-code",
    EXPORT: "/items/export",
    MATERIALS: "/items/materials",
    GRADES: "/items/grades",
    HSN_CODES: "/items/hsn-codes",
    VALIDATE_DATA: (itemId) => `/items/${itemId}/validate`,
  },

  // Locations
  LOCATIONS: {
    BASE: "/locations",
    BY_ID: (locationId) => `/locations/${locationId}`,
    SEARCH: "/locations/search",
    BY_TYPE: (locationType) => `/locations/type/${locationType}`,
    BY_STATUS: (locationStatus) => `/locations/status/${locationStatus}`,
    BY_CITY: (city) => `/locations/city/${city}`,
    BY_STATE: (state) => `/locations/state/${state}`,
    BY_PINCODE: (pinCode) => `/locations/pincode/${pinCode}`,
    INVENTORY_LOCATIONS: "/locations/capabilities/inventory",
    RECEIVING_LOCATIONS: "/locations/capabilities/receiving",
    ISSUING_LOCATIONS: "/locations/capabilities/issuing",
    ROOT_LOCATIONS: "/locations/hierarchy/roots",
    CHILDREN: (locationId) => `/locations/${locationId}/children`,
    STATISTICS: "/locations/statistics",
    COUNT_BY_TYPE: "/locations/statistics/count-by-type",
    COUNT_BY_STATUS: "/locations/statistics/count-by-status",
  },

  // Vendors
  VENDORS: {
    BASE: "/vendors",
    BY_ID: (vendorId) => `/vendors/${vendorId}`,
    SEARCH: "/vendors/search",
    BY_TYPE_AND_CATEGORY: (vendorType, vendorCategory) =>
      `/vendors/type/${vendorType}/category/${vendorCategory}`,
    PREFERRED: "/vendors/preferred",
    BY_LOCATION: "/vendors/location",
    SUBMIT_APPROVAL: (vendorId) => `/vendors/${vendorId}/submit-for-approval`,
    PROCESS_APPROVAL: (vendorId) => `/vendors/${vendorId}/process-approval`,
    PENDING_APPROVAL: "/vendors/pending-approval",
    UPDATE_PERFORMANCE: (vendorId) => `/vendors/${vendorId}/performance`,
    PERFORMANCE_HISTORY: (vendorId) =>
      `/vendors/${vendorId}/performance/history`,
    PERFORMANCE_RANKING: "/vendors/performance/ranking",
    TOP_PERFORMERS: "/vendors/top-performers",
    ENABLE_PORTAL: (vendorId) => `/vendors/${vendorId}/portal-access`,
    NOTIFY: (vendorId) => `/vendors/${vendorId}/notify`,
    PORTAL_ACTIVITY: (vendorId) => `/vendors/${vendorId}/portal-activity`,
    BULK_CREATE: "/vendors/bulk",
    BULK_STATUS: "/vendors/bulk/status",
    BULK_APPROVALS: "/vendors/bulk/approvals",
    VALIDATE_CODE: (vendorCode) =>
      `/vendors/validate/vendor-code/${vendorCode}`,
    VALIDATE_GST: (gstNumber) => `/vendors/validate/gst/${gstNumber}`,
    CAN_DELETE: (vendorId) => `/vendors/${vendorId}/can-delete`,
    STATISTICS: "/vendors/statistics",
    ANALYTICS_DISTRIBUTION: "/vendors/analytics/distribution",
    ANALYTICS_PERFORMANCE: "/vendors/analytics/performance",
    STATUS_COUNTS: "/vendors/analytics/status-counts",
    REQUIRING_ATTENTION: "/vendors/requiring-attention",
    EXPORT: "/vendors/export",
  },

  // Indents
  INDENTS: {
    BASE: "/indents",
    BY_ID: (indentId) => `/indents/${indentId}`,
    BY_NUMBER: (indentNumber) => `/indents/number/${indentNumber}`,
    SEARCH: "/indents/search",
    ADVANCED_SEARCH: "/indents/search/advanced",
    BY_PROJECT: (projectNodeId) => `/indents/project/${projectNodeId}`,
    BY_REQUESTOR: (requestorId) => `/indents/requestor/${requestorId}`,
    BY_STATUS: (status) => `/indents/status/${status}`,
    PENDING_APPROVAL: "/indents/status/approval/pending",
    URGENT: "/indents/urgent",
    OVERDUE: "/indents/overdue",
    SUBMIT: (indentId) => `/indents/${indentId}/submit`,
    APPROVE: (indentId) => `/indents/${indentId}/approve`,
    REJECT: (indentId) => `/indents/${indentId}/reject`,
    CANCEL: (indentId) => `/indents/${indentId}/cancel`,
    APPROVE_BUDGET: (indentId) => `/indents/${indentId}/budget/approve`,
    UPDATE_BUDGET: (indentId) => `/indents/${indentId}/budget`,
    ITEMS: (indentId) => `/indents/${indentId}/items`,
    ADD_ITEM: (indentId) => `/indents/${indentId}/items`,
    UPDATE_ITEM: (indentId, itemId) => `/indents/${indentId}/items/${itemId}`,
    REMOVE_ITEM: (indentId, itemId) => `/indents/${indentId}/items/${itemId}`,
    ITEM_BY_ID: (itemId) => `/indents/items/${itemId}`,
    APPROVE_ITEM: (itemId) => `/indents/items/${itemId}/approve`,
    UPDATE_ITEM_STATUS: (itemId) => `/indents/items/${itemId}/status`,
    UPDATE_ITEM_QUANTITIES: (itemId) => `/indents/items/${itemId}/quantities`,
    BULK_APPROVE_ITEMS: (indentId) => `/indents/${indentId}/items/bulk-approve`,
    BULK_UPDATE_ITEM_STATUS: (indentId) =>
      `/indents/${indentId}/items/bulk-status`,
    BULK_ASSIGN_VENDOR: "/indents/items/bulk-assign-vendor",
    GENERATE_NUMBER: "/indents/generate-number",
    CAN_EDIT: (indentId) => `/indents/${indentId}/can-edit`,
    CAN_APPROVE: (indentId) => `/indents/${indentId}/can-approve`,
    RECALCULATE: (indentId) => `/indents/${indentId}/recalculate`,
    STATISTICS: "/indents/statistics",
    APPROVAL_STATISTICS: "/indents/statistics/approval",
    DASHBOARD: "/indents/dashboard",
    DATE_RANGE: "/indents/date-range",
    RECENT: "/indents/recent",
    BY_LOCATION: (locationId) => `/indents/location/${locationId}`,
    BY_BUDGET: (budgetCode) => `/indents/budget/${budgetCode}`,
  },

  NOTIFICATIONS: {
    DEVICE_TOKENS: {
      REGISTER: "/notifications/device-tokens/register",
      MY_DEVICES: "/notifications/device-tokens/my-devices",
      MY_ACTIVE: "/notifications/device-tokens/my-devices/active",
      MY_COUNT: "/notifications/device-tokens/my-devices/count",
      EXISTS: "/notifications/device-tokens/my-devices/exists",
      BY_ID: (tokenId) => `/notifications/device-tokens/${tokenId}`,
      PING: (tokenId) => `/notifications/device-tokens/${tokenId}/ping`,
      SUBSCRIBE: (tokenId) =>
        `/notifications/device-tokens/${tokenId}/subscribe-topics`,
      CUSTOMER_CONTEXT: "/notifications/device-tokens/customer-context",
      DEACTIVATE: (tokenId) =>
        `/notifications/device-tokens/${tokenId}/deactivate`,
      ACTIVATE: (tokenId) => `/notifications/device-tokens/${tokenId}/activate`,
      DELETE: (tokenId) => `/notifications/device-tokens/${tokenId}`,
      ALL: "/notifications/device-tokens",
      BY_TYPE: (deviceType) =>
        `/notifications/device-tokens/type/${deviceType}`,
      USER_TOKENS: (userId) => `/notifications/device-tokens/user/${userId}`,
      STAKEHOLDER_TOKENS: (stakeholderId) =>
        `/notifications/device-tokens/stakeholder/${stakeholderId}`,
      REGISTER_USER: (userId) =>
        `/notifications/device-tokens/user/${userId}/register`,
      REGISTER_STAKEHOLDER: (stakeholderId) =>
        `/notifications/device-tokens/stakeholder/${stakeholderId}/register`,
      SEARCH: "/notifications/device-tokens/search",
      DATE_RANGE: "/notifications/device-tokens/date-range",
      STATS: "/notifications/device-tokens/stats",
      MOST_ACTIVE: "/notifications/device-tokens/most-active",
      DEACTIVATE_OLD: "/notifications/device-tokens/maintenance/deactivate-old",
      CLEANUP_CANDIDATES:
        "/notifications/device-tokens/maintenance/cleanup-candidates",
      DEACTIVATE_OWNER:
        "/notifications/device-tokens/maintenance/deactivate-owner",
      DEVICE_TYPES: "/notifications/device-tokens/device-types",
    },
    QUEUE: {
      // User endpoints - now support channels parameter
      MY_NOTIFICATIONS: "/notifications/queue/my-notifications", // ?channels=InApp,Push
      UNREAD: "/notifications/queue/my-notifications/unread", // ?channels=InApp
      UNREAD_COUNT: "/notifications/queue/my-notifications/unread-count", // ?channels=InApp
      RECENT: "/notifications/queue/my-notifications/recent", // ?channels=InApp&limit=5
      SUMMARY: "/notifications/queue/my-notifications/summary", // ?channels=InApp
      BY_ID: (id) => `/notifications/queue/my-notifications/${id}`,

      // Action endpoints - now support channels parameter for mark-read
      MARK_READ: (id) => `/notifications/queue/${id}/mark-read`, // ?channels=InApp,Push
      MARK_ALL_READ: "/notifications/queue/mark-all-read", // ?channels=InApp
      MARK_CLICKED: (id) => `/notifications/queue/${id}/mark-clicked`,
      DELETE: (id) => `/notifications/queue/${id}`,

      // Admin endpoints - now support channels parameter
      ALL: "/notifications/queue", // ?channels=InApp,Push
      BY_STATUS: (status) => `/notifications/queue/status/${status}`, // ?channels=InApp,Push
      BY_CHANNEL: (channel) => `/notifications/queue/channel/${channel}`, // Deprecated - use ALL with channels param
      USER_NOTIFICATIONS: (userId) => `/notifications/queue/user/${userId}`, // ?channels=InApp,Push
      SEARCH: "/notifications/queue/search", // ?channels=InApp,Push&searchTerm=term
      DATE_RANGE: "/notifications/queue/date-range", // ?channels=InApp,Push&startDate=date&endDate=date
      STATS: "/notifications/queue/stats",
      DAILY_STATS: "/notifications/queue/stats/daily",

      // Creation endpoints
      CREATE: "/notifications/queue",
      UPDATE: (id) => `/notifications/queue/${id}`,
    },

    SETTINGS: {
      BASE: "/notifications/settings",
      MY_SETTINGS: "/notifications/settings/my-settings",
      MY_SETTINGS_TYPE: (notificationType) =>
        `/notifications/settings/my-settings/${notificationType}`,
      TOGGLE_EMAIL: "/notifications/settings/my-settings/toggle-email",
      TOGGLE_SMS: "/notifications/settings/my-settings/toggle-sms",
      TOGGLE_PUSH: "/notifications/settings/my-settings/toggle-push",
      CREATE_DEFAULTS: "/notifications/settings/my-settings/create-defaults",
      BY_ID: (settingsId) => `/notifications/settings/${settingsId}`,
      USER_SETTINGS: (userId) => `/notifications/settings/user/${userId}`,
      BY_TYPE: (notificationType) =>
        `/notifications/settings/type/${notificationType}`,
      SEARCH: "/notifications/settings/search",
      STATS: "/notifications/settings/statistics",
      TYPES: "/notifications/settings/types",
    },
    CONFIG: {
      CUSTOMER_INFO: "/config/customer-info",
      CUSTOMER_CONFIG: "/config/customer-config",
      INITIALIZE_SESSION: "/config/initialize-session",
    },
  },

  // Authentication
  AUTH: {
    // User Authentication
    LOGIN: "/auth/login",
    LOGIN_OTP: "/auth/login/otp",
    REGISTER: "/auth/register",
    GENERATE_OTP: "/auth/send-otp",
    VERIFY_OTP: "/auth/verify-otp",
    REFRESH_TOKEN: "/auth/refresh-token",
    CHANGE_PASSWORD: "/auth/change-password",
    FORGOT_PASSWORD: "/auth/reset-password",
    RESET_PASSWORD: "/auth/reset-password",
    LOGOUT: "/auth/logout",
    VALIDATE_TOKEN: "/auth/validate-token",
    ACCOUNT_STATUS: "/auth/account-status",

    // Stakeholder Authentication
    STAKEHOLDER_LOGIN: "/auth/stakeholder/login",
    STAKEHOLDER_SEND_OTP: "/auth/stakeholder/send-otp",
    STAKEHOLDER_LOGIN_OTP: "/auth/stakeholder/login/otp",
    STAKEHOLDER_RESET_PASSWORD: "/auth/stakeholder/reset-password",

    // Unified Authentication
    GET_UNIFIED_USER: (userId) => `/auth/user/${userId}`,
  },

  // Users
  USERS: {
    BASE: "/users",
    BY_ID: (id) => `/users/${id}`,
    BY_ROLE: (role) => `/users/role/${role}`,
    BY_STATUS: (status) => `/users/status/${status}`,
    SEARCH: "/users/search",
    PROJECT_MANAGERS: "/users/project-managers",
    PROFILE: "/users/profile",
    PROFILE_PICTURE: "/users/profile/picture",
    PROFILE_PASSWORD: "/users/profile/password",
    ACTIVATE: (id) => `/users/${id}/activate`,
    SUSPEND: (id) => `/users/${id}/suspend`,
    UNLOCK: (id) => `/users/${id}/unlock`,
    UPDATE_ROLE: (id) => `/users/${id}/role`,
    CHECK_EMAIL: "/users/check-email",
    CHECK_MOBILE: "/users/check-mobile",
    VERIFY_EMAIL: "/users/verify-email",
    VERIFY_MOBILE: "/users/verify-mobile",
  },

  // Projects
  PROJECTS: {
    BASE: "/projects",
    BY_CATEGORY: (categoryId) => `/projects/category/${categoryId}`,
    BY_MANAGER: (managerId) => `/projects/manager/${managerId}`,
    NODE_BY_ID: (nodeId) => `/projects/nodes/${nodeId}`,
    NODES: "/projects/nodes",
    TREE: (projectId) => `/projects/${projectId}/tree`,
    NODE_CHILDREN: (nodeId) => `/projects/nodes/${nodeId}/children`,
    NODE_ANCESTORS: (nodeId) => `/projects/nodes/${nodeId}/ancestors`,
    NODE_PATH: (nodeId) => `/projects/nodes/${nodeId}/path`,
    NODE_SEARCH: "/projects/nodes/search",
    NODES_BY_STATUS: (projectId, status) =>
      `/projects/${projectId}/nodes/status/${status}`,
    CRITICAL_NODES: (projectId) => `/projects/${projectId}/nodes/critical`,
    UPDATE_PROGRESS: (nodeId) => `/projects/nodes/${nodeId}/progress`,
    UPDATE_STATUS: (nodeId) => `/projects/nodes/${nodeId}/status`,
    PROGRESS_SUMMARY: (projectId) => `/projects/${projectId}/progress-summary`,
    CUSTOM_PROPERTIES: (nodeId) => `/projects/nodes/${nodeId}/properties`,
    CATEGORIES: "/projects/categories",
    NODE_TYPES: "/projects/node-types",
    CAN_DELETE: (nodeId) => `/projects/nodes/${nodeId}/can-delete`,
    // Bulk Operations
    BULK_CREATE_NODES: "/projects/nodes/bulk",
    BULK_UPDATE_NODES: "/projects/nodes/bulk",
    BULK_DELETE_NODES: "/projects/nodes/bulk",
    VALIDATE_BULK_DELETE: "/projects/nodes/bulk/validate-delete",
    // Enhanced Search & Details
    NODE_SEARCH_ENHANCED: "/projects/nodes/search/enhanced",
    NODE_SEARCH_ARRAY: "/projects/nodes/search/searchNodesArray",
    PROJECT_NODES_DETAILED: (projectId) =>
      `/projects/${projectId}/nodes/detailed`,
    // Node Relationships
    NODES_WITH_CHILDREN: "/projects/nodes/with-children",
    ORPHAN_NODES: "/projects/nodes/orphans",
    // Move node
    MOVE_NODE: (nodeId) => `/projects/nodes/${nodeId}/move`,
  },

  // Gallery
  GALLERY: {
    BASE: "/gallery",
    UPLOAD: "/gallery/upload",
    UPLOAD_MULTIPLE: "/gallery/upload/multiple",
    BY_ID: (mediaId) => `/gallery/${mediaId}`,
    DOWNLOAD: (mediaId) => `/gallery/${mediaId}/download`,
    STREAM: (mediaId) => `/gallery/${mediaId}/stream`,

    // Node Gallery Queries
    NODE_GALLERY: (nodeId) => `/gallery/node/${nodeId}`,
    NODE_BY_TYPE: (nodeId, mediaType) =>
      `/gallery/node/${nodeId}/type/${mediaType}`,
    NODE_BY_CATEGORY: (nodeId, category) =>
      `/gallery/node/${nodeId}/category/${category}`,
    NODE_PUBLIC: (nodeId) => `/gallery/node/${nodeId}/public`,
    NODE_SEARCH: (nodeId) => `/gallery/node/${nodeId}/search`,
    NODE_SUMMARY: (nodeId) => `/gallery/node/${nodeId}/summary`,
    NODE_STATISTICS: (nodeId) => `/gallery/node/${nodeId}/statistics`,
    NODE_EXPORT: (nodeId) => `/gallery/node/${nodeId}/export`,
    DELETE_NODE_GALLERY: (nodeId) => `/gallery/node/${nodeId}`,

    // User Uploads
    USER_UPLOADS: (userId) => `/gallery/user/${userId}/uploads`,

    // Recent & Search
    RECENT: "/gallery/recent",

    // Media Management
    MOVE_CATEGORY: (mediaId) => `/gallery/${mediaId}/category`,
    REORDER: (nodeId) => `/gallery/node/${nodeId}/reorder`,

    // Bulk Operations
    BULK_CATEGORY: "/gallery/bulk/category",
    BULK_VISIBILITY: "/gallery/bulk/visibility",

    // Metadata
    METADATA: (mediaId) => `/gallery/${mediaId}/metadata`,

    // Permissions
    CAN_DELETE: (mediaId) => `/gallery/${mediaId}/can-delete`,
  },

  // Tasks
  TASKS: {
    BASE: "/tasks",
    BY_ID: (taskId) => `/tasks/${taskId}`,
    BY_NODE: (nodeId) => `/tasks/node/${nodeId}`,
    MY_TASKS: "/tasks/my-tasks",
    BY_STATUS: (status) => `/tasks/status/${status}`,
    BY_PRIORITY: (priority) => `/tasks/priority/${priority}`,
    SEARCH: "/tasks/search",
    UPDATE_STATUS: (taskId) => `/tasks/${taskId}/status`,
    ASSIGN: (taskId) => `/tasks/${taskId}/assign`,
    UPDATE_PROGRESS: (taskId) => `/tasks/${taskId}/progress`,
    OVERDUE: "/tasks/overdue",
    DUE_TODAY: "/tasks/due-today",
    DUE_SOON: "/tasks/due-soon",
    DATE_RANGE: "/tasks/date-range",
    SUMMARY: "/tasks/summary",
    UPCOMING: "/tasks/upcoming",
    STATUS_COUNT: (nodeId) => `/tasks/node/${nodeId}/status-count`,
    COMPLETION_STATS: (projectId) =>
      `/tasks/project/${projectId}/completion-stats`,
    CAN_DELETE: (taskId) => `/tasks/${taskId}/can-delete`,
  },

  // Notes
  NOTES: {
    BASE: "/notes",
    BY_ID: (noteId) => `/notes/${noteId}`,
    BY_NODE: (nodeId) => `/notes/nodes/${nodeId}`,
    BY_TYPE: (nodeId, noteType) => `/notes/nodes/${nodeId}/type/${noteType}`,
    IMPORTANT: (nodeId) => `/notes/nodes/${nodeId}/important`,
    PUBLIC: (nodeId) => `/notes/nodes/${nodeId}/public`,
    BY_AUTHOR: (authorId) => `/notes/author/${authorId}`,
    SEARCH: "/notes/search",
    DATE_RANGE: "/notes/date-range",
    RECENT: "/notes/recent",
    TOGGLE_IMPORTANT: (noteId) => `/notes/${noteId}/toggle-important`,
    TOGGLE_PRIVACY: (noteId) => `/notes/${noteId}/toggle-privacy`,
    STATISTICS: (nodeId) => `/notes/nodes/${nodeId}/statistics`,
    EXPORT: "/notes/export",
  },

  // Tags
  TAGS: {
    CATEGORIES: "/tags/categories",
    CATEGORY_BY_ID: (categoryId) => `/tags/categories/${categoryId}`,
    CATEGORIES_BY_TYPE: (categoryType) =>
      `/tags/categories/type/${categoryType}`,
    DEFINITIONS: (categoryId) => `/tags/categories/${categoryId}/definitions`,
    DEFINITION_BY_ID: (definitionId) => `/tags/definitions/${definitionId}`,
    DEFAULT_TAGS: "/tags/definitions/default",
    PERMISSIONS: "/tags/permissions",
    PERMISSION_BY_ID: (permissionId) => `/tags/permissions/${permissionId}`,
    PERMISSIONS_BY_ROLE: (userRole) => `/tags/permissions/role/${userRole}`,
    TAG_NODE: (nodeId) => `/tags/nodes/${nodeId}/tag`,
    TAG_MULTIPLE: "/tags/nodes/tag-multiple",
    REMOVE_TAG: (nodeId, tagId) => `/tags/nodes/${nodeId}/tags/${tagId}`,
    NODE_TAGS: (nodeId) => `/tags/nodes/${nodeId}/tags`,
    NODES_BY_TAG: (tagDefinitionId) =>
      `/tags/definitions/${tagDefinitionId}/nodes`,
    NODES_BY_CATEGORY: (categoryId) => `/tags/categories/${categoryId}/nodes`,
    SEARCH: "/tags/search",
    POPULAR: "/tags/popular",
    TAG_CLOUD: "/tags/tag-cloud",
  },

  // Properties
  PROPERTIES: {
    DEFINITIONS: "/properties/definitions",
    DEFINITION_BY_ID: (propertyDefId) =>
      `/properties/definitions/${propertyDefId}`,
    GLOBAL_DEFINITIONS: "/properties/definitions/global",
    BY_NODE_TYPE: (nodeTypeId) =>
      `/properties/definitions/node-type/${nodeTypeId}`,
    ALL_FOR_NODE_TYPE: (nodeTypeId) =>
      `/properties/node-type/${nodeTypeId}/all`,
    GROUPED_FOR_NODE_TYPE: (nodeTypeId) =>
      `/properties/node-type/${nodeTypeId}/grouped`,
    SET_NODE_PROPERTY: (nodeId) => `/properties/nodes/${nodeId}/property`,
    BULK_UPDATE: (nodeId) => `/properties/nodes/${nodeId}/properties/bulk`,
    GET_NODE_PROPERTY: (nodeId, propertyDefId) =>
      `/properties/nodes/${nodeId}/property/${propertyDefId}`,
    NODE_PROPERTIES: (nodeId) => `/properties/nodes/${nodeId}/properties`,
    NODE_PROPERTIES_MAP: (nodeId) =>
      `/properties/nodes/${nodeId}/properties/map`,
    DELETE_NODE_PROPERTY: (nodeId, propertyDefId) =>
      `/properties/nodes/${nodeId}/property/${propertyDefId}`,
    VALIDATE: "/properties/validate",
    VALIDATE_NODE: (nodeId) => `/properties/nodes/${nodeId}/validate`,
    HAS_REQUIRED: (nodeId) => `/properties/nodes/${nodeId}/has-required`,
    SEARCH: "/properties/search",
    CHECK_NAME: "/properties/check-name",
  },

  // Dependencies
  DEPENDENCIES: {
    BASE: "/dependencies",
    BY_ID: (dependencyId) => `/dependencies/${dependencyId}`,
    DEACTIVATE: (dependencyId) => `/dependencies/${dependencyId}/deactivate`,
    REACTIVATE: (dependencyId) => `/dependencies/${dependencyId}/reactivate`,
    NODE_DEPENDENCIES: (nodeId) => `/dependencies/node/${nodeId}/dependencies`,
    NODE_PREREQUISITES: (nodeId) =>
      `/dependencies/node/${nodeId}/prerequisites`,
    NODE_ACTIVE: (nodeId) => `/dependencies/node/${nodeId}/active`,
    BY_TYPE: (dependencyType) => `/dependencies/type/${dependencyType}`,
    OVERRIDABLE: "/dependencies/overridable",
    OVERRIDDEN: "/dependencies/overridden",
    SEARCH: "/dependencies/search",
    CHAIN: (nodeId) => `/dependencies/node/${nodeId}/chain`,
    UPSTREAM: (nodeId) => `/dependencies/node/${nodeId}/upstream`,
    DOWNSTREAM: (nodeId) => `/dependencies/node/${nodeId}/downstream`,
    CRITICAL_PATH: (projectId) =>
      `/dependencies/project/${projectId}/critical-path`,
    BLOCKING: (nodeId) => `/dependencies/node/${nodeId}/blocking`,
    NETWORK: (projectId) => `/dependencies/project/${projectId}/network`,
    VALIDATE: "/dependencies/validate",
    CHECK_CIRCULAR: "/dependencies/check-circular",
    CAN_CREATE: "/dependencies/can-create",
    CIRCULAR_PATH: (nodeId) => `/dependencies/node/${nodeId}/circular-path`,
    VALIDATE_CHAIN: (nodeId) => `/dependencies/node/${nodeId}/validate-chain`,
    OVERRIDE: "/dependencies/override",
    CANCEL_OVERRIDE: (dependencyId) =>
      `/dependencies/${dependencyId}/cancel-override`,
    OVERRIDE_HISTORY: (dependencyId) =>
      `/dependencies/${dependencyId}/override-history`,
    STATISTICS: "/dependencies/statistics",
    EXECUTION_ORDER: (projectId) =>
      `/dependencies/project/${projectId}/execution-order`,
  },

  // Stakeholders
  STAKEHOLDERS: {
    BASE: "/stakeholders",
    BY_ID: (stakeholderId) => `/stakeholders/${stakeholderId}`,
    BY_TYPE: (stakeholderType) => `/stakeholders/by-type/${stakeholderType}`,
    PREFERRED: "/stakeholders/preferred",
    TOP_RATED: "/stakeholders/top-rated",
    SEARCH: "/stakeholders/search",
    ASSIGNMENTS: "/stakeholders/assignments",
    ASSIGNMENT_BY_ID: (assignmentId) =>
      `/stakeholders/assignments/${assignmentId}`,
    STAKEHOLDER_ASSIGNMENTS: (stakeholderId) =>
      `/stakeholders/${stakeholderId}/assignments`,
    UNIFIED_ASSIGNMENT: "/stakeholders/assignments/unified",
    UNIFIED_ASSIGNMENTS_NODE: (nodeId) =>
      `/stakeholders/assignments/node/${nodeId}`,
    UNIFIED_ASSIGNMENTS_STAKEHOLDER: (stakeholderId) =>
      `/stakeholders/${stakeholderId}/assignments/unified`,
    CHECK_EMAIL: "/stakeholders/check-email",
    CHECK_PHONE: "/stakeholders/check-phone",
    TYPES: "/stakeholders/types",
    SPECIALIZATIONS: "/stakeholders/specializations",
    MARK_PREFERRED: (stakeholderId) => `/stakeholders/${stakeholderId}/prefer`,
    UNMARK_PREFERRED: (stakeholderId) =>
      `/stakeholders/${stakeholderId}/prefer`,
  },

  // In API_ENDPOINTS.ASSIGNMENTS (new section or update existing)
  ASSIGNMENTS: {
    UNIFIED: "/assignments/unified",
    BY_ID: (assignmentId) => `/assignments/${assignmentId}`,
    BY_NODE: (nodeId) => `/assignments/node/${nodeId}`,
    BY_ASSIGNEE: (assigneeType, assigneeId) =>
      `/assignments/assignee/${assigneeType}/${assigneeId}`,
    VALIDATE: "/assignments/validate",
    STATISTICS: "/assignments/statistics",
  },

  // Chat
  CHATS: {
    BASE: "/chats",
    BY_ID: (chatId) => `/chats/${chatId}`,
    NODE_CHATS: (nodeId) => `/chats/nodes/${nodeId}`,
    PROJECT_CHATS: (projectId) => `/chats/projects/${projectId}`,
    BY_TYPE: (chatType) => `/chats/type/${chatType}`,
    USER_CHATS: (userId) => `/chats/users/${userId}`,
    SEARCH: "/chats/search",
    RECENT_ACTIVITY: "/chats/recent-activity",
    MESSAGES: (chatId) => `/chats/${chatId}/messages`,
    MESSAGE_BY_ID: (messageId) => `/chats/messages/${messageId}`,
    MARK_DELETED: (messageId) => `/chats/messages/${messageId}/mark-deleted`,
    UNDELETED_MESSAGES: (chatId) => `/chats/${chatId}/messages/undeleted`,
    THREAD_REPLIES: (parentMessageId) =>
      `/chats/messages/${parentMessageId}/replies`,
    ADD_REPLY: (parentMessageId) => `/chats/messages/${parentMessageId}/reply`,
    SEARCH_MESSAGES: (chatId) => `/chats/${chatId}/messages/search`,
    MESSAGES_WITH_ATTACHMENTS: (chatId) =>
      `/chats/${chatId}/messages/with-attachments`,
    PARTICIPANTS: (chatId) => `/chats/${chatId}/participants`,
    REMOVE_PARTICIPANT: (chatId, userId) =>
      `/chats/${chatId}/participants/${userId}`,
    STATISTICS: (chatId) => `/chats/${chatId}/statistics`,
    MESSAGE_COUNT: (chatId) => `/chats/${chatId}/message-count`,
    LATEST_MESSAGE: (chatId) => `/chats/${chatId}/latest-message`,
    MESSAGE_COUNT_BY_TYPE: (chatId) => `/chats/${chatId}/message-count-by-type`,
    MARK_READ: (chatId) => `/chats/${chatId}/mark-read`,
    UNREAD_COUNT: (chatId) => `/chats/${chatId}/unread-count`,
    UNREAD_CHATS: "/chats/unread",
    USER_SUMMARY: (userId) => `/chats/users/${userId}/summary`,
    PROJECT_ACTIVE_CHATS: (projectId) => `/chats/projects/${projectId}/active`,
    ACTIVITY_REPORT: (projectId) =>
      `/chats/projects/${projectId}/activity-report`,
  },

  // Dashboard
  DASHBOARD: {
    PROJECT: (projectId) => `/dashboard/projects/${projectId}`,
    MULTI_PROJECT: "/dashboard/projects/multi",
    PROJECT_HEALTH: (projectId) => `/dashboard/projects/${projectId}/health`,
    CRITICAL_PATH: (projectId) =>
      `/dashboard/projects/${projectId}/critical-path`,
    PROJECT_RISKS: (projectId) => `/dashboard/projects/${projectId}/risks`,
    MY_DASHBOARD: "/dashboard/my-dashboard",
    USER_DASHBOARD: (userId) => `/dashboard/users/${userId}`,
    USER_PERFORMANCE: (userId) => `/dashboard/users/${userId}/performance`,
    USER_PROJECTS: (userId) => `/dashboard/users/${userId}/projects`,
    USER_WORKLOAD: (userId) => `/dashboard/users/${userId}/workload`,
    COMPANY: "/dashboard/company",
    COMPANY_METRICS: "/dashboard/company/metrics",
    ACTIVE_PROJECTS: "/dashboard/company/active-projects",
    RESOURCE_UTILIZATION: "/dashboard/company/resource-utilization",
    NODE_DASHBOARD: (nodeId) => `/dashboard/nodes/${nodeId}`,
    NODE_METRICS: (nodeId) => `/dashboard/nodes/${nodeId}/metrics`,
    NODE_ACTIVITIES: (nodeId) => `/dashboard/nodes/${nodeId}/activities`,
    NODE_COMPLETION_TREND: (nodeId) =>
      `/dashboard/nodes/${nodeId}/completion-trend`,
    RECENT_ACTIVITIES: "/dashboard/activities/recent",
    PROJECT_ACTIVITIES: (projectId) =>
      `/dashboard/activities/projects/${projectId}`,
    USER_ACTIVITIES: (userId) => `/dashboard/activities/users/${userId}`,
    ACTIVITIES_BY_TYPE: "/dashboard/activities/by-type",
    OVERALL_PERFORMANCE: "/dashboard/performance/overall",
    PROJECT_PERFORMANCE: (projectId) =>
      `/dashboard/performance/projects/${projectId}`,
    TEAM_PERFORMANCE: "/dashboard/performance/team",
    RESOURCE_UTILIZATION_REPORT: "/dashboard/performance/resource-utilization",
    FINANCIAL: (projectId) => `/dashboard/financial/${projectId}`,
    BUDGET_ANALYSIS: (projectId) =>
      `/dashboard/financial/${projectId}/budget-analysis`,
    COST_VARIANCE: (projectId) =>
      `/dashboard/financial/${projectId}/cost-variance`,
    FINANCIAL_TRENDS: (projectId) => `/dashboard/financial/${projectId}/trends`,
    UPCOMING_MILESTONES: "/dashboard/milestones/upcoming",
    PROJECT_MILESTONES: (projectId) =>
      `/dashboard/milestones/projects/${projectId}`,
    TIMELINE_ANALYSIS: (projectId) => `/dashboard/timeline/${projectId}`,
    DELAYED_NODES: (projectId) =>
      `/dashboard/timeline/${projectId}/delayed-nodes`,
    QUALITY_METRICS: (projectId) => `/dashboard/quality/${projectId}`,
    QUALITY_ISSUES: (projectId) => `/dashboard/quality/${projectId}/issues`,
    DEFECT_ANALYSIS: (projectId) =>
      `/dashboard/quality/${projectId}/defect-analysis`,
    CUSTOM_REPORT: "/dashboard/reports/custom",
    KPI_REPORT: (projectId) => `/dashboard/reports/kpi/${projectId}`,
    EXECUTIVE_SUMMARY: (projectId) =>
      `/dashboard/reports/executive-summary/${projectId}`,
  },
};

// HTTP Methods
export const HTTP_METHODS = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  PATCH: "PATCH",
  DELETE: "DELETE",
};

// User Types
export const USER_TYPES = {
  USER: "User",
  STAKEHOLDER: "Stakeholder",
};

// User Roles
export const USER_ROLES = {
  ADMIN: "Admin",
  PROJECT_MANAGER: "ProjectManager",
  ENGINEER: "Engineer",
  USER: "User",
  VIEWER: "Viewer",
  CONTRACTOR: "Contractor",
};

// Task Status
export const TASK_STATUS = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

// Task Priority
export const TASK_PRIORITY = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

// Node Status
export const NODE_STATUS = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

// Assignment Types
// Assignment Types
export const ASSIGNMENT_TYPES = {
  PRIMARY: "Primary",
  SECONDARY: "Secondary",
  CONSULTANT: "Consultant",
  VIEWER: "Viewer",
  EDITOR: "Editor",
};

// Assignee Types
export const ASSIGNEE_TYPES = {
  USER: "USER",
  STAKEHOLDER: "STAKEHOLDER",
};

// Assignment Status
export const ASSIGNMENT_STATUS = {
  ACTIVE: "Active",
  COMPLETED: "Completed",
  SUSPENDED: "Suspended",
  CANCELLED: "Cancelled",
};

// Chat Types
export const CHAT_TYPES = {
  GENERAL: "General",
  NODE_SPECIFIC: "NodeSpecific",
  PROJECT_WIDE: "ProjectWide",
  DIRECT: "Direct",
};

// Message Types
export const MESSAGE_TYPES = {
  TEXT: "Text",
  IMAGE: "Image",
  FILE: "File",
  SYSTEM: "System",
};

// Dependency Types
export const DEPENDENCY_TYPES = {
  MUST_FINISH_BEFORE: "Must Finish Before",
  CAN_START_AFTER: "Can Start After",
  MUST_START_TOGETHER: "Must Start Together",
};

// Pagination Defaults
export const PAGINATION = {
  DEFAULT_PAGE: 0,
  DEFAULT_SIZE: 20,
  DEFAULT_SORT: "insertDate",
  DEFAULT_DIRECTION: "DESC",
};

// Channel constants for validation
export const NOTIFICATION_CHANNELS = {
  IN_APP: "InApp",
  PUSH: "Push",
  EMAIL: "Email",
  SMS: "SMS",
};

// Default channel combinations for different interfaces
export const CHANNEL_PRESETS = {
  WEB_INTERFACE: "InApp", // Web app shows only InApp notifications
  MOBILE_INTERFACE: "InApp,Push", // Mobile might show both InApp and Push
  ADMIN_ALL: "InApp,Push,Email,SMS", // Admin interface can see all channels
  EMAIL_ONLY: "Email", // Email-specific views
  PUSH_ONLY: "Push", // Push-specific views
};

export const UNIT_TYPES = {
  LENGTH: "Length",
  WEIGHT: "Weight",
  VOLUME: "Volume",
  AREA: "Area",
  TIME: "Time",
  QUANTITY: "Quantity",
  CURRENCY: "Currency",
};

// Unit Categories
export const UNIT_CATEGORIES = {
  METRIC: "Metric",
  IMPERIAL: "Imperial",
  INDIAN: "Indian",
  CUSTOM: "Custom",
};

// Item Status
export const ITEM_STATUS = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  DRAFT: "Draft",
  DISCONTINUED: "Discontinued",
};

// Location Types
export const LOCATION_TYPES = {
  WAREHOUSE: "Warehouse",
  STORE: "Store",
  OFFICE: "Office",
  SITE: "Site",
  FACTORY: "Factory",
  GODOWN: "Godown",
};

// Location Status
export const LOCATION_STATUS = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  UNDER_CONSTRUCTION: "Under Construction",
  MAINTENANCE: "Maintenance",
};

// Vendor Status
export const VENDOR_STATUS = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  SUSPENDED: "Suspended",
  BLACKLISTED: "Blacklisted",
};

// Vendor Approval Status
export const VENDOR_APPROVAL_STATUS = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  UNDER_REVIEW: "Under Review",
};

// Indent Status
export const INDENT_STATUS = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  PROCESSING: "Processing",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

// Indent Approval Status
export const INDENT_APPROVAL_STATUS = {
  PENDING: "Pending",
  IN_PROGRESS: "InProgress",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

// Indent Procurement Status
export const INDENT_PROCUREMENT_STATUS = {
  OPEN: "Open",
  PARTIALLY_PROCESSED: "PartiallyProcessed",
  FULLY_PROCESSED: "FullyProcessed",
  CANCELLED: "Cancelled",
  CLOSED: "Closed",
};

// Indent Priority
export const INDENT_PRIORITY = {
  URGENT: "Urgent",
  HIGH: "High",
  NORMAL: "Normal",
  LOW: "Low",
};

// Indent Item Processing Status
export const INDENT_ITEM_STATUS = {
  PENDING: "Pending",
  IN_RFQ: "InRFQ",
  QUOTED: "Quoted",
  ORDERED: "Ordered",
  RECEIVED: "Received",
  CLOSED: "Closed",
};
