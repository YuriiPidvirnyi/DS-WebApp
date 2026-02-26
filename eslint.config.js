import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default tseslint.config(
  // Global ignores
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'test-results/**',
      'playwright-report/**',
      'scripts/**',
      'storybook-static/**',
      '.storybook/**',
      'commitlint.config.cjs',
    ],
  },

  // Base configs
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Main config for all TS/TSX files
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2020,
        ...globals.node,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // React hooks rules
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/rules-of-hooks': 'error',

      // React refresh
      'react-refresh/only-export-components': [
        'warn',
        {
          allowConstantExport: true,
          allowExportNames: ['loader', 'action', 'meta'],
        },
      ],

      // Stricter TypeScript rules
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // Code quality rules
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-useless-escape': 'warn',
      'prefer-const': 'error',
      'prefer-rest-params': 'warn',
    },
  },

  // Storybook files
  {
    files: ['**/*.stories.tsx', '**/*.stories.ts'],
    rules: {
      'react-refresh/only-export-components': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },

  // Test files
  {
    files: [
      'src/**/__tests__/**/*.test.tsx',
      'src/test/**/*.tsx',
      'src/test/**/*.ts',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },

  // Service and util files with complex types
  {
    files: [
      'src/services/**/*.ts',
      'src/utils/**/*.ts',
      'src/hooks/useFormAutosave.ts',
      'src/hooks/useLocale.ts',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // Components with external library types
  {
    files: [
      'src/components/FormProgress.tsx',
      'src/components/SecurityDashboard.tsx',
      'src/components/AccessibilityProvider.tsx',
      'src/components/ui/LiveRegion.tsx',
      'src/components/ui/LazyImage.tsx',
      'src/pages/Home.tsx',
      'src/pages/Reviews.tsx',
      'src/utils/apiCache.ts',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'react-refresh/only-export-components': 'off',
      'react-hooks/exhaustive-deps': 'off',
    },
  }
)
