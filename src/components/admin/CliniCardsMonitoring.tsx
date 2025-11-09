import React, { useState, useEffect } from 'react'
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Database,
  Users,
  Calendar,
  CreditCard,
  TrendingUp,
  TrendingDown,
  BarChart3,
  XCircle,
} from 'lucide-react'
import { getCliniCardsApi } from '../../services/clinicardsApi'
import { monitoring } from '../../services/monitoring'

interface ApiHealthMetrics {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown'
  lastCheck: Date
  responseTime: number
  errorRate: number
  successfulCalls: number
  failedCalls: number
  cacheHitRate: number
}

interface EndpointStats {
  endpoint: string
  calls: number
  avgResponseTime: number
  errorCount: number
  lastCall: Date
}

interface SyncStatus {
  patients: { synced: number; total: number; lastSync: Date | null }
  appointments: { synced: number; total: number; lastSync: Date | null }
  treatments: { synced: number; total: number; lastSync: Date | null }
  payments: { synced: number; total: number; lastSync: Date | null }
  priceList: { synced: number; total: number; lastSync: Date | null }
}

/**
 * Admin dashboard for CliniCards integration monitoring
 */
export const CliniCardsMonitoring: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [healthMetrics, setHealthMetrics] = useState<ApiHealthMetrics>({
    status: 'unknown',
    lastCheck: new Date(),
    responseTime: 0,
    errorRate: 0,
    successfulCalls: 0,
    failedCalls: 0,
    cacheHitRate: 0,
  })

  const [endpointStats, setEndpointStats] = useState<EndpointStats[]>([])
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    patients: { synced: 0, total: 0, lastSync: null },
    appointments: { synced: 0, total: 0, lastSync: null },
    treatments: { synced: 0, total: 0, lastSync: null },
    payments: { synced: 0, total: 0, lastSync: null },
    priceList: { synced: 0, total: 0, lastSync: null },
  })

  const [selectedTimeRange, setSelectedTimeRange] = useState<
    '1h' | '24h' | '7d' | '30d'
  >('24h')

  const loadMetrics = React.useCallback(async () => {
    if (!refreshing) setLoading(true)

    try {
      await Promise.all([
        loadHealthMetrics(),
        loadEndpointStats(),
        loadSyncStatus(),
      ])
    } catch (error) {
      console.error('Failed to load metrics:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [selectedTimeRange, refreshing])

  useEffect(() => {
    void loadMetrics()

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      void loadMetrics()
    }, 30000)

    return () => clearInterval(interval)
  }, [loadMetrics])

  const loadHealthMetrics = async () => {
    const api = getCliniCardsApi()

    // Test API connectivity
    const startTime = Date.now()
    const testResponse = await api.getSchedule({
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    })
    const responseTime = Date.now() - startTime

    // Get metrics from monitoring service
    const timeRangeMs = getTimeRangeMs(selectedTimeRange)
    const apiMetrics = monitoring.getMetrics({
      name: 'timing.api',
      since: Date.now() - timeRangeMs,
    })

    const successfulCalls = apiMetrics.filter(
      m => m.tags?.success === 'true'
    ).length
    const failedCalls = apiMetrics.filter(
      m => m.tags?.success === 'false'
    ).length
    const totalCalls = successfulCalls + failedCalls

    const errorRate = totalCalls > 0 ? failedCalls / totalCalls : 0

    // Calculate cache hit rate (simplified)
    const cacheHitRate = 0.85 // This would come from actual cache metrics

    let status: ApiHealthMetrics['status'] = 'healthy'
    if (!testResponse.success || errorRate > 0.1) {
      status = 'unhealthy'
    } else if (errorRate > 0.05 || responseTime > 1000) {
      status = 'degraded'
    }

    setHealthMetrics({
      status,
      lastCheck: new Date(),
      responseTime,
      errorRate: errorRate * 100,
      successfulCalls,
      failedCalls,
      cacheHitRate: cacheHitRate * 100,
    })
  }

  const loadEndpointStats = async () => {
    const timeRangeMs = getTimeRangeMs(selectedTimeRange)
    const apiMetrics = monitoring.getMetrics({
      name: 'timing.api',
      since: Date.now() - timeRangeMs,
    })

    const endpointMap = new Map<
      string,
      {
        calls: number
        totalTime: number
        errors: number
        lastCall: number
      }
    >()

    apiMetrics.forEach(metric => {
      const endpoint = metric.tags?.endpoint || 'unknown'
      const isError = metric.tags?.success === 'false'

      if (!endpointMap.has(endpoint)) {
        endpointMap.set(endpoint, {
          calls: 0,
          totalTime: 0,
          errors: 0,
          lastCall: 0,
        })
      }

      const stats = endpointMap.get(endpoint)!
      stats.calls++
      stats.totalTime += metric.value
      if (isError) stats.errors++
      stats.lastCall = Math.max(stats.lastCall, metric.timestamp)
    })

    const stats: EndpointStats[] = Array.from(endpointMap.entries()).map(
      ([endpoint, data]) => ({
        endpoint,
        calls: data.calls,
        avgResponseTime: data.calls > 0 ? data.totalTime / data.calls : 0,
        errorCount: data.errors,
        lastCall: new Date(data.lastCall),
      })
    )

    stats.sort((a, b) => b.calls - a.calls)
    setEndpointStats(stats)
  }

  const loadSyncStatus = async () => {
    // In production, this would query backend for sync status
    // For now, using localStorage to track sync timestamps
    const getSyncInfo = (key: string) => {
      try {
        const cached = localStorage.getItem(key)
        if (cached) {
          const { data, timestamp } = JSON.parse(cached)
          return {
            synced: Array.isArray(data) ? data.length : 1,
            total: Array.isArray(data) ? data.length : 1,
            lastSync: new Date(timestamp),
          }
        }
      } catch (error) {
        console.error(`Failed to get sync info for ${key}:`, error)
      }
      return { synced: 0, total: 0, lastSync: null }
    }

    setSyncStatus({
      patients: getSyncInfo('clinicards_patients'),
      appointments: getSyncInfo('clinicards_appointments'),
      treatments: getSyncInfo('clinicards_treatments'),
      payments: getSyncInfo('clinicards_payments'),
      priceList: getSyncInfo('clinicards_price_list'),
    })
  }

  const getTimeRangeMs = (range: typeof selectedTimeRange): number => {
    const ranges = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    }
    return ranges[range]
  }

  const handleRefresh = () => {
    setRefreshing(true)
    void loadMetrics()
  }

  const getStatusIcon = (status: ApiHealthMetrics['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-8 h-8 text-green-600" />
      case 'degraded':
        return <AlertCircle className="w-8 h-8 text-yellow-600" />
      case 'unhealthy':
        return <XCircle className="w-8 h-8 text-red-600" />
      default:
        return <Activity className="w-8 h-8 text-gray-400" />
    }
  }

  const getStatusColor = (status: ApiHealthMetrics['status']) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-50 border-green-200 text-green-900'
      case 'degraded':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900'
      case 'unhealthy':
        return 'bg-red-50 border-red-200 text-red-900'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900'
    }
  }

  const getStatusText = (status: ApiHealthMetrics['status']) => {
    switch (status) {
      case 'healthy':
        return 'Працює нормально'
      case 'degraded':
        return 'Уповільнена робота'
      case 'unhealthy':
        return 'Критичні помилки'
      default:
        return 'Невідомо'
    }
  }

  if (loading && !refreshing) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Завантаження метрик...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Моніторинг CliniCards</h1>
          <p className="text-gray-600 mt-1">
            Останнє оновлення:{' '}
            {healthMetrics.lastCheck.toLocaleTimeString('uk-UA')}
          </p>
        </div>

        <div className="flex gap-2">
          {/* Time Range Selector */}
          <select
            value={selectedTimeRange}
            onChange={e =>
              setSelectedTimeRange(e.target.value as typeof selectedTimeRange)
            }
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
          >
            <option value="1h">Остання година</option>
            <option value="24h">Останні 24 години</option>
            <option value="7d">Останні 7 днів</option>
            <option value="30d">Останні 30 днів</option>
          </select>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
          >
            <RefreshCw
              className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`}
            />
            Оновити
          </button>
        </div>
      </div>

      {/* Health Status Card */}
      <div
        className={`border-2 rounded-lg p-6 ${getStatusColor(healthMetrics.status)}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {getStatusIcon(healthMetrics.status)}
            <div>
              <h2 className="text-2xl font-bold">
                {getStatusText(healthMetrics.status)}
              </h2>
              <p className="text-sm mt-1">API CliniCards</p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-3xl font-bold">
              {healthMetrics.responseTime}ms
            </div>
            <p className="text-sm">Час відповіді</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-900">
            {healthMetrics.successfulCalls}
          </p>
          <p className="text-sm text-gray-600">Успішні запити</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
            <TrendingDown className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-red-900">
            {healthMetrics.failedCalls}
          </p>
          <p className="text-sm text-gray-600">Помилки</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <AlertCircle className="w-8 h-8 text-orange-600" />
            <BarChart3 className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-orange-900">
            {healthMetrics.errorRate.toFixed(1)}%
          </p>
          <p className="text-sm text-gray-600">Рівень помилок</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <Database className="w-8 h-8 text-blue-600" />
            <Activity className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-blue-900">
            {healthMetrics.cacheHitRate.toFixed(0)}%
          </p>
          <p className="text-sm text-gray-600">Кеш hit rate</p>
        </div>
      </div>

      {/* Endpoint Statistics */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <BarChart3 className="w-6 h-6" />
          Статистика ендпоінтів
        </h2>

        {endpointStats.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Немає даних за вибраний період</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ендпоінт
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Запитів
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Серед. час
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Помилки
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Останній запит
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {endpointStats.map(stat => (
                  <tr key={stat.endpoint} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium">
                      {stat.endpoint}
                    </td>
                    <td className="px-6 py-4 text-sm">{stat.calls}</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`font-medium ${
                          stat.avgResponseTime > 1000
                            ? 'text-red-600'
                            : stat.avgResponseTime > 500
                              ? 'text-yellow-600'
                              : 'text-green-600'
                        }`}
                      >
                        {Math.round(stat.avgResponseTime)}ms
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {stat.errorCount > 0 ? (
                        <span className="text-red-600 font-bold">
                          {stat.errorCount}
                        </span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {stat.lastCall.toLocaleTimeString('uk-UA')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sync Status */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Database className="w-6 h-6" />
          Статус синхронізації
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { key: 'patients', label: 'Пацієнти', icon: Users },
            { key: 'appointments', label: 'Візити', icon: Calendar },
            { key: 'treatments', label: 'Лікування', icon: Activity },
            { key: 'payments', label: 'Платежі', icon: CreditCard },
            { key: 'priceList', label: 'Прайс', icon: BarChart3 },
          ].map(({ key, label, icon: Icon }) => {
            const status = syncStatus[key as keyof SyncStatus]
            const syncPercentage =
              status.total > 0 ? (status.synced / status.total) * 100 : 0

            return (
              <div key={key} className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <Icon className="w-6 h-6 text-primary" />
                  <h3 className="font-bold">{label}</h3>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Синхронізовано</span>
                    <span className="font-bold">
                      {status.synced} / {status.total}
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        syncPercentage === 100
                          ? 'bg-green-600'
                          : syncPercentage > 50
                            ? 'bg-blue-600'
                            : 'bg-yellow-600'
                      }`}
                      style={{ width: `${syncPercentage}%` }}
                    />
                  </div>

                  {status.lastSync && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{status.lastSync.toLocaleString('uk-UA')}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
