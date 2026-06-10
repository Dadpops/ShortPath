# Current Session State

**Status:** v0.5.0 — Support tools as list items, help popout, CSS pin circles, accent scoped to folder headers, group separation, keyboard shortcuts in keyboard panel, entry notes in overlay, export subfolder improvements. TypeScript clean. Pushed to master.

**Last session:** [2026-06-09 — v0.5.0 polish](docs/sessions/2026-06-09-v0.5.0.md)

**Open items:**
- SetupScreen (`src/renderer/components/SetupScreen.tsx`) is defined but never imported or rendered. Wire it up for first-time users or delete it.
- Test scripts and QA screenshots are untracked (`scripts/test-*.mjs`, `qa_*.png`) — commit or delete.
- Code signing (Windows certificate, Apple Developer ID) — unlocks SmartScreen bypass and macOS Gatekeeper.
- macOS build — no blocker other than signing; the dist:mac script is ready.
- Browser extension icons need proper artwork (currently placeholder blue squares).
- Browser extension not yet submitted to Chrome Web Store or Firefox Add-ons.
- Duplicate detection across sync sources — deferred, medium effort.
- Entry preview on hover — deferred, medium effort.
