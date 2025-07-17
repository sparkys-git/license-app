import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { createErrorResponse } from '@/lib/auth'
import { getTokenFromCookies, verifyToken } from '@/lib/session'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const token = getTokenFromCookies(request.headers.get('cookie'))
    if (!token || !verifyToken(token)) {
      return createErrorResponse('Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const validationCode = searchParams.get('validationCode')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const skip = (page - 1) * limit

    // Build where conditions
    const where: any = {}

    // Search in code, email, or IP address
    if (search) {
      where.OR = [
        { code: { contains: search } },
        { email: { contains: search } },
        { ipAddress: { contains: search } },
      ]
    }

    // Filter by validation code
    if (validationCode && !isNaN(parseInt(validationCode))) {
      where.validationCode = parseInt(validationCode)
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.timestamp = {}
      if (dateFrom) {
        where.timestamp.gte = new Date(dateFrom)
      }
      if (dateTo) {
        // Add one day to include the entire end date
        const endDate = new Date(dateTo)
        endDate.setDate(endDate.getDate() + 1)
        where.timestamp.lt = endDate
      }
    }

    const [logs, total] = await Promise.all([
      prisma.validationLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
      }),
      prisma.validationLog.count({ where }),
    ])

    return new Response(JSON.stringify({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error fetching validation logs:', error)
    return createErrorResponse('Internal server error', 500)
  }
} 