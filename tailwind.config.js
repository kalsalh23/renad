/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ivory: '#FBF9F4',
        cream: '#F4EEE2',
        sand: '#EDE4D3',
        champagne: {
          light: '#EDE1C8',
          DEFAULT: '#D8C5A0',
          dark: '#B99B67',
        },
        gold: {
          light: '#CDB182',
          DEFAULT: '#AE8B4F',
          dark: '#8A6C38',
        },
        ink: '#211D18',
        coal: '#2E2921',
        smoke: '#6F675B',
        beige: '#A79A87',
        blush: '#EFE4DA',
      },
      fontFamily: {
        display: ['Amiri', 'Georgia', 'serif'],
        body: ['Almarai', 'Tahoma', 'sans-serif'],
        latin: ['Marcellus', 'Georgia', 'serif'],
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(26px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        pop: {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.35)' },
          '100%': { transform: 'scale(1)' },
        },
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up .8s cubic-bezier(.22,.61,.36,1) both',
        'fade-in': 'fade-in .6s ease both',
        shimmer: 'shimmer 1.6s linear infinite',
        pop: 'pop .4s ease',
        'slide-down': 'slide-down .35s ease both',
      },
      maxWidth: {
        site: '80rem',
      },
    },
  },
  plugins: [],
}
