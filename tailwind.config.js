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
          400: 'var(--theme-accent, #a78bfa)',
          500: 'var(--theme-accent, #8b5cf6)',
          600: 'var(--theme-accent-hover, #7c3aed)',
          700: 'var(--theme-accent-hover, #6d28d9)',
          800: '#5b21b6',
          900: '#4c1d95',
          DEFAULT: 'var(--theme-accent, #7c3aed)',
          accent: 'var(--theme-accent, #ec4899)',
        },
        dark: {
          bg: 'var(--theme-bg-dark, #090D16)',
          surface: 'var(--theme-surface-dark, #111827)',
          card: 'var(--theme-card-dark, #161F33)',
          cardHover: 'var(--theme-card-hover, #1E2B45)',
          border: 'var(--theme-border-dark, #232F48)',
          text: 'var(--theme-text-dark, #F8FAFC)',
          muted: 'var(--theme-muted-dark, #94A3B8)',
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
