import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { BrowserRouter as Router } from 'react-router-dom'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'
import performanceMonitor from './services/performance'
import './i18n/config' // Initialize i18n
import { initSecurity } from './utils/security' // Initialize security

// Initialize security features
initSecurity()

// Initialize performance monitoring
if (import.meta.env.PROD) {
  performanceMonitor.init()

  // Report performance data before page unload
  window.addEventListener('beforeunload', () => {
    const report = performanceMonitor.generateReport()
    if (navigator.sendBeacon && import.meta.env.VITE_ANALYTICS_ENDPOINT) {
      navigator.sendBeacon(
        `${import.meta.env.VITE_ANALYTICS_ENDPOINT}/performance`,
        JSON.stringify(report)
      )
    }
  })
}

// Defer PWA registration to not block initial page load
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => registerSW({ immediate: true }))
} else {
  setTimeout(() => registerSW({ immediate: true }), 2000)
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <Router>
        <App />
      </Router>
    </HelmetProvider>
  </React.StrictMode>
)
