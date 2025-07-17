import { NextRequest } from 'next/server'
import { createErrorResponse } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Forward the request to the admin endpoint
    const response = await fetch(`${request.nextUrl.origin}/api/admin/licenses/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
      body: JSON.stringify(await request.json()),
    })

    // Pass through the response from the admin endpoint
    return new Response(await response.text(), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Error forwarding license creation request:', error)
    return createErrorResponse('Internal server error', 500)
  }
} 