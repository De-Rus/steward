/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      screens: { wide: '900px' },
      colors: {
        page: 'var(--page)',
        surface: 'var(--surface)',
        surface1: 'var(--surface-1)',
        surface2: 'var(--surface-2)',
        surface3: 'var(--surface-3)',
        hover: 'var(--hover)',
        press: 'var(--press)',
        selected: 'var(--selected)',
        ink: 'var(--ink)',
        sec: 'var(--sec)',
        muted: 'var(--muted)',
        gridline: 'var(--gridline)',
        accent: 'var(--accent)',
        accentbtn: 'var(--accent-btn)',
        good: 'var(--good)',
        warning: 'var(--warning)',
        serious: 'var(--serious)',
        critical: 'var(--critical)',
        neutral: 'var(--sec)',
      },
      boxShadow: {
        pop: 'var(--shadow-pop)',
        menu: 'var(--shadow-menu)',
        modal: 'var(--shadow-modal)',
      },
      borderColor: { DEFAULT: 'var(--border)' },
      borderRadius: { card: '8px', ctl: '6px' },
      fontSize: { xxs: ['11px', '14px'] },
    },
  },
  plugins: [],
}
