'use client'

import { useState } from 'react'
import { Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  bookingConfirmationEmail,
  appointmentReminderEmail,
  appointmentCancellationEmail,
  newBookingAdminEmail,
} from '@/lib/email-templates'

const SAMPLE_DATA = {
  patientName: 'Олена Коваль',
  service: 'Огляд і консультація',
  date: '2026-05-01',
  time: '10:00',
  doctorName: 'Dr. Іван Петренко',
  appointmentId: 'APT-DEMO-001',
  phone: '+380 44 123 4567',
  email: 'olena.koval@example.com',
  reason: 'Пацієнт скасував запис',
}

type TabId = 'confirmation' | 'reminder' | 'cancellation' | 'admin'

interface Tab {
  id: TabId
  label: string
}

function getTemplateForTab(tabId: TabId): { subject: string; html: string } {
  switch (tabId) {
    case 'confirmation':
      return bookingConfirmationEmail({
        patientName: SAMPLE_DATA.patientName,
        service: SAMPLE_DATA.service,
        date: SAMPLE_DATA.date,
        time: SAMPLE_DATA.time,
        appointmentId: SAMPLE_DATA.appointmentId,
        doctorName: SAMPLE_DATA.doctorName,
      })
    case 'reminder':
      return appointmentReminderEmail({
        patientName: SAMPLE_DATA.patientName,
        service: SAMPLE_DATA.service,
        date: SAMPLE_DATA.date,
        time: SAMPLE_DATA.time,
        appointmentId: SAMPLE_DATA.appointmentId,
        doctorName: SAMPLE_DATA.doctorName,
      })
    case 'cancellation':
      return appointmentCancellationEmail({
        patientName: SAMPLE_DATA.patientName,
        service: SAMPLE_DATA.service,
        date: SAMPLE_DATA.date,
        time: SAMPLE_DATA.time,
        reason: SAMPLE_DATA.reason,
      })
    case 'admin':
      return newBookingAdminEmail({
        patientName: SAMPLE_DATA.patientName,
        phone: SAMPLE_DATA.phone,
        email: SAMPLE_DATA.email,
        service: SAMPLE_DATA.service,
        date: SAMPLE_DATA.date,
        time: SAMPLE_DATA.time,
        appointmentId: SAMPLE_DATA.appointmentId,
      })
  }
}

export default function AdminEmailTemplatesPage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<TabId>('confirmation')

  const TABS: Tab[] = [
    {
      id: 'confirmation',
      label: t('admin.emailTemplatesPage.tabs.confirmation'),
    },
    { id: 'reminder', label: t('admin.emailTemplatesPage.tabs.reminder') },
    {
      id: 'cancellation',
      label: t('admin.emailTemplatesPage.tabs.cancellation'),
    },
    { id: 'admin', label: t('admin.emailTemplatesPage.tabs.admin') },
  ]

  const { subject, html } = getTemplateForTab(activeTab)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-dental-dark">
            <Mail className="h-6 w-6 text-dental-teal" />
            Email Templates
          </h1>
          <p className="text-sm text-dental-text-light">
            Live preview of transactional email templates with sample data
          </p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-dental-secondary-200">
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-dental-teal text-dental-teal'
                : 'text-dental-text hover:text-dental-dark'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-dental-text">
          {t('admin.emailTemplatesPage.subjectLabel')}: {subject}
        </p>
        <iframe
          srcDoc={html}
          className="w-full border border-dental-secondary-200 rounded-xl"
          style={{ height: '600px' }}
          title="Email preview"
        />
      </div>
    </div>
  )
}
