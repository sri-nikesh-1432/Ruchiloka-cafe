import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FBF5E6',
        ivory: '#FEFBF3',
        beige: {
          DEFAULT: '#F1E6D2',
          soft: '#F7F0DF',
          border: '#DECDB6',
          dark: '#CBB497',
        },
        cognac: {
          DEFAULT: '#B46233',
          hover: '#9D5228',
          light: '#E9CDBE',
        },
        coffee: {
          DEFAULT: '#4B2E1E',
          muted: '#755746',
          soft: '#967865',
        },
        'dark-brown': '#24160E',
        'sky-blue': {
          DEFAULT: '#6EA5C2',
          soft: '#E6F0F5',
          deep: '#417691',
        },
        white: '#FFFFFF',
        black: '#14100E',
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      boxShadow: {
        editorial: '0 20px 50px -15px rgba(36, 22, 14, 0.09)',
        card: '0 8px 30px -10px rgba(36, 22, 14, 0.06)',
        modal: '0 30px 80px -20px rgba(20, 16, 14, 0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
