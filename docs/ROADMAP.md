# ShortPath Roadmap

Phases are sequential. Each phase has a checklist. Mark tasks done as they complete.

---

## Phase 0 — Foundation

Goal: repo, scaffold, docs, tray window proof, version-control workflow.

- [x] Initialize git repository
- [x] Create GitHub repo (private, Dadpops/ShortPath)
- [x] .gitignore for Node + Electron
- [x] package.json with all dependencies declared
- [x] tsconfig.json (renderer) and tsconfig.main.json (main process)
- [x] eslint config
- [x] electron-builder.yml
- [x] vite.config.ts
- [x] Folder scaffold: src/main, src/preload, src/renderer, src/shared, src/store
- [x] Placeholder/stub files in every folder
- [x] Bare Electron tray app: opens a resizable window at bottom-left
- [x] React renderer: placeholder shell with design tokens
- [x] CLAUDE.md (session orientation)
- [x] CURRENT_SESSION.md (live pointer)
- [x] README.md
- [x] ROADMAP.md (this file)
- [x] ARCHITECTURE.md
- [x] DATA_MODEL.md
- [x] docs/SESSION_LOG.md
- [x] docs/sessions/SESSION_TEMPLATE.md
- [x] docs/sessions/2026-06-07-foundation.md
- [x] GitHub Actions CI: lint + typecheck on push/PR
- [x] Commits in small logical chunks, pushed to origin

---

## Phase 1 — Data layer

Goal: working local JSON store with CSV import/export and seed data.

- [x] Define JSON store structure (store.json): version, entries array, verticals array
- [x] Write store module (src/store/index.ts): open, read, write, migrate on version bump
- [x] IPC handlers in main: load-entries, create-entry, update-entry, delete-entry
- [x] Expose store operations to renderer via preload bridge
- [x] CSV import (PapaParse): parse file, validate required columns, merge into store
- [x] CSV export (PapaParse): serialize store to CSV, write to user-chosen path
- [x] Seed data: sample entries across all built-in verticals
- [x] Basic error handling: malformed CSV rows skipped with a warning returned to renderer
- [x] Tray icon: replace empty placeholder with a minimal PNG asset

**Phase 1 additions — CSV template and locked schema:**

- [ ] Lock CSV schema: canonical column order is `title, vertical, type, body, url, tags`
- [ ] Update csv.ts: rename the CSV column from `link` to `url` (maps to internal `Entry.link` field)
- [ ] Update csv.ts: switch tag separator from comma (`,`) to pipe (`|`) in both import and export
- [ ] Add `tool` as a valid `type` value in `src/shared/types.ts` (join: `reply | doc | link | sop | tool`)
- [ ] Update EntryForm.tsx: add `tool` to the type selector radio buttons
- [ ] Static template file `src/store/template/shortpath-template.csv` — created; confirm it's correct before adding the download button
- [ ] IPC handler: `download-template-csv` — copies template file to user-chosen path via dialog.showSaveDialog
- [ ] Import screen (renderer): show inline format reference — column table, pipe-tag note, multi-line body note
- [ ] Import screen: download template button triggers `download-template-csv` IPC
- [ ] Import preview step: parse on file select, show first 5 rows + total count + flagged rows, user confirms before commit

---

## Phase 2 — Keyword search

Goal: the core search experience working end-to-end.

- [x] On window open: main sends full entry list to renderer via load-entries IPC
- [x] Fuse.js index built in renderer from entry list
- [x] Search bar component (debounced, ~100ms)
- [x] Fuse.js query on each keystroke: title-weighted, tag-aware, conservative fuzzy threshold
- [x] Group results by vertical with hit counts
- [x] VerticalGroup component: header with hit count, expand/collapse toggle
- [x] ResultList component: renders entries within a group
- [x] Folder-path style result display (vertical / title)
- [x] Highlight matched terms in results (using Fuse.js match ranges)
- [x] Recents shown when search box is empty (last 10 opened/copied entries)
- [x] Per-vertical filter: scope search to one vertical at a time
- [x] Empty state (no results) and loading state
- [ ] Write Help topics for Phase 2 features — done as part of Phase 6 Help System

---

## Phase 3 — Copy and entry management

Goal: users can copy results and manage their own entries.

- [x] CopyButton component: writes entry body or link to clipboard
- [x] Track recents: record entry access on copy or open
- [x] Add entry form: title, body, link, tags, type, vertical
- [x] Edit entry form
- [x] Delete entry with confirmation
- [x] User-defined verticals: create and name custom categories
- [ ] Write Help topics for Phase 3 features — done as part of Phase 6 Help System

---

## Phase 4 — Window UX (core, not polish)

Goal: keyboard-first interaction that makes the app genuinely fast.

- [ ] Global hotkey to summon and dismiss the popup (configurable, default: Cmd/Ctrl+Shift+Space)
- [ ] On hotkey: show window, focus search box immediately
- [ ] Hotkey conflict detection: warn if registration fails, show actionable message
- [ ] Keyboard navigation: arrow keys move through results, Enter copies focused result, Esc dismisses
- [ ] Fix `window.open(link)` → use `shell.openExternal` via IPC (quick win)
- [ ] Persist window size and position between launches
- [ ] Tray menu: Show, Import CSV, Export CSV, Settings, Quit
- [ ] Settings surface: change hotkey, reset position
- [ ] Write Help topics for Phase 4 features (keyboard shortcuts, hotkey config, window management)

---

## Phase 5 — Support Tools section

Goal: dedicated surface for quick-access utilities and links.

- [ ] Support Tools vertical with distinct UI treatment
- [ ] Add/edit/remove tool entries (links + labels)
- [ ] Quick-launch: open link in default browser via shell.openExternal
- [ ] Reorder tools via drag or keyboard
- [ ] Write Help topics for Phase 5 features (Support Tools section, reordering)

---

## Phase 6 — Help system

Goal: in-app, searchable help covering every feature. No browser, no external links.

- [ ] Help button `?` in main window header (top-right, next to add button)
- [ ] Help panel: slide-over or in-window view — NOT a separate BrowserWindow, NOT shell.openExternal
- [ ] Help panel: dismissable with Esc or a close `×` button
- [ ] Help panel: search box that filters topics by title and content keywords
- [ ] Help topic data structure stubbed at `src/renderer/features/help/topics.ts`
- [ ] Author all 16 Help topics with full content:
  - Getting started (what ShortPath is, how to install and launch)
  - Opening and closing (hotkey, tray click, Esc to dismiss)
  - Searching (fuzzy search, tips for good queries, minimum 2 chars)
  - Understanding results (verticals, hit counts, expand/collapse groups)
  - Copying an entry (copy button, what gets copied, keyboard shortcut)
  - Keyboard navigation (arrows, Enter to copy, Esc to dismiss)
  - Filtering by vertical (per-vertical scope filter)
  - Recents (what they are, how they update, capped at 10)
  - Adding an entry (form fields, types, pick or create a vertical)
  - Editing and deleting (edit button, inline delete confirmation)
  - Managing verticals (create, rename, which are built-in)
  - Importing a CSV (template, column format, pipe tags, preview step)
  - Exporting a CSV (what's included, how to re-import)
  - Support Tools (dedicated vertical, quick-launch links, reordering)
  - Settings (change hotkey, reset window position)
  - Troubleshooting (hotkey conflicts, app not opening, entries missing)
- [ ] Retroactively write Help content for Phase 1–3 features (CSV import/export, search, entry management)

---

## Phase 7 — Polish

Goal: app feels intentional and complete.

- [ ] Finalize design tokens and typography
- [ ] Show/hide animation for the popup
- [ ] Tray icon states (active/inactive)
- [ ] Consistent empty and error states throughout
- [ ] Performance check: search should feel instant on datasets up to ~10k entries

---

## Phase 8 — Packaging and distribution

Goal: installable builds for Windows and Mac.

- [ ] electron-builder targets: NSIS (Windows), DMG (Mac)
- [ ] Code signing: document Apple Developer cert and Windows signing requirements (certificates not committed)
- [ ] Auto-update scaffold (electron-updater) — optional for v1
- [ ] Build and release scripts in package.json
- [ ] First tagged release (v0.1.0) on GitHub
