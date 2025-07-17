// Validation result codes and messages for license validation logging
export const VALIDATION_CODES = {
  // Success codes (1xx)
  SUCCESS: 100,
  
  // Client error codes (4xx) 
  INVALID_REQUEST: 400,       // Missing required fields
  LICENSE_NOT_FOUND: 404,     // License code doesn't exist
  EMAIL_MISMATCH: 401,        // Email doesn't match license
  LICENSE_DISABLED: 403,      // License is disabled by admin
  
  // License state errors (5xx)
  LICENSE_EXPIRED: 500,       // License past expiry date
  LICENSE_INACTIVE: 501,      // License not active
  APPLICATION_INACTIVE: 502,  // Associated application is inactive
  
  // System errors (9xx)
  SYSTEM_ERROR: 900,          // Database or server error
} as const

export const VALIDATION_MESSAGES: Record<number, string> = {
  [VALIDATION_CODES.SUCCESS]: 'License valid',
  [VALIDATION_CODES.INVALID_REQUEST]: 'Invalid request - missing code or email',
  [VALIDATION_CODES.LICENSE_NOT_FOUND]: 'License not found',
  [VALIDATION_CODES.EMAIL_MISMATCH]: 'Email does not match license',
  [VALIDATION_CODES.LICENSE_DISABLED]: 'License disabled by administrator', 
  [VALIDATION_CODES.LICENSE_EXPIRED]: 'License expired',
  [VALIDATION_CODES.LICENSE_INACTIVE]: 'License inactive',
  [VALIDATION_CODES.APPLICATION_INACTIVE]: 'Application inactive',
  [VALIDATION_CODES.SYSTEM_ERROR]: 'System error occurred',
}

export function getValidationMessage(code: number): string {
  return VALIDATION_MESSAGES[code] || 'Unknown validation result'
}

export type ValidationResult = {
  code: number
  message: string
  isValid: boolean
}

export function createValidationResult(validationCode: number): ValidationResult {
  return {
    code: validationCode,
    message: getValidationMessage(validationCode),
    isValid: validationCode === VALIDATION_CODES.SUCCESS
  }
} 