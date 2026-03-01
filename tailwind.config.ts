import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        montserrat: ['Montserrat', 'sans-serif'],
        opensans: ['"Open Sans"', 'sans-serif'],
      },
      colors: {
        brand: {
          red: '#e53935',
          blue: '#1976d2',
          dark: '#0d0d0d',
          card: '#141414',
          border: '#252d3d',
          muted: '#6b7280',
        }
      }
    },
  },
  plugins: [],
}
export default config
