import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Premium Monochrome & Slate system (replacing loud blue)
        dark: {
          950: "#09090b",
          900: "#121215",
          850: "#18181b",
          800: "#27272a",
          700: "#3f3f46",
        },
        accent: {
          black: "#000000",
          charcoal: "#111827",
          slate: "#334155",
          soft: "#f8fafc",
          border: "#e2e8f0",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
