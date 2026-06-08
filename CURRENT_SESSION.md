# Current Session State

**Status:** Phase 1 additions complete. Source field, tool type, pipe-separated tags, two-step import screen with preview, template download, and export-mine are all shipped and tested.

**Last session:** [2026-06-07 — Phase 1 additions](docs/sessions/2026-06-07-phase1-additions.md)

**Next up — two options:**

**Option A: Phase 3 easy capture features (recommended for user value)**
- Add-from-clipboard: when the popup opens and clipboard has text, offer to pre-fill a new local entry.
- Quick add: minimal form (title + body/url + vertical; type and tags collapsed/optional).
- Paste-and-split: paste a multi-section document, split on headings, each section becomes an entry.

**Option B: Phase 5 Window UX (recommended for daily use feel)**
- Global hotkey reliability: unregister before re-register, conflict detection and error message.
- Keyboard navigation: arrows through results, Enter to copy focused result, Esc to dismiss.
- `shell.openExternal` for link and tool entries (currently uses window.open which is broken).
- Persist window size and position between launches.

**Open questions / blockers:**
- Tags entered in the form are stored as-is with no pipe enforcement. The placeholder says pipe|separated but users could still type commas. Low-priority polish, not blocking anything.
- Existing store.json files with comma tags are converted to pipe on next load by migrate(). This is transparent to the user.
