import type { Entry, Vertical, SubFolder, Note, ColumnMapping } from "@shared/types";

interface LoadEntriesResult {
  entries: Entry[];
  verticals: Vertical[];
  recents: string[];
  favorites: string[];
  pinned: string[];
  fontSize: number;
  sourceMode: "local" | "sync" | null;
  sourceName: string | null;
  theme: "dark" | "light";
  accentColor: string | null;
  opacity: number;
  windowSize: "small" | "medium" | "large" | null;
  density: "compact" | "comfortable";
  verticalOrder: string[];
  autoHideOnCopy: boolean;
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
  needsMapping?: boolean;
  availableColumns?: string[];
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
      platform: string;

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
      exportSelected: (ids: string[]) => Promise<{ success: boolean }>;

      previewCsvImport: () => Promise<CsvPreviewResult>;
      commitCsvImport: () => Promise<CsvCommitResult>;
      stageCsvFile: (filePath: string) => Promise<CsvPreviewResult>;
      previewCsvWithMapping: (mapping: ColumnMapping) => Promise<CsvPreviewResult>;
      downloadTemplateCsv: () => Promise<{ success: boolean }>;

      readClipboard: () => Promise<string>;

      openExternal: (url: string) => Promise<void>;
      hideWindow: () => Promise<void>;
      minimizeWindow: () => Promise<void>;

      getSettings: () => Promise<{
        hotkey: string;
        fontSize: number;
        theme: "dark" | "light";
        accentColor: string | null;
        opacity: number;
        windowSize: "small" | "medium" | "large" | null;
        density: "compact" | "comfortable";
        verticalOrder: string[];
        autoHideOnCopy: boolean;
      }>;
      changeHotkey: (accelerator: string) => Promise<{ ok: boolean }>;
      resetWindowPosition: () => Promise<void>;

      toggleFavorite: (entryId: string) => Promise<void>;
      togglePin: (entryId: string) => Promise<{ ok: boolean; limitReached?: boolean; pinned?: boolean }>;
      incrementCopyCount: (entryId: string) => Promise<void>;
      setAccent: (color: string) => Promise<void>;
      setOpacity: (value: number) => Promise<void>;
      setWindowSize: (size: "small" | "medium" | "large") => Promise<void>;
      setDensity: (density: "compact" | "comfortable") => Promise<void>;
      setVerticalOrder: (order: string[]) => Promise<void>;
      setAutoHideOnCopy: (value: boolean) => Promise<void>;
      setFontSize: (size: number) => Promise<void>;
      setTheme: (theme: "dark" | "light") => Promise<void>;
      saveSourceMode: (mode: "local" | "sync", name?: string) => Promise<void>;
      disconnectSync: () => Promise<void>;
      renameVertical: (id: string, newLabel: string) => Promise<void>;
      addVertical: (label: string) => Promise<Vertical>;
      clearLocalEntries: () => Promise<void>;
      addSubFolder: (verticalId: string, label: string, parentSubFolderId?: string) => Promise<SubFolder>;
      renameSubFolder: (verticalId: string, subFolderId: string, newLabel: string) => Promise<void>;
      removeSubFolder: (verticalId: string, subFolderId: string) => Promise<void>;
      deleteVertical: (verticalId: string) => Promise<void>;

      configureSync: () => Promise<{ success: boolean; syncPath?: string; errors?: string[] }>;
      refreshSynced: () => Promise<{ success: boolean; errors?: string[] }>;
      clearSynced: () => Promise<void>;
      getSyncStatus: () => Promise<{ syncPath: string | null; syncedCount: number; lastRefreshed: string | null }>;

      onFocusSearch: (callback: () => void) => () => void;
      onHotkeyFailed: (callback: (accelerator: string) => void) => () => void;
      onOpenSettings: (callback: () => void) => () => void;
      onSyncRefreshed: (callback: () => void) => () => void;

      onStoreUpdated: (
        callback: (data: { entries: Entry[]; verticals: Vertical[]; recents: string[]; favorites: string[]; pinned: string[] }) => void
      ) => () => void;

      checkForUpdates: () => Promise<{ version: string; url: string } | null>;
      downloadUpdate: () => Promise<void>;
      installUpdate: () => Promise<void>;
      onUpdateAvailable: (callback: (update: { version: string; url: string }) => void) => () => void;
      onUpdateDownloaded: (callback: () => void) => () => void;

      loadNotes: () => Promise<Note[]>;
      createNote: (fields: { title?: string; body: string; entryId?: string; entryTitle?: string }) => Promise<Note>;
      updateNote: (id: string, updates: { title?: string; body: string }) => Promise<Note>;
      deleteNote: (id: string) => Promise<void>;
    };
  }
}

export {};
