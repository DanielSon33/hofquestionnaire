/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#e0eaff',
          200: '#c7d7fd',
          300: '#a4bcfb',
          400: '#7c98f7',
          500: '#5a76f1',
          600: '#3d55e5',
          700: '#3244cc',
          800: '#2c3ba5',
          900: '#293882',
        },
      },
    },
  },
  plugins: [],
}
