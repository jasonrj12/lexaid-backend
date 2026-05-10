/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
      colors: {
        /* ── Brand palette ── */
        brand: {
          50:  '#fff8e1',
          100: '#ffecb3',
          200: '#ffe082',
          300: '#ffd54f',
          400: '#ffca28',
          500: '#FCA311',   /* primary amber */
          600: '#e5920f',
          700: '#c47d0d',
          800: '#a3680b',
          900: '#7c4f08',
          950: '#4d3005',
        },
        /* ── Accent (navy tones) ── */
        accent: {
          50:  '#e8ecf4',
          100: '#c5cedf',
          200: '#9eafc9',
          300: '#7790b3',
          400: '#5a79a3',
          500: '#14213D',   /* primary navy */
          600: '#111d36',
          700: '#0d162a',
          800: '#09101f',
          900: '#050a13',
        },
        /* ── Surface shades (dark navy) ── */
        surface: {
          900: '#000000',   /* pure black */
          800: '#0a0e1a',
          700: '#0e1525',
          600: '#14213D',   /* navy */
          500: '#1e2f52',
          400: '#E5E5E5',   /* light gray */
          100: '#f5f5f5',
        },
        /* ── Semantic ── */
        gold: {
          400: '#ffca28',
          500: '#FCA311',
          600: '#e5920f',
        },
        navy: {
          DEFAULT: '#14213D',
          dark: '#0e1525',
          light: '#1e2f52',
        },
      },
      animation: {
        'fade-in':    'fadeIn 0.5s ease-out',
        'slide-up':   'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float':      'float 6s ease-in-out infinite',
        'shimmer':    'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%':   { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
