# Current Session State

**Status:** Phases 1–9 complete. Post-phase features: rounded window, recents dropdown, Notes system, add-vertical, note-entry linking, data info buttons.

**Last session:** [2026-06-08 — Polish and new features](docs/sessions/2026-06-08-polish-features.md)

**Open polish items:**
- Settings hotkey display shows "Ctrl" regardless of platform; should show "Cmd" on Mac.
- Tag enforcement (pipe vs comma) in the add form not enforced at input time.
- fs.watch can miss events on network drives; chokidar would be more reliable if users report issues.
- Build and test the updated installer (`npm run build && npm run dist:win`).
