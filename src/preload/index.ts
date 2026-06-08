import { contextBridge, ipcRenderer } from "electron";
import type { Entry } from "../shared/types";

contextBridge.exposeInMainWorld("shortpath", {
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

  importCsv: () => ipcRenderer.invoke("import-csv"),
  exportCsv: () => ipcRenderer.invoke("export-csv"),
  exportMine: () => ipcRenderer.invoke("export-mine"),

  previewCsvImport: () => ipcRenderer.invoke("preview-csv-import"),
  commitCsvImport: () => ipcRenderer.invoke("commit-csv-import"),
  downloadTemplateCsv: () => ipcRenderer.invoke("download-template-csv"),

  readClipboard: () => ipcRenderer.invoke("read-clipboard"),

  openExternal: (url: string) => ipcRenderer.invoke("open-external", url),
  hideWindow: () => ipcRenderer.invoke("hide-window"),

  getSettings: () => ipcRenderer.invoke("get-settings"),
  changeHotkey: (accelerator: string) => ipcRenderer.invoke("change-hotkey", accelerator),
  resetWindowPosition: () => ipcRenderer.invoke("reset-window-position"),

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
});
