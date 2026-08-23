import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#070d1f",
        "bg-alt": "#0b1530",
        surface: "#111d3b",
        navy: {
          DEFAULT: "#0A192F",
          2: "#112240",
        },
        primary: {
          DEFAULT: "#1336d4",
          dark: "#0d2597",
          light: "#4d6cf0",
        },
        mint: {
          DEFAULT: "#4b8dff",
          bright: "#8ca8ff",
        },
        ink: {
          DEFAULT: "#edf2ff",
          soft: "#b5c2e0",
        },
      },
      fontFamily: {
        display: ["Outfit", "sans-serif"],
        body: ["Inter", "sans-serif"],
        label: ["Poppins", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 30px -10px rgba(10,25,47,0.15)",
        "soft-lg": "0 24px 45px -15px rgba(10,25,47,0.22)",
      },
      borderRadius: {
        xl2: "20px",
      },
      keyframes: {
        twinkle: {
          "0%, 100%": { opacity: "0.35" },
          "50%": { opacity: "0.8" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-18px)" },
        },
      },
      animation: {
        twinkle: "twinkle 6s ease-in-out infinite",
        float: "float 8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
