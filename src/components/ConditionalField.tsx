import React, { ReactNode } from 'react'
import { UseFormWatch } from 'react-hook-form'

interface ConditionalFieldProps {
  watch: UseFormWatch<any>
  condition: (formData: any) => boolean
  children: ReactNode
}

/**
 * Renders children only when condition is met
 * Useful for dynamic form fields based on other field values
 */
export const ConditionalField: React.FC<ConditionalFieldProps> = ({
  watch,
  condition,
  children,
}) => {
  const formData = watch()
  const shouldRender = condition(formData)

  if (!shouldRender) return null

  return <>{children}</>
}

interface ConditionalSectionProps {
  watch: UseFormWatch<any>
  conditions: Record<string, (formData: any) => boolean>
  children: (activeConditions: string[]) => ReactNode
}

/**
 * Advanced conditional rendering with multiple named conditions
 * Useful for complex multi-condition forms
 */
export const ConditionalSection: React.FC<ConditionalSectionProps> = ({
  watch,
  conditions,
  children,
}) => {
  const formData = watch()

  const activeConditions = Object.entries(conditions)
    .filter(([, conditionFn]) => conditionFn(formData))
    .map(([name]) => name)

  return <>{children(activeConditions)}</>
}
