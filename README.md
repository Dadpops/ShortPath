# ShortPath

**The support knowledge hub that lives on your desktop — not in another browser tab.**

Press a hotkey. Type a word. Copy your reply. Back to the ticket in under five seconds.

![ShortPath main window showing search results grouped by vertical](docs/screenshots/main.png)

---

## The problem it solves

Support agents waste time switching between tabs, hunting through docs, and retyping the same responses. ShortPath puts your entire knowledge library — saved replies, SOPs, documentation, quick links — in a single searchable popup that appears instantly from any app.

No login. No browser. Nothing sent to a server. Everything runs on your machine.

---

## What makes it different

### Always there, never in the way
Press `Ctrl+Shift+Space` (or your custom hotkey) from anywhere on your desktop. ShortPath appears at the bottom-left corner. Press it again — it hides. Pin it to float above your support tool when you need both visible at once.

### One search, every category
Type a word and see hits across Saved Replies, Documentation, SOPs, and any custom categories you've created — all at once, grouped by category, instantly filtered as you type.

### Rich text that pastes right
Format replies with bold, bullet lists, headers, and code blocks. Choose per-entry whether copying gives you formatted HTML (for Gmail, Zendesk, Intercom) or clean plain text (for tickets with plain-text fields). The same entry works in both.

### Team sync without a backend
Drop a CSV in a shared Dropbox, Google Drive, or OneDrive folder. Every team member's ShortPath picks up changes automatically. Your personal entries are kept separate and never touched by the sync.

### Stream Deck ready
Export your library as a `.streamDeckProfile` in one click. Every entry becomes a labeled button. Import it into the Stream Deck app and wire each button to whatever action fits your workflow.

### Organized the way support teams think
Verticals (categories) → sub-folders → entries. Nest as deep as you need. Filter by category with one click. Drag to reorder. Add new categories on the fly.

---

## Feature list

| Feature | Details |
|---|---|
| Global hotkey | Summon / dismiss from anywhere. Default: Ctrl/Cmd+Shift+Space. Configurable. |
| Full-text search | Fuse.js, title-weighted, fuzzy. Searches all categories at once. |
| Rich text editor | Bold, italic, underline, lists, code, hyperlinks. Copy as plain text or HTML. |
| Pin window | Always-on-top toggle keeps the window above other apps. |
| Nested sub-folders | Organise entries within any vertical. Unlimited depth. |
| Team sync | Watches a shared CSV on any mounted drive. Refreshes automatically. |
| CSV import | Drag-drop or browse. Column mapping for non-standard files. Duplicate detection with per-row resolution. |
| CSV export | All entries, or a selection via checkbox tree. |
| Stream Deck export | Generates a .streamDeckProfile with one button per entry. |
| Pinned entries | Up to 8 entries pinned to the top of the empty-search view. |
| Favorites | Star entries for quick access from the Favorites view. |
| Notes | Private scratchpad, linked to entries. Auto-saves. |
| Support Tools grid | Quick-launch links open in the browser. 2-column grid, reorderable. |
| Clipboard capture | Clipboard text detected on open — one click to save as a new entry. |
| Paste and split | Paste a multi-section doc; ShortPath splits it into entries on headings. |
| Accent color + theme | 6 preset colors, dark/light theme, opacity slider, compact/comfortable density. |
| Usage tracking | Copy count badge on result rows. Sort by most used, recently added, or A to Z. |
| In-app help | 18 searchable topics. No browser. |

---

## Install

Download the latest installer from the **[Releases page](https://github.com/Dadpops/ShortPath/releases)**.

| Platform | File | Notes |
|---|---|---|
| Windows | `ShortPath-Setup-x.y.z.exe` | SmartScreen warning on first run — click "More info → Run anyway". |
| macOS | `ShortPath-x.y.z.dmg` | Gatekeeper will block unsigned builds — see [docs/INSTALLING.md](docs/INSTALLING.md). |

Your data lives in `%APPDATA%\ShortPath` (Windows) or `~/Library/Application Support/ShortPath` (macOS). Reinstalling or updating does not affect your entries.

---

## Stream Deck

Settings > Data > Export Stream Deck Profile creates a `.streamDeckProfile` file.

To import: double-click the file, or open the Stream Deck app and go to Preferences > Profiles > gear icon > Import. The profile appears in your profile list with your entry titles already on the buttons. Assign actions (hotkeys, text inserts, website opens) to each button in the Stream Deck editor.

Capped at 32 buttons per page (covers both the standard 15-key and XL 32-key decks). If you have more entries, the first 32 are exported — the app tells you when this happens.

---

## For teams

1. Create a CSV with your team's saved replies, SOPs, and documentation links. [Download the template](https://github.com/Dadpops/ShortPath/releases/latest) from Settings > Data.
2. Put the file in a shared folder (Dropbox, Google Drive, OneDrive, network drive).
3. Each agent installs ShortPath, opens Settings > Shared file sync, and points it at the CSV.
4. When you update the CSV, ShortPath picks up the changes automatically. Agents' personal entries are never affected.

The admin owns the shared file. Agents own their local entries. ShortPath never writes back to the shared file.

---

## Contributing

```bash
git clone https://github.com/Dadpops/ShortPath.git
cd ShortPath
npm install
npm run dev    # Vite renderer dev server + Electron main watcher
```

The Electron window opens automatically. Feature branches off `master`, PRs to `master`.

See [CLAUDE.md](CLAUDE.md) for coding conventions, commit style, and session workflow.

---

## License

MIT — free for personal and commercial use.
