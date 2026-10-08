/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        acc: "#1366d6",
        ink: "#14263d",
        line: "#d5e1ee",
        softbg: "#f3f7fb",
        muted: "#566a80",
        danger: "#d93a3a",
        okgreen: "#1f9d55",
      },
      fontFamily: {
        head: ["Outfit", "system-ui", "sans-serif"],
        body: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
}

