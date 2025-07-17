import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-key'

export interface UserSession {
  id: string
  username: string
}

export function generateToken(user: UserSession): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '24h' })
}

export function verifyToken(token: string): UserSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserSession
  } catch {
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function getTokenFromCookies(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null
  
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [name, value] = cookie.trim().split('=')
    acc[name] = value
    return acc
  }, {} as Record<string, string>)
  
  return cookies['auth-token'] || null
} 