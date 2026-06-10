# Current Session State

**Status:** v0.6.0 — First-run onboarding overlay (4-step, skippable, replayable); 50-entry sample data with one-click removal; search mode toggle (Keyword / Full text); keyboard shortcut editing consolidated into KeyboardPanel; Notes and Favorites card treatment; README revamped as landing page with 8 screenshots. TypeScript clean. Pushed to master.

**Last session:** [2026-06-09 — v0.6.0: onboarding, sample data, search mode toggle, README landing page](docs/sessions/2026-06-09-v0.6.0.md)

**Open items:**
- Help topics in `src/renderer/features/help/topics.ts` not yet updated for v0.6.0 features (onboarding, search mode toggle, sample data removal, favorites card view). CLAUDE.md standing rule requires this before the next feature phase.
- SetupScreen (`src/renderer/components/SetupScreen.tsx`) is defined but never imported or rendered. Wire it up for first-time source-mode selection or delete it.
- Version bump to v0.6.0 in `package.json` and `electron-builder.yml`, Windows installer build, GitHub Release publish.
- Test scripts and QA screenshots are untracked (`scripts/test-*.mjs`, `qa_*.png`) -- commit to archive or delete.
- Code signing (Windows certificate, Apple Developer ID) -- unlocks SmartScreen bypass and macOS Gatekeeper.
- macOS build -- no blocker other than signing; the dist:mac script is ready.
- Browser extension icons need proper artwork (currently placeholder blue squares).
- Browser extension not yet submitted to Chrome Web Store or Firefox Add-ons.
- Duplicate detection across sync sources -- deferred, medium effort.
- Entry preview on hover -- deferred, medium effort.
