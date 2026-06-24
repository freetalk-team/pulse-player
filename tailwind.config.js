
import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{svelte,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'pulse-accent': '#1db954',
        'pulse-bg': '#121212',
        'pulse-black': '#000000',
        'pulse-main': '#181818',
        'pulse-border': '#282828',
        'pulse-nav': '#3c3c3c',
      },
      boxShadow: {
        // Custom shadow for the nav or sidebar
        'nav-glow': '0 4px 20px rgba(0, 0, 0, 0.5)',
        'accent-glow': '0 0 15px rgba(29, 185, 84, 0.3)',
      }
    },
  },
  plugins: [
    typography
  ],
}
