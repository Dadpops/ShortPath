# Session — 2026-06-07 (Course correction)

## Goal

Bring the existing foundation docs, scaffolding, and roadmap in line with refined product decisions. No new features built. All changes are realignment.

## What changed

- **package.json:** Removed `better-sqlite3` and its `@types` package. Added `fuse.js` and `papaparse` as runtime dependencies.
- **src/db/ renamed to src/store/:** Reflects the shift from SQLite to local JSON storage. The folder now contains stubs for JSON store I/O, CSV import/export, and the store schema type.
- **src/store/schema.sql deleted.** Replaced by `src/store/schema.ts` — TypeScript types and defaults for the JSON store structure.
- **src/shared/types.ts:** Entry `id` changed from `integer` to `string` (UUID). Added `Vertical` type. Updated IPC channel list (removed `search` channel — search now runs in renderer). Added `FuseMatch` and updated `SearchResult` to carry match ranges for highlighting.
- **src/main/index.ts:** Added `globalShortcut` import. Added `registerHotkey` stub wired to `toggleWindow`. Registers `CommandOrControl+Shift+Space` as a placeholder default. Added `will-quit` handler to unregister all shortcuts.
- **src/renderer/features/keyboard/index.ts:** New stub for Phase 4 keyboard navigation (arrow keys, Enter to copy, Esc to dismiss).
- **docs/ARCHITECTURE.md:** Full rewrite of storage and search sections. JSON store described. Fuse.js in-renderer search described. CSV import/export flow described. SQLite noted as a future option only. Hotkey/tray window model described. IPC table updated.
- **docs/DATA_MODEL.md:** Entry schema updated (id is now UUID string, noted why). JSON store structure documented. FTS5 strategy removed and replaced with Fuse.js indexing and weighting approach. CSV import/export format retained.
- **docs/ROADMAP.md:** Restructured from 6 phases to 7. Phase 1 is now JSON store + CSV. Phase 2 is Fuse.js keyword search. Phase 3 is copy + entry management. Phase 4 is window UX and keyboard navigation (moved from old Phase 5 "polish" to core). Phase 5 is Support Tools. Phase 6 is polish. Phase 7 is packaging. Phase 0 checkmarks preserved.
- **CLAUDE.md:** Tech stack section updated. Folder map updated (src/db -> src/store, keyboard feature added).
- **README.md:** Tech stack updated. "What it does" section updated to mention hotkey-first interaction.

## Decisions made

- **No SQLite, no FTS5.** The original choice assumed a full-text search engine was needed. For a single agent's resource set, an in-memory Fuse.js index is faster to build, simpler to maintain, and avoids the native build complexity of better-sqlite3. SQLite is documented as a future option if entry counts grow significantly.
- **Search runs in the renderer, not main.** Main sends the full entry list to renderer on open. Fuse.js queries happen locally with no IPC per keystroke. This makes search feel instant and removes the need for a search IPC channel.
- **UUID strings for entry IDs.** Auto-increment integers require a database sequence. UUID strings work in a flat JSON file and do not collide between CSV-imported entries and manually created ones.
- **Hotkey and keyboard navigation moved from Phase 5 to Phase 4 (core).** Speed is the product. A hotkey-first, keyboard-navigable experience is a fundamental behavior, not polish. It belongs in an early phase.
- **PapaParse for CSV.** Well-tested, widely used, works in both Node (main process) and browser (renderer if ever needed). No native build step.
- **No AI, no embeddings.** ShortPath does not embed any AI. Search is deterministic keyword matching. This is intentional and permanent for v1.

## Commits in this session

- `c33b355` — chore: drop better-sqlite3, add fuse.js and papaparse
- `714cd39` — docs: rewrite ARCHITECTURE and DATA_MODEL for JSON store and Fuse.js search
- `4371877` — docs: revise roadmap — JSON store, Fuse.js search, hotkey UX moved to Phase 4 core
- `b84d8eb` — refactor: rename src/db to src/store, update stubs for JSON/Fuse.js/hotkey approach
- `63ba6fd` — docs: update CLAUDE.md and README to reflect JSON store, Fuse.js, PapaParse, hotkey-first model

## Next steps

1. Begin Phase 1.
2. First task: implement `src/store/index.ts` — open or create `store.json` in userData on app start, return the parsed `StoreData` object, handle version 1 default.
3. Second task: wire an IPC handler for `load-entries` so the renderer can receive the full entry list when the window opens.
4. Add a minimal PNG tray icon to replace the empty placeholder (still needed from the original foundation session).

## Open questions / blockers

- Tray icon is still an empty placeholder. May be invisible or crash on some OSes. Priority in Phase 1.
- `fuse.js` and `papaparse` are listed in package.json but not yet installed (`npm install` not yet run in this repo). Run `npm install` before starting Phase 1 work.
