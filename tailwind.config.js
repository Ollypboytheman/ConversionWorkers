/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        /* Brand */
        cw: {
          green: "#3CCF91",       // primary CTA / actions
          greenDark: "#1F9D55",   // hover / emphasis
          greenSoft: "rgba(60,207,145,0.15)",
        },

        /* Backgrounds */
        bg: {
          main: "#05060A",        // page background
          panel: "#0B1020",       // cards / panels
          card: "#111827",        // inner cards
        },

        /* Borders & lines */
        border: {
          subtle: "rgba(255,255,255,0.08)",
          strong: "rgba(255,255,255,0.16)",
        },

        /* Text */
        text: {
          primary: "rgba(255,255,255,0.92)",
          secondary: "rgba(255,255,255,0.70)",
          muted: "rgba(255,255,255,0.55)",
        },

        /* Status (experiments lifecycle) */
        status: {
          build: "#64748B",       // slate
          qa: "#F59E0B",          // amber
          live: "#22C55E",        // green
          completed: "#6366F1",  // indigo
        },
      },

      borderRadius: {
        lg: "16px",
        xl: "20px",
      },

      boxShadow: {
        panel: "0 20px 60px rgba(0,0,0,0.45)",
        glow: "0 0 0 1px rgba(60,207,145,0.35)",
      },

      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
