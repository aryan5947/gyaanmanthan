/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#4F46E5", // Indigo-600
        secondary: "#06B6D4", // Cyan-500
        accent: "#F59E0B", // Amber-500
        dark: "#1F2937", // Gray-800
        light: "#F3F4F6", // Gray-100
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
        heading: ["Poppins", "ui-sans-serif", "system-ui"],
      },
      animation: {
        slideDown: "slideDown 0.3s ease-out",
        fadeIn: "fadeIn 0.5s ease-in-out",
        bounceSlow: "bounce 2s infinite",
      },
      keyframes: {
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-40px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      screens: {
        xs: "480px", // extra small devices
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/aspect-ratio"),
  ],
};
