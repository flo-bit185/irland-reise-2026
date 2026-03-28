/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ireland: {
          green: '#169B62',
          orange: '#FF883E',
          white: '#FFFFFF',
        }
      }
    },
  },
  plugins: [],
}
