'use client'

import React, { useState } from 'react'
import {
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Eye,
  MousePointer,
  Clock,
  Award,
} from 'lucide-react'

interface MetricCard {
  title: string
  value: string | number
  change: number
  icon: React.ReactNode
  color: string
}

/**
 * Analytics dashboard with key metrics and trends
 */
export const AnalyticsDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')

  const metrics: MetricCard[] = [
    {
      title: 'Total Appointments',
      value: 342,
      change: 12.5,
      icon: <Calendar className="w-6 h-6" />,
      color: 'bg-blue-500',
    },
    {
      title: 'New Patients',
      value: 89,
      change: 8.2,
      icon: <Users className="w-6 h-6" />,
      color: 'bg-green-500',
    },
    {
      title: 'Revenue',
      value: '$24,680',
      change: 15.3,
      icon: <DollarSign className="w-6 h-6" />,
      color: 'bg-purple-500',
    },
    {
      title: 'Website Visitors',
      value: '12.5K',
      change: 22.1,
      icon: <Eye className="w-6 h-6" />,
      color: 'bg-orange-500',
    },
    {
      title: 'Conversion Rate',
      value: '3.8%',
      change: 1.2,
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'bg-teal-500',
    },
    {
      title: 'Avg Session Duration',
      value: '4m 32s',
      change: 5.7,
      icon: <Clock className="w-6 h-6" />,
      color: 'bg-indigo-500',
    },
    {
      title: 'Page Views',
      value: '45.2K',
      change: 18.9,
      icon: <MousePointer className="w-6 h-6" />,
      color: 'bg-pink-500',
    },
    {
      title: 'Patient Satisfaction',
      value: '4.9/5',
      change: 2.1,
      icon: <Award className="w-6 h-6" />,
      color: 'bg-yellow-500',
    },
  ]

  const topServices = [
    { name: 'Професійна чистка зубів', bookings: 89, revenue: 8900 },
    { name: 'Встановлення пломб', bookings: 67, revenue: 10050 },
    { name: 'Відбілювання зубів', bookings: 45, revenue: 13500 },
    { name: 'Видалення зубів', bookings: 34, revenue: 5100 },
    { name: 'Ортодонтичні консультації', bookings: 28, revenue: 2800 },
  ]

  const recentActivity = [
    {
      type: 'appointment',
      message: 'Нове бронювання від Іван Петренко',
      time: '5 хвилин тому',
    },
    {
      type: 'review',
      message: 'Отримано новий відгук (5 зірок)',
      time: '1 годину тому',
    },
    {
      type: 'payment',
      message: 'Платіж на суму 1500 грн оброблено',
      time: '2 години тому',
    },
    {
      type: 'appointment',
      message: 'Відмінено зустріч з Марія Коваленко',
      time: '3 години тому',
    },
    {
      type: 'user',
      message: 'Новий користувач зареєструвався',
      time: '4 години тому',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>

        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                timeRange === range
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range === '7d' && 'Last 7 Days'}
              {range === '30d' && 'Last 30 Days'}
              {range === '90d' && 'Last 90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(metric => (
          <div key={metric.title} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`${metric.color} rounded-lg p-3 text-white`}>
                {metric.icon}
              </div>
              <div
                className={`flex items-center gap-1 text-sm font-medium ${
                  metric.change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                <TrendingUp
                  className={`w-4 h-4 ${metric.change < 0 ? 'rotate-180' : ''}`}
                />
                {Math.abs(metric.change)}%
              </div>
            </div>

            <div>
              <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
              <p className="text-sm text-gray-600 mt-1">{metric.title}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Services */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Top Services</h2>

          <div className="space-y-4">
            {topServices.map((service, index) => (
              <div
                key={service.name}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{service.name}</p>
                    <p className="text-sm text-gray-500">
                      {service.bookings} bookings
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {service.revenue} грн
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>

          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-3">
                <div
                  className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                    activity.type === 'appointment'
                      ? 'bg-blue-500'
                      : activity.type === 'review'
                        ? 'bg-yellow-500'
                        : activity.type === 'payment'
                          ? 'bg-green-500'
                          : 'bg-gray-500'
                  }`}
                />
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Traffic Sources Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Traffic Sources</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Organic Search</span>
              <span className="text-sm font-semibold">45%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: '45%' }}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Direct</span>
              <span className="text-sm font-semibold">30%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: '30%' }}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Social Media</span>
              <span className="text-sm font-semibold">15%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full"
                style={{ width: '15%' }}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Referral</span>
              <span className="text-sm font-semibold">7%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange-600 h-2 rounded-full"
                style={{ width: '7%' }}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Email</span>
              <span className="text-sm font-semibold">3%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-pink-600 h-2 rounded-full"
                style={{ width: '3%' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
