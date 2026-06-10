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
    tags: ["intro", "overview", "install", "launch", "onboarding", "sample data"],
    content: `ShortPath is a local desktop app that puts your support library — saved replies, documentation, SOPs, and quick-launch tools — in one fast, searchable surface.

Press the hotkey (default: Ctrl+Shift+Space) from anywhere on your desktop. The window opens with focus already in the search box. Type a keyword to search every category at once. Click a result to read it in full, or use the copy button to copy it straight to your clipboard.

Everything is stored on your machine. Nothing is sent to a server. No login required.

First run
When you launch ShortPath for the first time, a 4-step onboarding overlay walks you through the key features. You can skip it at any time or step through it at your own pace. On the second step you can load 50 sample entries to explore the app before adding your own data.

First steps
1. Press the hotkey: Ctrl+Shift+Space (Cmd+Shift+Space on Mac).
2. Type a few characters to search the sample entries.
3. Click any result to open it, or use the ⎘ copy button that appears on hover.
4. Use the + button in the header to add your first real entry.
5. If your team has a shared CSV file, configure it in Settings > Sync.`,
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
Click the K button in the main header to open the Keyboard Shortcuts panel. The first row shows the global summon hotkey with a Change button next to it. Click Change, press your new key combination, and it saves automatically. If the combination is already taken by another app you will see an error — try a different one.`,
  },
  {
    id: "searching",
    title: "Searching",
    tags: ["search", "query", "fuzzy", "keywords", "tips", "find"],
    content: `Type at least 2 characters to start searching. Results appear instantly as you type, grouped by category.

The search is fuzzy — it finds close matches even with minor typos. Title is weighted most heavily, then tags, then body text.

Search mode
Two buttons sit to the right of the search bar: Keyword and Full text.

Keyword (default): searches titles and tags only. Fast and precise — best for day-to-day lookups.

Full text: also searches the body of every entry. Slower but useful when you remember a phrase from the body but not the title or tags. Body matches are weighted lower than title and tag matches so the most relevant results still rise to the top.

Your mode choice is saved automatically and persists across sessions.

Tips for better results
- Short, specific keywords work better than long phrases ("billing" not "customer has a billing question").
- Tag keywords give the most precise results — tags like "refund", "escalation", "VIP" are designed for quick lookup.
- If nothing comes up, try switching to Full text mode, then check spelling or try a synonym.
- Entries with no body (link-only) can still be found by title or tags.

Keyboard navigation
Once results appear, press ArrowDown to move focus into the list. Use ArrowUp/ArrowDown to move between results, Enter to open the focused result, and Esc to return focus to the search box.

When the search box is empty, the app shows your recently accessed entries.`,
  },
  {
    id: "understanding-results",
    title: "Understanding results",
    tags: ["results", "verticals", "groups", "hit count", "expand", "collapse", "categories", "source number"],
    content: `Results are grouped by category (called verticals). Each group header shows the category name and the number of matching entries.

Expanding and collapsing groups
Click any group header to expand or collapse it. Collapsed groups still count toward the total hit count shown in the header.

Entry types
- reply: a saved response to copy and paste into a support ticket.
- doc: a piece of documentation or policy text.
- sop: a standard operating procedure — step-by-step instructions.
- link: an external URL to open in the browser.
- tool: a quick-launch link shown in the Support Tools grid.

Sync source numbers
If one or more sync files are connected, entries from those files show a small muted number to the right of the title (e.g. #1, #2). The number matches the source's position in Settings > Sync. This replaces the old "synced" badge and works when multiple CSV sources are connected at once.

Hover actions
Hovering any result row reveals action buttons on the right: pin (circle), star (☆), edit (✎), and copy (⎘). Entries that are already pinned or starred show their action buttons faintly even without hovering so you can see their state at a glance.`,
  },
  {
    id: "copying",
    title: "Copying an entry",
    tags: ["copy", "clipboard", "copy button", "paste"],
    content: `Click any entry to open a detail panel showing the full content. Use the Copy button in the panel to copy the text to your clipboard.

You can also hover a result row and click the ⎘ copy button on the right to copy without opening the panel.

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
    tags: ["filter", "vertical", "scope", "category", "group", "tab"],
    content: `Use the vertical tab bar to scope results to one category. Click any tab to filter; click "All" or the same tab again to remove the filter.

You can also collapse groups by clicking their headers. Collapsed groups are excluded from keyboard navigation.

Tab order can be customized in Settings > Organization > Tab order.`,
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
    content: `Press the + button in the header (or go to Settings > Data > Add entry) to open the add form.

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
If your clipboard has text when you open ShortPath, a clipboard icon (📋) appears in the header. Click it to open the add form with the clipboard content pre-filled — one action from copy to saved entry.

Import from URL
In the add form, click "Import from URL" to fetch the readable content from a web page. An editable text preview appears — trim or adjust the text, then click "Use this text" to populate the body field.`,
  },
  {
    id: "editing-deleting",
    title: "Editing and deleting",
    tags: ["edit", "delete", "update", "remove", "change"],
    content: `Hover any result row and click the ✎ edit button (right side) to open the edit form. All fields can be changed including type, tags, and vertical.

Synced entries (from a team-shared file) cannot be edited locally — the edit button opens a "Duplicate to local and edit" option instead.

Deleting an entry
In the edit form, click the Delete button. A confirmation prompt appears — click "Yes, delete" to confirm. Deleted entries are removed from search results and from Recents immediately.`,
  },
  {
    id: "managing-verticals",
    title: "Managing verticals and sub-folders",
    tags: ["verticals", "categories", "create vertical", "custom", "manage", "sub-folder", "subfolder", "folder", "organise"],
    content: `ShortPath comes with four built-in categories: Saved Replies, Documentation, Internal SOPs, and Support Tools.

Creating a custom vertical
In Settings > Organization, click "+ Add vertical", type a name, and press Add. The new vertical is ready immediately for use in the Add or Edit entry form.

You can also create a vertical on the fly: in the Add or Edit form, type a new category name in the Vertical field and select the create option.

Renaming a vertical
In Settings > Organization, click Rename next to any vertical, type the new name, and press Save.

Sub-folders
Each vertical can have any number of sub-folders to keep large libraries organised. Sub-folders appear as collapsible groups inside a vertical's results.

To manage sub-folders: in Settings > Organization, click the 📁 button next to any vertical to expand its sub-folder panel. From there you can add, rename, or remove sub-folders.

To assign an entry to a sub-folder: when adding or editing an entry, a Sub-folder selector appears below the Vertical field once the selected vertical has at least one sub-folder.

Removing a sub-folder
Click Remove next to the sub-folder name and confirm. Any entries assigned to the removed sub-folder move back to the top level of the vertical — they are not deleted.`,
  },
  {
    id: "importing-csv",
    title: "Importing a CSV",
    tags: ["import", "csv", "template", "upload", "bulk", "file", "subfolder", "folder", "column mapping", "drag"],
    content: `Go to Settings > Data > Import CSV to add entries in bulk from a spreadsheet.

How to import
Drag a CSV file onto the drop zone, or click "Choose file..." to open a file picker. ShortPath always shows a column mapping screen before importing.

Column mapping
ShortPath detects your file's headers and suggests mappings automatically. Use the dropdowns to assign each ShortPath field to the correct column in your file. Title and Vertical are required; all other fields are optional. This works with any CSV regardless of its column names.

File format (when using the template)
Required columns: title, vertical, type
Optional columns: body, url, subfolder, tags

Type must be one of: reply, doc, sop, link, tool
Tags use pipe separators: billing|refund|payment

Sub-folders
Include a subfolder column in your CSV to place entries in a specific folder within a vertical. If the folder doesn't exist yet, ShortPath creates it automatically on import.

Download a template
Use Settings > Data > Download template to get an example file showing the exact column format.

Update behavior
If a row's title + vertical matches an existing entry, that entry is updated. Otherwise a new entry is created.`,
  },
  {
    id: "exporting-csv",
    title: "Exporting a CSV",
    tags: ["export", "csv", "backup", "download", "export mine"],
    content: `Go to Settings > Data to access export options.

Export all
Writes every entry — your own and any synced team entries — to a CSV file. Use this for a full backup.

Export mine
Writes only your own entries (source: local). Use this to share your personal library with a team admin who can fold it into the shared master file.

The exported file uses the same column format as the import template, so it can be re-imported into any ShortPath instance without modification.`,
  },
  {
    id: "shared-file-sync",
    title: "Shared file sync",
    tags: ["sync", "shared file", "team", "dropbox", "drive", "onedrive", "refresh", "synced", "multiple sources"],
    content: `Shared file sync lets a team share a master CSV file via Dropbox, Google Drive, OneDrive, or any folder that syncs to a local path. Each team member points ShortPath at the same file and gets updates automatically.

You can connect multiple CSV files simultaneously — each one is an independent sync source.

Setup
1. Install a desktop sync client: Google Drive for Desktop, Dropbox, or OneDrive. Sign in and let it sync a folder on your machine.
2. Put your CSV file inside that synced folder.
3. Open Settings > Sync in ShortPath.
4. Click "+ Add sync source" and select the CSV file.
5. ShortPath loads the file immediately and starts watching it for changes.

For Google Drive: upload your CSV at drive.google.com, then find it in your local Google Drive folder (created by Google Drive for Desktop) and select it from there.

How it works
ShortPath watches the file for changes. When the file is saved (e.g. by the team admin updating it in Google Sheets and re-exporting), ShortPath reloads it automatically within about a second. No restart needed.

If the watcher misses an update (can happen on network drives), use "Refresh" on the source card to reload manually.

Source numbers
Each connected source is assigned a number (#1, #2, …). This number appears next to any entry that came from that source so you can tell at a glance which file it belongs to.

Your own entries are safe
Sync only touches entries from that source. Your own entries are never modified, overwritten, or deleted by any sync operation.

Adding more sources
Click "+ Add sync source" again to connect a second CSV. Both files are watched simultaneously. Each source's entries are tracked independently — refreshing or disconnecting one does not affect the other.`,
  },
  {
    id: "support-tools",
    title: "Support Tools",
    tags: ["support tools", "links", "quick launch", "utilities", "grid", "reorder", "pin", "favorite"],
    content: `Support Tools is a dedicated category for links you open regularly — admin panels, dashboards, forms, and other utilities.

Support Tools entries appear in a grid layout for faster scanning, separate from the text-based saved replies and docs.

Launching a tool
Click anywhere on a tool card to open its link in your default browser. The tool is also added to your Recents list.

Adding a tool
Click + in the header, set the Type to "tool", and fill in the Title and URL.

Reordering tools
When browsing (not searching), each tool card shows ↑ and ↓ buttons. Click them to change the order. The new order is saved immediately.

Favoriting and pinning tools
Hover a tool row to reveal the star (☆) and pin (circle) buttons alongside the edit button. Starring adds the tool to your Favorites list. Pinning adds it to the Pinned section at the top of the main results view. Both work the same as for regular entries.

Editing and removing
Click ✎ on any tool card to open the edit form. You can change the title, URL, tags, or delete the tool.`,
  },
  {
    id: "settings",
    title: "Settings",
    tags: ["settings", "hotkey", "config", "window", "position", "sync", "navigation", "pages"],
    content: `Open Settings from the ⚙ button in the header, or from the tray menu.

Settings are organized into five pages. Click any page from the main Settings menu to open it. Click "← Settings" in the page header to return to the menu.

Appearance
Text size, theme (dark/light), accent color, opacity, window size, and density.

Behavior
Hide window after copying, keep window on top, window position reset, and update check. Also contains a "Replay onboarding" button if you want to walk through the first-run onboarding overlay again.

Organization
Tab order (drag to reorder), vertical management (rename, delete), and sub-folder management.

Sync
Connect CSV files from cloud-synced folders. See the "Shared file sync" help topic for full setup instructions.

Data
Add entry, Import CSV, Paste and split, Download template, Export all, Export mine, Export selected, Export Stream Deck profile, Remove sample data, and Clear all entries.

Keyboard shortcuts
The summon hotkey and all in-app shortcuts are configured in the Keyboard Shortcuts panel — click the K button in the main header. This is separate from Settings.`,
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

To switch, open Settings > Appearance and click Dark or Light under Theme. The change applies instantly and is saved across launches.`,
  },
  {
    id: "vertical-rename",
    title: "Renaming verticals",
    tags: ["vertical", "rename", "category", "name", "settings"],
    content: `You can rename any vertical from Settings > Organization.

Click Rename next to any vertical, type the new name, and press Enter (or click Save). Press Esc to cancel without saving.

The rename applies everywhere: group headers, entry forms, and the overlay badge. The vertical's internal ID does not change, so all entries remain linked correctly.`,
  },
  {
    id: "favorites",
    title: "Favorites",
    tags: ["star", "favorites", "bookmark", "saved", "quick access"],
    content: `You can star any entry to save it to your Favorites list.

Adding and removing favorites
Hover any result row to reveal action buttons on the right side. Click the ☆ star button to star the entry — it turns ★ amber. Click again to unstar. Entries that are already starred show their action buttons faintly even without hovering.

In the expanded overlay (click any result to open it), the star appears in the header. Click it to toggle.

Support Tools
Tool cards in the Support Tools grid also support starring. Hover a card and click ☆ to add it to Favorites.

Opening Favorites
Click the ☆ icon in the main header (next to ? Help). This opens the Favorites view, which shows each starred entry as a card. Each card displays the entry's vertical category label above the title so you can tell at a glance where the entry came from. Every entry in the list supports the same copy, edit, and open actions as the main search.

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
    content: `When sync sources are connected, each source card in Settings > Sync has a Disconnect button.

Disconnect (per source)
Stops the file watcher for that source, removes it from settings, and removes all entries that came from that file. Other sync sources are not affected. No further reloads from that file until you add it back with "+ Add sync source".

Both the Refresh and Disconnect actions are per-source, so you can manage each connected file independently. Neither action touches your local entries.`,
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

Saving a note
Click Save (or press Enter on the Save button) to save and return to the notes list.

Linking a note to a resource
Open a resource by clicking on it in search results, then click "Add note" in the edit strip at the bottom of the panel. A new note opens in the editor, linked to that resource. In the Notes list, linked notes show the resource name in blue beneath the title.

Editing a note
From the notes list, click any note to open it in the editor. The title field is optional. The body field is a plain-text area — you can write freely without formatting.

Deleting a note
While viewing a note in the editor, click "Delete note". A confirmation prompt appears in the same footer bar. Click Delete to confirm, or Cancel to go back.

Searching notes
In the notes list, type in the search box to filter notes by title or body. The filter applies in real time.

Data
Notes are stored in notes.json in your app data folder, separate from store.json. They are local only and are never synced or exported.`,
  },
  {
    id: "accent-and-appearance",
    title: "Accent color and appearance",
    tags: ["accent", "color", "theme", "opacity", "density", "window size", "customization"],
    content: `The Appearance section in Settings lets you personalize how ShortPath looks and fits on your screen.

Accent color
Choose from six presets: Ocean (blue), Violet, Rose, Amber, Teal, and Slate. The chosen color drives highlights throughout the app — the active tab underline, copy button glow, focused row border, and input focus ring.

Opacity
Drag the slider between 70% and 100% to make the window semi-transparent. At 70% you can see content behind the window while keeping it usable. Restore to 100% for a fully opaque window. The value is saved and restored on next launch.

Window size
Choose Small (380×520), Medium (480×640, default), or Large (580×760). Clicking a size button resizes the window immediately and saves the choice.

Density
Comfortable (default) shows entries at their standard spacing. Compact reduces padding and font size slightly, fitting 2–3 more results on screen without scrolling.`,
  },
  {
    id: "pinned-entries",
    title: "Pinned entries",
    tags: ["pin", "pinned", "top", "priority", "quick access"],
    content: `Pin up to 8 entries to keep them at the top of the main list when you open ShortPath.

Pinning an entry
Hover any result row to reveal action buttons on the right side. Click the circle pin button to pin the entry — the circle fills with your accent color and the entry's action buttons remain faintly visible even without hovering. You can also pin from the expanded overlay using the pin button in the header.

Support Tools can also be pinned. Hover a tool row and click the pin button to pin it.

Pinned section
When the search bar is empty, a "Pinned" section appears at the top of the results above everything else. Pinned entries are also visible in this section in the order you pinned them. Click the section header to collapse or expand it.

During search
When you type a search query, pins are no longer forced to the top — results rank by relevance. The filled pin circle still shows on pinned rows, but relevance wins.

Limit
You can pin at most 8 entries. If you try to pin a ninth, a message appears: "Unpin an entry to pin this one (max 8)." Click the filled pin circle on any pinned entry to unpin it first.`,
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
    id: "pin-window",
    title: "Pin window (always on top)",
    tags: ["pin", "always on top", "window", "desktop", "float"],
    content: `The circle pin button in the main header keeps the ShortPath window visible above all other windows on your desktop.

When active (circle filled with accent color), the window stays in front even when you click away to another app. This is useful when you need to read a saved reply while typing into a support tool in another window.

Click the button again to unpin. The setting persists between sessions.

The global hotkey still works when pinned — pressing it will hide the window even if it is on top.`,
  },
  {
    id: "stream-deck-export",
    title: "Stream Deck profile export",
    tags: ["stream deck", "elgato", "profile", "export", "hardware", "buttons", "layout"],
    content: `Settings > Data > Export Stream Deck Profile creates a .streamDeckProfile file you can import directly into the Elgato Stream Deck app.

Device layout
Before exporting, a dialog lets you choose your device model or set a custom layout:
- Mini: 3×2 (6 buttons)
- Standard: 5×3 (15 buttons)
- XL: 8×4 (32 buttons)
- Neo: 4×2 (8 buttons)
- Custom: enter any columns × rows

The export creates buttons to fill that grid exactly. If you have more entries than buttons, the first N entries are used (N = columns × rows).

How to import it
1. Double-click the .streamDeckProfile file — Stream Deck app opens and prompts you to import.
   Or: open the Stream Deck app, go to Preferences > Profiles, click the gear icon, and choose Import.
2. The profile appears in your profile list under "ShortPath".
3. Switch to it and you will see your entries as labeled buttons.

Wiring up button actions
The exported buttons have labels but no action assigned yet. After import, click any button in the Stream Deck editor and assign the action you want.`,
  },
  {
    id: "rich-text",
    title: "Rich text and copy modes",
    tags: ["rich text", "html", "bold", "italic", "copy mode", "tiptap", "formatting"],
    content: `The body field in the add and edit forms uses a rich text editor. You can apply formatting using the toolbar above the editor.

Toolbar buttons
- B / I / U: bold, italic, underline
- Bullet list / ordered list: multi-item content
- <> / { }: inline code span and code block
- Link icon: add or remove a hyperlink (prompts for URL)

Active buttons highlight in your accent color.

Copy modes
Each entry has a "Copy as" setting below the editor:

Plain text (default): strips all HTML tags before writing to the clipboard. What you see in the editor is what gets pasted as plain text into your support tool or browser field.

HTML: writes the formatted HTML to the clipboard, plus a plain-text fallback. Paste into a rich-text field (an email editor, Notion, Google Docs) and the formatting is preserved. Paste into a plain-text field and you get the stripped version automatically.`,
  },
  {
    id: "import-from-url",
    title: "Importing from a URL",
    tags: ["url", "import", "web", "page", "fetch", "readability", "preview"],
    content: `Any add-entry or edit-entry form can pull content from a web page.

How to use it
1. Open the add form (+ button in the header) or the edit form for an existing entry.
2. Click "Import from URL" above the body field.
3. Paste the page URL into the input that appears and click Fetch.
4. ShortPath downloads the page and extracts the readable content.
5. An editable text preview appears. Trim, rearrange, or remove any content you don't need.
6. Click "Use this text" to populate the body field with whatever remains in the preview.
7. Click Discard to cancel without changing the body.

If the title field is empty when you fetch, ShortPath auto-fills it from the page title.

Error handling
If the page cannot be fetched (network error, access denied, or parsing failure), an error message appears below the URL input. Check that the URL is public and reachable.`,
  },
  {
    id: "import-markdown",
    title: "Importing Markdown files",
    tags: ["markdown", "md", "import", "drag", "sections", "headings", "file"],
    content: `You can drag a Markdown (.md) file onto the Import screen to create multiple entries from a single file.

How to import
1. Open Settings and click the Import tab, or go to Settings > Data > Import CSV.
2. Drag a .md file onto the drop zone.
3. ShortPath parses the file and splits it at ## and ### headings, treating each section as a potential entry.
4. A preview screen shows all detected sections with checkboxes. Each section shows its heading as the title and the body text below.
5. Select a vertical (required) and optionally a sub-folder from the dropdowns at the top.
6. Use "All" / "None" to toggle all checkboxes at once.
7. Click Import. ShortPath creates one entry per checked section, with type "doc" and the chosen vertical.

Heading detection
Top-level headings (# Title) are not treated as section boundaries — they become the lead-in text of the first section. Sections split at ## and ### headings only. If the file has no ## or ### headings, the entire file is one section.`,
  },
  {
    id: "import-pdf",
    title: "Importing PDF files",
    tags: ["pdf", "import", "drag", "sections", "file", "text extraction"],
    content: `You can drag a PDF (.pdf) file onto the Import screen to create entries from extracted text.

How to import
1. Open Settings and click the Import tab, or go to Settings > Data > Import CSV.
2. Drag a .pdf file onto the drop zone.
3. ShortPath extracts the text and splits it into sections based on detected headings and paragraph breaks.
4. A preview screen shows all detected sections with checkboxes.
5. Select a vertical (required) and optionally a sub-folder.
6. Use "All" / "None" to toggle all checkboxes, then click Import.

ShortPath creates one entry per checked section with type "doc".

Limitations
Text extraction is best-effort. Scanned PDFs (images of text) are not supported — no text will be extracted. If the sections look wrong, import them and edit the entries manually after.`,
  },
  {
    id: "browser-extension",
    title: "Browser extension",
    tags: ["extension", "browser", "chrome", "firefox", "capture", "context menu", "queue", "send to shortpath"],
    content: `The ShortPath browser extension lets you save selected text or the current page to ShortPath with a right-click.

What it does
- Adds a "Save to ShortPath" item to the browser right-click menu.
- If you have text selected, that text becomes the entry body.
- If no text is selected, the page title and URL are captured.
- When ShortPath is running, the capture is sent immediately and the app opens with the entry pre-filled in the add form.
- When ShortPath is not running, the capture is queued in browser storage and imported automatically the next time ShortPath is open and the extension connects.

Toolbar popup
Click the ShortPath icon in the browser toolbar to see the connection status.
- Green dot: ShortPath is running. A "Save current page" button captures the active tab. If items are queued, an "Import now" button appears.
- Red dot: ShortPath is not running. The queued item count is shown. Items will be imported automatically when ShortPath next opens.

Queue behavior
Queued captures are stored in browser local storage. They are sent when the extension starts up and ShortPath is already running, or when you click "Import now" in the popup.

Installing in Chrome
1. Build the extension: node build.js chrome (from the packages/browser-extension directory).
2. Open chrome://extensions and enable Developer mode.
3. Click Load unpacked and select dist/chrome/.

Installing in Firefox
1. Build: node build.js firefox.
2. Open about:debugging > This Firefox > Load Temporary Add-on.
3. Select dist/firefox/manifest.json.

Troubleshooting
If the extension shows "not running" when ShortPath is open, check that nothing else is using port 57433 and try reloading the extension.`,
  },
  {
    id: "onboarding",
    title: "First-run onboarding",
    tags: ["onboarding", "first run", "welcome", "setup", "tour", "walkthrough", "replay"],
    content: `When you launch ShortPath for the first time, a 4-step onboarding overlay appears on top of the main window.

Step 1 — Welcome
Shows the app name, a one-line description, and your global summon hotkey so you know how to open ShortPath from anywhere.

Step 2 — Get your data in
Two options: Download CSV template (saves a blank template to get your team's data into the right format) and Start with sample data (loads 50 pre-written entries across Saved Replies, Documentation, SOPs, and Support Tools so you can explore every feature immediately).

Step 3 — Help center
Opens the Help window (this window) and shows the most useful keyboard shortcuts at a glance.

Step 4 — Quick tips
A short list of the most useful things to know: how to search, how to copy, and how to add entries.

Skipping and completing
Press Skip at any step to close the overlay without finishing. Press Done on the last step to complete it. Either way, the overlay does not reappear on future launches.

After completing the onboarding (Done on step 4), the Help center opens automatically so you can explore topics at your own pace.

Replaying the onboarding
Open Settings > Behavior and click "Replay onboarding". The overlay opens again from step 1. Replaying does not re-open the Help center automatically.`,
  },
  {
    id: "sample-data",
    title: "Sample data",
    tags: ["sample", "demo", "test data", "example entries", "remove", "clear"],
    content: `Sample data is a set of 50 pre-written entries that cover common support scenarios across four categories: Saved Replies, Documentation, Internal SOPs, and Support Tools.

Loading sample data
During the first-run onboarding, click "Start with sample data (50 entries)" on step 2. You can also load it at any time from Settings > Data > Install sample data.

What it includes
The entries are realistic enough to demonstrate every feature — search, filtering, copy, favorites, pinning, and more. They cover scenarios like billing inquiries, refunds, escalations, password resets, and shipping delays. Cross-vertical tags (refund, escalation, password) mean that a single search returns hits from multiple categories at once, which shows how the grouped results view works.

Sample data banner
After loading sample data, a blue banner appears at the top of the window: "Sample data loaded — replace with your own entries via CSV import or the + button." Click the X on the right to dismiss the banner. It does not reappear once dismissed.

Removing sample data
Go to Settings > Data and click "Remove sample data". A confirmation prompt shows how many sample entries will be deleted. Confirm to remove them all in one action. Your own entries (added manually or imported via CSV) are not affected.

Sample entries are tracked with source: "sample" internally so removal is always precise — the app never accidentally deletes your own work.`,
  },
  {
    id: "search-mode",
    title: "Search mode: Keyword vs Full text",
    tags: ["search mode", "keyword", "full text", "body search", "toggle"],
    content: `Two search mode buttons sit to the right of the search bar.

Keyword mode (default)
Searches entry titles and tags only. This is the fastest and most precise mode. Because tags are designed for lookup terms ("refund", "escalation", "VIP"), Keyword mode almost always finds what you need in 1–2 words.

Full text mode
Also searches the body of every entry. Useful when you remember a phrase or sentence from the content but cannot recall the title or the right tag. Body matches are weighted lower than title and tag matches, so a title match will still rank above a body-only match.

Switching modes
Click Keyword or Full text next to the search bar. The active button is highlighted. Your choice is saved to local storage and persists across sessions and app restarts.

When to use Full text
- You are looking for a specific policy clause or procedure step buried in a long doc.
- You know the entry exists but the title is generic and you don't remember the tags.
- You are exploring what's in your library.

When to stay on Keyword
- Normal day-to-day support work — faster and less noisy.
- Your team has consistent tagging — the right entry almost always comes up on tags alone.`,
  },
  {
    id: "keyboard-shortcuts-panel",
    title: "Keyboard shortcuts panel",
    tags: ["keyboard", "shortcuts", "hotkey", "remap", "customize", "K button", "panel"],
    content: `The Keyboard Shortcuts panel is opened with the K button in the main header. It shows every configurable shortcut in one place.

Global summon hotkey
The first section shows the current global hotkey (default: Ctrl+Shift+Space). This is the system-wide shortcut that opens ShortPath from any app.

To change it: click Change, press the new key combination, and it saves automatically. The combination must include at least one modifier key (Ctrl, Alt, or Shift) and a letter, number, or function key. If the combination is already registered by another app, an error appears — try a different one.

In-app shortcuts
The second section lists actions that work while ShortPath is focused. Each row shows the action name, the current shortcut, and Change and Off buttons.

- Change: click it, press the new key combination, and it saves.
- Off: removes the shortcut entirely (the action is still available by clicking).

Default in-app shortcuts
- Notes: Alt+N
- Keyboard shortcuts panel: Alt+K
- Help: Alt+H
- Settings: Alt+S
- New entry: Ctrl+N
- Cycle vertical tab: Tab

Fixed shortcuts
The third section lists shortcuts that cannot be remapped. These are built into the app's navigation model:
- Arrow Up / Down: move between results
- Enter: open focused entry
- Esc: close detail / clear search / hide window
- Shift+Tab: cycle vertical tab backwards
- Up arrow in empty search: cycle recent search queries`,
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    tags: ["troubleshooting", "hotkey conflict", "not opening", "missing entries", "sync", "problem"],
    content: `Hotkey not working
The global hotkey may be blocked if another app registered the same combination. Open Settings > Behavior > Change hotkey and try a different one, such as Ctrl+Shift+1 or Ctrl+Alt+Space.

Window not appearing
If the window does not show when you press the hotkey, click the ShortPath icon in the system tray. If the icon is missing, the app may have stopped running — relaunch it from your Applications folder or Start menu.

Entries missing after import
Check the import result for skipped-row errors. Common causes: missing required columns (title, vertical, type), an invalid type value, or column names that do not match. Use the column mapping screen to reassign columns, or download the template to see the exact format.

Sync not updating
If the sync file is on a network drive or cloud folder, the file watcher may be delayed or unreliable. Use the Refresh button on the source card in Settings > Sync to reload manually.

App data location
Windows: %APPDATA%\\ShortPath (store.json and settings.json)
Mac: ~/Library/Application Support/ShortPath`,
  },
];
