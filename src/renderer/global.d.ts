import type { Entry, Vertical, SubFolder, Note } from "@shared/types";

interface LoadEntriesResult {
  entries: Entry[];
  verticals: Vertical[];
  recents: string[];
  favorites: string[];
  fontSize: number;
  sourceMode: "local" | "sync" | null;
  sourceName: string | null;
  theme: "dark" | "light";
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
      reorderEntry: (entryId: string, direction: "up" | "down") => Promise<void>;
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
      minimizeWindow: () => Promise<void>;

      getSettings: () => Promise<{ hotkey: string; fontSize: number; theme: "dark" | "light" }>;
      changeHotkey: (accelerator: string) => Promise<{ ok: boolean }>;
      resetWindowPosition: () => Promise<void>;

      toggleFavorite: (entryId: string) => Promise<void>;
      setFontSize: (size: number) => Promise<void>;
      setTheme: (theme: "dark" | "light") => Promise<void>;
      saveSourceMode: (mode: "local" | "sync", name?: string) => Promise<void>;
      disconnectSync: () => Promise<void>;
      renameVertical: (id: string, newLabel: string) => Promise<void>;
      addVertical: (label: string) => Promise<Vertical>;
      clearLocalEntries: () => Promise<void>;
      addSubFolder: (verticalId: string, label: string) => Promise<SubFolder>;
      renameSubFolder: (verticalId: string, subFolderId: string, newLabel: string) => Promise<void>;
      removeSubFolder: (verticalId: string, subFolderId: string) => Promise<void>;

      configureSync: () => Promise<{ success: boolean; syncPath?: string; errors?: string[] }>;
      refreshSynced: () => Promise<{ success: boolean; errors?: string[] }>;
      clearSynced: () => Promise<void>;
      getSyncStatus: () => Promise<{ syncPath: string | null; syncedCount: number; lastRefreshed: string | null }>;

      onFocusSearch: (callback: () => void) => () => void;
      onHotkeyFailed: (callback: (accelerator: string) => void) => () => void;
      onOpenSettings: (callback: () => void) => () => void;
      onSyncRefreshed: (callback: () => void) => () => void;

      onStoreUpdated: (
        callback: (data: { entries: Entry[]; verticals: Vertical[]; recents: string[]; favorites: string[] }) => void
      ) => () => void;

      loadNotes: () => Promise<Note[]>;
      createNote: (fields: { title?: string; body: string; entryId?: string; entryTitle?: string }) => Promise<Note>;
      updateNote: (id: string, updates: { title?: string; body: string }) => Promise<Note>;
      deleteNote: (id: string) => Promise<void>;
    };
  }
}

export {};
