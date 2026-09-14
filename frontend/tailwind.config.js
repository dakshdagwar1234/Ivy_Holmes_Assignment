/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F8F6F1",
        ink: "#0F172A",
        teal: {
          DEFAULT: "#0F766E",
          dark: "#0D5C56",
          light: "#E6F4F1",
          hover: "#115E59",
        },
        ochre: {
          DEFAULT: "#B45309",
          dark: "#92400E",
          light: "#FEF3C7",
        },
        line: "#E2DDD5",
        muted: "#64748B",
        surface: {
          card: "#FFFFFF",
          muted: "#F1EDE4",
        },
      },
      fontFamily: {
        serif: ["Fraunces", "ui-serif", "Georgia", "serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 16px -2px rgba(15, 23, 42, 0.06), 0 1px 4px -1px rgba(15, 23, 42, 0.04)",
        "card-hover": "0 16px 32px -4px rgba(15, 23, 42, 0.12), 0 4px 12px -2px rgba(15, 23, 42, 0.06)",
        glass: "0 8px 32px 0 rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [],
};
