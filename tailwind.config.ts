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
          red: "#ef233c",
          deep: "#b8001f",
          soft: "#fff1f2"
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
