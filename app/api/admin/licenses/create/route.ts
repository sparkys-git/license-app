import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { generateLicenseCode } from '@/lib/license'
import { validateApiKey, createErrorResponse } from '@/lib/auth'
import { getTokenFromCookies, verifyToken } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    // Check authentication - either API key or session token
    const token = getTokenFromCookies(request.headers.get('cookie'))
    const isValidSession = token && verifyToken(token)
    const isValidKey = await validateApiKey(request)

    if (!isValidSession && !isValidKey) {
      return createErrorResponse('Unauthorized', 401)
    }

    const body = await request.json()
    const { type, email, applicationId, source = isValidKey ? 'API' : 'Admin' } = body

    // Get client IP address
    const forwarded = request.headers.get('x-forwarded-for')
    const clientIP = forwarded ? forwarded.split(',')[0] : 
                    request.headers.get('x-real-ip') || 
                    request.headers.get('cf-connecting-ip') || 
                    'unknown'

    // Validate required fields
    if (!type || !email || !applicationId) {
      return createErrorResponse('Missing required fields: type, email, applicationId')
    }

    // Validate license type
    if (!['TRIAL', 'PURCHASED'].includes(type)) {
      return createErrorResponse('Invalid license type. Must be TRIAL or PURCHASED')
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return createErrorResponse('Invalid email format')
    }

    // Validate application exists and is active
    const application = await prisma.application.findUnique({
      where: { id: applicationId }
    })
    
    if (!application) {
      return createErrorResponse('Application not found')
    }
    
    if (!application.isActive) {
      return createErrorResponse('Application is not active')
    }

    // Calculate expiry date based on license type and application periods
    const now = new Date()
    const expiry = new Date(now)
    
    if (type === 'TRIAL') {
      expiry.setDate(now.getDate() + application.trialPeriod)
    } else if (type === 'PURCHASED') {
      expiry.setDate(now.getDate() + application.renewalPeriod)
    }
    
    // Set time to end of day (23:59:59)
    expiry.setHours(23, 59, 59, 999)

    // Generate unique license code
    let licenseCode: string
    let isUnique = false
    let attempts = 0
    const maxAttempts = 10

    do {
      licenseCode = generateLicenseCode()
      const existing = await prisma.license.findUnique({
        where: { code: licenseCode }
      })
      isUnique = !existing
      attempts++
    } while (!isUnique && attempts < maxAttempts)

    if (!isUnique) {
      return createErrorResponse('Failed to generate unique license code', 500)
    }

    // Create license
    const license = await prisma.license.create({
      data: {
        code: licenseCode!,
        type,
        expiryDate: expiry,
        email,
        applicationId,
        ipAddress: clientIP,
        source,
      },
      include: {
        application: {
          select: {
            id: true,
            name: true,
            description: true,
          }
        }
      }
    })

    // Return different response formats based on authentication method
    const responseData = isValidKey ? {
      // Public API response - minimal data
      success: true,
      license: {
        code: license.code,
        type: license.type,
        expiryDate: license.expiryDate,
      }
    } : {
      // Admin response - full data
      success: true,
      license: {
        id: license.id,
        code: license.code,
        type: license.type,
        expiryDate: license.expiryDate,
        email: license.email,
        ipAddress: license.ipAddress,
        source: license.source,
        createdAt: license.createdAt,
        application: license.application,
      }
    }

    return new Response(JSON.stringify(responseData), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error creating license:', error)
    return createErrorResponse('Internal server error', 500)
  }
} 