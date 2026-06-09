// Types shared between the main process, preload, and renderer.

export type VerticalId =
  | "saved-replies"
  | "documentation"
  | "sops"
  | "support-tools"
  | string; // user-defined verticals

export interface SubFolder {
  id: string;
  label: string;
  subFolders?: SubFolder[];
}

export interface Vertical {
  id: VerticalId;
  label: string;
  builtIn: boolean;
  subFolders?: SubFolder[];
}

export interface Entry {
  id: string;             // UUID, generated on create
  vertical: VerticalId;
  title: string;
  body: string | null;   // full text for saved replies / docs; null for link-only
  link: string | null;   // URL for link-type entries; null for text-only
  tags: string;          // pipe-separated: "billing|refund|payment"
  type: "reply" | "doc" | "link" | "sop" | "tool";
  source: "local" | "synced" | "sample"; // "local" = user-created; "synced" = from shared team file; "sample" = bundled demo data
  syncSource?: string;         // ID of the sync source this entry came from (multi-sync)
  subFolderId?: string;  // optional reference to a SubFolder.id within the entry's vertical
  createdAt: string;     // ISO 8601
  updatedAt: string;
  copyCount?: number;    // Phase 10: copies made this entry; only tracked for source === "local"
  copyMode?: "plain" | "html"; // Phase 13: how to write to clipboard; default "plain"
  sourceUrl?: string;    // Phase 14: original URL when captured from browser extension
  lastCopiedAt?: string; // ISO 8601 timestamp of the most recent copy — used for "Recently Used" sort
}

// Payload sent by the browser extension to the capture server.
export interface CapturePayload {
  title: string;
  body: string;
  url: string;
  source: "browser-extension";
}

export interface SearchResult {
  entry: Entry;
  matches: FuseMatch[]; // match ranges for highlight rendering
}

export interface FuseMatch {
  key: string;
  indices: [number, number][];
}

export interface VerticalGroup {
  verticalId: VerticalId;
  label: string;
  hitCount: number;
  results: SearchResult[];
  expanded: boolean;
}

export interface Note {
  id: string;
  title?: string;
  body: string;
  entryId?: string;
  entryTitle?: string;
  createdAt: string;
  updatedAt: string;
}

// Maps ShortPath field names to the user's CSV column names for non-standard imports.
// A null value means the field is absent in the CSV; type defaults to "reply" when null.
export interface ColumnMapping {
  title: string | null;
  vertical: string | null;
  type: string | null;
  body: string | null;
  url: string | null;
  tags: string | null;
  subfolder: string | null;
}

// IPC channel names
export const IPC = {
  PING: "ping",
  LOAD_ENTRIES: "load-entries",
  CREATE_ENTRY: "create-entry",
  UPDATE_ENTRY: "update-entry",
  DELETE_ENTRY: "delete-entry",
  RECORD_ACCESS: "record-access",
  IMPORT_CSV: "import-csv",
  EXPORT_CSV: "export-csv",
  EXPORT_MINE: "export-mine",
  PREVIEW_CSV_IMPORT: "preview-csv-import",
  COMMIT_CSV_IMPORT: "commit-csv-import",
  DOWNLOAD_TEMPLATE_CSV: "download-template-csv",
  STORE_UPDATED: "store-updated",
  READ_CLIPBOARD: "read-clipboard",
  OPEN_EXTERNAL: "open-external",
  HIDE_WINDOW: "hide-window",
  FOCUS_SEARCH: "focus-search",
  HOTKEY_FAILED: "hotkey-failed",
  CHANGE_HOTKEY: "change-hotkey",
  RESET_WINDOW_POSITION: "reset-window-position",
  GET_SETTINGS: "get-settings",
  OPEN_SETTINGS: "open-settings",
  REORDER_ENTRY: "reorder-entry",
  CONFIGURE_SYNC: "configure-sync",
  REFRESH_SYNCED: "refresh-synced",
  CLEAR_SYNCED: "clear-synced",
  GET_SYNC_STATUS: "get-sync-status",
  SYNC_REFRESHED: "sync-refreshed",
  TOGGLE_FAVORITE: "toggle-favorite",
  SAVE_SOURCE_MODE: "save-source-mode",
  SET_FONT_SIZE: "set-font-size",
  DISCONNECT_SYNC: "disconnect-sync",
  TOGGLE_PIN: "toggle-pin",
  INCREMENT_COPY_COUNT: "increment-copy-count",
  SET_ACCENT: "set-accent",
  SET_OPACITY: "set-opacity",
  SET_WINDOW_SIZE: "set-window-size",
  SET_DENSITY: "set-density",
  SET_VERTICAL_ORDER: "set-vertical-order",
  SET_AUTO_HIDE_ON_COPY: "set-auto-hide-on-copy",
  CHECK_FOR_UPDATES: "check-for-updates",
  UPDATE_AVAILABLE: "update-available",
  DELETE_VERTICAL: "delete-vertical",
  STAGE_CSV_FILE: "stage-csv-file",
  PREVIEW_CSV_WITH_MAPPING: "preview-csv-with-mapping",
} as const;
