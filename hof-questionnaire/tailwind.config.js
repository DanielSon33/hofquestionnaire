/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Gravity', '"Barlow Condensed"', 'sans-serif'],
        body: ['PPEditorialNew', '"EB Garamond"', 'Georgia', 'serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        lime: '#BAFF99',
        ink: '#0A0A0A',
        paper: '#F5F5F0',
      },
      letterSpacing: {
        widest2: '0.2em',
      },
      fontSize: {
        '7xl': ['10rem', { lineHeight: '0.8' }],
        '8xl': ['15rem', { lineHeight: '0.8' }],
      },
    },
  },
  plugins: [],
}
