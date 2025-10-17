import toast from 'react-hot-toast'

/**
 * Toast notification utilities with consistent messaging
 */

// Success notifications
export const showSuccess = (message: string) => {
  return toast.success(message)
}

export const showFormSuccess = (formType: string) => {
  const messages = {
    contact: 'Повідомлення успішно відправлено! Ми зв\'яжемося з вами найближчим часом.',
    appointment: 'Заявку на запис успішно відправлено! Ми підтвердимо час прийому найближчим часом.',
    callback: 'Заявку на зворотний дзвінок відправлено! Ми зателефонуємо вам протягом 30 хвилин.',
    newsletter: 'Успішно підписані на розсилку! Дякуємо за довіру.',
    review: 'Дякуємо за відгук! Він допомагає нам стати кращими.',
  }
  
  return showSuccess(messages[formType as keyof typeof messages] || 'Операція виконана успішно!')
}

// Error notifications
export const showError = (message: string) => {
  return toast.error(message)
}

export const showFormError = (formType: string, error?: string) => {
  const defaultMessages = {
    contact: 'Помилка відправки повідомлення. Спробуйте ще раз або зателефонуйте нам.',
    appointment: 'Помилка при створенні заявки. Спробуйте ще раз або зателефонуйте нам.',
    callback: 'Помилка заявки на дзвінок. Спробуйте ще раз або зателефонуйте нам безпосередньо.',
    newsletter: 'Помилка підписки на розсилку. Перевірте email і спробуйте ще раз.',
    review: 'Помилка відправки відгуку. Спробуйте ще раз пізніше.',
  }
  
  const message = error || defaultMessages[formType as keyof typeof defaultMessages] || 'Сталася помилка. Спробуйте ще раз.'
  return showError(message)
}

export const showNetworkError = () => {
  return showError('Помилка з\'єднання з сервером. Перевірте інтернет і спробуйте ще раз.')
}

export const showValidationError = () => {
  return showError('Перевірте правильність заповнених полів.')
}

// Loading notifications
export const showLoading = (message: string = 'Завантаження...') => {
  return toast.loading(message)
}

export const showFormLoading = (formType: string) => {
  const messages = {
    contact: 'Відправляємо повідомлення...',
    appointment: 'Створюємо заявку на прийом...',
    callback: 'Створюємо заявку на дзвінок...',
    newsletter: 'Підписуємо на розсилку...',
    review: 'Відправляємо відгук...',
  }
  
  return showLoading(messages[formType as keyof typeof messages] || 'Обробляємо запит...')
}

// Info notifications
export const showInfo = (message: string) => {
  return toast(message, {
    icon: 'ℹ️',
    style: {
      border: '2px solid #0078d7',
      background: '#f0f9ff',
      color: '#1e40af',
    },
  })
}

// Warning notifications
export const showWarning = (message: string) => {
  return toast(message, {
    icon: '⚠️',
    style: {
      border: '2px solid #f59e0b',
      background: '#fffbeb',
      color: '#92400e',
    },
  })
}

// Custom notifications with action buttons (simplified for .ts file)
export const showActionToast = (
  message: string,
  actionLabel: string,
  _actionFn: () => void, // Prefixed with _ to indicate unused
  options?: {
    type?: 'success' | 'error' | 'info'
    duration?: number
  }
) => {
  const { type = 'info' } = options || {}
  
  // For now, just show a regular toast with the message
  // In a real implementation, this would be in a .tsx file to support JSX
  if (type === 'success') {
    return showSuccess(`${message} (${actionLabel})`)
  } else if (type === 'error') {
    return showError(`${message} (${actionLabel})`)
  } else {
    return showInfo(`${message} (${actionLabel})`)
  }
}

// Dismiss notifications
export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId)
}

export const dismissAllToasts = () => {
  toast.dismiss()
}

// Update existing toast
export const updateToast = (toastId: string, message: string, type: 'success' | 'error') => {
  if (type === 'success') {
    toast.success(message, { id: toastId })
  } else {
    toast.error(message, { id: toastId })
  }
}

// Utility function to handle async operations with toast
export const withToast = Object.assign(
async <T>(
  operation: () => Promise<T>,
  options: {
    loadingMessage?: string
    successMessage?: string | ((result: T) => string)
    errorMessage?: string | ((error: Error) => string)
    formType?: string
  }
): Promise<T> => {
  const { loadingMessage, successMessage, errorMessage, formType } = options
  
  let toastId: string
  
  // Show loading toast
  if (formType) {
    toastId = showFormLoading(formType)
  } else if (loadingMessage) {
    toastId = showLoading(loadingMessage)
  } else {
    toastId = showLoading()
  }
  
  try {
    const result = await operation()
    
    // Show success toast
    if (formType) {
      showFormSuccess(formType)
    } else if (successMessage) {
      const message = typeof successMessage === 'function' ? successMessage(result) : successMessage
      showSuccess(message)
    } else {
      showSuccess('Операція виконана успішно!')
    }
    
    toast.dismiss(toastId)
    return result
    
  } catch (error) {
    // Show error toast
    if (formType) {
      showFormError(formType, error instanceof Error ? error.message : undefined)
    } else if (errorMessage) {
      const message = typeof errorMessage === 'function' && error instanceof Error 
        ? errorMessage(error) 
        : typeof errorMessage === 'string'
          ? errorMessage
          : 'Сталася помилка'
      showError(message)
    } else {
      showError(error instanceof Error ? error.message : 'Сталася помилка')
    }
    
    toast.dismiss(toastId)
    throw error
  }
}, {
  // Add direct error method for immediate error display
  error: (message: string) => {
    showError(message)
    return undefined as any
  },
  success: (message: string) => {
    showSuccess(message)
    return undefined as any
  }
})

// Common toast messages for the dental clinic
export const COMMON_MESSAGES = {
  // Appointments
  APPOINTMENT_BOOKED: 'Запис створено! Ми зв\'яжемося з вами для підтвердження.',
  APPOINTMENT_ERROR: 'Помилка запису. Спробуйте ще раз або зателефонуйте нам.',
  
  // Contact forms
  CONTACT_SUCCESS: 'Повідомлення відправлено! Ми відповімо найближчим часом.',
  CONTACT_ERROR: 'Помилка відправки. Спробуйте ще раз або зателефонуйте.',
  
  // General
  NETWORK_ERROR: 'Помилка з\'єднання. Перевірте інтернет і спробуйте ще раз.',
  VALIDATION_ERROR: 'Перевірте правильність заповнених полів.',
  UNEXPECTED_ERROR: 'Щось пішло не так. Спробуйте ще раз пізніше.',
  
  // Office hours reminder
  OFFICE_HOURS: 'Ми працюємо: Пн-Пт 9:00-19:00, Сб 9:00-16:00. Неділя - вихідний.',
  CALL_US: 'Для термінових питань телефонуйте: +380 50 455 47 74',
} as const