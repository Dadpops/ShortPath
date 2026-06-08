# Session — 2026-06-08 (sub-folders, danger zone, close button)

## Goal

Complete the in-progress sub-folder feature from the previous session's working tree, add CSS, update Help topics, update the README, and verify end-to-end.

## What changed

### Feature: Sub-folders

- `shared/types.ts`: Added `SubFolder` interface (`id`, `label`). Added `subFolders?: SubFolder[]` to `Vertical`. Added `subFolderId?: string` to `Entry`.
- `store/index.ts`: Added `addSubFolder`, `renameSubFolder`, `removeSubFolder` store functions. `removeSubFolder` unsets `subFolderId` on any entries in that sub-folder (entries are not deleted). Added `clearLocalEntries` (see below).
- `main/index.ts`: IPC handlers for `add-subfolder`, `rename-subfolder`, `remove-subfolder`, `clear-local-entries`. Removed redundant `pushStoreUpdate` from `add-vertical` handler (renderer updates state locally from the returned vertical).
- `preload/index.ts` + `global.d.ts`: Exposed the four new IPC calls.
- `SettingsScreen.tsx`: Per-vertical 📁 button in the Verticals section. Opens an inline sub-folder panel showing existing sub-folders (each with Rename/Remove) and a "+ Add sub-folder" button. The folder button shows a count when sub-folders exist.
- `EntryForm.tsx`: Sub-folder selector (`<select>`) appears below the Vertical field when the selected vertical has sub-folders. Resets when the vertical is changed. Persisted on save.
- `VerticalGroup.tsx`: Results split into top-level list (entries with no `subFolderId`) and collapsible sub-folder groups (one per sub-folder that has matching entries). Sub-folders start expanded.
- `global.css`: Added `.subfolder-*` classes for results, `.settings-subfolder-*` and `.settings-subfolders` for the settings panel.

### Feature: Clear local entries

- `store/index.ts`: `clearLocalEntries` removes all `source: "local"` entries and prunes `recents` / `favorites` to only synced ids.
- `main/index.ts`: `clear-local-entries` IPC handler.
- `SettingsScreen.tsx`: Danger zone below the data action grid — red outline "Clear all entries" button with a two-step confirm. Warning text before the destructive action.
- `global.css`: `.settings-danger-zone`, `.settings-danger-confirm`, `.settings-danger-warning`, `.settings-danger-actions`, `.btn-danger-lg`, `.btn-danger-outline`.

### Other

- `App.tsx`: Added a ✕ Close button to the main header (calls `hideWindow`). `MacroOverlay` now rendered inside the favorites view so an open overlay persists when navigating to favorites.
- `global.css`: Removed the close-button width on the header icon (already sized by `.header-icon-btn`).

### README

Replaced the stale "Early development" status paragraph with a full feature list, current status note, and an updated build/dev guide.

### Help topics updated

- `managing-verticals`: Updated with sub-folder documentation (creating, assigning, removing sub-folders).
- `settings`: Added "Clear all entries" explanation to the Data section.

## Commits in this session

- `10a9a02` — feat: sub-folders, clear-local-entries, close button, favorites overlay
- `0689c94` — docs: update README to reflect full feature set

## Next steps

- Build and test the installer (`npm run build && npm run dist:win`)
- Open items from prior session still pending:
  - Settings hotkey display shows "Ctrl" on all platforms (should show "Cmd" on Mac)
  - Tag format (pipe vs comma) not enforced at input time
  - `fs.watch` reliability on network drives (chokidar)
