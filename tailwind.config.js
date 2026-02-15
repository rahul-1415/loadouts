/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#f4f5f7",
        paper: "#0b0d12",
        fog: "#c7cbd2",
        mist: "#8d929b",
        accent: {
          yellow: "#e6e8ec",
          orange: "#9ea5af",
          red: "#8d96a3",
          blue: "#a8b1be",
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
