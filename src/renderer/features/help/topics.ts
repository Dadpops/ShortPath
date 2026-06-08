// Help topic content is authored here as each feature ships (see CLAUDE.md standing rule).
// Phase 6 builds the HelpPanel UI that renders these topics.

export interface HelpTopic {
  id: string;
  title: string;
  tags: string[];
  content: string; // plain text or light markdown; rendered in HelpPanel
}

export const HELP_TOPICS: HelpTopic[] = [
  {
    id: "getting-started",
    title: "Getting started",
    tags: ["intro", "overview", "install", "launch"],
    content: "", // TODO: Phase 6
  },
  {
    id: "opening-closing",
    title: "Opening and closing the window",
    tags: ["hotkey", "tray", "esc", "dismiss", "shortcut"],
    content: "", // TODO: Phase 4 (hotkey) + Phase 6
  },
  {
    id: "searching",
    title: "Searching",
    tags: ["search", "query", "fuzzy", "keywords", "tips"],
    content: "", // TODO: Phase 2 done -> Phase 6
  },
  {
    id: "understanding-results",
    title: "Understanding results",
    tags: ["results", "verticals", "groups", "hit count", "expand", "collapse"],
    content: "", // TODO: Phase 2 done -> Phase 6
  },
  {
    id: "copying",
    title: "Copying an entry",
    tags: ["copy", "clipboard", "copy button"],
    content: "", // TODO: Phase 3 done -> Phase 6
  },
  {
    id: "keyboard-navigation",
    title: "Keyboard navigation",
    tags: ["keyboard", "arrows", "enter", "esc", "navigation"],
    content: "", // TODO: Phase 4
  },
  {
    id: "filtering-by-vertical",
    title: "Filtering by vertical",
    tags: ["filter", "vertical", "scope", "category"],
    content: "", // TODO: Phase 2 done -> Phase 6
  },
  {
    id: "recents",
    title: "Recents",
    tags: ["recents", "recently used", "history"],
    content: "", // TODO: Phase 3 done -> Phase 6
  },
  {
    id: "adding-entries",
    title: "Adding an entry",
    tags: ["add", "create", "new entry", "form", "vertical"],
    content: "", // TODO: Phase 3 done -> Phase 6
  },
  {
    id: "editing-deleting",
    title: "Editing and deleting",
    tags: ["edit", "delete", "update", "remove"],
    content: "", // TODO: Phase 3 done -> Phase 6
  },
  {
    id: "managing-verticals",
    title: "Managing verticals",
    tags: ["verticals", "categories", "create vertical", "custom"],
    content: "", // TODO: Phase 3 done -> Phase 6
  },
  {
    id: "importing-csv",
    title: "Importing a CSV",
    tags: ["import", "csv", "template", "upload", "bulk"],
    content: "", // TODO: Phase 1 additions -> Phase 6
  },
  {
    id: "exporting-csv",
    title: "Exporting a CSV",
    tags: ["export", "csv", "backup", "download", "export mine"],
    content: `Use the tray menu or the export option in the app to save your entries as a CSV file.

Export all: writes every entry — both your own and any synced team entries — to a single file.

Export mine: writes only your personal entries (source: local). Use this to share your library with a team admin who can fold it into the shared master file. It is the bottom-up path for building a shared team resource from individual collections.

The exported file uses the same column format as the import template, so it can be re-imported into any ShortPath instance.`,
  },
  {
    id: "shared-file-sync",
    title: "Shared file sync",
    tags: ["sync", "shared file", "team", "dropbox", "drive", "onedrive", "refresh"],
    content: `Shared file sync lets a team share a master CSV file via Dropbox, Google Drive, OneDrive, or any folder that syncs to a local path. Each team member points ShortPath at the same file and gets updates automatically.

Setup
1. Open Settings (⚙ in the header or tray menu > Settings).
2. In the "Shared file sync" section, click "Configure sync file".
3. Select the CSV file from your synced folder (e.g. ~/Dropbox/Team/shortpath-team.csv).
4. ShortPath loads the file immediately and starts watching it for changes.

How it works
ShortPath watches the file for changes. When the file is updated (for example, the team admin edits and saves it), ShortPath reloads it within a second and updates your results. No restart needed.

If the watcher misses an update, use "Refresh now" in Settings to reload manually.

Your entries are safe
Sync only ever adds, updates, or removes entries marked as "synced". Your own entries are never modified by sync, even if you clear synced entries or switch to a different file.

Synced entries appear with a small "synced" label in the results list so you can tell them apart from your own.

Switching or disconnecting
To use a different file, click "Change file" in Settings and select the new one.
To disconnect entirely, click "Clear synced" — this removes all synced entries but leaves your own entries untouched.`,
  },
  {
    id: "support-tools",
    title: "Support Tools",
    tags: ["support tools", "links", "quick launch", "utilities"],
    content: "", // TODO: Phase 6
  },
  {
    id: "settings",
    title: "Settings",
    tags: ["settings", "hotkey", "config", "window", "position", "sync"],
    content: `Open Settings from the ⚙ button in the header or from the tray menu.

Global hotkey
The default shortcut is Ctrl+Shift+Space (Cmd+Shift+Space on Mac). To change it, click "Change hotkey", hold your new combination, then release. Press Esc to cancel without saving. If the combination is already in use by another app, you will see an error — try a different combination.

Window position
The window remembers its position and size between launches. Use "Reset to default position" to snap it back to the bottom-left corner at the default size.

Shared file sync
See the "Shared file sync" help topic for full setup instructions.`,
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    tags: ["troubleshooting", "hotkey conflict", "not opening", "missing entries"],
    content: "", // TODO: Phase 6
  },
];
