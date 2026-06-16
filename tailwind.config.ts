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
        /* ===== NOVO DESIGN SYSTEM — TOKENS CLARO ===== */
        
        /* Fundos */
        "bg-base": "var(--color-bg-base)",
        "bg-surface": "var(--color-bg-surface)",
        "bg-muted": "var(--color-bg-muted)",
        "bg-sidebar": "var(--color-bg-sidebar)",

        /* Acento (roxo) */
        "accent-primary": "var(--color-accent)",
        "accent-hover": "var(--color-accent-hover)",
        "accent-soft": "var(--color-accent-soft)",
        "accent-text": "var(--color-accent-text)",

        /* Card Hero */
        "card-hero-bg": "var(--color-card-hero-bg)",
        "card-hero-text": "var(--color-card-hero-text)",

        /* Texto */
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        "text-muted": "var(--color-text-muted)",
        "text-sidebar": "var(--color-text-on-sidebar)",

        /* Estados */
        "success": "var(--color-success)",
        "success-soft": "var(--color-success-soft)",
        "warning": "var(--color-warning)",
        "warning-soft": "var(--color-warning-soft)",
        "error": "var(--color-error)",
        "error-soft": "var(--color-error-soft)",
        "info": "var(--color-info)",
        "info-soft": "var(--color-info-soft)",

        /* ===== COMPATIBILIDADE SHADCN (RGB vars mapeados) ===== */
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
        card: "var(--radius-md)",
        modal: "var(--radius-lg)",
        lg: "var(--radius-lg)",
        md: "var(--radius-md)",
        sm: "var(--radius-sm)",
      },
      borderColor: {
        DEFAULT: "var(--color-border)",
      },
    },
  },
  plugins: [],
};

export default config;
