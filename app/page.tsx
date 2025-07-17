'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, Key, Calendar, Mail, User, CheckCircle, XCircle, X, Trash2, Shield, ShieldOff, Settings, Globe } from 'lucide-react'
import AlertModal from '../components/AlertModal'
import AdminLayout from '../components/AdminLayout'
import DataGrid from '../components/DataGrid'
import { getClientAdminUrl } from '../lib/admin-config'

interface License {
  id: string
  code: string
  type: 'TRIAL' | 'PURCHASED'
  expiryDate: string
  email: string
  ipAddress?: string
  source: string
  createdAt: string
  isActive: boolean
  enabled: boolean
  applicationId?: string
  application?: {
    id: string
    name: string
    description?: string
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export default function AdminDashboard() {
  const [licenses, setLicenses] = useState<License[]>([])
  const [applications, setApplications] = useState<{ id: string; name: string; description?: string }[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, pages: 0 })
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [selectedLicenses, setSelectedLicenses] = useState<License[]>([])
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'yes-no' as 'ok' | 'yes-no' | 'yes-no-cancel',
    onYes: () => {}
  })
  const [createForm, setCreateForm] = useState({
    type: 'TRIAL' as 'TRIAL' | 'PURCHASED',
    email: '',
    applicationId: ''
  })
  const router = useRouter()

  const fetchLicenses = async (page = 1, searchQuery = '') => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(searchQuery && { search: searchQuery })
      })
      
      const response = await fetch(`/api/admin/licenses?${params}`)
      
      if (response.status === 401) {
        router.push(getClientAdminUrl('login'))
        return
      }
      
      const data = await response.json()
      
      setLicenses(data.licenses)
      setPagination(data.pagination)
      setAuthenticated(true)
    } catch (error) {
      console.error('Error fetching licenses:', error)
      router.push(getClientAdminUrl('login'))
    } finally {
      setLoading(false)
    }
  }

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/admin/applications')
      
      if (response.status === 401) {
        router.push(getClientAdminUrl('login'))
        return
      }
      
      const data = await response.json()
      setApplications(data.applications.filter((app: any) => app.isActive))
    } catch (error) {
      console.error('Error fetching applications:', error)
    }
  }

  useEffect(() => {
    fetchLicenses()
    fetchApplications()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchLicenses(1, search)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  }

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date()
  }

  const handleCreateLicense = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      const response = await fetch('/api/admin/licenses/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createForm),
      })

      const data = await response.json()

      if (response.ok) {
        showSuccessAlert(`License created successfully!\nCode: ${data.license.code}`)
        setShowCreateModal(false)
        setCreateForm({ type: 'TRIAL', email: '', applicationId: '' })
        fetchLicenses() // Refresh the list
      } else {
        if (response.status === 401) {
          router.push(getClientAdminUrl('login'))
          return
        }
        showErrorAlert(`Error: ${data.error || 'Failed to create license'}`)
      }
    } catch (error) {
      console.error('Error creating license:', error)
      showErrorAlert('Failed to create license. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  const resetCreateForm = () => {
    setCreateForm({ type: 'TRIAL', email: '', applicationId: '' })
    setShowCreateModal(false)
  }

  const handleRefresh = () => {
    fetchLicenses(pagination.page, search)
  }

  // Logout is now handled by AdminLayout

  // Define columns for DataGrid
  const columns = [
    {
      key: 'code',
      header: 'License Code',
      render: (license: License) => (
        <div className="flex items-center">
          <Key className="h-4 w-4 text-gray-400 mr-2" />
          <span className="text-sm font-medium text-gray-900 font-mono">
            {license.code}
          </span>
        </div>
      )
    },
    {
      key: 'application',
      header: 'Application',
      render: (license: License) => (
        <div className="flex items-center">
          <Settings className="h-4 w-4 text-gray-400 mr-2" />
          <div>
            <div className="text-sm font-medium text-gray-900">
              {license.application?.name || 'Unknown'}
            </div>
            {license.application?.description && (
              <div className="text-xs text-gray-500">
                {license.application.description}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'type',
      header: 'Type',
      render: (license: License) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          license.type === 'TRIAL' 
            ? 'bg-yellow-100 text-yellow-800' 
            : 'bg-green-100 text-green-800'
        }`}>
          {license.type}
        </span>
      )
    },
    {
      key: 'email',
      header: 'Email',
      render: (license: License) => (
        <div className="flex items-center">
          <Mail className="h-4 w-4 text-gray-400 mr-2" />
          <span className="text-sm text-gray-900">{license.email}</span>
        </div>
      )
    },
    {
      key: 'ipAddress',
      header: 'IP Address',
      render: (license: License) => (
        <div className="flex items-center">
          <Globe className="h-4 w-4 text-gray-400 mr-2" />
          <span className="text-sm text-gray-900 font-mono">
            {license.ipAddress || 'N/A'}
          </span>
        </div>
      )
    },
    {
      key: 'source',
      header: 'Source',
      render: (license: License) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          license.source === 'Admin' 
            ? 'bg-blue-100 text-blue-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {license.source}
        </span>
      )
    },
    {
      key: 'expiryDate',
      header: 'Expiry Date',
      render: (license: License) => (
        <div className="flex items-center">
          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
          <span className={`text-sm ${
            isExpired(license.expiryDate) ? 'text-red-600' : 'text-gray-900'
          }`}>
            {formatDate(license.expiryDate)}
          </span>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (license: License) => (
        <div className="flex items-center">
          {license.isActive && license.enabled && !isExpired(license.expiryDate) ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">Active</span>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 text-red-500 mr-1" />
              <span className="text-sm text-red-600">
                {!license.enabled ? 'Disabled' : 
                 isExpired(license.expiryDate) ? 'Expired' : 'Inactive'}
              </span>
            </>
          )}
        </div>
      )
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (license: License) => (
        <span className="text-sm text-gray-500">
          {formatDate(license.createdAt)}
        </span>
      )
    }
  ]

  // Header actions - always visible
  const headerActions = (
    <>
      <button
        onClick={() => setShowCreateModal(true)}
        className="flex items-center gap-2 px-3 py-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md text-sm font-medium transition-colors"
        title="Create new license"
      >
        <Plus className="h-4 w-4" />
        Add
      </button>
      <button
        onClick={() => handleEnableAction()}
        className="flex items-center gap-2 px-3 py-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md text-sm font-medium transition-colors"
        title="Enable selected licenses"
      >
        <Shield className="h-4 w-4" />
        Enable
      </button>
      <button
        onClick={() => handleDisableAction()}
        className="flex items-center gap-2 px-3 py-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-md text-sm font-medium transition-colors"
        title="Disable selected licenses"
      >
        <ShieldOff className="h-4 w-4" />
        Disable
      </button>
      <button
        onClick={() => handleDeleteAction()}
        className="flex items-center gap-2 px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md text-sm font-medium transition-colors"
        title="Delete selected licenses"
      >
        <Trash2 className="h-4 w-4" />
        Delete
      </button>
    </>
  )

  const showSuccessAlert = (message: string) => {
    setAlertModal({
      isOpen: true,
      title: 'Success',
      message: message,
      type: 'yes-no',
      onYes: () => {}
    })
  }

  const showErrorAlert = (message: string) => {
    setAlertModal({
      isOpen: true,
      title: 'Error',
      message: message,
      type: 'yes-no',
      onYes: () => {}
    })
  }

  const showWarningAlert = (message: string) => {
    setAlertModal({
      isOpen: true,
      title: 'Warning',
      message: message,
      type: 'ok',
      onYes: () => {}
    })
  }

  // Action handlers that check for selection
  const handleEnableAction = () => {
    if (selectedLicenses.length === 0) {
      showWarningAlert('Please select one or more licenses to enable.')
      return
    }
    handleBulkToggleEnabled(selectedLicenses, true)
  }

  const handleDisableAction = () => {
    if (selectedLicenses.length === 0) {
      showWarningAlert('Please select one or more licenses to disable.')
      return
    }
    handleBulkToggleEnabled(selectedLicenses, false)
  }

  const handleDeleteAction = () => {
    if (selectedLicenses.length === 0) {
      showWarningAlert('Please select one or more licenses to delete.')
      return
    }
    handleDeleteMultipleLicenses(selectedLicenses)
  }

  const handleToggleEnabled = async (license: License) => {
    try {
      const response = await fetch(`/api/admin/licenses/${license.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !license.enabled }),
      })

      if (response.ok) {
        fetchLicenses(pagination.page, search) // Refresh the list
      } else {
        if (response.status === 401) {
          router.push(getClientAdminUrl('login'))
          return
        }
        const data = await response.json()
        showErrorAlert(`Error: ${data.error || 'Failed to update license'}`)
      }
    } catch (error) {
      console.error('Error updating license:', error)
      showErrorAlert('Failed to update license. Please try again.')
    }
  }

  const handleDeleteLicense = (license: License) => {
    setAlertModal({
      isOpen: true,
      title: 'Delete License',
      message: `Are you sure you want to delete license ${license.code}?\n\nThis action cannot be undone.`,
      type: 'yes-no',
      onYes: () => performDeleteLicense(license)
    })
  }

  const handleBulkToggleEnabled = async (licenses: License[], enabled: boolean) => {
    try {
      // Filter out licenses that are already in the desired state
      const licensesToUpdate = licenses.filter(license => license.enabled !== enabled)
      
      if (licensesToUpdate.length === 0) {
        // All licenses are already in the desired state, just refresh and clear selection
        fetchLicenses(pagination.page, search)
        setSelectedLicenses([])
        return
      }

      const promises = licensesToUpdate.map(license => 
        fetch(`/api/admin/licenses/${license.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled }),
        })
      )

      const responses = await Promise.all(promises)
      const allSuccessful = responses.every(response => response.ok)

      if (allSuccessful) {
        fetchLicenses(pagination.page, search) // Refresh the list
        setSelectedLicenses([]) // Clear selection
      } else {
        const failedCount = responses.filter(response => !response.ok).length
        showErrorAlert(`Failed to update ${failedCount} license${failedCount === 1 ? '' : 's'}. Please try again.`)
      }
    } catch (error) {
      console.error('Error updating licenses:', error)
      showErrorAlert('Failed to update licenses. Please try again.')
    }
  }

  const handleDeleteMultipleLicenses = (licenses: License[]) => {
    setAlertModal({
      isOpen: true,
      title: 'Delete Licenses',
      message: `Are you sure you want to delete ${licenses.length} license${licenses.length === 1 ? '' : 's'}?\n\nThis action cannot be undone.`,
      type: 'yes-no',
      onYes: () => performDeleteMultipleLicenses(licenses)
    })
  }

  const performDeleteMultipleLicenses = async (licenses: License[]) => {
    try {
      const promises = licenses.map(license => 
        fetch(`/api/admin/licenses/${license.id}`, {
          method: 'DELETE',
        })
      )

      const responses = await Promise.all(promises)
      const allSuccessful = responses.every(response => response.ok)

      if (allSuccessful) {
        fetchLicenses(pagination.page, search) // Refresh the list
        setSelectedLicenses([]) // Clear selection
      } else {
        const failedCount = responses.filter(response => !response.ok).length
        showErrorAlert(`Failed to delete ${failedCount} license${failedCount === 1 ? '' : 's'}. Please try again.`)
      }
    } catch (error) {
      console.error('Error deleting licenses:', error)
      showErrorAlert('Failed to delete licenses. Please try again.')
    }
  }

  const performDeleteLicense = async (license: License) => {
    try {
      const response = await fetch(`/api/admin/licenses/${license.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchLicenses(pagination.page, search) // Refresh the list
      } else {
        if (response.status === 401) {
          router.push(getClientAdminUrl('login'))
          return
        }
        const data = await response.json()
        showErrorAlert(`Error: ${data.error || 'Failed to delete license'}`)
      }
    } catch (error) {
      console.error('Error deleting license:', error)
      showErrorAlert('Failed to delete license. Please try again.')
    }
  }

  if (!authenticated && loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <AdminLayout currentPage="dashboard">
      <div className="px-4 sm:px-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Manage and monitor software licenses</p>
        </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Key className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Licenses</p>
              <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {licenses.filter(l => l.isActive && l.enabled && !isExpired(l.expiryDate)).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <XCircle className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Expired</p>
              <p className="text-2xl font-bold text-gray-900">
                {licenses.filter(l => isExpired(l.expiryDate)).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ShieldOff className="h-8 w-8 text-orange-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Disabled</p>
              <p className="text-2xl font-bold text-gray-900">
                {licenses.filter(l => !l.enabled).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by license code or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Licenses Table */}
      <DataGrid
        data={licenses}
        columns={columns}
        loading={loading}
        emptyMessage="No licenses found"
        selectedItems={selectedLicenses}
        onSelectionChange={setSelectedLicenses}
        selectionKey="id"
        headerActions={headerActions}
        onRefresh={handleRefresh}
        className="mb-6"
      />

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="bg-white rounded-lg shadow px-4 py-3 flex items-center justify-between sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => fetchLicenses(pagination.page - 1, search)}
                disabled={pagination.page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => fetchLicenses(pagination.page + 1, search)}
                disabled={pagination.page === pagination.pages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span>
                  {' '}to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium">{pagination.total}</span>
                  {' '}results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => fetchLicenses(pagination.page - 1, search)}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => fetchLicenses(page, search)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === pagination.page
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => fetchLicenses(pagination.page + 1, search)}
                    disabled={pagination.page === pagination.pages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create License Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Create New License</h2>
              <button
                onClick={resetCreateForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateLicense} className="space-y-4">
              <div>
                <label htmlFor="application" className="block text-sm font-medium text-gray-700 mb-1">
                  Application
                </label>
                <select
                  id="application"
                  value={createForm.applicationId}
                  onChange={(e) => setCreateForm({ ...createForm, applicationId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select an application...</option>
                  {applications.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  License Type
                </label>
                <select
                  id="type"
                  value={createForm.type}
                  onChange={(e) => setCreateForm({ ...createForm, type: e.target.value as 'TRIAL' | 'PURCHASED' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="TRIAL">Trial</option>
                  <option value="PURCHASED">Purchased</option>
                </select>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="user@example.com"
                  required
                />
              </div>



              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetCreateForm}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : 'Create License'}
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
        yesText={alertModal.title === 'Delete License' || alertModal.title === 'Delete Licenses' ? 'Delete' : 'OK'}
        noText={alertModal.title === 'Delete License' || alertModal.title === 'Delete Licenses' ? 'Cancel' : 'Close'}
        yesStyle={
          alertModal.title === 'Delete License' || alertModal.title === 'Delete Licenses' 
            ? 'bg-red-600 hover:bg-red-700 text-white' 
            : alertModal.title === 'Success' 
            ? 'bg-green-600 hover:bg-green-700 text-white' 
            : alertModal.title === 'Warning'
            ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }
      />
    </AdminLayout>
  )
} 