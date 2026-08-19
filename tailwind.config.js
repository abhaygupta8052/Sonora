/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: 'rgb(var(--theme-accent-rgb, 139 92 246) / <alpha-value>)',
          500: 'rgb(var(--theme-accent-rgb, 139 92 246) / <alpha-value>)',
          600: 'rgb(var(--theme-accent-hover-rgb, 124 58 237) / <alpha-value>)',
          700: 'rgb(var(--theme-accent-hover-rgb, 124 58 237) / <alpha-value>)',
          800: '#5b21b6',
          900: '#4c1d95',
          DEFAULT: 'rgb(var(--theme-accent-rgb, 139 92 246) / <alpha-value>)',
          accent: 'rgb(var(--theme-accent-rgb, 139 92 246) / <alpha-value>)',
        },
        dark: {
          bg: 'rgb(var(--theme-bg-dark-rgb, 9 13 22) / <alpha-value>)',
          surface: 'rgb(var(--theme-surface-dark-rgb, 14 20 36) / <alpha-value>)',
          card: 'rgb(var(--theme-card-dark-rgb, 22 31 51) / <alpha-value>)',
          cardHover: 'rgb(var(--theme-card-hover-rgb, 30 43 69) / <alpha-value>)',
          border: 'rgb(var(--theme-border-dark-rgb, 35 47 72) / <alpha-value>)',
          text: '#F8FAFC',
          muted: '#94A3B8',
        },
        light: {
          bg: '#F8FAFC',
          surface: '#FFFFFF',
          card: '#FFFFFF',
          cardHover: '#F1F5F9',
          border: '#E2E8F0',
          text: '#0F172A',
          muted: '#64748B',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'equalizer': 'equalizer 1.2s ease-in-out infinite',
      },
      keyframes: {
        equalizer: {
          '0%, 100%': { height: '4px' },
          '50%': { height: '18px' },
        }
      }
    },
  },
  plugins: [],
}
