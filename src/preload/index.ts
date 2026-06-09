import { contextBridge, ipcRenderer } from "electron";
import type { Entry, ColumnMapping } from "../shared/types";

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
  exportStreamDeckProfile: () => ipcRenderer.invoke("export-streamdeck-profile"),

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
  disconnectSync: () => ipcRenderer.invoke("disconnect-sync"),

  setAccent: (color: string) => ipcRenderer.invoke("set-accent", color),
  setOpacity: (value: number) => ipcRenderer.invoke("set-opacity", value),
  setWindowSize: (size: "small" | "medium" | "large") => ipcRenderer.invoke("set-window-size", size),
  setDensity: (density: "compact" | "comfortable") => ipcRenderer.invoke("set-density", density),
  setVerticalOrder: (order: string[]) => ipcRenderer.invoke("set-vertical-order", order),
  setAutoHideOnCopy: (value: boolean) => ipcRenderer.invoke("set-auto-hide-on-copy", value),
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
  refreshSynced: () => ipcRenderer.invoke("refresh-synced"),
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
});
