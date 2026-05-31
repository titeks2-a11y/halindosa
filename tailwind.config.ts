import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        dossa: {
          red: "#ff173f",
          bright: "#ff2a4f",
          deep: "#e0002a",
          ink: "#8f001b",
          soft: "#fff1f4",
          tint: "#ffe4ea"
        }
      },
      boxShadow: {
        deal: "0 14px 34px rgba(15, 23, 42, 0.08)",
        brand: "0 18px 44px rgba(255, 23, 63, 0.18)"
      }
    }
  },
  plugins: []
};

export default config;
