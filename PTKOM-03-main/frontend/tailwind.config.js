/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Semua warna diambil dari variabel CSS di src/dbd.css, bukan hex statis,
        // supaya utility Tailwind ikut berubah saat html[data-theme="dark"] aktif.
        acc: "var(--dbd-accent)",
        onfill: "var(--dbd-on-fill)",
        ink: "var(--dbd-text)",
        line: "var(--dbd-border)",
        softbg: "var(--dbd-soft)",
        surface: "var(--dbd-surface)",
        muted: "var(--dbd-muted)",
        danger: "var(--dbd-red)",
        okgreen: "var(--dbd-green)",
      },
      fontFamily: {
        head: ["Outfit", "system-ui", "sans-serif"],
        body: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
}

