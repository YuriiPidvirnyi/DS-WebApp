import type { Metadata } from 'next'
import QRCode from 'qrcode'
import PromoFlyer from '@/views/promo/PromoFlyer'

export const metadata: Metadata = {
  title: 'Друкарські матеріали — вітальний пакет',
  robots: { index: false, follow: false },
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dentalstory.ua'
const QR_OPTIONS = {
  type: 'svg' as const,
  margin: 0,
  errorCorrectionLevel: 'M' as const,
  color: { dark: '#2C3E42', light: '#FFFFFF' },
}

export default async function PromoFlyerPage() {
  const anketaUrl = `${SITE_URL}/anketa?promo=WELCOME&src=flyer`
  const reviewUrl = `${SITE_URL}/r/google?src=card`

  const [anketaQrSvg, reviewQrSvg] = await Promise.all([
    QRCode.toString(anketaUrl, QR_OPTIONS),
    QRCode.toString(reviewUrl, QR_OPTIONS),
  ])

  return (
    <PromoFlyer
      anketaQrSvg={anketaQrSvg}
      reviewQrSvg={reviewQrSvg}
      anketaUrl={`${SITE_URL.replace(/^https?:\/\//, '')}/anketa`}
    />
  )
}
