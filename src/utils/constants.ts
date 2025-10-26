// Контактна інформація клініки
const ENV = import.meta.env
const ENV_PHONE = ENV.VITE_PHONE_NUMBER || '+380504554774'
const ENV_EMERGENCY_PHONE = ENV.VITE_EMERGENCY_PHONE || ENV_PHONE
const ENV_EMAIL = ENV.VITE_EMAIL || 'info@dentalstory.com.ua'
const ENV_FB = ENV.VITE_FACEBOOK_URL || 'https://facebook.com/dentalstory'
const ENV_IG = ENV.VITE_INSTAGRAM_URL || 'https://instagram.com/dentalstory'
const ENV_TG = ENV.VITE_TELEGRAM_URL || 'https://t.me/dentalstory'

export const CONTACT_INFO = {
  phone: ENV_PHONE,
  phoneRaw: ENV_PHONE,
  emergencyPhone: ENV_EMERGENCY_PHONE,
  emergencyPhoneRaw: ENV_EMERGENCY_PHONE,
  email: ENV_EMAIL,
  privacyEmail: 'privacy@dentalstory.com.ua',
  address: {
    street: 'вул. Академіка Корольова, 10',
    district: 'Дніпровський район',
    city: 'Київ',
    postalCode: '02660',
    full: 'м. Київ, вул. Академіка Корольова, 10, Дніпровський район',
    fullWithPostal: '02660, м. Київ, вул. Академіка Корольова, 10, Дніпровський район',
  },
  workingHours: {
    weekdays: 'Пн-Пт: 9:00-19:00',
    saturday: 'Сб: 9:00-16:00',
    sunday: 'Нд: вихідний',
    timezone: 'EET (UTC+2)',
  },
  coordinates: {
    lat: 50.5147,
    lng: 30.6348,
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
  description: 'Сучасна стоматологічна клініка в Києві. Повний спектр послуг: лікування, імплантація, ортодонтія, відбілювання зубів. Досвідчені лікарі, безболісне лікування.',
  tagline: 'Ваша посмішка - наша місія',
  url: 'https://dentalstory.com.ua',
  foundedYear: 2018,
  googleMaps: 'https://maps.app.goo.gl/euKMW8R8eGTd2wJr9',
  businessType: 'Стоматологічна клініка',
  services: [
    'Терапевтична стоматологія',
    'Хірургічна стоматологія', 
    'Ортопедична стоматологія',
    'Ортодонтія',
    'Естетична стоматологія',
    'Дитяча стоматологія'
  ],
}

// Кольори бренду (для використання в JS) - згідно brandbook
export const BRAND_COLORS = {
  primary: '#AECED3',      // RGB(174, 206, 211) - основний блакитний
  secondary: '#D1CAC0',    // RGB(209, 202, 192) - бежевий
  white: '#FFFFFF',        // RGB(255, 255, 255)
} as const
