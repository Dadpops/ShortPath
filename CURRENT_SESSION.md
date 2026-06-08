# Current Session State

**Status:** Sync + capture planning done. `source` field added to schema, shared-file sync architecture documented, easy capture features added to Phase 3, new Phase 4 (sync) added, phases renumbered to 9 total. No feature code built.

**Last session:** [2026-06-07 — Sync + capture roadmap revision](docs/sessions/2026-06-07-sync-capture-planning.md)

**Next up — two paths, decide at session start:**

**Path A (recommended): Phase 1 additions first**
The `source` field needs to be in the code before more entries are created, and the CSV schema fixes should land before any real imports happen.
1. Add `source: "local" | "synced"` to `Entry` in `src/shared/types.ts`.
2. Update `src/store/index.ts`: set `source: "local"` on `addEntry`, backfill `source: "local"` for entries missing the field on `openStore`.
3. Update `src/store/csv.ts`: rename `link` column to `url`, switch tag separator to `|`, add `source` inference on import.
4. Add `tool` type to `src/shared/types.ts` and EntryForm.tsx.
5. Wire `download-template-csv` IPC handler and import screen preview step.
6. Then move to Phase 3 easy capture OR Phase 5 Window UX.

**Path B: Phase 5 Window UX first**
Hotkey and keyboard navigation are the core product UX. Phase 1 additions are schema correctness work that can slot in as a short sprint before first real user imports.

**Open questions / blockers:**
- CSV currently uses comma tags and a `link` column. Do not hand to real users until Phase 1 additions are done.
- File watcher for Phase 4 sync: `fs.watch` (built-in, some reliability issues) vs `chokidar` (additional dependency). Decide when Phase 4 starts.
- Paste-and-split heading heuristic: markdown `#`? All-caps lines? Decide when building the feature.
