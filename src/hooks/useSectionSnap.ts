import { useEffect } from 'react'

/**
 * М'які динамічні якорі секцій (owner request): на час життя сторінки вішає
 * на <html> клас `snap-sections` (globals.css → scroll-snap-type: y proximity
 * на #main-content — реальному скролері цього лейауту; вікно не скролиться).
 * Той самий патерн, що body.menu-open у SiteHeader. Секції-якорі позначаються
 * `snap-start snap-screen`: min-height = скролпорт, тому кожен якір — один
 * повний екран. Хедер живе поза скролером, його фактичну висоту хук публікує
 * в --site-header-h. Proximity — скрол «підтягується» до початку секції лише
 * коли зупинився поруч, без агресивного перехоплення.
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
    // Висота хедера може змінитись і без resize вікна: перенос рядка в
    // топбарі після зміни мови, свап шрифту після FOUT. ResizeObserver
    // стежить за самим елементом; resize-слухач лишається запасним шляхом
    // для середовищ без RO (старі WebView) — там ловимо хоча б брейкпоінти.
    let ro: ResizeObserver | undefined
    if (header && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(setHeaderH)
      ro.observe(header)
    }
    window.addEventListener('resize', setHeaderH)
    root.classList.add('snap-sections')
    return () => {
      ro?.disconnect()
      window.removeEventListener('resize', setHeaderH)
      root.classList.remove('snap-sections')
      root.style.removeProperty('--site-header-h')
    }
  }, [])
}
