import { useState } from 'react'
import { ThumbsUp, ThumbsDown, Send } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { trackEvent, AnalyticsEventCategory } from '@/utils/analytics'
import { sendFormFeedback } from '@/services/feedback'
import { feedbackCommentSchema, type FeedbackCommentData } from '@/utils/validationSchemas'

interface MicroFeedbackProps {
  form: 'contact' | 'appointment' | 'callback' | 'newsletter'
  refId?: string
  compact?: boolean
}

export default function MicroFeedback({ form, refId, compact = false }: MicroFeedbackProps) {
  const [submitted, setSubmitted] = useState<boolean | null>(null) // can be true, false, or null
  const [showCommentForm, setShowCommentForm] = useState(false)
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting } 
  } = useForm<FeedbackCommentData>({
    resolver: zodResolver(feedbackCommentSchema)
  })

  const handle = async (positive: boolean) => {
    if (submitted !== null) return
    setSubmitted(positive)
    // analytics
    try {
      trackEvent('form_feedback', AnalyticsEventCategory.Forms, { form, rating: positive ? 'up' : 'down', ref: refId })
    } catch {}

    // If negative feedback, show comment form instead of immediately submitting
    if (!positive) {
      setShowCommentForm(true)
      // Send the initial feedback without comment
      try {
        await sendFormFeedback({ form, rating: 'down', refId })
      } catch {}
      return
    }
    
    // backend (mock fallback inside service)
    try {
      await sendFormFeedback({ form, rating: positive ? 'up' : 'down', refId })
    } catch {}
  }
  
  const onSubmitComment = async (data: FeedbackCommentData) => {
    try {
      trackEvent('feedback_comment', AnalyticsEventCategory.Forms, { form, ref: refId })
      await sendFormFeedback({ form, rating: 'down', refId, comment: data.comment })
      setShowCommentForm(false)
    } catch {}
  }

  return (
    <div className={compact ? 'flex items-center gap-2' : 'mt-3'}>
      {/* Feedback buttons */}
      {(!submitted || (submitted === false as boolean && !showCommentForm)) && (
        <>
          {!compact && (
            <span className="text-sm text-gray-600 mr-2">Ця форма була корисною?</span>
          )}
      <button
        type="button"
        aria-label="Так"
        onClick={() => handle(true)}
        className={`px-2 py-1 rounded-md border transition-colors ${submitted === true as boolean ? 'bg-green-50 border-green-300' : 'hover:bg-gray-50 border-gray-300'}`}
        disabled={submitted !== null}
      >
            <ThumbsUp className="h-4 w-4 text-green-600" />
          </button>
      <button
        type="button"
        aria-label="Ні"
        onClick={() => handle(false)}
        className={`px-2 py-1 rounded-md border transition-colors ${submitted === false ? 'bg-red-50 border-red-300' : 'hover:bg-gray-50 border-gray-300'}`}
        disabled={submitted !== null}
      >
            <ThumbsDown className="h-4 w-4 text-red-600" />
          </button>
          {submitted === true && (
            <span className="ml-2 text-xs text-gray-500">Дякуємо за відгук!</span>
          )}
        </>
      )}

      {/* Comment form for negative feedback */}
      {submitted === false && showCommentForm && (
        <div className="mt-2 w-full">
          <form onSubmit={handleSubmit(onSubmitComment)} className="flex flex-col gap-2">
            <div>
              <label htmlFor="feedback-comment" className="block text-sm font-medium text-gray-700 mb-1">
                Що можна покращити?
              </label>
              <textarea
                id="feedback-comment"
                {...register('comment')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                rows={3}
                placeholder="Розкажіть нам, як ми можемо покращити вашу взаємодію з цією формою"
              />
              {errors.comment && (
                <p className="mt-1 text-sm text-red-600">{errors.comment.message}</p>
              )}
            </div>
            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
              >
                <Send className="h-4 w-4 mr-1" />
                Надіслати відгук
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setShowCommentForm(false)
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Пропустити
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Thank you message after comment submission or skip */}
      {submitted === false && !showCommentForm && (
        <span className="ml-2 text-xs text-gray-500">Дякуємо за відгук!</span>
      )}
    </div>
  )
}
