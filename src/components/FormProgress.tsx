import React, { useMemo } from 'react'
import { UseFormWatch } from 'react-hook-form'

interface FormProgressProps {
  watch: UseFormWatch<any>
  fields: string[]
  requiredFields?: string[]
  showPercentage?: boolean
  className?: string
}

/**
 * Progress indicator showing form completion status
 */
export const FormProgress: React.FC<FormProgressProps> = ({
  watch,
  fields,
  requiredFields = fields,
  showPercentage = true,
  className = '',
}) => {
  const formData = watch()

  const progress = useMemo(() => {
    const filledFields = requiredFields.filter(field => {
      const value = formData[field]
      if (typeof value === 'string') return value.trim().length > 0
      if (Array.isArray(value)) return value.length > 0
      return value !== null && value !== undefined
    })

    const percentage = Math.round(
      (filledFields.length / requiredFields.length) * 100
    )
    return {
      filled: filledFields.length,
      total: requiredFields.length,
      percentage,
    }
  }, [formData, requiredFields])

  const getColorClass = () => {
    if (progress.percentage === 100) return 'bg-green-600'
    if (progress.percentage >= 50) return 'bg-blue-600'
    return 'bg-gray-400'
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600 font-medium">Form Progress</span>
        {showPercentage && (
          <span className="text-gray-700 font-semibold">
            {progress.percentage}%
          </span>
        )}
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ease-in-out ${getColorClass()}`}
          style={{ width: `${progress.percentage}%` }}
          role="progressbar"
          aria-valuenow={progress.percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      <div className="text-xs text-gray-500">
        {progress.filled} of {progress.total} required fields completed
      </div>

      {progress.percentage === 100 && (
        <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          All required fields completed!
        </div>
      )}
    </div>
  )
}
