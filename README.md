# ShortPath

A local-first support knowledge hub for agents who need fast, searchable access to saved replies, documentation, SOPs, and links.

![ShortPath screenshot](docs/screenshot.png)

> Regenerate this screenshot with `node scripts/screenshot.mjs` after UI changes.

---

## Features

- Global hotkey to summon the window from anywhere on your desktop (default: Ctrl/Cmd+Shift+Space)
- Full-text search across all verticals at once, results grouped by category
- Nested sub-folders within each vertical for fine-grained organisation
- Rich text entries — bold, italic, lists, code blocks, hyperlinks — with copy-as-plain-text or copy-as-HTML per entry
- Pinned entries that float to the top when search is empty
- File-based team sync via shared CSV on Drive, Dropbox, or OneDrive — local entries are never touched by sync
- Stream Deck profile export: generates a labeled .streamDeckProfile file for one-click import into the Elgato Stream Deck app
- CSV import with duplicate detection and per-row resolution (Skip, Overwrite, Import as new)
- CSV export: all entries, or a selection you choose via checkbox tree
- Dark and light themes with six accent color presets
- Customizable window size, density, and text size
- Notes scratchpad linked to entries
- In-app help covering every feature

---

## Install

Download the latest installer from the [Releases page](https://github.com/Dadpops/ShortPath/releases).

- **Windows**: `ShortPath-Setup-x.y.z.exe` — SmartScreen will warn on first run; see [docs/INSTALLING.md](docs/INSTALLING.md) to bypass it.
- **macOS**: `ShortPath-x.y.z.dmg` — Gatekeeper will block unsigned builds; see [docs/INSTALLING.md](docs/INSTALLING.md).

Your data is stored in `%APPDATA%\ShortPath` (Windows) or `~/Library/Application Support/ShortPath` (macOS) and is not affected by reinstalling.

---

## Stream Deck

Settings > Data > Export Stream Deck Profile creates a `.streamDeckProfile` file with one button per entry, labeled with the entry title. To import: double-click the file and the Stream Deck app will prompt you to import it, or go to Preferences > Profiles > gear icon > Import. After import, assign actions (hotkeys, website opens, etc.) to each button in the Stream Deck editor.

---

## Contributing

```bash
npm install
npm run dev    # Vite renderer dev server + Electron main watcher
```

Feature branches off master, PRs to master. See [CLAUDE.md](CLAUDE.md) for coding conventions, commit style, and session workflow.

---

## License

MIT
