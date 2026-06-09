# Current Session State

**Status:** v0.4.0 — Keyboard panel, UX fixes (sample data filter, friendly name dropdown, clipboard strip position, pin button position, N/K letter buttons), pin limit removed, full keyboard nav shortcuts, Check for updates info note. TypeScript clean. Ready to release.

**Last session:** [2026-06-09 — Keyboard panel, UX fixes, full keyboard nav](docs/sessions/2026-06-09-ux-fixes.md)

**Open items:**
- SetupScreen (`src/renderer/components/SetupScreen.tsx`) is defined but never imported or rendered. Wire it up for first-time users or delete it.
- Test scripts and QA screenshots are untracked (`scripts/test-*.mjs`, `qa_*.png`) — commit or delete.
- Code signing (Windows certificate, Apple Developer ID) — unlocks SmartScreen bypass and macOS Gatekeeper.
- macOS build — no blocker other than signing; the dist:mac script is ready.
- Browser extension icons need proper artwork (currently placeholder blue squares).
- Browser extension not yet submitted to Chrome Web Store or Firefox Add-ons.
- Duplicate detection across sync sources — deferred, medium effort.
- Entry preview on hover — deferred, medium effort.
