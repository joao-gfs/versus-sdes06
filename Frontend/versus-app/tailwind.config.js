/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'background': '#143642',
        'versus-blue': '#0F8B8D',
        'versus-red': '#A8201A',
        'versus-yellow': '#EC9A29',
        'versus-grey': '#DAD2D8'
      }
    },
  },
  plugins: [],
}