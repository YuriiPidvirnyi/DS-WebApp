import { cn } from '@/utils/cn'

interface ProgressBarProps {
  currentStep: number
  totalSteps: number
  stepLabels?: string[]
  className?: string
  showPercentage?: boolean
  animated?: boolean
}

export function ProgressBar({ 
  currentStep, 
  totalSteps, 
  stepLabels, 
  className, 
  showPercentage = false,
  animated = true 
}: ProgressBarProps) {
  const progress = Math.min(100, Math.max(0, (currentStep / totalSteps) * 100))
  
  return (
    <div className={cn("w-full mb-6", className)}>
      {/* Progress bar */}
      <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full bg-gradient-to-r from-dental-teal to-dental-blue rounded-full",
            animated && "transition-all duration-500 ease-out"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Step indicators and labels */}
      {stepLabels && (
        <div className="flex justify-between mt-2">
          {stepLabels.map((label, index) => (
            <div
              key={index}
              className={cn(
                "flex flex-col items-center text-sm",
                index < currentStep
                  ? "text-dental-teal font-medium"
                  : index === currentStep
                  ? "text-dental-blue font-semibold"
                  : "text-gray-400"
              )}
            >
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-1",
                  index < currentStep
                    ? "bg-dental-teal text-white"
                    : index === currentStep
                    ? "bg-dental-blue text-white"
                    : "bg-gray-200 text-gray-500"
                )}
              >
                {index < currentStep ? "✓" : index + 1}
              </div>
              <span className="text-center leading-tight">{label}</span>
            </div>
          ))}
        </div>
      )}
      
      {/* Percentage display */}
      {showPercentage && (
        <div className="text-right mt-2">
          <span className="text-sm font-medium text-gray-600">
            {Math.round(progress)}% завершено
          </span>
        </div>
      )}
    </div>
  )
}

export default ProgressBar