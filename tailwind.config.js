/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['Courier New', 'monospace'],
      },
      borderRadius: {
        none: '0',
        sm: '0',
        DEFAULT: '0',
        md: '0',
        lg: '0',
        xl: '0',
        '2xl': '0',
        '3xl': '0',
      },
      boxShadow: {
        'pixel': '4px 4px 0 rgba(0, 0, 0, 0.1)',
        'pixel-hover': '6px 6px 0 rgba(0, 0, 0, 0.1)',
      }
    },
  },
  plugins: [],
}