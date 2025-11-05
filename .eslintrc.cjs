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
      },
    },
  ],
}

