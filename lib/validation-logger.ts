import { prisma } from './db'
import { VALIDATION_CODES, getValidationMessage } from './validation-codes'

export interface ValidationLogData {
  code: string
  email: string
  ipAddress: string
  validationCode: number
}

/**
 * Log a license validation attempt to the database
 * This is fire-and-forget - we don't want logging failures to affect validation
 */
export async function logValidationAttempt(data: ValidationLogData): Promise<void> {
  try {
    await prisma.validationLog.create({
      data: {
        code: data.code,
        email: data.email,
        ipAddress: data.ipAddress,
        validationCode: data.validationCode,
        validationMessage: getValidationMessage(data.validationCode),
      }
    })
  } catch (error) {
    // Log to console but don't throw - logging failures shouldn't break validation
    console.error('Failed to log validation attempt:', error)
  }
}

/**
 * Helper to extract client IP address from request headers
 */
export function getClientIP(headers: Headers): string {
  // Try various headers in order of preference
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  const realIP = headers.get('x-real-ip')
  if (realIP) {
    return realIP.trim()
  }
  
  const cfIP = headers.get('cf-connecting-ip')
  if (cfIP) {
    return cfIP.trim()
  }
  
  return 'unknown'
} 