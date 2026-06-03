import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#ff173f",
          coral: "#ff6a3d",
          orange: "#ff8a1f",
          gold: "#f6c343",
          amber: "#f59e0b",
          navy: "#172554",
          ink: "#111827",
          steel: "#334155",
          line: "#e8e2d9",
          canvas: "#fbfaf7",
          warm: "#f5f1ea",
          surface: "#fffdf8",
          success: "#059669",
          warning: "#d97706"
        },
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
        brand: "0 18px 44px rgba(255, 23, 63, 0.18)",
        commerce: "0 18px 45px rgba(17, 24, 39, 0.08)",
        lift: "0 10px 28px rgba(17, 24, 39, 0.07)"
      },
      borderRadius: {
        "deal-card": "20px",
        "commerce": "24px"
      }
    }
  },
  plugins: []
};

export default config;
