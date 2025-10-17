import { useState, ChangeEvent, FormEvent } from 'react'

interface UseFormOptions<T> {
  initialValues: T
  onSubmit: (values: T) => Promise<void> | void
  validate?: (values: T) => Partial<Record<keyof T, string>>
}

interface UseFormReturn<T> {
  values: T
  errors: Partial<Record<keyof T, string>>
  isSubmitting: boolean
  isSubmitted: boolean
  handleChange: (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void
  handleSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>
  setFieldValue: (name: keyof T, value: T[keyof T]) => void
  setFieldError: (name: keyof T, error: string) => void
  resetForm: () => void
  clearErrors: () => void
}

export function useForm<T extends Record<string, unknown>>({
  initialValues,
  onSubmit,
  validate,
}: UseFormOptions<T>): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setValues(prev => ({ ...prev, [name]: value } as T))

    // Clear error for this field when user starts typing
    if (errors[name as keyof T]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name as keyof T]
        return newErrors
      })
    }
  }

  const setFieldValue = (name: keyof T, value: T[keyof T]) => {
    setValues(prev => ({ ...prev, [name]: value } as T))
  }

  const setFieldError = (name: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error }))
  }

  const clearErrors = () => {
    setErrors({})
  }

  const resetForm = () => {
    setValues(initialValues)
    setErrors({})
    setIsSubmitting(false)
    setIsSubmitted(false)
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitted(false)

    // Run validation if provided
    if (validate) {
      const validationErrors = validate(values)
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors)
        return
      }
    }

    // Clear previous errors
    setErrors({})
    setIsSubmitting(true)

    try {
      await onSubmit(values)
      setIsSubmitted(true)
    } catch (error) {
      console.error('Form submission error:', error)
      // You can handle specific errors here
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    values,
    errors,
    isSubmitting,
    isSubmitted,
    handleChange,
    handleSubmit,
    setFieldValue,
    setFieldError,
    resetForm,
    clearErrors,
  }
}
