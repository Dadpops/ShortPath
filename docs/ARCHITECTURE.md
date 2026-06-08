# Architecture

## Overview

ShortPath is a local-first Electron desktop app. There is no backend server. All data lives on the user's machine as JSON files in the app's user-data directory. The app is structured as three separate processes connected by a controlled IPC boundary.

## Process model

```
Electron Main Process (Node.js)
  - App lifecycle: start, quit, hide/show
  - Tray icon and context menu
  - Global hotkey registration and dispatch
  - BrowserWindow management (position, size, visibility, persistence)
  - IPC handlers: receives requests from renderer, reads/writes JSON store
  - Owns all file I/O (JSON store, CSV import/export)

Preload Script (isolated Node context)
  - Bridges main and renderer via contextBridge
  - Exposes a limited, typed API: window.shortpath.*
  - No direct DOM access, no direct require() in renderer

Renderer Process (Chromium + React)
  - All UI: search bar, result groups, copy button, entry forms
  - Runs Fuse.js search in-memory against the entry list it received from main
  - Handles all keyboard navigation (arrow keys, Enter, Esc)
  - Communicates with main only through the preload bridge (ipcRenderer.invoke)
  - Treats window.shortpath as its only I/O surface
```

## Why local-first

- Support agents work with sensitive customer data. Keeping everything local eliminates a class of data risk.
- No network dependency means the tool works offline and has zero latency for reads.
- CSV import/export gives teams control over their data without requiring a server or account.

## Storage: local JSON

Entries are stored as a JSON file (or small set of JSON files) in Electron's `app.getPath('userData')` directory. On a typical dataset for a single support agent this fits comfortably in memory and makes reads and writes simple and fast.

The main process owns all reads and writes to the JSON store. The renderer never touches the file system directly.

SQLite (via better-sqlite3) is a documented future option if entry counts grow to tens of thousands and in-memory filtering becomes a bottleneck. It is not a current dependency.

## Search: Fuse.js in the renderer

When the window opens, the main process sends the full entry list to the renderer via IPC. The renderer builds a Fuse.js index from that list and runs all search queries locally against it. No IPC round-trip on each keystroke.

Search behavior:
- Case-insensitive, fuzzy keyword matching.
- Matches against title, body, and tags.
- Title matches are weighted above body matches so the obvious result ranks first.
- Fuzzy threshold is conservative (not loose) so results stay precise.
- Results group by vertical with a per-vertical hit count. Each group is expandable/collapsible.
- When the search box is empty, recents/most-used entries are shown instead.
- Users can scope search to a single vertical via a per-vertical filter.

No AI, no embeddings, no remote calls. Search is fast, deterministic, and offline.

## CSV import and export flow

**Import:** User selects a CSV file via the tray menu or settings. Main process reads the file, passes it to PapaParse for parsing, validates required columns, merges the result into the JSON store, then pushes the updated entry list to the renderer. Unknown vertical IDs create a new vertical automatically.

**Export:** Main process serializes the current JSON store to CSV using PapaParse and writes it to a user-chosen path. Import and export share the same column schema, so a round-trip is lossless.

## Window and hotkey model

The global hotkey is the primary way to open and dismiss the popup. The tray icon is the secondary path and the home for settings, import/export, and manual entry management.

- On hotkey press: show window at its last position (default: bottom-left of work area), focus the search box.
- On hotkey press again, or Esc: hide window.
- Keyboard navigation within the window: arrow keys move through results, Enter copies the focused result, Esc dismisses.
- Window position and size persist between launches.

The window is frameless and skips the taskbar. The tray icon is the only persistent visible element when the popup is hidden.

## Sync model

The team layer sits on top of the local store without replacing it. There is no server, no auth, no hosted backend. The mechanism is a single shared file sitting in a folder synced by Google Drive, Dropbox, OneDrive, or any folder-sync service. Those services mount the shared folder as a normal local path, so ShortPath sees the team's master file as just a file on disk.

**Setup:** the user opens Settings, selects the shared file path once, and ShortPath takes it from there. One step.

**How sync works:**

- ShortPath watches the shared file path for changes (using `fs.watch` or `chokidar`).
- When the file changes, ShortPath reloads the synced set and pushes the updated entries to the renderer.
- A manual "Refresh now" button is available for cases where file-watch events are delayed or missed.
- Entries from the shared file are loaded with `source: "synced"`. The user's own entries always have `source: "local"`.

**The core guarantee:** sync only reads the shared file and replaces entries with `source: "synced"`. It never touches entries with `source: "local"`. A user's personal additions are never overwritten or removed by any sync operation, ever.

**Sync operations:**

| Operation | What it does |
|---|---|
| Refresh synced | Reload the synced set from the shared file path. Also triggered automatically on file change. |
| Clear synced | Remove all `source: "synced"` entries from the store. Used when switching shared files or starting clean. Local entries remain. |
| Export all | Write the entire store (local + synced) to a user-chosen CSV file. |
| Export mine | Write only `source: "local"` entries to CSV. This is the bottom-up path: individuals collect their personal replies in ShortPath, then hand them to an admin who folds them into the shared master. |

**Out of scope (deliberate decisions, not oversights):**
- Hosted backend or server-side storage
- Help-desk connectors (Zendesk, Intercom, Freshdesk, others)
- Notion, Confluence, or wiki importers
- Real-time multi-writer editing or conflict resolution (the shared file has one admin editor; concurrent writes are not a design target)

The shared-file model covers centralized, current, and synced for the target customer without any of the above.

## Product strategy

Build for the individual's selfish convenience first. A solo agent who captures their own scattered replies into ShortPath gets immediate value with no team coordination needed. When a team adopts ShortPath, each agent's personal library is already built from everyday use. They share it upward via "export mine" and the admin folds it into the shared master. The shared file fills up bottom-up from actual usage, not from a migration project nobody volunteers for. This is why easy capture (add from clipboard, quick add, paste-and-split) is core product.

## IPC contract

All IPC uses `ipcRenderer.invoke` / `ipcMain.handle` (request-response). Channel names are defined as constants in `src/shared/types.ts`.

| Channel | Direction | Purpose |
|---|---|---|
| `ping` | renderer -> main | Health check |
| `load-entries` | main -> renderer (on open) | Send full entry list to renderer |
| `create-entry` | renderer -> main | Add new entry to JSON store |
| `update-entry` | renderer -> main | Update entry in JSON store |
| `delete-entry` | renderer -> main | Delete entry from JSON store |
| `record-access` | renderer -> main | Record entry access for recents |
| `import-csv` | renderer -> main | Open file picker, parse CSV, merge into store |
| `export-csv` | renderer -> main | Serialize store to CSV, write to file |
| `export-mine` | renderer -> main | Serialize only local entries to CSV, write to file |
| `configure-sync` | renderer -> main | Set or clear the shared file path |
| `refresh-synced` | renderer -> main | Reload synced entries from shared file |
| `clear-synced` | renderer -> main | Remove all synced entries from store |
| `download-template-csv` | renderer -> main | Copy template CSV to a user-chosen path |
| `store-updated` | main -> renderer (push) | Notify renderer of store changes (entries + verticals + recents) |

Search does not go through IPC. It runs in the renderer against the in-memory entry list.

## Folder structure

```
src/main/       Node.js: lifecycle, tray, window, global hotkey, IPC handlers, JSON store I/O
src/preload/    Context bridge definition
src/renderer/   React UI: components, features, styles
  features/
    search/     Fuse.js search, debounce, result grouping
    verticals/  Vertical definitions and group rendering
    copy/       Copy-to-clipboard
    keyboard/   Keyboard navigation (arrows, Enter, Esc)
    support-tools/ Support Tools section
    help/       In-app help panel: topics data (topics.ts), HelpPanel component
src/shared/     Types and IPC channel constants shared across processes
src/store/      JSON store read/write, CSV import/export (PapaParse), entry schema
  template/     Static CSV template file for download
```
