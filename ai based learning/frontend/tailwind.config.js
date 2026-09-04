/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          blue: '#1e3a8a',      // Deep Official Blue
          navy: '#0f172a',      // Dark Slate/Navy
          teal: '#0d9488',      // Intelligence Teal
          light: '#f8fafc',     // Clean Background
          accent: '#2563eb',    // Interactive Accent
          border: '#e2e8f0',    // Subtle Borders
          gold: '#d97706',      // Emblem/Highlight Gold
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
