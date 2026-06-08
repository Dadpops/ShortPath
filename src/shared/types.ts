// Types shared between the main process, preload, and renderer.

export type VerticalId =
  | "saved-replies"
  | "documentation"
  | "sops"
  | "support-tools"
  | string; // user-defined verticals

export interface Vertical {
  id: VerticalId;
  label: string;
  builtIn: boolean;
}

export interface Entry {
  id: string;             // UUID, generated on create
  vertical: VerticalId;
  title: string;
  body: string | null;   // full text for saved replies / docs; null for link-only
  link: string | null;   // URL for link-type entries; null for text-only
  tags: string;          // pipe-separated: "billing|refund|payment"
  type: "reply" | "doc" | "link" | "sop" | "tool";
  source: "local" | "synced"; // "local" = user-created; "synced" = from shared team file
  createdAt: string;     // ISO 8601
  updatedAt: string;
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
} as const;
