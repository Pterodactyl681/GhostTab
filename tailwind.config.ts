import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./messages/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--background) / <alpha-value>)",
        "background-elevated": "rgb(var(--background-elevated) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-2": "rgb(var(--surface-2) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        secondary: "rgb(var(--secondary) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        "border-strong": "rgb(var(--border-strong) / <alpha-value>)",
        "ghost-cyan": "rgb(var(--ghost-cyan) / <alpha-value>)",
        "violet-smoke": "rgb(var(--violet-smoke) / <alpha-value>)",
        "success-soft": "rgb(var(--success-soft) / <alpha-value>)",
        "warning-soft": "rgb(var(--warning-soft) / <alpha-value>)",
      },
      boxShadow: {
        panel:
          "0 1px 0 rgba(255,255,255,0.03), 0 0 0 1px rgba(180,210,255,0.1), 0 18px 40px rgba(0,0,0,0.35)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      keyframes: {
        mist: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        mist: "mist 720ms ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
