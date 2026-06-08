import type { Entry, Vertical } from "@shared/types";

interface LoadEntriesResult {
  entries: Entry[];
  verticals: Vertical[];
}

interface ImportCsvResult {
  success: boolean;
  entries?: Entry[];
  verticals?: Vertical[];
  imported?: number;
  updated?: number;
  skipped?: number;
  errors?: string[];
}

declare global {
  interface Window {
    shortpath: {
      loadEntries: () => Promise<LoadEntriesResult>;
      createEntry: (fields: Omit<Entry, "id" | "createdAt" | "updatedAt">) => Promise<Entry>;
      updateEntry: (id: string, updates: Partial<Entry>) => Promise<Entry>;
      deleteEntry: (id: string) => Promise<void>;
      importCsv: () => Promise<ImportCsvResult>;
      exportCsv: () => Promise<{ success: boolean }>;
      onStoreUpdated: (
        callback: (data: { entries: Entry[]; verticals: Vertical[] }) => void
      ) => () => void;
    };
  }
}

export {};
