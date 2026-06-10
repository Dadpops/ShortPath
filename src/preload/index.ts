import { contextBridge, ipcRenderer } from "electron";
import type { Entry, ColumnMapping, CapturePayload } from "../shared/types";

contextBridge.exposeInMainWorld("shortpath", {
  platform: process.platform,

  loadEntries: () => ipcRenderer.invoke("load-entries"),

  createEntry: (
    fields: Omit<Entry, "id" | "createdAt" | "updatedAt" | "source">,
    verticalLabel?: string
  ) => ipcRenderer.invoke("create-entry", fields, verticalLabel),

  updateEntry: (
    id: string,
    updates: Partial<Omit<Entry, "id" | "createdAt" | "source">>
  ) => ipcRenderer.invoke("update-entry", id, updates),

  deleteEntry: (id: string) => ipcRenderer.invoke("delete-entry", id),

  recordAccess: (entryId: string) => ipcRenderer.invoke("record-access", entryId),

  reorderEntry: (entryId: string, direction: "up" | "down") =>
    ipcRenderer.invoke("reorder-entry", entryId, direction),

  importCsv: () => ipcRenderer.invoke("import-csv"),
  exportCsv: () => ipcRenderer.invoke("export-csv"),
  exportMine: () => ipcRenderer.invoke("export-mine"),
  exportSelected: (ids: string[]) => ipcRenderer.invoke("export-selected", ids),
  exportStreamDeckProfile: (cols?: number, rows?: number) => ipcRenderer.invoke("export-streamdeck-profile", cols, rows),

  previewCsvImport: () => ipcRenderer.invoke("preview-csv-import"),
  commitCsvImport: (resolutions?: Record<number, string>) => ipcRenderer.invoke("commit-csv-import", resolutions ?? {}),
  stageCsvFile: (filePath: string) => ipcRenderer.invoke("stage-csv-file", filePath),
  previewCsvWithMapping: (mapping: ColumnMapping) => ipcRenderer.invoke("preview-csv-with-mapping", mapping),
  downloadTemplateCsv: () => ipcRenderer.invoke("download-template-csv"),

  readClipboard: () => ipcRenderer.invoke("read-clipboard"),

  openExternal: (url: string) => ipcRenderer.invoke("open-external", url),
  hideWindow: () => ipcRenderer.invoke("hide-window"),

  getSettings: () => ipcRenderer.invoke("get-settings"),
  changeHotkey: (accelerator: string) => ipcRenderer.invoke("change-hotkey", accelerator),
  resetWindowPosition: () => ipcRenderer.invoke("reset-window-position"),

  toggleFavorite: (entryId: string) => ipcRenderer.invoke("toggle-favorite", entryId),
  setFontSize: (size: number) => ipcRenderer.invoke("set-font-size", size),
  setTheme: (theme: "dark" | "light") => ipcRenderer.invoke("set-theme", theme),
  minimizeWindow: () => ipcRenderer.invoke("minimize-window"),
  renameVertical: (id: string, newLabel: string) => ipcRenderer.invoke("rename-vertical", id, newLabel),
  addVertical: (label: string) => ipcRenderer.invoke("add-vertical", label),
  clearLocalEntries: () => ipcRenderer.invoke("clear-local-entries"),
  addSubFolder: (verticalId: string, label: string, parentSubFolderId?: string) => ipcRenderer.invoke("add-subfolder", verticalId, label, parentSubFolderId),
  renameSubFolder: (verticalId: string, subFolderId: string, newLabel: string) => ipcRenderer.invoke("rename-subfolder", verticalId, subFolderId, newLabel),
  removeSubFolder: (verticalId: string, subFolderId: string) => ipcRenderer.invoke("remove-subfolder", verticalId, subFolderId),
  deleteVertical: (verticalId: string) => ipcRenderer.invoke("delete-vertical", verticalId),
  saveSourceMode: (mode: "local" | "sync", name?: string) => ipcRenderer.invoke("save-source-mode", mode, name),
  disconnectSync: (sourceId: string) => ipcRenderer.invoke("disconnect-sync", sourceId),
  renameSyncSource: (sourceId: string, newLabel: string) => ipcRenderer.invoke("rename-sync-source", sourceId, newLabel),

  setAccent: (color: string) => ipcRenderer.invoke("set-accent", color),
  setOpacity: (value: number) => ipcRenderer.invoke("set-opacity", value),
  setWindowSize: (size: "small" | "medium" | "large") => ipcRenderer.invoke("set-window-size", size),
  setDensity: (density: "compact" | "comfortable") => ipcRenderer.invoke("set-density", density),
  setVerticalOrder: (order: string[]) => ipcRenderer.invoke("set-vertical-order", order),
  setAutoHideOnCopy: (value: boolean) => ipcRenderer.invoke("set-auto-hide-on-copy", value),
  setAlwaysOnTop: (value: boolean) => ipcRenderer.invoke("set-always-on-top", value),
  clearSampleData: () => ipcRenderer.invoke("clear-sample-data"),
  setPinCap: (cap: number) => ipcRenderer.invoke("set-pin-cap", cap),
  togglePin: (entryId: string) => ipcRenderer.invoke("toggle-pin", entryId),
  incrementCopyCount: (entryId: string) => ipcRenderer.invoke("increment-copy-count", entryId),

  onFocusSearch: (callback: () => void) => {
    ipcRenderer.on("focus-search", callback);
    return () => ipcRenderer.removeListener("focus-search", callback);
  },

  onHotkeyFailed: (callback: (accelerator: string) => void) => {
    ipcRenderer.on("hotkey-failed", (_event, accelerator) => callback(accelerator));
    return () => ipcRenderer.removeAllListeners("hotkey-failed");
  },

  onOpenSettings: (callback: () => void) => {
    ipcRenderer.on("open-settings", callback);
    return () => ipcRenderer.removeListener("open-settings", callback);
  },

  onStoreUpdated: (
    callback: (data: {
      entries: Entry[];
      verticals: { id: string; label: string; builtIn: boolean }[];
      recents: string[];
      favorites: string[];
      pinned: string[];
    }) => void
  ) => {
    ipcRenderer.on("store-updated", (_event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners("store-updated");
  },

  configureSync: () => ipcRenderer.invoke("configure-sync"),
  refreshSynced: (sourceId?: string) => ipcRenderer.invoke("refresh-synced", sourceId),
  clearSynced: () => ipcRenderer.invoke("clear-synced"),
  getSyncStatus: () => ipcRenderer.invoke("get-sync-status"),

  onSyncRefreshed: (callback: () => void) => {
    ipcRenderer.on("sync-refreshed", callback);
    return () => ipcRenderer.removeListener("sync-refreshed", callback);
  },

  checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
  downloadUpdate: () => ipcRenderer.invoke("download-update"),
  installUpdate: () => ipcRenderer.invoke("install-update"),

  onUpdateAvailable: (callback: (update: { version: string; url: string }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, update: { version: string; url: string }) => callback(update);
    ipcRenderer.on("update-available", handler);
    return () => ipcRenderer.removeListener("update-available", handler);
  },

  onUpdateDownloaded: (callback: () => void) => {
    ipcRenderer.on("update-downloaded", callback);
    return () => ipcRenderer.removeListener("update-downloaded", callback);
  },

  loadNotes: () => ipcRenderer.invoke("notes:load"),
  createNote: (fields: { title?: string; body: string; entryId?: string; entryTitle?: string }) => ipcRenderer.invoke("notes:create", fields),
  updateNote: (id: string, updates: { title?: string; body: string }) => ipcRenderer.invoke("notes:update", id, updates),
  deleteNote: (id: string) => ipcRenderer.invoke("notes:delete", id),

  fetchUrlContent: (url: string) =>
    ipcRenderer.invoke("fetch-url-content", url),

  previewMdImport: (filePath: string) =>
    ipcRenderer.invoke("preview-md-import", filePath),
  commitMdImport: (entries: Array<Omit<Entry, "id" | "createdAt" | "updatedAt" | "source">>) =>
    ipcRenderer.invoke("commit-md-import", entries),

  previewPdfImport: (filePath: string) =>
    ipcRenderer.invoke("preview-pdf-import", filePath),
  commitPdfImport: (entries: Array<Omit<Entry, "id" | "createdAt" | "updatedAt" | "source">>) =>
    ipcRenderer.invoke("commit-pdf-import", entries),

  onCaptureEntry: (callback: (payload: CapturePayload) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: CapturePayload) => callback(payload);
    ipcRenderer.on("capture-entry", handler);
    return () => ipcRenderer.removeListener("capture-entry", handler);
  },

  setFontFamily: (f: string) => ipcRenderer.invoke("set-font-family", f),
  setCustomShortcuts: (s: Record<string, string | null>) => ipcRenderer.invoke("set-custom-shortcuts", s),
  openHelpWindow: () => ipcRenderer.invoke("open-help-window"),
  setOnboarded: () => ipcRenderer.invoke("set-onboarded"),
  installSampleData: () => ipcRenderer.invoke("install-sample-data"),
  setLinkOpenMode: (mode: "browser" | "window") => ipcRenderer.invoke("set-link-open-mode", mode),
  setCompactMode: (compact: boolean) => ipcRenderer.invoke("set-compact-mode", compact),
  setAutoRestoreOnCompactAction: (value: boolean) => ipcRenderer.invoke("set-auto-restore-on-compact-action", value),
  compactDragStart: () => ipcRenderer.invoke("compact-drag-start"),
  compactDragMove: (x: number, y: number) => ipcRenderer.invoke("compact-drag-move", x, y),
});
