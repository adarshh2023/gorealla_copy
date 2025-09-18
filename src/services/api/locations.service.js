/* eslint-disable no-useless-catch */
// src/services/api/locations.service.js
import { api } from 'boot/axios'
import { API_ENDPOINTS, PAGINATION } from 'src/constants/api.constants'

class LocationsService {

  /**
   * Create new location
   * @param {Object} locationData - Location creation data
   * @returns {Promise<Object>} Created location
   */
  async createLocation(locationData) {
    try {
      const response = await api.post(API_ENDPOINTS.LOCATIONS.BASE, locationData)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get location by ID
   * @param {string} locationId - Location ID
   * @returns {Promise<Object>} Location data
   */
  async getLocationById(locationId) {
    try {
      const response = await api.get(API_ENDPOINTS.LOCATIONS.BY_ID(locationId))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Update location
   * @param {string} locationId - Location ID
   * @param {Object} locationData - Updated location data
   * @returns {Promise<Object>} Updated location
   */
  async updateLocation(locationId, locationData) {
    try {
      const response = await api.put(API_ENDPOINTS.LOCATIONS.BY_ID(locationId), locationData)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Delete location
   * @param {string} locationId - Location ID
   * @returns {Promise<void>}
   */
  async deleteLocation(locationId) {
    try {
      await api.delete(API_ENDPOINTS.LOCATIONS.BY_ID(locationId))
    } catch (error) {
      throw error
    }
  }

  /**
   * Get all locations with pagination
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Paginated locations
   */
  async getAllLocations(params = {}) {
    try {
      const queryParams = {
        page: params.page || PAGINATION.DEFAULT_PAGE,
        size: params.size || PAGINATION.DEFAULT_SIZE,
        sort: `${params.sort || 'locationName'},${params.direction || 'ASC'}`
      }

      const response = await api.get(API_ENDPOINTS.LOCATIONS.BASE, { params: queryParams })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Search locations with filters
   * @param {string} searchTerm - Search term
   * @param {Object} filters - Search filters
   * @param {Object} params - Pagination parameters
   * @returns {Promise<Object>} Search results
   */
  async searchLocations(searchTerm, filters = {}, params = {}) {
    try {
      const queryParams = {
        searchTerm,
        page: params.page || PAGINATION.DEFAULT_PAGE,
        size: params.size || PAGINATION.DEFAULT_SIZE,
        sort: `${params.sort || 'locationName'},${params.direction || 'ASC'}`,
        ...filters
      }

      const response = await api.get(API_ENDPOINTS.LOCATIONS.SEARCH, { params: queryParams })
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get locations by type
   * @param {string} locationType - Location type
   * @returns {Promise<Array>} Locations array
   */
  async getLocationsByType(locationType) {
    try {
      const response = await api.get(API_ENDPOINTS.LOCATIONS.BY_TYPE(locationType))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get locations by status
   * @param {string} locationStatus - Location status
   * @returns {Promise<Array>} Locations array
   */
  async getLocationsByStatus(locationStatus) {
    try {
      const response = await api.get(API_ENDPOINTS.LOCATIONS.BY_STATUS(locationStatus))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get locations by city
   * @param {string} city - City name
   * @returns {Promise<Array>} Locations array
   */
  async getLocationsByCity(city) {
    try {
      const response = await api.get(API_ENDPOINTS.LOCATIONS.BY_CITY(city))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get locations by state
   * @param {string} state - State name
   * @returns {Promise<Array>} Locations array
   */
  async getLocationsByState(state) {
    try {
      const response = await api.get(API_ENDPOINTS.LOCATIONS.BY_STATE(state))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get locations by pin code
   * @param {string} pinCode - Pin code
   * @returns {Promise<Array>} Locations array
   */
  async getLocationsByPinCode(pinCode) {
    try {
      const response = await api.get(API_ENDPOINTS.LOCATIONS.BY_PINCODE(pinCode))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get inventory locations
   * @returns {Promise<Array>} Inventory locations array
   */
  async getInventoryLocations() {
    try {
      const response = await api.get(API_ENDPOINTS.LOCATIONS.INVENTORY_LOCATIONS)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get receiving locations
   * @returns {Promise<Array>} Receiving locations array
   */
  async getReceivingLocations() {
    try {
      const response = await api.get(API_ENDPOINTS.LOCATIONS.RECEIVING_LOCATIONS)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get issuing locations
   * @returns {Promise<Array>} Issuing locations array
   */
  async getIssuingLocations() {
    try {
      const response = await api.get(API_ENDPOINTS.LOCATIONS.ISSUING_LOCATIONS)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get root locations (locations without parent)
   * @returns {Promise<Array>} Root locations array
   */
  async getRootLocations() {
    try {
      const response = await api.get(API_ENDPOINTS.LOCATIONS.ROOT_LOCATIONS)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get children of a location
   * @param {string} locationId - Parent location ID
   * @returns {Promise<Array>} Child locations array
   */
  async getLocationChildren(locationId) {
    try {
      const response = await api.get(API_ENDPOINTS.LOCATIONS.CHILDREN(locationId))
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get location statistics
   * @returns {Promise<Object>} Location statistics
   */
  async getLocationStatistics() {
    try {
      const response = await api.get(API_ENDPOINTS.LOCATIONS.STATISTICS)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get location count by type
   * @returns {Promise<Object>} Count by type
   */
  async getLocationCountByType() {
    try {
      const response = await api.get(API_ENDPOINTS.LOCATIONS.COUNT_BY_TYPE)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Get location count by status
   * @returns {Promise<Object>} Count by status
   */
  async getLocationCountByStatus() {
    try {
      const response = await api.get(API_ENDPOINTS.LOCATIONS.COUNT_BY_STATUS)
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * Build location hierarchy tree
   * @param {Array} locations - Locations array
   * @returns {Array} Tree structure
   */
  buildLocationTree(locations) {
    const locationMap = new Map()
    const rootLocations = []

    // Create map for quick lookup
    locations.forEach(location => {
      locationMap.set(location.recCode, { ...location, children: [] })
    })

    // Build tree structure
    locations.forEach(location => {
      const locationNode = locationMap.get(location.recCode)

      if (location.parentLocationId) {
        const parent = locationMap.get(location.parentLocationId)
        if (parent) {
          parent.children.push(locationNode)
        }
      } else {
        rootLocations.push(locationNode)
      }
    })

    return rootLocations
  }

  /**
   * Get location path (breadcrumb)
   * @param {string} locationId - Location ID
   * @param {Array} allLocations - All locations for building path
   * @returns {Array} Location path
   */
  getLocationPath(locationId, allLocations) {
    const path = []
    let currentLocation = allLocations.find(loc => loc.recCode === locationId)

    while (currentLocation) {
      path.unshift(currentLocation)
      currentLocation = currentLocation.parentLocationId
        ? allLocations.find(loc => loc.recCode === currentLocation.parentLocationId)
        : null
    }

    return path
  }

  /**
   * Format location display name with hierarchy indication
   * @param {Object} location - Location object
   * @returns {string} Formatted display name
   */
  formatLocationDisplayName(location) {
    if (!location) return ''

    const prefix = location.parentLocationId ? '— ' : ''
    return location.locationCode
      ? `${prefix}${location.locationName} (${location.locationCode})`
      : `${prefix}${location.locationName}`
  }

  /**
   * Get location type icon
   * @param {string} locationType - Location type
   * @returns {string} Icon name
   */
  getLocationTypeIcon(locationType) {
    const iconMap = {
      'Warehouse': 'warehouse',
      'Store': 'store',
      'Office': 'business',
      'Site': 'location_on',
      'Factory': 'precision_manufacturing',
      'Godown': 'inventory_2',
      'Project': 'apartment',
      'Department': 'domain'
    }
    return iconMap[locationType] || 'place'
  }

  /**
   * Get location status color
   * @param {string} status - Location status
   * @returns {string} Color name
   */
  getLocationStatusColor(status) {
    const colorMap = {
      'Active': 'positive',
      'Inactive': 'grey',
      'Under Construction': 'warning',
      'Maintenance': 'info'
    }
    return colorMap[status] || 'grey'
  }

  /**
   * Get security level color
   * @param {string} securityLevel - Security level
   * @returns {string} Color name
   */
  getSecurityLevelColor(securityLevel) {
    const colorMap = {
      'High': 'negative',
      'Standard': 'primary',
      'Basic': 'warning'
    }
    return colorMap[securityLevel] || 'grey'
  }

  /**
   * Get location capabilities
   * @param {Object} location - Location object
   * @returns {Array} Capabilities array
   */
  getLocationCapabilities(location) {
    const capabilities = []

    if (location.isInventoryLocation) {
      capabilities.push({ label: 'Inventory', icon: 'inventory', color: 'primary' })
    }
    if (location.isReceivingLocation) {
      capabilities.push({ label: 'Receiving', icon: 'local_shipping', color: 'positive' })
    }
    if (location.isIssuingLocation) {
      capabilities.push({ label: 'Issuing', icon: 'launch', color: 'info' })
    }

    return capabilities
  }

  /**
   * Format storage capacity
   * @param {number} capacity - Storage capacity
   * @param {string} unit - Unit (optional)
   * @returns {string} Formatted capacity
   */
  formatStorageCapacity(capacity, unit = 'sq ft') {
    if (!capacity) return 'N/A'
    return `${parseFloat(capacity).toLocaleString('en-IN')} ${unit}`
  }

  /**
   * Validate location hierarchy
   * @param {Object} locationData - Location data to validate
   * @param {Array} existingLocations - Existing locations
   * @returns {Object} Validation result
   */
  validateLocationHierarchy(locationData, existingLocations) {
    const errors = []

    // Check if parent exists
    if (locationData.parentLocationId) {
      const parent = existingLocations.find(loc => loc.recCode === locationData.parentLocationId)
      if (!parent) {
        errors.push('Parent location does not exist')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Check if location is a leaf node
   * @param {Object} location - Location object
   * @param {Array} allLocations - All locations
   * @returns {boolean} Is leaf flag
   */
  isLocationLeaf(location, allLocations) {
    return !allLocations.some(loc => loc.parentLocationId === location.recCode)
  }

  /**
   * Get location coordinates
   * @param {Object} location - Location object
   * @returns {Object|null} Coordinates object
   */
  getLocationCoordinates(location) {
    if (location.latitude && location.longitude) {
      return {
        lat: parseFloat(location.latitude),
        lng: parseFloat(location.longitude)
      }
    }
    return null
  }

  /**
   * Calculate distance between two locations
   * @param {Object} location1 - First location
   * @param {Object} location2 - Second location
   * @returns {number|null} Distance in kilometers
   */
  calculateDistance(location1, location2) {
    const coords1 = this.getLocationCoordinates(location1)
    const coords2 = this.getLocationCoordinates(location2)

    if (!coords1 || !coords2) return null

    const R = 6371 // Radius of the Earth in kilometers
    const dLat = this.deg2rad(coords2.lat - coords1.lat)
    const dLon = this.deg2rad(coords2.lng - coords1.lng)

    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(coords1.lat)) * Math.cos(this.deg2rad(coords2.lat)) *
      Math.sin(dLon/2) * Math.sin(dLon/2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    const distance = R * c // Distance in kilometers

    return Math.round(distance * 100) / 100 // Round to 2 decimal places
  }

  /**
   * Convert degrees to radians
   * @param {number} deg - Degrees
   * @returns {number} Radians
   */
  deg2rad(deg) {
    return deg * (Math.PI/180)
  }

  /**
   * Format working hours
   * @param {Object} workingHours - Working hours object
   * @returns {string} Formatted working hours
   */
  formatWorkingHours(workingHours) {
    if (!workingHours || typeof workingHours !== 'object') {
      return 'Not specified'
    }

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    const formattedHours = []

    days.forEach(day => {
      const hours = workingHours[day]
      if (hours && hours.open && hours.close) {
        formattedHours.push(`${day.charAt(0).toUpperCase() + day.slice(1)}: ${hours.open} - ${hours.close}`)
      }
    })

    return formattedHours.length > 0 ? formattedHours.join(', ') : 'Not specified'
  }
}

export default new LocationsService()
