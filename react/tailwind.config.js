/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        white: '#ffffff',
        'white-soft': '#f8f8f8',
        'white-mute': '#f2f2f2',

        black: '#1b1b1f',
        'black-soft': '#222222',
        'black-mute': '#282828',

        'gray-1': '#515c67',
        'gray-2': '#414853',
        'gray-3': '#32363f',

        'text-1': 'rgba(255, 255, 245, 0.86)',
        'text-2': 'rgba(235, 235, 245, 0.6)',
        'text-3': 'rgba(235, 235, 245, 0.38)'
      }
    }
  },
  plugins: []
}
