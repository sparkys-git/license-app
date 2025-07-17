'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getClientAdminUrl } from '../../lib/admin-config'
import { Search, Plus, Settings, CheckCircle, XCircle, X, Trash2, Edit } from 'lucide-react'
import AlertModal from '../../components/AlertModal'
import AdminLayout from '../../components/AdminLayout'
import DataGrid from '../../components/DataGrid'

interface Application {
  id: string
  name: string
  description?: string
  trialPeriod: number
  renewalPeriod: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    licenses: number
  }
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState(false)
  const [search, setSearch] = useState('')
  const [editingApp, setEditingApp] = useState<Application | null>(null)
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'yes-no' as 'ok' | 'yes-no' | 'yes-no-cancel',
    onYes: () => {}
  })
  
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    trialPeriod: 30,
    renewalPeriod: 365
  })
  
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    trialPeriod: 30,
    renewalPeriod: 365
  })
  
  const router = useRouter()

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/applications')
      
      if (response.status === 401) {
        router.push('/login')
        return
      }
      
      const data = await response.json()
      setApplications(data.applications)
      setAuthenticated(true)
    } catch (error) {
      console.error('Error fetching applications:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApplications()
  }, [])

  // Update selected application when applications data changes (after refresh)
  useEffect(() => {
    if (selectedApplication && applications.length > 0) {
      const updatedApp = applications.find(app => app.id === selectedApplication.id)
      if (updatedApp) {
        setSelectedApplication(updatedApp)
      } else {
        // Application was deleted, clear selection
        setSelectedApplication(null)
      }
    }
  }, [applications, selectedApplication])

  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      const response = await fetch('/api/admin/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      })

      const data = await response.json()

      if (response.ok) {
        setShowCreateModal(false)
        setCreateForm({ name: '', description: '', trialPeriod: 30, renewalPeriod: 365 })
        fetchApplications()
      } else {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        showErrorAlert(`Error: ${data.error || 'Failed to create application'}`)
      }
    } catch (error) {
      console.error('Error creating application:', error)
      showErrorAlert('Failed to create application. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  const handleEditApplication = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingApp) return
    
    setEditing(true)

    try {
      const response = await fetch(`/api/admin/applications/${editingApp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })

      const data = await response.json()

      if (response.ok) {
        setShowEditModal(false)
        setEditingApp(null)
        fetchApplications()
      } else {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        showErrorAlert(`Error: ${data.error || 'Failed to update application'}`)
      }
    } catch (error) {
      console.error('Error updating application:', error)
      showErrorAlert('Failed to update application. Please try again.')
    } finally {
      setEditing(false)
    }
  }

  const handleToggleActive = async (app: Application) => {
    try {
      const response = await fetch(`/api/admin/applications/${app.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !app.isActive }),
      })

      if (response.ok) {
        fetchApplications()
      } else {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        const data = await response.json()
        showErrorAlert(`Error: ${data.error || 'Failed to update application'}`)
      }
    } catch (error) {
      console.error('Error updating application:', error)
      showErrorAlert('Failed to update application. Please try again.')
    }
  }

  const handleDeleteApplication = (app: Application) => {
    const licenseCount = app._count?.licenses || 0
    let message = `Are you sure you want to delete application "${app.name}"?`
    
    if (licenseCount > 0) {
      message += `\n\nWarning: This application has ${licenseCount} associated license${licenseCount > 1 ? 's' : ''}. You'll need to delete or reassign those licenses first.`
    } else {
      message += '\n\nThis action cannot be undone.'
    }

    setAlertModal({
      isOpen: true,
      title: 'Delete Application',
      message: message,
      type: 'yes-no',
      onYes: () => performDeleteApplication(app)
    })
  }

  const performDeleteApplication = async (app: Application) => {
    try {
      const response = await fetch(`/api/admin/applications/${app.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchApplications()
      } else {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        const data = await response.json()
        showErrorAlert(`Error: ${data.error || 'Failed to delete application'}`)
      }
    } catch (error) {
      console.error('Error deleting application:', error)
      showErrorAlert('Failed to delete application. Please try again.')
    }
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
  const handleActivateAction = () => {
    if (!selectedApplication) {
      showWarningAlert('Please select an application to activate.')
      return
    }
    if (selectedApplication.isActive) {
      // Already active, just refresh
      fetchApplications()
      return
    }
    handleToggleActive(selectedApplication)
  }

  const handleDeactivateAction = () => {
    if (!selectedApplication) {
      showWarningAlert('Please select an application to deactivate.')
      return
    }
    if (!selectedApplication.isActive) {
      // Already inactive, just refresh
      fetchApplications()
      return
    }
    handleToggleActive(selectedApplication)
  }

  const handleDeleteAction = () => {
    if (!selectedApplication) {
      showWarningAlert('Please select an application to delete.')
      return
    }
    handleDeleteApplication(selectedApplication)
  }

  // Logout is now handled by AdminLayout

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

  // Define columns for DataGrid
  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (app: Application) => (
        <div className="flex items-center">
          <Settings className="h-4 w-4 text-gray-400 mr-2" />
          <button
            onClick={() => openEditModal(app)}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
          >
            {app.name}
          </button>
        </div>
      )
    },
    {
      key: 'description',
      header: 'Description',
      render: (app: Application) => (
        <div>
          <span className="text-sm text-gray-900">
            {app.description || '-'}
          </span>
          {(app._count?.licenses || 0) > 0 && (
            <div className="text-xs text-blue-600 mt-1">
              {app._count?.licenses} license{(app._count?.licenses || 0) > 1 ? 's' : ''}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'periods',
      header: 'Trial/Renewal (Days)',
      render: (app: Application) => (
        <div className="text-sm text-gray-900">
          <div>Trial: {app.trialPeriod || 30} days</div>
          <div className="text-xs text-gray-500">Renewal: {app.renewalPeriod || 365} days</div>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (app: Application) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          app.isActive 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {app.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (app: Application) => (
        <span className="text-sm text-gray-500">
          {formatDate(app.createdAt)}
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
        title="Add new application"
      >
        <Plus className="h-4 w-4" />
        Add
      </button>
      <button
        onClick={() => handleActivateAction()}
        className="flex items-center gap-2 px-3 py-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md text-sm font-medium transition-colors"
        title="Activate selected application"
      >
        <CheckCircle className="h-4 w-4" />
        Activate
      </button>
      <button
        onClick={() => handleDeactivateAction()}
        className="flex items-center gap-2 px-3 py-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-md text-sm font-medium transition-colors"
        title="Deactivate selected application"
      >
        <XCircle className="h-4 w-4" />
        Deactivate
      </button>
      <button
        onClick={() => handleDeleteAction()}
        className="flex items-center gap-2 px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md text-sm font-medium transition-colors"
        title="Delete selected application"
      >
        <Trash2 className="h-4 w-4" />
        Delete
      </button>
    </>
  )

  const openEditModal = (app: Application) => {
    setEditingApp(app)
    setEditForm({
      name: app.name,
      description: app.description || '',
      trialPeriod: app.trialPeriod || 30,
      renewalPeriod: app.renewalPeriod || 365
    })
    setShowEditModal(true)
  }

  const resetCreateForm = () => {
    setCreateForm({ name: '', description: '', trialPeriod: 30, renewalPeriod: 365 })
    setShowCreateModal(false)
  }

  const resetEditForm = () => {
    setEditForm({ name: '', description: '', trialPeriod: 30, renewalPeriod: 365 })
    setEditingApp(null)
    setShowEditModal(false)
  }

  const handleRefresh = () => {
    fetchApplications()
  }

  const filteredApplications = applications.filter(app =>
    app.name.toLowerCase().includes(search.toLowerCase()) ||
    (app.description && app.description.toLowerCase().includes(search.toLowerCase()))
  )

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
    <AdminLayout currentPage="applications">
      <div className="px-4 sm:px-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Application Management</h1>
          <p className="text-gray-600">Manage applications that can validate licenses</p>
        </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Settings className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Applications</p>
              <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {applications.filter(app => app.isActive).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <XCircle className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Inactive</p>
              <p className="text-2xl font-bold text-gray-900">
                {applications.filter(app => !app.isActive).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search applications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <DataGrid
        data={filteredApplications}
        columns={columns}
        loading={loading}
        emptyMessage={search ? 'No applications match your search' : 'No applications found'}
        selectedItems={selectedApplication ? [selectedApplication] : []}
        onSelectionChange={(items) => setSelectedApplication(items.length > 0 ? items[0] : null)}
        selectionKey="id"
        selectionMode="single"
        headerActions={headerActions}
        onRefresh={handleRefresh}
        className="mb-6"
      />

      {/* Create Application Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Add New Application</h2>
              <button
                onClick={resetCreateForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateApplication} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Application Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="My Application"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Optional description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="trialPeriod" className="block text-sm font-medium text-gray-700 mb-1">
                    Trial Period (Days) *
                  </label>
                  <input
                    type="number"
                    id="trialPeriod"
                    value={createForm.trialPeriod}
                    onChange={(e) => setCreateForm({ ...createForm, trialPeriod: parseInt(e.target.value) || 30 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="30"
                    min="1"
                    max="365"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="renewalPeriod" className="block text-sm font-medium text-gray-700 mb-1">
                    Renewal Period (Days) *
                  </label>
                  <input
                    type="number"
                    id="renewalPeriod"
                    value={createForm.renewalPeriod}
                    onChange={(e) => setCreateForm({ ...createForm, renewalPeriod: parseInt(e.target.value) || 365 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="365"
                    min="1"
                    max="3650"
                    required
                  />
                </div>
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
                  {creating ? 'Adding...' : 'Add Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Application Modal */}
      {showEditModal && editingApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Edit Application</h2>
              <button
                onClick={resetEditForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleEditApplication} className="space-y-4">
              <div>
                <label htmlFor="editName" className="block text-sm font-medium text-gray-700 mb-1">
                  Application Name *
                </label>
                <input
                  type="text"
                  id="editName"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="editDescription" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="editDescription"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Optional description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="editTrialPeriod" className="block text-sm font-medium text-gray-700 mb-1">
                    Trial Period (Days) *
                  </label>
                  <input
                    type="number"
                    id="editTrialPeriod"
                    value={editForm.trialPeriod}
                    onChange={(e) => setEditForm({ ...editForm, trialPeriod: parseInt(e.target.value) || 30 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="30"
                    min="1"
                    max="365"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="editRenewalPeriod" className="block text-sm font-medium text-gray-700 mb-1">
                    Renewal Period (Days) *
                  </label>
                  <input
                    type="number"
                    id="editRenewalPeriod"
                    value={editForm.renewalPeriod}
                    onChange={(e) => setEditForm({ ...editForm, renewalPeriod: parseInt(e.target.value) || 365 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="365"
                    min="1"
                    max="3650"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetEditForm}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
                  disabled={editing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editing}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editing ? 'Updating...' : 'Update Application'}
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
        yesText={alertModal.title === 'Delete Application' ? 'Delete' : 'OK'}
        noText={alertModal.title === 'Delete Application' ? 'Cancel' : 'Close'}
        yesStyle={
          alertModal.title === 'Delete Application' 
            ? 'bg-red-600 hover:bg-red-700 text-white' 
            : alertModal.title === 'Warning'
            ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }
      />
      </div>
    </AdminLayout>
  )
} 