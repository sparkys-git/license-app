import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { createErrorResponse } from '@/lib/auth'
import { getTokenFromCookies, verifyToken } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const token = getTokenFromCookies(request.headers.get('cookie'))
    if (!token || !verifyToken(token)) {
      return createErrorResponse('Unauthorized', 401)
    }

    // Parse request body
    const body = await request.json()
    const { code, applicationId } = body

    if (!code || !applicationId) {
      return createErrorResponse('License code and application ID are required', 400)
    }

    // Find the license and application
    const license = await prisma.license.findUnique({
      where: { code },
      include: {
        application: true
      }
    })

    if (!license) {
      return createErrorResponse('License not found', 404)
    }

    // Validate application ID matches
    if (license.applicationId !== applicationId) {
      return createErrorResponse('Invalid application ID for this license', 400)
    }

    // Check if license is trial type
    if (license.type === 'TRIAL') {
      return createErrorResponse('Trial licenses cannot be renewed', 400)
    }

    // Check if license is expired
    const now = new Date()
    if (license.expiryDate < now) {
      return createErrorResponse('Expired licenses cannot be renewed', 400)
    }

    // Get renewal period from application
    const application = await prisma.application.findUnique({
      where: { id: applicationId }
    })

    if (!application) {
      return createErrorResponse('Application not found', 404)
    }

    // Calculate new expiry date based on current expiry date
    const newExpiryDate = new Date(license.expiryDate)
    newExpiryDate.setDate(newExpiryDate.getDate() + application.renewalPeriod)

    // Update license with new expiry date
    const updatedLicense = await prisma.license.update({
      where: { id: license.id },
      data: {
        expiryDate: newExpiryDate,
        updatedAt: new Date()
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

    return new Response(JSON.stringify({
      message: 'License renewed successfully',
      license: updatedLicense
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error renewing license:', error)
    return createErrorResponse('Internal server error', 500)
  }
} 