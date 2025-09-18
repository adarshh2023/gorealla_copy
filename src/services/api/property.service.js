// src/services/api/property.service.js
import { api } from 'boot/axios'
import { API_ENDPOINTS } from 'src/constants/api.constants'

class PropertyService {
  // ===== Property Definition Management =====

  /**
   * Create property definition
   * @param {Object} propertyData - Property definition data
   * @returns {Promise<Object>} Created property definition
   */
  async createPropertyDefinition(propertyData) {
    return await api.post(API_ENDPOINTS.PROPERTIES.DEFINITIONS, propertyData)
  }

  /**
   * Get property definition by ID
   * @param {string} propertyDefId - Property definition ID
   * @returns {Promise<Object>} Property definition
   */
  async getPropertyDefinitionById(propertyDefId) {
    return await api.get(API_ENDPOINTS.PROPERTIES.DEFINITION_BY_ID(propertyDefId))
  }

  /**
   * Update property definition
   * @param {string} propertyDefId - Property definition ID
   * @param {Object} propertyData - Updated property data
   * @returns {Promise<Object>} Updated property definition
   */
  async updatePropertyDefinition(propertyDefId, propertyData) {
    return await api.put(API_ENDPOINTS.PROPERTIES.DEFINITION_BY_ID(propertyDefId), propertyData)
  }

  /**
   * Delete property definition
   * @param {string} propertyDefId - Property definition ID
   * @returns {Promise<void>}
   */
  async deletePropertyDefinition(propertyDefId) {
    return await api.delete(API_ENDPOINTS.PROPERTIES.DEFINITION_BY_ID(propertyDefId))
  }

  /**
   * Get global property definitions
   * @returns {Promise<Array>} Global properties
   */
  async getGlobalPropertyDefinitions() {
    return await api.get(API_ENDPOINTS.PROPERTIES.GLOBAL_DEFINITIONS)
  }

  /**
   * Get property definitions by node type
   * @param {string} nodeTypeId - Node type ID
   * @returns {Promise<Array>} Property definitions
   */
  async getPropertyDefinitionsByNodeType(nodeTypeId) {
    return await api.get(API_ENDPOINTS.PROPERTIES.BY_NODE_TYPE(nodeTypeId))
  }

  /**
   * Get all properties for node type (including global)
   * @param {string} nodeTypeId - Node type ID
   * @returns {Promise<Array>} All properties
   */
  async getPropertiesForNodeType(nodeTypeId) {
    return await api.get(API_ENDPOINTS.PROPERTIES.ALL_FOR_NODE_TYPE(nodeTypeId))
  }

  /**
   * Get grouped properties for node type
   * @param {string} nodeTypeId - Node type ID
   * @returns {Promise<Array>} Grouped properties
   */
  async getGroupedPropertiesForNodeType(nodeTypeId) {
    return await api.get(API_ENDPOINTS.PROPERTIES.GROUPED_FOR_NODE_TYPE(nodeTypeId))
  }

  // ===== Node Property Management =====

  /**
   * Set single node property
   * @param {string} nodeId - Node ID
   * @param {string} propertyDefId - Property definition ID
   * @param {*} value - Property value
   * @returns {Promise<Object>} Node property
   */
  async setNodeProperty(nodeId, propertyDefId, value) {
    return await api.post(API_ENDPOINTS.PROPERTIES.SET_NODE_PROPERTY(nodeId), value, {
      params: { propertyDefId }
    })
  }

  /**
   * Set multiple node properties
   * @param {string} nodeId - Node ID
   * @param {Object} bulkData - Bulk property update data
   * @returns {Promise<void>}
   */
  async setNodeProperties(nodeId, bulkData) {
    return await api.post(API_ENDPOINTS.PROPERTIES.BULK_UPDATE(nodeId), bulkData)
  }

  /**
   * Get specific node property
   * @param {string} nodeId - Node ID
   * @param {string} propertyDefId - Property definition ID
   * @returns {Promise<Object>} Node property
   */
  async getNodeProperty(nodeId, propertyDefId) {
    return await api.get(API_ENDPOINTS.PROPERTIES.GET_NODE_PROPERTY(nodeId, propertyDefId))
  }

  /**
   * Get all properties for a node
   * @param {string} nodeId - Node ID
   * @returns {Promise<Array>} Node properties
   */
  async getNodeProperties(nodeId) {
    return await api.get(API_ENDPOINTS.PROPERTIES.NODE_PROPERTIES(nodeId))
  }

  /**
   * Get node properties as map
   * @param {string} nodeId - Node ID
   * @returns {Promise<Object>} Properties map
   */
  async getNodePropertiesAsMap(nodeId) {
    return await api.get(API_ENDPOINTS.PROPERTIES.NODE_PROPERTIES_MAP(nodeId))
  }

  /**
   * Delete node property
   * @param {string} nodeId - Node ID
   * @param {string} propertyDefId - Property definition ID
   * @returns {Promise<void>}
   */
  async deleteNodeProperty(nodeId, propertyDefId) {
    return await api.delete(API_ENDPOINTS.PROPERTIES.DELETE_NODE_PROPERTY(nodeId, propertyDefId))
  }

  // ===== Property Validation =====

  /**
   * Validate property value
   * @param {string} propertyDefId - Property definition ID
   * @param {*} value - Value to validate
   * @returns {Promise<Object>} Validation result
   */
  async validatePropertyValue(propertyDefId, value) {
    return await api.post(API_ENDPOINTS.PROPERTIES.VALIDATE, value, {
      params: { propertyDefId }
    })
  }

  /**
   * Validate all node properties
   * @param {string} nodeId - Node ID
   * @returns {Promise<Object>} Validation result
   */
  async validateNodeProperties(nodeId) {
    return await api.get(API_ENDPOINTS.PROPERTIES.VALIDATE_NODE(nodeId))
  }

  /**
   * Check if node has all required properties
   * @param {string} nodeId - Node ID
   * @returns {Promise<Object>} Check result
   */
  async hasAllRequiredProperties(nodeId) {
    return await api.get(API_ENDPOINTS.PROPERTIES.HAS_REQUIRED(nodeId))
  }

  // ===== Property Search =====

  /**
   * Search properties by value
   * @param {string} propertyType - Property type
   * @param {string} value - Search value
   * @returns {Promise<Array>} Search results
   */
  async searchPropertiesByValue(propertyType, value) {
    return await api.get(API_ENDPOINTS.PROPERTIES.SEARCH, {
      params: { propertyType, value }
    })
  }

  /**
   * Check property name uniqueness
   * @param {string} propertyName - Property name
   * @param {string} nodeTypeId - Node type ID (optional)
   * @returns {Promise<Object>} Uniqueness check result
   */
  async checkPropertyNameUniqueness(propertyName, nodeTypeId = null) {
    const params = { propertyName }
    if (nodeTypeId) params.nodeTypeId = nodeTypeId

    return await api.get(API_ENDPOINTS.PROPERTIES.CHECK_NAME, { params })
  }

  // ===== Utility Methods =====

  /**
   * Get property type icon
   * @param {string} propertyType - Property type
   * @returns {string} Icon name
   */
  getPropertyTypeIcon(propertyType) {
    const iconMap = {
      'Text': 'text_fields',
      'Number': 'pin',
      'Date': 'event',
      'Boolean': 'toggle_on',
      'Dropdown': 'arrow_drop_down',
      'Currency': 'attach_money',
      'Email': 'email',
      'Phone': 'phone'
    }

    return iconMap[propertyType] || 'help'
  }

  /**
   * Format property value for display
   * @param {*} value - Property value
   * @param {string} propertyType - Property type
   * @param {string} propertyUnit - Property unit (optional)
   * @returns {string} Formatted value
   */
  formatPropertyValue(value, propertyType, propertyUnit = '') {
    if (value === null || value === undefined) return '-'

    switch (propertyType) {
      case 'Boolean':
        return value ? 'Yes' : 'No'

      case 'Date':
        return new Date(value).toLocaleDateString()

      case 'Currency':
        return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR'
        }).format(value)

      case 'Number':
        { const formatted = new Intl.NumberFormat('en-IN').format(value)
        return propertyUnit ? `${formatted} ${propertyUnit}` : formatted }

      case 'Email':
        return value.toLowerCase()

      case 'Phone':
        return this.formatPhoneNumber(value)

      default:
        return String(value)
    }
  }

  /**
   * Format phone number
   * @param {string} phone - Phone number
   * @returns {string} Formatted phone
   */
  formatPhoneNumber(phone) {
    if (!phone) return ''

    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '')

    // Indian phone number format
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`
    } else if (cleaned.length === 10) {
      return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`
    }

    return phone
  }

  /**
   * Build property form field
   * @param {Object} propertyDef - Property definition
   * @returns {Object} Form field configuration
   */
  buildPropertyFormField(propertyDef) {
    const baseField = {
      name: propertyDef.propertyName,
      label: propertyDef.propertyDisplayName || propertyDef.propertyName,
      required: propertyDef.isRequired,
      hint: propertyDef.helpText,
      rules: []
    }

    // Add required rule
    if (propertyDef.isRequired) {
      baseField.rules.push(val => !!val || `${baseField.label} is required`)
    }

    // Add validation rules based on type
    switch (propertyDef.propertyType) {
      case 'Text':
        baseField.type = 'text'
        if (propertyDef.validationRules?.maxLength) {
          baseField.maxlength = propertyDef.validationRules.maxLength
          baseField.rules.push(
            val => !val || val.length <= propertyDef.validationRules.maxLength ||
            `Maximum ${propertyDef.validationRules.maxLength} characters`
          )
        }
        if (propertyDef.validationRules?.regex) {
          const regex = new RegExp(propertyDef.validationRules.regex)
          baseField.rules.push(
            val => !val || regex.test(val) || 'Invalid format'
          )
        }
        break

      case 'Number':
        baseField.type = 'number'
        if (propertyDef.validationRules?.min !== undefined) {
          baseField.min = propertyDef.validationRules.min
          baseField.rules.push(
            val => val === null || val === undefined || val >= propertyDef.validationRules.min ||
            `Minimum value is ${propertyDef.validationRules.min}`
          )
        }
        if (propertyDef.validationRules?.max !== undefined) {
          baseField.max = propertyDef.validationRules.max
          baseField.rules.push(
            val => val === null || val === undefined || val <= propertyDef.validationRules.max ||
            `Maximum value is ${propertyDef.validationRules.max}`
          )
        }
        if (propertyDef.propertyUnit) {
          baseField.suffix = propertyDef.propertyUnit
        }
        break

      case 'Date':
        baseField.type = 'date'
        break

      case 'Boolean':
        baseField.type = 'toggle'
        break

      case 'Dropdown':
        baseField.type = 'select'
        baseField.options = propertyDef.validationRules?.options || []
        break

      case 'Currency':
        baseField.type = 'number'
        baseField.prefix = '₹'
        baseField.rules.push(
          val => val === null || val === undefined || val >= 0 || 'Amount must be positive'
        )
        break

      case 'Email':
        baseField.type = 'email'
        baseField.rules.push(
          val => !val || /^\S+@\S+\.\S+$/.test(val) || 'Invalid email format'
        )
        break

      case 'Phone':
        baseField.type = 'tel'
        baseField.mask = '##########'
        baseField.rules.push(
          val => !val || /^[0-9]{10}$/.test(val) || 'Invalid phone number'
        )
        break
    }

    return baseField
  }

  /**
   * Group properties by group
   * @param {Array} properties - Properties array
   * @returns {Object} Grouped properties
   */
  groupPropertiesByGroup(properties) {
    const groups = {}

    properties.forEach(prop => {
      const group = prop.propertyGroup || 'General'
      if (!groups[group]) {
        groups[group] = []
      }
      groups[group].push(prop)
    })

    // Sort properties within each group by displayOrder
    Object.keys(groups).forEach(group => {
      groups[group].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
    })

    return groups
  }

  /**
   * Get property value from node
   * @param {Object} node - Node object
   * @param {string} propertyName - Property name
   * @returns {*} Property value
   */
  getPropertyValue(node, propertyName) {
    // First check structured properties
    if (node.properties && Array.isArray(node.properties)) {
      const prop = node.properties.find(p => p.propertyName === propertyName)
      if (prop) {
        return prop.textValue || prop.numericValue || prop.dateValue || prop.booleanValue
      }
    }

    // Then check custom properties (JSON)
    if (node.customProperties && typeof node.customProperties === 'object') {
      return node.customProperties[propertyName]
    }

    return null
  }
}

export default new PropertyService()
