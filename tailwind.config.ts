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
        // ── Paleta Lovable — verde (identidade aprovada) ──────────────────
        base:        "#F5F3EF",   // fundo geral quente
        surface:     "#FAF8F4",   // tabela headers, superfícies
        elevated:    "#EFEDE7",   // fundos sutis, hover, chips

        // Primária verde
        primary: {
          DEFAULT:    "#1F7A4D",
          hover:      "#1A6A43",
          foreground: "#FFFFFF",
        },

        // Sidebar preta
        "sidebar-bg": "#1C1C1C",

        // Areia / bege clínica
        sand:        "#E8E0D0",
        "sand-fg":   "#3A352B",

        // Texto
        foreground:  "#1C1C1C",
        muted:       "#6B6B66",   // texto secundário

        // ── Aliases legados — redireciona para paleta verde ───────────────
        offwhite:    "#1C1C1C",                      // era text claro; agora texto escuro
        gold:        "#1F7A4D",                      // acento → verde
        champagne:   "#E8E0D0",                      // → areia
        "brand-purple":       "#1F7A4D",
        "brand-purple-light": "#27A262",
        "brand-purple-dim":   "rgba(31,122,77,0.15)",
        "sidebar-dark":       "#1C1C1C",

        // Estados semânticos
        success:     "#1F7A4D",
        warning:     "#C98A1E",
        error:       "#C0392B",
        info:        "#2D6AA3",

        // ── Tokens shadcn (vars em globals.css, suportam /opacity) ────────
        background:      "rgb(var(--background) / <alpha-value>)",
        card: {
          DEFAULT:     "rgb(var(--card) / <alpha-value>)",
          foreground:  "rgb(var(--card-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT:     "rgb(var(--popover) / <alpha-value>)",
          foreground:  "rgb(var(--popover-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT:     "rgb(var(--secondary) / <alpha-value>)",
          foreground:  "rgb(var(--secondary-foreground) / <alpha-value>)",
        },
        "muted-shad": {
          DEFAULT:     "rgb(var(--muted-shad) / <alpha-value>)",
          foreground:  "rgb(var(--muted-foreground) / <alpha-value>)",
        },
        "muted-foreground": "rgb(var(--muted-foreground) / <alpha-value>)",
        accent: {
          DEFAULT:     "rgb(var(--accent) / <alpha-value>)",
          foreground:  "rgb(var(--accent-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT:     "rgb(var(--destructive) / <alpha-value>)",
          foreground:  "rgb(var(--destructive-foreground) / <alpha-value>)",
        },
        border:  "rgba(0,0,0,0.08)",
        input:   "rgba(0,0,0,0.12)",
        ring:    "#1F7A4D",
      },
      fontFamily: {
        serif: ["var(--font-display)", "Georgia", "serif"],
        sans:  ["var(--font-body)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card:  "14px",
        modal: "16px",
        full:  "9999px",
        lg:    "10px",
        md:    "8px",
        sm:    "6px",
      },
      boxShadow: {
        card:  "0 1px 2px rgba(0,0,0,0.04)",
        soft:  "0 4px 12px rgba(0,0,0,0.06)",
        focus: "0 0 0 3px rgba(31,122,77,0.15)",
      },
      borderColor: {
        DEFAULT: "rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
