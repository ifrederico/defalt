import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import boundaries from 'eslint-plugin-boundaries'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'ghost-source-code/**']),
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    files: ['defalt-*/**/*.{ts,tsx}'],
    plugins: {
      boundaries,
    },
    settings: {
      'boundaries/elements': [
        { type: 'utils', pattern: 'defalt-utils/**' },
        { type: 'sections', pattern: 'defalt-sections/**' },
        { type: 'ui', pattern: 'defalt-ui/**' },
        { type: 'rendering', pattern: 'defalt-rendering/**' },
        { type: 'app', pattern: 'defalt-app/**' },
      ],
    },
    rules: {
      'boundaries/element-types': ['error', {
        default: 'allow',
        rules: [
          { from: 'utils', disallow: ['sections', 'ui', 'rendering', 'app'] },
          { from: 'sections', disallow: ['ui', 'rendering', 'app'] },
          { from: 'ui', disallow: ['sections', 'rendering', 'app'] },
          { from: 'rendering', disallow: ['ui', 'app'] },
        ],
      }],
    },
  },
])
