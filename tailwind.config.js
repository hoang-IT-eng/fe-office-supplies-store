/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // ===== Interlock Systems palette (DESIGN.MD) =====
        primary: {
          DEFAULT: '#005ab4',
          container: '#0a73e0',
          fixed: '#d6e3ff',
          'fixed-dim': '#aac7ff',
        },
        'on-primary': '#ffffff',
        'on-primary-container': '#fefcff',

        secondary: {
          DEFAULT: '#465f88',
          container: '#b6d0ff',
        },
        'on-secondary': '#ffffff',
        'on-secondary-container': '#3f5881',

        tertiary: {
          DEFAULT: '#964400',
          container: '#bd5700',
          fixed: '#ffdbc9',
          'fixed-dim': '#ffb68c',
        },
        'on-tertiary': '#ffffff',
        'on-tertiary-container': '#fffbff',
        'on-tertiary-fixed': '#321200',

        error: {
          DEFAULT: '#ba1a1a',
          container: '#ffdad6',
        },
        'on-error': '#ffffff',
        'on-error-container': '#93000a',

        success: '#16a34a',

        surface: {
          DEFAULT: '#f9f9ff',
          dim: '#d7dae3',
          bright: '#f9f9ff',
          variant: '#e0e2eb',
          'container-lowest': '#ffffff',
          'container-low': '#f1f3fc',
          container: '#ebedf7',
          'container-high': '#e6e8f1',
          'container-highest': '#e0e2eb',
        },
        'on-surface': '#181c22',
        'on-surface-variant': '#414753',

        outline: {
          DEFAULT: '#717785',
          variant: '#c1c6d5',
        },
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
      },
      boxShadow: {
        soft: '0 2px 8px -2px rgba(0, 90, 180, 0.08), 0 1px 3px -1px rgba(0, 90, 180, 0.04)',
        elevated: '0 8px 24px -8px rgba(0, 90, 180, 0.18), 0 2px 6px -2px rgba(0, 90, 180, 0.08)',
      },
    },
  },
  plugins: [],
};
