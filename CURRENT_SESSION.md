# Current Session State

**Status:** Phase 3 complete. Entry management (add, edit, delete), recents tracking, and user-defined verticals all working.

**Last session:** [2026-06-07 — Phase 3 entry management](docs/sessions/2026-06-07-phase3-entry-management.md)

**Next up:** Phase 4 — Window UX (core).
First task: make the global hotkey reliably summon and dismiss the window, focus the search box on show, and persist window size/position between launches.
See [docs/ROADMAP.md](docs/ROADMAP.md) for the full checklist.

**Open questions / blockers:**
- `window.open(link)` in ResultItem still needs to be replaced with `shell.openExternal` via IPC. Tracked for Phase 4.
- Global hotkey (`CommandOrControl+Shift+Space`) silently fails if another app owns that key. Phase 4 adds conflict detection.
