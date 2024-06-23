/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        work: ['"Work Sans"', "sans-serif"],
      },
    },
    colors: {
      primary: {
        100: "#f2ede5",
        200: "#676664",
        300: "#444444",
        400: "#2f2f2f",
        500: "#222222",
        600: "#171715",
      },
    },
  },
  plugins: [],
};
