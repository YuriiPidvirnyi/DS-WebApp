'use client'

import React, { useState } from 'react'
import { Plus, Edit, Trash2, DollarSign, Clock } from 'lucide-react'

interface Service {
  id: string
  name: string
  description: string
  price: number
  duration: number
  category: string
  isActive: boolean
}

/**
 * Admin component for managing services
 */
export const ServiceManager: React.FC = () => {
  const [services] = useState<Service[]>([
    {
      id: '1',
      name: 'Професійна чистка зубів',
      description: 'Видалення зубного каменю та нальоту ультразвуком',
      price: 800,
      duration: 60,
      category: 'Профілактика',
      isActive: true,
    },
    {
      id: '2',
      name: 'Відбілювання зубів',
      description: 'Професійне відбілювання за технологією Zoom',
      price: 3000,
      duration: 90,
      category: 'Естетична стоматологія',
      isActive: true,
    },
  ])

  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredServices = services.filter(service => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'active' && service.isActive) ||
      (filter === 'inactive' && !service.isActive)

    const matchesSearch =
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.category.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesFilter && matchesSearch
  })

  const categories = [...new Set(services.map(s => s.category))]

  const stats = {
    total: services.length,
    active: services.filter(s => s.isActive).length,
    inactive: services.filter(s => !s.isActive).length,
    categories: categories.length,
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Service Management</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
          <Plus className="w-5 h-5" />
          Add Service
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Services</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Active</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Inactive</p>
          <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Categories</p>
          <p className="text-2xl font-bold text-blue-600">{stats.categories}</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search services..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />

          <div className="flex gap-2">
            {(['all', 'active', 'inactive'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === status
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map(service => (
          <div
            key={service.id}
            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {service.name}
                  </h3>
                  <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                    {service.category}
                  </span>
                </div>
                <div
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    service.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {service.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {service.description}
              </p>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <span className="font-semibold text-gray-900">
                    {service.price} грн
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{service.duration} хв</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors">
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">No services found</p>
        </div>
      )}

      {/* Category Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Services by Category</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(category => {
            const categoryServices = services.filter(
              s => s.category === category
            )
            const totalRevenue = categoryServices.reduce(
              (sum, s) => sum + s.price,
              0
            )

            return (
              <div key={category} className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">{category}</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>{categoryServices.length} services</p>
                  <p>
                    Avg price:{' '}
                    {Math.round(totalRevenue / categoryServices.length)} грн
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
