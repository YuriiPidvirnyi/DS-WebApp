import { useEffect } from 'react'

/**
 * М'які динамічні якорі секцій (owner request): на час життя сторінки вішає
 * на <html> клас `snap-sections` (globals.css → scroll-snap-type: y proximity
 * на #main-content — реальному скролері цього лейауту; вікно не скролиться).
 * Той самий патерн, що body.menu-open у SiteHeader. Секції-якорі позначаються
 * `snap-start snap-screen`: min-height = скролпорт, тому кожен якір — один
 * повний екран. Хедер живе поза скролером, його фактичну висоту хук
 * публікує в --site-header-h (перерахунок на resize — топбар зникає <sm).
 * Proximity — скрол «підтягується» до початку секції лише коли зупинився
 * поруч, без агресивного перехоплення.
 */
export function useSectionSnap() {
  useEffect(() => {
    const root = document.documentElement
    const header = document.querySelector<HTMLElement>('header[role="banner"]')
    const setHeaderH = () =>
      root.style.setProperty(
        '--site-header-h',
        `${header?.offsetHeight ?? 0}px`
      )
    setHeaderH()
    window.addEventListener('resize', setHeaderH)
    root.classList.add('snap-sections')
    return () => {
      window.removeEventListener('resize', setHeaderH)
      root.classList.remove('snap-sections')
      root.style.removeProperty('--site-header-h')
    }
  }, [])
}
