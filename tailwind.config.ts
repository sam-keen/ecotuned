import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
        display: ['var(--font-outfit)', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Simple, fresh color system
        eco: {
          // Neutral base
          black: '#1A1A1A',
          white: '#FAFAFA',
          cream: '#FAF7F2',
          border: '#D4D8DD',

          // Fresh accent colors - use sparingly
          mint: '#B8E6D5', // Fresh light green
          sage: '#A8C9A1', // Soft sage green
          lemon: '#FFF4B3', // Soft yellow
          sky: '#B3D9E8', // Sky blue
          azure: '#A8D5E2', // Light azure

          // Warm weather palette - sympathetic but distinct
          coral: '#FF9B8A', // Vibrant coral
          peach: '#FFC491', // Vibrant peach
          sunset: '#FFA366', // Vibrant sunset orange
          rose: '#FFA3C7', // Vibrant rose pink
        },
      },
      backgroundImage: {
        'gradient-neutral': 'linear-gradient(135deg, #FAFAFA 0%, #F5F5F5 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        float: 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
