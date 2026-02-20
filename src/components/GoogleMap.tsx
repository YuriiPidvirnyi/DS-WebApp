'use client'

import { useEffect, useRef, useState } from 'react'
import { CONTACT_INFO } from '@/utils/constants'

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
  title = 'Карта розташування клініки',
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState(false)
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string | undefined

  useEffect(() => {
    if (!apiKey) return // No key - we'll use iframe fallback

    // If script already added
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-google-maps]'
    )
    if (existing) {
      existing.addEventListener('load', () => setLoaded(true))
      if ((window as GoogleWindow).google?.maps) setLoaded(true)
      return
    }

    // Add script
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`
    script.async = true
    script.defer = true
    script.setAttribute('data-google-maps', 'true')
    script.onload = () => setLoaded(true)
    script.onerror = () => setLoaded(false)
    document.head.appendChild(script)
  }, [apiKey])

  useEffect(() => {
    if (!loaded || !mapRef.current || !(window as GoogleWindow).google?.maps)
      return

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
      title: 'Dental Story',
    })
  }, [loaded, lat, lng, zoom])

  if (!apiKey) {
    // Fallback to iframe if no API key
    const iframeSrc = `https://www.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`
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
          title={title}
          className="w-full h-full"
        />
      </div>
    )
  }

  return <div ref={mapRef} className={className} style={{ height }} />
}
