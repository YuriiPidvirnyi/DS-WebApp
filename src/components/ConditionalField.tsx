'use client'

import { ReactNode } from 'react'
import { UseFormWatch, FieldValues } from 'react-hook-form'

interface ConditionalFieldProps<T extends FieldValues = FieldValues> {
  watch: UseFormWatch<T>
  condition: (formData: T) => boolean
  children: ReactNode
}

/**
 * Renders children only when condition is met
 * Useful for dynamic form fields based on other field values
 */
export const ConditionalField = <T extends FieldValues = FieldValues>({
  watch,
  condition,
  children,
}: ConditionalFieldProps<T>) => {
  const formData = watch()
  const shouldRender = condition(formData)

  if (!shouldRender) return null

  return <>{children}</>
}

interface ConditionalSectionProps<T extends FieldValues = FieldValues> {
  watch: UseFormWatch<T>
  conditions: Record<string, (formData: T) => boolean>
  children: (activeConditions: string[]) => ReactNode
}

/**
 * Advanced conditional rendering with multiple named conditions
 * Useful for complex multi-condition forms
 */
export const ConditionalSection = <T extends FieldValues = FieldValues>({
  watch,
  conditions,
  children,
}: ConditionalSectionProps<T>) => {
  const formData = watch()

  const activeConditions = Object.entries(conditions)
    .filter(([, conditionFn]) => conditionFn(formData))
    .map(([name]) => name)

  return <>{children(activeConditions)}</>
}
