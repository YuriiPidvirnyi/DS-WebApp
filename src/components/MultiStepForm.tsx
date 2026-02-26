'use client'

import React, { useState, useCallback } from 'react'

export interface FormStep {
  id: string
  title: string
  description?: string
  isValid?: boolean
  component: React.ReactNode
}

interface MultiStepFormProps {
  steps: FormStep[]
  onComplete: () => void
  onStepChange?: (currentStep: number) => void
  allowSkip?: boolean
  className?: string
}

/**
 * Multi-step form wizard with navigation and progress tracking
 */
export const MultiStepForm: React.FC<MultiStepFormProps> = ({
  steps,
  onComplete,
  onStepChange,
  allowSkip = false,
  className = '',
}) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  const currentStepData = steps[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1
  const canProceed = allowSkip || currentStepData.isValid !== false

  const handleNext = useCallback(() => {
    if (canProceed) {
      setCompletedSteps(prev => new Set(prev).add(currentStep))

      if (isLastStep) {
        onComplete()
      } else {
        const nextStep = currentStep + 1
        setCurrentStep(nextStep)
        onStepChange?.(nextStep)
      }
    }
  }, [currentStep, isLastStep, canProceed, onComplete, onStepChange])

  const handlePrevious = useCallback(() => {
    if (!isFirstStep) {
      const prevStep = currentStep - 1
      setCurrentStep(prevStep)
      onStepChange?.(prevStep)
    }
  }, [currentStep, isFirstStep, onStepChange])

  const handleStepClick = useCallback(
    (stepIndex: number) => {
      // Allow navigation to completed steps or next step if current is valid
      if (
        completedSteps.has(stepIndex) ||
        (stepIndex === currentStep + 1 && canProceed)
      ) {
        setCurrentStep(stepIndex)
        onStepChange?.(stepIndex)
      }
    },
    [completedSteps, currentStep, canProceed, onStepChange]
  )

  const getStepStatus = (
    stepIndex: number
  ): 'completed' | 'current' | 'upcoming' => {
    if (completedSteps.has(stepIndex)) return 'completed'
    if (stepIndex === currentStep) return 'current'
    return 'upcoming'
  }

  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>
            Step {currentStep + 1} of {steps.length}
          </span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex justify-between relative">
        {/* Connection line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-300 -z-10" />

        {steps.map((step, index) => {
          const status = getStepStatus(index)
          const isClickable =
            completedSteps.has(index) ||
            (index === currentStep + 1 && canProceed)

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => handleStepClick(index)}
              disabled={!isClickable && index !== currentStep}
              className={`flex flex-col items-center gap-2 relative ${
                isClickable || index === currentStep
                  ? 'cursor-pointer'
                  : 'cursor-not-allowed'
              }`}
            >
              {/* Circle */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors
                  ${status === 'completed' ? 'bg-green-600 text-white' : ''}
                  ${status === 'current' ? 'bg-primary text-white ring-4 ring-primary/20' : ''}
                  ${status === 'upcoming' ? 'bg-gray-300 text-gray-600' : ''}
                `}
              >
                {status === 'completed' ? (
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>

              {/* Label */}
              <span
                className={`text-xs text-center max-w-24 ${
                  status === 'current'
                    ? 'font-semibold text-gray-900'
                    : 'text-gray-600'
                }`}
              >
                {step.title}
              </span>
            </button>
          )
        })}
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {currentStepData.title}
          </h2>
          {currentStepData.description && (
            <p className="text-gray-600 mt-2">{currentStepData.description}</p>
          )}
        </div>

        <div className="min-h-[300px]">{currentStepData.component}</div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={isFirstStep}
          className={`px-6 py-2 rounded-md font-medium transition-colors ${
            isFirstStep
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Previous
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={!canProceed}
          className={`px-6 py-2 rounded-md font-medium transition-colors ${
            !canProceed
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-primary text-white hover:bg-primary-dark'
          }`}
        >
          {isLastStep ? 'Complete' : 'Next'}
        </button>
      </div>
    </div>
  )
}
