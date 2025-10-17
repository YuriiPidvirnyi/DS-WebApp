// Контактна інформація клініки
export const CONTACT_INFO = {
  phone: '+380 68 232 38 38',
  phoneRaw: '+380682323838',
  emergencyPhone: '+380 68 232 38 38',
  emergencyPhoneRaw: '+380682323838',
  email: 'info@dentalstory.com.ua',
  privacyEmail: 'privacy@dentalstory.com.ua',
  address: {
    street: 'вул. Сумська, 10',
    district: '',
    city: 'Львів',
    postalCode: '79034',
    full: 'м. Львів, вул. Сумська, 10',
    fullWithPostal: '79034, м. Львів, вул. Сумська, 10',
  },
  workingHours: {
    weekdays: 'Пн-Пт: 9:00-21:00',
    saturday: 'Сб: 9:00-18:00',
    sunday: 'Нд: 8:00-22:00',
    timezone: 'EET (UTC+2)',
  },
  coordinates: {
    lat: 49.8123766,
    lng: 24.0367902,
  },
  social: {
    facebook: 'https://www.facebook.com/dentalstorykyiv',
    instagram: 'https://instagram.com/dentalstory_lviv',
    telegram: 'https://t.me/dentalstory_kyiv',
    viber: '+380682323838',
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
