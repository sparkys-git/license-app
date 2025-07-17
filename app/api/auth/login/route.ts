import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyPassword, generateToken } from '@/lib/session'
import { createErrorResponse } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return createErrorResponse('Username and password are required')
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { username },
    })

    if (!user || !user.isActive) {
      return createErrorResponse('Invalid credentials', 401)
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      return createErrorResponse('Invalid credentials', 401)
    }

    // Generate token
    const token = generateToken({
      id: user.id,
      username: user.username,
    })

    // Set cookie and return success
    const response = new Response(JSON.stringify({
      success: true,
      user: {
        id: user.id,
        username: user.username,
      },
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Set-Cookie': `auth-token=${token}; HttpOnly; Path=/; Max-Age=86400; SameSite=Strict`,
      },
    })

    return response

  } catch (error) {
    console.error('Login error:', error)
    return createErrorResponse('Internal server error', 500)
  }
} 