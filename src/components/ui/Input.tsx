'use client'

import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'
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
      'min-h-[44px] px-4 py-3 border rounded-2xl transition-colors duration-200 focus:outline-hidden focus:ring-2 focus:ring-offset-0 text-base text-dental-dark placeholder:text-dental-muted sm:text-sm'

    const stateStyles = error
      ? 'border-dental-error/20 focus:border-dental-error focus:ring-dental-error'
      : 'border-dental-secondary focus:border-dental-primary focus:ring-dental-primary'

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-dental-text mb-2"
          >
            {label}
            {props.required && <span className="text-dental-error ml-1">*</span>}
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
            className="mt-2 text-sm text-status-error-700"
            role="alert"
          >
            {error}
          </p>
        )}

        {!error && helperText && (
          <p
            id={`${inputId}-helper`}
            className="mt-2 text-sm text-dental-muted"
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

// Textarea component
export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
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
      'min-h-[44px] px-4 py-3 border rounded-2xl transition-colors duration-200 focus:outline-hidden focus:ring-2 focus:ring-offset-0 resize-vertical text-base text-dental-dark placeholder:text-dental-muted sm:text-sm'

    const stateStyles = error
      ? 'border-dental-error/20 focus:border-dental-error focus:ring-dental-error'
      : 'border-dental-secondary focus:border-dental-primary focus:ring-dental-primary'

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-dental-text mb-2"
          >
            {label}
            {props.required && <span className="text-dental-error ml-1">*</span>}
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
            className="mt-2 text-sm text-status-error-700"
            role="alert"
          >
            {error}
          </p>
        )}

        {!error && helperText && (
          <p
            id={`${textareaId}-helper`}
            className="mt-2 text-sm text-dental-muted"
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

/** Native `<select>` visual variants — use `compact`/`dense` in admin toolbars & tables. */
export type SelectSize = 'default' | 'compact' | 'dense'

const SELECT_SIZE_STYLES: Record<SelectSize, { field: string; icon: string }> =
  {
    default: {
      field: 'px-4 py-3 pr-11 min-h-[44px] rounded-2xl text-base sm:text-sm',
      icon: 'right-3.5 h-5 w-5',
    },
    compact: {
      field: 'px-3 py-2 pr-10 min-h-10 rounded-xl text-sm',
      icon: 'right-3 h-4 w-4',
    },
    dense: {
      field: 'px-2 py-1.5 pr-8 min-h-9 rounded-lg text-xs',
      icon: 'right-2 h-3.5 w-3.5',
    },
  }

// Select component
export interface SelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
  fullWidth?: boolean
  /** Default: forms & booking; `compact` filters; `dense` table rows */
  selectSize?: SelectSize
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
      selectSize = 'default',
      ...props
    },
    ref
  ) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')
    const sizeStyles = SELECT_SIZE_STYLES[selectSize]

    const baseStyles = clsx(
      'border transition-colors duration-200 focus:outline-hidden focus:ring-2 focus:ring-offset-0 bg-white text-dental-dark appearance-none cursor-pointer',
      sizeStyles.field
    )

    const stateStyles = error
      ? 'border-dental-error/20 focus:border-dental-error focus:ring-dental-error'
      : 'border-dental-secondary focus:border-dental-primary focus:ring-dental-primary'

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-dental-text mb-2"
          >
            {label}
            {props.required && <span className="text-dental-error ml-1">*</span>}
          </label>
        )}

        <div className={clsx('relative', fullWidth && 'w-full')}>
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
          <ChevronDown
            className={clsx(
              'pointer-events-none absolute top-1/2 -translate-y-1/2 text-dental-muted',
              sizeStyles.icon
            )}
            aria-hidden
          />
        </div>

        {error && (
          <p
            id={`${selectId}-error`}
            className="mt-2 text-sm text-status-error-700"
            role="alert"
          >
            {error}
          </p>
        )}

        {!error && helperText && (
          <p
            id={`${selectId}-helper`}
            className="mt-2 text-sm text-dental-muted"
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'
