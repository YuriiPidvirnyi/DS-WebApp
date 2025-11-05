import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertCircle, Home, RefreshCw } from 'lucide-react'
import { Button } from './ui'
import { Link } from 'react-router-dom'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorKey?: number
}

/**
 * Error Boundary component to catch JavaScript errors in the component tree
 * and display a fallback UI
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorKey: 0,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render shows the fallback UI
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    this.setState({
      error,
      errorInfo,
    })

    // In production, we would log to a service like Sentry
    if (import.meta.env.PROD) {
      // Example: Send to Sentry or other error tracking service
      // Sentry.captureException(error, { extra: errorInfo });
      console.error('Error caught by ErrorBoundary:', error, errorInfo)
    } else {
      // In development, we log to console with more detail
      console.error('Error caught by ErrorBoundary:', error, errorInfo)
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorKey: this.state.errorKey ? this.state.errorKey + 1 : 1,
    })
  }

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state
    const { children, fallback } = this.props

    if (hasError) {
      // If a custom fallback is provided, use it
      if (fallback) {
        return fallback
      }

      // Default fallback UI
      return (
        <div
          className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center"
          key={this.state.errorKey}
        >
          <div className="max-w-lg">
            <AlertCircle
              className="h-16 w-16 text-red-500 mx-auto mb-4"
              aria-hidden="true"
            />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Ой, щось пішло не так!
            </h1>
            <p className="text-gray-600 mb-6">
              Виникла помилка при відображенні цієї сторінки. Ми вже працюємо
              над її виправленням.
            </p>

            {import.meta.env.DEV && (
              <div className="mb-4 text-left">
                <details className="border border-gray-300 rounded-md p-4">
                  <summary className="cursor-pointer text-sm text-gray-700 font-medium">
                    Технічна інформація для розробників
                  </summary>
                  <div className="mt-4">
                    <h3 className="text-sm font-bold text-red-600">Помилка:</h3>
                    <pre className="text-xs bg-red-50 p-3 rounded-md text-red-800 overflow-auto max-h-32 mt-2">
                      {error?.toString()}
                    </pre>

                    {errorInfo && (
                      <>
                        <h3 className="text-sm font-bold text-gray-700 mt-4">
                          Компонент Stack:
                        </h3>
                        <pre className="text-xs bg-gray-100 p-3 rounded-md text-gray-800 overflow-auto max-h-64 mt-2">
                          {errorInfo.componentStack}
                        </pre>
                      </>
                    )}
                  </div>
                </details>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={this.handleReset}
                variant="primary"
                className="flex items-center"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Спробувати ще раз
              </Button>

              <Link to="/">
                <Button variant="outline" className="flex items-center">
                  <Home className="h-4 w-4 mr-2" />
                  Повернутися на головну
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )
    }

    // When there's no error, render children normally
    return children
  }
}

export default ErrorBoundary
