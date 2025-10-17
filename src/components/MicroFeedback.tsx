import { useState } from 'react'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { trackEvent, AnalyticsEventCategory } from '@/utils/analytics'
import { sendFormFeedback } from '@/services/feedback'

interface MicroFeedbackProps {
  form: 'contact' | 'appointment' | 'callback' | 'newsletter'
  refId?: string
  compact?: boolean
}

export default function MicroFeedback({ form, refId, compact = false }: MicroFeedbackProps) {
  const [submitted, setSubmitted] = useState<boolean | null>(null)

  const handle = async (positive: boolean) => {
    if (submitted !== null) return
    setSubmitted(positive)
    // analytics
    try {
      trackEvent('form_feedback', AnalyticsEventCategory.Forms, { form, rating: positive ? 'up' : 'down', ref: refId })
    } catch {}
    // backend (mock fallback inside service)
    try {
      await sendFormFeedback({ form, rating: positive ? 'up' : 'down', refId })
    } catch {}
  }

  return (
    <div className={compact ? 'flex items-center gap-2' : 'mt-3'}>
      {!compact && (
        <span className="text-sm text-gray-600 mr-2">Ця форма була корисною?</span>
      )}
      <button
        type="button"
        aria-label="Так"
        onClick={() => handle(true)}
        className={`px-2 py-1 rounded-md border transition-colors ${submitted===true ? 'bg-green-50 border-green-300' : 'hover:bg-gray-50 border-gray-300'}`}
      >
        <ThumbsUp className="h-4 w-4 text-green-600" />
      </button>
      <button
        type="button"
        aria-label="Ні"
        onClick={() => handle(false)}
        className={`px-2 py-1 rounded-md border transition-colors ${submitted===false ? 'bg-red-50 border-red-300' : 'hover:bg-gray-50 border-gray-300'}`}
      >
        <ThumbsDown className="h-4 w-4 text-red-600" />
      </button>
      {submitted !== null && (
        <span className="ml-2 text-xs text-gray-500">Дякуємо за відгук!</span>
      )}
    </div>
  )
}
