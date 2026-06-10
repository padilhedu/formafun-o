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
        base: "#0A0A0B",
        surface: "#121214",
        elevated: "#1A1A1E",
        gold: "#B89A5A",
        champagne: "#D9C9A3",
        offwhite: "#F5F2EA",
        // sidebar Capim
        "sidebar-dark": "#42414B",
        "brand-purple": "#59399E",
        "brand-purple-light": "#7B5DC0",
        "brand-purple-dim": "rgba(89,57,158,0.15)",
        // "muted" do app (texto cinza) — manter; o token shadcn equivalente é "muted-shad"
        muted: "#8A8A93",
        success: "#4ADE80",
        warning: "#FBBF24",
        error: "#F87171",
        info: "#60A5FA",

        // ===== Tokens shadcn (vars em globals.css, suportam /opacity) =====
        border: "rgb(var(--border-shad) / <alpha-value>)",
        input: "rgb(var(--input) / <alpha-value>)",
        ring: "rgb(var(--ring) / <alpha-value>)",
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          foreground: "rgb(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "rgb(var(--secondary) / <alpha-value>)",
          foreground: "rgb(var(--secondary-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "rgb(var(--destructive) / <alpha-value>)",
          foreground: "rgb(var(--destructive-foreground) / <alpha-value>)",
        },
        "muted-shad": {
          DEFAULT: "rgb(var(--muted-shad) / <alpha-value>)",
          foreground: "rgb(var(--muted-foreground) / <alpha-value>)",
        },
        "muted-foreground": "rgb(var(--muted-foreground) / <alpha-value>)",
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          foreground: "rgb(var(--accent-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "rgb(var(--popover) / <alpha-value>)",
          foreground: "rgb(var(--popover-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "rgb(var(--card) / <alpha-value>)",
          foreground: "rgb(var(--card-foreground) / <alpha-value>)",
        },
      },
      fontFamily: {
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
        sans: ["var(--font-montserrat)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
        modal: "16px",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      borderColor: {
        DEFAULT: "rgba(255,255,255,0.07)",
      },
    },
  },
  plugins: [],
};

export default config;
