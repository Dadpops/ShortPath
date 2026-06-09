import {
  app,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
  screen,
  globalShortcut,
  ipcMain,
  dialog,
  clipboard,
  shell,
} from "electron";
import path from "path";
import fs from "fs";
import chokidar from "chokidar";
import { autoUpdater } from "electron-updater";
import { openStore, saveStore, addEntry, updateEntry, deleteEntry, recordAccess, reorderEntry, replaceSyncedEntries, toggleFavorite, togglePin, incrementCopyCount, renameVertical, addVertical, clearLocalEntries, addSubFolder, renameSubFolder, removeSubFolder, deleteVertical } from "../store/index";
import { openNotes, saveNotes, createNote as storeCreateNote, updateNote as storeUpdateNote, deleteNote as storeDeleteNote } from "../store/notes";
import { applySeed } from "../store/seed";
import { importCsv, exportCsv, parseCsvPreview, parseCsvPreviewWithMapping, importCsvWithMapping, parseSyncedCsv, CSV_TEMPLATE_CONTENT } from "../store/csv";
import { loadSettings, saveSettings, type AppSettings } from "./settings";
import type { StoreData } from "../store/schema";
import type { Entry, Note, ColumnMapping } from "../shared/types";

const WINDOW_WIDTH = 480;
const WINDOW_HEIGHT = 640;
const MARGIN = 12;

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.on("update-available", (info) => {
  if (win && !win.isDestroyed()) {
    const url = `https://github.com/Dadpops/ShortPath/releases/tag/v${info.version}`;
    win.webContents.send("update-available", { version: info.version, url });
  }
});
autoUpdater.on("update-downloaded", () => {
  if (win && !win.isDestroyed()) win.webContents.send("update-downloaded");
});
autoUpdater.on("error", (err) => console.error("Updater:", err.message));

const SIZE_PRESETS = {
  small:  { width: 380, height: 520 },
  medium: { width: 480, height: 640 },
  large:  { width: 580, height: 760 },
} as const;

let tray: Tray | null = null;
let trayIconBase: ReturnType<typeof nativeImage.createFromPath> | null = null;
let trayIconActive: ReturnType<typeof nativeImage.createFromPath> | null = null;
let win: BrowserWindow | null = null;
let store: StoreData;
let notesData: { notes: Note[] };
let userDataPath: string;
let settings: AppSettings;

// Holds the last CSV string opened via preview-csv-import, waiting for commit-csv-import.
let pendingCsvImport: string | null = null;
// When the user provides a column mapping, it is stored here and used by commit-csv-import.
let pendingColumnMapping: ColumnMapping | null = null;

// Debounce timer for saving window bounds after move/resize.
let saveBoundsTimer: ReturnType<typeof setTimeout> | null = null;

// Sync state
let syncWatcher: chokidar.FSWatcher | null = null;
let syncDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let lastRefreshed: string | null = null;

function getBottomLeftPosition() {
  const display = screen.getPrimaryDisplay();
  const { x, y, height } = display.workArea;
  return {
    x: x + MARGIN,
    y: y + height - WINDOW_HEIGHT - MARGIN,
  };
}

function createWindow() {
  const saved = settings.windowBounds;
  const pos = saved ?? getBottomLeftPosition();
  const preset = settings.windowSize ? SIZE_PRESETS[settings.windowSize] : null;
  const width = preset ? preset.width : (saved?.width ?? WINDOW_WIDTH);
  const height = preset ? preset.height : (saved?.height ?? WINDOW_HEIGHT);

  win = new BrowserWindow({
    width,
    height,
    x: pos.x,
    y: pos.y,
    opacity: settings.opacity !== undefined ? settings.opacity / 100 : 1,
    resizable: true,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    skipTaskbar: true,
    alwaysOnTop: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.NODE_ENV === "development") {
    win.loadURL("http://localhost:5173");
  } else {
    win.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  win.once("ready-to-show", () => {
    win?.show();
    if (tray && trayIconActive) tray.setImage(trayIconActive);
  });

  win.on("closed", () => {
    win = null;
  });

  win.on("hide", () => {
    if (tray && trayIconBase) tray.setImage(trayIconBase);
  });

  function scheduleSaveBounds() {
    if (saveBoundsTimer) clearTimeout(saveBoundsTimer);
    saveBoundsTimer = setTimeout(() => {
      if (!win) return;
      const [width, height] = win.getSize();
      const [x, y] = win.getPosition();
      settings = { ...settings, windowBounds: { x, y, width, height } };
      saveSettings(userDataPath, settings);
    }, 400);
  }

  win.on("move", scheduleSaveBounds);
  win.on("resize", scheduleSaveBounds);
}

function buildActiveIcon(base: ReturnType<typeof nativeImage.createFromPath>) {
  const { width, height } = base.getSize();
  const bitmap = base.getBitmap();
  for (let i = 0; i < bitmap.length; i += 4) {
    if (bitmap[i + 3] > 0) {
      bitmap[i]     = Math.min(bitmap[i]     + 70, 255);
      bitmap[i + 1] = Math.min(bitmap[i + 1] + 70, 255);
      bitmap[i + 2] = Math.min(bitmap[i + 2] + 70, 255);
    }
  }
  return nativeImage.createFromBitmap(bitmap, { width, height });
}

function createTray() {
  trayIconBase = nativeImage.createFromPath(
    path.join(app.getAppPath(), "icons/png/tray-32.png")
  );
  trayIconActive = buildActiveIcon(trayIconBase);
  tray = new Tray(trayIconBase);

  const contextMenu = Menu.buildFromTemplate([
    { label: "Show ShortPath", click: toggleWindow },
    { type: "separator" },
    { label: "Import CSV", click: handleImportFromTray },
    { label: "Export CSV", click: handleExportFromTray },
    { type: "separator" },
    {
      label: "Settings",
      click: () => {
        if (!win) createWindow();
        else { win.show(); win.focus(); }
        win?.webContents.send("open-settings");
      },
    },
    { type: "separator" },
    { label: "Quit", click: () => app.quit() },
  ]);

  tray.setToolTip("ShortPath");
  tray.setContextMenu(contextMenu);
  tray.on("click", toggleWindow);
}

function toggleWindow() {
  if (!win) {
    createWindow();
    return;
  }
  if (win.isVisible()) {
    win.hide();
    if (tray && trayIconBase) tray.setImage(trayIconBase);
  } else {
    win.show();
    win.focus();
    win.webContents.send("focus-search");
    if (tray && trayIconActive) tray.setImage(trayIconActive);
  }
}

function pushStoreUpdate() {
  win?.webContents.send("store-updated", {
    entries: store.entries,
    verticals: store.verticals,
    recents: store.recents,
    favorites: store.favorites,
    pinned: store.pinned,
  });
}

async function handleImportFromTray() {
  const { filePaths } = await dialog.showOpenDialog({
    filters: [{ name: "CSV", extensions: ["csv"] }],
    properties: ["openFile"],
  });
  if (!filePaths[0]) return;

  try {
    const csvString = fs.readFileSync(filePaths[0], "utf-8");
    const result = importCsv(store, csvString, "local");
    store = result.store;
    saveStore(userDataPath, store);
    pushStoreUpdate();
  } catch (err) {
    console.error("CSV import failed:", err);
  }
}

async function handleExportFromTray() {
  const { filePath } = await dialog.showSaveDialog({
    defaultPath: "shortpath-export.csv",
    filters: [{ name: "CSV", extensions: ["csv"] }],
  });
  if (!filePath) return;

  try {
    fs.writeFileSync(filePath, exportCsv(store.entries, store.verticals), "utf-8");
  } catch (err) {
    console.error("CSV export failed:", err);
  }
}

function loadSyncedFile(filePath: string): { ok: boolean; errors: string[] } {
  try {
    const csvString = fs.readFileSync(filePath, "utf-8");
    const { entries: syncedEntries, errors } = parseSyncedCsv(csvString);
    store = replaceSyncedEntries(store, syncedEntries);
    saveStore(userDataPath, store);
    lastRefreshed = new Date().toISOString();
    pushStoreUpdate();
    win?.webContents.send("sync-refreshed");
    return { ok: true, errors };
  } catch (err) {
    console.error("Sync file load failed:", err);
    return { ok: false, errors: [String(err)] };
  }
}

function startSyncWatcher(filePath: string) {
  stopSyncWatcher();
  syncWatcher = chokidar.watch(filePath, {
    persistent: false,
    awaitWriteFinish: { stabilityThreshold: 300, pollInterval: 100 },
    ignoreInitial: true,
  });
  syncWatcher.on("change", () => {
    if (syncDebounceTimer) clearTimeout(syncDebounceTimer);
    syncDebounceTimer = setTimeout(() => loadSyncedFile(filePath), 200);
  });
  syncWatcher.on("error", (err) => console.error("Sync watcher error:", err));
}

function stopSyncWatcher() {
  if (syncDebounceTimer) { clearTimeout(syncDebounceTimer); syncDebounceTimer = null; }
  if (syncWatcher) { void syncWatcher.close(); syncWatcher = null; }
}

function registerIpcHandlers() {
  ipcMain.handle("load-entries", () => ({
    entries: store.entries,
    verticals: store.verticals,
    recents: store.recents,
    favorites: store.favorites,
    pinned: store.pinned,
    fontSize: settings.fontSize ?? 13,
    sourceMode: settings.sourceMode ?? null,
    sourceName: settings.sourceName ?? null,
    theme: settings.theme ?? "dark",
    accentColor: settings.accentColor ?? null,
    opacity: settings.opacity ?? 100,
    windowSize: settings.windowSize ?? null,
    density: settings.density ?? "comfortable",
    verticalOrder: settings.verticalOrder ?? [],
    autoHideOnCopy: settings.autoHideOnCopy ?? false,
  }));

  ipcMain.handle(
    "create-entry",
    (_e, fields: Omit<Entry, "id" | "createdAt" | "updatedAt" | "source">, verticalLabel?: string) => {
      const result = addEntry(store, fields, verticalLabel);
      store = result.store;
      saveStore(userDataPath, store);
      return { entry: result.entry, verticals: store.verticals };
    }
  );

  ipcMain.handle("reorder-entry", (_e, entryId: string, direction: "up" | "down") => {
    store = reorderEntry(store, entryId, direction);
    saveStore(userDataPath, store);
    pushStoreUpdate();
  });

  ipcMain.handle("record-access", (_e, entryId: string) => {
    store = recordAccess(store, entryId);
    saveStore(userDataPath, store);
  });

  ipcMain.handle(
    "update-entry",
    (_e, id: string, updates: Partial<Omit<Entry, "id" | "createdAt" | "source">>) => {
      const result = updateEntry(store, id, updates);
      store = result.store;
      saveStore(userDataPath, store);
      return result.entry;
    }
  );

  ipcMain.handle("delete-entry", (_e, id: string) => {
    store = deleteEntry(store, id);
    saveStore(userDataPath, store);
  });

  // Two-step import: preview then commit. Used by the in-app import screen.
  ipcMain.handle("preview-csv-import", async () => {
    const { filePaths } = await dialog.showOpenDialog(win!, {
      filters: [{ name: "CSV", extensions: ["csv"] }],
      properties: ["openFile"],
    });
    if (!filePaths[0]) return { success: false };

    try {
      const csvString = fs.readFileSync(filePaths[0], "utf-8");
      pendingCsvImport = csvString;
      pendingColumnMapping = null;
      const preview = parseCsvPreview(csvString);
      return { success: true, ...preview };
    } catch (err) {
      pendingCsvImport = null;
      return { success: false, errors: [String(err)] };
    }
  });

  ipcMain.handle("commit-csv-import", () => {
    if (!pendingCsvImport) return { success: false, errors: ["No pending import. Open a file first."] };

    try {
      const result = pendingColumnMapping
        ? importCsvWithMapping(store, pendingCsvImport, pendingColumnMapping, "local")
        : importCsv(store, pendingCsvImport, "local");
      store = result.store;
      saveStore(userDataPath, store);
      pendingCsvImport = null;
      pendingColumnMapping = null;
      pushStoreUpdate();
      return {
        success: true,
        imported: result.imported,
        updated: result.updated,
        skipped: result.skipped,
        errors: result.errors,
      };
    } catch (err) {
      return { success: false, errors: [String(err)] };
    }
  });

  // Stage a CSV file by path (used by drag-and-drop in the import screen).
  ipcMain.handle("stage-csv-file", (_e, filePath: string) => {
    try {
      const csvString = fs.readFileSync(filePath, "utf-8");
      pendingCsvImport = csvString;
      pendingColumnMapping = null;
      const preview = parseCsvPreview(csvString);
      return { success: true, ...preview };
    } catch (err) {
      pendingCsvImport = null;
      return { success: false, errors: [String(err)] };
    }
  });

  // Re-parse the staged CSV using the user-supplied column mapping.
  ipcMain.handle("preview-csv-with-mapping", (_e, mapping: ColumnMapping) => {
    if (!pendingCsvImport) return { success: false, errors: ["No staged file."] };
    try {
      pendingColumnMapping = mapping;
      const preview = parseCsvPreviewWithMapping(pendingCsvImport, mapping);
      return { success: true, ...preview };
    } catch (err) {
      return { success: false, errors: [String(err)] };
    }
  });

  // Single-step import — used by the tray menu path via IPC (kept for compatibility).
  ipcMain.handle("import-csv", async () => {
    const { filePaths } = await dialog.showOpenDialog(win!, {
      filters: [{ name: "CSV", extensions: ["csv"] }],
      properties: ["openFile"],
    });
    if (!filePaths[0]) return { success: false };

    try {
      const csvString = fs.readFileSync(filePaths[0], "utf-8");
      const result = importCsv(store, csvString, "local");
      store = result.store;
      saveStore(userDataPath, store);
      pushStoreUpdate();
      return {
        success: true,
        entries: store.entries,
        verticals: store.verticals,
        imported: result.imported,
        updated: result.updated,
        skipped: result.skipped,
        errors: result.errors,
      };
    } catch (err) {
      return { success: false, errors: [String(err)] };
    }
  });

  ipcMain.handle("export-csv", async () => {
    const { filePath } = await dialog.showSaveDialog(win!, {
      defaultPath: "shortpath-export.csv",
      filters: [{ name: "CSV", extensions: ["csv"] }],
    });
    if (!filePath) return { success: false };

    try {
      fs.writeFileSync(filePath, exportCsv(store.entries, store.verticals), "utf-8");
      return { success: true };
    } catch (err) {
      return { success: false, errors: [String(err)] };
    }
  });

  ipcMain.handle("export-mine", async () => {
    const { filePath } = await dialog.showSaveDialog(win!, {
      defaultPath: "shortpath-mine.csv",
      filters: [{ name: "CSV", extensions: ["csv"] }],
    });
    if (!filePath) return { success: false };

    try {
      const localEntries = store.entries.filter((e) => e.source === "local");
      fs.writeFileSync(filePath, exportCsv(localEntries, store.verticals), "utf-8");
      return { success: true };
    } catch (err) {
      return { success: false, errors: [String(err)] };
    }
  });

  ipcMain.handle("download-template-csv", async () => {
    const { filePath } = await dialog.showSaveDialog(win!, {
      defaultPath: "shortpath-template.csv",
      filters: [{ name: "CSV", extensions: ["csv"] }],
    });
    if (!filePath) return { success: false };

    try {
      fs.writeFileSync(filePath, CSV_TEMPLATE_CONTENT, "utf-8");
      return { success: true };
    } catch (err) {
      return { success: false, errors: [String(err)] };
    }
  });

  ipcMain.handle("read-clipboard", () => clipboard.readText());

  ipcMain.handle("open-external", (_e, url: string) => shell.openExternal(url));

  ipcMain.handle("hide-window", () => win?.hide());

  ipcMain.handle("get-settings", () => ({
    hotkey: settings.hotkey,
    fontSize: settings.fontSize ?? 13,
    theme: settings.theme ?? "dark",
    accentColor: settings.accentColor ?? null,
    opacity: settings.opacity ?? 100,
    windowSize: settings.windowSize ?? null,
    density: settings.density ?? "comfortable",
    verticalOrder: settings.verticalOrder ?? [],
    autoHideOnCopy: settings.autoHideOnCopy ?? false,
  }));

  ipcMain.handle("toggle-favorite", (_e, entryId: string) => {
    store = toggleFavorite(store, entryId);
    saveStore(userDataPath, store);
    pushStoreUpdate();
  });

  ipcMain.handle("set-font-size", (_e, size: number) => {
    settings = { ...settings, fontSize: size };
    saveSettings(userDataPath, settings);
  });

  ipcMain.handle("set-theme", (_e, theme: "dark" | "light") => {
    settings = { ...settings, theme };
    saveSettings(userDataPath, settings);
  });

  ipcMain.handle("set-accent", (_e, color: string) => {
    settings = { ...settings, accentColor: color };
    saveSettings(userDataPath, settings);
  });

  ipcMain.handle("set-opacity", (_e, value: number) => {
    const clamped = Math.max(70, Math.min(100, value));
    win?.setOpacity(clamped / 100);
    settings = { ...settings, opacity: clamped };
    saveSettings(userDataPath, settings);
  });

  ipcMain.handle("set-window-size", (_e, size: "small" | "medium" | "large") => {
    const dims = SIZE_PRESETS[size];
    if (!dims || !win) return;
    win.setSize(dims.width, dims.height);
    settings = { ...settings, windowSize: size };
    saveSettings(userDataPath, settings);
  });

  ipcMain.handle("set-density", (_e, density: "compact" | "comfortable") => {
    settings = { ...settings, density };
    saveSettings(userDataPath, settings);
  });

  ipcMain.handle("set-vertical-order", (_e, order: string[]) => {
    settings = { ...settings, verticalOrder: order };
    saveSettings(userDataPath, settings);
  });

  ipcMain.handle("set-auto-hide-on-copy", (_e, value: boolean) => {
    settings = { ...settings, autoHideOnCopy: value };
    saveSettings(userDataPath, settings);
  });

  ipcMain.handle("toggle-pin", (_e, entryId: string) => {
    const alreadyPinned = store.pinned.includes(entryId);
    if (!alreadyPinned && store.pinned.length >= 8) {
      return { ok: false, limitReached: true };
    }
    store = togglePin(store, entryId);
    saveStore(userDataPath, store);
    pushStoreUpdate();
    return { ok: true, pinned: store.pinned.includes(entryId) };
  });

  ipcMain.handle("increment-copy-count", (_e, entryId: string) => {
    store = incrementCopyCount(store, entryId);
    saveStore(userDataPath, store);
    pushStoreUpdate();
  });

  ipcMain.handle("minimize-window", () => win?.minimize());

  ipcMain.handle("rename-vertical", (_e, id: string, newLabel: string) => {
    store = renameVertical(store, id, newLabel);
    saveStore(userDataPath, store);
    pushStoreUpdate();
  });

  ipcMain.handle("save-source-mode", (_e, mode: "local" | "sync", name?: string) => {
    settings = { ...settings, sourceMode: mode, sourceName: name };
    saveSettings(userDataPath, settings);
  });

  ipcMain.handle("disconnect-sync", () => {
    stopSyncWatcher();
    store = replaceSyncedEntries(store, []);
    saveStore(userDataPath, store);
    settings = { ...settings, syncPath: undefined };
    saveSettings(userDataPath, settings);
    lastRefreshed = null;
    pushStoreUpdate();
    win?.webContents.send("sync-refreshed");
  });

  ipcMain.handle("change-hotkey", (_e, accelerator: string) => {
    const ok = registerHotkey(accelerator);
    if (ok) {
      settings = { ...settings, hotkey: accelerator };
      saveSettings(userDataPath, settings);
    }
    return { ok };
  });

  ipcMain.handle("reset-window-position", () => {
    if (!win) return;
    const pos = getBottomLeftPosition();
    win.setSize(WINDOW_WIDTH, WINDOW_HEIGHT);
    win.setPosition(pos.x, pos.y);
    settings = { ...settings, windowBounds: { ...pos, width: WINDOW_WIDTH, height: WINDOW_HEIGHT } };
    saveSettings(userDataPath, settings);
  });

  ipcMain.handle("configure-sync", async () => {
    const { filePaths } = await dialog.showOpenDialog({
      title: "Select shared sync file",
      filters: [{ name: "CSV", extensions: ["csv"] }],
      properties: ["openFile"],
    });
    if (!filePaths[0]) return { success: false };

    const filePath = filePaths[0];
    settings = { ...settings, syncPath: filePath };
    saveSettings(userDataPath, settings);

    const result = loadSyncedFile(filePath);
    startSyncWatcher(filePath);
    return { success: true, syncPath: filePath, errors: result.errors };
  });

  ipcMain.handle("refresh-synced", () => {
    if (!settings.syncPath) return { success: false, errors: ["No sync file configured."] };
    const result = loadSyncedFile(settings.syncPath);
    return { success: result.ok, errors: result.errors };
  });

  ipcMain.handle("clear-synced", () => {
    store = replaceSyncedEntries(store, []);
    saveStore(userDataPath, store);
    lastRefreshed = null;
    pushStoreUpdate();
  });

  ipcMain.handle("get-sync-status", () => ({
    syncPath: settings.syncPath ?? null,
    syncedCount: store.entries.filter((e) => e.source === "synced").length,
    lastRefreshed,
  }));

  ipcMain.handle("ping", () => "pong");

  ipcMain.handle("notes:load", () => notesData.notes);

  ipcMain.handle("add-vertical", (_e, label: string) => {
    const result = addVertical(store, label);
    store = result.store;
    saveStore(userDataPath, store);
    return result.vertical;
  });

  ipcMain.handle("clear-local-entries", () => {
    store = clearLocalEntries(store);
    saveStore(userDataPath, store);
    pushStoreUpdate();
  });

  ipcMain.handle("add-subfolder", (_e, verticalId: string, label: string, parentSubFolderId?: string) => {
    const result = addSubFolder(store, verticalId, label, parentSubFolderId);
    store = result.store;
    saveStore(userDataPath, store);
    pushStoreUpdate();
    return result.subFolder;
  });

  ipcMain.handle("delete-vertical", (_e, verticalId: string) => {
    store = deleteVertical(store, verticalId);
    saveStore(userDataPath, store);
    if (settings.verticalOrder?.includes(verticalId)) {
      settings.verticalOrder = settings.verticalOrder.filter((id) => id !== verticalId);
      saveSettings(userDataPath, settings);
    }
    pushStoreUpdate();
  });

  ipcMain.handle("rename-subfolder", (_e, verticalId: string, subFolderId: string, newLabel: string) => {
    store = renameSubFolder(store, verticalId, subFolderId, newLabel);
    saveStore(userDataPath, store);
    pushStoreUpdate();
  });

  ipcMain.handle("remove-subfolder", (_e, verticalId: string, subFolderId: string) => {
    store = removeSubFolder(store, verticalId, subFolderId);
    saveStore(userDataPath, store);
    pushStoreUpdate();
  });

  ipcMain.handle("notes:create", (_e, fields: { title?: string; body: string; entryId?: string; entryTitle?: string }) => {
    const result = storeCreateNote(notesData, fields);
    notesData = result.data;
    saveNotes(userDataPath, notesData);
    return result.note;
  });

  ipcMain.handle("notes:update", (_e, id: string, updates: { title?: string; body: string }) => {
    const result = storeUpdateNote(notesData, id, updates);
    notesData = result.data;
    saveNotes(userDataPath, notesData);
    return result.note;
  });

  ipcMain.handle("notes:delete", (_e, id: string) => {
    notesData = storeDeleteNote(notesData, id);
    saveNotes(userDataPath, notesData);
  });

  ipcMain.handle("check-for-updates", async () => {
    if (!app.isPackaged) return null;
    try {
      const result = await autoUpdater.checkForUpdates();
      if (!result?.updateInfo) return null;
      const { version } = result.updateInfo;
      if (version === app.getVersion()) return null;
      return { version, url: `https://github.com/Dadpops/ShortPath/releases/tag/v${version}` };
    } catch {
      return null;
    }
  });

  ipcMain.handle("download-update", () => { autoUpdater.downloadUpdate().catch(console.error); });
  ipcMain.handle("install-update", () => { autoUpdater.quitAndInstall(); });
}

app.whenReady().then(() => {
  userDataPath = app.getPath("userData");
  store = openStore(userDataPath);
  settings = loadSettings(userDataPath);
  notesData = openNotes(userDataPath);

  if (store.entries.length === 0) {
    store = applySeed(store);
    saveStore(userDataPath, store);
  }

  registerIpcHandlers();
  createTray();
  createWindow();
  registerHotkey(settings.hotkey);

  // Resume file-watch sync if a path was previously configured.
  if (settings.syncPath && fs.existsSync(settings.syncPath)) {
    loadSyncedFile(settings.syncPath);
    startSyncWatcher(settings.syncPath);
  }

  // Auto-check for updates after renderer has had time to load (packaged builds only).
  if (app.isPackaged) {
    setTimeout(() => { autoUpdater.checkForUpdates().catch(console.error); }, 5000);
  }
});

let currentHotkey: string | null = null;

function registerHotkey(accelerator: string): boolean {
  if (currentHotkey) {
    globalShortcut.unregister(currentHotkey);
    currentHotkey = null;
  }
  const ok = globalShortcut.register(accelerator, toggleWindow);
  if (ok) {
    currentHotkey = accelerator;
  } else {
    win?.webContents.send("hotkey-failed", accelerator);
  }
  return ok;
}

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
  stopSyncWatcher();
});

// Keep the app running when all windows are closed (tray app behavior).
app.on("window-all-closed", () => {
  // intentionally empty
});
