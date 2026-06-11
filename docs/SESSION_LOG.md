# Session Log

Reverse-chronological. One line per session.

---

- [2026-06-10 — post-release fixes](sessions/2026-06-10-post-release-fixes.md) — Tray icon invisible-on-Windows bug fixed (removed buildActiveIcon/createFromBitmap); results count moved to frozen bottom bar; "show recent entries on focus" setting added; README security note and known issues; v1.0.0 installer rebuilt and re-uploaded.

- [2026-06-10 — v1.0.0 release](sessions/2026-06-10-v1.0.md) — Duplicate Phase 14 removed from roadmap; SetupScreen deleted; entry preview on hover (250ms, portal, below-item); duplicate detection across sync sources; check-for-updates removed; version bumped to 1.0.0.

- [2026-06-10 — run-shortpath project skill](sessions/2026-06-10-run-skill.md) — Project skill written at .claude/skills/run-shortpath/SKILL.md; documents build step, onboarding dismiss, settings nav, help panel second-window capture, and cleanup.

- [2026-06-10 — Complete help topic coverage](sessions/2026-06-10-help-topics.md) — New topics: paste-and-split, export-selected. Updated: settings (6 pages), accent-and-appearance (font family), importing-csv (duplicate detection), recent-copies (24h persistence). App boot verified via Playwright driver.

- [2026-06-10 — Compact Mode settings page; MacroOverlay CI fix](sessions/2026-06-10-compact-mode-settings.md) — Compact Mode settings section added (pin to top, icon size S/M/L, icon color, auto-restore); pin bug fixed (compactAlwaysOnTop now independent of main-window alwaysOnTop, defaults true); MacroOverlay stripHtml → htmlToPlain CI fix.

- [2026-06-10 — Compact mode v2; Stream Deck removal; crash recovery; v0.6.7](sessions/2026-06-10-compact-mode-v2.md) — Stream Deck removed; CSV duplicate folder fix; crash recovery (render-process-gone/unresponsive); compact mode rebuilt: position memory, compact hotkey (Ctrl+Shift+.), summon hotkey restores from compact, toggle button in header, no longer forces always-on-top, close-after-copy enters compact; v0.6.7.

- [2026-06-10 — Compact mode; file share sync folder fix; v0.6.3 release](sessions/2026-06-10-compact-mode.md) — Compact mode (64x64 logo square, restore on click/Esc, persisted across restarts); file share sync now creates folders from subfolder column; shipped as v0.6.3.

- [2026-06-10 — Subfolder search filtering and collapse/expand fix](sessions/2026-06-10-subfolder-search-fix.md) — Zero-result subfolders hidden during search; subExpandSignal wired to non-all-mode renders; collapse → open vertical → subfolders stay closed.
- [2026-06-10 — Nested subfolders, expand-all fix, quick-link button, link-open preference](sessions/2026-06-10-csv-expand-quicklink.md) — Nested subfolder paths in CSV (depth unlimited, ">"-separated); deterministic expand/collapse all including subfolders; ↗ quick-link on any entry with a URL; "Open links in" setting (New tab / New window); vitest + 7 CSV import tests.
- [2026-06-09 — v0.6.0: onboarding, sample data, search mode toggle, README landing page](sessions/2026-06-09-v0.6.0.md) -- 4-step first-run onboarding overlay; 50-entry sample data with installSeedData; search mode toggle (Keyword/Full text); keyboard shortcut editing consolidated into KeyboardPanel; Notes and Favorites card treatment; README revamped with 8 screenshots, gallery, and inline pitch images; v0.6.0.
- [2026-06-09 — Keyboard panel, UX fixes, full keyboard nav](sessions/2026-06-09-ux-fixes.md) — Keyboard shortcuts panel (K button); N letter button for notes; pin moved left; clipboard strip moved to top; pin limit removed; sample data filter bug fixed; sync friendly name refresh fixed; Alt+K/N/H/S shortcuts; Check for updates info note; v0.4.0.
- [2026-06-09 — Friction-point UX improvements](sessions/2026-06-09-friction-points.md) — Sample data onboarding banner; recent copies persist 24h in store; "recently used" sort mode; hotkey in tray tooltip and menu; first-launch notification; configurable pin cap (4/8/12); Stream Deck re-export timestamp; Ctrl+N; search history via up-arrow; empty search state with save-as-entry button.
- [2026-06-09 — Polish and bug fixes: app crash, sync UI, styling](sessions/2026-06-09-polish.md) — Fixed ESM crash (jsdom removed from main process, parsing moved to renderer); 4 TS build errors; Sync management added to SettingsScreen; URL import button styled; btn-link and --color-error added.
- [2026-06-09 — Phase 14: browser capture server, URL import, MD/PDF import, browser extension](sessions/2026-06-09-phase-14.md) — HTTP capture server on port 57433; URL import with Readability section picker in EntryForm; Markdown and PDF drag-in import screens; MV3 Chrome/Firefox extension with context menu, offline queue, and popup; 4 help topics.
- [2026-06-09 — Phase 13: pin window, Tiptap, duplicate detection, Stream Deck export](sessions/2026-06-09-phase-13.md) — Always-on-top pin button; Tiptap rich text editor with toolbar and copy-mode toggle; duplicate detection on CSV import (per-row resolution) and manual add (inline warning); Stream Deck .sdProfile ZIP export; README overhauled for open source.
- [2026-06-09 — Phase 12: onboarding, import UX, notes save, collapse-all, export-selected](sessions/2026-06-09-phase-12.md) — 4-step SetupScreen onboarding wizard; drag-drop CSV import + manual column mapping; notes Save button with auto-save; collapse-all / expand-all toggle; Export Selected checkbox tree replaces Export Mine.
- [2026-06-09 — v0.2.0: chokidar, electron-updater, release, screenshots](sessions/2026-06-09-v0.2.0.md) — chokidar replaces fs.watch; electron-updater replaces manual GitHub API check with in-app download/install flow; v0.2.0 tagged and released; README screenshots via Playwright driver.
- [2026-06-09 — Phase 11: nested sub-folders, delete vertical, check for updates](sessions/2026-06-09-phase-11.md) — Nested SubFolder tree, CSV subfolder column, FolderIcon, delete vertical with confirm, GitHub update check with banner and Settings button, favorites on Support Tools, search clear icon, vertical tab overflow to select.
- [2026-06-08 — Phase 10: customization and polish](sessions/2026-06-08-phase-10.md) — Accent color, opacity, window size, density, vertical tabs, tab order, pin entries, sort control, usage counter, recent copies, keyboard nav upgrades, auto-hide, Settings reorganization.
- [2026-06-08 — Release prep: bug fixes, polish, v0.1.0](sessions/2026-06-08-release-prep.md) — Platform-aware hotkey, tag normalisation, empty states, Esc query-clear, CHANGELOG, README polish, Windows build, v0.1.0 tag.
- [2026-06-08 — Sub-folders, danger zone, close button](sessions/2026-06-08-subfolders-danger-zone.md) — Sub-folders per vertical (Settings + EntryForm + results grouping), clear-local-entries danger zone, ✕ close button, README rewrite.
- [2026-06-08 — Polish and new features](sessions/2026-06-08-polish-features.md) — ESLint CI fix, shadow, drag fix, font scaling, add-vertical, note-entry linking, data info buttons.
- [2026-06-08 — Rounded window, recents dropdown, Notes](sessions/2026-06-08-rounded-window-notes.md) — Transparent floating window, recents dropdown on search focus, internal Notes CRUD system.
- [2026-06-08 — UI improvements](sessions/2026-06-08-ui-improvements.md) — Slider, light/dark mode, auto-local, minimize btn, FAB, vertical rename, collapsible settings.
- [2026-06-08 — Phase 9 packaging](sessions/2026-06-08-phase9-packaging.md) — electron-builder targets, dist:win/mac scripts, SIGNING.md, INSTALLING.md, RELEASING.md.
- [2026-06-08 — Post-phase features](sessions/2026-06-08-postphase-features.md) — Text size, favorites, source-mode setup, in-overlay editing, disconnect sync.
- [2026-06-08 — Phase 8 polish](sessions/2026-06-08-phase8-polish.md) — Entrance animation, tray icon active state, rawGroups perf split, empty state copy fix.
- [2026-06-08 — Phase 6 + 7 + UI cleanup](sessions/2026-06-08-phase6-7-ui.md) — Support Tools grid, Help panel (all 16 topics), clean header (clipboard icon, ? help), Settings data section.
- [2026-06-08 — Phase 4 shared-file sync](sessions/2026-06-08-phase4-sync.md) — File watcher, replaceSyncedEntries, sync settings UI, source badge. All Phase 4 tasks complete.
- [2026-06-08 — Macro overlay](sessions/2026-06-08-macro-overlay.md) — Click result or Enter to open full-entry panel with copy, URL link, tag chips. Esc dismisses overlay before focus/window.
- [2026-06-08 — Phase 5 window UX](sessions/2026-06-08-phase5-window-ux.md) — Keyboard nav, hotkey reliability, shell.openExternal, persisted window bounds, settings screen. All Phase 5 tasks complete.
- [2026-06-08 — Phase 3 easy capture](sessions/2026-06-08-phase3-easy-capture.md) — Clipboard banner, quick add (type/tags collapsed), paste-and-split on markdown headings. All Phase 3 additions complete.
- [2026-06-07 — Phase 1 additions](sessions/2026-06-07-phase1-additions.md) — Source field, tool type, pipe tags, two-step import screen with preview, download template, export mine. All Phase 1 additions complete.
- [2026-06-07 — Sync + capture roadmap revision](sessions/2026-06-07-sync-capture-planning.md) — Add source field, shared-file sync model, easy capture features, new Phase 4 (sync), renumber phases to 9 total.
- [2026-06-07 — Phase 1 addendum: CSV template + Help system planning](sessions/2026-06-07-phase1-addendum-csv-help.md) — Lock CSV schema, specify import preview UX, design Help system, add Phase 6, renumber phases.
- [2026-06-07 — Phase 3 entry management](sessions/2026-06-07-phase3-entry-management.md) — Add/edit/delete entry forms, recents tracking, user-defined verticals, edit button on results.
- [2026-06-07 — Phase 1 + Phase 2 demo build](sessions/2026-06-07-phase1-phase2-demo.md) — Data layer + keyword search UI built. App is in demo state with seed data and working search.
- [2026-06-07 — Course correction](sessions/2026-06-07-course-correction.md) — Stack realigned: SQLite/FTS5 dropped, JSON store + Fuse.js + PapaParse adopted, hotkey/keyboard UX moved to Phase 4 core.
- [2026-06-07 — Foundation](sessions/2026-06-07-foundation.md) — Repo created, full scaffold committed, docs written, bare Electron tray app running.
