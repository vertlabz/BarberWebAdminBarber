import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f2f5ff',
          100: '#e0e7ff',
          500: '#4f46e5',
          600: '#4338ca',
          800: '#1e1b4b'
        }
      }
    }
  },
  plugins: []
}

export default config
