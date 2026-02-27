'use client'

import useAnalytics from '@/hooks/useAnalytics'
import { useReminders } from '@/hooks/useReminders'

/**
 * Initializes analytics and reminder checking.
 *
 * Loaded via next/dynamic with ssr:false so that the entire import chain
 * (analytics, consent, reminders, toast, calendar utilities) is deferred
 * to a separate chunk — keeping them off the critical hydration path.
 *
 * GA4 is loaded via next/script in app/layout.tsx.
 * Sentry is initialised via instrumentation-client.ts.
 */
export default function AppInitializer() {
  useAnalytics()
  useReminders()
  return null
}
