/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        // Added for the Documents page editorial pass only — nothing existing
        // uses font-serif/font-mono today, so this is purely additive.
        serif: ['"Libre Caslon Text"', 'Georgia', 'serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Semantic tokens — driven by CSS variables in index.css (:root / .dark).
        // Components should reach for these (bg-surface, border-border, text-ink)
        // instead of hardcoding gray/slate + dark: pairs.
        bg: 'rgb(var(--color-bg) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--color-surface-2) / <alpha-value>)',
        'surface-hover': 'rgb(var(--color-surface-hover) / <alpha-value>)',
        'surface-active': 'rgb(var(--color-surface-active) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        'border-strong': 'rgb(var(--color-border-strong) / <alpha-value>)',
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        'ink-muted': 'rgb(var(--color-ink-muted) / <alpha-value>)',
        overlay: 'rgb(var(--color-overlay) / <alpha-value>)',

        // Semantic status scales — each follows the same solid / subtle /
        // subtle-ink shape, so a component never invents its own tint math.
        // bg-danger-subtle/50 etc. works out of the box since these resolve
        // through <alpha-value>, same as every other semantic token.
        danger: 'rgb(var(--color-danger) / <alpha-value>)',
        'danger-subtle': 'rgb(var(--color-danger-subtle) / <alpha-value>)',
        'danger-subtle-ink': 'rgb(var(--color-danger-subtle-ink) / <alpha-value>)',

        success: 'rgb(var(--color-success) / <alpha-value>)',
        'success-subtle': 'rgb(var(--color-success-subtle) / <alpha-value>)',
        'success-subtle-ink': 'rgb(var(--color-success-subtle-ink) / <alpha-value>)',

        warning: 'rgb(var(--color-warning) / <alpha-value>)',
        'warning-subtle': 'rgb(var(--color-warning-subtle) / <alpha-value>)',
        'warning-subtle-ink': 'rgb(var(--color-warning-subtle-ink) / <alpha-value>)',

        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        // Deep navy accent used for tinted nested rows/panels (dark mode "inner card" look)
        navy: {
          400: '#3457D5',
          500: '#1E3A8A',
          600: '#152B63',
          700: '#101F49',
          800: '#0B1739',
          900: '#080F26',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        }
      },
      borderRadius: {
        // Overriding the DEFAULT Tailwind scale values (not adding new keys)
        // so every existing rounded-2xl / rounded-3xl / rounded-4xl usage
        // across Card, panels, and page sections gets the softer, more
        // generous corner from the reference UIs automatically — nothing in
        // Dashboard.js / WorkspacePage.js / LandingPage.js needs to change.
        '2xl': '1.25rem',  /* was 1rem  — primary card radius */
        '3xl': '1.75rem',  /* was 1.5rem — larger hero/panel radius */
        '4xl': '2.25rem',  /* was 2rem  — reserved for large decorative wrappers */
      },
      boxShadow: {
        'xs': '0 1px 2px rgba(16, 24, 40, 0.04), 0 1px 3px rgba(16, 24, 40, 0.06)',
        // Re-tinted toward --color-ink (slate) instead of flat black, and
        // widened/softened the blur — this is the "cards feel lifted, not
        // outlined" quality in the references. Same token name (`shadow-soft`),
        // so anything already using it (or switched to it, see .card below)
        // updates automatically.
        'soft': '0 4px 24px -4px rgba(15, 23, 42, 0.08), 0 12px 28px -6px rgba(15, 23, 42, 0.05)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'large': '0 10px 40px -10px rgba(0, 0, 0, 0.15)',
        'panel': '0 1px 2px rgba(0, 0, 0, 0.04), 0 12px 32px -12px rgba(15, 23, 42, 0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}