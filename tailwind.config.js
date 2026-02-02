/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1b1d26",
        paper: "#d7d7d7",
        fog: "#c7c7c7",
        mist: "#8c8c8c",
        accent: {
          yellow: "#fbfdb2",
          orange: "#e4b851",
          red: "#dc5946",
          blue: "#9ab6c2",
        },
      },
      fontFamily: {
        sans: ["var(--font-sora)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
