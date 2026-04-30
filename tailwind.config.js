/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Legacy palette (kept for any residual references)
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
        },
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
        },
        danger: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
        },

        // Claude (Anthropic) design system
        parchment: '#f5f4ed',
        ivory: '#faf9f5',
        nearblack: '#141413',
        olive: '#5e5d59',
        stone: '#696860',
        warmSilver: '#b0aea5',
        charcoal: '#4d4c48',
        darkwarm: '#3d3d3a',
        terracotta: {
          DEFAULT: '#c96442',
          light: '#fdf0eb',
          hover: '#d97757',
        },
        coral: '#d97757',
        focusBlue: '#3898ec',
        warmRed: '#b53333',
        warmRedLight: '#fdf0f0',
        warmGreen: '#4a7c42',
        warmGreenLight: '#f0f5ee',
        warmAmber: '#a17e2a',
        warmAmberLight: '#fdf6e8',
        borderCream: '#f0eee6',
        borderWarm: '#e8e6dc',
        borderDark: '#30302e',
        warmSand: '#e8e6dc',
        ringWarm: '#d1cfc5',
        darkSurface: '#30302e',
        deepDark: '#141413',
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
        sans: ['system-ui', 'Inter', 'Arial', 'sans-serif'],
        mono: ['Menlo', 'Consolas', '"Courier New"', 'monospace'],
      },
      boxShadow: {
        'ring-warm': '0px 0px 0px 1px #d1cfc5',
        'ring-cream': '0px 0px 0px 1px #f0eee6',
        'ring-terracotta': '0px 0px 0px 1px #c96442',
        'ring-focus': '0px 0px 0px 1px #3898ec',
        'whisper': 'rgba(0,0,0,0.05) 0px 4px 24px',
        'ring-deep': '0px 0px 0px 1px #c2c0b6',
      },
      lineHeight: {
        relaxed: '1.60',
      },
      letterSpacing: {
        label: '0.12px',
      },
    },
  },
  plugins: [],
}
