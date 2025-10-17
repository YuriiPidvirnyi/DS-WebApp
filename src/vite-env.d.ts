/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_PHONE_NUMBER?: string
  readonly VITE_EMERGENCY_PHONE?: string
  readonly VITE_EMAIL?: string
  readonly VITE_FACEBOOK_URL?: string
  readonly VITE_INSTAGRAM_URL?: string
  readonly VITE_TELEGRAM_URL?: string
  readonly VITE_GOOGLE_MAPS_API_KEY?: string
  readonly VITE_GOOGLE_ANALYTICS_ID?: string
  readonly VITE_SITE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
