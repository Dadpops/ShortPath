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

- [ ] Define JSON store structure (store.json): version, entries array, verticals array
- [ ] Write store module (src/store/index.ts): open, read, write, migrate on version bump
- [ ] IPC handlers in main: load-entries, create-entry, update-entry, delete-entry
- [ ] Expose store operations to renderer via preload bridge
- [ ] CSV import (PapaParse): parse file, validate required columns, merge into store
- [ ] CSV export (PapaParse): serialize store to CSV, write to user-chosen path
- [ ] Seed data: sample entries across all built-in verticals
- [ ] Basic error handling: malformed CSV rows skipped with a warning returned to renderer
- [ ] Tray icon: replace empty placeholder with a minimal PNG asset

---

## Phase 2 — Keyword search

Goal: the core search experience working end-to-end.

- [ ] On window open: main sends full entry list to renderer via load-entries IPC
- [ ] Fuse.js index built in renderer from entry list
- [ ] Search bar component (debounced, ~100ms)
- [ ] Fuse.js query on each keystroke: title-weighted, tag-aware, conservative fuzzy threshold
- [ ] Group results by vertical with hit counts
- [ ] VerticalGroup component: header with hit count, expand/collapse toggle
- [ ] ResultList component: renders entries within a group
- [ ] Folder-path style result display (vertical / title)
- [ ] Highlight matched terms in results (using Fuse.js match ranges)
- [ ] Recents shown when search box is empty (last 10 opened/copied entries)
- [ ] Per-vertical filter: scope search to one vertical at a time
- [ ] Empty state (no results) and loading state

---

## Phase 3 — Copy and entry management

Goal: users can copy results and manage their own entries.

- [x] CopyButton component: writes entry body or link to clipboard
- [x] Track recents: record entry access on copy or open
- [x] Add entry form: title, body, link, tags, type, vertical
- [x] Edit entry form
- [x] Delete entry with confirmation
- [x] User-defined verticals: create and name custom categories

---

## Phase 4 — Window UX (core, not polish)

Goal: keyboard-first interaction that makes the app genuinely fast.

- [ ] Global hotkey to summon and dismiss the popup (configurable, default: e.g. Cmd/Ctrl+Shift+Space)
- [ ] On hotkey: show window, focus search box immediately
- [ ] Keyboard navigation: arrow keys move through results, Enter copies focused result, Esc dismisses
- [ ] Persist window size and position between launches
- [ ] Tray menu: Show, Import CSV, Export CSV, Settings, Quit
- [ ] Settings surface: change hotkey, reset position

---

## Phase 5 — Support Tools section

Goal: dedicated surface for quick-access utilities and links.

- [ ] Support Tools vertical with distinct UI treatment
- [ ] Add/edit/remove tool entries (links + labels)
- [ ] Quick-launch: open link in default browser
- [ ] Reorder tools via drag or keyboard

---

## Phase 6 — Polish

Goal: app feels intentional and complete.

- [ ] Finalize design tokens and typography
- [ ] Show/hide animation for the popup
- [ ] Tray icon states (active/inactive)
- [ ] Consistent empty and error states throughout
- [ ] Performance check: search should feel instant on datasets up to ~10k entries

---

## Phase 7 — Packaging and distribution

Goal: installable builds for Windows and Mac.

- [ ] electron-builder targets: NSIS (Windows), DMG (Mac)
- [ ] Code signing: document Apple Developer cert and Windows signing requirements (certificates not committed)
- [ ] Auto-update scaffold (electron-updater) — optional for v1
- [ ] Build and release scripts in package.json
- [ ] First tagged release (v0.1.0) on GitHub
