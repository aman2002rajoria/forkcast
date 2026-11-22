import type { Config } from "tailwindcss";

// Palette replaced wholesale (design.md §22) so default Tailwind blues and greys can't creep in.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    colors: {
      transparent: "transparent", white: "#FFFFFF", current: "currentColor",
      bg: "var(--bg)", card: "var(--card)", surface: "var(--surface)", "surface-2": "var(--surface-2)", line: "var(--line)",
      ink: "var(--ink)", "ink-2": "var(--ink-2)", muted: "var(--muted)", faint: "var(--faint)",
      accent: { 50: "var(--accent-50)", 100: "var(--accent-100)", 200: "var(--accent-200)", 500: "var(--accent-500)", 600: "var(--accent-600)", 700: "var(--accent-text)", 900: "var(--accent-900)" },
      success: { DEFAULT: "var(--success)", text: "var(--success-text)", tint: "var(--success-tint)" },
      warning: { DEFAULT: "var(--warning)", text: "var(--warning-text)", tint: "var(--warning-tint)" },
      danger: { DEFAULT: "var(--danger)", text: "var(--danger-text)", tint: "var(--danger-tint)" },
    },
    borderRadius: { none: "0", s: "12px", m: "20px", l: "28px", xl: "32px", full: "999px" },
    boxShadow: { flat: "var(--shadow-flat)", float: "var(--shadow-float)", lift: "var(--shadow-lift)", none: "none" },
    fontFamily: { sans: ["var(--font)"], mono: ["var(--mono)"] },
    fontWeight: { normal: "400", medium: "500", semibold: "600", extrabold: "800", black: "900" },
    extend: { maxWidth: { app: "1320px", read: "720px" } },
  },
  plugins: [],
};
export default config;
