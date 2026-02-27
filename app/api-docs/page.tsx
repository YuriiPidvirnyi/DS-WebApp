'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, FileJson } from 'lucide-react'

export default function ApiDocsPage() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Dynamically load Swagger UI
    const loadSwaggerUI = async () => {
      if (typeof window !== 'undefined' && containerRef.current) {
        // Load Swagger UI CSS
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css'
        document.head.appendChild(link)

        // Load Swagger UI JS
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js'
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Site</span>
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-xl font-semibold text-gray-900">
                Dental Story API Documentation
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/openapi.json"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FileJson className="w-4 h-4" />
                OpenAPI Spec
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Swagger UI Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div id="swagger-ui" ref={containerRef} className="min-h-[600px]">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-dental-teal border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500">Loading API documentation...</p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Authentication
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              Admin endpoints require authentication. Use the admin login to obtain a session token.
            </p>
            <code className="block bg-gray-100 p-3 rounded text-xs">
              Authorization: Bearer {'<token>'}
            </code>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Rate Limiting
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              API requests are rate limited to prevent abuse. Default limits:
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Public endpoints: 60 requests/minute</li>
              <li>• Contact form: 5 requests/minute</li>
              <li>• Booking: 10 requests/minute</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
