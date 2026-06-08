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
  tags: string;          // comma-separated
  type: "reply" | "doc" | "link" | "sop";
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
  IMPORT_CSV: "import-csv",
  EXPORT_CSV: "export-csv",
} as const;
