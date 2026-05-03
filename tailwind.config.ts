import type { Config } from "tailwindcss";

/**
 * Network Nerd brand theme.
 *
 * Brand colors (from logo):
 *   cream      #F5EFE0   page background
 *   teal       #4FB8B5   primary (matches the "NERD" wordmark)
 *   deep-teal  #2E7E80   primary-hover / accent
 *   orange     #F39237   secondary highlight
 *   red        #E94B35   destructive / errors
 *   ink        #1A1A1A   text
 *
 * shadcn/ui-style CSS variables are defined in globals.css. Tailwind utilities
 * resolve `bg-primary`, `text-foreground`, etc. through those variables, so the
 * design system can be retuned in one place.
 */
const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}",
  ],
  darkMode: ["class"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        // Raw brand swatches — use these only when you genuinely want the named
        // brand color (e.g., the logo, a brand-specific callout). For most UI,
        // use the semantic tokens (primary, foreground, etc.) below.
        brand: {
          cream: "#F5EFE0",
          teal: "#4FB8B5",
          "deep-teal": "#2E7E80",
          orange: "#F39237",
          red: "#E94B35",
          ink: "#1A1A1A",
        },

        // shadcn-style semantic tokens, sourced from CSS variables.
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "system-ui", "sans-serif"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
