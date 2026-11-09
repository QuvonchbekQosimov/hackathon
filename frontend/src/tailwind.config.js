/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "bais-blue": "#2563eb", // Asosiy ko'k
        "bais-cyan": "#22d3ee", // Neon havorang
        "bais-dark": "#0b1121", // Tungi rejim foni
      },
    },
  },
  plugins: [],
};
