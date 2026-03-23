import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand:      'var(--brand)',
        'brand-dk': 'var(--brand-dk)',
        'brand-lt': 'var(--brand-lt)',
        accent:     'var(--accent)',
        'accent-lt':'var(--accent-lt)',
        'bg-subtle':'var(--bg-subtle)',
        'bg-muted': 'var(--bg-muted)',
        'border-c': 'var(--border)',
        'border-dk':'var(--border-dk)',
        'text-c':   'var(--text)',
        'text-muted-c':'var(--text-muted)',
        'text-xmuted':'var(--text-xmuted)',
        success:    'var(--success)',
        'success-lt':'var(--success-lt)',
        warn:       'var(--warn)',
        'warn-lt':  'var(--warn-lt)',
        err:        'var(--err)',
        'err-lt':   'var(--err-lt)',
      },
      width: {
        sidebar: 'var(--sidebar-w)',
        'right-panel': 'var(--right-panel-w)',
      },
      height: {
        topbar: 'var(--topbar-h)',
      },
      spacing: {
        topbar: 'var(--topbar-h)',
        sidebar: 'var(--sidebar-w)',
      },
    },
  },
  plugins: [],
};

export default config;
