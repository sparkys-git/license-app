'use client'

import { useRouter } from 'next/navigation'
import { Users, FileText, Activity, LogOut } from 'lucide-react'
import { getClientAdminUrl } from '@/lib/admin-config'

interface AdminLayoutProps {
  children: React.ReactNode
  currentPage: 'dashboard' | 'applications' | 'validation-logs'
}

export default function AdminLayout({ children, currentPage }: AdminLayoutProps) {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
      
      if (response.ok) {
        router.push(getClientAdminUrl('login'))
      } else {
        console.error('Logout failed')
      }
    } catch (error) {
      console.error('Error during logout:', error)
    }
  }

  const navItems = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: Users,
      href: getClientAdminUrl('')
    },
    {
      key: 'applications',
      label: 'Applications',
      icon: FileText,
      href: getClientAdminUrl('applications')
    },
    {
      key: 'validation-logs',
      label: 'Validation Logs',
      icon: Activity,
      href: getClientAdminUrl('validation-logs')
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-semibold text-gray-900">License Management</h1>
              
              <nav className="flex space-x-4">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = currentPage === item.key
                  
                  return (
                    <button
                      key={item.key}
                      onClick={() => router.push(item.href)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <Icon size={16} />
                      {item.label}
                    </button>
                  )
                })}
              </nav>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
} 