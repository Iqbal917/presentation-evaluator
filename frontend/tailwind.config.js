/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class", // 👈 this is what makes your toggle work
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // 👈 all React/Vite files
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
