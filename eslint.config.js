import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'src/generated/**',
      'playwright-report/**',
      'test-results/**',
      'src/components/ui/**',
      'src/hooks/use-mobile.ts',
      'functions/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      // --- Banned patterns (errors) ---

      // Discourage specific patterns while allowing explicit exceptions with documented reasons
      'no-restricted-globals': 'off',
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react',
              importNames: [
                'createContext',
                'useContext',
                'useMemo',
                'useCallback',
                'memo',
              ],
              message:
                'createContext/useContext are banned - use Zustand. React.memo/useMemo/useCallback are banned - prefer component splitting.',
            },
            {
              name: 'react-router',
              message:
                'Import from "react-router-dom" instead of "react-router".',
            },
            {
              name: '@sentry/react',
              message:
                'Import from "@/modules/sentry" instead of "@sentry/react" directly.',
            },
            {
              name: 'dayjs',
              message:
                'Import from "@/shared/utils/datetime-utils" instead of using dayjs directly.',
            },
          ],
        },
      ],

      // Ban console.log and console.error
      'no-console': ['error', { allow: ['warn', 'debug'] }],

      // Ban `any` type
      '@typescript-eslint/no-explicit-any': 'error',

      // Ban new Date() - use datetime-utils
      'no-restricted-syntax': [
        'error',
        {
          selector: 'CallExpression[callee.name="useEffect"]',
          message:
            'useEffect is discouraged. Prefer server-state/data-fetching libraries for remote data, Zustand stores for client state, event handlers for user interactions, or derived state for computed values. Use // eslint-disable-next-line no-restricted-syntax -- reason: ... to document exceptions (e.g., cleanup, DOM observers, imperative APIs).',
        },
        {
          selector: 'NewExpression[callee.name="Date"]',
          message:
            'new Date() is banned. Use datetime-utils (now(), parseDate()) instead.',
        },
        {
          selector: 'NewExpression[callee.name="CustomEvent"]',
          message:
            'new CustomEvent() is banned. Use a typed event bus or Zustand instead.',
        },
        {
          selector:
            'JSXElement > JSXOpeningElement ~ JSXExpressionContainer > Literal[value=/[a-zA-Z]{2,}/]',
          message:
            'Hardcoded strings in JSX detected. Use i18n translations instead.',
        },
        {
          selector:
            'JSXElement > JSXOpeningElement ~ Literal[value=/[a-zA-Z]{2,}/]',
          message:
            'Hardcoded strings in JSX detected. Use i18n translations instead.',
        },
      ],

      // Unused vars: error except _ prefix
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // Semicolons required
      semi: ['error', 'always'],

      // Boolean shorthand enforcement
      'no-unneeded-ternary': ['error', { defaultAssignment: false }],

      // Strict TypeScript rules
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports' },
      ],
      '@typescript-eslint/no-non-null-assertion': 'error',
    },
  },
  prettier,

  // --- Per-file overrides ---

  // Sentry wrapper: allowed to import @sentry/react directly
  {
    files: ['src/modules/sentry/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react',
              importNames: [
                'createContext',
                'useContext',
                'useMemo',
                'useCallback',
                'memo',
              ],
              message:
                'createContext/useContext are banned - use Zustand. React.memo/useMemo/useCallback are banned - prefer component splitting.',
            },
            {
              name: 'react-router',
              message:
                'Import from "react-router-dom" instead of "react-router".',
            },
            {
              name: 'dayjs',
              message:
                'Import from "@/shared/utils/datetime-utils" instead of using dayjs directly.',
            },
          ],
        },
      ],
    },
  },

  // datetime-utils wrapper: allowed to import dayjs directly
  {
    files: ['src/shared/utils/datetime-utils.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react',
              importNames: [
                'createContext',
                'useContext',
                'useMemo',
                'useCallback',
                'memo',
              ],
              message:
                'createContext/useContext are banned - use Zustand. React.memo/useMemo/useCallback are banned - prefer component splitting.',
            },
            {
              name: 'react-router',
              message:
                'Import from "react-router-dom" instead of "react-router".',
            },
            {
              name: '@sentry/react',
              message:
                'Import from "@/modules/sentry" instead of "@sentry/react" directly.',
            },
          ],
        },
      ],
    },
  },

  // console-overrides: allowed to use console methods
  {
    files: ['src/shared/utils/console-overrides.ts'],
    rules: {
      'no-console': 'off',
    },
  },

  // Test files: relax strict rules
  {
    files: ['**/*.test.ts', '**/*.spec.ts', 'src/e2e/**'],
    rules: {
      'no-restricted-syntax': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'no-console': 'off',
    },
  },
);
