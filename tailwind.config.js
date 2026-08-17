export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Landing page only. The cockpit's own font is set on body, so
        // mapping `sans` here would silently restyle every screen.
        landing: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          haze: '#DCEEFA',
          sky: '#8CC7EC',
          azure: '#5AA5DA',
          blue: '#2F7CB8',
          deep: '#164E7C',
          ink: '#0E1A24',
          cream: '#F5F8FB',
          mist: '#E7EFF6',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      keyframes: {
        drift: {
          '0%, 100%': { transform: 'translate3d(0,0,0)' },
          '50%': { transform: 'translate3d(3%, -4%, 0)' },
        },
      },
      animation: {
        drift: 'drift 26s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};