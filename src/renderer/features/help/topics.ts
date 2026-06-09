// Help topic content is authored here as each feature ships (see CLAUDE.md standing rule).
// Phase 7 builds the HelpPanel UI that renders these topics.

export interface HelpTopic {
  id: string;
  title: string;
  tags: string[];
  content: string; // plain text; rendered in HelpPanel
}

export const HELP_TOPICS: HelpTopic[] = [
  {
    id: "getting-started",
    title: "Getting started",
    tags: ["intro", "overview", "install", "launch"],
    content: `ShortPath is a local desktop app that puts your support library — saved replies, documentation, SOPs, and quick-launch tools — in one fast, searchable surface.

Press the hotkey (default: Ctrl+Shift+Space) from anywhere on your desktop. The window opens with focus already in the search box. Type a keyword to search every category at once. Click a result to read it in full, or use the copy button to copy it straight to your clipboard.

Everything is stored on your machine. Nothing is sent to a server. No login required.

First launch
When you open ShortPath for the first time, it asks whether you are using it solo (Local) or with a team via a shared CSV (File Share Sync). You can change this later from Settings. See the "Local vs File Share Sync" help topic for details.

First steps
1. Press the hotkey now: Ctrl+Shift+Space (Cmd+Shift+Space on Mac).
2. Type a few characters to search the sample entries.
3. Click any result to open it, or use the ⎘ copy button on the right of each row.
4. Use the + button in the header to add your first real entry.
5. If your team has a shared CSV file, configure it in Settings > Shared file sync.`,
  },
  {
    id: "opening-closing",
    title: "Opening and closing the window",
    tags: ["hotkey", "tray", "esc", "dismiss", "shortcut", "open", "close"],
    content: `Opening
Use the global hotkey (default: Ctrl+Shift+Space) to show the window from anywhere on your desktop. The window opens and focus goes directly to the search box.

You can also click the ShortPath icon in the system tray.

Hiding
Press Esc to hide the window (press again to show it). The app keeps running in the tray — it is not quit, just hidden.

Press the hotkey a second time to toggle the window off.

Quitting
Right-click the tray icon and choose Quit to stop the app completely.

Changing the hotkey
Open Settings (⚙ in the header), then use the "Change hotkey" button. If the combination is already taken by another app, you will see an error — try a different one.`,
  },
  {
    id: "searching",
    title: "Searching",
    tags: ["search", "query", "fuzzy", "keywords", "tips", "find"],
    content: `Type at least 2 characters to start searching. Results appear instantly as you type, grouped by category.

The search is fuzzy — it finds close matches even with minor typos. Title is weighted most heavily, then tags, then body text.

Tips for better results
- Short, specific keywords work better than long phrases ("billing" not "customer has a billing question").
- Tag keywords give the most precise results — tags like "refund", "escalation", "VIP" are designed for quick lookup.
- If nothing comes up, check the spelling or try a synonym.
- Entries with no body (link-only) can still be found by title or tags.

Keyboard navigation
Once results appear, press ArrowDown to move focus into the list. Use ArrowUp/ArrowDown to move between results, Enter to open the focused result, and Esc to return focus to the search box.

When the search box is empty, the app shows your recently accessed entries.`,
  },
  {
    id: "understanding-results",
    title: "Understanding results",
    tags: ["results", "verticals", "groups", "hit count", "expand", "collapse", "categories"],
    content: `Results are grouped by category (called verticals). Each group header shows the category name and the number of matching entries.

Expanding and collapsing groups
Click any group header to expand or collapse it. Collapsed groups still count toward the total hit count shown in the header.

Entry types
- reply: a saved response to copy and paste into a support ticket.
- doc: a piece of documentation or policy text.
- sop: a standard operating procedure — step-by-step instructions.
- link: an external URL to open in the browser.
- tool: a quick-launch link shown in the Support Tools grid.

Source labels
If a team-shared sync file is configured, entries from that file show a small "synced" label. These are read-only — they cannot be edited locally.

Entries you created yourself have no label (they are "mine" by default).`,
  },
  {
    id: "copying",
    title: "Copying an entry",
    tags: ["copy", "clipboard", "copy button", "paste"],
    content: `Click any entry to open a detail panel showing the full content. Use the Copy button in the panel to copy the text to your clipboard.

You can also use the ⎘ copy button on each result row to copy without opening the panel.

What gets copied
- Entries with a body: the full body text.
- Link-only entries: the URL.
- Title-only entries: the title.

The copied text goes straight to your clipboard, ready to paste into your support tool, browser, or any app.

After copying, the entry moves to the top of the Recents list for easy re-access.`,
  },
  {
    id: "keyboard-navigation",
    title: "Keyboard navigation",
    tags: ["keyboard", "arrows", "enter", "esc", "navigation", "shortcuts"],
    content: `ShortPath is designed to be used without touching the mouse.

After typing a search, press ArrowDown to move focus from the search box into the results list.

Keys
- ArrowDown: move to the next result
- ArrowUp: move to the previous result
- Enter: open the focused entry's detail panel
- Esc (once): clear keyboard focus (return to search box)
- Esc (again): hide the window

The focused entry is highlighted. It scrolls into view automatically.

The hotkey (Ctrl+Shift+Space) summons the window from anywhere on your desktop. The search box is focused immediately — you can start typing right away.`,
  },
  {
    id: "filtering-by-vertical",
    title: "Filtering by vertical",
    tags: ["filter", "vertical", "scope", "category", "group"],
    content: `Search results are grouped by vertical (category). To focus on one vertical, collapse the other groups by clicking their headers.

Keyboard navigation only cycles through expanded groups, so collapsing a group effectively filters it out of the keyboard path.

There is no single-click "show only this vertical" toggle in the current version — the collapse/expand controls serve that purpose.`,
  },
  {
    id: "recents",
    title: "Recents",
    tags: ["recents", "recently used", "history", "recent"],
    content: `When the search box is empty, ShortPath shows your 10 most recently accessed entries.

An entry moves to the top of Recents when you:
- Copy it (via the copy button or the Copy button in the detail panel)
- Open its link in the browser

Recents give fast access to the replies and tools you use most. They are stored locally and not synced to other devices.`,
  },
  {
    id: "adding-entries",
    title: "Adding an entry",
    tags: ["add", "create", "new entry", "form", "vertical", "save", "quick add"],
    content: `Press the + button in the header (or go to Settings > Add entry) to open the add form.

Required fields
- Title: a short name used in search results.
- Vertical: the category it belongs to. Type a new name to create a custom category.

Optional fields (click "More options" to expand)
- Type: reply, doc, sop, link, or tool.
- Tags: pipe-separated keywords (e.g. billing|refund|payment). These are searched directly so choose terms you would actually type.

Body vs URL
- Body: use this for text you copy and paste (saved replies, policy text, SOPs).
- URL: use this for a link to open in the browser.
- Both can be filled in on the same entry.

Clipboard shortcut
If your clipboard has text when you open ShortPath, a clipboard icon (📋) appears in the header. Click it to open the add form with the clipboard content pre-filled — one action from copy to saved entry.`,
  },
  {
    id: "editing-deleting",
    title: "Editing and deleting",
    tags: ["edit", "delete", "update", "remove", "change"],
    content: `Click the ✎ edit button on any entry row to open the edit form. All fields can be changed including type, tags, and vertical.

Synced entries (from a team-shared file) cannot be edited locally — the edit button only appears on your own entries.

Deleting an entry
In the edit form, click the Delete button. A confirmation prompt appears — click "Yes, delete" to confirm. Deleted entries are removed from search results and from Recents immediately.`,
  },
  {
    id: "managing-verticals",
    title: "Managing verticals and sub-folders",
    tags: ["verticals", "categories", "create vertical", "custom", "manage", "sub-folder", "subfolder", "folder", "organise"],
    content: `ShortPath comes with four built-in categories: Saved Replies, Documentation, Internal SOPs, and Support Tools.

Creating a custom vertical
In Settings > Verticals, click "+ Add vertical", type a name, and press Add. The new vertical is ready immediately for use in the Add or Edit entry form.

You can also create a vertical on the fly: in the Add or Edit form, type a new category name in the Vertical field and select the create option.

Renaming a vertical
In Settings > Verticals, click Rename next to any vertical, type the new name, and press Save.

Removing a vertical
To remove a vertical, delete or reassign all its entries. Empty verticals stop appearing in the results.

Sub-folders
Each vertical can have any number of sub-folders to keep large libraries organised. Sub-folders appear as collapsible groups inside a vertical's results.

To manage sub-folders: in Settings > Verticals, click the 📁 button next to any vertical to expand its sub-folder panel. From there you can add, rename, or remove sub-folders.

To assign an entry to a sub-folder: when adding or editing an entry, a Sub-folder selector appears below the Vertical field once the selected vertical has at least one sub-folder. Entries without a sub-folder assigned remain at the top level of their vertical.

Removing a sub-folder
Click Remove next to the sub-folder name and confirm. Any entries assigned to the removed sub-folder move back to the top level of the vertical — they are not deleted.`,
  },
  {
    id: "importing-csv",
    title: "Importing a CSV",
    tags: ["import", "csv", "template", "upload", "bulk", "file"],
    content: `Go to Settings > Import CSV to add entries in bulk from a spreadsheet.

File format
Required columns: title, vertical, type
Optional columns: body, url, tags, id, createdAt, updatedAt

Type must be one of: reply, doc, sop, link, tool
Tags use pipe separators: billing|refund|payment
The url column maps to the link field internally.

Download a template
Use Settings > Download template to get an example file showing the exact column format and four sample rows.

Import preview
Before committing, ShortPath shows a preview of the first 5 rows and flags any rows with errors. Review the preview, then click Import to confirm.

Update behavior
If a row's title + vertical matches an existing entry, that entry is updated. Otherwise a new entry is created. The source field is preserved — re-importing a local entry does not make it synced.`,
  },
  {
    id: "exporting-csv",
    title: "Exporting a CSV",
    tags: ["export", "csv", "backup", "download", "export mine"],
    content: `Go to Settings to access export options.

Export all
Writes every entry — your own and any synced team entries — to a CSV file. Use this for a full backup.

Export mine
Writes only your own entries (source: local). Use this to share your personal library with a team admin who can fold it into the shared master file. This is the standard bottom-up path for building a team resource from individual collections.

The exported file uses the same column format as the import template, so it can be re-imported into any ShortPath instance without modification.`,
  },
  {
    id: "shared-file-sync",
    title: "Shared file sync",
    tags: ["sync", "shared file", "team", "dropbox", "drive", "onedrive", "refresh", "synced"],
    content: `Shared file sync lets a team share a master CSV file via Dropbox, Google Drive, OneDrive, or any folder that syncs to a local path. Each team member points ShortPath at the same file and gets updates automatically.

Setup
1. Open Settings (⚙ in the header).
2. In the "Shared file sync" section, click "Configure sync file".
3. Select the CSV file from your synced folder (e.g. ~/Dropbox/Team/shortpath-team.csv).
4. ShortPath loads the file immediately and starts watching it.

How it works
ShortPath watches the file for changes. When the file is saved (e.g. by the team admin), ShortPath reloads it automatically within about a second. No restart needed.

If the watcher misses an update (can happen on network drives), use "Refresh now" in Settings to reload manually.

Your own entries are safe
Sync only touches entries marked as "synced". Your own entries are never modified, overwritten, or deleted by any sync operation — not even when you clear synced entries or switch to a different file.

Synced entries show a small "synced" badge in search results so you can tell them apart.

Switching or disconnecting
- To use a different file, click "Change file" in Settings.
- To remove synced entries without stopping sync, click "Clear synced entries". The watcher keeps running; entries reload on the next file change.
- To stop syncing entirely, click "Disconnect sync". This stops the file watcher, clears the sync path from settings, and removes all synced entries. No further reloads until you reconfigure.

See the "Disconnecting sync" help topic for a full comparison of the two actions.`,
  },
  {
    id: "support-tools",
    title: "Support Tools",
    tags: ["support tools", "links", "quick launch", "utilities", "grid", "reorder"],
    content: `Support Tools is a dedicated category for links you open regularly — admin panels, dashboards, forms, and other utilities.

Support Tools entries appear in a grid layout for faster scanning, separate from the text-based saved replies and docs.

Launching a tool
Click anywhere on a tool card to open its link in your default browser. The tool is also added to your Recents list.

Adding a tool
Click + in the header, set the Type to "tool", and fill in the Title and URL. Assign it to the Support Tools vertical (or any vertical — the grid layout applies specifically to the Support Tools vertical).

Reordering tools
When browsing (not searching), each tool card shows ↑ and ↓ buttons. Click them to change the order. The new order is saved immediately.

Editing and removing
Click ✎ on any tool card to open the edit form. You can change the title, URL, tags, or delete the tool.`,
  },
  {
    id: "settings",
    title: "Settings",
    tags: ["settings", "hotkey", "config", "window", "position", "sync"],
    content: `Open Settings from the ⚙ button in the header, or from the tray menu.

Global hotkey
The default shortcut is Ctrl+Shift+Space (Cmd+Shift+Space on Mac). To change it, click "Change hotkey", hold your new combination, then release to save. Press Esc to cancel without saving. If the combination is already in use by another app, you will see an error.

Window
The window remembers its position and size between launches. Click "Reset to default position" to snap it back to the bottom-left corner at the default size.

Data
Import CSV, Export all, Export mine, Download template, Paste and split, and Add new entry are all available in the Data section of Settings.

Clear all entries
Below the data action grid, a "Clear all entries" button permanently deletes every local entry. Synced entries are not affected. Use this to start fresh without reconfiguring sync. This cannot be undone — export your data first if you want a backup.

Shared file sync
See the "Shared file sync" help topic for full setup instructions.`,
  },
  {
    id: "text-size",
    title: "Adjusting text size",
    tags: ["font", "text", "size", "appearance", "slider", "large", "accessibility"],
    content: `ShortPath lets you adjust the text size using a slider in Settings > Appearance. Drag left for smaller text, right for larger. The change applies immediately — no restart needed. The setting persists across launches.

What scales: search input, entry titles, body text, form fields, buttons, and help content. Small decorative labels (vertical headers, badges) stay fixed.`,
  },
  {
    id: "theme",
    title: "Light and dark mode",
    tags: ["theme", "dark", "light", "mode", "appearance", "color"],
    content: `ShortPath supports dark mode (default) and light mode.

To switch, open Settings (⚙ in the header) and find the Appearance section. Click Dark or Light under Theme. The change applies instantly and is saved across launches.`,
  },
  {
    id: "vertical-rename",
    title: "Renaming verticals",
    tags: ["vertical", "rename", "category", "name", "settings"],
    content: `You can rename any vertical from Settings > Verticals.

Open Settings, expand the Verticals section, and click Rename next to any vertical. Type the new name and press Enter (or click Save). Press Esc to cancel without saving.

The rename applies everywhere: group headers, entry forms, and the overlay badge. The vertical's internal ID does not change, so all entries remain linked correctly.`,
  },
  {
    id: "favorites",
    title: "Favorites",
    tags: ["star", "favorites", "bookmark", "saved", "quick access"],
    content: `You can star any entry to save it to your Favorites list.

Adding and removing favorites
On any result row, hover to reveal action buttons. The ☆ star button is on the left side of the row. Click it to star the entry; it turns ★ amber and stays visible even when you stop hovering. Click again to unstar.

In the expanded overlay (click any result to open it), the star appears in the top-left of the header. Click it to toggle.

Opening Favorites
Click the ☆ icon in the main header (next to ? Help). This opens the Favorites view, which lists all your starred entries. Every entry in the list supports the same copy, edit, and open actions as the main search.

Click ← Back (or the header path) to return to the main list.

Notes
Favorites are stored on your machine in the local store. If an entry is deleted, it is removed from favorites automatically. Synced entries can be starred just like local ones — the favorite status is yours and is not affected by sync refreshes.`,
  },
  {
    id: "source-mode",
    title: "Header path",
    tags: ["header", "source", "local", "home", "navigation"],
    content: `The top-left of every screen shows "shortpath / Local". Clicking it returns you to the main list and clears the current search from anywhere in the app.`,
  },
  {
    id: "editing-overlay",
    title: "Editing entries from the overlay",
    tags: ["edit", "overlay", "duplicate", "synced", "local", "in-place"],
    content: `When you open an entry in the overlay (click any result, or press Enter on a focused result), an edit section appears below the body text.

Local entries
For entries you created yourself (source: local), a "✎ Edit entry" button opens the full edit form. You can change the title, vertical, type, body, URL, and tags. Save writes the change immediately to the store.

Synced entries
Synced entries come from the shared team CSV file. ShortPath does not write back to that file, so any change you made would be overwritten the next time the file refreshes. Instead of editing in place, ShortPath offers "⊕ Duplicate to local and edit". This creates a new local copy of the entry (with source: local) and opens it in the edit form. The original synced entry is unchanged. Your local copy is yours to keep and will not be affected by future sync refreshes.`,
  },
  {
    id: "disconnect-sync",
    title: "Disconnecting sync",
    tags: ["sync", "disconnect", "stop", "clear", "watcher", "file"],
    content: `When a sync file is configured, the Settings > Shared file sync section shows two separate actions for removing synced content.

Clear synced entries
Removes all synced entries from the local store. The file watcher keeps running. If the sync file changes, or if you click "Refresh now", synced entries will reload. Use this when you want a clean slate without stopping sync.

Disconnect sync
Stops the file watcher completely, clears the sync file path from settings, and removes all synced entries. After disconnecting, no further reloads will occur until you click "Configure sync file" again. Use this when you are switching files or want to stop syncing permanently.

Both actions require a second click to confirm. Neither action touches your local entries.`,
  },
  {
    id: "notes",
    title: "Notes",
    tags: ["notes", "note", "write", "personal", "private", "memo"],
    content: `Notes is a private scratchpad built into ShortPath. Notes are completely separate from entries — they never appear in search results, are never exported to CSV, and are never affected by sync.

Opening Notes
Click the ✎ icon in the header to open the Notes view.

Creating a note
Click + New. A blank note opens immediately in the editor. Start typing — your note is saved automatically as you type.

Linking a note to a resource
Open a resource by clicking on it in search results, then click "Add note" in the edit strip at the bottom of the panel. A new note opens in the editor, linked to that resource. In the Notes list, linked notes show the resource name in blue beneath the title.

Editing a note
From the notes list, click any note to open it in the editor. The title field is optional. The body field is a plain-text area — you can write freely without formatting.

Notes auto-save about a second after you stop typing. You do not need to click a Save button.

Deleting a note
While viewing a note in the editor, click "Delete note". A confirmation prompt appears in the same footer bar. Click Delete to confirm, or Cancel to go back.

Searching notes
In the notes list, type in the search box to filter notes by title or body. The filter applies in real time.

Sorting
Click the Newest / Oldest button to toggle sort order. Newest (default) shows the most recently updated note first.

Data
Notes are stored in notes.json in your app data folder, separate from store.json. They are local only and are never synced or exported.`,
  },
  {
    id: "accent-and-appearance",
    title: "Accent color and appearance",
    tags: ["accent", "color", "theme", "opacity", "density", "window size", "customization"],
    content: `The Appearance section in Settings lets you personalize how ShortPath looks and fits on your screen.

Accent color
Choose from six presets: Ocean (blue), Violet, Rose, Amber, Teal, and Slate. The chosen color drives highlights throughout the app — the active tab underline, copy button glow, focused row border, and input focus ring. The active swatch shows a thin ring in that color.

Opacity
Drag the slider between 70% and 100% to make the window semi-transparent. At 70% you can see content behind the window while keeping it usable. Restore to 100% for a fully opaque window. The value is saved and restored on next launch.

Window size
Choose Small (380×520), Medium (480×640, default), or Large (580×760). Clicking a size button resizes the window immediately and saves the choice. After picking a preset the window still shows that size at next launch.

Density
Comfortable (default) shows entries at their standard spacing. Compact reduces padding and font size slightly, fitting 2–3 more results on screen without scrolling. Pick the one that suits your screen size.`,
  },
  {
    id: "pinned-entries",
    title: "Pinned entries",
    tags: ["pin", "pinned", "top", "priority", "quick access"],
    content: `Pin up to 8 entries to keep them at the top of the main list when you open ShortPath.

Pinning an entry
Hover any result row to reveal the 📍 pin button on the left side of the row. Click it to pin the entry — the icon changes to 📌 and the button stays visible. You can also pin from the expanded overlay using the 📍 button in the header.

Pinned section
When the search bar is empty, a "Pinned" section appears at the top of the results above everything else. Pinned entries are also visible in this section in the order you pinned them.

During search
When you type a search query, pins are no longer forced to the top — results rank by relevance. The pin icon still shows on pinned rows, but relevance wins.

Limit
You can pin at most 8 entries. If you try to pin a ninth, a message appears: "Unpin an entry to pin this one (max 8)." Click the 📌 icon on any pinned entry to unpin it first.`,
  },
  {
    id: "sort-and-usage",
    title: "Sort and usage counter",
    tags: ["sort", "usage", "copy count", "recently added", "a to z", "most used"],
    content: `The sort control and copy counter help you surface the most useful entries.

Sort control
The sort bar sits between the search box and results. Options:

Relevance — when a query is active, results rank by how well they match. When no query is active, "Relevance" falls back to Most used.
Most used — sorts by how many times you have copied each entry (highest first).
Recently added — newest entries first.
A to Z — alphabetical by entry title.

The sort choice resets to Relevance when you restart the app.

Usage counter
Every time you copy a local entry's body to clipboard, its copy count increments by 1. The count appears as a small muted badge (e.g. "12×") to the right of the entry title in search results. The badge only appears if the count is greater than zero. Synced entries are not tracked.`,
  },
  {
    id: "recent-copies",
    title: "Recent copies",
    tags: ["recent", "copies", "history", "session"],
    content: `The "Recent" section shows the last 5 entries you copied this session.

It appears at the top of the results list (below any pinned entries) when the search bar is empty. If you have not copied anything yet during the current session, the section does not appear.

Recent copies are stored in memory only — they reset every time you restart the app. They are not saved to disk and do not appear in exports.`,
  },
  {
    id: "vertical-tabs",
    title: "Vertical tabs and tab order",
    tags: ["tabs", "verticals", "filter", "order", "drag", "reorder"],
    content: `The vertical tab bar lets you scope the results list to a single category.

Tab bar
When you have more than one vertical, a compact tab bar appears between the search box and results. "All" is selected by default. Click any vertical tab to filter results to that category only. Click the same tab again (or "All") to remove the filter.

Keyboard
Press Tab while the search input is focused to cycle through the vertical tabs. Shift+Tab cycles backwards.

Custom tab order
In Settings > Organization > Tab order, your verticals are listed as draggable rows. Each row shows a drag handle (⠿), the vertical name, and its entry count. Drag rows up or down to reorder them. The order persists between sessions and is applied to both the tab bar and the grouped results list.`,
  },
  {
    id: "copy-then-hide",
    title: "Copy then auto-hide",
    tags: ["auto-hide", "copy", "behavior", "window", "close"],
    content: `When "Hide window after copying" is enabled in Settings > Behavior, ShortPath automatically hides its window 300ms after a successful copy.

The brief delay lets you see the "Copied ✓" confirmation before the window disappears. The window does not close — it hides to the tray and can be recalled with the summon hotkey.

This setting is off by default. Turn it on if you prefer a one-and-done workflow where copying a reply automatically gets ShortPath out of your way.`,
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    tags: ["troubleshooting", "hotkey conflict", "not opening", "missing entries", "sync", "problem"],
    content: `Hotkey not working
The global hotkey may be blocked if another app registered the same combination. Open Settings > Global hotkey and try a different one, such as Ctrl+Shift+1 or Ctrl+Alt+Space.

Window not appearing
If the window does not show when you press the hotkey, click the ShortPath icon in the system tray. If the icon is missing, the app may have stopped running — relaunch it from your Applications folder or Start menu.

Entries missing after import
Check the import result for skipped-row errors. Common causes: missing required columns (title, vertical, type), an invalid type value, or column names that do not match the expected format. Download the template from Settings to see the exact format.

Sync not updating
If the sync file is on a network drive or cloud folder, the file watcher may be delayed or unreliable. Use Settings > Shared file sync > Refresh now to reload manually.

App data location
Windows: %APPDATA%\\ShortPath (store.json and settings.json)
Mac: ~/Library/Application Support/ShortPath`,
  },
];
