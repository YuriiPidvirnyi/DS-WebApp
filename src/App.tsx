import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import LoadingPage from './components/LoadingPage'
import PerformanceMetrics from './components/PerformanceMetrics'
import ResourcePreloader from './components/ResourcePreloader'
import LiveRegion from './components/ui/LiveRegion'
import { StructuredData } from './components/StructuredData'
import { AccessibilityProvider } from './components/AccessibilityProvider'
import { AccessibilityPanel } from './components/AccessibilityPanel'
import SVGFilters from './components/SVGFilters'
import ErrorBoundary from './components/ErrorBoundary'
import ToastProvider from './components/providers/ToastProvider'
import { initializeAnalytics } from './utils/analytics'
import { initializeSentry } from './utils/sentry'
import useAnalytics from './hooks/useAnalytics'
import { useReminders } from './hooks/useReminders'
import FloatingQuickActions from './components/FloatingQuickActions'
import './styles/globals.css'

// Lazy load all pages
const Home = lazy(() => import('./pages/Home'))
const Services = lazy(() => import('./pages/Services'))
const About = lazy(() => import('./pages/About'))
const Contact = lazy(() => import('./pages/Contact'))
const Gallery = lazy(() => import('./pages/Gallery'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const TermsOfService = lazy(() => import('./pages/TermsOfService'))
const Booking = lazy(() => import('./pages/Booking'))
const BookingSuccess = lazy(() => import('./pages/BookingSuccess'))
const NotFound = lazy(() => import('./pages/NotFound'))
const Reviews = lazy(() => import('./pages/Reviews'))

function App() {
  // Initialize analytics and error tracking
  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize analytics
        initializeAnalytics()

        // Initialize error tracking only in production (lazy loaded)
        if (import.meta.env.PROD) {
          await initializeSentry()
        }
      } catch (error) {
        console.warn('Failed to initialize analytics/sentry:', error)
      }
    }

    initialize()
  }, [])

  // Initialize page view tracking and delegated click tracking
  useAnalytics()

  // Initialize appointment reminders
  useReminders()

  return (
    <ErrorBoundary>
      <AccessibilityProvider>
        <ToastProvider />
        <div className="min-h-screen flex flex-col">
          <StructuredData type="organization" />
          <PerformanceMetrics />
          <ResourcePreloader />
          <LiveRegion />
          <SVGFilters />
          <AccessibilityPanel />
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-dental-teal text-white px-4 py-2 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-white"
          >
            Перейти до основного вмісту
          </a>
          <Header />
          <main id="main-content" className="flex-1" role="main">
            <Suspense fallback={<LoadingPage />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/services" element={<Services />} />
                <Route path="/about" element={<About />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/booking" element={<Booking />} />
                <Route path="/booking/success" element={<BookingSuccess />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/reviews" element={<Reviews />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </div>
        {/* Floating quick actions */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="pointer-events-auto">
            <FloatingQuickActions />
          </div>
        </div>
      </AccessibilityProvider>
    </ErrorBoundary>
  )
}

export default App
