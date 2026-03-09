/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body: ['"Source Serif 4"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        obsidian: {
          950: '#080a0e',
          900: '#0d1117',
          800: '#141921',
          700: '#1c2433',
          600: '#243047',
        },
        ember: {
          300: '#fcd5a0',
          400: '#f9b96a',
          500: '#f59e3a',
          600: '#e07c1a',
        },
        sage:    { 400: '#8bb8a4', 500: '#6a9e8c' },
        lavender: { 400: '#a89ec8', 500: '#8b7eb8' },
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease-out',
        'slide-up':   'slideUp 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(245,158,58,0.3)' },
          '50%':      { boxShadow: '0 0 24px rgba(245,158,58,0.6)' },
        },
      },
      backgroundImage: {
        'ember-glow':    'radial-gradient(ellipse at 50% 100%, rgba(245,158,58,0.12) 0%, transparent 70%)',
        'obsidian-mesh': 'radial-gradient(ellipse at 20% 20%, rgba(168,158,200,0.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(245,158,58,0.06) 0%, transparent 50%)',
      },
    },
  },
  plugins: [],
}