# Changelog

All notable changes to ShortPath are documented in this file.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)

---

## [0.1.0] - 2026-06-08

### Added

- **Universal search** — one search bar that searches every category simultaneously. Results group by category (vertical) with expandable groups showing entry counts.
- **Sub-folders** — organise entries within a vertical into named sub-folders. Manage them in Settings > Verticals; assign one when adding or editing an entry. Sub-folders appear as collapsible groups inside a vertical's search results.
- **Support Tools grid** — dedicated quick-launch section for links (admin panels, dashboards, forms). Entries display in a 2-column grid; click to open in browser. Supports add, edit, delete, and reorder.
- **Team sync via shared CSV** — point ShortPath at a shared CSV on Dropbox, Google Drive, OneDrive, or any locally-mounted network path. The app watches the file and reloads automatically. Local entries are never touched by sync.
- **CSV import / export** — bulk-import entries from a CSV file with a preview step; export all entries or only your own. A template CSV is downloadable from Settings.
- **Paste-and-split** — paste a multi-section document; ShortPath splits it into individual entries on Markdown headings (H1/H2).
- **Clipboard capture** — if text is on the clipboard when the window opens, a banner offers to save it as a new entry.
- **In-overlay editing** — click any result to open a full detail panel. Local entries show an Edit button; synced entries offer "Duplicate to local and edit".
- **Notes** — a private scratchpad inside the app. Notes can be linked to a specific entry. Auto-saves as you type. Separate from entries; never exported or synced.
- **Favorites** — star any entry for instant access from the Favorites view. Favorite status persists locally and is not affected by sync refreshes.
- **Configurable global hotkey** — summon the window from anywhere (default: Ctrl/Cmd+Shift+Space). Change it in Settings. Conflict detection warns if another app already holds the combination.
- **Keyboard-first navigation** — arrow keys move through results, Enter opens the focused entry, Escape closes the overlay or clears the search, second Escape hides the window.
- **Adjustable text size** — slider in Settings > Appearance scales the entire UI from 11–16 px.
- **Light and dark theme** — toggle in Settings > Appearance. Persists across launches.
- **Source-mode setup** — on first launch, choose Local (solo) or File Share Sync (team). Can be changed at any time.
- **Source name in header** — the header path shows the configured sync source name or "Local" for solo users. Clicking the path returns to the home view.
- **Clear local entries** — danger-zone action in Settings > Data to permanently delete all local entries while leaving synced entries intact.
- **Add / rename / remove verticals** — manage categories from Settings > Verticals. New verticals can also be created on-the-fly from the entry form.
- **Recents dropdown** — when the search box is focused and empty, the 10 most recently accessed entries appear in a dropdown.
- **Help system** — 16 searchable in-app help topics covering every feature. Accessible via the ? button. No browser required.

### Fixed

- Hotkey display now shows "Cmd" on macOS and "Ctrl" on Windows/Linux (previously always showed "Ctrl").
- Tags field normalises format on blur: trims whitespace, converts commas to pipes, collapses duplicate separators. Stored format is always pipe-separated.
- Copy button in result rows and the entry overlay both show a brief "copied" confirmation state (1.5 s) before reverting.
- Escape key clears search text first (if present), then hides the window — previously could hide the window while text was still in the search box.
- Escape key now works from anywhere in the window, not just while the search input is focused.

### Known Limitations

- **Network drive file watching** — the built-in `fs.watch` watcher may miss change events on network-mounted drives (Samba, NFS, some cloud sync folders). Use the "Refresh now" button in Settings > Shared file sync as a workaround. A more reliable watcher (chokidar) is planned for a future release.
- **No auto-update** — v0.1.0 uses a manual reinstall model. Download the new installer from the GitHub Releases page and run it over the existing installation. Your data is stored in the app data folder and is not affected by reinstalling.
- **Code signing** — Windows builds are unsigned. SmartScreen will warn on first run. Click "More info → Run anyway" to proceed. See [docs/INSTALLING.md](docs/INSTALLING.md) for full instructions.
- **macOS notarisation** — not yet configured for v0.1.0. Gatekeeper will block unsigned builds. See [docs/INSTALLING.md](docs/INSTALLING.md).
