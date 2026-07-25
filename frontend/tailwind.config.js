/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#FAF6F0",
        surface: "#FFFEFB",
        primary: {
          DEFAULT: "#B8916A",
          hover: "#9C7850",
        },
        textPrimary: "#2B2420",
        textSecondary: "#8A7B6C",
        border: "#E8E1D8",
        success: "#5B8C5A",
        danger: "#B5533C",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "8px",
        lg: "12px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(43, 36, 32, 0.06), 0 1px 2px rgba(43, 36, 32, 0.04)",
        cardHover: "0 8px 24px rgba(43, 36, 32, 0.10)",
      },
    },
  },
  plugins: [],
}
