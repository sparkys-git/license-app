// Admin configuration and URL helpers
export const getAdminPath = () => {
  return process.env.ADMIN_PATH || 'admin'
}

export const getAdminUrl = (path: string = '') => {
  const adminPath = getAdminPath()
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  return `/${adminPath}${cleanPath ? `/${cleanPath}` : ''}`
}

export const isValidAdminAccess = (request: Request) => {
  const url = new URL(request.url)
  const adminPath = getAdminPath()
  return url.pathname.startsWith(`/${adminPath}/`) || url.pathname === `/${adminPath}`
}

// Client-side helper (uses window.location)
export const getClientAdminUrl = (path: string = '') => {
  if (typeof window === 'undefined') return path
  
  const currentPath = window.location.pathname
  const adminPathMatch = currentPath.match(/^\/([^\/]+)/)
  const adminPath = adminPathMatch ? adminPathMatch[1] : 'admin'
  
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  return `/${adminPath}${cleanPath ? `/${cleanPath}` : ''}`
}

export const redirectToAdmin = (path: string = '') => {
  if (typeof window !== 'undefined') {
    window.location.href = getClientAdminUrl(path)
  }
}

// Enhanced logout function to clear all client-side state
export const performLogout = async () => {
  try {
    // Call logout API
    await fetch('/api/auth/logout', { 
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    // Clear any localStorage/sessionStorage (if used in future)
    if (typeof window !== 'undefined') {
      localStorage.clear()
      sessionStorage.clear()
    }
    
    // Force redirect to admin login
    const loginUrl = getClientAdminUrl('login')
    
    // Use replace instead of push to prevent back button issues
    if (typeof window !== 'undefined') {
      window.location.replace(loginUrl)
    }
    
    return true
  } catch (error) {
    console.error('Logout error:', error)
    // Even if API fails, still redirect to login
    if (typeof window !== 'undefined') {
      window.location.replace(getClientAdminUrl('login'))
    }
    return false
  }
} 