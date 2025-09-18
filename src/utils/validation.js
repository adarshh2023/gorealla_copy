// src/utils/validation.js

/**
 * Required field validation
 * @param {string} message - Error message
 * @returns {Function}
 */
export const required = (message = 'This field is required') => {
  return val => (val !== null && val !== undefined && val !== '') || message
}

/**
 * Email validation
 * @param {string} message - Error message
 * @returns {Function}
 */
export const email = (message = 'Please enter a valid email') => {
  return val => {
    if (!val) return true
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailPattern.test(val) || message
  }
}

/**
 * Mobile number validation (Indian format)
 * @param {string} message - Error message
 * @returns {Function}
 */
export const mobile = (message = 'Please enter a valid 10-digit mobile number') => {
  return val => {
    if (!val) return true
    const cleaned = val.replace(/\D/g, '')
    return (cleaned.length === 10 && /^[6-9]\d{9}$/.test(cleaned)) || message
  }
}

/**
 * Email or Mobile validation for stakeholders
 * @param {string} message - Error message
 * @returns {Function}
 */
export const emailOrMobile = (message = 'Please enter a valid email address or mobile number') => {
  return val => {
    if (!val) return true

    // Try email validation first
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (emailPattern.test(val)) return true

    // Try mobile validation
    const cleaned = val.replace(/\D/g, '')
    if (cleaned.length === 10 && /^[6-9]\d{9}$/.test(cleaned)) return true

    return message
  }
}

/**
 * Phone number validation (with country code)
 * @param {string} message - Error message
 * @returns {Function}
 */
export const phone = (message = 'Please enter a valid phone number') => {
  return val => {
    if (!val) return true
    const phonePattern = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,5}[-\s.]?[0-9]{1,5}$/
    return phonePattern.test(val) || message
  }
}

/**
 * Minimum length validation
 * @param {number} length - Minimum length
 * @param {string} message - Error message
 * @returns {Function}
 */
export const minLength = (length, message = null) => {
  return val => {
    if (!val) return true
    const msg = message || `Minimum ${length} characters required`
    return val.length >= length || msg
  }
}

/**
 * Maximum length validation
 * @param {number} length - Maximum length
 * @param {string} message - Error message
 * @returns {Function}
 */
export const maxLength = (length, message = null) => {
  return val => {
    if (!val) return true
    const msg = message || `Maximum ${length} characters allowed`
    return val.length <= length || msg
  }
}

/**
 * Between length validation
 * @param {number} min - Minimum length
 * @param {number} max - Maximum length
 * @param {string} message - Error message
 * @returns {Function}
 */
export const betweenLength = (min, max, message = null) => {
  return val => {
    if (!val) return true
    const msg = message || `Must be between ${min} and ${max} characters`
    return (val.length >= min && val.length <= max) || msg
  }
}

/**
 * Minimum value validation
 * @param {number} min - Minimum value
 * @param {string} message - Error message
 * @returns {Function}
 */
export const minValue = (min, message = null) => {
  return val => {
    if (val === null || val === undefined || val === '') return true
    const msg = message || `Minimum value is ${min}`
    return Number(val) >= min || msg
  }
}

/**
 * Maximum value validation
 * @param {number} max - Maximum value
 * @param {string} message - Error message
 * @returns {Function}
 */
export const maxValue = (max, message = null) => {
  return val => {
    if (val === null || val === undefined || val === '') return true
    const msg = message || `Maximum value is ${max}`
    return Number(val) <= max || msg
  }
}

/**
 * Between value validation
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {string} message - Error message
 * @returns {Function}
 */
export const betweenValue = (min, max, message = null) => {
  return val => {
    if (val === null || val === undefined || val === '') return true
    const msg = message || `Value must be between ${min} and ${max}`
    const num = Number(val)
    return (num >= min && num <= max) || msg
  }
}

/**
 * Pattern validation
 * @param {RegExp} pattern - Regular expression pattern
 * @param {string} message - Error message
 * @returns {Function}
 */
export const pattern = (pattern, message = 'Invalid format') => {
  return val => {
    if (!val) return true
    return pattern.test(val) || message
  }
}

/**
 * Alpha only validation
 * @param {string} message - Error message
 * @returns {Function}
 */
export const alpha = (message = 'Only alphabets allowed') => {
  return val => {
    if (!val) return true
    return /^[a-zA-Z]+$/.test(val) || message
  }
}

/**
 * Alphanumeric validation
 * @param {string} message - Error message
 * @returns {Function}
 */
export const alphaNum = (message = 'Only alphabets and numbers allowed') => {
  return val => {
    if (!val) return true
    return /^[a-zA-Z0-9]+$/.test(val) || message
  }
}

/**
 * Numeric validation
 * @param {string} message - Error message
 * @returns {Function}
 */
export const numeric = (message = 'Only numbers allowed') => {
  return val => {
    if (!val) return true
    return /^\d+$/.test(val) || message
  }
}

/**
 * Decimal validation
 * @param {number} decimals - Number of decimal places
 * @param {string} message - Error message
 * @returns {Function}
 */
export const decimal = (decimals = 2, message = null) => {
  return val => {
    if (!val) return true
    const msg = message || `Only ${decimals} decimal places allowed`
    const pattern = new RegExp(`^\\d+(\\.\\d{0,${decimals}})?$`)
    return pattern.test(val) || msg
  }
}

/**
 * URL validation
 * @param {string} message - Error message
 * @returns {Function}
 */
export const url = (message = 'Please enter a valid URL') => {
  return val => {
    if (!val) return true
    try {
      new URL(val)
      return true
    } catch {
      return message
    }
  }
}

/**
 * Strong password validation
 * @param {string} message - Error message
 * @returns {Function}
 */
export const strongPassword = (message = null) => {
  return val => {
    if (!val) return true
    const msg = message || 'Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character'
    const strongPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    return strongPattern.test(val) || msg
  }
}

/**
 * Match field validation
 * @param {Function} getOtherValue - Function to get other field value
 * @param {string} fieldName - Field name to match
 * @param {string} message - Error message
 * @returns {Function}
 */
export const matchField = (getOtherValue, fieldName, message = null) => {
  return val => {
    const otherValue = getOtherValue()
    const msg = message || `Must match ${fieldName}`
    return val === otherValue || msg
  }
}

/**
 * Date validation
 * @param {string} message - Error message
 * @returns {Function}
 */
export const date = (message = 'Please enter a valid date') => {
  return val => {
    if (!val) return true
    const dateVal = new Date(val)
    return (!isNaN(dateVal.getTime())) || message
  }
}

/**
 * Future date validation
 * @param {string} message - Error message
 * @returns {Function}
 */
export const futureDate = (message = 'Date must be in the future') => {
  return val => {
    if (!val) return true
    const dateVal = new Date(val)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return dateVal > today || message
  }
}

/**
 * Past date validation
 * @param {string} message - Error message
 * @returns {Function}
 */
export const pastDate = (message = 'Date must be in the past') => {
  return val => {
    if (!val) return true
    const dateVal = new Date(val)
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    return dateVal < today || message
  }
}

/**
 * Age validation
 * @param {number} minAge - Minimum age
 * @param {string} message - Error message
 * @returns {Function}
 */
export const minAge = (minAge, message = null) => {
  return val => {
    if (!val) return true
    const msg = message || `Must be at least ${minAge} years old`
    const birthDate = new Date(val)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    return age >= minAge || msg
  }
}

/**
 * File size validation
 * @param {number} maxSize - Maximum size in MB
 * @param {string} message - Error message
 * @returns {Function}
 */
export const fileSize = (maxSize, message = null) => {
  return val => {
    if (!val) return true
    const msg = message || `File size must not exceed ${maxSize}MB`
    const sizeInMB = val.size / (1024 * 1024)
    return sizeInMB <= maxSize || msg
  }
}

/**
 * File type validation
 * @param {Array<string>} allowedTypes - Allowed file extensions
 * @param {string} message - Error message
 * @returns {Function}
 */
export const fileType = (allowedTypes, message = null) => {
  return val => {
    if (!val) return true
    const msg = message || `Allowed file types: ${allowedTypes.join(', ')}`
    const extension = val.name.split('.').pop().toLowerCase()
    return allowedTypes.includes(extension) || msg
  }
}

/**
 * GST number validation (Indian)
 * @param {string} message - Error message
 * @returns {Function}
 */
export const gstNumber = (message = 'Please enter a valid GST number') => {
  return val => {
    if (!val) return true
    const gstPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
    return gstPattern.test(val) || message
  }
}

/**
 * PAN number validation (Indian)
 * @param {string} message - Error message
 * @returns {Function}
 */
export const panNumber = (message = 'Please enter a valid PAN number') => {
  return val => {
    if (!val) return true
    const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
    return panPattern.test(val) || message
  }
}

/**
 * Aadhaar number validation (Indian)
 * @param {string} message - Error message
 * @returns {Function}
 */
export const aadhaarNumber = (message = 'Please enter a valid 12-digit Aadhaar number') => {
  return val => {
    if (!val) return true
    const cleaned = val.replace(/\s/g, '')
    return (cleaned.length === 12 && /^\d{12}$/.test(cleaned)) || message
  }
}

/**
 * Pincode validation (Indian)
 * @param {string} message - Error message
 * @returns {Function}
 */
export const pincode = (message = 'Please enter a valid 6-digit pincode') => {
  return val => {
    if (!val) return true
    return /^[1-9][0-9]{5}$/.test(val) || message
  }
}

/**
 * Custom validation
 * @param {Function} validator - Custom validator function
 * @param {string} message - Error message
 * @returns {Function}
 */
export const custom = (validator, message = 'Invalid value') => {
  return val => validator(val) || message
}

/**
 * Combine multiple validation rules
 * @param {...Function} rules - Validation rules
 * @returns {Array<Function>}
 */
export const combine = (...rules) => rules

/**
 * Create conditional validation
 * @param {Function} condition - Condition function
 * @param {Function} rule - Validation rule
 * @returns {Function}
 */
export const when = (condition, rule) => {
  return val => {
    if (!condition(val)) return true
    return rule(val)
  }
}

// ===== INPUT DETECTION UTILITIES =====

/**
 * Detect if input is an email
 * @param {string} input - Input string
 * @returns {boolean}
 */
export const isEmail = (input) => {
  if (!input) return false
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailPattern.test(input)
}

/**
 * Detect if input is a mobile number
 * @param {string} input - Input string
 * @returns {boolean}
 */
export const isMobile = (input) => {
  if (!input) return false
  const cleaned = input.replace(/\D/g, '')
  return cleaned.length === 10 && /^[6-9]\d{9}$/.test(cleaned)
}

/**
 * Detect input type for stakeholder authentication
 * @param {string} input - Input string
 * @returns {string} - 'email', 'mobile', or 'unknown'
 */
export const detectInputType = (input) => {
  if (!input) return 'unknown'

  if (isEmail(input)) return 'email'
  if (isMobile(input)) return 'mobile'

  return 'unknown'
}

/**
 * Get appropriate icon for input type
 * @param {string} input - Input string
 * @returns {string} - Icon name
 */
export const getInputIcon = (input) => {
  const type = detectInputType(input)

  switch (type) {
    case 'email':
      return 'email'
    case 'mobile':
      return 'phone'
    default:
      return 'person'
  }
}

/**
 * Get appropriate hint for input type
 * @param {string} input - Input string
 * @returns {string} - Hint message
 */
export const getInputHint = (input) => {
  if (!input) return 'Enter email address or mobile number'

  const type = detectInputType(input)

  switch (type) {
    case 'email':
      return 'Email address detected'
    case 'mobile':
      return 'Mobile number detected'
    default:
      return 'Please enter a valid email or mobile number'
  }
}

// Common validation rule sets
export const commonRules = {
  name: [
    required('Name is required'),
    minLength(2, 'Name must be at least 2 characters'),
    maxLength(50, 'Name must not exceed 50 characters'),
    pattern(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces')
  ],

  email: [
    required('Email is required'),
    email()
  ],

  mobile: [
    required('Mobile number is required'),
    mobile()
  ],

  emailOrMobile: [
    required('Email or mobile number is required'),
    emailOrMobile()
  ],

  password: [
    required('Password is required'),
    minLength(6, 'Password must be at least 6 characters')
  ],

  strongPassword: [
    required('Password is required'),
    minLength(8, 'Password must be at least 8 characters'),
    strongPassword()
  ],

  confirmPassword: (getPassword) => [
    required('Please confirm your password'),
    matchField(getPassword, 'password', 'Passwords do not match')
  ],

  amount: [
    required('Amount is required'),
    numeric('Please enter a valid amount'),
    minValue(0, 'Amount must be positive')
  ],

  percentage: [
    required('Percentage is required'),
    numeric('Please enter a valid percentage'),
    betweenValue(0, 100, 'Percentage must be between 0 and 100')
  ],

  date: [
    required('Date is required'),
    date()
  ],

  futureDate: [
    required('Date is required'),
    date(),
    futureDate()
  ],

  description: [
    maxLength(500, 'Description must not exceed 500 characters')
  ]
}

// Export all functions as default
export default {
  required,
  email,
  mobile,
  emailOrMobile,
  phone,
  minLength,
  maxLength,
  betweenLength,
  minValue,
  maxValue,
  betweenValue,
  pattern,
  alpha,
  alphaNum,
  numeric,
  decimal,
  url,
  strongPassword,
  matchField,
  date,
  futureDate,
  pastDate,
  minAge,
  fileSize,
  fileType,
  gstNumber,
  panNumber,
  aadhaarNumber,
  pincode,
  custom,
  combine,
  when,
  isEmail,
  isMobile,
  detectInputType,
  getInputIcon,
  getInputHint,
  commonRules
}
