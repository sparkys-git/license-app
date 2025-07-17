'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getClientAdminUrl } from '../../lib/admin-config'
import { Search, Filter, CheckCircle, XCircle, AlertCircle, Shield, Clock, Globe, Mail, Key } from 'lucide-react'
import AlertModal from '../../components/AlertModal'
import AdminLayout from '../../components/AdminLayout'
import DataGrid from '../../components/DataGrid'

interface ValidationLog {
  id: string
  code: string
  email: string
  ipAddress: string
  validationCode: number
  validationMessage: string
  timestamp: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export default function ValidationLogsPage() {
  const [logs, setLogs] = useState<ValidationLog[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, pages: 0 })
  const [search, setSearch] = useState('')
  const [validationCode, setValidationCode] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'yes-no' as 'yes-no' | 'yes-no-cancel',
    onYes: () => {}
  })
  
  const router = useRouter()

  const fetchLogs = async (page = 1, searchQuery = '', filterCode = '', dateFromFilter = '', dateToFilter = '') => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        ...(searchQuery && { search: searchQuery }),
        ...(filterCode && { validationCode: filterCode }),
        ...(dateFromFilter && { dateFrom: dateFromFilter }),
        ...(dateToFilter && { dateTo: dateToFilter })
      })
      
      const response = await fetch(`/api/admin/validation-logs?${params}`)
      
      if (response.status === 401) {
        router.push('/login')
        return
      }
      
      const data = await response.json()
      
      setLogs(data.logs)
      setPagination(data.pagination)
      setAuthenticated(true)
    } catch (error) {
      console.error('Error fetching validation logs:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchLogs(1, search, validationCode, dateFrom, dateTo)
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

  const getValidationCodeBadge = (code: number, message: string) => {
    if (code === 100) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          {code}
        </span>
      )
    } else if (code >= 400 && code < 500) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
          <XCircle className="h-3 w-3 mr-1" />
          {code}
        </span>
      )
    } else if (code >= 500 && code < 600) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
          <AlertCircle className="h-3 w-3 mr-1" />
          {code}
        </span>
      )
    } else if (code >= 900) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
          <Shield className="h-3 w-3 mr-1" />
          {code}
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
        {code}
      </span>
    )
  }

  const clearFilters = () => {
    setSearch('')
    setValidationCode('')
    setDateFrom('')
    setDateTo('')
    fetchLogs(1)
  }

  const handleRefresh = () => {
    fetchLogs(pagination.page, search, validationCode, dateFrom, dateTo)
  }

  // Define columns for DataGrid
  const columns = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      render: (log: ValidationLog) => (
        <div className="flex items-center">
          <Clock className="h-4 w-4 text-gray-400 mr-2" />
          <span className="text-sm text-gray-900">
            {formatDate(log.timestamp)}
          </span>
        </div>
      )
    },
    {
      key: 'code',
      header: 'License Code',
      render: (log: ValidationLog) => (
        <div className="flex items-center">
          <Key className="h-4 w-4 text-gray-400 mr-2" />
          <span className="text-sm font-medium text-gray-900 font-mono">
            {log.code || 'N/A'}
          </span>
        </div>
      )
    },
    {
      key: 'email',
      header: 'Email',
      render: (log: ValidationLog) => (
        <div className="flex items-center">
          <Mail className="h-4 w-4 text-gray-400 mr-2" />
          <span className="text-sm text-gray-900">
            {log.email || 'N/A'}
          </span>
        </div>
      )
    },
    {
      key: 'ipAddress',
      header: 'IP Address',
      render: (log: ValidationLog) => (
        <div className="flex items-center">
          <Globe className="h-4 w-4 text-gray-400 mr-2" />
          <span className="text-sm text-gray-900 font-mono">
            {log.ipAddress}
          </span>
        </div>
      )
    },
    {
      key: 'validationCode',
      header: 'Result Code',
      render: (log: ValidationLog) => getValidationCodeBadge(log.validationCode, log.validationMessage)
    },
    {
      key: 'validationMessage',
      header: 'Message',
      render: (log: ValidationLog) => (
        <span className="text-sm text-gray-900">
          {log.validationMessage}
        </span>
      )
    }
  ]

  // Logout is now handled by AdminLayout

  const showErrorAlert = (message: string) => {
    setAlertModal({
      isOpen: true,
      title: 'Error',
      message: message,
      type: 'yes-no',
      onYes: () => {}
    })
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
    <AdminLayout currentPage="validation-logs">
      <div className="px-4 sm:px-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Validation Logs</h1>
          <p className="text-gray-600">Monitor license validation attempts and audit trail</p>
        </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Attempts</p>
              <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Successful</p>
              <p className="text-2xl font-bold text-gray-900">
                {logs.filter(log => log.validationCode === 100).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-orange-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Expired</p>
              <p className="text-2xl font-bold text-gray-900">
                {logs.filter(log => log.validationCode === 500).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <XCircle className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-gray-900">
                {logs.filter(log => log.validationCode !== 100 && log.validationCode !== 500).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by license code, email, or IP address..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Validation Code
                  </label>
                  <select
                    value={validationCode}
                    onChange={(e) => setValidationCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All codes</option>
                    <option value="100">100 - Success</option>
                    <option value="400">400 - Invalid request</option>
                    <option value="401">401 - Email mismatch</option>
                    <option value="403">403 - License disabled</option>
                    <option value="404">404 - Not found</option>
                    <option value="500">500 - Expired</option>
                    <option value="501">501 - Inactive</option>
                    <option value="502">502 - App inactive</option>
                    <option value="900">900 - System error</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date From
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date To
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="md:col-span-3 flex justify-end">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Logs Table */}
      <DataGrid
        data={logs}
        columns={columns}
        loading={loading}
        emptyMessage="No validation logs found"
        selectedItems={[]}
        onSelectionChange={() => {}}
        selectionKey="id"
        onRefresh={handleRefresh}
        className="mb-6"
      />

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="bg-white rounded-lg shadow px-4 py-3 flex items-center justify-between sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => fetchLogs(pagination.page - 1, search, validationCode, dateFrom, dateTo)}
              disabled={pagination.page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => fetchLogs(pagination.page + 1, search, validationCode, dateFrom, dateTo)}
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
                  onClick={() => fetchLogs(pagination.page - 1, search, validationCode, dateFrom, dateTo)}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(pagination.pages, 10) }, (_, i) => {
                  const pageNum = i + 1
                  return (
                    <button
                      key={pageNum}
                      onClick={() => fetchLogs(pageNum, search, validationCode, dateFrom, dateTo)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        pageNum === pagination.page
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                <button
                  onClick={() => fetchLogs(pagination.page + 1, search, validationCode, dateFrom, dateTo)}
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
    </AdminLayout>
  )
} 