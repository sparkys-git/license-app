import { NextRequest } from 'next/server'
import { prisma } from './db'
import { hashApiKey } from './license'
import { getTokenFromCookies, verifyToken } from './session'

export async function validateApiKey(request: NextRequest): Promise<boolean> {
  const apiKey = request.headers.get('x-api-key')
  
  if (!apiKey) {
    return false
  }
  
  try {
    const hashedKey = hashApiKey(apiKey)
    const keyRecord = await prisma.apiKey.findFirst({
      where: {
        key: hashedKey,
        isActive: true,
      },
    })
    
    return !!keyRecord
  } catch (error) {
    console.error('Error validating API key:', error)
    return false
  }
}

export function createErrorResponse(message: string, status: number = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export function isAuthenticated(request: NextRequest): boolean {
  const token = getTokenFromCookies(request.headers.get('cookie'))
  return !!(token && verifyToken(token))
}

export function createLogoutResponse() {
  return new Response(JSON.stringify({ success: true, message: 'Logged out successfully' }), {
    status: 200,
    headers: { 
      'Content-Type': 'application/json',
      // Multiple cookie clearing strategies for maximum compatibility
      'Set-Cookie': [
        // Clear with Max-Age=0
        `auth-token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict; Secure=${process.env.NODE_ENV === 'production'}`,
        // Clear with past expiry date
        `auth-token=; HttpOnly; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict; Secure=${process.env.NODE_ENV === 'production'}`,
        // Clear without domain specification
        `auth-token=deleted; HttpOnly; Path=/; Max-Age=0; SameSite=Strict`
      ].join(', ')
    },
  })
} 