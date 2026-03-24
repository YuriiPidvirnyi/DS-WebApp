import React, { type ReactElement } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import { AccessibilityContext } from '@/components/AccessibilityProvider'

const i18nInstance = i18next.createInstance()
i18nInstance.use(initReactI18next).init({
  lng: 'uk',
  fallbackLng: 'uk',
  ns: ['translation'],
  defaultNS: 'translation',
  resources: { uk: { translation: {} } },
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
})

const defaultA11yValue = {
  fontSize: 'normal' as const,
  increaseFontSize: () => {},
  decreaseFontSize: () => {},
  resetFontSize: () => {},
  highContrast: false,
  toggleHighContrast: () => {},
  reducedMotion: false,
  toggleReducedMotion: () => {},
  colorBlindnessMode: 'normal' as const,
  setColorBlindnessMode: () => {},
}

// eslint-disable-next-line react-refresh/only-export-components
function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <I18nextProvider i18n={i18nInstance}>
      <AccessibilityContext.Provider value={defaultA11yValue}>
        {children}
      </AccessibilityContext.Provider>
    </I18nextProvider>
  )
}

function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options })
}

export { customRender as render, i18nInstance as i18n }
