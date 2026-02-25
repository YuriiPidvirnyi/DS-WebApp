# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

Dental Story is a React 19 + TypeScript SPA for a Ukrainian dental clinic, built with Vite. It is a frontend-only application with mock API fallbacks — no backend server is required to run the dev server or most features.

### Development commands

See `CLAUDE.md` for the full list of build, lint, test, and dev commands.

### Environment setup caveats

- **Node version**: The repo targets Node 20 (see `.nvmrc`). Use `nvm use 20` before running commands.
- **npm install requires `--legacy-peer-deps`**: The `package.json` has a peer dependency conflict between `eslint@^10` and `eslint-plugin-react-hooks@^7` (which only supports eslint up to v9). Always run `npm install --legacy-peer-deps`.
- **`.env` file**: Copy `.env.example` to `.env` for local development. All external service keys are optional; the app degrades gracefully without them.
- **ESLint is broken**: `eslint@10` requires flat config (`eslint.config.js`) but the repo only has `.eslintrc.cjs`. Running `npm run lint` will fail. This is a pre-existing repo issue.
- **`npm run build` has TypeScript errors**: `src/components/ui/OptimizedImage.tsx` has TS errors (`Cannot find namespace 'JSX'`). The dev server (`npm run dev`) works fine since Vite uses esbuild, not `tsc`, for transformation.
- **Unit tests**: `npm run test:run` runs 181 tests; ~160 pass. The ~21 failures are pre-existing issues (LazyImage mock problems, timing-sensitive tests). The test infrastructure works correctly.

### Running the dev server

```bash
npm run dev    # Starts Vite dev server on port 3000
```

No backend service is needed — the frontend has built-in mock fallbacks for API calls.
