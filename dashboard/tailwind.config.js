/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./defalt-app/**/*.{js,ts,jsx,tsx}",
    "./defalt-ui/**/*.{js,ts,jsx,tsx}",
    "./defalt-sections/**/*.{js,ts,jsx,tsx}",
    "./defalt-rendering/**/*.{js,ts,jsx,tsx}",
    "./defalt-utils/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* Semantic text colors - use with text-* */
        foreground: 'var(--color-foreground)',
        secondary: 'var(--color-secondary)',
        muted: 'var(--color-muted)',
        placeholder: 'var(--color-placeholder)',

        /* Semantic background colors - use with bg-* */
        surface: 'var(--color-surface)',
        subtle: 'var(--color-subtle)',
        hover: 'var(--color-hover)',
        inverse: 'var(--color-inverse)',
        'inverse-subtle': 'var(--color-inverse-subtle)',

        /* Semantic border colors - use with border-* */
        border: 'var(--color-border)',
        'border-strong': 'var(--color-border-strong)',

        /* Focus ring */
        ring: 'var(--color-ring)',

        /* Status colors */
        error: {
          DEFAULT: 'var(--color-error)',
          light: 'var(--color-error-light)',
          border: 'var(--color-error-border)',
        },
        success: {
          DEFAULT: 'var(--color-success)',
          light: 'var(--color-success-light)',
          border: 'var(--color-success-border)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          light: 'var(--color-warning-light)',
        },
        info: {
          DEFAULT: 'var(--color-info)',
          light: 'var(--color-info-light)',
          border: 'var(--color-info-border)',
        },

        /* Brand colors */
        primary: {
          DEFAULT: 'var(--defalt-primary)',
          hover: 'var(--defalt-primary-hover)',
        },
        accent: 'var(--defalt-font-accent)',
        'accent-bg': 'var(--defalt-font-background)',
        highlight: 'var(--defalt-highlight)',
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'avenir next',
          'avenir',
          'helvetica neue',
          'helvetica',
          'ubuntu',
          'roboto',
          'noto',
          'segoe ui',
          'arial',
          'sans-serif',
        ],
      },
      fontSize: {
        base: ['14px', '21px'],
        md: ['14px', '21px'],
      },
      ringColor: {
        ring: 'var(--color-ring)',
      },
      ringOffsetColor: {
        surface: 'var(--color-surface)',
      },
    },
  },
  plugins: [],
}
