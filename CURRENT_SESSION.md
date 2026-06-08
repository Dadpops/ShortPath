# Current Session State

**Status:** Macro overlay complete. Click any result (or Enter on keyboard-focused result) to open a panel showing the full entry, with Copy, URL link, and tag chips.

**Last session:** [2026-06-08 — Macro overlay](docs/sessions/2026-06-08-macro-overlay.md)

**Next up — choose one:**

**Option A: Phase 4 — Shared-file sync**
- Settings screen already has a sync path stub ready.
- File watcher on the configured path.
- On change: reload synced entries, replace previous synced set, push to renderer.
- Manual "Refresh now" button.
- Clear synced (removes all synced entries, leaves local entries untouched).

**Option B: Phase 6 — Support Tools section**
- Support Tools vertical with distinct UI treatment (icons, quick-launch grid).
- shell.openExternal for links is already wired from Phase 5.
- Reorder tools via drag or keyboard.

**Open questions / blockers:**
- Settings hotkey display shows "Ctrl" regardless of platform; should show "Cmd" on Mac. Polish item.
- Tag enforcement (pipe vs comma) in the add form is still not enforced at input time. Low-priority polish.
