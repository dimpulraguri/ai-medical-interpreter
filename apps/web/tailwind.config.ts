import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff8ff",
          100: "#dbeefe",
          200: "#bfe1fe",
          300: "#93cefd",
          400: "#60b3fb",
          500: "#3b93f5",
          600: "#2576ea",
          700: "#1f5dd0",
          800: "#214eaa",
          900: "#204286"
        }
      }
    }
  },
  plugins: []
};

export default config;

