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
          red: "#ff1f2d",
          deep: "#d90416",
          soft: "#fff0f1"
        }
      },
      boxShadow: {
        deal: "0 14px 34px rgba(15, 23, 42, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
