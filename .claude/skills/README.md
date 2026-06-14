# Claude Code Skills

Curated [Agent Skills](https://docs.claude.com/en/docs/claude-code/skills) for this
repo. Skills are auto-discovered by Claude Code from `.claude/skills/<name>/SKILL.md`
and invoked on demand by name — they add capabilities/methodology without bloating
every session's base context.

This is a **deliberately small, curated set**, not a wholesale import. The principle:
a few skills the team understands beat a pile nobody reviewed.

## What's here and where it came from

### From `anthropics/skills` (official, first-party)
Each carries its own `LICENSE.txt`.

| Skill | Why it's here |
| --- | --- |
| `webapp-testing` | Playwright toolkit for driving/asserting the local app — directly useful for the UI/visual coverage gap (e.g. the Tailwind v4 migration had no visual-regression check). |
| `frontend-design` | Frontend design guidance — relevant to the brand system in `src/styles/globals.css`. |
| `mcp-builder` | Building/validating MCP servers — we integrate several. |
| `skill-creator` | Meta-skill for authoring our own project skills. |

### From `obra/superpowers` (third-party, MIT — see `LICENSE.superpowers.txt`)
A development methodology. **Skill content only — the project's `SessionStart` hook
was intentionally NOT installed.** Upstream ships a hook that auto-runs a bootstrap
command from a plugin root; we don't wire auto-running command hooks into this repo.
Consequence: these skills are available by name, but the upstream auto-dispatch
("using-superpowers") behavior is not active. Invoke them explicitly.

| Skill | Purpose |
| --- | --- |
| `test-driven-development` | Test-first discipline. |
| `writing-plans` / `executing-plans` | Plan a change, then execute it step by step. |
| `systematic-debugging` | Structured root-cause debugging. |
| `verification-before-completion` | Verify work actually does what it claims before declaring done. |
| `requesting-code-review` / `receiving-code-review` | Review workflow. |
| `using-git-worktrees` | Worktree-based isolation — fits our feature-branch flow. |

## Deliberately NOT installed
- **anthropics/skills**: document-generation (`pdf`, `docx`, `xlsx`, `pptx`),
  design/art (`canvas-design`, `algorithmic-art`, `theme-factory`, `brand-guidelines`),
  and comms (`internal-comms`, `slack-gif-creator`, `doc-coauthoring`) — not core to
  this app. Easy to add later from the upstream repo if a need appears.
- **Third-party frameworks** evaluated and skipped for a production app: BMAD-METHOD,
  SuperClaude, Archon, claude-squad, slavingia/skills. Add only after per-item review.

## Adding or removing
Drop a `<name>/SKILL.md` folder here (see `skill-creator`), or delete a folder to
remove. Keep the set small and keep provenance/licensing intact.

_Upstream: https://github.com/anthropics/skills · https://github.com/obra/superpowers_
