/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dental: {
          primary: '#AECED3', // HEX #AECED3 - основний блакитний з brandbook
          secondary: '#D1CAC0', // HEX #D1CAC0 - бежевий з brandbook
          white: '#FFFFFF', // HEX #FFFFFF - білий
          // RGB значення для CSS custom properties
          'primary-rgb': '174, 206, 211',
          'secondary-rgb': '209, 202, 192',
        },
        // Для сумісності зі старим кодом
        'dental-blue': '#AECED3',
        'dental-teal': '#AECED3',
        'dental-green': '#AECED3',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        heading: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
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
    },
  },
  plugins: [],
}
