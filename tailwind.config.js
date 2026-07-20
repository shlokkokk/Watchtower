/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#080b11',
          card: '#0f172a',
          panel: '#131c31',
          border: '#1e293b',
          accent: '#00f0ff',
          neonGreen: '#10b981',
          neonPurple: '#a855f7',
          neonAmber: '#f59e0b',
          neonRed: '#ef4444',
          muted: '#64748b',
          text: '#f8fafc',
        }
      },
      boxShadow: {
        'neon-cyan': '0 0 15px rgba(0, 240, 255, 0.25), 0 0 30px rgba(0, 240, 255, 0.1)',
        'neon-green': '0 0 15px rgba(16, 185, 129, 0.25)',
        'neon-amber': '0 0 15px rgba(245, 158, 11, 0.25)',
        'neon-red': '0 0 15px rgba(239, 68, 68, 0.25)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'Fira Code', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
