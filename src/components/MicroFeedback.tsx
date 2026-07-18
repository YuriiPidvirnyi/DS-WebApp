'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ThumbsUp, ThumbsDown, Send } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { trackEvent, AnalyticsEventCategory } from '@/utils/analytics'
import { sendFormFeedback } from '@/services/feedback'
import {
  feedbackCommentSchema,
  type FeedbackCommentData,
} from '@/utils/validationSchemas'

interface MicroFeedbackProps {
  form: 'contact' | 'appointment' | 'callback' | 'newsletter'
  refId?: string
  compact?: boolean
}

export default function MicroFeedback({
  form,
  refId,
  compact = false,
}: MicroFeedbackProps) {
  const { t } = useTranslation()
  const [submitted, setSubmitted] = useState<boolean | null>(null) // can be true, false, or null
  const [showCommentForm, setShowCommentForm] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FeedbackCommentData>({
    resolver: zodResolver(feedbackCommentSchema),
  })

  const handle = async (positive: boolean) => {
    if (submitted !== null) return
    setSubmitted(positive)
    // analytics
    try {
      trackEvent('form_feedback', AnalyticsEventCategory.Forms, {
        form,
        rating: positive ? 'up' : 'down',
        ref: refId,
      })
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

    // Backend call is non-blocking for the UX.
    try {
      await sendFormFeedback({ form, rating: positive ? 'up' : 'down', refId })
    } catch {}
  }

  const onSubmitComment = async (data: FeedbackCommentData) => {
    try {
      trackEvent('feedback_comment', AnalyticsEventCategory.Forms, {
        form,
        ref: refId,
      })
      await sendFormFeedback({
        form,
        rating: 'down',
        refId,
        comment: data.comment,
      })
      setShowCommentForm(false)
    } catch {}
  }

  return (
    <div className={compact ? 'flex items-center gap-2' : 'mt-3'}>
      {/* Feedback buttons */}
      {(!submitted ||
        (submitted === (false as boolean) && !showCommentForm)) && (
        <>
          {!compact && (
            <span className="text-sm text-dental-muted mr-2">
              {t('feedback.question')}
            </span>
          )}
          <button
            type="button"
            aria-label={t('feedback.ariaYes')}
            onClick={() => handle(true)}
            className={`px-2 py-1 rounded-md border transition-colors ${submitted === (true as boolean) ? 'bg-status-success-100 border-dental-success/30' : 'hover:bg-dental-secondary-50 border-dental-secondary-300'}`}
            disabled={submitted !== null}
          >
            <ThumbsUp className="h-4 w-4 text-dental-success" />
          </button>
          <button
            type="button"
            aria-label={t('feedback.ariaNo')}
            onClick={() => handle(false)}
            className={`px-2 py-1 rounded-md border transition-colors ${submitted === false ? 'bg-status-error-100 border-dental-error/20' : 'hover:bg-dental-secondary-50 border-dental-secondary-300'}`}
            disabled={submitted !== null}
          >
            <ThumbsDown className="h-4 w-4 text-dental-error" />
          </button>
          {submitted === true && (
            <span className="ml-2 text-xs text-dental-muted">
              {t('feedback.thankYou')}
            </span>
          )}
        </>
      )}

      {/* Comment form for negative feedback */}
      {submitted === false && showCommentForm && (
        <div className="mt-2 w-full">
          <form
            onSubmit={handleSubmit(onSubmitComment)}
            className="flex flex-col gap-2"
          >
            <div>
              <label
                htmlFor="feedback-comment"
                className="block text-sm font-medium text-dental-dark mb-1"
              >
                {t('feedback.improveLabel')}
              </label>
              <textarea
                id="feedback-comment"
                {...register('comment')}
                className="w-full px-3 py-2 border border-dental-secondary-300 rounded-md shadow-xs focus:outline-hidden focus:ring-2 focus:ring-dental-primary-500 focus:border-dental-primary-500 sm:text-sm"
                rows={3}
                placeholder={t('feedback.improvePlaceholder')}
              />
              {errors.comment && (
                <p className="mt-1 text-sm text-status-error-700">
                  {errors.comment.message}
                </p>
              )}
            </div>
            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-xs text-white bg-dental-primary-600 hover:bg-dental-primary-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-dental-primary-500 disabled:opacity-50 transition-colors"
              >
                <Send className="h-4 w-4 mr-1" />
                {t('feedback.submit')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCommentForm(false)
                }}
                className="text-sm text-dental-muted hover:text-dental-text"
              >
                {t('feedback.skip')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Thank you message after comment submission or skip */}
      {submitted === false && !showCommentForm && (
        <span className="ml-2 text-xs text-dental-muted">
          {t('feedback.thankYou')}
        </span>
      )}
    </div>
  )
}
