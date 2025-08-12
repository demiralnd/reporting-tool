/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'dm-sans': ['DM Sans', 'sans-serif'],
        'poppins': ['Poppins', 'sans-serif'],
        'montserrat': ['Montserrat', 'sans-serif'],
      },
    },
    fontFamily: {
      'sans': ['DM Sans', 'Poppins', 'Montserrat'],
      'serif': ['DM Sans', 'Poppins', 'Montserrat'],
      'mono': ['DM Sans', 'Poppins', 'Montserrat'],
    },
  },
  plugins: [],
}