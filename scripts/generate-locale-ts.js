#!/usr/bin/env node

/**
 * Generates .ts wrapper files from .json locale files.
 *
 * Turbopack (Next.js 16 default bundler) aggressively tree-shakes JSON imports,
 * stripping keys that it considers "unused". Since i18next accesses translation
 * keys dynamically at runtime, the bundler cannot determine which keys are needed,
 * resulting in missing translations on the client.
 *
 * This script wraps each locale JSON file in a .ts module with `as const`,
 * which prevents tree-shaking of individual keys.
 *
 * Usage: node scripts/generate-locale-ts.js
 * Run this after editing any .json file in src/locales/
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const localesDir = path.join(__dirname, '..', 'src', 'locales')
const languages = ['uk', 'en', 'pl']

for (const lang of languages) {
  const jsonPath = path.join(localesDir, `${lang}.json`)
  const tsPath = path.join(localesDir, `${lang}.ts`)

  if (!fs.existsSync(jsonPath)) {
    console.warn(`Skipping ${lang}: ${jsonPath} not found`)
    continue
  }

  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
  const code = [
    `// Auto-generated from ${lang}.json — DO NOT EDIT directly.`,
    '// This .ts wrapper prevents Turbopack from tree-shaking JSON translation keys.',
    `// Edit ${lang}.json and run: node scripts/generate-locale-ts.js`,
    '',
    `const ${lang} = ${JSON.stringify(data, null, 2)} as const`,
    '',
    `export default ${lang}`,
    '',
  ].join('\n')

  fs.writeFileSync(tsPath, code)
  console.log(
    `Generated ${lang}.ts (${Object.keys(data).length} keys, ${code.length} bytes)`
  )
}
