import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import nextPlugin from '@next/eslint-plugin-next'

export default tseslint.config(
  // Global ignores
  {
    ignores: [
      '.next/**',
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
      '@next/next': nextPlugin,
    },
    rules: {
      // React hooks rules
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/rules-of-hooks': 'error',

      // React refresh — allow Next.js page/layout exports
      'react-refresh/only-export-components': [
        'warn',
        {
          allowConstantExport: true,
          allowExportNames: [
            'metadata',
            'generateMetadata',
            'generateStaticParams',
            'viewport',
            'dynamic',
            'revalidate',
          ],
        },
      ],

      // Next.js recommended rules
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,

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

  // App Router files — disable react-refresh (server components + metadata exports)
  {
    files: ['app/**/*.tsx', 'app/**/*.ts'],
    rules: {
      'react-refresh/only-export-components': 'off',
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
    files: ['src/services/**/*.ts', 'src/utils/**/*.ts'],
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
      'src/views/Home.tsx',
      'src/views/Reviews.tsx',
      'src/utils/apiCache.ts',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'react-refresh/only-export-components': 'off',
      'react-hooks/exhaustive-deps': 'off',
    },
  }
)
