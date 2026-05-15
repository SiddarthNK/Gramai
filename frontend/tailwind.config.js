/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sora: ['Sora', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#E1F5EE',
          100: '#B3E5D3',
          200: '#80D4B6',
          300: '#4DC299',
          400: '#29B383',
          500: '#1D9E75',
          600: '#178F68',
          700: '#0F6E56',
          800: '#0A4F3E',
          900: '#053328',
        },
        blue: {
          400: '#5BA4E6',
          500: '#378ADD',
          600: '#185FA5',
          100: '#E6F1FB',
        },
        amber: {
          400: '#F5BF5C',
          500: '#EF9F27',
          600: '#854F0B',
          100: '#FAEEDA',
        },
      },
      borderRadius: {
        'xl': '14px',
        '2xl': '20px',
      },
      boxShadow: {
        'glass': '0 4px 24px rgba(0,0,0,0.06)',
        'card': '0 1px 4px rgba(0,0,0,0.04)',
      },
      animation: {
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
        'wave': 'wavePulse 1.2s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease',
        'slide-up': 'slideUp 0.3s ease',
        'typing': 'typing 1.4s steps(3) infinite',
      },
      keyframes: {
        pulseDot: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        wavePulse: {
          '0%, 100%': { height: '4px' },
          '50%': { height: '24px' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        typing: {
          '0%': { content: '"."' },
          '33%': { content: '".."' },
          '66%': { content: '"..."' },
        },
      },
    },
  },
  plugins: [],
};
