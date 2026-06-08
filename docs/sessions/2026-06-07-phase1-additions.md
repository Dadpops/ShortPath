# Session — 2026-06-07 (Phase 1 additions)

## Goal

Complete all Phase 1 additions: lock the CSV schema, add the source field, add the tool type, build the two-step import screen with preview, and wire the template download handler.

## What changed

- **src/shared/types.ts** — added `source: "local" | "synced"` to Entry. Added `"tool"` to the type union. Updated tags comment to reflect pipe separator. Added new IPC constants: RECORD_ACCESS, EXPORT_MINE, PREVIEW_CSV_IMPORT, COMMIT_CSV_IMPORT, DOWNLOAD_TEMPLATE_CSV, STORE_UPDATED.

- **src/store/index.ts** — `addEntry` now always sets `source: "local"` and excludes `source` from the fields parameter type (callers cannot override it). `updateEntry` excludes `source` from updatable fields. `migrate()` backfills `source: "local"` on any entry missing the field, and converts comma-separated tags to pipe-separated on load (split on `,`, trim, rejoin with `|`).

- **src/store/csv.ts** — full rewrite of the CSV module. Column renamed from `link` to `url` in all CSV read/write paths. `"tool"` added to VALID_TYPES. `importCsv` takes a `source` parameter (defaults `"local"`, `"synced"` reserved for Phase 4 sync). New `parseCsvPreview(csvString)` parses and validates without touching the store, returns totalRows, up to 5 previewRows, skippedCount, errors. `exportCsv` writes `url` column (not `link`), omits `source`. Template content bundled as `CSV_TEMPLATE_CONTENT` constant (avoids file-path issues in packaged builds).

- **src/store/seed.ts** — `entry()` helper now includes `source: "local"`. All seed entry tags converted from comma to pipe. Support Tools entries changed from `type: "link"` to `type: "tool"`.

- **src/main/index.ts** — added `pendingCsvImport` module-level variable for the two-step import flow. Added `pushStoreUpdate()` helper (was inline). New IPC handlers: `preview-csv-import` (opens dialog, reads file, stores string, returns preview), `commit-csv-import` (imports stored string, clears it, pushes store update), `export-mine` (exports only `source: "local"` entries), `download-template-csv` (writes `CSV_TEMPLATE_CONTENT` to user-chosen path). Updated `create-entry` and `update-entry` to exclude `source` from field types. Updated tray import handler to use `importCsv(store, csv, "local")`.

- **src/preload/index.ts** — exposed `previewCsvImport`, `commitCsvImport`, `exportMine`, `downloadTemplateCsv`. Updated `createEntry` and `updateEntry` field types to exclude `source`.

- **src/renderer/global.d.ts** — added `CsvPreviewRow`, `CsvPreviewResult`, `CsvCommitResult` interfaces. Added new API methods. Updated `createEntry` and `updateEntry` field types.

- **src/renderer/components/ImportScreen.tsx** — new component. State machine: idle (format reference table, download template button, choose file button) → loading → previewing (row count, first 5 preview rows with vertical/title/type, error list, confirm/cancel) → committing → done (imported/updated/skipped counts) or error. All transitions driven by `previewCsvImport` and `commitCsvImport` IPC calls.

- **src/renderer/components/EntryForm.tsx** — added `"tool"` to the type selector radio buttons. Updated tags placeholder from "comma, separated, tags" to "pipe|separated|tags".

- **src/renderer/components/SearchBar.tsx**, **VerticalGroup.tsx** — removed unused `React` import (noUnusedLocals fix, pre-existing).

- **src/renderer/App.tsx** — added `"import"` to `AppMode`. Added import button (`↑`) to the header. Wired `ImportScreen` for the import mode. Fixed missing `ResultItem` import (pre-existing bug). Updated empty state copy.

- **src/renderer/styles/global.css** — added styles for: `header-icon-btn`, import screen idle (format table, actions), import screen preview (preview rows, error list), import done, import error, import status messages.

- **docs/ROADMAP.md** — Phase 1 additions all checked off.

## Decisions made

- **Template content bundled as a constant, not a file path.** The template file at `src/store/template/shortpath-template.csv` is the human-editable source, but at runtime it's more reliable to use the bundled string in `CSV_TEMPLATE_CONTENT`. This avoids path resolution issues in packaged Electron apps where source files aren't directly accessible.
- **Two-step import via pending string in main process memory.** `preview-csv-import` stores the CSV string in a module-level variable; `commit-csv-import` reads it. This avoids opening the file dialog twice and doesn't require passing large CSV strings back and forth through IPC.
- **`source` is enforced at the store level, not at the caller level.** `addEntry` always sets `source: "local"`. The preload and IPC types exclude `source` from what callers can send. This makes the guarantee hard to accidentally break from the renderer side.
- **Existing store.json comma-separated tags migrated on load, not on write.** The `migrate()` function converts comma tags to pipe on every `openStore` call. This is idempotent — if tags already contain `|`, they're left alone.

## Commits in this session

- `86d3677` — feat: add source field, tool type, and pipe-separated tags
- `ce0144b` — feat: add preview/commit import, export-mine, download-template IPC
- `3c43fe2` — feat: import screen with preview step, tool type in entry form

## Next steps

Phase 1 additions are complete. Two recommended options for the next session:

**Option A: Phase 3 easy capture features**
- Add-from-clipboard: pre-fill the add form with clipboard contents when the shortcut opens.
- Quick add: minimal form (title + body/url + vertical only; type/tags optional and collapsed).
- Paste-and-split helper: split a multi-section document on headings into multiple entries.

**Option B: Phase 5 Window UX**
- Global hotkey reliability (unregister before re-register, conflict detection).
- Keyboard navigation (arrows, Enter to copy, Esc to dismiss).
- Persist window size/position between launches.
- `shell.openExternal` for link/tool entries.

## Open questions / blockers

- None blocking. Phase 3 easy capture or Phase 5 Window UX are both ready to start.
- Tags entered via the form are stored as-is. The form placeholder says "pipe|separated|tags" but there is no enforcement or auto-formatting. Could add a tag chip input in a future polish pass.
