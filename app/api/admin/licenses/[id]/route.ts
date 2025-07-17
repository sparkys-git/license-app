import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { createErrorResponse } from '@/lib/auth'
import { getTokenFromCookies, verifyToken } from '@/lib/session'

// Update license (enable/disable)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication
    const token = getTokenFromCookies(request.headers.get('cookie'))
    if (!token || !verifyToken(token)) {
      return createErrorResponse('Unauthorized', 401)
    }

    const { id } = params
    const body = await request.json()
    const { enabled } = body

    if (typeof enabled !== 'boolean') {
      return createErrorResponse('Invalid enabled value. Must be boolean.')
    }

    // Update license
    const updatedLicense = await prisma.license.update({
      where: { id },
      data: { enabled },
    })

    return new Response(JSON.stringify({
      success: true,
      license: updatedLicense,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    if (error.code === 'P2025') {
      return createErrorResponse('License not found', 404)
    }
    console.error('Error updating license:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

// Delete license
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication
    const token = getTokenFromCookies(request.headers.get('cookie'))
    if (!token || !verifyToken(token)) {
      return createErrorResponse('Unauthorized', 401)
    }

    const { id } = params

    // Delete license
    await prisma.license.delete({
      where: { id },
    })

    return new Response(JSON.stringify({
      success: true,
      message: 'License deleted successfully',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    if (error.code === 'P2025') {
      return createErrorResponse('License not found', 404)
    }
    console.error('Error deleting license:', error)
    return createErrorResponse('Internal server error', 500)
  }
} 