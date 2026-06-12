# Current Session State

**Status:** 2026-06-11 — Four bug fixes. Session closed.

**Last session:** [2026-06-11 — bug fixes](docs/sessions/2026-06-11-bug-fixes.md)

**Open items:**
- Code signing (Windows certificate, Apple Developer ID) -- unlocks SmartScreen bypass and macOS Gatekeeper.
- macOS build -- no blocker other than signing; dist:mac script is ready.
- Browser extension icons need proper artwork (currently placeholder blue squares).
- Browser extension not yet submitted to Chrome Web Store or Firefox Add-ons.
- Distribution pipeline: GitHub Actions release workflow; check-for-updates reinstated once pipeline is solid.
- csv.test.ts has 5 pre-existing failures in subfolder-handling tests (present before this session, not introduced here).
