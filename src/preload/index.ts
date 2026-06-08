import { contextBridge, ipcRenderer } from "electron";
import type { Entry } from "../shared/types";

contextBridge.exposeInMainWorld("shortpath", {
  loadEntries: () => ipcRenderer.invoke("load-entries"),
  createEntry: (fields: Omit<Entry, "id" | "createdAt" | "updatedAt">) =>
    ipcRenderer.invoke("create-entry", fields),
  updateEntry: (id: string, updates: Partial<Entry>) =>
    ipcRenderer.invoke("update-entry", id, updates),
  deleteEntry: (id: string) => ipcRenderer.invoke("delete-entry", id),
  importCsv: () => ipcRenderer.invoke("import-csv"),
  exportCsv: () => ipcRenderer.invoke("export-csv"),

  // Listen for store updates pushed from main (e.g. after tray menu import)
  onStoreUpdated: (
    callback: (data: { entries: Entry[]; verticals: { id: string; label: string; builtIn: boolean }[] }) => void
  ) => {
    ipcRenderer.on("store-updated", (_event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners("store-updated");
  },
});
