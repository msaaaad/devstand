/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts,js}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        display: ['"Syne"', 'sans-serif'],
      },
      colors: {
        surface: { DEFAULT: '#0D1117', raised: '#161B22', overlay: '#1C2128', border: '#30363D' },
        accent: { DEFAULT: '#6366f1', hover: '#4f46e5', muted: 'rgba(99,102,241,0.15)' },
        tx: { primary: '#E6EDF3', secondary: '#8B949E', muted: '#484F58' },
        stage: { backlog: '#484F58', todo: '#3b82f6', doing: '#f59e0b', done: '#22c55e', deployed: '#6366f1' },
        role: { manager: '#ec4899', team_lead: '#f97316', employee: '#6366f1' },
      },
    },
  },
  plugins: [],
}
