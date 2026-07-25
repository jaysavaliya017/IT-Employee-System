/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary = Midnight Navy -> Sky Blue enterprise ramp.
        // 900 (#1E3A8A) is the brand navy; 500 (#3B82F6) is the sky accent.
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        // Navy scale used by the sidebar / dark surfaces.
        navy: {
          50: '#f1f5f9',
          100: '#e2e8f0',
          200: '#cbd5e1',
          300: '#94a3b8',
          400: '#64748b',
          500: '#475569',
          600: '#334155',
          700: '#1e293b',
          800: '#152238',
          900: '#0f1b30',
          950: '#0a1120',
        },
        accent: {
          50: '#eff6ff',
          100: '#dbeafe',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI Variable', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 27 48 / 0.04), 0 1px 3px 0 rgb(15 27 48 / 0.06)',
        'card-hover': '0 4px 12px -2px rgb(15 27 48 / 0.10), 0 2px 6px -2px rgb(15 27 48 / 0.06)',
        dropdown: '0 10px 30px -5px rgb(15 27 48 / 0.15)',
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
}
