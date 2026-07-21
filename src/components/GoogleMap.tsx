'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CONTACT_INFO } from '@/utils/constants'
import { AsyncState } from './ui'

interface GoogleWindow extends Window {
  google?: {
    maps?: {
      Map: new (
        element: HTMLElement,
        options: Record<string, unknown>
      ) => unknown
      Marker: new (options: Record<string, unknown>) => unknown
    }
  }
}

interface GoogleMapProps {
  lat?: number
  lng?: number
  zoom?: number
  className?: string
  height?: string | number
  title?: string
}

// Dynamically load Google Maps JS API if key is provided, else fallback to iframe
export default function GoogleMap({
  lat = CONTACT_INFO.coordinates.lat,
  lng = CONTACT_INFO.coordinates.lng,
  zoom = 16,
  className,
  height = '20rem',
  title,
}: GoogleMapProps) {
  const { t } = useTranslation()
  const iframeTitle = title || t('contact.map.iframeTitle')
  const mapRef = useRef<HTMLDivElement>(null)
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as
    string | undefined
  const [loadStatus, setLoadStatus] = useState<'loading' | 'ready' | 'error'>(
    apiKey ? 'loading' : 'ready'
  )
  const iframeSrc = `https://www.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`

  useEffect(() => {
    if (!apiKey) return // No key - we'll use iframe fallback

    if ((window as GoogleWindow).google?.maps) {
      setLoadStatus('ready')
      return
    }

    setLoadStatus('loading')
    const handleLoad = () => setLoadStatus('ready')
    const handleError = () => setLoadStatus('error')

    // If script already added
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-google-maps]'
    )
    if (existing) {
      existing.addEventListener('load', handleLoad)
      existing.addEventListener('error', handleError)
      if ((window as GoogleWindow).google?.maps) {
        setLoadStatus('ready')
      }

      return () => {
        existing.removeEventListener('load', handleLoad)
        existing.removeEventListener('error', handleError)
      }
    }

    // Add script
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`
    script.async = true
    script.defer = true
    script.setAttribute('data-google-maps', 'true')
    script.onload = handleLoad
    script.onerror = handleError
    document.head.appendChild(script)

    return () => {
      script.onload = null
      script.onerror = null
    }
  }, [apiKey])

  useEffect(() => {
    if (
      loadStatus !== 'ready' ||
      !mapRef.current ||
      !(window as GoogleWindow).google?.maps
    ) {
      return
    }

    const { google } = window as GoogleWindow
    if (!google?.maps) return

    const position = { lat, lng }
    const map = new google.maps.Map(mapRef.current, {
      center: position,
      zoom,
      disableDefaultUI: false,
      mapTypeControl: false,
      streetViewControl: false,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
        { featureType: 'transit', stylers: [{ visibility: 'off' }] },
      ],
    })

    new google.maps.Marker({
      position,
      map,
      title: t('common.brandName'),
    })
  }, [loadStatus, lat, lng, zoom, t])

  if (!apiKey || loadStatus === 'error') {
    // Fallback to iframe if no API key or script failed to load
    return (
      <div className={className} style={{ height }}>
        <iframe
          src={iframeSrc}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={iframeTitle}
          className="w-full h-full"
        />
      </div>
    )
  }

  if (loadStatus !== 'ready') {
    return (
      <div className={className} style={{ height }}>
        <div className="h-full p-3">
          <AsyncState
            variant="loading"
            title={t('contact.map.loadingTitle')}
            message={t('contact.map.loadingMessage')}
            className="h-full flex flex-col items-center justify-center"
          />
        </div>
      </div>
    )
  }

  return <div ref={mapRef} className={className} style={{ height }} />
}
