import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { 950: '#08090b', 900: '#0b0d10', 850: '#0e1114', 800: '#12161a', 750: '#161b20', 700: '#1b2128', 600: '#242c34' },
        lime: { DEFAULT: '#c8f751', 400: '#d6ff6b', 500: '#b6ea3a', 600: '#9bd024' },
        emerald: { DEFAULT: '#2ee6a8', 500: '#2ee6a8' },
        danger: '#ff5b6e',
        siren: '#ffb020',
        muted: '#8a97a6',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        panel: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 20px 60px -20px rgba(0,0,0,0.8)',
        glow: '0 0 0 1px rgba(200,247,81,0.35), 0 8px 30px -8px rgba(200,247,81,0.25)',
      },
      backgroundImage: {
        'grid-faint': 'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
      },
      keyframes: {
        shimmer: { '0%': { backgroundPosition: '-400px 0' }, '100%': { backgroundPosition: '400px 0' } },
        fadeUp: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: { shimmer: 'shimmer 1.6s linear infinite', fadeUp: 'fadeUp .35s ease-out both' },
    },
  },
  plugins: [],
};
export default config;
