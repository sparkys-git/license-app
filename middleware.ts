import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const adminPath = process.env.ADMIN_PATH || 'admin'

  // Handle admin path routing
  if (pathname.startsWith(`/${adminPath}`)) {
    // Remove the custom admin path and route to the actual admin pages
    const newPath = pathname.replace(`/${adminPath}`, '') || '/'
    const url = request.nextUrl.clone()
    url.pathname = newPath
    
    // Add a header to identify this as an admin request
    const response = NextResponse.rewrite(url)
    response.headers.set('x-admin-access', 'true')
    return response
  }

  // Block direct access to admin pages
  if (pathname === '/' || 
      pathname.startsWith('/applications') || 
      pathname.startsWith('/validation-logs') ||
      pathname === '/login') {
    // Check if this is coming through the proper admin path
    const adminAccess = request.headers.get('x-admin-access')
    const referer = request.headers.get('referer')
    
    // Allow if coming through admin path or is an API call
    if (adminAccess || 
        (referer && referer.includes(`/${adminPath}`)) ||
        pathname.startsWith('/api/')) {
      return NextResponse.next()
    }
    
    // Otherwise, return 404
    return new NextResponse('Not Found', { status: 404 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 