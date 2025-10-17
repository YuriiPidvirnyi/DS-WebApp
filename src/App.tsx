import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import LoadingPage from './components/LoadingPage'
import PerformanceMetrics from './components/PerformanceMetrics'
import { StructuredData } from './components/StructuredData'
import { AccessibilityProvider } from './components/AccessibilityProvider'
import { AccessibilityPanel } from './components/AccessibilityPanel'
import SVGFilters from './components/SVGFilters'
import ErrorBoundary from './components/ErrorBoundary'
import ToastProvider from './components/providers/ToastProvider'
import { initializeAnalytics } from './utils/analytics'
import { initializeSentry } from './utils/sentry'
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
const NotFound = lazy(() => import('./pages/NotFound'))

function App() {
  // Initialize analytics and error tracking
  useEffect(() => {
    // Initialize analytics
    initializeAnalytics();
    
    // Initialize error tracking
    initializeSentry();
  }, []);
  return (
    <ErrorBoundary>
      <AccessibilityProvider>
        <ToastProvider />
        <Router>
          <div className="min-h-screen flex flex-col">
            <StructuredData type="organization" />
            <PerformanceMetrics />
            <SVGFilters />
            <AccessibilityPanel />
            <a href="#main-content" className="skip-to-content">
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
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
        </div>
      </Router>
    </AccessibilityProvider>
  </ErrorBoundary>
  )
}

export default App