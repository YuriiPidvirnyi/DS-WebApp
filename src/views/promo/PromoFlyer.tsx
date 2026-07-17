import { CONTACT_INFO, SITE_INFO } from '@/utils/constants'
import PrintButton from './PrintButton'

interface PromoFlyerProps {
  anketaQrSvg: string
  reviewQrSvg: string
  anketaUrl: string
}

/**
 * Print-ready promo materials for the welcome-pack campaign:
 *   sheet 1 — A6 flyer, front + back (cut marks = card borders)
 *   sheet 2 — "thank you / review us" cards, 4 per sheet
 *
 * Compliance note baked into the design: the flyer (gift) never mentions
 * reviews, the card (review ask) never mentions the gift — the two campaign
 * channels stay physically separate.
 *
 * Print texts are intentionally Ukrainian-only: these are physical handouts
 * for the Lviv reception desk, not localized web UI.
 */
export default function PromoFlyer({
  anketaQrSvg,
  reviewQrSvg,
  anketaUrl,
}: PromoFlyerProps) {
  const siteHost = SITE_INFO.url.replace(/^https?:\/\//, '')

  return (
    <div className="min-h-screen bg-dental-secondary-50 py-10 print:bg-white print:py-0">
      <style
        // Isolate #print-area during printing: the site chrome (header,
        // footer, floating buttons) stays on screen but never on paper.
        dangerouslySetInnerHTML={{
          __html: `
@page { size: A4 portrait; margin: 8mm; }
@media print {
  body * { visibility: hidden; }
  #print-area, #print-area * { visibility: visible; }
  #print-area { position: absolute; left: 0; top: 0; width: 100%; }
  .print-sheet { page-break-after: always; }
  .print-sheet:last-child { page-break-after: auto; }
}
`,
        }}
      />

      {/* Screen-only intro */}
      <div className="mx-auto mb-8 max-w-3xl px-4 text-center print:hidden">
        <h1 className="text-2xl font-bold text-dental-dark">
          Друкарські матеріали кампанії «Вітальний пакет»
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-dental-text">
          Сторінка 1 — флаєр A6 (лицьова та зворотна сторони), сторінка 2 —
          картки «дякуємо» з QR на відгук у Google. Друкуйте на A4 та ріжте по
          рамках, або збережіть як PDF для друкарні.
        </p>
        <div className="mt-4 flex justify-center">
          <PrintButton label="Друкувати / зберегти як PDF" />
        </div>
      </div>

      <div id="print-area" className="mx-auto max-w-3xl space-y-10 px-4">
        {/* ── Sheet 1: A6 flyer front + back ─────────────────────────── */}
        <div className="print-sheet space-y-6">
          {/* Front */}
          <div className="mx-auto flex h-[148mm] w-[105mm] flex-col overflow-hidden rounded-lg border border-dental-secondary-300 bg-white">
            <div className="bg-dental-primary px-6 py-5 text-center">
              <p className="text-lg font-bold tracking-tight text-dental-dark">
                Dental Story
              </p>
              <h2 className="mt-2 text-xl font-extrabold leading-snug text-dental-dark">
                Вітальний подарунок
                <br />
                для нових пацієнтів
              </h2>
            </div>
            <div className="flex flex-1 flex-col items-center justify-between px-6 py-5 text-center">
              <p className="text-sm leading-relaxed text-dental-text">
                Заповніть анкету пацієнта онлайн — і отримайте зубну пасту{' '}
                <span className="font-semibold text-dental-dark">Curaprox</span>{' '}
                у подарунок на рецепції.
              </p>
              <div
                className="my-3 h-[44mm] w-[44mm] [&_svg]:h-full [&_svg]:w-full"
                dangerouslySetInnerHTML={{ __html: anketaQrSvg }}
              />
              <p className="text-xs text-dental-muted">{anketaUrl}</p>
              <ol className="mt-3 w-full space-y-1.5 text-left text-xs text-dental-text">
                <li>
                  <span className="font-bold text-dental-primary-600">1.</span>{' '}
                  Скануйте QR-код камерою телефона
                </li>
                <li>
                  <span className="font-bold text-dental-primary-600">2.</span>{' '}
                  Заповніть анкету — це займе 5 хвилин
                </li>
                <li>
                  <span className="font-bold text-dental-primary-600">3.</span>{' '}
                  Покажіть підтвердження адміністратору — подарунок ваш
                </li>
              </ol>
            </div>
          </div>

          {/* Back */}
          <div className="mx-auto flex h-[148mm] w-[105mm] flex-col overflow-hidden rounded-lg border border-dental-secondary-300 bg-white px-6 py-6">
            <h3 className="text-base font-extrabold text-dental-dark">
              Що в анкеті?
            </h3>
            <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-dental-text">
              <li>• Контактні дані</li>
              <li>• Алергії та ліки, які ви приймаєте</li>
              <li>• Хронічні захворювання</li>
              <li>• Що вас турбує та мета візиту</li>
            </ul>
            <p className="mt-4 text-xs leading-relaxed text-dental-text">
              Лікар ознайомиться з анкетою заздалегідь і підготується до вашого
              візиту — прийом пройде швидше та спокійніше.
            </p>
            <div className="mt-auto space-y-1 border-t border-dental-secondary-200 pt-4 text-xs text-dental-text">
              <p className="font-semibold text-dental-dark">
                {CONTACT_INFO.address.full}
              </p>
              <p>{CONTACT_INFO.phone}</p>
              <p>{siteHost}</p>
            </div>
            <p className="mt-3 text-[9px] leading-snug text-dental-muted">
              Подарунок — за вперше заповнену анкету нового пацієнта. Кількість
              подарунків обмежена. Деталі — на рецепції клініки.
            </p>
          </div>
        </div>

        {/* ── Sheet 2: thank-you / review cards (4 per sheet) ────────── */}
        <div className="print-sheet">
          <div className="mx-auto grid w-fit grid-cols-1 gap-6 sm:grid-cols-2">
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className="flex h-[55mm] w-[85mm] flex-col justify-between overflow-hidden rounded-lg border border-dental-secondary-300 bg-white p-4"
              >
                <div>
                  <p className="text-sm font-extrabold text-dental-dark">
                    Дякуємо, що обрали Dental Story!
                  </p>
                  <p className="mt-1 text-[10px] leading-snug text-dental-text">
                    Ваш відгук у Google допомагає іншим пацієнтам знайти нас.
                    Скануйте — це займе хвилину.
                  </p>
                </div>
                <div className="flex items-end justify-between">
                  <div className="text-[9px] text-dental-muted">
                    <p className="font-semibold text-dental-text">{siteHost}</p>
                    <p>{CONTACT_INFO.phone}</p>
                  </div>
                  <div
                    className="h-[24mm] w-[24mm] [&_svg]:h-full [&_svg]:w-full"
                    dangerouslySetInnerHTML={{ __html: reviewQrSvg }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
