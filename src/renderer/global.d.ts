import type { Entry, Vertical } from "@shared/types";

interface LoadEntriesResult {
  entries: Entry[];
  verticals: Vertical[];
  recents: string[];
}

interface CreateEntryResult {
  entry: Entry;
  verticals: Vertical[];
}

interface ImportCsvResult {
  success: boolean;
  entries?: Entry[];
  verticals?: Vertical[];
  recents?: string[];
  imported?: number;
  updated?: number;
  skipped?: number;
  errors?: string[];
}

declare global {
  interface Window {
    shortpath: {
      loadEntries: () => Promise<LoadEntriesResult>;
      createEntry: (
        fields: Omit<Entry, "id" | "createdAt" | "updatedAt">,
        verticalLabel?: string
      ) => Promise<CreateEntryResult>;
      updateEntry: (id: string, updates: Partial<Entry>) => Promise<Entry>;
      deleteEntry: (id: string) => Promise<void>;
      recordAccess: (entryId: string) => Promise<void>;
      importCsv: () => Promise<ImportCsvResult>;
      exportCsv: () => Promise<{ success: boolean }>;
      onStoreUpdated: (
        callback: (data: { entries: Entry[]; verticals: Vertical[]; recents: string[] }) => void
      ) => () => void;
    };
  }
}

export {};
