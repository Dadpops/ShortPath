# Current Session State

**Status:** Phase 0 complete. Foundation is in place. No features built.

**Last session:** [2026-06-07 — Foundation](docs/sessions/2026-06-07-foundation.md)

**Next up:** Phase 1 — Data layer and import.
First task: implement `src/db/index.ts` to open SQLite on app start and run the schema on first launch.
See [docs/ROADMAP.md](docs/ROADMAP.md) for the full Phase 1 checklist.

**Open questions / blockers:**
- Tray icon is an empty placeholder. Add a minimal PNG asset early in Phase 1.
- Confirm `npm install` succeeds (better-sqlite3 needs node-gyp / native build).
