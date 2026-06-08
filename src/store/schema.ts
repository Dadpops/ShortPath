import type { Entry, Vertical } from "../shared/types";

export const STORE_VERSION = 1;

export interface StoreData {
  version: number;
  entries: Entry[];
  verticals: Vertical[];
  recents: string[]; // entry IDs, most recent first, max 10
}

export const DEFAULT_VERTICALS: Vertical[] = [
  { id: "saved-replies", label: "Saved Replies", builtIn: true },
  { id: "documentation", label: "Documentation", builtIn: true },
  { id: "sops", label: "Internal SOPs", builtIn: true },
  { id: "support-tools", label: "Support Tools", builtIn: true },
];

export function defaultStore(): StoreData {
  return {
    version: STORE_VERSION,
    entries: [],
    verticals: [...DEFAULT_VERTICALS],
    recents: [],
  };
}
