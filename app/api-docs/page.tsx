'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, FileJson } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function ApiDocsPage() {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Dynamically load Swagger UI
    const loadSwaggerUI = async () => {
      if (typeof window !== 'undefined' && containerRef.current) {
        // Load Swagger UI CSS
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href =
          'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css'
        document.head.appendChild(link)

        // Load Swagger UI JS
        const script = document.createElement('script')
        script.src =
          'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js'
        script.onload = () => {
          // @ts-expect-error - SwaggerUIBundle is loaded from CDN
          window.SwaggerUIBundle({
            url: '/openapi.json',
            dom_id: '#swagger-ui',
            presets: [
              // @ts-expect-error - SwaggerUIBundle is loaded from CDN
              window.SwaggerUIBundle.presets.apis,
              // @ts-expect-error - SwaggerUIStandalonePreset is loaded from CDN
              window.SwaggerUIStandalonePreset,
            ],
            layout: 'BaseLayout',
            deepLinking: true,
            defaultModelsExpandDepth: 1,
            defaultModelExpandDepth: 1,
          })
        }
        document.body.appendChild(script)
      }
    }

    loadSwaggerUI()
  }, [])

  return (
    <div className="min-h-screen bg-dental-secondary-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-dental-muted hover:text-dental-dark transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t('apiDocsPage.backToSite')}</span>
              </Link>
              <div className="h-6 w-px bg-dental-secondary-300" />
              <h1 className="text-xl font-semibold text-dental-dark">
                {t('apiDocsPage.title')}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/openapi.json"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 text-sm text-dental-muted hover:text-dental-dark hover:bg-dental-secondary-100 rounded-lg transition-colors"
              >
                <FileJson className="w-4 h-4" />
                {t('apiDocsPage.openApiSpec')}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Swagger UI Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-xs border overflow-hidden">
          <div id="swagger-ui" ref={containerRef} className="min-h-[600px]">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-dental-teal border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-dental-muted">{t('apiDocsPage.loading')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-xs border p-6">
            <h2 className="text-lg font-semibold text-dental-dark mb-3">
              {t('apiDocsPage.auth.title')}
            </h2>
            <p className="text-dental-muted text-sm mb-4">
              {t('apiDocsPage.auth.description')}
            </p>
            <code className="block bg-dental-secondary-100 p-3 rounded text-xs">
              {t('apiDocsPage.auth.authorizationHeader')}
            </code>
          </div>

          <div className="bg-white rounded-lg shadow-xs border p-6">
            <h2 className="text-lg font-semibold text-dental-dark mb-3">
              {t('apiDocsPage.rateLimit.title')}
            </h2>
            <p className="text-dental-muted text-sm mb-4">
              {t('apiDocsPage.rateLimit.description')}
            </p>
            <ul className="text-sm text-dental-muted space-y-1">
              <li>{t('apiDocsPage.rateLimit.publicEndpoints')}</li>
              <li>{t('apiDocsPage.rateLimit.contactForm')}</li>
              <li>{t('apiDocsPage.rateLimit.booking')}</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
