export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
/** Accepts international formats: optional +, digits, spaces, dashes, brackets; 7–15 digits. */
export const isValidPhone = (value) => {
  if (!/^\+?[\d\s\-()]+$/.test(value.trim())) return false
  const digits = value.replace(/\D/g, '')
  return digits.length >= 7 && digits.length <= 15
}

export const isValidEmail = (value) => EMAIL_PATTERN.test(value.trim())

/** Checkout form validation. Returns an object of field → message for every invalid field. */
export function validateCheckout(values) {
  const errors = {}
  const required = {
    email: 'Please enter your email address.',
    firstName: 'Please enter your first name.',
    lastName: 'Please enter your last name.',
    phone: 'Please enter a phone number for delivery updates.',
    address: 'Please enter your street address.',
    city: 'Please enter your city.',
    country: 'Please select your country.',
  }
  for (const [field, message] of Object.entries(required)) {
    if (!String(values[field] ?? '').trim()) errors[field] = message
  }
  if (!errors.email && !isValidEmail(values.email)) errors.email = 'Please enter a valid email address, e.g. name@example.com.'
  if (!errors.phone && !isValidPhone(values.phone)) errors.phone = 'Please enter a valid phone number (7–15 digits, e.g. +961 70 000 000).'
  if (values.postalCode && !/^[A-Za-z0-9\s-]{3,10}$/.test(values.postalCode.trim())) errors.postalCode = 'Please enter a valid postal code.'
  if (!values.shippingMethod) errors.shippingMethod = 'Please choose a delivery method.'
  return errors
}

export const COUNTRIES = [
  'Lebanon',
  'United Arab Emirates',
  'Saudi Arabia',
  'Qatar',
  'Kuwait',
  'Jordan',
  'Cyprus',
  'France',
  'United Kingdom',
  'Germany',
  'United States',
  'Canada',
]
