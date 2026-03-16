/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#f5f5f5",
        paper: "#0b0b0b",
        fog: "#d0d0d0",
        mist: "#959595",
        accent: {
          yellow: "#e6ef92",
          orange: "#d7e37c",
          red: "#b9c36d",
          blue: "#ecefb7",
        },
      },
      fontFamily: {
        sans: [
          "Maple",
          "Founders Grotesk",
          "Monotype Grotesque",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
