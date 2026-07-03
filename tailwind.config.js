/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'dx-panel': '#1a1a1c',
        'dx-panel-light': '#2a2a2e',
        'dx-blue': '#3d6ea5',
        'dx-blue-bright': '#5a8fc7',
        'dx-led': '#ff2a1a',
        'dx-lcd': '#8aff9a',
        'dx-lcd-bg': '#0d2010',
      },
      fontFamily: {
        led: ['"DSEG7"', '"Courier New"', 'monospace'],
        lcd: ['"Courier New"', 'monospace'],
        panel: ['"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
