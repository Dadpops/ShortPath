# Current Session State

**Status:** Friction-point improvements complete. Sample data onboarding, recent copies persistence, "recently used" sort, hotkey discoverability, configurable pin cap, Stream Deck re-export timestamp, Ctrl+N, search history, empty search state. TypeScript clean. Committed and ready to push.

**Last session:** [2026-06-09 — Friction-point UX improvements](docs/sessions/2026-06-09-friction-points.md)

**Open items:**
- SetupScreen (`src/renderer/components/SetupScreen.tsx`) is defined but never imported or rendered. Wire it up for first-time users or delete it.
- Test scripts and QA screenshots are untracked (`scripts/test-*.mjs`, `qa_*.png`) — commit or delete.
- Code signing (Windows certificate, Apple Developer ID) — unlocks SmartScreen bypass and macOS Gatekeeper.
- macOS build — no blocker other than signing; the dist:mac script is ready.
- Browser extension icons need proper artwork (currently placeholder blue squares).
- Browser extension not yet submitted to Chrome Web Store or Firefox Add-ons.
- Duplicate detection across sync sources — deferred, medium effort.
- Entry preview on hover — deferred, medium effort.
