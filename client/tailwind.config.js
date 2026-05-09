/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        parking: {
          free: "#10B981",
          locked: "#F59E0B",
          reserved: "#EF4444",
          maintenance: "#6B7280",
          ink: "#111827",
          panel: "#1F2937",
        },
      },
      boxShadow: {
        soft: "0 18px 55px rgba(15, 23, 42, 0.14)",
      },
    },
  },
  plugins: [],
};
