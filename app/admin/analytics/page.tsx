'use client'

import { useAdminPageAccess } from '@/hooks/useAdminPageAccess'
import AdminPageLoading from '@/components/admin/AdminPageLoading'
import AdminAnalyticsPage from '@/views/admin/AdminAnalyticsPage'

export default function AdminRoute() {
  const isLoading = useAdminPageAccess('analytics:view')

  if (isLoading) {
    return <AdminPageLoading />
  }

  return <AdminAnalyticsPage />
}
