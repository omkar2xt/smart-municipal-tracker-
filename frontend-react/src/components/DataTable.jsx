import { Card, StatusBadge } from './common'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

/**
 * Data Table Component
 * Responsive table for displaying data with pagination
 */
export const DataTable = ({
  columns,
  data,
  loading = false,
  onRowClick,
  pagination = true,
  pageSize = 10,
}) => {
  const [currentPage, setCurrentPage] = React.useState(1)

  const totalPages = Math.ceil(data.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedData = pagination ? data.slice(startIndex, startIndex + pageSize) : data

  const goToPage = (page) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages))
  }

  // Mobile View
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  if (loading) {
    return (
      <Card className="p-6 text-center">
        <div className="w-8 h-8 border-4 border-gray-300 dark:border-gray-600 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
        <p className="text-gray-600 dark:text-gray-400 mt-4">Loading...</p>
      </Card>
    )
  }

  if (!paginatedData || paginatedData.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-600 dark:text-gray-400">No data available</p>
      </Card>
    )
  }

  // Mobile Card View
  if (isMobile) {
    return (
      <div className="space-y-3">
        {paginatedData.map((row, idx) => (
          <Card
            key={idx}
            className="p-4 cursor-pointer"
            onClick={() => onRowClick?.(row)}
          >
            <div className="space-y-2">
              {columns.map((col) => (
                <div key={col.key} className="flex justify-between text-sm">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {col.label}:
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        ))}

        {pagination && totalPages > 1 && (
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    )
  }

  // Desktop Table View
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200 dark:border-gray-700">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, idx) => (
              <tr
                key={idx}
                className="table-row cursor-pointer"
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && totalPages > 1 && (
        <div className="flex justify-between items-center flex-wrap gap-2">
          <button
            onClick={() => goToPage(1)}
            disabled={currentPage === 1}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50 transition-colors"
          >
            <ChevronsLeft size={20} />
          </button>
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`px-3 py-2 rounded text-sm font-semibold transition-colors ${
                  currentPage === page
                    ? 'bg-primary-600 text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
          <button
            onClick={() => goToPage(totalPages)}
            disabled={currentPage === totalPages}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50 transition-colors"
          >
            <ChevronsRight size={20} />
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * Filter Bar Component
 */
export const FilterBar = ({ filters, onFilterChange, onReset }) => (
  <Card className="p-4 mb-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Object.entries(filters).map(([key, value]) => (
        <div key={key}>
          <input
            type="text"
            placeholder={`Filter by ${key}`}
            value={value}
            onChange={(e) => onFilterChange(key, e.target.value)}
            className="input-field text-sm"
          />
        </div>
      ))}
      <div className="flex gap-2 items-end">
        <button
          onClick={onReset}
          className="btn-secondary text-sm w-full"
        >
          Reset
        </button>
      </div>
    </div>
  </Card>
)

import React from 'react'
export default {
  DataTable,
  FilterBar,
}
