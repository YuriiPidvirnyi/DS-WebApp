/**
 * Removes Next.js dev Turbopack cache (`.next/dev/cache/turbopack`).
 * Safe to run if the directory is missing.
 */
import { rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const turboDir = path.join(root, '.next', 'dev', 'cache', 'turbopack')

if (existsSync(turboDir)) {
  await rm(turboDir, { recursive: true, force: true })
  console.log('Removed:', turboDir)
} else {
  console.log('No Turbopack cache at:', turboDir)
}
