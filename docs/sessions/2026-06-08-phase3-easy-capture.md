# Session — 2026-06-08 (Phase 3 easy capture)

## Goal

Implement the three Phase 3 easy capture features: add-from-clipboard, quick add, and paste-and-split. These make it fast for a solo user to collect content into ShortPath without leaving their workflow.

## What changed

- **src/shared/types.ts** — added `READ_CLIPBOARD: "read-clipboard"` to the IPC constants.

- **src/main/index.ts** — imported `clipboard` from Electron. Added `ipcMain.handle("read-clipboard", () => clipboard.readText())`. This runs in the main process where the Electron clipboard API is reliable across platforms.

- **src/preload/index.ts** — exposed `readClipboard: () => ipcRenderer.invoke("read-clipboard")`.

- **src/renderer/global.d.ts** — added `readClipboard: () => Promise<string>` to the Window interface.

- **src/renderer/components/EntryForm.tsx** — added `quickAdd?: boolean` and `prefillBody?: string` props. When `quickAdd` is true and not in edit mode, type and tags fields are hidden; a "More options (type, tags) ▾" toggle reveals them. The form title shows "Quick add" instead of "Add entry". `prefillBody` pre-populates the body field (used by the clipboard banner).

- **src/renderer/components/SplitImport.tsx** — new component. Three stages: input (paste textarea + vertical selector), preview (list of parsed entries with title and body preview), saving (progress). Heading parser: splits on `#{1,4} <text>` markdown headings; everything between headings becomes the body of that entry. Entries are created in sequence via the existing `createEntry` IPC. All entries land in the chosen vertical with `type: "doc"`.

- **src/renderer/App.tsx** — added `"split"` to `AppMode`. Added `clipboardText`, `clipboardDismissed`, and `quickAddPrefill` state. On mount and on `window.focus`, reads clipboard via IPC and updates state. Clipboard banner renders below the header when text is present and not dismissed: shows a 60-char preview, "Save as entry" (opens quick-add pre-filled), and "✕" dismiss. Added `✂` button in header to open split import mode. The `+` button now opens quick-add mode (form renders with `quickAdd={true}`). Added `handleSplitComplete` to merge created entries and verticals back into app state.

- **src/renderer/styles/global.css** — added styles for: `clipboard-banner`, `clipboard-banner-preview`, `clipboard-banner-save`, `clipboard-banner-dismiss`, `more-options-toggle`, `split-import-shell`, `split-import-body`, `split-import-hint`, `split-import-textarea`, `split-preview-list`, `split-preview-item`, `split-preview-title`, `split-preview-body`.

- **docs/ROADMAP.md** — Phase 3 addition tasks all checked off.

## Decisions made

- **Clipboard read via IPC, not navigator.clipboard.** The Electron `clipboard` module in the main process is synchronous, requires no user gesture, and works before the renderer has focus. `navigator.clipboard.readText()` in the renderer can prompt for permissions on some platforms and requires the window to be the focused document.
- **Banner reads clipboard on mount and on `window.focus`.** This captures the common case: user copies something, presses the hotkey, banner appears. Re-reading on focus means successive clipboard changes are picked up each time the window is brought up.
- **Quick add collapses type and tags, not body/link/vertical.** Title, body, link, and vertical are the fields users most often need. Type (default "reply") and tags are preserved but tucked behind "More options" — expanding them is one click.
- **Split entries always get `type: "doc"`.** A pasted document is almost always reference content. The user can edit individual entries after the fact if a different type applies.
- **Paste-and-split vertical label only passed on first `createEntry` call.** After the first call, the vertical already exists in the store so `verticalLabel` is redundant. The component sets `isNewVertical` to false after the first creation to avoid the label being sent again.

## Commits in this session

- `a070153` — chore: add icon assets and package-lock
- `9baf378` — feat: add read-clipboard IPC channel
- `0f4d7cc` — feat: quick add mode in EntryForm (quickAdd prop, prefillBody, more options toggle)
- `c91395f` — feat: paste-and-split component (heading parser, preview, bulk create)
- `1556892` — feat: clipboard banner, quick add mode, split import in App
- `978307c` — feat: styles for clipboard banner, quick-add toggle, split import

## Next steps

Phase 3 is complete. The next recommended phases:

**Phase 4 — Shared-file sync**
- Settings UI for shared file path.
- File watcher (fs.watch / chokidar) on the configured path.
- On change: reload synced entries, replace previous synced set, push to renderer.
- Manual "Refresh now" button.
- Clear synced, export all, export mine already wired in Phase 1.

**Phase 5 — Window UX**
- Keyboard navigation (arrows, Enter to copy, Esc to dismiss).
- Global hotkey reliability (unregister before re-register, conflict detection).
- `shell.openExternal` for link/tool entries (window.open is broken in frameless Electron).
- Persist window size and position between launches.

## Open questions / blockers

- None blocking.
- The split parser handles `#{1,4}` markdown headings. It does not handle setext headings (`===` / `---` underline style) or ALL-CAPS lines. This covers most structured documents (Notion, Google Docs export, Confluence export) without adding complexity.
- Tags are empty on all split-created entries. Users can edit individual entries to add tags. A bulk-tag field on the split import screen could be a future polish item.
