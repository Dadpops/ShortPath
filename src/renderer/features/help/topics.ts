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
    tags: ["export", "csv", "backup", "download"],
    content: "", // TODO: Phase 1 done -> Phase 6
  },
  {
    id: "support-tools",
    title: "Support Tools",
    tags: ["support tools", "links", "quick launch", "utilities"],
    content: "", // TODO: Phase 5
  },
  {
    id: "settings",
    title: "Settings",
    tags: ["settings", "hotkey", "config", "window", "position"],
    content: "", // TODO: Phase 4
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    tags: ["troubleshooting", "hotkey conflict", "not opening", "missing entries"],
    content: "", // TODO: Phase 6
  },
];
