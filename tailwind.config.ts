import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { 950: 'rgb(var(--ink-950) / <alpha-value>)', 900: 'rgb(var(--ink-900) / <alpha-value>)', 850: 'rgb(var(--ink-850) / <alpha-value>)', 800: 'rgb(var(--ink-800) / <alpha-value>)', 750: 'rgb(var(--ink-750) / <alpha-value>)', 700: 'rgb(var(--ink-700) / <alpha-value>)', 600: 'rgb(var(--ink-600) / <alpha-value>)' },
        white: 'rgb(var(--theme-white) / <alpha-value>)',
        black: 'rgb(var(--theme-black) / <alpha-value>)',
        // Obsidian & champagne-gold identity: the `lime` token names are kept for
        // compatibility, but every value is now champagne gold. `gold` is the semantic alias.
        lime: { DEFAULT: '#dfc088', 400: '#ecd4a2', 500: '#cfa95f', 600: '#b8924a' },
        gold: { DEFAULT: '#dfc088', 300: '#ecd4a2', 400: '#dfc088', 500: '#cfa95f', 600: '#b8924a' },
        emerald: { DEFAULT: '#2ee6a8', 500: '#2ee6a8' },
        danger: '#ff5b6e',
        siren: '#ffb020',
        muted: 'rgb(var(--muted-rgb) / <alpha-value>)',
        sky: { DEFAULT: '#60a5fa', 400: '#60a5fa', 300: '#93c5fd' },
      },
      transitionTimingFunction: {
        premium: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        display: ['var(--font-display)', 'Georgia', 'Times New Roman', 'serif'],
      },
      maxWidth: {
        '8xl': '90rem',
      },
      boxShadow: {
        panel: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 20px 60px -20px rgba(0,0,0,0.8)',
        glow: '0 0 0 1px rgba(223,192,136,0.35), 0 8px 30px -8px rgba(223,192,136,0.25)',
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
