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
        background: '#0B0D0E',
        surface: '#111417',
        'surface-hover': '#181C20',
        card: '#15191C',
        border: '#242A2E',
        primary: {
          50: '#f7fee7',
          100: '#ecfccb',
          500: '#84cc16',
          600: '#76B900',  // Signature NVIDIA Green
          700: '#4d7c0f',
        },
        accent: {
          nvidia: '#76B900',
          emerald: '#10b981',
          lime: '#84cc16',
          cyan: '#06b6d4',
          teal: '#14b8a6',
        }
      },
      boxShadow: {
        'glow-nvidia': '0 0 25px -3px rgba(118, 185, 0, 0.35)',
        'glow-green': '0 0 30px -5px rgba(16, 185, 129, 0.3)',
      },
      fontFamily: {
        sans: ['Inter', 'Manrope', 'Geist', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      }
    },
  },
  plugins: [],
}
