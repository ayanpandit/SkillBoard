/** @type {import('tailwindcss').Config} */
export default {
  content: ['index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'pompiere': ['Pompiere', 'cursive'],
        'varela': ['Varela Round', 'sans-serif'],
        'sans': ['Varela Round', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

