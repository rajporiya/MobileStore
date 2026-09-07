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
          50:  '#fdf8f0',
          100: '#faeedd',
          200: '#f5dbb8',
          300: '#efc48a',
          400: '#e8a55a',
          500: '#c8854a',
          600: '#a86538',
          700: '#8a4d2a',
          800: '#6b3a1e',
          900: '#4e2a13',
        },
        cream: {
          50:  '#fdfaf5',
          100: '#faf3e8',
          200: '#f5e8d0',
          300: '#edd5b0',
          400: '#e2c08a',
        },
        brown: {
          light: '#c8956c',
          DEFAULT: '#8B5E3C',
          dark: '#5c3d2e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 6px -1px rgba(139, 94, 60, 0.1), 0 2px 4px -1px rgba(139, 94, 60, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(139, 94, 60, 0.15), 0 4px 6px -2px rgba(139, 94, 60, 0.1)',
      },
    },
  },
  plugins: [],
}
