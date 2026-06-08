# Current Session State

**Status:** Phase 1 addendum planned. CSV schema locked, Help system designed, ROADMAP updated, Phase 1 additions tasks added. No feature code built this session.

**Last session:** [2026-06-07 — Phase 1 addendum: CSV template + Help system planning](docs/sessions/2026-06-07-phase1-addendum-csv-help.md)

**Next up (two options — decide at start of next session):**

**Option A (recommended): Complete Phase 1 additions first**
- Update `src/shared/types.ts`: add `"tool"` to the Entry type union.
- Update `src/store/csv.ts`: rename `link` column to `url`; change tag separator from `,` to `|`.
- Update `src/renderer/components/EntryForm.tsx`: add `tool` to the type selector.
- Add `download-template-csv` IPC handler in main (dialog.showSaveDialog, copies template file).
- Build the import screen with inline format reference, template download button, and preview step.
- Then move into Phase 4.

**Option B: Jump to Phase 4 now**
- Phase 1 additions are correctness fixes; they don't block Phase 4.
- Do Phase 1 additions as a short cleanup sprint before first real user import.

**Open questions / blockers:**
- The CSV currently uses comma-separated tags and a `link` column. If anyone exports and re-imports before Phase 1 additions are done, the round-trip will be inconsistent. Resolve before handing to real users.
