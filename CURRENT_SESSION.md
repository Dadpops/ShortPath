# Current Session State

**Status:** Phase 3 easy capture complete. Clipboard banner, quick add (type/tags collapsed behind "More options"), and paste-and-split on markdown headings are all shipped.

**Last session:** [2026-06-08 — Phase 3 easy capture](docs/sessions/2026-06-08-phase3-easy-capture.md)

**Next up — two options:**

**Option A: Phase 4 — Shared-file sync**
- Settings UI for shared file path (file picker or paste path).
- File watcher on the configured path.
- On change: reload synced entries, replace previous synced set, push to renderer.
- Manual "Refresh now" button.
- Clear synced: remove all synced entries without touching local ones.

**Option B: Phase 5 — Window UX (recommended for daily use feel)**
- Keyboard navigation: arrows through results, Enter to copy, Esc to dismiss.
- Global hotkey reliability: unregister before re-register, conflict detection.
- `shell.openExternal` for link and tool entries (window.open is broken in frameless Electron).
- Persist window size and position between launches.

**Open questions / blockers:**
- Paste-and-split creates all entries with `type: "doc"` and no tags. Users can edit entries after the fact. A bulk-tag field on the split screen could be added in a future polish pass.
- Tags in the add form are still stored as-is with no pipe enforcement. Low-priority polish.
