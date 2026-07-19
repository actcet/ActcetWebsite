import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#F1F7FA",
        "bg-alt": "#E4EFF4",
        surface: "#FFFFFF",
        navy: {
          DEFAULT: "#0A192F",
          2: "#112240",
        },
        primary: {
          DEFAULT: "#2596be",
          dark: "#1b7699",
          light: "#5db8d9",
        },
        mint: {
          DEFAULT: "#3fd8b8",
          bright: "#64FFDA",
        },
        ink: {
          DEFAULT: "#152435",
          soft: "#516779",
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
