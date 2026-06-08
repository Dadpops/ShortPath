# Session — 2026-06-07 (Phase 1 Addendum: CSV template + Help system planning)

## Goal

Planning and documentation session. Lock the CSV schema, specify the CSV template and import preview UX, design the in-app Help system, and update all planning docs accordingly. No feature code built in this session.

## What changed

- **docs/DATA_MODEL.md** — rewrote the CSV section. Locked column order to `title, vertical, type, body, url, tags`. Changed tag separator from comma to pipe (`|`). Renamed the CSV column from `link` to `url` (maps to internal `Entry.link`). Added `tool` to valid types. Documented multi-line body round-trip behavior. Added import preview step spec. Added template file reference. Added internal field name vs CSV column name mapping note.
- **src/store/template/shortpath-template.csv** — created. Contains header row and four example rows: a saved reply with multi-line body and pipe-separated tags, a documentation entry with both body and URL, an internal SOP with multi-step body, and a support tool entry (URL only).
- **docs/ROADMAP.md** — three sets of changes:
  1. Phase 1 additions section added with 10 new tasks covering locked schema, `url` column rename, pipe-tag change, `tool` type, template download IPC handler, import screen format reference, and import preview step.
  2. Phase 2 and 3 each got an unchecked "Write Help topics" task (resolved in Phase 6). Phases 4 and 5 got the same task as part of their normal checklists.
  3. New Phase 6 (Help System) added with 16 topic definitions and full scope. Old Phase 6 (Polish) renumbered to Phase 7. Old Phase 7 (Packaging) renumbered to Phase 8.
- **CLAUDE.md** — added "Standing rule: Help topics" section. Rule: any user-facing feature change must update its Help topic in the same commit. Also added `help/` to the feature module folder map.
- **src/renderer/features/help/topics.ts** — stub created. Defines the `HelpTopic` interface and the full `HELP_TOPICS` array with all 16 topics. Content strings are empty; each will be authored when the corresponding feature phase ships. Tags are indexed so the Help panel search works from day one of Phase 6.

## Decisions made

- **Pipe separator for tags in CSV.** Tags use `|`, not `,`. Commas in a CSV cell require quoting and can be confused with the field separator. Pipe is unambiguous and still human-readable. All existing entries in the store use a `tags: string` field already — the separator is an internal convention, not a schema change.
- **CSV column named `url`, internal field named `link`.** The CSV-facing name `url` is more intuitive to non-developers who fill out the template. The internal field stays `link` (renaming it would touch more code). The import/export layer is the right place to translate between them.
- **`tool` added as a type.** The Support Tools vertical contains tool entries; the `type` field should reflect this. Existing entries can have `type: "link"` or `type: "tool"` — both are valid for links, but `tool` gives a more specific rendering hint for the Support Tools section in Phase 5.
- **Import preview before commit.** Users importing a large CSV should see what they're about to do before it writes. Preview step shows row count, first 5 rows, and flagged rows. This prevents bad data from silently entering the store.
- **Help panel is in-window, not a new BrowserWindow.** A separate window would need its own IPC plumbing, wouldn't inherit the popup's position, and would feel out of place for a tray app. An in-window slide-over or view replacement is the correct pattern for a 480px popup.
- **Help topics stub created now, not in Phase 6.** Having the structure committed means any feature PR from Phase 4 onward can update its topic in the same change rather than deferring to Phase 6. The empty content strings are a forcing function to fill them in, not dead code.

## Commits in this session

- See below (committed at session close).

## Next steps

1. Begin Phase 1 additions: update `src/shared/types.ts` to add `tool` type, update `src/store/csv.ts` for `url` column and pipe-separated tags.
2. Or proceed directly to Phase 4 (Window UX) — Phase 1 additions are schema correctness improvements and can slot in before the first real production import.
3. Rebuild and smoke-test before Phase 4: `npm run build && npm run electron`.

## Open questions / blockers

- Phase 1 additions should be done before any real CSV is imported by a user. Decide whether to complete them before Phase 4 (recommended) or defer until after Phase 4.
