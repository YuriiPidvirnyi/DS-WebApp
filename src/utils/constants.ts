// Контактна інформація клініки
const ENV_PHONE = process.env.NEXT_PUBLIC_PHONE_NUMBER || '+380682323838'
const ENV_EMERGENCY_PHONE = process.env.NEXT_PUBLIC_EMERGENCY_PHONE || ENV_PHONE
const ENV_EMAIL = process.env.NEXT_PUBLIC_EMAIL || 'info@dentalstory.ua'
const ENV_FB =
  process.env.NEXT_PUBLIC_FACEBOOK_URL || 'https://www.facebook.com/dentalstoryylviv/'
const ENV_IG =
  process.env.NEXT_PUBLIC_INSTAGRAM_URL || 'https://www.instagram.com/dentalstory_lviv/'
const ENV_TG = process.env.NEXT_PUBLIC_TELEGRAM_URL || 'https://t.me/dentalstory'

export const CONTACT_INFO = {
  phone: ENV_PHONE,
  phoneRaw: ENV_PHONE,
  emergencyPhone: ENV_EMERGENCY_PHONE,
  emergencyPhoneRaw: ENV_EMERGENCY_PHONE,
  email: ENV_EMAIL,
  privacyEmail: 'privacy@dentalstory.ua',
  address: {
    street: 'вул. Дорошенка, 35',
    district: 'Галицький район',
    city: 'Львів',
    postalCode: '79000',
    full: 'вул. Дорошенка, 35, Львів',
    fullWithPostal: '79000, вул. Дорошенка, 35, Львів',
  },
  workingHours: {
    weekdays: 'Пн-Пт: 09:00-20:00',
    saturday: 'Сб: 10:00-17:00',
    sunday: 'Нд: Вихідний',
    timezone: 'EET (UTC+2)',
  },
  coordinates: {
    lat: 49.8419,
    lng: 24.0316,
  },
  social: {
    facebook: ENV_FB,
    instagram: ENV_IG,
    telegram: ENV_TG,
    viber: ENV_PHONE,
  },
  googleMapsEmbed: 'https://maps.app.goo.gl/6CNarQSYFyQjrUHG8',
}

// Навігація
export const NAVIGATION = [
  { name: 'Головна', href: '/' },
  { name: 'Послуги', href: '/services' },
  { name: 'Про нас', href: '/about' },
  { name: 'Галерея', href: '/gallery' },
  { name: 'Контакти', href: '/contact' },
] as const

// SEO
export const SITE_INFO = {
  name: 'Dental Story',
  description:
    'Сучасна стоматологічна клініка у центрі Львова. Повний спектр послуг: лікування, імплантація, ортодонтія, відбілювання зубів. Досвідчені лікарі, безболісне лікування, сучасне обладнання.',
  tagline: 'Ваша історія красивої посмішки',
  url: 'https://dentalstory.com.ua',
  foundedYear: 2020,
  googleMaps: 'https://maps.app.goo.gl/6CNarQSYFyQjrUHG8',
  businessType: 'Стоматологічна клініка',
  rating: 5.0,
  reviewCount: 47,
  services: [
    'Терапевтична стоматологія',
    'Хірургічна стоматологія',
    'Ортопедична стоматологія',
    'Ортодонтія',
    'Естетична стоматологія',
    'Дитяча стоматологія',
    'Імплантація',
    'Професійна гігієна',
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
    (digits.length === 10 && ['0', '06', '07', '09'].some(p => digits.startsWith(p)))
  )
}
