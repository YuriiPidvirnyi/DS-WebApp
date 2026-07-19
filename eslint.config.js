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
      'scripts/**',
      '.claude/skills/**',
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
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
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
      'src/components/AccessibilityProvider.tsx',
      'src/components/ui/LiveRegion.tsx',
      'src/components/ui/LazyImage.tsx',
      'src/views/Home.tsx',
      'src/views/Reviews.tsx',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'react-refresh/only-export-components': 'off',
      'react-hooks/exhaustive-deps': 'off',
    },
  },

  // ── Дизайн-системні гарди (Ф-1/Ф-2, обов'язкова частина Фази 1) ──────────
  // Гард 1: сирі Tailwind-палітри поза токенами заборонені. Всі кольори — з
  // бренд-рампи (dental-*), семантичної шкали статусів (status-*) або ролей
  // (role-*). Див. src/styles/globals.css @theme.
  {
    files: ['src/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'Literal[value=/(^|[\\s:\'"`(!])(bg|text|border-[trblxyse]|border|ring-offset|ring|shadow|from|to|via|fill|stroke|divide|outline|decoration|accent|caret|placeholder)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]/]',
          message:
            'Сирі Tailwind-кольори заборонені (Ф-1): використовуйте токени dental-* / status-* / role-* з globals.css.',
        },
        {
          selector:
            'TemplateElement[value.raw=/(^|[\\s:\'"`(!])(bg|text|border-[trblxyse]|border|ring-offset|ring|shadow|from|to|via|fill|stroke|divide|outline|decoration|accent|caret|placeholder)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]/]',
          message:
            'Сирі Tailwind-кольори заборонені (Ф-1): використовуйте токени dental-* / status-* / role-* з globals.css.',
        },
        {
          selector:
            "JSXAttribute[name.name='className'] Literal[value=/\\[#[0-9a-fA-F]{3,8}\\]/]",
          message:
            'Довільні hex-кольори в className заборонені (Ф-1): додайте токен у globals.css @theme.',
        },
      ],
    },
  },
  // Гард 2: рядкові літерали кирилицею в JSX поза i18n заборонені (Ф-2).
  // Текст живе в src/locales/*, компонент отримує його через t().
  {
    files: ['src/**/*.tsx', 'app/**/*.tsx'],
    ignores: [
      // Друковані/промо-документи навмисно україномовні (клінічні папери).
      'src/views/admin/AdminIntakePrintPage.tsx',
      'src/views/admin/AdminTreatmentPrintPage.tsx',
      'src/views/promo/**',
      // global-error замінює кореневий layout — i18n-провайдера в цій області
      // немає, тож t() тут не працює (останній рубіж на випадок збою).
      'app/global-error.tsx',
      '**/*.test.tsx',
    ],
    rules: {
      // Увага: flat config перезаписує no-restricted-syntax цілком, тому цей
      // блок повторює селектори Гарда 1 і додає JSXText-гард поверх них.
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'Literal[value=/(^|[\\s:\'"`(!])(bg|text|border-[trblxyse]|border|ring-offset|ring|shadow|from|to|via|fill|stroke|divide|outline|decoration|accent|caret|placeholder)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]/]',
          message:
            'Сирі Tailwind-кольори заборонені (Ф-1): використовуйте токени dental-* / status-* / role-* з globals.css.',
        },
        {
          selector:
            'TemplateElement[value.raw=/(^|[\\s:\'"`(!])(bg|text|border-[trblxyse]|border|ring-offset|ring|shadow|from|to|via|fill|stroke|divide|outline|decoration|accent|caret|placeholder)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]/]',
          message:
            'Сирі Tailwind-кольори заборонені (Ф-1): використовуйте токени dental-* / status-* / role-* з globals.css.',
        },
        {
          selector:
            "JSXAttribute[name.name='className'] Literal[value=/\\[#[0-9a-fA-F]{3,8}\\]/]",
          message:
            'Довільні hex-кольори в className заборонені (Ф-1): додайте токен у globals.css @theme.',
        },
        {
          selector: 'JSXText[value=/[А-Яа-яЄєІіЇїҐґ]/]',
          message:
            'Захардкоджений текст у JSX заборонено (Ф-2): винесіть рядок у словник i18n і використовуйте t().',
        },
        {
          // JSXText не покриває значення атрибутів — placeholder/title/alt/aria-*
          // теж рендеряться користувачу й мають іти через t().
          selector:
            'JSXAttribute[name.name=/^(placeholder|title|alt|aria-label|aria-description|aria-placeholder|aria-valuetext|aria-roledescription)$/] > Literal[value=/[А-Яа-яЄєІіЇїҐґ]/]',
          message:
            'Захардкоджений кириличний текст в атрибуті JSX заборонено (Ф-2): винесіть рядок у словник i18n і використовуйте t().',
        },
      ],
    },
  }
)
