# 2026-06-08 — Release prep: bug fixes, polish, v0.1.0

## What was done

### Section 1 — Bug fixes

**1.1 Platform-aware hotkey display**

Added `src/shared/platform.ts` with `formatAccelerator(acc, platform)`. Exposed `platform: process.platform` via the preload context bridge. Replaced the hardcoded `displayAccelerator` function in `SettingsScreen.tsx` with the shared utility so macOS shows "Cmd" and Windows/Linux show "Ctrl" in all hotkey display strings.

**1.2 Tag normalisation on blur**

Added `normalizeTags(raw)` in `EntryForm.tsx`. Tags input fires `onBlur` to normalise the field: splits on `|` or `,`, trims each token, filters blanks, rejoins with `|`. Updated placeholder to `billing|refund|payment`. Added always-visible `.form-hint` below the field.

### Section 2 — Polish

**2.2 Empty state messages**

- Search: "No matches for `X` -- try a different keyword."
- Notes list: "No notes yet. Add one to get started."
- Favorites already had correct copy; no change needed.

**2.3 Entry count format**

Group header count badge removed. Count is now inline in the label as `Label (N)` for cleaner reading. `.group-count` CSS changed from blue pill to muted text (then removed from the JSX entirely as it is now part of `.group-label`).

**2.4 Window-level Esc with query-clear step**

`handleEscape` now clears the search query before hiding the window. A `window.addEventListener("keydown")` effect handles Esc from anywhere outside INPUT/TEXTAREA elements (those already fire `onEscape` via the SearchBar prop).

**2.5 CHANGELOG.md**

Created at repo root in Keep a Changelog format. Covers all Added, Fixed, and Known Limitations for v0.1.0 (including the fs.watch/network-drive caveat and the unsigned-build SmartScreen warning).

**2.6 README polish**

Added `## Installation` section with platform table and data-folder note. Added `## Screenshots` placeholder. Updated `## Status` to say v0.1.0 and link to CHANGELOG.

### Section 3 — Release prep

**3.1 Build**

`npm run build` and `npm run dist:win` both passed cleanly. Installer: `release/ShortPath Setup 0.1.0.exe`. Smoke test via Playwright confirmed the built binary launches, shows the window, and accepts search input.

**3.2 Tag**

`v0.1.0` tag moved to current HEAD (`5e48778`) and force-pushed to origin. Previous tag pointed to an older docs commit.

## Commits

- `9c0d99c` fix: platform-aware hotkey display and tag normalization on blur
- `8351b5a` feat: polish empty states, Esc behaviour, and entry count format
- `5e48778` docs: CHANGELOG and README for v0.1.0

## Files changed

- `src/shared/platform.ts` (new)
- `src/preload/index.ts`
- `src/renderer/global.d.ts`
- `src/renderer/components/SettingsScreen.tsx`
- `src/renderer/components/EntryForm.tsx`
- `src/renderer/styles/global.css`
- `src/renderer/App.tsx`
- `src/renderer/components/NotesView.tsx`
- `src/renderer/components/VerticalGroup.tsx`
- `CHANGELOG.md` (new)
- `README.md`

## Decisions

- `formatAccelerator` lives in `src/shared/` so both main and renderer can use it if needed.
- Tag was force-pushed because the old `v0.1.0` pointed to a stale commit from an earlier session.
- Smoke test used `playwright-core` (already a dev dependency); full `playwright` package is not installed.

## What is next

- Add screenshots to README after first signed build.
- Investigate chokidar as a replacement for `fs.watch` on network drives (noted in CHANGELOG Known Limitations).
- Set up auto-update scaffold (Squirrel/electron-updater) as a post-v0.1.0 task.
