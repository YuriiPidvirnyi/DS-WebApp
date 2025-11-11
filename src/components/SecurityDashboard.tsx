import React, { useState, useEffect } from 'react'
import { auditLogger, sessionManager, csrfToken } from '../utils/security'

/**
 * Security monitoring dashboard for admins
 */
export const SecurityDashboard: React.FC = () => {
  const [logs, setLogs] = useState(auditLogger.getLogs())
  const [filter, setFilter] = useState<{
    severity?: 'info' | 'warning' | 'error' | 'critical'
    action?: string
  }>({})

  useEffect(() => {
    const interval = setInterval(() => {
      setLogs(auditLogger.getLogs(filter))
    }, 5000)

    return () => clearInterval(interval)
  }, [filter])

  const session = sessionManager.getSession()
  const token = csrfToken.getToken()

  const severityColors = {
    info: 'text-blue-600 bg-blue-100',
    warning: 'text-yellow-600 bg-yellow-100',
    error: 'text-orange-600 bg-orange-100',
    critical: 'text-red-600 bg-red-100',
  }

  const criticalCount = logs.filter(l => l.severity === 'critical').length
  const errorCount = logs.filter(l => l.severity === 'error').length
  const warningCount = logs.filter(l => l.severity === 'warning').length

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Security Dashboard</h2>
        <button
          onClick={() => {
            auditLogger.clear()
            setLogs([])
          }}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Clear Logs
        </button>
      </div>

      {/* Session Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="text-sm font-semibold text-gray-600">
            Session Status
          </h3>
          <p className="text-2xl font-bold mt-2">
            {session ? 'Active' : 'Inactive'}
          </p>
          {session && (
            <p className="text-sm text-gray-500 mt-1">
              Created: {new Date(session.createdAt).toLocaleTimeString()}
            </p>
          )}
        </div>

        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="text-sm font-semibold text-gray-600">CSRF Token</h3>
          <p className="text-sm font-mono mt-2 truncate">
            {token ? token.slice(0, 16) + '...' : 'None'}
          </p>
        </div>

        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="text-sm font-semibold text-gray-600">Total Logs</h3>
          <p className="text-2xl font-bold mt-2">{logs.length}</p>
        </div>
      </div>

      {/* Alert Counts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <h3 className="text-sm font-semibold text-red-800">Critical</h3>
          <p className="text-3xl font-bold text-red-600 mt-2">
            {criticalCount}
          </p>
        </div>

        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
          <h3 className="text-sm font-semibold text-orange-800">Errors</h3>
          <p className="text-3xl font-bold text-orange-600 mt-2">
            {errorCount}
          </p>
        </div>

        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <h3 className="text-sm font-semibold text-yellow-800">Warnings</h3>
          <p className="text-3xl font-bold text-yellow-600 mt-2">
            {warningCount}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={filter.severity || ''}
          onChange={e =>
            setFilter({
              ...filter,
              severity: (e.target.value as any) || undefined,
            })
          }
          className="px-4 py-2 border rounded"
        >
          <option value="">All Severities</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.slice(0, 100).map(log => (
                <tr key={log.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded ${severityColors[log.severity]}`}
                    >
                      {log.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.action}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.userId || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {log.details ? (
                      <details className="cursor-pointer">
                        <summary>View</summary>
                        <pre className="mt-2 text-xs bg-gray-50 p-2 rounded">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </details>
                    ) : (
                      'N/A'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {logs.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No logs to display
          </div>
        )}
      </div>
    </div>
  )
}
