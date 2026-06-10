# Current Session State

**Status:** 2026-06-10 — Nested subfolder import/export (unlimited depth, `>` separator); deterministic expand/collapse all including subfolders via signal prop; ↗ quick-link button on any entry with a URL; "Open links in: New tab / New window" preference in Settings > Behavior; 7-case vitest suite for CSV import. TypeScript strict + ESLint clean.

**Last session:** [2026-06-10 — Nested subfolders, expand-all fix, quick-link button, link-open preference](docs/sessions/2026-06-10-csv-expand-quicklink.md)

**Open items:**
- Help topics not yet updated for v0.6.0 features (onboarding, search mode toggle, sample data removal, favorites card view). CLAUDE.md standing rule applies.
- SetupScreen (`src/renderer/components/SetupScreen.tsx`) is defined but never imported or rendered. Wire it up or delete it.
- Version bump to v0.6.1 in `package.json` and `electron-builder.yml`; Windows installer build; GitHub Release publish.
- Test scripts and QA screenshots are untracked (`scripts/test-*.mjs`, `qa_*.png`) -- commit or delete.
- Code signing (Windows certificate, Apple Developer ID) -- unlocks SmartScreen bypass and macOS Gatekeeper.
- macOS build -- no blocker other than signing; dist:mac script is ready.
- Browser extension icons need proper artwork (currently placeholder blue squares).
- Browser extension not yet submitted to Chrome Web Store or Firefox Add-ons.
- Duplicate detection across sync sources -- deferred, medium effort.
- Entry preview on hover -- deferred, medium effort.
