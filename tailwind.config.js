/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dental: {
          primary: '#AECED3',    // Основний блакитний з brandbook
          secondary: '#D1CAC0',   // Бежевий з brandbook
          white: '#FFFFFF',
        },
        // Для сумісності зі старим кодом
        'dental-blue': '#AECED3',
        'dental-teal': '#AECED3',
        'dental-green': '#AECED3',
      },
      fontFamily: {
        sans: ['Stolzl', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}