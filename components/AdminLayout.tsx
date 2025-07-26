'use client'

import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { Users, FileText, Activity, LogOut, Key, X } from 'lucide-react'
import { getClientAdminUrl } from '@/lib/admin-config'
import AlertModal from './AlertModal'

interface AdminLayoutProps {
  children: React.ReactNode
  currentPage: 'dashboard' | 'applications' | 'validation-logs'
}

export default function AdminLayout({ children, currentPage }: AdminLayoutProps) {
  const router = useRouter()
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [changingPassword, setChangingPassword] = useState(false)
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'ok' as 'ok' | 'yes-no' | 'yes-no-cancel',
    onYes: () => {}
  })
  
  const currentPasswordRef = useRef<HTMLInputElement>(null)

  // Auto-focus current password field when modal opens
  useEffect(() => {
    if (showPasswordModal && currentPasswordRef.current) {
      currentPasswordRef.current.focus()
    }
  }, [showPasswordModal])

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

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: 'New passwords do not match',
        type: 'ok',
        onYes: () => setAlertModal({ ...alertModal, isOpen: false })
      })
      return
    }

    if (passwordForm.newPassword.length < 6) {
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: 'New password must be at least 6 characters long',
        type: 'ok',
        onYes: () => setAlertModal({ ...alertModal, isOpen: false })
      })
      return
    }

    setChangingPassword(true)

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setAlertModal({
          isOpen: true,
          title: 'Success',
          message: 'Password updated successfully',
          type: 'ok',
          onYes: () => {
            setAlertModal({ ...alertModal, isOpen: false })
            setShowPasswordModal(false)
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
          }
        })
      } else {
        setAlertModal({
          isOpen: true,
          title: 'Error',
          message: data.error || 'Failed to update password',
          type: 'ok',
          onYes: () => setAlertModal({ ...alertModal, isOpen: false })
        })
      }
    } catch (error) {
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: 'Network error. Please try again.',
        type: 'ok',
        onYes: () => setAlertModal({ ...alertModal, isOpen: false })
      })
    } finally {
      setChangingPassword(false)
    }
  }

  const resetPasswordForm = () => {
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    setShowPasswordModal(false)
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

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <Key size={16} />
                Change Password
              </button>
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
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
              <button
                onClick={resetPasswordForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  ref={currentPasswordRef}
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetPasswordForm}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
                  disabled={changingPassword}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {changingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        onYes={alertModal.onYes}
        yesText="OK"
        noText="Close"
        yesStyle="bg-blue-600 hover:bg-blue-700 text-white"
      />
    </div>
  )
} 