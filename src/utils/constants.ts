// Контактна інформація клініки
const ENV = import.meta.env
const ENV_PHONE = ENV.VITE_PHONE_NUMBER || '+380682323838'
const ENV_EMERGENCY_PHONE = ENV.VITE_EMERGENCY_PHONE || ENV_PHONE
const ENV_EMAIL = ENV.VITE_EMAIL || 'info@dentalstory.ua'
const ENV_FB =
  ENV.VITE_FACEBOOK_URL || 'https://www.facebook.com/dentalstoryylviv/'
const ENV_IG =
  ENV.VITE_INSTAGRAM_URL || 'https://www.instagram.com/dentalstory_lviv/'
const ENV_TG = ENV.VITE_TELEGRAM_URL || 'https://t.me/dentalstory'

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
    weekdays: 'Пн-Пт: 09:00-21:00',
    saturday: 'Сб: 09:00-18:00',
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
    viber: ENV_PHONE,
  },
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
    'Сучасна стоматологічна клініка у Львові. Повний спектр послуг: лікування, імплантація, ортодонтія, відбілювання зубів. Досвідчені лікарі, безболісне лікування.',
  tagline: 'Ваша посмішка - наша місія',
  url: 'https://dentalstory.com.ua',
  foundedYear: 2024,
  googleMaps: 'https://maps.app.goo.gl/gprGw94tfAJH7xFSA',
  businessType: 'Стоматологічна клініка',
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
