import React, { useState, useEffect } from 'react'
import { Activity, AlertCircle, Clock, Zap, Database } from 'lucide-react'
import { monitoring } from '../services/monitoring'
import { featureFlags } from '../services/featureFlags'

/**
 * Monitoring and observability dashboard
 */
export const MonitoringDashboard: React.FC = () => {
  const [data, setData] = useState(monitoring.exportData())
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      setData(monitoring.exportData())
    }, 5000)

    return () => clearInterval(interval)
  }, [autoRefresh])

  const health = data.health
  const recentErrors = data.errors.slice(-10).reverse()
  const recentMetrics = data.metrics.slice(-20).reverse()

  const getHealthColor = () => {
    switch (health.status) {
      case 'healthy': return 'bg-green-500'
      case 'degraded': return 'bg-yellow-500'
      case 'unhealthy': return 'bg-red-500'
    }
  }

  const getHealthIcon = () => {
    switch (health.status) {
      case 'healthy': return '✓'
      case 'degraded': return '⚠'
      case 'unhealthy': return '✕'
    }
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Monitoring Dashboard</h1>
        
        <div className="flex gap-3 items-center">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh
          </label>
          
          <button
            onClick={() => setData(monitoring.exportData())}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh Now
          </button>
        </div>
      </div>

      {/* Health Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 ${getHealthColor()} rounded-full flex items-center justify-center text-white text-2xl font-bold`}>
            {getHealthIcon()}
          </div>
          
          <div className="flex-1">
            <h2 className="text-2xl font-bold capitalize">{health.status}</h2>
            <p className="text-gray-600">System Health Status</p>
          </div>

          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-sm text-gray-600">Error Rate</p>
              <p className="text-xl font-bold">{health.metrics.errorRate.toFixed(3)}/s</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Response</p>
              <p className="text-xl font-bold">{health.metrics.avgResponseTime.toFixed(0)}ms</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Memory</p>
              <p className="text-xl font-bold">{health.metrics.memoryUsage.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-8 h-8 text-blue-500" />
            <span className="text-sm text-gray-600">Total Metrics</span>
          </div>
          <p className="text-2xl font-bold">{data.metrics.length}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <span className="text-sm text-gray-600">Total Errors</span>
          </div>
          <p className="text-2xl font-bold">{data.errors.length}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 text-green-500" />
            <span className="text-sm text-gray-600">Session Events</span>
          </div>
          <p className="text-2xl font-bold">{data.sessionEvents.length}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <Zap className="w-8 h-8 text-yellow-500" />
            <span className="text-sm text-gray-600">Performance</span>
          </div>
          <p className="text-2xl font-bold">
            {monitoring.measurePerformance().fcp?.toFixed(0) || 'N/A'}ms
          </p>
        </div>
      </div>

      {/* Recent Errors */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Recent Errors</h2>
        </div>
        
        <div className="divide-y">
          {recentErrors.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No errors recorded</div>
          ) : (
            recentErrors.map((error, i) => (
              <div key={i} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                        error.level === 'error' ? 'bg-red-100 text-red-800' :
                        error.level === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {error.level}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(error.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <p className="text-sm font-medium text-gray-900">{error.message}</p>
                    
                    {error.stack && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-600 cursor-pointer">Stack trace</summary>
                        <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                          {error.stack}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Metrics */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Recent Metrics</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tags</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentMetrics.map((metric, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(metric.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {metric.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {metric.value.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {metric.tags ? JSON.stringify(metric.tags) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {recentMetrics.length === 0 && (
            <div className="p-6 text-center text-gray-500">No metrics recorded</div>
          )}
        </div>
      </div>

      {/* Feature Flags */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Feature Flags</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {featureFlags.getAllFlags().map(flag => (
            <div key={flag.key} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{flag.key}</span>
                <span className={`px-2 py-1 text-xs font-medium rounded ${
                  flag.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {flag.enabled ? 'ON' : 'OFF'}
                </span>
              </div>
              {flag.description && (
                <p className="text-sm text-gray-600">{flag.description}</p>
              )}
              {flag.rolloutPercentage !== undefined && (
                <p className="text-xs text-gray-500 mt-1">
                  Rollout: {flag.rolloutPercentage}%
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Actions</h2>
        
        <div className="flex gap-4">
          <button
            onClick={() => {
              const data = monitoring.exportData()
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `monitoring-${Date.now()}.json`
              a.click()
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Database className="w-4 h-4 inline mr-2" />
            Export Data
          </button>

          <button
            onClick={() => {
              if (confirm('Are you sure you want to clear all monitoring data?')) {
                monitoring.clear()
                setData(monitoring.exportData())
              }
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Clear Data
          </button>
        </div>
      </div>
    </div>
  )
}
