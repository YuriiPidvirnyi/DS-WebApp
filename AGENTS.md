# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

Dental Story is a Next.js 16 dental clinic web application (Ukrainian-language). See `CLAUDE.md` for the full architecture, environment variables, and command reference.

### Node version

The project requires **Node 20** (see `.nvmrc`). The VM has nvm installed with Node 20 set as the default alias. Source nvm before running any node/npm commands in non-interactive shells:

```sh
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
```

### Key commands

All standard dev commands are in `package.json` and documented in `CLAUDE.md`. Quick reference:

| Task         | Command                                                                 |
| ------------ | ----------------------------------------------------------------------- |
| Install deps | `npm install --legacy-peer-deps` (`.npmrc` has `legacy-peer-deps=true`) |
| Dev server   | `npm run dev` (port 3000)                                               |
| Lint         | `npm run lint`                                                          |
| Type check   | `npm run typecheck`                                                     |
| Unit tests   | `npm run test` (Vitest, 18 files / 93 tests)                            |
| Build        | `npm run build`                                                         |

### External services

All external services (Supabase, Redis, Resend, Sentry, etc.) degrade gracefully when env vars are missing. The app runs and renders all static/marketing pages without any secrets configured. Auth-dependent features (booking, cabinet, admin, chat) require Supabase credentials.

### Gotchas

- `.npmrc` sets `legacy-peer-deps=true` — always use `npm install --legacy-peer-deps` or rely on the `.npmrc` setting.
- Husky pre-commit hook runs `lint-staged`; commit-msg hook runs `commitlint` (conventional commits required).
- The dev server uses Turbopack. If you get stale cache issues, run `npm run dev:restart` which clears the Turbopack cache and restarts.
- No Docker, no local databases — this is a pure Next.js app with all backend services being cloud-hosted SaaS.
