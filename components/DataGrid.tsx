'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'

interface Column<T> {
  key: string
  header: string
  render: (item: T) => React.ReactNode
  sortable?: boolean
}

interface DataGridProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  emptyMessage?: string
  selectedItems?: T[]
  onSelectionChange?: (items: T[]) => void
  selectionKey: keyof T // The unique identifier field (e.g., 'id')
  headerActions?: React.ReactNode
  onRefresh?: () => void // New prop for refresh functionality
  className?: string
  selectionMode?: 'single' | 'multiple' // New prop for selection mode
}

export default function DataGrid<T>({
  data,
  columns,
  loading = false,
  emptyMessage = 'No data found',
  selectedItems = [],
  onSelectionChange,
  selectionKey,
  headerActions,
  onRefresh,
  className = '',
  selectionMode = 'multiple'
}: DataGridProps<T>) {
  const handleRowSelect = (item: T) => {
    if (onSelectionChange) {
      const isCurrentlySelected = selectedItems.some(selected => selected[selectionKey] === item[selectionKey])
      
      if (selectionMode === 'single') {
        // Single selection mode
        if (isCurrentlySelected) {
          // Deselect if already selected
          onSelectionChange([])
        } else {
          // Select only this item
          onSelectionChange([item])
        }
      } else {
        // Multiple selection mode
        if (isCurrentlySelected) {
          // Remove from selection
          onSelectionChange(selectedItems.filter(selected => selected[selectionKey] !== item[selectionKey]))
        } else {
          // Add to selection
          onSelectionChange([...selectedItems, item])
        }
      }
    }
  }

  const handleSelectAll = () => {
    if (onSelectionChange) {
      if (selectedItems.length === data.length) {
        // Deselect all
        onSelectionChange([])
      } else {
        // Select all
        onSelectionChange([...data])
      }
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
      {/* Header Actions */}
      {(headerActions || onRefresh) && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {headerActions}
              </div>
              <div className="text-sm text-gray-600">
                {selectedItems.length > 0 ? `${selectedItems.length} item${selectedItems.length === 1 ? '' : 's'} selected` : `${data.length} items`}
              </div>
            </div>
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={loading}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh data"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {/* Selection Column */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                {selectionMode === 'multiple' ? (
                  <input
                    type="checkbox"
                    checked={selectedItems.length === data.length && data.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                ) : (
                  <span className="sr-only">Select</span>
                )}
              </th>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-4 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, index) => {
                const isSelected = selectedItems.some(selected => selected[selectionKey] === item[selectionKey])
                return (
                  <tr
                    key={String(item[selectionKey])}
                    className={`hover:bg-gray-50 cursor-pointer ${
                      isSelected ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => handleRowSelect(item)}
                  >
                    {/* Selection Column */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type={selectionMode === 'single' ? 'radio' : 'checkbox'}
                        name={selectionMode === 'single' ? 'selection' : undefined}
                        checked={isSelected}
                        onChange={() => handleRowSelect(item)}
                        className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 ${
                          selectionMode === 'single' ? '' : 'rounded'
                        }`}
                      />
                    </td>
                    {columns.map((column) => (
                      <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                        {column.render(item)}
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
} 