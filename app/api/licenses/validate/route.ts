import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { isLicenseExpired } from '@/lib/license'
import { createErrorResponse } from '@/lib/auth'
import { VALIDATION_CODES, createValidationResult } from '@/lib/validation-codes'
import { logValidationAttempt, getClientIP } from '@/lib/validation-logger'

interface LicenseData {
  code: string
  type: string
  expiryDate: Date
  email: string
}

interface ValidLicenseResponse {
  valid: true
  code: 0
  license: LicenseData
}

interface InvalidLicenseResponse {
  valid: false
  code: 0 | 500
  reason: string
  expiryDate?: Date
}

// Helper functions for creating typed responses
function createInvalidResponse(code: 0 | 500 = 0, expiryDate?: Date): Response {
  const response: InvalidLicenseResponse = {
    valid: false,
    code,
    reason: 'License is invalid',
    ...(expiryDate && { expiryDate })
  }
  
  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

function createValidResponse(license: any): Response {
  const response: ValidLicenseResponse = {
    valid: true,
    code: 0,
    license: {
      code: license.code,
      type: license.type,
      expiryDate: license.expiryDate,
      email: license.email,
    },
  }
  
  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request.headers)
  let licenseCode = ''
  let email = ''
  
  try {
    const body = await request.json()
    licenseCode = body.code || ''
    email = body.email || ''

    // Validate required fields
    if (!licenseCode || !email) {
      await logValidationAttempt({
        code: licenseCode,
        email: email,
        ipAddress: clientIP,
        validationCode: VALIDATION_CODES.INVALID_REQUEST
      })
      
      return createInvalidResponse()
    }

    // Find license by code with application data
    const license = await prisma.license.findUnique({
      where: { code: licenseCode.toUpperCase() },
      include: {
        application: true
      }
    })

    // License not found
    if (!license) {
      await logValidationAttempt({
        code: licenseCode,
        email: email,
        ipAddress: clientIP,
        validationCode: VALIDATION_CODES.LICENSE_NOT_FOUND
      })
      
      return createInvalidResponse()
    }

    // Email mismatch
    if (license.email.toLowerCase() !== email.toLowerCase()) {
      await logValidationAttempt({
        code: licenseCode,
        email: email,
        ipAddress: clientIP,
        validationCode: VALIDATION_CODES.EMAIL_MISMATCH
      })
      
      return createInvalidResponse()
    }

    // License disabled by admin
    if (!license.enabled) {
      await logValidationAttempt({
        code: licenseCode,
        email: email,
        ipAddress: clientIP,
        validationCode: VALIDATION_CODES.LICENSE_DISABLED
      })
      
      return createInvalidResponse()
    }

    // License inactive
    if (!license.isActive) {
      await logValidationAttempt({
        code: licenseCode,
        email: email,
        ipAddress: clientIP,
        validationCode: VALIDATION_CODES.LICENSE_INACTIVE
      })
      
      return createInvalidResponse()
    }

    // License expired
    if (isLicenseExpired(license.expiryDate)) {
      await logValidationAttempt({
        code: licenseCode,
        email: email,
        ipAddress: clientIP,
        validationCode: VALIDATION_CODES.LICENSE_EXPIRED
      })
      
      return createInvalidResponse(500, license.expiryDate)
    }

    // Application inactive (if license has an application)
    if (license.application && !license.application.isActive) {
      await logValidationAttempt({
        code: licenseCode,
        email: email,
        ipAddress: clientIP,
        validationCode: VALIDATION_CODES.APPLICATION_INACTIVE
      })
      
      return createInvalidResponse()
    }

    // Success - license is valid
    await logValidationAttempt({
      code: licenseCode,
      email: email,
      ipAddress: clientIP,
      validationCode: VALIDATION_CODES.SUCCESS
    })

    return createValidResponse(license)

  } catch (error) {
    console.error('Error validating license:', error)
    
    // Log system error
    await logValidationAttempt({
      code: licenseCode,
      email: email,
      ipAddress: clientIP,
      validationCode: VALIDATION_CODES.SYSTEM_ERROR
    })
    
    return createErrorResponse('Internal server error', 500)
  }
} 