# Current Session State

**Status:** Phase 1 and Phase 2 complete. App is in demo state — seed data loads, search works, copy button works.

**Last session:** [2026-06-07 — Phase 1 + Phase 2 demo build](docs/sessions/2026-06-07-phase1-phase2-demo.md)

**Next up:** Phase 3 — Copy and entry management.
First task: add/edit/delete entry forms in the UI. Manual entries should live in the same JSON store as seeded/imported ones.
See [docs/ROADMAP.md](docs/ROADMAP.md) for the full checklist.

**Open questions / blockers:**
- `window.open(link)` in ResultItem should be replaced with `shell.openExternal` via IPC (Phase 4 item, flagged early).
- Global hotkey (`CommandOrControl+Shift+Space`) should be tested. If it conflicts with another app, it silently fails — Phase 4 adds conflict detection and user configuration.
