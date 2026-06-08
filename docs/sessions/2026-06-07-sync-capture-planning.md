# Session — 2026-06-07 (Sync + capture roadmap revision)

## Goal

Planning and documentation session. Add the team sync story and easy capture story to the data model, architecture, and roadmap. No feature code built.

## What changed

- **docs/DATA_MODEL.md** — added `source: "local" | "synced"` to the Entry schema (table, TypeScript interface, and explanation section). Added note explaining why the field exists now (guarantees the sync-never-clobbers promise before Phase 4 lands). Added a note to the CSV section that `source` is not a CSV column and how the value is inferred at import time.

- **docs/ARCHITECTURE.md** — added "Sync model" section: shared-file approach (Drive/Dropbox/OneDrive folder, local path, one-time setup), file watching, auto-refresh, sync operations table (refresh synced, clear synced, export all, export mine), core guarantee (sync only touches source:synced entries), and explicit out-of-scope list (hosted backend, connectors, multi-writer). Added "Product strategy" section: local-first, capture-driven, bottom-up fill. Updated IPC contract table with new channels (record-access, export-mine, configure-sync, refresh-synced, clear-synced, download-template-csv, store-updated push). Updated folder structure to include keyboard/, help/, and store/template/.

- **docs/ROADMAP.md** — three sets of changes:
  1. Phase 1 additions: added `source` field tasks (add to types, set on create, backfill on load).
  2. Phase 3 additions: added easy capture features (add-from-clipboard, quick add, paste-and-split) with framing note about their role in the onboarding play.
  3. New Phase 4 (Shared-file sync): 12 tasks covering configure path, file watcher, auto-refresh, manual refresh, synced import, merge rule, clear synced, export all, export mine, IPC handlers, visual distinction, Help topics. Out-of-scope callout after the checklist.
  4. Renumbered: old Phase 4 (Window UX) -> Phase 5, old Phase 5 (Support Tools) -> Phase 6, old Phase 6 (Help System) -> Phase 7, old Phase 7 (Polish) -> Phase 8, old Phase 8 (Packaging) -> Phase 9.
  5. Phase 5 Settings surface updated to mention sync path config.
  6. Phase 7 Help topics list updated: exporting now distinguishes "export all" vs "export mine," troubleshooting topic includes sync, Settings topic includes sync.

- **CLAUDE.md** — added "Core principles" section with two principles: (1) sync never modifies local entries, enforced in sync functions not callers; (2) local-first, no network calls.

## Decisions made

- **`source` goes into the schema now, not in Phase 4.** The sync guarantee ("local entries are never touched") must be enforceable in code from the first entry ever created. Adding the field now means no migration is needed when Phase 4 ships and no ambiguity about which entries are safe to replace.
- **The shared file is just a file path, not a hosted service.** Drive/Dropbox/OneDrive mounts the shared folder as a local directory. ShortPath watches a local path. This gives teams a real sync story with zero infrastructure on our side.
- **Export mine is the bottom-up path.** Solo agents build their own library for selfish reasons (it's useful to them today). When the team adopts ShortPath, "export mine" lets each agent hand their library to the admin. The shared master fills up from actual usage rather than a top-down migration project.
- **Easy capture belongs in Phase 3, not a later phase.** These features (clipboard capture, quick add, paste-and-split) serve the solo user with no dependency on sync. They are what makes the "collect everything" habit stick. Putting them in Phase 3 keeps them in the core product, not an afterthought.
- **Out-of-scope is documented in ARCHITECTURE.md and the Phase 4 checklist.** Connectors, hosted backend, multi-writer editing are explicitly listed as deliberate exclusions so future sessions don't revisit them without intent.

## Commits in this session

- See below (committed at session close).

## Next steps

Phase 1 additions are the most pressing — specifically adding `source` to the type and backfilling the store — because every entry created from now on should have `source: "local"` and later synced entries need `source: "synced"`. Recommended order:

1. Complete Phase 1 additions (source field, url column rename, pipe-tag separator, tool type, import preview).
2. Phase 3 easy capture features (clipboard capture, quick add, paste-and-split).
3. Phase 4 shared-file sync.
4. Phase 5 Window UX.

Or: jump to Phase 5 (Window UX) if the hotkey and keyboard experience are the priority, and fold Phase 1 additions in alongside it.

## Open questions / blockers

- File watcher library: `fs.watch` is built-in but has known reliability issues on some platforms. `chokidar` is the standard alternative (additional dependency). Decide when Phase 4 starts.
- Paste-and-split: heading detection heuristic (markdown `#` headings? All-caps lines? First line of each paragraph?). Decide when building the feature.
