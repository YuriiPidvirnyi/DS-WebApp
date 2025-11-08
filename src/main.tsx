import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { BrowserRouter as Router } from 'react-router-dom'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'
import performanceMonitor from './services/performance'

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

registerSW({ immediate: true })

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <Router>
        <App />
      </Router>
    </HelmetProvider>
  </React.StrictMode>
)
