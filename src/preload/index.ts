import { contextBridge, ipcRenderer } from "electron";

// IPC channels exposed to the renderer process.
// Extend this as new main-process capabilities are needed.
contextBridge.exposeInMainWorld("shortpath", {
  // Placeholder — Phase 1 will add search, entry CRUD, CSV import
  ping: () => ipcRenderer.invoke("ping"),
});
