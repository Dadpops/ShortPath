# ShortPath — Claude Code Orientation

## What this project is

ShortPath is a local-first desktop app for support agents. It consolidates documentation, saved replies, internal SOPs, support tools, and user-defined resources into one fast, searchable surface. Users download it to their machine and import their company's resources via CSV. Nothing leaves the machine — no backend, no sync.

The UI reads like a folder path. A single search returns hits across every resource category ("vertical") at once, grouped by category with expandable hit counts. Every result has a direct copy button.

The app lives in the system tray and opens as a minimal popup, defaulting to the bottom-left corner.

## Tech stack

- **Electron** — desktop shell, tray integration, global hotkey
- **React + Vite** — renderer UI (TypeScript throughout)
- **Local JSON file** — storage in Electron's userData directory; no database dependency
- **Fuse.js** — in-renderer keyword search, title-weighted, conservative fuzzy threshold
- **PapaParse** — CSV import and export (lossless round-trip)
- **electron-builder** — packaging for Windows/Mac/Linux
- **No backend server. No AI. No SQLite.** All data is local.

## How to start a session

1. Read `CURRENT_SESSION.md` — it tells you exactly where things stand and what is next.
2. Read the latest file in `docs/sessions/` — it has decisions and context from the last session.
3. Read `docs/ROADMAP.md` — it shows which phase we are in and which tasks are done vs. open.

Then begin work on whatever is marked next.

## How to end a session

1. Update `CURRENT_SESSION.md` — new status, link to this session's file, what is next.
2. Append one line to `docs/SESSION_LOG.md` linking to the session file.
3. Create `docs/sessions/YYYY-MM-DD-<slug>.md` filled in from the template.
4. Commit in logical chunks (see commit conventions below).
5. Push to origin.
6. Confirm the push succeeded.

## Coding conventions

- TypeScript strict mode everywhere. No `any` unless truly unavoidable.
- Plain, direct language in all docs and comments. No em-dashes. No buzzwords.
- Comments only where the WHY is non-obvious. No comments explaining what the code does — names do that.
- No half-finished implementations. If something is not built yet, leave a stub with a one-line comment pointing to the phase that will build it.
- No features added beyond the current phase's scope. When tempted, add a task to the roadmap instead.

## Core principles

- **Sync never modifies a user's local entries.** Any code that touches `source: "synced"` entries must never read, write, or delete entries where `source === "local"`. This is a hard guarantee, not a preference. Enforce it in the sync functions, not in callers.
- Local-first always. No network calls, no accounts, no hosted backend. All data stays on the user's machine.

## Standing rule: Help topics

When any user-facing feature is added or changed, update its corresponding Help topic in `src/renderer/features/help/topics.ts` in the same commit (or the same PR). This applies to every phase from 4 onward. Phases 1-3 are covered retroactively in Phase 6.

If a feature ships without an updated Help topic, the phase checklist task "Write Help topics for Phase N features" must remain unchecked.

## Commit conventions (Conventional Commits)

```
feat:     new user-facing feature
fix:      bug fix
docs:     documentation only
chore:    tooling, config, dependencies, scaffolding
refactor: code change that is not a fix or feature
test:     adding or updating tests
```

Commit in small logical chunks. One concern per commit. Descriptive but concise messages.

## Where things live

```
src/main/          Electron main process: tray, window lifecycle, global hotkey, IPC handlers, JSON store I/O
src/preload/       Context bridge: exposes safe IPC surface to renderer
src/renderer/      React + Vite UI
  components/      Shared UI components (SearchBar, ResultList, CopyButton, ...)
  features/        Feature modules grouped by concern
    search/        Fuse.js search, debounce, result grouping by vertical
    verticals/     Vertical definitions and group rendering
    copy/          Copy-to-clipboard
    keyboard/      Keyboard navigation (arrows, Enter to copy, Esc to dismiss)
    support-tools/ Support Tools section
    help/          In-app help panel: topics data (topics.ts), HelpPanel component
  styles/          Global CSS and design tokens
src/shared/        Types and IPC channel constants shared across all processes
src/store/         JSON store read/write, CSV import/export (PapaParse), store schema
docs/              Architecture, data model, roadmap, session logs
.github/workflows/ CI (lint + typecheck on push/PR)
```

## Design tokens (defined in global.css)

All colors and fonts live in CSS custom properties on `:root`. Touch those variables, not hardcoded values, when styling.
