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

- [x] Lock CSV schema: canonical column order is `title, vertical, type, body, url, tags`
- [x] Update csv.ts: rename the CSV column from `link` to `url` (maps to internal `Entry.link` field)
- [x] Update csv.ts: switch tag separator from comma (`,`) to pipe (`|`) in both import and export
- [x] Add `tool` as a valid `type` value in `src/shared/types.ts` (join: `reply | doc | link | sop | tool`)
- [x] Add `source: "local" | "synced"` to the `Entry` type in `src/shared/types.ts`
- [x] Update store functions: set `source: "local"` on all entries created via add/edit form or clipboard capture
- [x] Backfill existing entries in store.json on load: if `source` is missing, set it to `"local"`
- [x] Update EntryForm.tsx: add `tool` to the type selector radio buttons
- [x] Static template file `src/store/template/shortpath-template.csv` — confirmed; content bundled as constant in csv.ts for packaged builds
- [x] IPC handler: `download-template-csv` — writes bundled template content to user-chosen path via dialog.showSaveDialog
- [x] Import screen (renderer): shows inline format reference — column table, pipe-tag note
- [x] Import screen: download template button triggers `download-template-csv` IPC
- [x] Import preview step: parse on file select, show first 5 rows + total count + flagged rows, user confirms before commit

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
- [x] Show source tag on result items (small "mine" or "synced" label) — done after Phase 4 adds source field to live entries
- [ ] Write Help topics for Phase 2 features — done as part of Phase 7 Help System

---

## Phase 3 — Copy and entry management

Goal: users can copy results and manage their own entries.

- [x] CopyButton component: writes entry body or link to clipboard
- [x] Track recents: record entry access on copy or open
- [x] Add entry form: title, body, link, tags, type, vertical
- [x] Edit entry form
- [x] Delete entry with confirmation
- [x] User-defined verticals: create and name custom categories
- [ ] Write Help topics for Phase 3 features — done as part of Phase 7 Help System

**Phase 3 additions — Easy capture:**

These features serve the solo user and require no sync layer. They are the onboarding play: making it a normal weekly habit to collect scattered content into ShortPath.

- [x] Add-from-clipboard: on hotkey open (or via a dedicated button), if the clipboard contains text, offer to create a new local entry pre-filled with the clipboard contents. User adds a title and picks a vertical, then saves. One action from copy to saved.
- [x] Quick add: a minimal add form that shows only title + body/url + vertical. Type and tags are optional and collapsed by default. The goal is to make adding an entry take under 10 seconds.
- [x] Paste-and-split helper: paste a multi-section document into a special input; ShortPath splits it into entries on headings (each heading + its section body becomes one entry). Pure text heuristic, no AI. Covers the messy-Google-Doc case.

---

## Phase 4 — Shared-file sync

Goal: teams share a master file in Drive / Dropbox / OneDrive. Every ShortPath instance picks up changes automatically. Personal entries are never touched.

- [x] Settings UI: configure shared file path (file picker or paste path; local path because the sync service mounts the shared folder as a normal directory)
- [x] File watcher: watch the configured shared file path for changes using `fs.watch` or `chokidar`
- [x] On change detected: reload synced entries from the shared file, replace the previous synced set in the store, push updated entry list to renderer
- [x] Manual "Refresh now" button for cases where file-watch events are delayed or missed
- [x] Import shared file: load entries from the shared file with `source: "synced"`; run the same validation as CSV import (required columns, bad row flagging)
- [x] Merge rule: synced entries are fully replaced on refresh; local entries (`source: "local"`) are never touched by any sync operation
- [x] Clear synced: remove all `source: "synced"` entries (used when switching shared files or disconnecting from a team). Local entries remain.
- [x] Export all: write local + synced entries to a user-chosen CSV file
- [x] Export mine: write only `source: "local"` entries to CSV. This is the bottom-up path — individuals hand their personal library to the admin who folds it into the shared master.
- [x] IPC handlers: `configure-sync`, `refresh-synced`, `clear-synced`, `export-mine`
- [x] Visual distinction in results: small source tag on each result item ("mine" or "synced"); local and synced entries may appear as separate top-level groups when browsing
- [x] Write Help topics for Phase 4 features (sync setup, refresh, export mine)

**Out of scope for Phase 4 (deliberate decisions, not oversights):** hosted backend, help-desk connectors, Notion/wiki importers, real-time multi-writer editing. The shared-file model covers centralized and synced without any of these.

---

## Phase 5 — Window UX (core, not polish)

Goal: keyboard-first interaction that makes the app genuinely fast.

- [x] Global hotkey to summon and dismiss the popup (configurable, default: Cmd/Ctrl+Shift+Space)
- [x] On hotkey: show window, focus search box immediately
- [x] Hotkey conflict detection: warn if registration fails, show actionable message
- [x] Keyboard navigation: arrow keys move through results, Enter copies focused result, Esc dismisses
- [x] Fix `window.open(link)` -> use `shell.openExternal` via IPC (quick win)
- [x] Persist window size and position between launches
- [x] Tray menu: Show, Import CSV, Export CSV, Settings, Quit
- [x] Settings surface: change hotkey, reset position, configure sync path
- [ ] Write Help topics for Phase 5 features (keyboard shortcuts, hotkey config, window management) — done as part of Phase 7 Help System

---

## Phase 6 — Support Tools section

Goal: dedicated surface for quick-access utilities and links.

- [x] Support Tools vertical with distinct UI treatment (2-col grid, launch on click)
- [x] Add/edit/remove tool entries (links + labels)
- [x] Quick-launch: open link in default browser via shell.openExternal
- [x] Reorder tools via keyboard (↑↓ buttons, order persisted in store)
- [x] Write Help topics for Phase 6 features (Support Tools section, reordering)

---

## Phase 7 — Help system

Goal: in-app, searchable help covering every feature. No browser, no external links.

- [x] Help button `?` in main window header
- [x] Help panel: in-window view (mode swap like settings, Esc/Back to dismiss)
- [x] Help panel: dismissable with Back button or Esc
- [x] Help panel: search box that filters topics by title, tags, and content
- [x] Help topic data structure at `src/renderer/features/help/topics.ts`
- [x] Author all 16 Help topics with full content (all topics written)
- [x] Retroactively wrote Help content for Phase 1-4 features (CSV, search, entry management, sync)

---

## Phase 8 — Polish

Goal: app feels intentional and complete.

- [x] Finalize design tokens and typography
- [x] Show/hide animation for the popup
- [x] Tray icon states (active/inactive)
- [x] Consistent empty and error states throughout
- [x] Performance check: search should feel instant on datasets up to ~10k entries

---

## Post-phase features (added after Phase 8)

These were implemented outside the original phase plan based on user request.

- [x] Adjustable text size (Small/Medium/Large, persisted in settings, CSS variable)
- [x] Favorites (star toggle on entries and overlay, favorites view, persisted in store)
- [x] Source-mode setup screen on first launch (Local vs File Share Sync, source name)
- [x] Source name shown in header path; header path is clickable to go home
- [x] In-overlay editing: local entries editable in place; synced entries offer duplicate-to-local
- [x] Disconnect sync action (stops watcher, clears path, removes synced entries)
- [x] Clear synced copy clarified to distinguish from disconnect

---

## Phase 9 — Packaging and distribution

Goal: installable builds for Windows and Mac.

- [x] electron-builder targets: NSIS (Windows), DMG (Mac)
- [x] Code signing: documented in docs/SIGNING.md; signing fields commented in electron-builder.yml; no certs committed
- [x] Auto-update scaffold (electron-updater) — shipped in v0.2.0; replaces manual reinstall model
- [x] Build and release scripts in package.json (dist:win, dist:mac)
- [x] First tagged release on GitHub — v0.1.0 shipped 2026-06-08; v0.2.0 shipped 2026-06-09

---

## Phase 10 — Customization and Polish

Goal: deep personalization, richer keyboard navigation, usage tracking, and a reorganized Settings screen.

### Accent color and window personality

- [x] Accent color picker: 6 preset swatches (Ocean, Violet, Rose, Amber, Teal, Slate) in Settings; active swatch shows 2px ring; sets --color-accent on :root; persists to settings store
- [x] Window opacity slider: range 70–100, default 100; label shows current % value; calls win.setOpacity via IPC; persists and restores on launch; note below slider
- [x] Window size presets: Small / Medium / Large buttons; resizes BrowserWindow via IPC to preset dims; persists and restores on launch; active button uses --color-accent fill

### Layout and density

- [x] Compact / Comfortable density toggle: data-density="compact" on body; CSS block reduces row padding, body font size, and vertical gap; persists and restores on launch
- [x] Custom vertical tab ordering: draggable rows in Settings using HTML Drag and Drop API; each row has drag handle, vertical name, entry count; persisted to settings store; main window applies order on launch; falls back to default order if no custom order set

### UX upgrades

- [x] Pinned entries: pin toggle on result row and expanded overlay; pushpin icon; persists in entry store; pinned entries appear in a "Pinned" section at top when search is empty; during active search, pins appear normally; max 8 pinned — show inline message if user tries to pin a 9th
- [x] Keyboard navigation: Arrow Down/Up wraps through result rows; Enter on focused row opens overlay; Enter while overlay open copies body; Escape cascades (overlay → clear search → hide); Tab cycles vertical filter tabs; focused row uses left-border accent + subtle background tint; search input auto-focused on window show; Arrow Down from search moves to first result row
- [x] Copy then auto-hide: Settings toggle (off by default); hides window 300ms after successful copy; uses existing hide IPC; persists preference
- [x] Customizable global hotkey: moved to Behavior settings group; existing capture UI retained; reset-to-default link

### Usage tracking and sort

- [x] Entry usage counter: increment copyCount on local entries only on each copy; display as muted badge (e.g. "12×") on result row if copyCount > 0; badge uses muted text, not accent
- [x] Sort control: compact control above results; options: Relevance (default when query active) / Most used / Recently added / A to Z; when no query and sort is Relevance, fall back to Most used; sort choice is session-only (reset to Relevance on next launch)
- [x] Recent copies list: "Recent" section at top of result list when search is empty, below pinned entries; shows last 5 copied entries in reverse chronological order; in-memory only, resets on app restart; hidden if no copies this session

### Settings screen polish

- [x] Reorganize Settings into labeled groups: Appearance (accent color, opacity, window size, density, text size, theme), Behavior (copy then auto-hide, summon hotkey, window reset), Organization (tab order, verticals management)
- [x] Group labels: small all-caps muted label above a thin divider line; no cards, no boxes; minimal feel

### Session wrap

- [x] Update CURRENT_SESSION.md for Phase 10 completion
- [x] Create dated session file in docs/sessions/
- [x] Append to docs/SESSION_LOG.md
- [x] Commit and push

---

## Phase 11 — Vertical management and update awareness

Goal: nested sub-folder organization, delete vertical, and in-app update notifications.

- [x] Nested sub-folders: SubFolder gains optional subFolders[] for arbitrary depth; store tree helpers (addToTree, renameInTree, removeFromTree, collectSubtreeIds); recursive rendering in VerticalGroup with FolderIcon open/closed state; CSV subfolder column on import/export; EntryForm depth-indented dropdown; Settings subfolder tree management with add-child and expand/collapse
- [x] Delete vertical: deleteVertical store function removes vertical + all its entries + clears from verticalOrder; confirmation dialog in Settings; IPC handler
- [x] Check for updates: GitHub releases API polled 5s after launch; dismissable update banner in App; manual "Check for updates" button in Settings > About; update-available IPC push from main
- [x] Favorites on Support Tools: star toggle added to tool entries in SupportToolsGroup for parity with other verticals
- [x] Search bar clear icon: SVG X replaces text × button; occupies the same slot as the search icon when focused or non-empty
- [x] Vertical tab overflow: filter row switches to a <select> when more than 5 verticals exist

---

## Phase 12 — Onboarding and import UX

Goal: smoother first-run experience and flexible CSV import for non-standard files.

- [x] SetupScreen onboarding wizard: 4-step flow (source mode, sync name, optional import, done); local flow skips step 2
- [x] Drag-drop CSV import: drop a .csv file directly onto the import zone; no native dialog required
- [x] Column mapping: if required headers are missing, show manual mapping UI with dropdowns for each required/optional field
- [x] Subfolder CSV column: documented in format table and Help topics; expand-after-import bug fixed
- [x] Notes Save button: explicit Save + debounced auto-save; "Saving…" / "Saved" status badge
- [x] Text size CSS fix: all hardcoded font-size values replaced with helper variables; live px indicator in Settings
- [x] Collapse-all toggle: ⊟ Collapse / ⊞ Expand button in sort bar collapses all vertical groups at once
- [x] Export Selected screen: replaces Export Mine; checkbox tree (vertical → subfolder → entry) with indeterminate state; All / None shortcuts
- [x] Write Help topics for Phase 12 features

---

## Phase 13 — Pin window, rich text, duplicate detection, Stream Deck export

Goal: quality-of-life upgrades for power users — always-visible window, rich content, cleaner imports, and hardware integration.

### Window pin

- [ ] Always-on-top toggle: pin icon (or button) in the main window header; calls win.setAlwaysOnTop via IPC; persists preference to settings store
- [ ] Visual indicator: pinned state shows filled/highlighted pin icon; unpinned shows outline pin icon
- [ ] Help topic: explain pin behavior and how it interacts with the global hotkey

### Rich text editor

- [ ] Install Tiptap: @tiptap/react, @tiptap/pm, @tiptap/starter-kit, @tiptap/extension-link, @tiptap/extension-code-block, @tiptap/extension-underline
- [ ] Replace <textarea> in add/edit entry forms with Tiptap editor
- [ ] Toolbar: Bold, Italic, Underline, | , Bullet list, Ordered list, | , Inline code, Code block, | , Hyperlink
- [ ] Active toolbar state uses --color-accent
- [ ] Add copyMode?: "plain" | "html" to Entry type (default "plain" for backward compat)
- [ ] Copy-mode toggle below editor: "Copy as: Plain text | HTML"; persists with entry
- [ ] Copy logic: plain strips HTML tags; html writes text/html + text/plain fallback in same clipboard write
- [ ] Existing plain-text entries render safely in Tiptap
- [ ] Write Help topic for rich text and copy modes

### Duplicate detection on CSV import

- [ ] During preview step, flag rows whose title (trimmed, lowercased) matches an existing entry in the same vertical with a "Duplicate" badge
- [ ] Per-row resolution choice: Skip (default), Overwrite, Import as new
- [ ] commitCsvImport accepts and applies per-row resolution decisions
- [ ] Write Help topic update for import duplicate handling

### Duplicate detection on manual add

- [ ] On blur of title input in add entry form, check for case-insensitive title match within selected vertical
- [ ] Show inline warning below field: "An entry with this title already exists in [vertical name]."
- [ ] Style with color: var(--color-warning) (amber); non-blocking

### Stream Deck profile export

- [ ] Install jszip
- [ ] Add "Export Stream Deck Profile" to Settings export section
- [ ] export-streamdeck-profile IPC handler: generates valid .streamDeckProfile ZIP (outer manifest + page manifest + button layout); uses crypto.randomUUID() for profile/page UUIDs; caps at 32 buttons; shows save dialog
- [ ] Expose in preload and global.d.ts: exportStreamDeckProfile(): Promise<{ success: boolean; capped?: boolean }>
- [ ] Show toast in SettingsScreen if capped: true
- [ ] Write Help topic: what the export contains, how to import into Stream Deck app, note that button actions need manual wiring

### Open source cleanup

- [ ] Confirm no license/activation code present; remove if found
- [ ] README overhaul: features list, install, Stream Deck section, contributing, MIT license

### Session wrap

- [ ] Update CURRENT_SESSION.md
- [ ] Create dated session file in docs/sessions/
- [ ] Append to docs/SESSION_LOG.md
- [ ] Commit and push

---

## Phase 14 — Browser extension, URL import, and file drag-in

Goal: bring content into ShortPath from the browser and from Markdown and PDF files.

### HTTP capture server

- [ ] HTTP server on port 57433 in main process; CORS-enabled; POST /capture brings window to front and sends IPC to renderer; GET /ping returns status and version; OPTIONS preflight handled; server closes on app quit
- [ ] IPC: `capture-entry` pushed to renderer; `onCaptureEntry` exposed in preload
- [ ] `sourceUrl?: string` added to Entry type
- [ ] Renderer: `capture-entry` event switches to add mode, pre-fills title and body, shows read-only "Captured from" field

### URL import in add-entry form

- [ ] Install @mozilla/readability and jsdom
- [ ] IPC handler: `fetch-url-content` in main; validates URL, fetches page with Node https, parses with Readability; returns sections split by h2/h3
- [ ] Expose in preload and global.d.ts: `fetchUrlContent`
- [ ] Add-entry form: "Import from URL" link above body field; inline URL input + Fetch button; section picker (click to use, "Use all"); loading and error states

### Markdown and PDF file drag-in

- [ ] Install marked and pdf-parse
- [ ] IPC handler: `preview-md-import` — reads .md, splits at ## and ### headings, strips markdown, returns sections
- [ ] IPC handler: `commit-md-import` — inserts entries into store
- [ ] Expose both in preload and global.d.ts
- [ ] ImportScreen: .md files route to MdImportScreen component
- [ ] MdImportScreen: section checkboxes, vertical picker, subfolder field, Import button
- [ ] IPC handler: `preview-pdf-import` — reads PDF with pdf-parse, best-effort section split
- [ ] IPC handler: `commit-pdf-import` — inserts entries into store
- [ ] Expose both in preload and global.d.ts
- [ ] ImportScreen: .pdf files route to PdfImportScreen component
- [ ] PdfImportScreen: same UI as MdImportScreen; note that scanned PDFs will return empty sections

### Browser extension (Chrome + Firefox)

- [ ] Create packages/browser-extension/ with manifest.chrome.json and manifest.firefox.json
- [ ] background.js: context menu "Save to ShortPath" on selection and page; POST to capture server; notification on success; queue on failure
- [ ] queue.js: enqueue, getQueue, clearQueue, flushQueue to chrome.storage.local
- [ ] Popup: connected/disconnected states; save current page button; queue status; "Where is ShortPath?" guidance
- [ ] GET /ping endpoint added to ShortPath main; used by popup for connection check
- [ ] Tray menu item: "Import queued browser captures"
- [ ] packages/browser-extension/package.json with build:chrome and build:firefox scripts
- [ ] packages/browser-extension/README.md

### Help topics

- [ ] Help topic: importing from a URL
- [ ] Help topic: importing Markdown files
- [ ] Help topic: importing PDF files
- [ ] Help topic: browser extension

### Session wrap

- [ ] Update CURRENT_SESSION.md
- [ ] Create dated session file in docs/sessions/
- [ ] Append to docs/SESSION_LOG.md
- [ ] Commit and push
