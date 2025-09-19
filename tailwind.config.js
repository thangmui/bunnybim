/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-dark': '#0f172a',
        'brand-surface': '#1e293b',
        'brand-muted': '#475569',
        'brand-subtle': '#94a3b8',
        'brand-light': '#f1f5f9',
        'brand-primary': '#3b82f6',
        'brand-primary-hover': '#2563eb',
      },
    },
  },
  plugins: [],
}
