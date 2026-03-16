/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}', './app/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Dental Story Brand Colors - Full 13-color system from audit
        dental: {
          // PRIMARY PALETTE (from brandbook)
          primary: '#AECED3',      // Soft Teal - main brand color
          secondary: '#D1CAC0',    // Warm Sand - warmth/comfort
          white: '#FFFFFF',        // Pure White - cleanliness
          
          // PRIMARY TINTS & SHADES
          'primary-50': '#F0F7F8',   // Lightest tint - backgrounds
          'primary-100': '#E1EFF1',  // Very light - hover states
          'primary-200': '#C5DDE1',  // Light - cards
          'primary-300': '#AECED3',  // Base primary
          'primary-400': '#8FBAC1',  // Slightly darker
          'primary-500': '#7BA8B0',  // Medium - hover
          'primary-600': '#5A8A94',  // Dark - active states
          'primary-700': '#4A7078',  // Darker - text on light
          'primary-800': '#3A565C',  // Very dark
          'primary-900': '#2A3C40',  // Darkest
          
          // SECONDARY TINTS
          'secondary-50': '#FAF9F7',
          'secondary-100': '#F5F3F0',
          'secondary-200': '#EBE7E1',
          'secondary-300': '#D1CAC0',  // Base secondary
          'secondary-400': '#B8AFA3',
          'secondary-500': '#9F9486',
          
          // FUNCTIONAL COLORS
          success: '#4CAF50',        // Green - confirmations
          'success-light': '#E8F5E9',
          'success-dark': '#388E3C',
          warning: '#FF9800',        // Amber - caution
          'warning-light': '#FFF3E0',
          'warning-dark': '#F57C00',
          error: '#EF5350',          // Coral - errors (softer than red)
          'error-light': '#FFEBEE',
          'error-dark': '#C62828',
          info: '#2196F3',           // Blue - information
          'info-light': '#E3F2FD',
          'info-dark': '#1565C0',
          
          // TEXT COLORS
          dark: '#2C3E42',           // Headings
          text: '#4A5E63',           // Body text
          muted: '#6B8388',          // Secondary text
          'text-light': '#8FA3A8',   // Placeholder text
          
          // LEGACY ALIASES
          'primary-dark': '#7BA8B0',
          'primary-darker': '#5A8A94',
          'primary-light': '#C5DDE1',
        },
        // Backward-compatibility aliases (v1 → v2 mapping)
        'dental-blue': '#AECED3',   // primary brand blue (unchanged)
        'dental-teal': '#5A8A94',   // accent/CTA teal → dental.primary-600
        'dental-green': '#5A8A94',  // was alias of teal → dental.primary-600
        'dental-navy': '#2C3E42',   // deep navy → dental.dark
      },
      fontFamily: {
        sans: ['var(--font-nunito)', 'Nunito', 'system-ui', 'sans-serif'],
        heading: ['var(--font-nunito)', 'Nunito', 'system-ui', 'sans-serif'],
        body: ['var(--font-rubik)', 'Rubik', 'system-ui', 'sans-serif'],
      },
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
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
