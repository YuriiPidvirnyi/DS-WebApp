import uk from '@/locales/uk'
import { CLINIC_OPENING_HOURS } from '@/config/clinicSchedule'

// Контактна інформація клініки
const ENV_PHONE = process.env.NEXT_PUBLIC_PHONE_NUMBER || '+380682323838'
const ENV_EMERGENCY_PHONE = process.env.NEXT_PUBLIC_EMERGENCY_PHONE || ENV_PHONE
const ENV_EMAIL = process.env.NEXT_PUBLIC_EMAIL || 'info@dentalstory.ua'
const ENV_FB =
  process.env.NEXT_PUBLIC_FACEBOOK_URL ||
  'https://www.facebook.com/dentalstoryylviv/'
const ENV_IG =
  process.env.NEXT_PUBLIC_INSTAGRAM_URL ||
  'https://www.instagram.com/dentalstory_lviv/'
const ENV_TG =
  process.env.NEXT_PUBLIC_TELEGRAM_URL || 'https://t.me/dentalstorylviv'
const ENV_TT =
  process.env.NEXT_PUBLIC_TIKTOK_URL ||
  'https://www.tiktok.com/@dentalstory.lviv'
const ENV_WA =
  process.env.NEXT_PUBLIC_WHATSAPP_URL ||
  `https://wa.me/${(process.env.NEXT_PUBLIC_PHONE_NUMBER || '+380682323838').replace(/\D/g, '')}`

export const CONTACT_INFO = {
  phone: ENV_PHONE,
  phoneRaw: ENV_PHONE,
  emergencyPhone: ENV_EMERGENCY_PHONE,
  emergencyPhoneRaw: ENV_EMERGENCY_PHONE,
  email: ENV_EMAIL,
  privacyEmail: 'privacy@dentalstory.ua',
  address: {
    street: 'вулиця Сумська, 10',
    district: 'Львівська область',
    city: 'Львів',
    postalCode: '79034',
    full: 'вулиця Сумська, 10, Львів, Львівська область',
    fullWithPostal: '79034, вулиця Сумська, 10, Львів, Львівська область',
  },
  workingHours: {
    weekdays: `Пн-Пт: ${CLINIC_OPENING_HOURS.weekday.open}-${CLINIC_OPENING_HOURS.weekday.close}`,
    saturday: `Сб: ${CLINIC_OPENING_HOURS.saturday.open}-${CLINIC_OPENING_HOURS.saturday.close}`,
    sunday: 'Нд: Вихідний',
    timezone: 'EET (UTC+2)',
  },
  coordinates: {
    lat: 49.8124,
    lng: 24.0368,
  },
  social: {
    facebook: ENV_FB,
    instagram: ENV_IG,
    telegram: ENV_TG,
    tiktok: ENV_TT,
    whatsapp: ENV_WA,
    viber: ENV_PHONE,
  },
}

// Навігація
export const NAVIGATION = [
  { name: uk.navigation.home, href: '/' },
  { name: uk.navigation.services, href: '/services' },
  { name: uk.navigation.about, href: '/about' },
  { name: uk.navigation.gallery, href: '/gallery' },
  { name: uk.navigation.contact, href: '/contact' },
] as const

// SEO
export const SITE_INFO = {
  name: uk.common.brandName,
  description: uk.meta.description,
  tagline: uk.about.story.mission,
  url: 'https://dentalstory.ua',
  foundedYear: 2020,
  googleMaps: 'https://maps.app.goo.gl/gprGw94tfAJH7xFSA',
  businessType: uk.structuredData.medicalClinicNameSuffix,
  rating: 4.7,
  reviewCount: 71,
  services: [
    'Терапевтична стоматологія',
    'Хірургічна стоматологія',
    'Ортопедична стоматологія',
    'Ортодонтія',
    'Естетична стоматологія',
    'Дитяча стоматологія',
  ],
}

// Кольори бренду (для використання в JS) - згідно brandbook
export const BRAND_COLORS = {
  primary: '#AECED3', // RGB(174, 206, 211) - основний блакитний
  secondary: '#D1CAC0', // RGB(209, 202, 192) - бежевий
  white: '#FFFFFF', // RGB(255, 255, 255)
} as const

// Ukrainian-specific settings
export const UKRAINE_CONFIG = {
  // Currency
  currency: {
    code: 'UAH',
    symbol: '₴',
    name: 'Українська гривня',
    locale: 'uk-UA',
  },
  // Phone format
  phone: {
    countryCode: '+380',
    format: '+380 XX XXX XX XX',
    regex: /^\+380\d{9}$/,
    placeholder: '+380 67 123 45 67',
  },
  // Date/time
  dateFormat: 'dd.MM.yyyy',
  timeFormat: 'HH:mm',
  timezone: 'Europe/Kyiv',
  locale: 'uk-UA',
  // Holidays (dental clinics often closed)
  holidays: [
    { date: '01-01', name: 'Новий рік' },
    { date: '01-07', name: 'Різдво' },
    { date: '03-08', name: 'Міжнародний жіночий день' },
    { date: '05-01', name: 'День праці' },
    { date: '05-09', name: 'День перемоги' },
    { date: '06-28', name: 'День Конституції' },
    { date: '08-24', name: 'День Незалежності' },
    { date: '10-14', name: 'День захисника України' },
    { date: '12-25', name: 'Католицьке Різдво' },
  ],
  // Payment methods popular in Ukraine
  paymentMethods: [
    { id: 'cash', name: 'Готівка', icon: 'banknotes' },
    { id: 'card', name: 'Картка (Visa/Mastercard)', icon: 'credit-card' },
    { id: 'privat24', name: 'Приват24', icon: 'smartphone' },
    { id: 'mono', name: 'Monobank', icon: 'smartphone' },
    { id: 'apple-pay', name: 'Apple Pay', icon: 'apple' },
    { id: 'google-pay', name: 'Google Pay', icon: 'google' },
  ],
  // Insurance companies (popular in Ukraine for dental)
  insurancePartners: [
    'УНІКА',
    'Провідна',
    'Альфа Страхування',
    'PZU Україна',
    'ТАС Страхування',
  ],
}

// Format price in UAH
export const formatPriceUAH = (amount: number): string => {
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency: 'UAH',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Format Ukrainian phone number
export const formatUkrainianPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('380')) {
    return `+380 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10)}`
  }
  if (digits.length === 10) {
    return `+380 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7)}`
  }
  return phone
}

// Validate Ukrainian phone
export const isValidUkrainianPhone = (phone: string): boolean => {
  const digits = phone.replace(/\D/g, '')
  return (
    (digits.length === 12 && digits.startsWith('380')) ||
    (digits.length === 10 &&
      ['0', '06', '07', '09'].some(p => digits.startsWith(p)))
  )
}
