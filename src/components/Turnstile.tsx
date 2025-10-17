import { useEffect, useRef, useState } from 'react'

interface TurnstileProps {
  onVerify?: (token: string) => void
  className?: string
}

// Cloudflare Turnstile widget wrapper (no-op if no site key)
export default function Turnstile({ onVerify, className }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined

  useEffect(() => {
    if (!siteKey) return

    // Check existing script
    const existing = document.querySelector<HTMLScriptElement>('script[data-turnstile]')
    if (existing) {
      if ((window as any).turnstile) setReady(true)
      existing.addEventListener('load', () => setReady(true))
      return
    }

    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad'
    script.async = true
    script.defer = true
    script.setAttribute('data-turnstile', 'true')
    ;(window as any).onTurnstileLoad = () => setReady(true)
    document.head.appendChild(script)
  }, [siteKey])

  useEffect(() => {
    if (!siteKey || !ready || !containerRef.current) return
    const w = window as any
    const widgetId = w.turnstile?.render(containerRef.current, {
      sitekey: siteKey,
      callback: (token: string) => onVerify?.(token),
      'error-callback': () => onVerify?.(''),
      'timeout-callback': () => onVerify?.(''),
      theme: 'auto',
    })

    return () => {
      if (widgetId && w.turnstile?.remove) w.turnstile.remove(widgetId)
    }
  }, [siteKey, ready, onVerify])

  if (!siteKey) return null
  return <div ref={containerRef} className={className} />
}