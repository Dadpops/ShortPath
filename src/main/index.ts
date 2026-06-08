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
} from "electron";
import path from "path";
import fs from "fs";
import { openStore, saveStore, addEntry, updateEntry, deleteEntry, recordAccess } from "../store/index";
import { applySeed } from "../store/seed";
import { importCsv, exportCsv } from "../store/csv";
import type { StoreData } from "../store/schema";
import type { Entry } from "../shared/types";

const WINDOW_WIDTH = 480;
const WINDOW_HEIGHT = 600;
const MARGIN = 12;

let tray: Tray | null = null;
let win: BrowserWindow | null = null;
let store: StoreData;
let userDataPath: string;

function getBottomLeftPosition() {
  const display = screen.getPrimaryDisplay();
  const { x, y, height } = display.workArea;
  return {
    x: x + MARGIN,
    y: y + height - WINDOW_HEIGHT - MARGIN,
  };
}

function createWindow() {
  const pos = getBottomLeftPosition();

  win = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    x: pos.x,
    y: pos.y,
    resizable: true,
    frame: false,
    transparent: false,
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
  });

  win.on("closed", () => {
    win = null;
  });
}

function createTray() {
  const icon = nativeImage.createFromPath(
    path.join(app.getAppPath(), "icons/png/tray-32.png")
  );
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    { label: "Show ShortPath", click: toggleWindow },
    { type: "separator" },
    { label: "Import CSV", click: handleImportFromTray },
    { label: "Export CSV", click: handleExportFromTray },
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
  } else {
    const pos = getBottomLeftPosition();
    win.setPosition(pos.x, pos.y);
    win.show();
    win.focus();
  }
}

async function handleImportFromTray() {
  const { filePaths } = await dialog.showOpenDialog({
    filters: [{ name: "CSV", extensions: ["csv"] }],
    properties: ["openFile"],
  });
  if (!filePaths[0]) return;

  try {
    const csvString = fs.readFileSync(filePaths[0], "utf-8");
    const result = importCsv(store, csvString);
    store = result.store;
    saveStore(userDataPath, store);
    win?.webContents.send("store-updated", { entries: store.entries, verticals: store.verticals, recents: store.recents });
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
    fs.writeFileSync(filePath, exportCsv(store.entries), "utf-8");
  } catch (err) {
    console.error("CSV export failed:", err);
  }
}

function registerIpcHandlers() {
  ipcMain.handle("load-entries", () => ({
    entries: store.entries,
    verticals: store.verticals,
    recents: store.recents,
  }));

  ipcMain.handle(
    "create-entry",
    (_e, fields: Omit<Entry, "id" | "createdAt" | "updatedAt">, verticalLabel?: string) => {
      const result = addEntry(store, fields, verticalLabel);
      store = result.store;
      saveStore(userDataPath, store);
      return { entry: result.entry, verticals: store.verticals };
    }
  );

  ipcMain.handle("record-access", (_e, entryId: string) => {
    store = recordAccess(store, entryId);
    saveStore(userDataPath, store);
  });

  ipcMain.handle("update-entry", (_e, id: string, updates: Partial<Entry>) => {
    const result = updateEntry(store, id, updates);
    store = result.store;
    saveStore(userDataPath, store);
    return result.entry;
  });

  ipcMain.handle("delete-entry", (_e, id: string) => {
    store = deleteEntry(store, id);
    saveStore(userDataPath, store);
  });

  ipcMain.handle("import-csv", async () => {
    const { filePaths } = await dialog.showOpenDialog(win!, {
      filters: [{ name: "CSV", extensions: ["csv"] }],
      properties: ["openFile"],
    });
    if (!filePaths[0]) return { success: false };

    try {
      const csvString = fs.readFileSync(filePaths[0], "utf-8");
      const result = importCsv(store, csvString);
      store = result.store;
      saveStore(userDataPath, store);
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
      fs.writeFileSync(filePath, exportCsv(store.entries), "utf-8");
      return { success: true };
    } catch (err) {
      return { success: false, errors: [String(err)] };
    }
  });

  ipcMain.handle("ping", () => "pong");
}

// Phase 4: replace this default with a user-configurable hotkey stored in settings.
const DEFAULT_HOTKEY = "CommandOrControl+Shift+Space";

app.whenReady().then(() => {
  userDataPath = app.getPath("userData");
  store = openStore(userDataPath);

  if (store.entries.length === 0) {
    store = applySeed(store);
    saveStore(userDataPath, store);
  }

  registerIpcHandlers();
  createTray();
  createWindow();
  registerHotkey(DEFAULT_HOTKEY);
});

function registerHotkey(accelerator: string) {
  // Stub: full implementation in Phase 4 (unregister-before-reregister, conflict detection).
  globalShortcut.register(accelerator, toggleWindow);
}

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

// Keep the app running when all windows are closed (tray app behavior).
// Simply attaching a listener without calling app.quit() is enough.
app.on("window-all-closed", () => {
  // intentionally empty
});
