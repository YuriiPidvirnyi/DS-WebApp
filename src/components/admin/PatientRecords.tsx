'use client'

import React, { useState } from 'react'
import {
  UserCircle,
  Phone,
  Mail,
  Calendar,
  Edit,
  Trash2,
  MapPin,
} from 'lucide-react'

interface PatientRecord {
  id: string
  fullName: string
  phone: string
  email: string
  birthDate?: string
  address?: string
  lastVisit?: string
  nextAppointment?: string
  notes?: string
  tags?: string[]
}

/**
 * Admin component for managing patient records
 */
export const PatientRecords: React.FC = () => {
  const [records] = useState<PatientRecord[]>([
    {
      id: 'p1',
      fullName: 'Марія Коваленко',
      phone: '+380671112233',
      email: 'maria@example.com',
      birthDate: '1990-05-15',
      address: 'Київ, вул. Хрещатик, 12',
      lastVisit: '2024-01-10',
      nextAppointment: '2024-01-25 14:30',
      tags: ['ортодонтія', 'VIP'],
      notes: 'План лікування на 6 місяців',
    },
  ])

  const [searchTerm, setSearchTerm] = useState('')

  const filtered = records.filter(
    r =>
      r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.phone.includes(searchTerm) ||
      r.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Patient Records</h1>
        <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
          Add Patient
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <input
          type="text"
          placeholder="Search patients by name, phone, or email..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(p => (
          <div key={p.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserCircle className="w-7 h-7 text-primary" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-bold text-gray-900 truncate">
                    {p.fullName}
                  </h3>
                  <div className="flex gap-2">
                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" /> {p.phone}
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" /> {p.email}
                  </div>
                  {p.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> {p.address}
                    </div>
                  )}
                  {p.birthDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Born{' '}
                      {new Date(p.birthDate).toLocaleDateString()}
                    </div>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {p.tags?.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {p.notes && (
                  <p className="mt-3 text-sm text-gray-700 line-clamp-2">
                    {p.notes}
                  </p>
                )}

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-500">
                  {p.lastVisit && (
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="font-medium text-gray-700">Last Visit</p>
                      <p>{new Date(p.lastVisit).toLocaleDateString()}</p>
                    </div>
                  )}
                  {p.nextAppointment && (
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="font-medium text-gray-700">
                        Next Appointment
                      </p>
                      <p>{p.nextAppointment}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">No patients found</p>
        </div>
      )}
    </div>
  )
}
