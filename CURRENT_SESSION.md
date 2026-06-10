# Current Session State

**Status:** 2026-06-10 — Run-shortpath project skill saved; all help topics complete.

**Last session:** [2026-06-10 — run-shortpath project skill](docs/sessions/2026-06-10-run-skill.md)

**Open items:**
- Help topics not yet updated for v0.6.0 features (onboarding, search mode toggle, sample data removal, favorites card view). CLAUDE.md standing rule applies.
- SetupScreen (`src/renderer/components/SetupScreen.tsx`) is defined but never imported or rendered. Wire it up or delete it.
- Test scripts and QA screenshots are untracked (`scripts/test-*.mjs`, `qa_*.png`) -- commit or delete.
- Code signing (Windows certificate, Apple Developer ID) -- unlocks SmartScreen bypass and macOS Gatekeeper.
- macOS build -- no blocker other than signing; dist:mac script is ready.
- Browser extension icons need proper artwork (currently placeholder blue squares).
- Browser extension not yet submitted to Chrome Web Store or Firefox Add-ons.
- Duplicate detection across sync sources -- deferred, medium effort.
- Entry preview on hover -- deferred, medium effort.
