/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}', './app/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Dental Story Brand Colors (from brandbook)
        dental: {
          primary: '#AECED3', // HEX #AECED3 - основний блакитний
          secondary: '#D1CAC0', // HEX #D1CAC0 - бежевий/кремовий
          white: '#FFFFFF', // HEX #FFFFFF - білий
          // Відтінки primary
          'primary-dark': '#7BA8B0', // Темніший відтінок для hover
          'primary-darker': '#5A8A94', // Ще темніший для акцентів
          'primary-light': '#C5DDE1', // Світліший відтінок
          // Темні кольори для тексту
          'dark': '#2C3E42', // Темний на основі primary для заголовків
          'text': '#4A5E63', // Основний текст
          'muted': '#6B8388', // Вторинний текст
        },
        // Для сумісності зі старим кодом
        'dental-blue': '#AECED3',
        'dental-teal': '#AECED3', // Замінено на брендовий колір
        'dental-green': '#AECED3',
      },
      fontFamily: {
        sans: ['var(--font-nunito)', 'Nunito', 'system-ui', 'sans-serif'],
        heading: ['var(--font-nunito)', 'Nunito', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Enhanced type scale for better hierarchy
        'display-2xl': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-xl': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-lg': ['3rem', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-md': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '700' }],
        'display-sm': ['1.875rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],
        'body-xl': ['1.25rem', { lineHeight: '1.6', letterSpacing: '0' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6', letterSpacing: '0' }],
        'body-md': ['1rem', { lineHeight: '1.6', letterSpacing: '0' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5', letterSpacing: '0' }],
      },
      spacing: {
        // Modern spacing scale for generous whitespace
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
        '34': '8.5rem',
      },
      borderRadius: {
        sm: '0.5rem', // 8px
        DEFAULT: '0.75rem', // 12px
        md: '1rem', // 16px
        lg: '1.25rem', // 20px
        xl: '1.5rem', // 24px
        '2xl': '2rem', // 32px
        '3xl': '2.5rem', // 40px
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 10px 40px -15px rgba(0, 0, 0, 0.1)',
        'soft-xl': '0 20px 60px -20px rgba(0, 0, 0, 0.15)',
        'glow-brand': '0 0 30px -5px rgba(174, 206, 211, 0.5)',
      },
      animation: {
        'float': 'float 4s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
