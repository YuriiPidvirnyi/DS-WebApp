#!/usr/bin/env node
/**
 * link-env.mjs
 *
 * Symlinks .env.local from the main project root into any Git worktrees
 * found under .claude/worktrees/. Run manually or from a husky post-checkout hook.
 *
 * Usage:
 *   node scripts/link-env.mjs
 */

import { existsSync, statSync, symlinkSync } from 'fs'
import { join } from 'path'
import { readdirSync } from 'fs'
import { resolve } from 'path'

const root = new URL('..', import.meta.url).pathname.replace(/\/$/, '')
const envFile = join(root, '.env.local')

if (!existsSync(envFile)) {
  console.warn(`[link-env] No .env.local at ${envFile} — nothing to link`)
  process.exit(0)
}

const worktreeBase = join(root, '.claude', 'worktrees')

if (!existsSync(worktreeBase)) {
  console.log(`[link-env] No worktrees at ${worktreeBase} — nothing to do`)
  process.exit(0)
}

const entries = readdirSync(worktreeBase, { withFileTypes: true })
  .filter(e => e.isDirectory())
  .map(e => join(worktreeBase, e.name))

let linked = 0
let skipped = 0

for (const worktree of entries) {
  const dest = join(worktree, '.env.local')
  if (statSync(dest, { throwIfNoEntry: false })) {
    skipped++
    continue
  }
  try {
    symlinkSync(resolve(envFile), dest)
    console.log(`[link-env] Linked ${dest}`)
    linked++
  } catch (err) {
    console.warn(`[link-env] Could not link ${dest}: ${err.message}`)
  }
}

console.log(`[link-env] Done — ${linked} linked, ${skipped} already present`)
