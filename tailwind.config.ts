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
          primary: "#ff2b2b",
          primaryDeep: "#e9162d",
          primarySoft: "#fff1f1",
          coral: "#ff6a4a",
          orange: "#ff8a1f",
          gold: "#f7c948",
          amber: "#f59e0b",
          navy: "#121b35",
          navySoft: "#eaf0ff",
          ink: "#111827",
          steel: "#334155",
          muted: "#64748b",
          line: "#e8e2d9",
          canvas: "#fbfaf7",
          warm: "#f6f1e8",
          surface: "#fffdf8",
          elevated: "#ffffff",
          success: "#059669",
          successSoft: "#ecfdf5",
          warning: "#d97706",
          warningSoft: "#fff7ed"
        },
        dossa: {
          red: "#ff2b2b",
          bright: "#ff4d4f",
          deep: "#e9162d",
          ink: "#9f1239",
          soft: "#fff1f1",
          tint: "#ffe4e4"
        }
      },
      boxShadow: {
        deal: "0 10px 26px rgba(18, 27, 53, 0.07)",
        brand: "0 18px 44px rgba(255, 43, 43, 0.16)",
        commerce: "0 18px 45px rgba(18, 27, 53, 0.09)",
        lift: "0 8px 22px rgba(18, 27, 53, 0.07)",
        focus: "0 0 0 4px rgba(255, 106, 74, 0.16)"
      },
      borderRadius: {
        "deal-card": "16px",
        "commerce": "24px"
      }
    }
  },
  plugins: []
};

export default config;
