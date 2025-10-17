import { Toaster } from 'react-hot-toast'

/**
 * Toast notifications provider using react-hot-toast
 */
export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{}}
      toastOptions={{
        // Global toast options
        duration: 4000,
        style: {
          borderRadius: '8px',
          background: '#fff',
          color: '#333',
          fontSize: '14px',
          padding: '12px 16px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
        
        // Success toast styling
        success: {
          duration: 5000,
          style: {
            border: '2px solid #10b981',
            background: '#f0fdf4',
            color: '#065f46',
          },
          iconTheme: {
            primary: '#10b981',
            secondary: '#f0fdf4',
          },
        },
        
        // Error toast styling
        error: {
          duration: 6000,
          style: {
            border: '2px solid #ef4444',
            background: '#fef2f2',
            color: '#991b1b',
          },
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fef2f2',
          },
        },
        
        // Loading toast styling
        loading: {
          style: {
            border: '2px solid #0078d7',
            background: '#f0f9ff',
            color: '#1e40af',
          },
          iconTheme: {
            primary: '#0078d7',
            secondary: '#f0f9ff',
          },
        },
        
        // Custom toast styling
        custom: {
          duration: 4000,
        },
      }}
    />
  )
}