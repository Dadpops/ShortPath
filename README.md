# ShortPath

A local-first documentation, saved-reply, and process hub for support agents.

Download it to your machine. Import your team's resources via CSV. Search across everything at once. Copy with one click. Nothing leaves your machine.

---

## What it does

- One search bar that searches across every category at once: Saved Replies, Documentation, SOPs, Support Tools, and any custom categories you define.
- Results group by category with hit counts. Each group is expandable.
- Every result has a direct copy button.
- Lives in the system tray. Opens as a popup in the bottom-left corner by default. Resizable.
- Import and export resources via CSV.

## Status

Early development. Foundation scaffolded. No features built yet.

See [docs/ROADMAP.md](docs/ROADMAP.md) for the build plan.

## Tech stack

- Electron + Node
- React + Vite (renderer)
- TypeScript throughout
- SQLite (better-sqlite3) with FTS5 for full-text search
- electron-builder for packaging

## Development

```bash
npm install
npm run dev        # start renderer dev server + main process watcher
npm run electron   # launch Electron (after build or in dev mode)
```

## Project conventions

See [CLAUDE.md](CLAUDE.md) for coding conventions, commit style, and session workflow.
