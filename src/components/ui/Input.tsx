'use client'

import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react'
import clsx from 'clsx'

// Helper function to determine autocomplete value based on input type and name
const getAutoCompleteFromType = (
  type?: string,
  name?: string
): string | undefined => {
  if (!type && !name) return undefined

  // Common autocomplete values based on type
  const typeMap: Record<string, string> = {
    email: 'email',
    tel: 'tel',
    url: 'url',
  }

  if (type && typeMap[type]) return typeMap[type]

  // Common autocomplete values based on name
  if (name) {
    const nameLower = name.toLowerCase()
    if (nameLower.includes('name') && !nameLower.includes('user')) return 'name'
    if (nameLower.includes('firstname') || nameLower.includes('first-name'))
      return 'given-name'
    if (nameLower.includes('lastname') || nameLower.includes('last-name'))
      return 'family-name'
    if (nameLower.includes('email')) return 'email'
    if (nameLower.includes('phone') || nameLower.includes('tel')) return 'tel'
    if (nameLower.includes('address')) return 'street-address'
    if (nameLower.includes('city')) return 'address-level2'
    if (nameLower.includes('postal') || nameLower.includes('zip'))
      return 'postal-code'
    if (nameLower.includes('country')) return 'country-name'
  }

  return undefined
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  fullWidth?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { label, error, helperText, fullWidth = false, className, id, ...props },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    const baseStyles =
      'px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0'

    const stateStyles = error
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 focus:border-dental-teal focus:ring-dental-teal'

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          className={clsx(
            baseStyles,
            stateStyles,
            fullWidth && 'w-full',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error
              ? `${inputId}-error`
              : helperText
                ? `${inputId}-helper`
                : undefined
          }
          autoComplete={
            props.autoComplete ||
            getAutoCompleteFromType(props.type, props.name)
          }
          {...props}
        />

        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-2 text-sm text-red-600"
            role="alert"
          >
            {error}
          </p>
        )}

        {!error && helperText && (
          <p id={`${inputId}-helper`} className="mt-2 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

// Textarea component
export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  fullWidth?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { label, error, helperText, fullWidth = false, className, id, ...props },
    ref
  ) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-')

    const baseStyles =
      'px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 resize-vertical'

    const stateStyles = error
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 focus:border-dental-teal focus:ring-dental-teal'

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          className={clsx(
            baseStyles,
            stateStyles,
            fullWidth && 'w-full',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error
              ? `${textareaId}-error`
              : helperText
                ? `${textareaId}-helper`
                : undefined
          }
          {...props}
        />

        {error && (
          <p
            id={`${textareaId}-error`}
            className="mt-2 text-sm text-red-600"
            role="alert"
          >
            {error}
          </p>
        )}

        {!error && helperText && (
          <p id={`${textareaId}-helper`} className="mt-2 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

// Select component
export interface SelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
  fullWidth?: boolean
  children: React.ReactNode
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      className,
      id,
      children,
      ...props
    },
    ref
  ) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')

    const baseStyles =
      'px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 bg-white'

    const stateStyles = error
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 focus:border-dental-teal focus:ring-dental-teal'

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <select
          ref={ref}
          id={selectId}
          className={clsx(
            baseStyles,
            stateStyles,
            fullWidth && 'w-full',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error
              ? `${selectId}-error`
              : helperText
                ? `${selectId}-helper`
                : undefined
          }
          {...props}
        >
          {children}
        </select>

        {error && (
          <p
            id={`${selectId}-error`}
            className="mt-2 text-sm text-red-600"
            role="alert"
          >
            {error}
          </p>
        )}

        {!error && helperText && (
          <p id={`${selectId}-helper`} className="mt-2 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'
