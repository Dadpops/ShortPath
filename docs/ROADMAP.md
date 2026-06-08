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
- [x] Folder scaffold: src/main, src/preload, src/renderer, src/shared, src/db
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

## Phase 1 — Data layer and import

Goal: working local database with CSV import/export and seed data.

- [ ] Open SQLite database on app start (path in user data dir)
- [ ] Create schema on first run (entries table + FTS5 virtual table + triggers)
- [ ] IPC handlers: ping, search, get-entry, create-entry, update-entry, delete-entry
- [ ] CSV import: parse file, validate columns, bulk insert entries
- [ ] CSV export: dump all entries to file
- [ ] Seed data: sample entries across all built-in verticals
- [ ] Expose db operations to renderer via preload bridge
- [ ] Basic error handling for malformed CSV

---

## Phase 2 — Cross-vertical search

Goal: the core search experience working end-to-end.

- [ ] Search bar component in renderer
- [ ] FTS5 query from renderer via IPC on each keystroke (debounced)
- [ ] Group results by vertical with hit counts
- [ ] VerticalGroup component: header with hit count, expand/collapse toggle
- [ ] ResultList component: renders entries within a group
- [ ] Folder-path style result display (vertical / title)
- [ ] Highlight matched terms in result snippets (FTS5 snippet function)
- [ ] Empty state and loading state

---

## Phase 3 — Copy and entry management

Goal: users can copy results and manage their own entries.

- [ ] CopyButton component: writes entry body or link to clipboard via IPC
- [ ] Add entry form: title, body, link, tags, type, vertical
- [ ] Edit entry form
- [ ] Delete entry with confirmation
- [ ] User-defined verticals: create and name custom categories
- [ ] User shortcuts: pin frequently used entries
- [ ] Persist window size and position between sessions

---

## Phase 4 — Support Tools section

Goal: dedicated surface for quick-access utilities and links.

- [ ] Support Tools vertical with distinct UI treatment
- [ ] Add/edit/remove tool entries (links + labels)
- [ ] Quick-launch: open link in default browser
- [ ] Reorder tools via drag or keyboard

---

## Phase 5 — Polish and window UX

Goal: app feels intentional and fast.

- [ ] Finalize design tokens and typography
- [ ] Bottom-left popup behavior: show/hide with smooth animation
- [ ] Resize persistence across sessions
- [ ] Tray icon with real asset (not empty placeholder)
- [ ] Global show/hide hotkey (configurable)
- [ ] Keyboard navigation throughout (arrow keys, Enter to copy, Escape to close)
- [ ] Context menu on tray icon (Show, Quit)
- [ ] Performance: search should feel instant on datasets up to ~10k entries

---

## Phase 6 — Packaging and distribution

Goal: installable builds for Windows and Mac.

- [ ] electron-builder targets: NSIS (Windows), DMG (Mac)
- [ ] Code signing notes documented (certificates not committed)
- [ ] Auto-update scaffold (electron-updater) — optional for v1
- [ ] Build script in package.json
- [ ] First tagged release (v0.1.0) on GitHub
