import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { createErrorResponse } from '@/lib/auth'
import { getTokenFromCookies, verifyToken } from '@/lib/session'

// Get all applications
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const token = getTokenFromCookies(request.headers.get('cookie'))
    if (!token || !verifyToken(token)) {
      return createErrorResponse('Unauthorized', 401)
    }

    const applications = await prisma.application.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            licenses: true
          }
        }
      }
    })

    return new Response(JSON.stringify({
      applications,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error fetching applications:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

// Create new application
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const token = getTokenFromCookies(request.headers.get('cookie'))
    if (!token || !verifyToken(token)) {
      return createErrorResponse('Unauthorized', 401)
    }

    const body = await request.json()
    const { name, description, trialPeriod, renewalPeriod } = body

    if (!name || name.trim().length === 0) {
      return createErrorResponse('Application name is required')
    }

    // Validate period values
    const trial = parseInt(trialPeriod) || 30
    const renewal = parseInt(renewalPeriod) || 365
    
    if (trial < 1 || trial > 365) {
      return createErrorResponse('Trial period must be between 1 and 365 days')
    }
    
    if (renewal < 1 || renewal > 3650) {
      return createErrorResponse('Renewal period must be between 1 and 3650 days')
    }

    // Check if application name already exists
    const existing = await prisma.application.findUnique({
      where: { name: name.trim() },
    })

    if (existing) {
      return createErrorResponse('Application name already exists')
    }

    const application = await prisma.application.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        trialPeriod: trial,
        renewalPeriod: renewal,
      },
    })

    return new Response(JSON.stringify({
      success: true,
      application,
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error creating application:', error)
    return createErrorResponse('Internal server error', 500)
  }
} 