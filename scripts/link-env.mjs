/**
 * Symlinks .env.local from the main project root into any git worktrees
 * created under .claude/worktrees/. Run automatically via husky post-checkout,
 * or manually after creating a new worktree.
 *
 * Usage:
 *   node scripts/link-env.mjs
 *
 * Why: git worktrees don't inherit files outside git tracking (.env.local is
 * gitignored). Without this, a worktree boots without any Supabase env and
 * half the app silently fails (admin login shows "unavailable").
 */

import { existsSync, symlinkSync, lstatSync, unlinkSync, readdirSync } from 'fs'
import { resolve, dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot  = resolve(__dirname, '..')
const worktreesDir = join(projectRoot, '.claude', 'worktrees')
const envSource    = join(projectRoot, '.env.local')

if (!existsSync(envSource)) {
  console.log('ℹ️   No .env.local in project root — nothing to link.')
  process.exit(0)
}

if (!existsSync(worktreesDir)) {
  console.log('ℹ️   No .claude/worktrees/ directory — nothing to do.')
  process.exit(0)
}

const worktrees = readdirSync(worktreesDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => join(worktreesDir, d.name))

if (worktrees.length === 0) {
  console.log('ℹ️   No worktrees found under .claude/worktrees/.')
  process.exit(0)
}

for (const wt of worktrees) {
  const target = join(wt, '.env.local')

  // Skip if already a correct symlink
  if (existsSync(target)) {
    try {
      const stat = lstatSync(target)
      if (stat.isSymbolicLink()) {
        console.log(`✅  ${target} — already linked`)
        continue
      }
      // Real file exists — don't overwrite
      console.log(`⚠️   ${target} — real file exists, skipping (delete it to use project root .env.local)`)
      continue
    } catch {
      // lstat failed — stale symlink, fall through to re-create
      unlinkSync(target)
    }
  }

  symlinkSync(envSource, target)
  console.log(`🔗  Linked ${target} → ${envSource}`)
}

console.log('\nDone. Restart the dev server in each worktree to pick up env changes.')
