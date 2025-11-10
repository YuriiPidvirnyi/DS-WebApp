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
    },
  },
  plugins: [],
}
