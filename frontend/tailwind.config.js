/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Toggle dark mode via class on html/body element
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#ffebee',
          100: '#ffcdd2',
          200: '#ef9a9a',
          300: '#e57373',
          400: '#ef5350',
          500: '#e53935', // Rich primary red accent
          600: '#d32f2f',
          700: '#c62828',
          800: '#b71c1c',
          900: '#7f0000',
        },
        dark: {
          bg: '#0a0a0f',
          card: 'rgba(20, 20, 30, 0.75)',
          border: 'rgba(255, 255, 255, 0.08)',
          text: '#f3f4f6',
          textMuted: '#9ca3af'
        },
        light: {
          bg: '#f8f9fa',
          card: 'rgba(255, 255, 255, 0.8)',
          border: 'rgba(0, 0, 0, 0.06)',
          text: '#1f2937',
          textMuted: '#6b7280'
        }
      },
      backdropBlur: {
        premium: '16px'
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
