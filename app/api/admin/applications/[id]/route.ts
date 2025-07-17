import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { createErrorResponse } from '@/lib/auth'
import { getTokenFromCookies, verifyToken } from '@/lib/session'

// Update application
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication
    const token = getTokenFromCookies(request.headers.get('cookie'))
    if (!token || !verifyToken(token)) {
      return createErrorResponse('Unauthorized', 401)
    }

    const { id } = params
    const body = await request.json()
    const { name, description, isActive, trialPeriod, renewalPeriod } = body

    const updateData: any = {}
    
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        return createErrorResponse('Application name cannot be empty')
      }
      updateData.name = name.trim()
    }
    
    if (description !== undefined) {
      updateData.description = description?.trim() || null
    }
    
    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive
    }

    if (trialPeriod !== undefined) {
      const trial = parseInt(trialPeriod) || 30
      if (trial < 1 || trial > 365) {
        return createErrorResponse('Trial period must be between 1 and 365 days')
      }
      updateData.trialPeriod = trial
    }

    if (renewalPeriod !== undefined) {
      const renewal = parseInt(renewalPeriod) || 365
      if (renewal < 1 || renewal > 3650) {
        return createErrorResponse('Renewal period must be between 1 and 3650 days')
      }
      updateData.renewalPeriod = renewal
    }

    const updatedApplication = await prisma.application.update({
      where: { id },
      data: updateData,
    })

    return new Response(JSON.stringify({
      success: true,
      application: updatedApplication,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    if (error.code === 'P2025') {
      return createErrorResponse('Application not found', 404)
    }
    if (error.code === 'P2002') {
      return createErrorResponse('Application name already exists')
    }
    console.error('Error updating application:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

// Delete application
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check authentication
    const token = getTokenFromCookies(request.headers.get('cookie'))
    if (!token || !verifyToken(token)) {
      return createErrorResponse('Unauthorized', 401)
    }

    const { id } = params

    // Check if application has associated licenses
    const licenseCount = await prisma.license.count({
      where: { applicationId: id }
    })

    if (licenseCount > 0) {
      return createErrorResponse(
        `Cannot delete application because it has ${licenseCount} associated license${licenseCount > 1 ? 's' : ''}. Please delete or reassign the licenses first.`,
        400
      )
    }

    await prisma.application.delete({
      where: { id },
    })

    return new Response(JSON.stringify({
      success: true,
      message: 'Application deleted successfully',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    if (error.code === 'P2025') {
      return createErrorResponse('Application not found', 404)
    }
    if (error.code === 'P2003') {
      return createErrorResponse('Cannot delete application because it has associated licenses. Please delete or reassign the licenses first.', 400)
    }
    console.error('Error deleting application:', error)
    return createErrorResponse('Internal server error', 500)
  }
} 