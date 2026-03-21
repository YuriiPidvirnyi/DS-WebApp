import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, Filter, Download, Edit, Trash2, Eye } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getPatients, searchPatients } from '@/services/patientManagement'
import { Button, Input } from '@/components/ui'
import type { EnhancedPatient } from '@/types'

export default function PatientManagement() {
  const { t, i18n } = useTranslation()
  const [patients, setPatients] = useState<EnhancedPatient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'inactive'
  >('active')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const locale =
    i18n.language === 'pl'
      ? 'pl-PL'
      : i18n.language === 'en'
        ? 'en-US'
        : 'uk-UA'

  const loadPatients = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getPatients({
        page,
        limit: 20,
        status: statusFilter === 'all' ? undefined : statusFilter,
      })
      if (res.success && res.data) {
        setPatients(res.data.patients)
        setTotal(res.data.total)
      }
    } catch (error) {
      console.error('Failed to load patients:', error)
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => {
    loadPatients()
  }, [loadPatients])

  const handleSearch = async () => {
    if (!searchTerm) {
      loadPatients()
      return
    }

    setLoading(true)
    try {
      const res = await searchPatients({ term: searchTerm })
      if (res.success && res.data) {
        setPatients(res.data)
        setTotal(res.data.length)
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t('admin.patientManagement.title')}
            </h1>
            <p className="text-gray-600">
              {t('admin.patientManagement.totalPatients', { total })}
            </p>
          </div>
          <Button
            onClick={() => alert(t('admin.patientManagement.addPatientAlert'))}
          >
            <Plus className="w-5 h-5 mr-2" />
            {t('admin.patientManagement.newPatient')}
          </Button>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  className="pl-10"
                  placeholder={t('admin.patientManagement.searchPlaceholder')}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>
            <Button onClick={handleSearch} variant="outline">
              {t('admin.patientManagement.searchButton')}
            </Button>
            <select
              value={statusFilter}
              onChange={e =>
                setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')
              }
              className="px-4 py-2 border rounded-lg"
            >
              <option value="all">
                {t('admin.patientManagement.allStatuses')}
              </option>
              <option value="active">
                {t('admin.patientManagement.statuses.active')}
              </option>
              <option value="inactive">
                {t('admin.patientManagement.statuses.inactive')}
              </option>
            </select>
            <Button variant="outline">
              <Filter className="w-5 h-5 mr-2" />
              {t('admin.patientManagement.filters')}
            </Button>
            <Button variant="outline">
              <Download className="w-5 h-5 mr-2" />
              {t('admin.patientManagement.export')}
            </Button>
          </div>
        </div>

        {/* Patients Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dental-teal" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('admin.patientManagement.table.headers.fullName')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('admin.patientManagement.table.headers.phone')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('admin.patientManagement.table.headers.email')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('admin.patientManagement.table.headers.lastVisit')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('admin.patientManagement.table.headers.debt')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('admin.patientManagement.table.headers.status')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      {t('admin.patientManagement.table.headers.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {patients.map(patient => (
                    <tr key={patient.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-dental-teal/10 rounded-full flex items-center justify-center">
                            <span className="text-dental-teal font-semibold">
                              {patient.firstName[0]}
                              {patient.lastName[0]}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {patient.firstName} {patient.lastName}
                            </div>
                            {patient.tags.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {patient.tags.slice(0, 2).map(tag => (
                                  <span
                                    key={tag.id}
                                    className="px-2 py-0.5 text-xs rounded"
                                    style={{
                                      backgroundColor: tag.color + '20',
                                      color: tag.color,
                                    }}
                                  >
                                    {tag.label}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {patient.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {patient.email || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {patient.lastVisitDate
                          ? new Date(patient.lastVisitDate).toLocaleDateString(
                              locale
                            )
                          : t('admin.patientManagement.table.lastVisitNever')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`text-sm font-medium ${patient.outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}
                        >
                          {patient.outstandingBalance.toLocaleString(locale)}{' '}
                          {t('cabinet.currency')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            patient.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {patient.status === 'active'
                            ? t('admin.patientManagement.statuses.active')
                            : t('admin.patientManagement.statuses.inactive')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            className="text-blue-600 hover:text-blue-900"
                            title={t(
                              'admin.patientManagement.table.actions.view'
                            )}
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            className="text-green-600 hover:text-green-900"
                            title={t(
                              'admin.patientManagement.table.actions.edit'
                            )}
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900"
                            title={t(
                              'admin.patientManagement.table.actions.delete'
                            )}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && total > 20 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                {t('admin.patientManagement.pagination.shown', {
                  shown: Math.min(page * 20, total),
                  total,
                })}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  {t('common.previous')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page * 20 >= total}
                >
                  {t('common.next')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
