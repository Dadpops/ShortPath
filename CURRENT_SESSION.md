# Current Session State

**Status:** Phase 10 complete — customization and polish shipped.

**Last session:** [2026-06-08 — Phase 10: customization and polish](docs/sessions/2026-06-08-phase-10.md)

**Open items (post-Phase 10):**
- Add screenshots to README once a signed build is available.
- Investigate chokidar as a replacement for fs.watch on network drives (noted in CHANGELOG Known Limitations).
- Set up auto-update scaffold (electron-updater) so users do not have to manually reinstall for each release.
- Keyboard Tab cycling of vertical tabs only fires when search input is focused or focus is not in an input — users navigating Settings with Tab are not affected.
- The "Sort: Relevance" option label changes to "Most used" in the UI when no query is active to reflect the actual behavior; the stored value remains "relevance".
