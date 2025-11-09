module.exports = {
  root: true,
  env: { browser: true, es2020: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: [
    'dist',
    '.eslintrc.cjs',
    'commitlint.config.cjs',
    'node_modules',
    'coverage',
    'test-results',
    'playwright-report',
    'scripts',
    'storybook-static',
    '.storybook',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh', '@typescript-eslint'],
  rules: {
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

    // Code quality rules
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'no-empty': ['error', { allowEmptyCatch: true }],
    'no-useless-escape': 'warn',
    'prefer-const': 'error',
    'prefer-rest-params': 'warn',
    'no-extra-semi': 'off',
  },
  overrides: [
    {
      // Storybook files
      files: ['**/*.stories.tsx', '**/*.stories.ts', '.storybook/**/*'],
      rules: {
        'react-refresh/only-export-components': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        'no-console': 'off',
      },
    },
    {
      // Test files
      files: ['src/**/__tests__/**/*.test.tsx', 'src/test/**/*.tsx', 'src/test/**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'react-refresh/only-export-components': 'off',
      },
    },
    {
      // Service and util files with complex types
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
    {
      // Components with external library types
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
    },
  ],
}
