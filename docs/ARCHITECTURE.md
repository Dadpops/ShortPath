# Architecture

## Overview

ShortPath is a local-first Electron desktop app. There is no backend server. All data lives on the user's machine in a SQLite database. The app is structured as three separate processes connected by a controlled IPC boundary.

## Process model

```
Electron Main Process (Node.js)
  - App lifecycle: start, quit, hide/show
  - Tray icon and context menu
  - BrowserWindow management (position, size, visibility)
  - IPC handlers: receives requests from renderer, talks to SQLite
  - Opens and owns the SQLite database connection

Preload Script (isolated Node context)
  - Bridges main and renderer via contextBridge
  - Exposes a limited, typed API: window.shortpath.*
  - No direct DOM access, no direct require() in renderer

Renderer Process (Chromium + React)
  - All UI: search bar, result groups, copy button, entry forms
  - Communicates with main only through the preload bridge (ipcRenderer.invoke)
  - Treats window.shortpath as its only I/O surface
  - No direct file system or database access
```

## Why local-first

- Support agents work with sensitive customer data. Keeping everything local eliminates a class of data risk.
- No network dependency means the tool works offline and has zero latency for reads.
- CSV import/export gives teams control over their data without requiring a server or account.

## Where search runs

FTS5 queries run in the main process against SQLite. The renderer sends a query string via IPC, the main process runs the FTS5 search and groups results by vertical, and returns a structured response. This keeps the database off the renderer thread and avoids exposing SQLite to the web context.

## IPC contract

All IPC uses `ipcRenderer.invoke` / `ipcMain.handle` (request-response, not fire-and-forget). Channel names are defined as constants in `src/shared/types.ts` so both sides share the same string literals.

Channels (defined, not yet implemented):

| Channel | Direction | Purpose |
|---|---|---|
| `ping` | renderer -> main | Health check |
| `search` | renderer -> main | FTS5 query, returns VerticalGroup[] |
| `get-entry` | renderer -> main | Fetch single entry by id |
| `create-entry` | renderer -> main | Insert new entry |
| `update-entry` | renderer -> main | Update existing entry |
| `delete-entry` | renderer -> main | Delete entry by id |
| `import-csv` | renderer -> main | Open file picker, parse and insert CSV |
| `export-csv` | renderer -> main | Dump entries to file |

## Window behavior

The main process positions the window in the bottom-left of the primary display's work area (excludes taskbar). Position is recalculated on show so it adapts to display changes. The window is frameless and skips the taskbar. The tray icon is the only persistent UI element when the window is hidden.

## Folder structure

```
src/main/       Node.js: lifecycle, tray, window, IPC handlers, DB access
src/preload/    Context bridge definition
src/renderer/   React UI: components, features, styles
src/shared/     Types and constants used by more than one process
src/db/         SQLite schema, migrations, FTS5 queries, CSV parsing
```
