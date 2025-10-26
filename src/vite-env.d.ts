/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

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
  readonly VITE_TURNSTILE_SITE_KEY?: string
  readonly VITE_ENVIRONMENT?: string
  readonly VITE_ENABLE_SENTRY_IN_DEV?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
