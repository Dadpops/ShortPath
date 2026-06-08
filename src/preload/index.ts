import { contextBridge, ipcRenderer } from "electron";
import type { Entry } from "../shared/types";

contextBridge.exposeInMainWorld("shortpath", {
  loadEntries: () => ipcRenderer.invoke("load-entries"),

  createEntry: (fields: Omit<Entry, "id" | "createdAt" | "updatedAt">, verticalLabel?: string) =>
    ipcRenderer.invoke("create-entry", fields, verticalLabel),

  updateEntry: (id: string, updates: Partial<Entry>) =>
    ipcRenderer.invoke("update-entry", id, updates),

  deleteEntry: (id: string) => ipcRenderer.invoke("delete-entry", id),

  recordAccess: (entryId: string) => ipcRenderer.invoke("record-access", entryId),

  importCsv: () => ipcRenderer.invoke("import-csv"),
  exportCsv: () => ipcRenderer.invoke("export-csv"),

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
});
