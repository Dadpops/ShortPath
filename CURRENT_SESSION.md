# Current Session State

**Status:** Phases 1–9 complete. Three post-phase features done: rounded floating window, recents dropdown, Notes system.

**Last session:** [2026-06-08 — rounded window, recents dropdown, Notes](docs/sessions/2026-06-08-rounded-window-notes.md)

**Open polish items:**
- Settings hotkey display shows "Ctrl" regardless of platform; should show "Cmd" on Mac.
- Tag enforcement (pipe vs comma) in the add form not enforced at input time.
- fs.watch can miss events on network drives; chokidar would be more reliable if users report issues.
- Build and test the updated installer after transparent window change (`npm run build && npm run dist:win`).
