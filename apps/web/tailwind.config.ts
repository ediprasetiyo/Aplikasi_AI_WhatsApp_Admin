import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        brand: {
          DEFAULT: '#25D366', // WhatsApp green
          dark: '#128C7E',
        },
      },
    },
  },
  plugins: [],
};
export default config;
