import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { BrowserRouter as Router } from 'react-router-dom'
import App from './App.tsx'
import performanceMonitor from './services/performance'
import './i18n/config' // Initialize i18n
import { initSecurity } from './utils/security' // Initialize security

// Initialize security features
initSecurity()

// Initialize performance monitoring
if (process.env.NODE_ENV === "production") {
  performanceMonitor.init()

  // Report performance data before page unload
  window.addEventListener('beforeunload', () => {
    const report = performanceMonitor.generateReport()
    if (navigator.sendBeacon && process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
      navigator.sendBeacon(
        `${process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT}/performance`,
        JSON.stringify(report)
      )
    }
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <Router>
        <App />
      </Router>
    </HelmetProvider>
  </StrictMode>
)
