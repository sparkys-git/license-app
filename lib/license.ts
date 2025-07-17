import crypto from 'crypto'

export function generateLicenseCode(): string {
  // Generate a license code with format: XXXX-XXXX-XXXX-XXXX
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const segments: string[] = []
  
  for (let i = 0; i < 4; i++) {
    let segment = ''
    for (let j = 0; j < 4; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    segments.push(segment)
  }
  
  return segments.join('-')
}

export function isLicenseExpired(expiryDate: Date): boolean {
  return new Date() > expiryDate
}

export function generateApiKey(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
} 