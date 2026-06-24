import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff9ff",
          100: "#def1ff",
          200: "#b6e5ff",
          300: "#75d2ff",
          400: "#2cbcff",
          500: "#02a2f0",
          600: "#0081ce",
          700: "#0066a6",
          800: "#055789",
          900: "#0a4871",
        },
        sun: {
          400: "#ffb524",
          500: "#ff9d00",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
