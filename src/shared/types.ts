// Types shared between the main process, preload, and renderer.
// Phase 1 will expand this with full entry and search types.

export type VerticalId =
  | "saved-replies"
  | "documentation"
  | "sops"
  | "support-tools"
  | string; // user-defined verticals

export interface Entry {
  id: number;
  vertical: VerticalId;
  title: string;
  body: string | null;   // full text for saved replies / docs
  link: string | null;   // URL for link-type entries
  tags: string;          // comma-separated
  type: "reply" | "doc" | "link" | "sop";
  createdAt: string;     // ISO 8601
  updatedAt: string;
}

export interface SearchResult {
  entry: Entry;
  snippet: string;       // FTS5 highlight snippet
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
  SEARCH: "search",
  GET_ENTRY: "get-entry",
  CREATE_ENTRY: "create-entry",
  UPDATE_ENTRY: "update-entry",
  DELETE_ENTRY: "delete-entry",
  IMPORT_CSV: "import-csv",
  EXPORT_CSV: "export-csv",
} as const;
