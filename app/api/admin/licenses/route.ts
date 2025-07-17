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
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    const skip = (page - 1) * limit

    const where = search ? {
      OR: [
        { code: { contains: search } },
        { email: { contains: search } },
      ],
    } : {}

    const [licenses, total] = await Promise.all([
      prisma.license.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          application: {
            select: {
              id: true,
              name: true,
              description: true,
            }
          }
        }
      }),
      prisma.license.count({ where }),
    ])

    return new Response(JSON.stringify({
      licenses,
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
    console.error('Error fetching licenses:', error)
    return createErrorResponse('Internal server error', 500)
  }
} 