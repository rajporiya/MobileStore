/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        cream: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
        },
        brown: {
          light: '#818cf8',
          DEFAULT: '#4f46e5',
          dark: '#3730a3',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(51, 65, 85, 0.06), 0 8px 24px -12px rgba(79, 70, 229, 0.15)',
        'card-hover': '0 12px 28px -12px rgba(79, 70, 229, 0.22), 0 4px 10px -4px rgba(51, 65, 85, 0.1)',
        glow: '0 0 40px -8px rgba(99, 102, 241, 0.5)',
      },
    },
  },
  plugins: [],
}