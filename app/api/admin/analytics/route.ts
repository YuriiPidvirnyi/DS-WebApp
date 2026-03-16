import { NextResponse } from 'next/server'
import { getCachedData, invalidateCache, CACHE_KEYS, CACHE_TTL } from '@/lib/redis'

export interface AnalyticsData {
  stats: {
    totalAppointments: number
    todayAppointments: number
    pendingAppointments: number
    completedAppointments: number
    totalPatients: number
    monthlyRevenue: number
    appointmentsTrend: number
    patientsTrend: number
  }
  weeklyData: Array<{
    name: string
    appointments: number
    revenue: number
  }>
  serviceBreakdown: Array<{
    name: string
    value: number
    color: string
  }>
  recentAppointments: Array<{
    id: number
    patient: string
    service: string
    time: string
    status: 'confirmed' | 'pending' | 'cancelled'
  }>
}

/**
 * GET /api/admin/analytics
 * Returns dashboard analytics data
 * 
 * In production, this would fetch from a database.
 * Currently returns mock data for demonstration.
 */
// Function to generate analytics data (would fetch from DB in production)
async function generateAnalyticsData(): Promise<AnalyticsData> {
  return {
      stats: {
        totalAppointments: 1248,
        todayAppointments: 12,
        pendingAppointments: 8,
        completedAppointments: 1156,
        totalPatients: 892,
        monthlyRevenue: 125600,
        appointmentsTrend: 12.5,
        patientsTrend: 8.3,
      },
      weeklyData: [
        { name: 'Mon', appointments: 24, revenue: 4800 },
        { name: 'Tue', appointments: 18, revenue: 3600 },
        { name: 'Wed', appointments: 32, revenue: 6400 },
        { name: 'Thu', appointments: 28, revenue: 5600 },
        { name: 'Fri', appointments: 35, revenue: 7000 },
        { name: 'Sat', appointments: 22, revenue: 4400 },
        { name: 'Sun', appointments: 0, revenue: 0 },
      ],
      serviceBreakdown: [
        { name: 'Professional Cleaning', value: 35, color: '#0d9488' },
        { name: 'Fillings', value: 25, color: '#3b82f6' },
        { name: 'Whitening', value: 20, color: '#8b5cf6' },
        { name: 'Extraction', value: 12, color: '#f59e0b' },
        { name: 'Other', value: 8, color: '#6b7280' },
      ],
      recentAppointments: [
        { id: 1, patient: 'Ivan Petrenko', service: 'Professional Cleaning', time: '10:00', status: 'confirmed' },
        { id: 2, patient: 'Maria Kovalenko', service: 'Consultation', time: '11:30', status: 'pending' },
        { id: 3, patient: 'Oleksandr Shevchenko', service: 'Filling', time: '14:00', status: 'confirmed' },
        { id: 4, patient: 'Anna Bondar', service: 'Whitening', time: '15:30', status: 'pending' },
        { id: 5, patient: 'Dmytro Lysenko', service: 'Extraction', time: '17:00', status: 'confirmed' },
      ],
    }
}

export async function GET() {
  try {
    // Use Redis caching for analytics data (5 minute TTL)
    const cacheKey = CACHE_KEYS.ANALYTICS
    const analyticsData = await getCachedData(
      cacheKey,
      generateAnalyticsData,
      CACHE_TTL.ANALYTICS
    )

    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/analytics
 * Allows updating or refreshing specific analytics metrics
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, dateRange } = body

    // Handle different analytics actions
    switch (action) {
      case 'refresh':
        // Invalidate the analytics cache to force refresh
        await invalidateCache(CACHE_KEYS.ANALYTICS)
        return NextResponse.json({ success: true, message: 'Analytics refreshed' })
      
      case 'export':
        // In production, this would generate an export file
        return NextResponse.json({ 
          success: true, 
          downloadUrl: '/api/admin/analytics/export',
          format: 'csv'
        })
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Analytics POST error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
