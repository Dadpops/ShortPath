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

interface CsvPreviewRow {
  title: string;
  vertical: string;
  type: string;
  hasBody: boolean;
  hasUrl: boolean;
  tags: string;
}

interface CsvPreviewResult {
  success: boolean;
  totalRows?: number;
  previewRows?: CsvPreviewRow[];
  skippedCount?: number;
  errors?: string[];
}

interface CsvCommitResult {
  success: boolean;
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
        fields: Omit<Entry, "id" | "createdAt" | "updatedAt" | "source">,
        verticalLabel?: string
      ) => Promise<CreateEntryResult>;

      updateEntry: (
        id: string,
        updates: Partial<Omit<Entry, "id" | "createdAt" | "source">>
      ) => Promise<Entry>;

      deleteEntry: (id: string) => Promise<void>;
      recordAccess: (entryId: string) => Promise<void>;

      importCsv: () => Promise<ImportCsvResult>;
      exportCsv: () => Promise<{ success: boolean }>;
      exportMine: () => Promise<{ success: boolean }>;

      previewCsvImport: () => Promise<CsvPreviewResult>;
      commitCsvImport: () => Promise<CsvCommitResult>;
      downloadTemplateCsv: () => Promise<{ success: boolean }>;

      readClipboard: () => Promise<string>;

      openExternal: (url: string) => Promise<void>;
      hideWindow: () => Promise<void>;

      getSettings: () => Promise<{ hotkey: string }>;
      changeHotkey: (accelerator: string) => Promise<{ ok: boolean }>;
      resetWindowPosition: () => Promise<void>;

      onFocusSearch: (callback: () => void) => () => void;
      onHotkeyFailed: (callback: (accelerator: string) => void) => () => void;
      onOpenSettings: (callback: () => void) => () => void;

      onStoreUpdated: (
        callback: (data: { entries: Entry[]; verticals: Vertical[]; recents: string[] }) => void
      ) => () => void;
    };
  }
}

export {};
