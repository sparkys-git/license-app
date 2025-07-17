import { NextRequest, NextResponse } from 'next/server'

// Catch-all route for unmatched API endpoints
// This will handle any API route that doesn't match existing routes
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'API endpoint not found',
      message: 'The requested API endpoint does not exist'
    },
    { status: 404 }
  )
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'API endpoint not found',
      message: 'The requested API endpoint does not exist'
    },
    { status: 404 }
  )
}

export async function PUT(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'API endpoint not found',
      message: 'The requested API endpoint does not exist'
    },
    { status: 404 }
  )
}

export async function PATCH(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'API endpoint not found',
      message: 'The requested API endpoint does not exist'
    },
    { status: 404 }
  )
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'API endpoint not found',
      message: 'The requested API endpoint does not exist'
    },
    { status: 404 }
  )
} 